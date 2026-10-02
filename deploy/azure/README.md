# Azure deployment

This directory contains the configuration and deployment script for the Auth Service and
the PQRS Service.

## Azure resources

| Component | Azure resource | Purpose |
|---|---|---|
| Auth Service | Azure Container Apps | Public authentication API |
| PQRS Service | Azure Container Apps | Public ticket API and triage worker |
| Container images | Azure Container Registry Basic | Stores service images |
| Database | Azure Database for PostgreSQL Flexible Server | Hosts `auth_db` and `pqrs_db` |
| Queue backend | Redis sidecar in the PQRS Container App | BullMQ queue for the MVP |
| Frontend | Azure Static Web Apps | Hosts the React application |

The two services use separate PostgreSQL databases on the same server. They do not access
each other's tables.

The PQRS Container App uses one Redis sidecar and one replica because the current queue is
not configured for durable managed Redis. This is acceptable for the MVP, but queued work
can be lost if the container is recreated. A managed Azure Redis resource should replace
the sidecar for a production deployment.

## Prerequisites

Install and configure:

1. An Azure subscription, including Azure for Students.
2. Azure CLI.
3. Docker Desktop.
4. Git Bash on Windows, or Bash on Linux/macOS.
5. A Groq API key.
6. Node.js and npm if the admin seed must run locally.

Authenticate with Azure:

```bash
az login
```

## First deployment

From the repository root:

```bash
cp deploy/azure/config.env.example deploy/azure/config.env
```

Edit `deploy/azure/config.env` and provide:

- `GROQ_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

The script generates and persists `SUFFIX`, `JWT_SECRET`, and PostgreSQL credentials.
Never commit `config.env`.

Run the deployment:

```bash
bash deploy/azure/deploy.sh
```

The script:

1. Creates or reuses the resource group.
2. Creates an Azure Container Registry.
3. Builds and pushes both Docker images.
4. Creates the PostgreSQL Flexible Server and both databases.
5. Creates the Container Apps environment.
6. Deploys the Auth Service.
7. Deploys the PQRS Service with its Redis sidecar.
8. Applies Prisma migrations during container startup.
9. Attempts to seed the initial administrator.

The script prints the service URLs when deployment finishes.

## Local container validation

Build and run the same service images locally:

```bash
docker compose --profile app up --build
```

This starts PostgreSQL, Redis, Auth Service, and PQRS Service. Define `GROQ_API_KEY` in
the shell if AI triage should run:

```bash
export GROQ_API_KEY=your_key
```

## Updating an existing deployment

Run the same command after code changes:

```bash
bash deploy/azure/deploy.sh
```

The script reuses existing resources and deploys new image tags.

## Operations

View logs:

```bash
az containerapp logs show -n pqrs-service -g rg-telematics-pqrs --container pqrs-service --follow
az containerapp logs show -n auth-service -g rg-telematics-pqrs --follow
```

Stop the PostgreSQL server when it is not needed:

```bash
az postgres flexible-server stop -g rg-telematics-pqrs -n <postgres-server-name>
az postgres flexible-server start -g rg-telematics-pqrs -n <postgres-server-name>
```

Delete all resources when the project is finished:

```bash
az group delete -n rg-telematics-pqrs --yes --no-wait
```

## Troubleshooting

- If Azure rejects the selected region, change `LOCATION` in `config.env`.
- If Docker commands fail, start Docker Desktop and wait for the engine to become ready.
- The first request to a service with zero replicas may take several seconds while it starts.
- If triage remains pending, check `GROQ_API_KEY` and the PQRS logs.
- If admin seeding fails, install Auth Service dependencies with `npm ci` and rerun the script.
