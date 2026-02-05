# Cup & Handle Scanner - Docker Management

## Quick Reference

| Action | Command |
|--------|---------|
| Start | `docker-compose up -d` |
| Stop | `docker-compose down` |
| View logs | `docker logs cup-handle-scanner` |
| Rebuild | `docker-compose build --no-cache` |

**URL:** http://127.0.0.1:5002

---

## Starting the Scanner

```bash
cd /Users/richard/Documents/stocks/nodejs_dev/stocks
docker-compose up -d
```

The `-d` flag runs it in the background (detached mode).

## Stopping the Scanner

```bash
cd /Users/richard/Documents/stocks/nodejs_dev/stocks
docker-compose down
```

## Viewing Logs

```bash
# View recent logs
docker logs cup-handle-scanner

# Follow logs in real-time
docker logs -f cup-handle-scanner

# View last 50 lines
docker logs --tail 50 cup-handle-scanner
```

## Rebuilding After Code Changes

If you edit `cup_handle_scanner_2.py`:

```bash
cd /Users/richard/Documents/stocks/nodejs_dev/stocks
docker-compose down
docker-compose build
docker-compose up -d
```

For a full rebuild (ignoring cache):

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Check Container Status

```bash
docker ps --filter "name=cup-handle"
```

---

## Copying to Another Computer

### Required Files

Copy this entire folder:
```
stocks/
├── cup_handle_scanner_2.py
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

### On the New Computer

1. **Install Docker Desktop** (if not installed)
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **Copy the files** to the new machine (USB, cloud, scp, etc.)

3. **Build and run:**
   ```bash
   cd /path/to/stocks
   docker-compose build
   docker-compose up -d
   ```

4. **Access at:** http://127.0.0.1:5002

### Alternative: Export the Image

If you want to skip rebuilding on the new machine:

**On the original computer:**
```bash
# Save the image to a file
docker save stocks_scanner -o cup_scanner_image.tar
```

**On the new computer:**
```bash
# Load the image
docker load -i cup_scanner_image.tar

# Copy docker-compose.yml to the new machine, then run:
docker-compose up -d
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 5002
lsof -i :5002

# Or change the port in docker-compose.yml:
# ports:
#   - "5003:5002"  # Use 5003 externally
```

### Container Won't Start
```bash
# Check logs for errors
docker logs cup-handle-scanner

# Rebuild from scratch
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Out of Disk Space
```bash
# Clean up unused Docker resources
docker system prune -a
```
