# Despliegue en Azure

```text
                     Internet (HTTPS)
                 ┌──────────┴───────────┐
                 ▼                      ▼
   ┌──────────────────────┐  ┌───────────────────────────────┐
   │ Container App        │  │ Container App                 │
   │ auth-service :8001   │  │ pqrs-service :8002            │
   │ (0–2 réplicas)       │  │  + sidecar redis (localhost)  │
   └──────────┬───────────┘  └───────────┬───────────┬───────┘
              │                          │           │
              ▼                          ▼           ▼
   ┌───────────────────────────────────────┐   Groq API
   │ PostgreSQL Flexible Server (B1ms)     │
   │   auth_db        pqrs_db              │
   └───────────────────────────────────────┘
   Imágenes en Azure Container Registry (Basic)
```

| Recurso | SKU | Por qué |
|---|---|---|
| Azure Container Apps | Consumo | Un contenedor por microservicio, HTTPS gratis, escala a cero |
| Azure Database for PostgreSQL | Flexible Server, Burstable B1ms | Postgres administrado; la opción más barata. Database-per-service (`auth_db`, `pqrs_db`) |
| Redis | Contenedor *sidecar* dentro de `pqrs-service` | BullMQ solo lo usa pqrs-service; evita pagar un Redis administrado |
| Azure Container Registry | Basic | Guarda las imágenes Docker |

Las migraciones de Prisma se aplican solas al arrancar cada contenedor (`prisma migrate deploy`).

## Requisitos (una sola vez)

1. Suscripción de Azure (sirve **Azure for Students**: <https://azure.microsoft.com/free/students>).
2. [Azure CLI](https://aka.ms/installazurecli) → en PowerShell: `winget install Microsoft.AzureCLI`
3. Docker Desktop **abierto**.
4. Git Bash (viene con Git for Windows).
5. Una API key de Groq: <https://console.groq.com/keys>
6. `npm ci` dentro de `services/auth-service` (el script lo usa para crear el usuario admin).

## Desplegar

Desde la raíz del repo, en **Git Bash**:

```bash
az login
cp deploy/azure/config.env.example deploy/azure/config.env
# edita deploy/azure/config.env: GROQ_API_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
bash deploy/azure/deploy.sh
```

La primera vez tarda ~15 min (la base de datos es lo más lento). Al terminar imprime las URLs:

```text
Auth service : https://auth-service.<algo>.azurecontainerapps.io/health
PQRS service : https://pqrs-service.<algo>.azurecontainerapps.io/api/v1/tickets
Swagger      : https://pqrs-service.<algo>.azurecontainerapps.io/docs
```

> `config.env` queda con secretos generados (contraseña de Postgres, `JWT_SECRET`). **No lo borres ni lo subas a git** (ya está en `.gitignore`); el script lo reutiliza en cada ejecución.

## Actualizar después de cambiar código

Vuelve a correr el mismo comando. Reutiliza todo lo que ya existe, construye imágenes nuevas y hace rollout:

```bash
bash deploy/azure/deploy.sh
```

## Probar las imágenes en local antes de subir

```bash
docker compose --profile app up --build
```

Levanta Postgres, Redis y ambos servicios con las mismas imágenes que van a Azure (auth en `:8001`, pqrs en `:8002`).

## Operación

```bash
# Logs en vivo
az containerapp logs show -n pqrs-service -g rg-telematics-pqrs --container pqrs-service --follow
az containerapp logs show -n auth-service -g rg-telematics-pqrs --follow

# Apagar la BD cuando no la uses (ahorra crédito; se puede encender con "start")
az postgres flexible-server stop  -g rg-telematics-pqrs -n <PREFIX>-pg-<SUFFIX>
az postgres flexible-server start -g rg-telematics-pqrs -n <PREFIX>-pg-<SUFFIX>

# Borrar TODO al terminar el curso
az group delete -n rg-telematics-pqrs --yes --no-wait
```

## Costos aproximados

| Recurso | USD/mes aprox. |
|---|---|
| PostgreSQL B1ms + 32 GB | ~15 (0 si está detenida, solo el disco) |
| Container Registry Basic | ~5 |
| Container Apps | ~0–15 (auth escala a cero; pqrs queda con 1 réplica porque procesa la cola) |

Con los 100 USD de Azure for Students alcanza para el semestre. Borra el resource group al final.

## Problemas comunes

| Error | Solución |
|---|---|
| `RequestDisallowedByAzure` / región no permitida | Cambia `LOCATION` en `config.env` (`eastus`, `centralus`, `westus2`, `brazilsouth`…). Si ya creaste recursos, borra el resource group y vuelve a correr. |
| `Docker is not running` | Abre Docker Desktop y espera a que diga *Engine running*. |
| El servicio responde 404/timeout la primera vez | `auth-service` escala a cero: la primera petición tarda ~10–20 s en despertar. |
| Tickets quedan en `PENDING` | Revisa `GROQ_API_KEY` y los logs de `pqrs-service`. |
| Falló el seed del admin | Verifica que corriste `npm ci` en `services/auth-service` y vuelve a correr el script. |

## Limitaciones conocidas (y cómo mejorarlas)

- **La cola de Redis es en memoria**: si el contenedor se reinicia se pierden los trabajos que estuvieran *esperando* (los tickets quedan en BD como `PENDING`). Para producción real, crea un *Azure Managed Redis* y configura en `pqrs-service` `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` y `REDIS_TLS=true` (el código ya lo soporta), quita el sidecar y sube `maxReplicas`.
- Los secretos viven como *secrets* de Container Apps; para más rigor, muévelos a Azure Key Vault.
- El frontend todavía no existe; cuando esté listo, se recomienda **Azure Static Web Apps** apuntando a las URLs de arriba.
