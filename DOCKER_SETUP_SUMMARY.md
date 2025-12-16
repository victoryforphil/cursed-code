# OpenCode Docker Complete Setup

Complete Docker setup with both OpenCode API server and opencode-web UI.

## Files Created

### Configuration Files
- **`docker-compose.yml`** - Main compose file with both services
- **`Dockerfile.opencode`** - API server container definition
- **`opencode-web/Dockerfile`** - Web UI container definition
- **`opencode-web/.dockerignore`** - Build optimization

### Documentation
- **`OPENCODE_WEB_DOCKER_SETUP.md`** - Comprehensive setup guide
- **`DOCKER_QUICK_REFERENCE.md`** - Quick reference and commands
- **`DOCKER_SETUP_SUMMARY.md`** - This file

### Bootstrap Script
- **`docker-bootstrap`** - Automated setup script (executable)

## Quick Start

### Option 1: Automated (Recommended)
```bash
chmod +x docker-bootstrap
./docker-bootstrap
```

### Option 2: Manual
```bash
# Clone opencode-web if needed
git clone https://github.com/chris-tse/opencode-web.git

# Start services
docker-compose up -d

# Wait 1-2 minutes for startup, then access:
# Web UI: http://localhost:5173
# API: http://localhost:7777
```

## Architecture

```
┌─────────────────────────────────────────────┐
│     Docker Network (opencode-network)       │
│                                             │
│  ┌──────────────────┐  ┌─────────────────┐ │
│  │  opencode-api    │  │  opencode-web   │ │
│  │ (Bun + OpenCode) │◄─┤  (React/Vite)  │ │
│  │ Port: 7777       │  │  Port: 5173     │ │
│  └──────────────────┘  └─────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
     ↓                          ↓
  localhost                 localhost
  :7777                     :5173
```

## Services

### opencode-api
- **Container Image:** Built from `Dockerfile.opencode`
- **Technology:** Bun + OpenCode CLI
- **Port:** 7777
- **Mounts:** `/workspace` (your project files)
- **Health Check:** Yes
- **Auto-restart:** Yes

### opencode-web
- **Container Image:** Built from `opencode-web/Dockerfile`
- **Technology:** React 19 + Vite + Bun
- **Port:** 5173
- **Hot Reload:** Yes (src/ and public/ directories)
- **Health Check:** Yes
- **Dependencies:** Requires opencode-api to be healthy first

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Web UI | http://localhost:5173 | Interactive chat interface |
| API | http://localhost:7777 | OpenCode server API |

## Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View service status
docker-compose ps

# Rebuild and restart
docker-compose up -d --build

# Execute commands in containers
docker-compose exec opencode-api opencode --help
docker-compose exec opencode-web bun run lint
```

## Directory Structure

```
cursed-code/
├── docker-compose.yml              ✓ Main compose
├── Dockerfile.opencode             ✓ API container
├── docker-bootstrap                ✓ Setup script
├── DOCKER_QUICK_REFERENCE.md       ✓ Commands
├── OPENCODE_WEB_DOCKER_SETUP.md    ✓ Full guide
├── DOCKER_SETUP_SUMMARY.md         ✓ This file
│
├── opencode-web/                   ← Clone here
│   ├── Dockerfile                  ✓ Web container
│   ├── src/                        React source
│   ├── public/                     Static files
│   └── package.json
│
└── (your project files)            ← Available in containers
```

## Key Features

✓ **Zero Configuration** - Auto-detects everything  
✓ **Hot Reload** - Changes to src/ auto-refresh  
✓ **Health Checks** - Services verify they're working  
✓ **Dependency Management** - Web waits for API to be ready  
✓ **Workspace Mounting** - All your files available to OpenCode  
✓ **Docker Volume Caching** - Persistent dependency cache  
✓ **Production Ready** - Includes security best practices  

## Troubleshooting

### Services won't start?
```bash
docker-compose logs -f          # See what's failing
docker-compose ps               # Check status
```

### Web UI can't connect to API?
```bash
docker-compose exec opencode-web curl http://opencode-api:7777
```

### Port already in use?
Edit `docker-compose.yml` and change port mappings:
```yaml
ports:
  - "3000:5173"  # Web on 3000
  - "8000:7777"  # API on 8000
```

### Rebuild everything?
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Documentation Files

- **DOCKER_QUICK_REFERENCE.md** - Commands, tips, and troubleshooting
- **OPENCODE_WEB_DOCKER_SETUP.md** - Detailed setup, config, and production deployment

## What's Different from Before?

This setup includes:
- ✓ Automated bootstrap script
- ✓ Both API and Web UI in one compose file
- ✓ Internal network communication (no host.docker.internal needed)
- ✓ Service dependencies and health checks
- ✓ Volume persistence for caching
- ✓ Production-ready configuration examples

## Next Steps

1. Run the bootstrap script or manual setup
2. Wait for services to be healthy
3. Open http://localhost:5173
4. Start coding with OpenCode!

## Support

- See DOCKER_QUICK_REFERENCE.md for command reference
- See OPENCODE_WEB_DOCKER_SETUP.md for detailed configuration
- Check container logs: `docker-compose logs -f`
