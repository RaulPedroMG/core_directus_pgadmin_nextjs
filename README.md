# ⚡ ShipFree

Hi there! 👋

ShipFree is a free alternative to ShipFast, designed to simplify and optimize your shipping process. It’s built using modern web technologies like Next.js, Supabase, Stripe, LemonSqueezy, Drizzle ORM and Mailgun.

## Features

- SEO Optimisation
- User authentication with Supabase
- Stripe and LemonSqueezy integration
- Email notifications via Mailgun
- Modern UI built with Next.js and TailwindCSS

## 🔧 Environment Configuration

ShipFree uses environment variables for configuration with separate files for development and production.

### Environment Files

- **`.env.example`**: Template with all available variables (safe to commit)
- **`.env.dev`**: Development environment configuration
- **`.env.prod`**: Production environment configuration
- **`.env`**: Information file with setup instructions

### Setting up Environment Variables

1. **For development**:
   ```bash
   cp .env.example .env.dev
   
   # Edit .env.dev with your development values
   nano .env.dev
   
   # Start development environment
   ./start-dev.sh
   ```

2. **For production**:
   ```bash
   cp .env.example .env.prod
   
   # Edit .env.prod with secure production values
   nano .env.prod
   
   # Start production environment
   ./start-prod.sh
   ```

### Environment Variables Overview

- **Database**: PostgreSQL connection and credentials
- **Ports**: Configurable ports for all services
- **Directus CMS**: URL configuration and admin credentials  
- **Payment**: Stripe and LemonSqueezy API keys
- **Email**: Mailgun configuration
- **Security**: Production security settings

### Port Configuration

All services use configurable ports defined in environment variables:

**Development Ports (default):**
- 🌐 **Application**: `3070`
- 🗄️ **PostgreSQL**: `5470` 
- 🎛️ **Directus CMS**: `8070`
- 🛠️ **pgAdmin**: `5070`
- 📊 **Portainer**: `9070`

**Production Ports (default):**
- 🌐 **Application**: `3000`
- 🗄️ **PostgreSQL**: `5432`
- 📊 **Portainer**: `9000`

You can customize these ports by modifying the respective variables in your `.env.dev` or `.env.prod` file.

> 🔒 **Security Note**: All environment files (except `.env.example`) are protected by `.gitignore` and won't be committed to the repository.

## Docker Setup

ShipFree provides Docker configurations for both **development** and **production** environments with simplified setup scripts.

### Quick Start

1. **Development Environment**:
   ```bash
   ./start-dev.sh
   ```

2. **Production Environment**:
   ```bash
   ./start-prod.sh
   ```

> 💡 These scripts handle environment validation, startup, and service health checks automatically.

### Manual Commands (Alternative)

If you prefer to run commands manually:

1. **Development Environment**:
   ```bash
   # Validate environment
   ./scripts/validate-env.sh
   
   # Start containers
   docker compose --env-file .env.dev \
     -f docker/shipfree_dev/docker-compose.yml \
     -f docker/shipfree_dev/docker-compose.postgres.yml \
     -f docker/shipfree_dev/docker-compose.directus.yml \
     up -d --build
   ```

2. **Production Environment**:
   ```bash
   # Validate environment
   ./scripts/validate-env-prod.sh
   
   # Start containers
   docker compose --env-file .env.prod \
     -f docker/prod/docker-compose.yml \
     -f docker/prod/docker-compose.postgres.yml \
     up -d --build
   ```

### Docker File Structure

The Docker files are organized as follows:

```
docker
├── dev
│   ├── Dockerfile                  # Dockerfile for development
│   ├── docker-compose.yml          # Base development setup
│   ├── docker-compose.mongodb.yml  # Development setup with MongoDB
│   └── docker-compose.postgres.yml # Development setup with PostgreSQL
└── prod
    ├── Dockerfile                  # Dockerfile for production
    ├── docker-compose.yml          # Base production setup
    ├── docker-compose.mongodb.yml  # Production setup with MongoDB
    └── docker-compose.postgres.yml # Production setup with PostgreSQL
```

### Development Environment

In development, the project runs in **watch mode**, meaning it automatically detects changes in your code and rebuilds the application. This is ideal for local development but should **never** be used in production.

#### Commands for Development

1. **Base Setup** (without a database):
1. **Development (All Services)**:

   ```bash
   ./start-dev.sh
   ```

2. **Production Deployment**:

   ```bash
   ./start-prod.sh
   ```

3. **Stop All Services**:

   ```bash
   # Development
   docker compose --env-file .env.dev \
     -f docker/shipfree_dev/docker-compose.yml \
     -f docker/shipfree_dev/docker-compose.postgres.yml \
     -f docker/shipfree_dev/docker-compose.directus.yml down

   # Production
   docker compose --env-file .env.prod \
     -f docker/prod/docker-compose.yml \
     -f docker/prod/docker-compose.postgres.yml down
   ```

#### Why Watch Mode?

- **Watch mode** ensures that your changes are reflected in real-time without manually restarting the server.
- It’s perfect for development but **not suitable for production** due to performance and security concerns.

---

### Production Environment

The production environment is optimized for performance and security. It uses a multi-stage build to reduce the image size and includes only the necessary dependencies.

#### Commands for Production

1. **Base Setup** (without a database):

   ```bash
   docker-compose -f docker/prod/docker-compose.yml up --build -d
   ```

2. **With PostgreSQL**:

   ```bash
   docker-compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.postgres.yml up --build -d
   ```

3. **With MongoDB**:
   ```bash
   docker-compose -f docker/prod/docker-compose.yml -f docker/prod/docker-compose.mongodb.yml up --build -d
   ```

#### Key Differences in Production

- **No watch mode**: The application is pre-built, and changes require a rebuild.
- **Optimized images**: Smaller image size and faster startup times.
- **Environment variables**: Ensure all required variables (e.g., `DATABASE_URL`, `API_KEY`) are set.

---

### Portainer Integration

Portainer is included in both development and production setups to help you manage your Docker containers via a web interface.

- **Access Portainer**: `http://localhost:9000`
- **Default credentials**: Set up during the first login.

---

### Disclaimer

- **Development Mode**: Uses watch mode for real-time updates. Not suitable for production.
- **Production Mode**: Optimized for performance and security. Requires a rebuild for changes.

---

## Docs

For full documentation, visit: [ShipFree Docs](https://shipfree.idee8.agency/docs)

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## Contributing

For people who want to contribute, please refer to [CONTRIBUTING.md](CONTRIBUTING.md).

---

Cooked for you with ❤️ by [Idee8](https://idee8.agency)
