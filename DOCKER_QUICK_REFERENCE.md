# OpenCode Docker Quick Reference

## Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v

# View status
docker-compose ps
```

## Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Web UI | http://localhost:5173 | Chat interface to OpenCode |
| API | http://localhost:7777 | OpenCode server API |

## Common Commands

```bash
# View logs
docker-compose logs -f                    # All services
docker-compose logs -f opencode-api      # API only
docker-compose logs -f opencode-web      # Web UI only

# Execute commands
docker-compose exec opencode-api opencode --help    # Get OpenCode help
docker-compose exec opencode-api opencode --version # Check version
docker-compose exec opencode-web bun run lint       # Run linting

# Rebuild services
docker-compose build --no-cache           # Rebuild all
docker-compose up -d --build              # Rebuild and restart all

# Restart services
docker-compose restart                    # Restart all
docker-compose restart opencode-api       # Restart API only
docker-compose restart opencode-web       # Restart Web only
```

## Directory Structure Expected

```
cursed-code/
├── docker-compose.yml          # Main compose file
├── Dockerfile.opencode         # API server container
├── opencode-web/
│   ├── Dockerfile             # Web UI container
│   ├── src/                   # React source files
│   ├── public/                # Static files
│   ├── package.json
│   └── bun.lock
├── (your project files)       # Mounted to /workspace in API
├── .env                       # Optional environment variables
└── other files...
```

## First Run Checklist

- [ ] Clone opencode-web: `git clone https://github.com/chris-tse/opencode-web.git`
- [ ] Run `docker-compose up -d`
- [ ] Wait 1-2 minutes for services to start
- [ ] Check status: `docker-compose ps` (should show "healthy")
- [ ] Open http://localhost:5173 in browser
- [ ] Start chatting with OpenCode!

## Verify Installation

```bash
# 1. Check containers are running
docker-compose ps

# 2. Test API connectivity
docker-compose exec opencode-web curl http://opencode-api:7777

# 3. Check OpenCode is installed
docker-compose exec opencode-api opencode --version

# 4. View recent logs
docker-compose logs --tail=50
```

## Development Tips

### Hot Reload
- Changes to `opencode-web/src/` and `opencode-web/public/` auto-refresh
- API changes require: `docker-compose restart opencode-api`

### Working with Files
- All files in `cursed-code/` are available in containers at `/workspace`
- Create files, and OpenCode can read/modify them
- Changes persist on your host machine

### Debugging
```bash
# Interactive shell in API container
docker-compose exec opencode-api bash

# Interactive shell in Web container
docker-compose exec opencode-web bash

# Check environment variables
docker-compose exec opencode-api env
```

## Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove images
docker-compose down --rmi all

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Prune everything (WARNING: affects all Docker, not just this project)
docker system prune
```

## Ports

- **5173** - Web UI (opencode-web)
- **7777** - API Server (opencode-api)

Change in `docker-compose.yml` if conflicts:
```yaml
ports:
  - "3000:5173"  # Access web UI on port 3000
  - "8000:7777"  # Access API on port 8000
```

## Useful Links

- [OpenCode Documentation](https://opencode.ai/docs)
- [opencode-web Repository](https://github.com/chris-tse/opencode-web)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Bun Package Manager](https://bun.sh/)
