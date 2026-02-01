# Spark vLLM Dashboard

A web-based management dashboard for controlling vLLM inference on a DGX Spark cluster.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11+), SQLite, WebSockets, asyncio
- **State**: TanStack Query (server) + Zustand (UI)
- **Charts**: Recharts

## Prerequisites

- Docker & Docker Compose
- Access to the spark-vllm-docker repository
- A DGX Spark cluster (2-node setup: head + worker)
- Python 3.11+ for backend
- Node.js 18+ for frontend

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/rdoiron/spark-vllm-dashboard.git
cd spark-vllm-dashboard
```

### 2. Configure Frontend Environment

Copy and edit the frontend environment file:

```bash
cd frontend
cp .env.example .env
```

Edit `.env` with your cluster configuration:

```bash
# API URL for backend (update for your cluster)
NEXT_PUBLIC_API_URL=http://192.168.5.157:8080
NEXT_PUBLIC_WS_URL=ws://192.168.5.157:8080
```

### 3. Configure Backend Environment

The backend reads configuration from:
1. Environment variables (prefixed with `SPARK_`)
2. Database (for user-configured settings)
3. Defaults

Set the spark-vllm-docker path when starting:

```bash
cd backend
source venv/bin/activate
SPARK_DOCKER_PATH=/home/ryan/spark-vllm-docker uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### 4. Start Services

**Option A: Docker Compose (production)**

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f
```

**Option B: Manual (development)**

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
SPARK_DOCKER_PATH=/path/to/spark-vllm-docker uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 5. Access the Dashboard

- **Frontend**: http://localhost:3000 (or http://192.168.5.157:3001 on cluster)
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

## Configuration

### Cluster Settings

Cluster configuration is managed through the Settings page in the dashboard or via the API:

```bash
# Get current config
curl http://localhost:8080/api/config

# Update config
curl -X PUT http://localhost:8080/api/config \
  -H "Content-Type: application/json" \
  -d '{"spark_docker_path": "/path/to/spark-vllm-docker"}'
```

### Environment Variables

**Backend (prefix: `SPARK_`):**
| Variable | Default | Description |
|----------|---------|-------------|
| `SPARK_DOCKER_PATH` | `/home/user/spark-vllm-docker` | Path to spark-vllm-docker repo |
| `SPARK_CONTAINER_NAME` | `vllm_node` | Docker container name |
| `SPARK_HEAD_NODE_IP` | `192.168.5.157` | Head node IP address |
| `SPARK_WORKER_NODE_IPS` | `192.168.5.212` | Worker node IPs (comma-separated) |
| `SPARK_VLLM_PORT` | `8000` | vLLM server port |
| `SPARK_API_PORT` | `8080` | Backend API port |

**Frontend:**
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API URL |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8080` | WebSocket URL |

## Development

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test
```

### Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start dev server with hot reload
SPARK_DOCKER_PATH=/path/to/spark-vllm-docker uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Run tests
python -m pytest
```

## Project Structure

```
spark-vllm-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Pydantic-settings configuration
│   │   ├── routers/          # API route handlers
│   │   │   ├── cluster.py    # Cluster operations
│   │   │   ├── config.py     # Config management (NEW)
│   │   │   ├── model.py      # Model management
│   │   │   ├── metrics.py    # Real-time metrics
│   │   │   ├── logs.py       # Log streaming
│   │   │   └── profiles.py   # Configuration profiles
│   │   ├── services/         # Business logic
│   │   │   ├── cluster_service.py
│   │   │   ├── config_service.py  # Config management (NEW)
│   │   │   ├── vllm_service.py
│   │   │   ├── metrics_service.py
│   │   │   └── log_service.py
│   │   ├── models/           # Pydantic models
│   │   └── db/               # Database layer
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── layout.tsx    # Root layout with providers
│   │   │   ├── page.tsx      # Dashboard home
│   │   │   ├── settings/     # Settings page
│   │   │   ├── globals.css   # Tailwind + CSS variables
│   │   ├── components/
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── header.tsx
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts        # API client
│   │   │   └── settings-store.ts  # Zustand settings store
│   │   └── hooks/            # Custom hooks
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── AGENTS.md                 # Development guide for agents
└── README.md
```

## Features

### Cluster Management
- Start/stop the vLLM cluster
- View cluster status and node health
- Real-time cluster metrics
- Configuration persisted in SQLite database

### Model Management
- Launch vLLM models with various configurations
- Support for model presets
- Model configuration profiles

### Real-time Monitoring
- GPU utilization and memory usage
- Request throughput and latency metrics
- WebSocket-based live updates

### Log Streaming
- Real-time log viewing
- Log filtering and search
- Historical log access

### Profile Management
- Save/load model configurations
- Preset management for common use cases
- SQLite persistence

### Settings Page
- Configure spark-vllm-docker path
- Set container name and node IPs
- Adjust display preferences (theme, refresh rates)
- Settings persist in database and localStorage

## API Endpoints

### Cluster
- `GET /api/cluster/status` - Get cluster status
- `POST /api/cluster/start` - Start cluster
- `POST /api/cluster/stop` - Stop cluster
- `GET /api/cluster/nodes` - Get node health status

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration
- `POST /api/config/reload` - Reload configuration without restart

### Model
- `GET /api/model/list` - List available models
- `POST /api/model/launch` - Launch a model
- `POST /api/model/stop` - Stop a model

### Metrics
- `GET /api/metrics/current` - Get current metrics
- `WS /api/metrics/stream` - WebSocket metrics stream

### Logs
- `GET /api/logs/recent` - Get recent logs
- `WS /api/logs/stream` - WebSocket log stream

### Profiles
- `GET /api/profiles/` - List profiles
- `POST /api/profiles/` - Create profile
- `GET /api/profiles/{id}` - Get profile
- `PUT /api/profiles/{id}` - Update profile
- `DELETE /api/profiles/{id}` - Delete profile

## Troubleshooting

### Port Conflicts
If ports are in use, modify the frontend `.env`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8081
```

And restart the backend on a different port if needed.

### Docker Permissions
Ensure your user has Docker permissions:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Cluster Not Responding
1. Check the spark-vllm-docker path in Settings or via API:
   ```bash
   curl http://localhost:8080/api/config
   ```
2. Ensure the path exists and `launch-cluster.sh` is present
3. Verify the backend can access the path

### Frontend Can't Reach Backend
Check the `NEXT_PUBLIC_API_URL` in `frontend/.env` and ensure the backend is running.

## License

MIT