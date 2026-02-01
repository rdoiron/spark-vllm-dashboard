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
npm run dev              # Start dev server on port 3000
npm run build            # Production build
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript compiler check
npm test                 # Run all tests
npm test path/to/component.test.tsx  # Run single test file (Recommended)
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv && source venv/bin/activate    # Create venv
pip install -r requirements.txt                    # Install deps
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080  # Dev server
python -m pytest                                  # Run all tests
python -m pytest tests/test_service.py            # Run single test file (Recommended)
python -m pytest -v                               # Verbose output
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

**Imports**:
```typescript
import { useQuery, useMutation } from "@tanstack/react-query"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useEffect, useState } from "react"
```

**Naming**:
- Components: `PascalCase` files (`ModelLaunchForm.tsx`), `camelCase` for props interfaces
- Hooks: `use*` prefix (`useCluster.ts`)
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` or `PascalCase` for config objects
- Types/interfaces: `PascalCase` with `Type` suffix

**File Structure**:
```
frontend/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── cluster/           # Feature components
│   ├── model/
│   ├── metrics/
│   └── logs/
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (api.ts, utils.ts)
└── types/                 # TypeScript type definitions
```

**Patterns**:
- Functional components with TypeScript interfaces
- Extract complex logic into custom hooks
- TanStack Query for server state, Zustand for global UI state
- Avoid `useContext` for global state

### Python/FastAPI Conventions

**Imports**:
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

**File Structure**:
```
backend/app/
├── main.py               # FastAPI app entry with CORS
├── config.py             # Pydantic-settings configuration
├── routers/              # API route handlers
├── services/             # Business logic
├── models/               # Pydantic models
└── db/                   # Database layer (SQLAlchemy + aiosqlite)
```

**Patterns**:
- Use `Literal` types for action enums: `Literal["start", "stop"]`
- Return structured Pydantic models from all endpoints
- Use `HTTPException` for error handling with appropriate status codes
- WebSocket endpoints: `/api/{resource}/stream`
- All I/O operations must be async (`asyncio.create_subprocess_exec`)

**Error Handling**:
```python
try:
    result = await service.operation()
except CalledProcessError as e:
    raise HTTPException(status_code=500, detail=f"Shell command failed: {e}")
```

## Shell Command Integration

When calling spark-vllm-docker scripts:
- Use `asyncio.create_subprocess_exec` for non-blocking execution
- Capture stdout/stderr for logging and parsing
- Sanitize all user inputs before shell interpolation
- Validate model IDs with regex: `^[\w\-/]+$`

## Environment Variables

Required (see .env.example):
- `SPARK_DOCKER_PATH`: Path to spark-vllm-docker repository
- `CONTAINER_NAME`: Docker container name (default: vllm_node)
- `HEAD_NODE_IP`: Dashboard host IP for CORS
- `VLLM_PORT`: vLLM server port (default: 8000)
- `API_PORT`: FastAPI port (default: 8080)
- `NEXT_PUBLIC_API_URL`: Frontend API base URL
- `NEXT_PUBLIC_WS_URL`: Frontend WebSocket URL

## Development Workflow

1. **Start services**: `docker compose up -d`
2. **Backend dev**: Run uvicorn in separate terminal
3. **Frontend dev**: Run `npm run dev` in frontend directory
4. **Test single file**: Use specific paths shown above
5. **Type checking**: Run `npm run typecheck` and `python -m pyright`

## Testing Strategy

**Frontend**: React Testing Library with Jest
- Tests: `ComponentName.test.tsx` next to components
- Mock API calls with MSW or simple Jest mocks

**Backend**: pytest with pytest-asyncio
- Tests: `tests/` directory mirroring app structure
- Mock shell commands with `unittest.mock` patches
- WebSocket tests: use `WebSocketTestClient`