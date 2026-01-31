# AGENTS.md - Spark vLLM Dashboard Development Guide

This document provides guidelines for agentic coding agents working on the Spark vLLM Dashboard project.

## Project Overview

A web-based management dashboard for controlling vLLM inference on a DGX Spark cluster. Tech stack:
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI (Python 3.11+), SQLite, WebSockets, asyncio
- **State**: TanStack Query (server) + Zustand (UI)
- **Charts**: Recharts

## Build Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm test             # Run React Testing Library tests
npm test -- --watch  # Watch mode for tests
npm test path/to/component.test.tsx  # Run single test file
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate  # Create virtual env
pip install -r requirements.txt                  # Install deps
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080  # Dev server
python -m pytest                                 # Run all tests
python -m pytest tests/test_service.py           # Run single test file
python -m pytest -v                              # Verbose output
```

### Docker
```bash
docker compose up -d      # Start all services
docker compose down       # Stop all services
docker compose logs -f    # Follow logs
docker compose build      # Rebuild images
```

## Code Style Guidelines

### TypeScript/React Conventions

**Imports** (frontend/lib/api.ts pattern):
```typescript
import { useQuery, useMutation } from "@tanstack/react-query"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useState } from "react"
```

**Naming**:
- Components: `PascalCase` for files (`ModelLaunchForm.tsx`), `camelCase` for props interfaces
- Hooks: `use*` prefix (`useCluster.ts`, `useModelStatus`)
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` or `PascalCase` for config objects
- Types/interfaces: `PascalCase` with `Type` suffix for complex types

**File Structure**:
```
frontend/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── cluster/           # Feature: cluster components
│   ├── model/             # Feature: model components
│   ├── metrics/           # Feature: metrics components
│   └── logs/              # Feature: logs components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (api.ts, utils.ts)
└── types/                 # TypeScript type definitions
```

**Component Patterns**:
- Use functional components with TypeScript interfaces
- Extract complex logic into custom hooks
- Keep components focused (single responsibility)
- Use composition over prop drilling
- Handle loading/error states explicitly

**State Management**:
- Server state: TanStack Query (`useQuery`, `useMutation`)
- UI state: Zustand stores for global UI state
- Local component state: `useState`, `useReducer`
- Avoid `useContext` for global state; prefer Zustand

### Python/FastAPI Conventions

**Imports** (backend/app/routers/cluster.py pattern):
```python
from fastapi import APIRouter, HTTPException, status
from typing import Optional
from app.services.cluster_service import ClusterService
from app.models.cluster import ClusterStatus, ClusterAction
```

**Naming**:
- Modules/functions/variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Pydantic models: `PascalCase` with descriptive names

**File Structure** (backend/app/):
```
app/
├── main.py               # FastAPI app entry with CORS
├── config.py             # Pydantic-settings configuration
├── routers/              # API route handlers
│   ├── cluster.py
│   ├── model.py
│   ├── metrics.py
│   ├── logs.py
│   └── profiles.py
├── services/             # Business logic
│   ├── cluster_service.py
│   ├── vllm_service.py
│   ├── metrics_service.py
│   └── log_service.py
├── models/               # Pydantic models
│   ├── cluster.py
│   ├── vllm.py
│   └── metrics.py
└── db/                   # Database layer
    ├── database.py
    └── models.py
```

**API Patterns**:
- Use literal types for action enums: `Literal["start", "stop"]`
- Return structured Pydantic models from all endpoints
- Use HTTPException for error handling with appropriate status codes
- WebSocket endpoints: `/api/{resource}/stream`

**Async/Await**:
- All I/O operations must be async (httpx, aiosqlite, asyncio subprocess)
- Never block the event loop with synchronous operations
- Use `async with` for context managers

**Error Handling**:
```python
try:
    result = await service.operation()
except CalledProcessError as e:
    raise HTTPException(status_code=500, detail=f"Shell command failed: {e}")
```

## Shell Command Integration

When calling spark-vllm-docker scripts (launch-cluster.sh, hf-download.sh):
- Use `asyncio.create_subprocess_exec` for non-blocking execution
- Capture stdout/stderr for logging and parsing
- Sanitize all user inputs before shell interpolation
- Validate model IDs with regex: `^[\w\-/]+$`

Example (cluster_service.py):
```python
async def start_cluster(self) -> ClusterStatus:
    cmd = f"{self.spark_docker_path}/launch-cluster.sh -d"
    proc = await asyncio.create_subprocess_shell(
        cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, _ = await proc.communicate()
    return self._parse_status(stdout.decode())
```

## Environment Variables

Required environment variables (see .env.example):
- `SPARK_DOCKER_PATH`: Path to spark-vllm-docker repository
- `CONTAINER_NAME`: Docker container name for vLLM (default: vllm_node)
- `HEAD_NODE_IP`: Dashboard host IP for CORS
- `VLLM_PORT`: vLLM server port (default: 8000)
- `API_PORT`: FastAPI port (default: 8080)
- `NEXT_PUBLIC_API_URL`: Frontend env var for API base URL
- `NEXT_PUBLIC_WS_URL`: Frontend env var for WebSocket URL

## Development Workflow

1. **Start services**: `docker compose up -d` (runs both frontend/backend)
2. **Backend dev**: Run uvicorn with hot reload in separate terminal
3. **Frontend dev**: Run `npm run dev` in frontend directory
4. **Test single file**: Use specific test paths shown in Build Commands
5. **Check types**: Run `npm run typecheck` and `python -m pyright`

## Testing Strategy

**Frontend**: React Testing Library with Jest
- Place tests next to components: `ComponentName.test.tsx`
- Mock API calls with MSW or simple Jest mocks
- Test component rendering and user interactions

**Backend**: pytest with pytest-asyncio
- Place tests in `tests/` directory mirroring app structure
- Mock shell commands with unittest.mock patches
- Test API endpoints using TestClient
- WebSocket tests: use WebSocketTestClient or similar

**Manual Testing Checklist**:
- Cluster start/stop/status operations
- Model launch with various configurations
- Real-time metrics streaming
- Log streaming without disconnections
- Profile save/load functionality
- Theme toggle persistence