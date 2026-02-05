# Cup & Handle Scanner

Dockerized stock pattern scanner with Cup & Handle, Ascending Triangle, and Bull Flag detection.

## Features

- 🥤 Cup & Handle pattern detection
- 📐 Ascending Triangle detection  
- 🚩 Bull Flag detection
- 💰 DCF Valuation integration
- 📊 MongoDB storage for scan results
- 🔄 Real-time updates via Socket.IO

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Database**: MongoDB
- **Docker**: Full containerized deployment

## Quick Start

### Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

Access at http://localhost:3000

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access at http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/scan/:symbol` | Scan a stock symbol |
| GET | `/api/results` | Get saved scan results |
| GET | `/api/market/:exchange` | Get tickers by exchange |

## Example Usage

```bash
# Scan a symbol
curl http://localhost:3005/api/scan/AAPL

# Get results
curl http://localhost:3005/api/results
```

## Project Structure

```
cup_scanner/
├── backend/
│   ├── src/
│   │   └── index.ts       # Express API + pattern detection
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # React UI
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## Pattern Detection

The scanner detects three key patterns:

1. **Cup & Handle** - Classic W. O'Neil pattern with U-shaped cup and consolidation handle
2. **Ascending Triangle** - Flat resistance with rising support
3. **Bull Flag** - Strong pole surge followed by consolidation

Each pattern is scored and categorized as:
- **STRONG BUY** (score 75+)
- **BUY** (score 55-74)
- **FORMING** (pattern detected, not ready)
- **WATCH** (no clear pattern)
