# Ragify

A production RAG (Retrieval-Augmented Generation) app for chatting with your own documents. Upload files, they're chunked and embedded into a vector store, then ask questions and get context-grounded, streamed answers with source citations.

**Live app:** [ragifyai.netlify.app](https://ragifyai.netlify.app/)

## Features

- Document upload (PDF, DOCX, TXT, MD) with chunking and automatic embedding
- Semantic search over your documents via Milvus, with per-user isolation
- Streaming RAG chat with source citations and conversation history
- Collections to organize documents
- JWT auth (access + refresh tokens), invite-code registration, admin panel

## Tech Stack

**Backend:** FastAPI, SQLModel, PostgreSQL, Milvus, Redis, arq, Google Gemini, uv
**Frontend:** React, TypeScript, Vite, Bun, Tailwind, shadcn/ui, Zustand, React Query
**Infra:** Docker, Alembic migrations, Backblaze B2 for file storage

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env        # configure environment variables
uv sync
uv run uvicorn main:app --reload
```

API docs at `http://localhost:8000/docs`. See [backend/README.md](backend/README.md) for full setup, testing, and API reference.

### Frontend

```bash
cd frontend
bun install
cp .env.example .env
bun run dev
```

Runs at `http://localhost:5173`.

## Project Structure

```
.
├── backend/    # FastAPI backend (see backend/README.md)
├── frontend/   # React frontend
└── docs/       # Product requirements
```
