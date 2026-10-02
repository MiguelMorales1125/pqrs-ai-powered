#!/usr/bin/env bash
# Provisions the whole stack on Azure and deploys both microservices.
#
#   Azure Container Registry      -> stores the Docker images
#   Azure Database for PostgreSQL -> Flexible Server (B1ms) with auth_db + pqrs_db
#   Azure Container Apps          -> auth-service + pqrs-service (with a Redis sidecar for BullMQ)
#
# Usage (Git Bash / Linux / macOS, from the repo root):
#   cp deploy/azure/config.env.example deploy/azure/config.env   # then fill it in
#   az login
#   bash deploy/azure/deploy.sh
#
# Safe to re-run: existing resources are reused and the apps get the new images.
set -euo pipefail
export MSYS_NO_PATHCONV=1 # stop Git Bash from mangling /subscriptions/... ids

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONFIG="$SCRIPT_DIR/config.env"

log() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
az_tsv() { az "$@" -o tsv | tr -d '\r'; } # Windows az adds CR to output
die() { printf '\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

command -v az >/dev/null || die "Azure CLI not found. Install it: https://aka.ms/installazurecli"
command -v docker >/dev/null || die "Docker not found."
docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop."
az account show >/dev/null 2>&1 || die "Not logged in. Run: az login"
[ -f "$CONFIG" ] || die "Missing $CONFIG (copy config.env.example and fill it in)"

# shellcheck disable=SC1090
set -a; source "$CONFIG"; set +a
[ -n "${GROQ_API_KEY:-}" ] || die "GROQ_API_KEY is empty in config.env"
[ -n "${ADMIN_PASSWORD:-}" ] || die "ADMIN_PASSWORD is empty in config.env"

# Generate missing values once and persist them so re-runs stay consistent
persist() {
    local key=$1 value=$2
    if grep -q "^$key=" "$CONFIG"; then
        sed -i.bak "s|^$key=.*|$key=$value|" "$CONFIG" && rm -f "$CONFIG.bak"
    else
        echo "$key=$value" >> "$CONFIG"
    fi
    export "$key=$value"
}
[ -n "${SUFFIX:-}" ] || persist SUFFIX "$(openssl rand -hex 3)"
[ -n "${JWT_SECRET:-}" ] || persist JWT_SECRET "$(openssl rand -hex 32)"
[ -n "${PG_ADMIN_PASSWORD:-}" ] || persist PG_ADMIN_PASSWORD "Pg$(openssl rand -hex 16)"
PG_ADMIN_USER=${PG_ADMIN_USER:-pgadmin}

ACR_NAME="${PREFIX}acr${SUFFIX}"
PG_SERVER="${PREFIX}-pg-${SUFFIX}"
ENV_NAME="${PREFIX}-env"
AUTH_APP="auth-service"
PQRS_APP="pqrs-service"
TAG="$(git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || date +%s)-$(date +%s)"

log "Subscription: $(az_tsv account show --query name)"
log "Registering resource providers (first time can take a few minutes)"
for ns in Microsoft.App Microsoft.OperationalInsights Microsoft.ContainerRegistry Microsoft.DBforPostgreSQL; do
    az provider register --namespace "$ns" --wait >/dev/null
done
az extension add --name containerapp --upgrade --only-show-errors >/dev/null

log "Resource group $RESOURCE_GROUP ($LOCATION)"
az group create -n "$RESOURCE_GROUP" -l "$LOCATION" -o none

# ---------------------------------------------------------------- Registry
log "Container Registry $ACR_NAME"
if ! az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" -o none 2>/dev/null; then
    az acr create -n "$ACR_NAME" -g "$RESOURCE_GROUP" --sku Basic --admin-enabled true -o none
fi
ACR_SERVER=$(az_tsv acr show -n "$ACR_NAME" --query loginServer)
ACR_USER=$(az_tsv acr credential show -n "$ACR_NAME" --query username)
ACR_PASS=$(az_tsv acr credential show -n "$ACR_NAME" --query 'passwords[0].value')

log "Building and pushing images (tag $TAG)"
echo "$ACR_PASS" | docker login "$ACR_SERVER" -u "$ACR_USER" --password-stdin >/dev/null
for svc in "$AUTH_APP" "$PQRS_APP"; do
    docker build --platform linux/amd64 -t "$ACR_SERVER/$svc:$TAG" "$ROOT_DIR/services/$svc"
    docker push "$ACR_SERVER/$svc:$TAG"
done
# Mirror Redis into ACR to avoid Docker Hub rate limits
az acr import -n "$ACR_NAME" --source docker.io/library/redis:7-alpine --image redis:7-alpine --force -o none

# ---------------------------------------------------------------- PostgreSQL
log "PostgreSQL Flexible Server $PG_SERVER (takes ~5-10 min the first time)"
if ! az postgres flexible-server show -n "$PG_SERVER" -g "$RESOURCE_GROUP" -o none 2>/dev/null; then
    # --public-access 0.0.0.0 => only Azure services (Container Apps) can connect
    az postgres flexible-server create -n "$PG_SERVER" -g "$RESOURCE_GROUP" -l "$LOCATION" \
        --tier Burstable --sku-name Standard_B1ms --storage-size 32 --version 16 \
        --admin-user "$PG_ADMIN_USER" --admin-password "$PG_ADMIN_PASSWORD" \
        --public-access 0.0.0.0 --yes -o none
fi
for db in auth_db pqrs_db; do
    az postgres flexible-server db show -s "$PG_SERVER" -g "$RESOURCE_GROUP" -d "$db" -o none 2>/dev/null \
        || az postgres flexible-server db create -s "$PG_SERVER" -g "$RESOURCE_GROUP" -d "$db" -o none
done
PG_HOST=$(az_tsv postgres flexible-server show -n "$PG_SERVER" -g "$RESOURCE_GROUP" --query fullyQualifiedDomainName)
AUTH_DB_URL="postgresql://$PG_ADMIN_USER:$PG_ADMIN_PASSWORD@$PG_HOST:5432/auth_db?sslmode=require"
PQRS_DB_URL="postgresql://$PG_ADMIN_USER:$PG_ADMIN_PASSWORD@$PG_HOST:5432/pqrs_db?sslmode=require"

# ---------------------------------------------------------------- Container Apps
log "Container Apps environment $ENV_NAME"
if ! az containerapp env show -n "$ENV_NAME" -g "$RESOURCE_GROUP" -o none 2>/dev/null; then
    az containerapp env create -n "$ENV_NAME" -g "$RESOURCE_GROUP" -l "$LOCATION" -o none
fi
ENV_ID=$(az_tsv containerapp env show -n "$ENV_NAME" -g "$RESOURCE_GROUP" --query id)

log "Deploying $AUTH_APP"
if ! az containerapp show -n "$AUTH_APP" -g "$RESOURCE_GROUP" -o none 2>/dev/null; then
    az containerapp create -n "$AUTH_APP" -g "$RESOURCE_GROUP" --environment "$ENV_NAME" \
        --image "$ACR_SERVER/$AUTH_APP:$TAG" \
        --registry-server "$ACR_SERVER" --registry-username "$ACR_USER" --registry-password "$ACR_PASS" \
        --ingress external --target-port 8001 \
        --cpu 0.25 --memory 0.5Gi --min-replicas 0 --max-replicas 2 \
        --secrets "database-url=$AUTH_DB_URL" "jwt-secret=$JWT_SECRET" \
        --env-vars DATABASE_URL=secretref:database-url JWT_SECRET=secretref:jwt-secret \
            PORT=8001 HOST=0.0.0.0 JWT_ALGORITHM=HS256 ACCESS_TOKEN_EXPIRE_MINUTES=60 \
        -o none
else
    az containerapp secret set -n "$AUTH_APP" -g "$RESOURCE_GROUP" \
        --secrets "database-url=$AUTH_DB_URL" "jwt-secret=$JWT_SECRET" -o none
    az containerapp update -n "$AUTH_APP" -g "$RESOURCE_GROUP" --image "$ACR_SERVER/$AUTH_APP:$TAG" -o none
fi

log "Deploying $PQRS_APP (+ Redis sidecar)"
# Multi-container apps need YAML. Redis runs next to the API on localhost:6379;
# the queue is in-memory, so keep exactly one replica.
PQRS_YAML="$(mktemp)"
trap 'rm -f "$PQRS_YAML"' EXIT
cat > "$PQRS_YAML" <<EOF
location: $LOCATION
properties:
  managedEnvironmentId: $ENV_ID
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 8002
      transport: auto
    registries:
      - server: $ACR_SERVER
        username: $ACR_USER
        passwordSecretRef: acr-password
    secrets:
      - name: acr-password
        value: "$ACR_PASS"
      - name: database-url
        value: "$PQRS_DB_URL"
      - name: jwt-secret
        value: "$JWT_SECRET"
      - name: groq-api-key
        value: "$GROQ_API_KEY"
  template:
    containers:
      - name: $PQRS_APP
        image: $ACR_SERVER/$PQRS_APP:$TAG
        resources: { cpu: 0.5, memory: 1Gi }
        env:
          - { name: PORT, value: "8002" }
          - { name: DATABASE_URL, secretRef: database-url }
          - { name: JWT_SECRET, secretRef: jwt-secret }
          - { name: JWT_ALGORITHM, value: "HS256" }
          - { name: GROQ_API_KEY, secretRef: groq-api-key }
          - { name: REDIS_HOST, value: "localhost" }
          - { name: REDIS_PORT, value: "6379" }
          - { name: COMPANY_CATEGORIES, value: "PETITION,COMPLAINT,CLAIM,SUGGESTION" }
          - { name: COMPANY_PRIORITIES, value: "LOW,MEDIUM,HIGH,CRITICAL" }
          - { name: COMPANY_DEPARTMENTS, value: "Technical Support,Billing,Customer Care,Legal,Logistics,Network Operations" }
      - name: redis
        image: $ACR_SERVER/redis:7-alpine
        command: ["redis-server", "--save", "", "--appendonly", "no"]
        resources: { cpu: 0.25, memory: 0.5Gi }
    scale:
      minReplicas: 1
      maxReplicas: 1
EOF
if ! az containerapp show -n "$PQRS_APP" -g "$RESOURCE_GROUP" -o none 2>/dev/null; then
    az containerapp create -n "$PQRS_APP" -g "$RESOURCE_GROUP" --yaml "$PQRS_YAML" -o none
else
    az containerapp update -n "$PQRS_APP" -g "$RESOURCE_GROUP" --yaml "$PQRS_YAML" -o none
fi

# ---------------------------------------------------------------- Admin seed
log "Seeding admin user ($ADMIN_EMAIL)"
MY_IP=$(curl -fsS https://api.ipify.org || true)
if [ -n "$MY_IP" ] && [ -d "$ROOT_DIR/services/auth-service/node_modules" ]; then
    # Temporarily open the DB firewall to this machine
    az postgres flexible-server firewall-rule create -n "$PG_SERVER" -g "$RESOURCE_GROUP" \
        --rule-name seed-client --start-ip-address "$MY_IP" --end-ip-address "$MY_IP" -o none
    # Make sure the users table exists even if auth-service has not booted yet (it scales to zero)
    (cd "$ROOT_DIR/services/auth-service" &&
        DATABASE_URL="$AUTH_DB_URL" npx prisma migrate deploy &&
        DATABASE_URL="$AUTH_DB_URL" ADMIN_EMAIL="$ADMIN_EMAIL" ADMIN_PASSWORD="$ADMIN_PASSWORD" npm run seed) \
        || echo "WARNING: seeding failed; re-run the script or seed manually (see deploy/azure/README.md)"
    az postgres flexible-server firewall-rule delete -n "$PG_SERVER" -g "$RESOURCE_GROUP" \
        --rule-name seed-client --yes -o none
else
    echo "Skipped: run 'npm ci' in services/auth-service and re-run to seed the admin user."
fi

# ---------------------------------------------------------------- Output
AUTH_FQDN=$(az_tsv containerapp show -n "$AUTH_APP" -g "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn)
PQRS_FQDN=$(az_tsv containerapp show -n "$PQRS_APP" -g "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn)
log "Done!"
cat <<EOF
  Auth service : https://$AUTH_FQDN/health
                 https://$AUTH_FQDN/api/v1
  PQRS service : https://$PQRS_FQDN/api/v1/tickets
  Swagger      : https://$PQRS_FQDN/docs

  Logs: az containerapp logs show -n $PQRS_APP -g $RESOURCE_GROUP --container $PQRS_APP --follow
  Delete everything: az group delete -n $RESOURCE_GROUP --yes --no-wait
EOF
