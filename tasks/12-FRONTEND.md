# Phase 12: Frontend Development (React + Vite)

**Priority:** CRITICAL (50% of MVP)
**Estimated Time:** 5-6 days
**Dependencies:** Phase 2 (Authentication), Phase 4 (Document Processing), Phase 5 (RAG Chat)
**PRD Reference:** Section 8.2 (Knowledge Base Frontend), Section 8.3 (Chat Interface), Section 16 (Week 5-6)

---

## ⚠️ IMPORTANT GIT RULES (READ FIRST)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Git Workflow:
1. ✅ **ALWAYS** work on `dev` branch (not `main`)
2. ✅ **ALWAYS** run tests before committing (`npm test` / `bun test`)
3. ✅ **ALWAYS** run linting before committing (`biome check`)
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Example: feat(auth): implement login page
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all components** with JSDoc comments
- ✅ **Use TypeScript** for type safety
- ✅ **Follow consistent patterns** across all components
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in this file are for verification only, NOT for code comments.

---

## 12.1 Frontend Project Setup

**PRD Reference:** Section 16 (Week 5-6: Frontend)

### Initialize React + Vite Project
**Directory:** Create `frontend/` at project root

- [ ] Create frontend directory: `mkdir frontend && cd frontend`
- [ ] Initialize Vite project with React + TypeScript
- [ ] Choose package manager: **Bun** (fastest) or npm
- [ ] Configure TypeScript (`tsconfig.json`)
- [ ] Configure Vite (`vite.config.ts`)
- [ ] Add `.gitignore` for node_modules, dist, .env

**Setup Commands:**
```bash
# Using Bun (recommended)
bun create vite frontend --template react-ts

# Using npm (alternative)
npm create vite@latest frontend -- --template react-ts

cd frontend
bun install  # or npm install
```

### Install Dependencies
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Install React Router (routing)
- [ ] Install Axios or Fetch API wrapper (API calls)
- [ ] Install React Query / TanStack Query (data fetching)
- [ ] Install Zustand (state management)
- [ ] Install React Hot Toast (notifications)
- [ ] Install React Dropzone (file upload)
- [ ] Install React Markdown (message formatting)
- [ ] Install date-fns (date utilities)

**Dependencies:**
```bash
# Core UI
bun add tailwindcss @tailwindcss/typography autoprefixer postcss
bun add @radix-ui/react-*  # shadcn/ui dependencies
bun add class-variance-authority clsx tailwind-merge

# Routing & Data
bun add react-router-dom @tanstack/react-query zustand

# UI Components
bun add react-hot-toast react-dropzone react-markdown

# Dev Tools
bun add -D @biomejs/biome
```

### Configure Biome (Linter/Formatter)
- [ ] Initialize Biome: `bunx @biomejs/biome init`
- [ ] Configure `biome.json`
- [ ] Add lint/format scripts to package.json
- [ ] Test linting: `bun run biome check .`
- [ ] Test formatting: `bun run biome format --write .`

### Configure Tailwind CSS
- [ ] Initialize Tailwind: `bunx tailwindcss init -p`
- [ ] Configure `tailwind.config.js`
- [ ] Add Tailwind directives to `src/index.css`
- [ ] Configure shadcn/ui: `bunx shadcn-ui@latest init`
- [ ] Choose theme and color palette

### Environment Variables
**File:** `frontend/.env.example`

- [ ] Create `.env.example` with variables
- [ ] Document API URL configuration
- [ ] Add development/production URLs

```bash
# frontend/.env.example
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=AI Knowledge Base
```

---

## 12.2 Project Structure Setup

**PRD Reference:** React component architecture

### Create Folder Structure
```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, icons
│   ├── components/      # Reusable components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── auth/        # Auth-related components
│   │   ├── documents/   # Document components
│   │   ├── chat/        # Chat components
│   │   └── layout/      # Layout components
│   ├── pages/           # Route pages
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   └── Profile.tsx
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   │   ├── api.ts       # API client
│   │   ├── auth.ts      # Auth utilities
│   │   └── utils.ts     # General utilities
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── .env.example         # Example env file
├── biome.json           # Biome config
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite config
└── package.json         # Dependencies
```

- [ ] Create all directories
- [ ] Create placeholder files
- [ ] Set up index.tsx structure
- [ ] Configure routing structure

---

## 12.3 Authentication UI

**PRD Reference:** Section 8.2 (Frontend), Section 13.1 (JWT Authentication), Section 16 (Week 5-6)

### API Client Setup
**File:** `frontend/src/lib/api.ts`

- [ ] Create Axios instance with base URL
- [ ] Add request interceptor (inject JWT token)
- [ ] Add response interceptor (handle 401, refresh token)
- [ ] Export API methods (login, register, refresh, etc.)

### Auth Store (Zustand)
**File:** `frontend/src/store/authStore.ts`

- [ ] Create auth store (user, token, isAuthenticated)
- [ ] Add login action
- [ ] Add logout action
- [ ] Add token refresh logic
- [ ] Persist auth state to localStorage

### Login Page
**File:** `frontend/src/pages/Login.tsx`
**PRD Reference:** Section 9.6 (POST /api/v1/auth/login)

- [ ] Create login form (email, password)
- [ ] Add form validation (Zod or React Hook Form)
- [ ] Add submit handler (call login API)
- [ ] Show loading state during submission
- [ ] Handle errors (invalid credentials, network error)
- [ ] Redirect to dashboard on success
- [ ] Add "Forgot Password?" link
- [ ] Add "Register" link

**UI Mockup (PRD Section 8.2):**
```
┌────────────────────────────────┐
│   🤖 AI Knowledge Base          │
├────────────────────────────────┤
│                                 │
│  Email:                         │
│  [__________________________]  │
│                                 │
│  Password:                      │
│  [__________________________]  │
│                                 │
│  [x] Remember me                │
│                                 │
│  [       Login       ]          │
│                                 │
│  Forgot password?               │
│  Don't have an account? Register│
└────────────────────────────────┘
```

### Register Page
**File:** `frontend/src/pages/Register.tsx`
**PRD Reference:** Section 9.6 (POST /api/v1/auth/register)

- [ ] Create registration form (email, password, invite code)
- [ ] Add password strength indicator
- [ ] Validate invite code format (KB-XXXX-XXXX-XXXX)
- [ ] Add submit handler (call register API)
- [ ] Show loading state
- [ ] Handle errors (weak password, invalid invite, duplicate email)
- [ ] Redirect to dashboard on success
- [ ] Add "Already have an account? Login" link

### Password Reset Flow
**Files:** `frontend/src/pages/ForgotPassword.tsx`, `ResetPassword.tsx`
**PRD Reference:** Section 9.7 (Password Reset)

- [ ] Create forgot password page (email input)
- [ ] Submit email to request reset
- [ ] Show success message
- [ ] Create reset password page (token from URL, new password)
- [ ] Validate password strength
- [ ] Submit reset request
- [ ] Redirect to login on success

### Protected Route Component
**File:** `frontend/src/components/ProtectedRoute.tsx`

- [ ] Create ProtectedRoute component
- [ ] Check authentication state
- [ ] Redirect to login if not authenticated
- [ ] Wrap protected pages with this component

---

## 12.4 Knowledge Base Dashboard

**PRD Reference:** Section 8.2 (Knowledge Base Management Frontend)

### Dashboard Layout
**File:** `frontend/src/pages/Dashboard.tsx`

- [ ] Create dashboard layout
- [ ] Add sidebar navigation
- [ ] Add top stats bar (total documents, chunks, storage)
- [ ] Add collections sidebar
- [ ] Add document list view
- [ ] Add search and filter bar
- [ ] Make responsive for mobile

**Stats Component:**
**File:** `frontend/src/components/documents/StatsBar.tsx`

- [ ] Fetch user stats from API
- [ ] Display total documents
- [ ] Display total chunks
- [ ] Display storage used (progress bar)
- [ ] Show storage quota limit

### Document Upload Interface
**File:** `frontend/src/components/documents/UploadZone.tsx`
**PRD Reference:** Section 8.2 (Document Upload Interface)

- [ ] Create drag-and-drop zone (react-dropzone)
- [ ] Add file type validation (PDF, DOCX, TXT, MD)
- [ ] Add file size validation (50MB max)
- [ ] Show file preview before upload
- [ ] Add collection selector dropdown
- [ ] Add tag input (optional)
- [ ] Add upload progress bar
- [ ] Handle upload errors (file too large, invalid format)
- [ ] Show success message with chunk count

**Upload Flow UI (PRD Section 8.2 lines 690-753):**
1. Drag & drop zone
2. File preview with metadata
3. Upload progress
4. Success confirmation

### Document List Component
**File:** `frontend/src/components/documents/DocumentList.tsx`

- [ ] Fetch documents from API (GET /api/v1/documents)
- [ ] Display documents in list/grid view
- [ ] Show document metadata (name, size, chunks, date)
- [ ] Add pagination (50 per page)
- [ ] Add loading skeleton
- [ ] Add empty state (no documents yet)
- [ ] Add click handler to view document details

### Document Detail View
**File:** `frontend/src/pages/DocumentDetail.tsx`
**PRD Reference:** Section 8.2 (Document Viewer & Management)

- [ ] Fetch document details (GET /api/v1/documents/{id})
- [ ] Display metadata (uploaded date, size, chunks)
- [ ] Show chunk preview (first 5 chunks)
- [ ] Add "Show all chunks" button
- [ ] Add edit tags button
- [ ] Add change collection button
- [ ] Add delete button (with confirmation)
- [ ] Add back to dashboard button

### Collections Management
**File:** `frontend/src/components/documents/Collections.tsx`
**PRD Reference:** Section 8.2 (Collections/Namespaces Management)

- [ ] Fetch collections (GET /api/v1/collections)
- [ ] Display collection list with document count
- [ ] Add "Create Collection" button and modal
- [ ] Add rename collection functionality
- [ ] Add delete collection (with confirmation)
- [ ] Add collection filter (click to filter documents)
- [ ] Show active collection highlight

### Search & Filter
**File:** `frontend/src/components/documents/SearchFilter.tsx`
**PRD Reference:** Section 8.2 (Search & Filter Documents)

- [ ] Add search input (filter by name)
- [ ] Add collection filter dropdown
- [ ] Add file type filter
- [ ] Add date range filter
- [ ] Add sort options (name, date, size)
- [ ] Update document list on filter change
- [ ] Add clear filters button

### Batch Operations
**File:** `frontend/src/components/documents/BatchActions.tsx`
**PRD Reference:** Section 8.2 (Batch Operations)

- [ ] Add checkbox for each document
- [ ] Add "Select All" checkbox
- [ ] Add "Delete Selected" button
- [ ] Add "Move to Collection" button
- [ ] Add confirmation dialog for batch delete
- [ ] Show progress indicator during batch operations

---

## 12.5 Chat Interface

**PRD Reference:** Section 8.3 (Chat Interface)

### Chat Page Layout
**File:** `frontend/src/pages/Chat.tsx`

- [ ] Create chat page layout
- [ ] Add conversation sidebar (left)
- [ ] Add chat window (center)
- [ ] Add collection filter dropdown
- [ ] Make responsive for mobile

### Conversation Sidebar
**File:** `frontend/src/components/chat/ConversationSidebar.tsx`

- [ ] Fetch conversations (GET /api/v1/conversations)
- [ ] Display conversation list
- [ ] Show last message preview
- [ ] Add "New Conversation" button
- [ ] Add active conversation highlight
- [ ] Add delete conversation button
- [ ] Add conversation date grouping (Today, Yesterday, Last 7 days)

### Chat Window
**File:** `frontend/src/components/chat/ChatWindow.tsx`
**PRD Reference:** Section 8.3 (Chat Interface)

- [ ] Display message history
- [ ] Add message input (textarea with auto-resize)
- [ ] Add send button (Enter to send, Shift+Enter for newline)
- [ ] Show typing indicator during response
- [ ] Handle empty knowledge base (show upload prompt)
- [ ] Add clear conversation button
- [ ] Auto-scroll to latest message

### Message Components
**File:** `frontend/src/components/chat/Message.tsx`

- [ ] Create user message component (right-aligned)
- [ ] Create assistant message component (left-aligned, formatted)
- [ ] Add timestamp to messages
- [ ] Add copy message button
- [ ] Format markdown in assistant messages
- [ ] Add loading skeleton for incoming message

### Source Citations
**File:** `frontend/src/components/chat/SourceCitation.tsx`
**PRD Reference:** Section 8.3 (Feature: Response Quality)

- [ ] Display source documents below answer
- [ ] Show document name and relevance score
- [ ] Add click handler to view document
- [ ] Show chunk preview on hover
- [ ] Add "View all sources" expansion

**Citation UI:**
```
┌──────────────────────────────────────┐
│  📚 Sources (3):                     │
│                                       │
│  • refund_policy.pdf (Score: 0.92)  │
│    "Our refund policy allows..."     │
│                                       │
│  • faq.txt (Score: 0.85)             │
│    "To request a refund..."          │
│                                       │
│  • policies.docx (Score: 0.78)       │
│    "Refunds are processed..."        │
└──────────────────────────────────────┘
```

### Collection Filter
**File:** `frontend/src/components/chat/CollectionFilter.tsx`

- [ ] Add collection dropdown in chat interface
- [ ] Fetch user collections
- [ ] Add "All Collections" option
- [ ] Pass selected collection to chat API
- [ ] Show active filter indicator

---

## 12.6 User Profile Page

**PRD Reference:** Section 16 (Week 5-6: Build user profile page)

**File:** `frontend/src/pages/Profile.tsx`

### Profile Information
- [ ] Display user email (read-only)
- [ ] Display user role
- [ ] Display account creation date
- [ ] Display storage usage (progress bar)
- [ ] Display storage quota

### Change Password
- [ ] Add change password form
- [ ] Validate current password
- [ ] Validate new password strength
- [ ] Submit password change
- [ ] Show success/error message

### Danger Zone
- [ ] Add delete account button (future feature)
- [ ] Add logout button (revoke all sessions)

---

## 12.7 Error Handling & UX

**PRD Reference:** Section 8.4 (Error Handling & User Experience)

### Toast Notifications
**File:** `frontend/src/lib/toast.ts`

- [ ] Configure react-hot-toast
- [ ] Create success toast helper
- [ ] Create error toast helper
- [ ] Create warning toast helper
- [ ] Create loading toast helper

### Error Boundary
**File:** `frontend/src/components/ErrorBoundary.tsx`

- [ ] Create error boundary component
- [ ] Show user-friendly error message
- [ ] Add "Reload Page" button
- [ ] Log errors to console (dev) or Sentry (prod)

### Loading States
- [ ] Add loading skeletons for all data fetching
- [ ] Add spinner for button actions
- [ ] Add progress bars for file uploads
- [ ] Add typing indicator for chat responses

### Empty States
- [ ] Empty knowledge base (show upload prompt)
- [ ] No conversations yet (show start chat prompt)
- [ ] No search results (show suggestions)
- [ ] No documents in collection (show add prompt)

### Error Messages (PRD Section 8.4)
**Implement all error types:**
- [ ] File too large (>50MB)
- [ ] Unsupported file format
- [ ] Document processing failed
- [ ] Rate limit exceeded (show countdown)
- [ ] No results found
- [ ] LLM timeout
- [ ] Network errors
- [ ] Connection lost

**Error Message Standards (PRD Section 8.4 line 982):**
- Never show raw error messages
- Always provide next action (retry, contact support, etc.)
- User-friendly language

---

## 12.8 Routing & Navigation

**File:** `frontend/src/App.tsx`

### Configure React Router
- [ ] Install react-router-dom
- [ ] Set up BrowserRouter
- [ ] Define routes
- [ ] Add 404 page
- [ ] Add navigation guards (protected routes)

**Routes:**
```typescript
/login               → Login page (public)
/register            → Register page (public)
/forgot-password     → Forgot password (public)
/reset-password/:token → Reset password (public)
/dashboard           → Knowledge base dashboard (protected)
/chat                → Chat interface (protected)
/documents/:id       → Document detail (protected)
/profile             → User profile (protected)
/admin               → Admin panel (protected, admin only)
```

### Navigation Component
**File:** `frontend/src/components/layout/Navbar.tsx`

- [ ] Create navbar component
- [ ] Add logo and app name
- [ ] Add navigation links (Dashboard, Chat, Profile)
- [ ] Add user menu dropdown
- [ ] Add logout button
- [ ] Make responsive with hamburger menu

---

## 12.9 API Integration

**File:** `frontend/src/lib/api.ts`

### Auth API Methods
- [ ] POST /api/v1/auth/register
- [ ] POST /api/v1/auth/login
- [ ] POST /api/v1/auth/refresh
- [ ] POST /api/v1/auth/logout
- [ ] POST /api/v1/auth/password-reset/request
- [ ] POST /api/v1/auth/password-reset/confirm

### Document API Methods
- [ ] GET /api/v1/documents (list with filters)
- [ ] POST /api/v1/documents/upload
- [ ] GET /api/v1/documents/{id}
- [ ] PATCH /api/v1/documents/{id}
- [ ] DELETE /api/v1/documents/{id}
- [ ] POST /api/v1/documents/{id}/retry

### Collection API Methods
- [ ] GET /api/v1/collections
- [ ] POST /api/v1/collections
- [ ] PATCH /api/v1/collections/{id}
- [ ] DELETE /api/v1/collections/{id}

### Chat API Methods
- [ ] POST /api/v1/chat
- [ ] GET /api/v1/conversations
- [ ] GET /api/v1/conversations/{id}
- [ ] DELETE /api/v1/conversations/{id}

### User API Methods
- [ ] GET /api/v1/users/me
- [ ] PATCH /api/v1/users/me

---

## 12.10 TypeScript Types

**File:** `frontend/src/types/index.ts`

### Define Type Interfaces
- [ ] User type
- [ ] Document type
- [ ] Collection type
- [ ] Conversation type
- [ ] Message type
- [ ] API response types
- [ ] Error response type

**Example Types:**
```typescript
export interface User {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
  storage_used_bytes: number;
  storage_quota_bytes: number;
  created_at: string;
}

export interface Document {
  document_id: string;
  filename: string;
  file_size_bytes: number;
  storage_key: string;
  status: 'pending' | 'processing' | 'active' | 'error' | 'deleted';
  chunk_count: number;
  uploaded_at: string;
  collection_id?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
}
```

---

## ✅ Phase 12 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check with PRD Section 8.2** (Knowledge Base UI)
- [ ] **Cross-check with PRD Section 8.3** (Chat Interface)
- [ ] **Cross-check with PRD Section 16** (Week 5-6 deliverables)
- [ ] **Verify all authentication flows work** (register, login, password reset)
- [ ] **Test data isolation** (user can only see their own data)

Before considering frontend complete, verify:
- [ ] All pages are responsive (mobile, tablet, desktop)
- [ ] Authentication works (login, register, JWT storage, refresh)
- [ ] Document upload works (drag-drop, multi-file, progress)
- [ ] Document list displays correctly
- [ ] Collections can be created and managed
- [ ] Chat interface works (send query, receive response, sources)
- [ ] Error handling is user-friendly (no raw errors)
- [ ] Loading states are shown for all async operations
- [ ] Empty states guide users (no documents, no conversations)
- [ ] Navigation works (all routes accessible)
- [ ] Protected routes redirect to login
- [ ] Forms have validation
- [ ] API integration complete (all endpoints working)
- [ ] TypeScript types are defined
- [ ] Linting passes (biome check)
- [ ] Build succeeds (bun run build)
- [ ] Production build tested

**MVP Deliverables (PRD Section 16 lines 9908-9916):**
- [x] User authentication system (invite-only registration)
- [ ] Working chat with knowledge base
- [ ] Upload and query documents
- [ ] Collections for document organization
- [ ] User profile management
- [ ] Knowledge base dashboard with document management
- [ ] Modern React UI with responsive design
- [ ] Data isolation enforced (SEC-001)

**Frontend Completeness:** ⬜ Not Started / ⬜ In Progress / ⬜ Complete

---

**Next Phase:** Phase 13 - Migration & Re-indexing Strategy (Optional)
