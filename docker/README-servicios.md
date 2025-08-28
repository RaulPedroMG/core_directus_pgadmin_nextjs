# 🚀 ShipFree - Servicios de Desarrollo

Este documento describe todos los servicios que se ejecutan en el entorno de desarrollo de ShipFree usando Docker Compose.

## 📋 Servicios Disponibles

### 🌐 Aplicación Principal (Next.js)
- **Puerto**: `3070`
- **URL**: http://localhost:3070
- **Versión**: Next.js 15.5.2 con React 19.1.0
- **Características**:
  - Turbopack habilitado para desarrollo rápido
  - Hot reload automático
  - TypeScript configurado
  - Tailwind CSS
  - Drizzle ORM para base de datos

### 🗄️ PostgreSQL
- **Puerto**: `5470`
- **Versión**: 17.6-alpine
- **Conexión**: 
  - Host: `localhost:5470`
  - Usuario: `devuser`
  - Contraseña: `devpass`
  - Base de datos principal: `shipfreedev`
  - Base de datos Directus: `directus_db`
- **Características**:
  - Health checks configurados
  - Volúmenes persistentes
  - Configurado para desarrollo

### 🎛️ Directus CMS
- **Puerto**: `8070`
- **URL**: http://localhost:8070
- **Versión**: 11.9.0
- **Credenciales de administrador**:
  - Email: `admin@shipfree.dev`
  - Contraseña: `AdminPassword123!`
- **Características**:
  - GraphQL habilitado
  - WebSockets habilitados
  - Extensiones auto-reload
  - Cache en memoria habilitado
  - CORS configurado para desarrollo
  - Rate limiting activado

### 🛠️ pgAdmin
- **Puerto**: `5070`
- **URL**: http://localhost:5070
- **Credenciales**:
  - Email: `admin@example.com`
  - Contraseña: `admin`
- **Características**:
  - Interfaz web para administrar PostgreSQL
  - Conexión preconfigurada a las bases de datos

### 📊 Portainer
- **Puerto**: `9070`
- **URL**: http://localhost:9070
- **Características**:
  - Gestión visual de contenedores Docker
  - Monitoreo de recursos
  - Logs en tiempo real
  - Administración de volúmenes y redes

## 🚀 Comandos de Inicio

### Levantar todos los servicios
```bash
docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml up --build -d
```

### Levantar solo servicios básicos (sin Directus)
```bash
docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml up --build -d
```

### Ver estado de los servicios
```bash
docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml ps
```

### Ver logs de un servicio específico
```bash
# Logs de la aplicación Next.js
docker logs shipfree_dev-app-1

# Logs de Directus
docker logs directus_shipfree

# Logs de PostgreSQL
docker logs shipfree_dev-postgres-1
```

### Parar todos los servicios
```bash
docker compose -f docker/shipfree_dev/docker-compose.yml -f docker/shipfree_dev/docker-compose.postgres.yml -f docker/shipfree_dev/docker-compose.directus.yml down
```

## 🔧 Configuración de Base de Datos

### Conexiones desde la aplicación Next.js
```env
DATABASE_URL=postgresql://devuser:devpass@postgres:5432/shipfreedev
```

### Conexiones externas (desde host)
```
Host: localhost
Puerto: 5470
Usuario: devuser
Contraseña: devpass
Base de datos: shipfreedev (para Next.js) / directus_db (para Directus)
```

## 📁 Volúmenes Persistentes

- `shipfree_dev_postgres_data`: Datos de PostgreSQL
- `shipfree_dev_portainer_data`: Configuración de Portainer
- `shipfree_dev_directus_uploads`: Archivos subidos a Directus
- `shipfree_dev_directus_extensions`: Extensiones de Directus

## 🔍 Health Checks

Todos los servicios tienen health checks configurados:
- PostgreSQL: Verificación de conexión con `pg_isready`
- Directus: Endpoint `/server/health`

## 🛡️ Seguridad en Desarrollo

### Variables de Entorno Importantes
- Todas las credenciales están configuradas para desarrollo
- **NO usar estas credenciales en producción**
- Los puertos están expuestos solo para desarrollo local

### CORS
- Directus tiene CORS habilitado para desarrollo
- Next.js permite conexiones desde cualquier origen en desarrollo

## 🔧 Solución de Problemas

### Si los contenedores no inician
```bash
# Limpiar volúmenes y reiniciar
docker compose down
docker volume prune
docker compose up --build -d
```

### Si hay problemas de conexión a la base de datos
```bash
# Verificar que PostgreSQL esté saludable
docker compose ps postgres
docker logs shipfree_dev-postgres-1
```

### Si Directus no se conecta
```bash
# Verificar logs de Directus
docker logs directus_shipfree
# Verificar que la base de datos directus_db existe
docker exec -it shipfree_dev-postgres-1 psql -U devuser -l
```

## 📈 Monitoreo

### Verificar que todos los servicios están corriendo
```bash
curl http://localhost:3070/api/health  # Next.js (si tienes endpoint de health)
curl http://localhost:8070/server/health  # Directus
curl http://localhost:5070  # pgAdmin
curl http://localhost:9070  # Portainer
```

## 🔄 Actualizaciones

### Para actualizar Directus
1. Cambiar la versión en `docker-compose.directus.yml`
2. Ejecutar: `docker compose pull directus`
3. Reiniciar: `docker compose up -d directus`

### Para actualizar Next.js
1. Actualizar `package.json`
2. Reconstruir: `docker compose build app`
3. Reiniciar: `docker compose up -d app`

## 📞 URLs de Acceso Rápido

- 🌐 **Aplicación**: http://localhost:3070
- 🎛️ **Directus**: http://localhost:8070
- 🛠️ **pgAdmin**: http://localhost:5070
- 📊 **Portainer**: http://localhost:9070

---
*Documentación actualizada para la configuración de desarrollo de ShipFree*