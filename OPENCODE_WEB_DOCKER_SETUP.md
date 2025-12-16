# OpenCode Complete Docker Setup Guide

This setup includes both the OpenCode API server and the opencode-web UI in a single docker-compose configuration.

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- opencode-web repository cloned to `./opencode-web`
- Your project files available in the workspace

### Setup Steps

1. **Clone opencode-web repository:**
```bash
git clone https://github.com/chris-tse/opencode-web.git
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Wait for services to be healthy:**
```bash
docker-compose ps
# Both opencode-api and opencode-web should show "healthy" status
```

4. **Access the application:**
- Open browser to `http://localhost:5173`
- API is running at `http://localhost:7777` (container-internal: `http://opencode-api:7777`)

5. **View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f opencode-api
docker-compose logs -f opencode-web
```

## Configuration

### Service Architecture

```
┌─────────────────────────────────────────┐
│         Docker Network                  │
│  opencode-network (bridge)              │
│                                         │
│  ┌──────────────┐     ┌──────────────┐ │
│  │  opencode-   │     │  opencode-   │ │
│  │   api        │────→│    web       │ │
│  │ :7777        │     │ :5173        │ │
│  └──────────────┘     └──────────────┘ │
│                                         │
└─────────────────────────────────────────┘
       ↑                        ↑
       │ (port 7777)     (port 5173)
       │                        │
    localhost              localhost
```

### Environment Variables

Edit `docker-compose.yml` to customize:

**OpenCode API Server:**
- `OPENCODE_PORT` - API server port (default: 7777)
- `NODE_ENV` - Set to "production" for production builds

**OpenCode Web UI:**
- `VITE_API_URL` - Points to `http://opencode-api:7777` (internal container network)
- `NODE_ENV` - Development or production

### Volumes

- `/workspace` - Mounted to your project directory for OpenCode to work with
- `opencode-cache` - Docker volume for caching dependencies

## Services

### opencode-api

The OpenCode API server that provides the backend for the CLI and web UI.

- **Port:** 7777
- **Image:** Built from `Dockerfile.opencode`
- **Features:**
  - Runs OpenCode server
  - Mounts workspace at `/workspace`
  - Caches dependencies in Docker volume
  - Health check enabled

**Commands:**
```bash
# View API logs
docker-compose logs -f opencode-api

# Execute commands in API container
docker-compose exec opencode-api opencode --help

# Check OpenCode version
docker-compose exec opencode-api opencode --version
```

### opencode-web

The React-based web UI for interacting with OpenCode.

- **Port:** 5173
- **Image:** Built from `opencode-web/Dockerfile`
- **Features:**
  - Hot reload for development
  - Connected to opencode-api via internal network
  - Health check enabled
  - Depends on opencode-api service being healthy

**Commands:**
```bash
# View web logs
docker-compose logs -f opencode-web

# Access container shell
docker-compose exec opencode-web bash

# Run linting
docker-compose exec opencode-web bun run lint

# Run build
docker-compose exec opencode-web bun run build
```

## Development Workflow

### Hot Reload
The docker-compose.yml includes volume mounts for hot reload on the web UI:
- `./opencode-web/src:/app/src` - Source code changes trigger refresh
- `./opencode-web/public:/app/public` - Static files changes trigger refresh

API server changes may require container restart:
```bash
docker-compose restart opencode-api
```

### Working with Your Project

All files in your current directory are mounted to `/workspace` in the API container:

```bash
# Create a new project or work with existing files
ls /workspace  # Inside container sees your local files

# OpenCode can now analyze and modify files in your project
```

### Running Commands

```bash
# Run in API container
docker-compose exec opencode-api opencode --help

# Run in Web container
docker-compose exec opencode-web bun dev
docker-compose exec opencode-web bun run lint
docker-compose exec opencode-web bun run build

# Interactive shell
docker-compose exec opencode-api bash
docker-compose exec opencode-web bash
```

### Rebuilding Services

```bash
# Rebuild API server
docker-compose build --no-cache opencode-api

# Rebuild Web UI
docker-compose build --no-cache opencode-web

# Rebuild both
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

## Troubleshooting

### Services Not Starting

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f opencode-api
docker-compose logs -f opencode-web
```

### OpenCode API Health Issues

```bash
# Test API connectivity
docker-compose exec opencode-web curl http://opencode-api:7777

# Check if OpenCode is properly installed
docker-compose exec opencode-api opencode --version

# Verify API is listening
docker-compose exec opencode-api curl localhost:7777
```

### Web UI Cannot Connect to API

1. Check API container is running:
```bash
docker-compose ps opencode-api
# Should show "healthy" status
```

2. Verify API URL in environment:
```bash
docker-compose exec opencode-web echo $VITE_API_URL
# Should show: http://opencode-api:7777
```

3. Rebuild both services:
```bash
docker-compose down
docker-compose up -d --build
```

### Port Already in Use

Edit `docker-compose.yml`:
```yaml
opencode-web:
  ports:
    - "3000:5173"  # Change 5173 to another port

opencode-api:
  ports:
    - "7778:7777"  # Change 7777 to another port
```

### Container Memory Issues

If containers are exiting, increase Docker memory allocation or set limits:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
    reservations:
      memory: 1G
```

### Workspace Files Not Visible

```bash
# Verify volume mount
docker-compose exec opencode-api ls /workspace

# If empty, check your working directory
pwd
ls

# Ensure you're in the correct directory before running docker-compose
```

## Production Deployment

### Production Configuration

Create a `docker-compose.prod.yml` for production:

```yaml
version: '3.8'

services:
  opencode-api:
    build:
      context: ./
      dockerfile: Dockerfile.opencode
    container_name: opencode-api-prod
    ports:
      - "7777:7777"
    environment:
      - NODE_ENV=production
    volumes:
      - /path/to/your/production/project:/workspace
      - opencode-cache-prod:/root/.cache
    restart: always
    networks:
      - opencode-network-prod
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G

  opencode-web:
    build:
      context: ./opencode-web
      dockerfile: Dockerfile
    container_name: opencode-web-prod
    ports:
      - "80:5173"
    environment:
      - VITE_API_URL=http://opencode-api:7777
      - NODE_ENV=production
    restart: always
    depends_on:
      - opencode-api
    networks:
      - opencode-network-prod
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

networks:
  opencode-network-prod:
    driver: bridge

volumes:
  opencode-cache-prod:
    driver: local
```

**Run production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Nginx Reverse Proxy

For production, use Nginx as a reverse proxy. Create `nginx.conf`:

```nginx
upstream opencode_api {
    server opencode-api:7777;
}

upstream opencode_web {
    server opencode-web:5173;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/certs/cert.pem;
    ssl_certificate_key /etc/nginx/certs/key.pem;

    # Web UI
    location / {
        proxy_pass http://opencode_web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://opencode_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Stopping Services

```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop without removing
docker-compose stop
```

## Advanced Configuration

### Using Environment Files

Create `.env` file in the root directory:
```
OPENCODE_PORT=7777
VITE_API_URL=http://opencode-api:7777
NODE_ENV=development
```

Update `docker-compose.yml` to use it:
```yaml
services:
  opencode-api:
    env_file: .env
  opencode-web:
    env_file: .env
```

### Custom Network Configuration

For production multi-host deployment, use custom driver:

```yaml
networks:
  opencode-network:
    driver: overlay
    driver_opts:
      com.docker.network.driver.overlay.vxlanid: "4096"
```

### Volume Persistence

Add data persistence for logs and cache:

```yaml
volumes:
  opencode-logs:
    driver: local
  opencode-cache:
    driver: local

services:
  opencode-api:
    volumes:
      - opencode-logs:/var/log/opencode
      - opencode-cache:/root/.cache
```

### Service Dependencies and Health Checks

Current setup includes:
- `opencode-web` depends on `opencode-api` being healthy
- Both services have health checks every 30 seconds
- Services restart unless stopped

Modify restart policy:
```yaml
# No restart
restart: "no"

# Restart only on failure
restart: on-failure:5  # Max 5 restarts

# Always restart
restart: always
```

## Useful Docker Commands

```bash
# View running containers
docker-compose ps

# View detailed logs
docker-compose logs -f --tail=100

# Restart service
docker-compose restart opencode-web

# Rebuild and restart
docker-compose up -d --build opencode-web

# Remove containers and images
docker-compose down --rmi all
```

## Additional Notes

- The Dockerfile uses multi-stage build for smaller production images
- Healthcheck is configured to verify the service is running
- Network is configured for inter-service communication if needed
- The setup supports both development (with bun dev) and production modes
