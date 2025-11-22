# AI Knowledge Base Chat System

A production-ready RAG (Retrieval-Augmented Generation) application that enables intelligent document interaction through AI-powered chat. Built with FastAPI, Milvus vector database, and Google Gemini LLM.

## 🎯 Overview

This system allows users to upload documents, which are automatically processed, chunked, and embedded into a vector database. Users can then chat with their knowledge base using natural language queries, with the AI providing contextually relevant answers based on their documents.

## 🏗️ Architecture

- **Backend**: FastAPI + SQLModel + PostgreSQL + Milvus + Redis
- **Frontend**: Coming soon
- **Storage**: Backblaze B2 for files, Milvus for vector embeddings
- **AI**: Google Gemini (text-embedding-004 for embeddings, gemini-pro for chat)

## 📁 Project Structure

```
.
├── backend/           # FastAPI backend service (see backend/README.md)
├── frontend/          # Coming soon
├── docs/             # Project documentation
│   └── PRD.md        # Product Requirements Document
├── tasks/            # Development task tracking
└── CLAUDE.md         # Development guidelines
```

## 🚀 Quick Start

### Backend Setup

For detailed backend setup and development instructions, see [backend/README.md](backend/README.md)

**Quick commands:**

```bash
cd backend
cp .env.example .env        # Configure environment variables
uv sync                     # Install dependencies
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Documentation: http://localhost:8000/docs

### Frontend Setup

Coming soon.

## ✨ Key Features

### Authentication & User Management
- ✅ Secure registration with invite codes
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Password reset via email
- ✅ User profile management
- ✅ Storage quota tracking (1GB per user)

### Document Management
- ✅ File upload with validation (50MB max)
- ✅ Document chunking (1000 chars, 200 char overlap)
- ✅ Automatic embedding generation
- ✅ Storage on Backblaze B2
- ✅ Presigned URL downloads

### Vector Search & RAG
- ✅ Milvus vector database integration
- ✅ Semantic search with user isolation
- ✅ RAG chat with context retrieval
- ⏳ Multi-document chat (Phase 5)
- ⏳ Chat history management (Phase 5)

### Admin Features
- ✅ Invite code generation and management
- ✅ User management
- ⏳ System statistics (Phase 7)
- ⏳ Usage analytics (Phase 7)

## 📚 Documentation

- **[PRD](docs/PRD.md)** - Complete product requirements and specifications
- **[Backend README](backend/README.md)** - Backend setup and API documentation
- **[Tasks](tasks/)** - Development progress tracking by phase
- **[CLAUDE.md](CLAUDE.md)** - Development workflow and guidelines

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM**: SQLModel (async)
- **Database**: PostgreSQL 16
- **Vector DB**: Milvus
- **Cache**: Redis
- **Storage**: Backblaze B2
- **AI**: Google Gemini API
- **Email**: Resend
- **Task Queue**: arq (Redis-based)
- **Package Manager**: uv

### Infrastructure
- **Deployment**: Docker Compose
- **Migrations**: Alembic
- **Testing**: pytest
- **Linting**: ruff

## 📊 Development Status

### Completed Phases
- ✅ **Phase 1**: Core Models (Users, Documents, Chunks)
- ✅ **Phase 2**: Authentication (Register, Login, Password Reset)
- ✅ **Phase 3**: Storage Services (B2, Milvus, Embeddings)

### In Progress
- 🔄 **Phase 4**: Document Processing (Upload, Chunking, Embedding)

### Upcoming
- ⏳ **Phase 5**: RAG Chat System
- ⏳ **Phase 6**: Email Service Integration
- ⏳ **Phase 7**: Admin Features
- ⏳ **Phase 8**: Testing & Deployment

See [tasks/](tasks/) for detailed progress tracking.

## 🔐 Security Features

- Argon2 password hashing
- JWT token authentication with blocklist
- User data isolation (all queries filtered by user_id)
- Secure invite code system (KB-XXXX-XXXX-XXXX format)
- File upload validation and sanitization
- Rate limiting on API endpoints

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/password-reset/request` - Request password reset
- `POST /api/v1/auth/password-reset/confirm` - Confirm password reset

### Documents (Coming in Phase 4)
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents` - List user documents
- `GET /api/v1/documents/{id}` - Get document details
- `DELETE /api/v1/documents/{id}` - Delete document
- `GET /api/v1/documents/{id}/download` - Download document

### Chat (Coming in Phase 5)
- `POST /api/v1/chat` - Send chat message
- `GET /api/v1/chat/history` - Get chat history
- `DELETE /api/v1/chat/history/{id}` - Delete chat history

### Admin
- `POST /api/v1/admin/invite-codes` - Generate invite codes
- `GET /api/v1/admin/invite-codes` - List invite codes
- `PATCH /api/v1/admin/invite-codes/{code}/deactivate` - Deactivate code

Full API documentation available at `/docs` when running the server.

## 🧪 Testing

```bash
cd backend
uv run pytest                    # Run all tests
uv run pytest -v                 # Verbose output
uv run pytest --cov=app          # With coverage
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

Haidar Abbas - [@Haidarabbas731](https://github.com/Haidarabbas731)

Project Link: [https://github.com/Haidarabbas731/Ai-Knowledge-Base](https://github.com/Haidarabbas731/Ai-Knowledge-Base)

---

**Note**: This project is under active development. See [tasks/](tasks/) for current progress and upcoming features.
