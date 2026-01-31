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

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd spark-vllm-dashboard

# Copy environment template
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your configuration:

```bash
# Path to spark-vllm-docker repository
SPARK_DASHBOARD_SPARK_DOCKER_PATH=/path/to/your/spark-vllm-docker

# Container name (usually vllm_node)
SPARK_DASHBOARD_CONTAINER_NAME=vllm_node

# Cluster configuration
SPARK_DASHBOARD_HEAD_NODE_IP=192.168.5.157
SPARK_DASHBOARD_VLLM_PORT=8000
SPARK_DASHBOARD_API_PORT=8080
```

### 3. Start Services

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f
```

### 4. Access the Dashboard

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

## Development

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 3000)
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

# Start dev server (port 8080) with hot reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Testing
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
│   │   │   ├── model.py      # Model management
│   │   │   ├── metrics.py    # Real-time metrics
│   │   │   ├── logs.py       # Log streaming
│   │   │   └── profiles.py   # Configuration profiles
│   │   ├── services/         # Business logic
│   │   │   ├── cluster_service.py
│   │   │   ├── vllm_service.py
│   │   │   ├── metrics_service.py
│   │   │   └── log_service.py
│   │   └── models/           # Pydantic models
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── layout.tsx    # Root layout with providers
│   │   │   ├── page.tsx      # Dashboard home
│   │   │   ├── globals.css   # Tailwind + CSS variables
│   │   ├── components/
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── sidebar.tsx
│   │   │   │   └── header.tsx
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── lib/              # Utilities
│   │   │   ├── api.ts        # API client
│   │   │   └── utils.ts      # Utility functions
│   │   └── hooks/            # Custom hooks
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── AGENTS.md                  # Development guide for agents
└── README.md
```

## Features

### Cluster Management
- Start/stop the vLLM cluster
- View cluster status and node health
- Real-time cluster metrics

### Model Management
- Launch vLLM models with various configurations
- Support for model presets (GLM-4.7-AWQ, MiniMax-M2.1-AWQ)
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

## Configuration Presets

Default model configurations:

| Model | Quantization | GPU Memory |
|-------|--------------|------------|
| GLM-4.7-AWQ | AWQ | ~48GB |
| MiniMax-M2.1-AWQ | AWQ | ~48GB |

## API Endpoints

### Cluster
- `GET /api/cluster/status` - Get cluster status
- `POST /api/cluster/start` - Start cluster
- `POST /api/cluster/stop` - Stop cluster

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
If ports 3000 or 8080 are in use, modify `.env`:
```bash
SPARK_DASHBOARD_API_PORT=8081
NEXT_PUBLIC_API_URL=http://localhost:8081
```

### Docker Permissions
Ensure your user has Docker permissions:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Cluster Not Responding
Check the spark-vllm-docker path in `.env` and ensure the repository is accessible.

## License

MIT