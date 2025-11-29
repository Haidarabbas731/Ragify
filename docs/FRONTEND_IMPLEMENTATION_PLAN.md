# Frontend Implementation Plan

**Duration:** 22 days
**Approach:** Vertical slices (complete each feature end-to-end)
**Checkpoints:** Day 9 (MVP), Day 15 (UX), Day 22 (Production)

---

## Phase 1: MVP (Days 1-9)

### Day 1: Project Setup & Foundation

**Goal:** Complete project initialization with all tooling configured

**Tasks:**
1. Initialize Vite + React + TypeScript project
   ```bash
   cd frontend
   bun create vite . --template react-ts
   bun install
   ```

2. Install core dependencies
   ```bash
   # UI & Styling
   bun add tailwindcss postcss autoprefixer
   bunx tailwindcss init -p
   bun add class-variance-authority clsx tailwind-merge
   bun add lucide-react

   # State & Data
   bun add zustand
   bun add @tanstack/react-query
   bun add axios

   # Routing
   bun add react-router-dom

   # Forms
   bun add react-hook-form @hookform/resolvers zod

   # UI Components (shadcn/ui setup)
   bunx shadcn-ui@latest init

   # Markdown & Syntax Highlighting
   bun add react-markdown remark-gfm rehype-highlight highlight.js

   # Utilities
   bun add date-fns

   # Dev Dependencies
   bun add -D @types/node
   bun add -D @biomejs/biome
   ```

3. Configure Biome linter
   ```bash
   bunx @biomejs/biome init
   ```

   Update `biome.json`:
   ```json
   {
     "linter": {
       "enabled": true,
       "rules": {
         "recommended": true
       }
     },
     "formatter": {
       "enabled": true,
       "indentStyle": "space",
       "indentWidth": 2
     }
   }
   ```

4. Setup Tailwind CSS configuration
   ```typescript
   // tailwind.config.js
   export default {
     darkMode: 'class',
     content: [
       "./index.html",
       "./src/**/*.{js,ts,jsx,tsx}",
     ],
     theme: {
       extend: {},
     },
     plugins: [],
   }
   ```

5. Create environment files
   ```bash
   # frontend/.env.example
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_APP_NAME=AI Knowledge Base

   # Copy to .env
   cp .env.example .env
   ```

6. Setup folder structure
   ```
   src/
   ├── components/
   │   ├── ui/              # shadcn/ui components
   │   ├── auth/            # Auth-related components
   │   ├── chat/            # Chat interface components
   │   ├── documents/       # Document management components
   │   └── layout/          # Layout components (Header, Sidebar)
   ├── pages/
   │   ├── LoginPage.tsx
   │   ├── RegisterPage.tsx
   │   ├── DashboardPage.tsx
   │   ├── ChatPage.tsx
   │   ├── ProfilePage.tsx
   │   └── AdminPage.tsx
   ├── hooks/               # Custom React hooks
   ├── lib/
   │   ├── api.ts          # Axios client
   │   ├── auth.ts         # Auth utilities
   │   └── utils.ts        # Helper functions
   ├── store/
   │   ├── authStore.ts    # Zustand auth store
   │   └── themeStore.ts   # Dark mode store
   ├── types/
   │   └── api.ts          # TypeScript interfaces
   ├── App.tsx
   └── main.tsx
   ```

7. Install shadcn/ui components
   ```bash
   bunx shadcn-ui@latest add button input label card toast
   ```

**Checklist:**
- [ ] Vite project created
- [ ] All dependencies installed
- [ ] Biome configured
- [ ] Tailwind CSS setup
- [ ] Environment variables configured
- [ ] Folder structure created
- [ ] shadcn/ui components installed
- [ ] `bun run dev` starts successfully
- [ ] `bun run biome check .` passes

**Frontend-Design Skill:** Not needed (tooling setup only)

---

### Days 2-3: Authentication System

**Goal:** Complete auth flow with login, register, password reset, token management

**Day 2 Tasks:**

1. Create TypeScript types (`src/types/api.ts`)
   ```typescript
   export interface LoginRequest {
     email: string
     password: string
   }

   export interface RegisterRequest {
     email: string
     password: string
     invite_code: string
   }

   export interface TokenResponse {
     access_token: string
     refresh_token: string
     token_type: 'bearer'
     expires_in: number // 3600
   }

   export interface User {
     user_id: string
     email: string
     role: 'user' | 'admin'
     status: string
     storage_used_bytes: number
     storage_limit_bytes: number
     created_at: string
     last_login_at: string | null
     invited_by_code: string | null
     invited_at: string
     is_active: boolean
   }
   ```

2. Setup Axios client (`src/lib/api.ts`)
   ```typescript
   import axios from 'axios'
   import { useAuthStore } from '../store/authStore'

   const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
   })

   // Request interceptor: Add token
   api.interceptors.request.use((config) => {
     const token = useAuthStore.getState().token
     if (token) {
       config.headers.Authorization = `Bearer ${token}`
     }
     return config
   })

   // Response interceptor: Handle 401, refresh token
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       const originalRequest = error.config

       if (error.response?.status === 401 && !originalRequest._retry) {
         originalRequest._retry = true

         const refreshToken = useAuthStore.getState().refreshToken
         if (!refreshToken) {
           useAuthStore.getState().logout()
           return Promise.reject(error)
         }

         try {
           const { data } = await axios.post(
             `${import.meta.env.VITE_API_URL}/auth/refresh`,
             { refresh_token: refreshToken }
           )

           useAuthStore.getState().setTokens(data.access_token, data.refresh_token)
           originalRequest.headers.Authorization = `Bearer ${data.access_token}`
           return api(originalRequest)
         } catch (refreshError) {
           useAuthStore.getState().logout()
           return Promise.reject(refreshError)
         }
       }

       return Promise.reject(error)
     }
   )

   export default api
   ```

3. Create auth Zustand store (`src/store/authStore.ts`)
   ```typescript
   import { create } from 'zustand'
   import { persist } from 'zustand/middleware'
   import type { User } from '../types/api'

   interface AuthState {
     token: string | null
     refreshToken: string | null
     user: User | null
     isAuthenticated: boolean

     setTokens: (accessToken: string, refreshToken: string) => void
     setUser: (user: User) => void
     logout: () => void
   }

   export const useAuthStore = create<AuthState>()(
     persist(
       (set) => ({
         token: null,
         refreshToken: null,
         user: null,
         isAuthenticated: false,

         setTokens: (accessToken, refreshToken) => set({
           token: accessToken,
           refreshToken,
           isAuthenticated: true,
         }),

         setUser: (user) => set({ user }),

         logout: () => set({
           token: null,
           refreshToken: null,
           user: null,
           isAuthenticated: false,
         }),
       }),
       {
         name: 'auth-storage',
       }
     )
   )
   ```

**Day 3 Tasks:**

4. Create LoginPage (`src/pages/LoginPage.tsx`)
   - Use frontend-design skill with prompt:
     ```
     Create a modern login page for an AI Knowledge Base application.
     Include email/password form, "Forgot Password?" link, and "Sign Up" link.
     Use shadcn/ui components (Card, Input, Button, Label).
     Professional design with subtle gradients and clean layout.
     ```

5. Create RegisterPage (`src/pages/RegisterPage.tsx`)
   - Use frontend-design skill with prompt:
     ```
     Create a registration page for invite-only signup.
     Include email, password, confirm password, and invite code (KB-XXXX-XXXX-XXXX format) fields.
     Show password strength indicator.
     Use shadcn/ui components.
     Match LoginPage design aesthetic.
     ```

6. Create PasswordResetPage (`src/pages/PasswordResetPage.tsx`)
   - 2-step flow: Request reset → Email sent → Confirm with token
   - Use frontend-design skill

7. Setup React Router (`src/App.tsx`)
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
   import { useAuthStore } from './store/authStore'

   function ProtectedRoute({ children }: { children: React.ReactNode }) {
     const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
     return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
   }

   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/login" element={<LoginPage />} />
           <Route path="/register" element={<RegisterPage />} />
           <Route path="/reset-password" element={<PasswordResetPage />} />

           <Route path="/dashboard" element={
             <ProtectedRoute><DashboardPage /></ProtectedRoute>
           } />
           <Route path="/chat" element={
             <ProtectedRoute><ChatPage /></ProtectedRoute>
           } />

           <Route path="/" element={<Navigate to="/dashboard" />} />
         </Routes>
       </BrowserRouter>
     )
   }
   ```

**Checklist:**
- [ ] TypeScript types defined
- [ ] Axios client with interceptors
- [ ] Zustand auth store
- [ ] LoginPage implemented
- [ ] RegisterPage implemented
- [ ] PasswordResetPage implemented
- [ ] Protected routes working
- [ ] Token refresh on 401
- [ ] Login/logout flow tested manually
- [ ] `bun run biome check .` passes

---

### Days 4-5: Document Management

**Goal:** Complete document upload, listing, detail view, and CRUD operations

**Day 4 Tasks:**

1. Create document types (`src/types/api.ts`)
   ```typescript
   export interface Document {
     document_id: string
     filename: string
     file_type: string
     size_bytes: number
     storage_key: string
     status: 'processing' | 'active' | 'error' | 'deleted'
     chunks_count: number
     doc_metadata: {
       category?: string
       tags?: string[]
     }
     error_message: string | null
     uploaded_at: string
     processed_at: string | null
     deleted_at: string | null
     collection_id: string | null
   }

   export interface DocumentUploadRequest {
     file: File
     collection_id?: string
     metadata?: {
       category?: string
       tags?: string[]
     }
   }
   ```

2. Create DocumentUpload component (`src/components/documents/DocumentUpload.tsx`)
   - Drag-and-drop zone
   - File type validation (PDF, TXT, MD, DOCX)
   - Size validation (50MB max)
   - Progress bar during upload
   - Storage quota warning if >90%
   - Use frontend-design skill with prompt:
     ```
     Create a modern file upload component with drag-and-drop.
     Show file type icons, size, and upload progress.
     Include storage quota progress bar with color coding (green <70%, yellow 70-90%, red >90%).
     Display validation errors inline.
     Use shadcn/ui components.
     ```

3. Create API hooks (`src/hooks/useDocuments.ts`)
   ```typescript
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
   import api from '../lib/api'
   import type { Document } from '../types/api'

   export function useDocuments() {
     return useQuery({
       queryKey: ['documents'],
       queryFn: async () => {
         const { data } = await api.get<Document[]>('/documents')
         return data
       },
     })
   }

   export function useUploadDocument() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async (formData: FormData) => {
         const { data } = await api.post('/documents', formData, {
           headers: { 'Content-Type': 'multipart/form-data' },
         })
         return data
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['documents'] })
       },
     })
   }

   export function useDeleteDocument() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async (documentId: string) => {
         await api.delete(`/documents/${documentId}`)
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['documents'] })
       },
     })
   }
   ```

**Day 5 Tasks:**

4. Create DocumentList component (`src/components/documents/DocumentList.tsx`)
   - Table view with columns: filename, type, size, status, uploaded_at
   - Status badges (processing: spinner, active: green, error: red with retry button)
   - Filter by status, collection
   - Sort by date, name, size
   - Batch selection for delete
   - Use frontend-design skill

5. Create DocumentDetail component (`src/components/documents/DocumentDetail.tsx`)
   - Show metadata, chunks count, processing time
   - Edit metadata (category, tags)
   - Retry button for failed documents
   - Delete confirmation dialog
   - Use frontend-design skill

6. Create DashboardPage (`src/pages/DashboardPage.tsx`)
   - Layout with sidebar navigation
   - DocumentUpload component
   - DocumentList component
   - Storage quota display
   - Use frontend-design skill with prompt:
     ```
     Create a dashboard layout with sidebar navigation (Dashboard, Documents, Collections, Chat, Profile).
     Main content area shows document upload and list.
     Include header with app name, user menu, dark mode toggle placeholder.
     Clean, modern design with proper spacing.
     ```

**Checklist:**
- [ ] Document types defined
- [ ] DocumentUpload component
- [ ] useDocuments hooks
- [ ] DocumentList component
- [ ] DocumentDetail component
- [ ] DashboardPage layout
- [ ] Upload validation working
- [ ] Storage quota display
- [ ] Status badges rendering correctly
- [ ] Retry failed documents
- [ ] Delete confirmation
- [ ] `bun run biome check .` passes

---

### Day 6: Collections Management

**Goal:** Complete collection CRUD operations

**Tasks:**

1. Create collection types (`src/types/api.ts`)
   ```typescript
   export interface Collection {
     collection_id: string
     name: string
     description: string | null
     document_count: number
     created_at: string
     updated_at: string
   }

   export interface CreateCollectionRequest {
     name: string
     description?: string
   }
   ```

2. Create API hooks (`src/hooks/useCollections.ts`)
   ```typescript
   export function useCollections() {
     return useQuery({
       queryKey: ['collections'],
       queryFn: async () => {
         const { data } = await api.get<Collection[]>('/collections')
         return data
       },
     })
   }

   export function useCreateCollection() {
     const queryClient = useQueryClient()

     return useMutation({
       mutationFn: async (payload: CreateCollectionRequest) => {
         const { data } = await api.post('/collections', payload)
         return data
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['collections'] })
       },
     })
   }
   ```

3. Create CollectionList component
   - Card grid view
   - Show name, description, document_count
   - Create new collection button
   - Edit/delete actions
   - Use frontend-design skill

4. Create CollectionDetail component
   - Show documents in collection
   - Add/remove documents
   - Edit collection name/description
   - Use frontend-design skill

5. Add Collections page to router

**Checklist:**
- [ ] Collection types defined
- [ ] useCollections hooks
- [ ] CollectionList component
- [ ] CollectionDetail component
- [ ] Create collection modal
- [ ] Edit/delete collections
- [ ] Filter documents by collection
- [ ] `bun run biome check .` passes

---

### Days 7-8: Basic Chat Interface

**Goal:** Working chat with SSE streaming, message history, conversation management

**Day 7 Tasks:**

1. Create chat types (`src/types/api.ts`)
   ```typescript
   export interface Message {
     message_id: string
     role: 'user' | 'assistant'
     content: string
     timestamp: string
   }

   export interface Conversation {
     conversation_id: string
     title: string
     message_count: number
     created_at: string
     updated_at: string
   }

   export interface ChatRequest {
     query: string
     conversation_id?: string
     collection_ids?: string[]
     stream?: boolean
   }

   export interface ChatResponse {
     conversation_id: string
     message_id: string
     response: string
     sources?: Array<{
       document_id: string
       filename: string
       chunk_text: string
       score: number
     }>
   }
   ```

2. Create SSE streaming hook (`src/hooks/useChat.ts`)
   ```typescript
   import { useState } from 'react'

   export function useChatStream() {
     const [isStreaming, setIsStreaming] = useState(false)
     const [streamedContent, setStreamedContent] = useState('')

     const sendMessage = async (
       query: string,
       conversationId?: string,
       onChunk?: (chunk: string) => void,
       onComplete?: (response: string) => void
     ) => {
       setIsStreaming(true)
       setStreamedContent('')

       const token = useAuthStore.getState().token
       const url = new URL(`${import.meta.env.VITE_API_URL}/chat`)
       url.searchParams.set('query', query)
       url.searchParams.set('stream', 'true')
       if (conversationId) url.searchParams.set('conversation_id', conversationId)

       const eventSource = new EventSource(url.toString(), {
         headers: { Authorization: `Bearer ${token}` },
       })

       let fullResponse = ''

       eventSource.onmessage = (event) => {
         const data = JSON.parse(event.data)

         if (data.done) {
           eventSource.close()
           setIsStreaming(false)
           onComplete?.(fullResponse)
         } else {
           fullResponse += data.chunk
           setStreamedContent(fullResponse)
           onChunk?.(data.chunk)
         }
       }

       eventSource.onerror = () => {
         eventSource.close()
         setIsStreaming(false)
       }

       return eventSource
     }

     return { sendMessage, isStreaming, streamedContent }
   }
   ```

**Day 8 Tasks:**

3. Create ChatMessage component (`src/components/chat/ChatMessage.tsx`)
   - User vs assistant styling
   - Plain text rendering (markdown comes in Day 10)
   - Use frontend-design skill with prompt:
     ```
     Create a chat message component for user and assistant messages.
     User messages: right-aligned, blue background.
     Assistant messages: left-aligned, gray background.
     Include role label and content.
     Clean, ChatGPT-like design.
     ```

4. Create ChatInput component (`src/components/chat/ChatInput.tsx`)
   - Textarea with auto-resize
   - Send button (disabled during streaming)
   - Enter to send, Shift+Enter for newline
   - Use frontend-design skill

5. Create ConversationSidebar component
   - List of conversations
   - Create new conversation button
   - Delete conversation
   - Use frontend-design skill

6. Create ChatPage (`src/pages/ChatPage.tsx`)
   - Layout: Sidebar + Chat area
   - Message list with scroll container
   - ChatInput at bottom
   - SSE streaming integration
   - Use frontend-design skill

**Checklist:**
- [ ] Chat types defined
- [ ] SSE streaming hook
- [ ] ChatMessage component
- [ ] ChatInput component
- [ ] ConversationSidebar component
- [ ] ChatPage layout
- [ ] Send message working
- [ ] Streaming responses displaying
- [ ] New conversation creation
- [ ] Conversation switching
- [ ] `bun run biome check .` passes

---

### Day 9: MVP Testing & Bug Fixes

**Goal:** Ensure all MVP features work end-to-end

**Tasks:**

1. Manual testing checklist:
   - [ ] Register new account with invite code
   - [ ] Login with credentials
   - [ ] Upload document (PDF, TXT)
   - [ ] View document list, check status
   - [ ] Create collection
   - [ ] Add document to collection
   - [ ] Start new chat conversation
   - [ ] Send message, verify streaming
   - [ ] Switch conversations
   - [ ] Logout and login again
   - [ ] Verify token refresh on expiry

2. Fix bugs discovered during testing

3. Code review:
   - [ ] All TypeScript errors resolved
   - [ ] No `any` types used
   - [ ] All components have proper prop types
   - [ ] Error handling in all API calls
   - [ ] Loading states on all async operations

4. Run linting
   ```bash
   bun run biome check --write .
   ```

5. Commit MVP
   ```bash
   git add .
   git commit -m "feat(frontend): complete MVP with auth, documents, collections, chat"
   ```

**CHECKPOINT: MVP Complete** ✅

---

## Phase 2: UX Enhancements (Days 10-15)

### Day 10: Markdown & Syntax Highlighting

**Goal:** Render markdown with code syntax highlighting and copy button

**Tasks:**

1. Install highlight.js theme CSS
   ```typescript
   // src/main.tsx
   import 'highlight.js/styles/github-dark.css'
   ```

2. Create CodeBlock component (`src/components/chat/CodeBlock.tsx`)
   ```typescript
   import { useState } from 'react'
   import { Check, Copy } from 'lucide-react'
   import { toast } from 'sonner'

   interface CodeBlockProps {
     language: string
     value: string
   }

   export function CodeBlock({ language, value }: CodeBlockProps) {
     const [copied, setCopied] = useState(false)

     const handleCopy = async () => {
       await navigator.clipboard.writeText(value)
       setCopied(true)
       toast.success('Copied to clipboard!')
       setTimeout(() => setCopied(false), 2000)
     }

     return (
       <div className="relative group">
         <button
           onClick={handleCopy}
           className="absolute top-2 right-2 p-2 rounded bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
         >
           {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
         </button>
         <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
           <code className={`language-${language}`}>{value}</code>
         </pre>
       </div>
     )
   }
   ```

3. Update ChatMessage component to use ReactMarkdown
   ```typescript
   import ReactMarkdown from 'react-markdown'
   import remarkGfm from 'remark-gfm'
   import rehypeHighlight from 'rehype-highlight'
   import { CodeBlock } from './CodeBlock'

   function ChatMessage({ message }: { message: Message }) {
     return (
       <div className={/* styling */}>
         <ReactMarkdown
           remarkPlugins={[remarkGfm]}
           rehypePlugins={[rehypeHighlight]}
           components={{
             code({ node, inline, className, children, ...props }) {
               const match = /language-(\w+)/.exec(className || '')
               const language = match ? match[1] : ''

               return !inline && language ? (
                 <CodeBlock language={language} value={String(children)} />
               ) : (
                 <code className={className} {...props}>
                   {children}
                 </code>
               )
             },
           }}
         >
           {message.content}
         </ReactMarkdown>
       </div>
     )
   }
   ```

**Checklist:**
- [ ] CodeBlock component with copy button
- [ ] ReactMarkdown integrated
- [ ] Syntax highlighting working
- [ ] Copy button shows success toast
- [ ] Inline code vs code blocks rendering correctly
- [ ] Tables, lists, blockquotes rendering
- [ ] `bun run biome check .` passes

---

### Day 11: Auto-Scroll & Typing Indicators

**Goal:** Smooth auto-scroll during streaming, typing indicator animation

**Tasks:**

1. Create auto-scroll hook (`src/hooks/useAutoScroll.ts`)
   ```typescript
   import { useEffect, useRef, useState } from 'react'

   export function useAutoScroll(dependency: unknown) {
     const containerRef = useRef<HTMLDivElement>(null)
     const [isAtBottom, setIsAtBottom] = useState(true)

     useEffect(() => {
       if (isAtBottom && containerRef.current) {
         containerRef.current.scrollTo({
           top: containerRef.current.scrollHeight,
           behavior: 'smooth',
         })
       }
     }, [dependency, isAtBottom])

     const handleScroll = () => {
       const container = containerRef.current
       if (!container) return

       const threshold = 50
       const isNearBottom =
         container.scrollHeight - container.scrollTop - container.clientHeight < threshold
       setIsAtBottom(isNearBottom)
     }

     const scrollToBottom = () => {
       if (containerRef.current) {
         containerRef.current.scrollTo({
           top: containerRef.current.scrollHeight,
           behavior: 'smooth',
         })
         setIsAtBottom(true)
       }
     }

     return { containerRef, isAtBottom, handleScroll, scrollToBottom }
   }
   ```

2. Create TypingIndicator component (`src/components/chat/TypingIndicator.tsx`)
   ```typescript
   export function TypingIndicator() {
     return (
       <div className="flex items-center space-x-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-fit">
         <div className="flex space-x-1">
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
           <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
         </div>
         <span className="text-sm text-gray-500">AI is thinking...</span>
       </div>
     )
   }
   ```

3. Update ChatPage to use auto-scroll
   ```typescript
   function ChatPage() {
     const { containerRef, isAtBottom, handleScroll, scrollToBottom } = useAutoScroll(messages)

     return (
       <div className="flex flex-col h-screen">
         <div
           ref={containerRef}
           onScroll={handleScroll}
           className="flex-1 overflow-y-auto p-4"
         >
           {messages.map((msg) => <ChatMessage key={msg.message_id} message={msg} />)}
           {isStreaming && <TypingIndicator />}
         </div>

         {!isAtBottom && (
           <button
             onClick={scrollToBottom}
             className="fixed bottom-24 right-8 p-3 bg-blue-500 text-white rounded-full shadow-lg"
           >
             ↓ Scroll to bottom
           </button>
         )}

         <ChatInput />
       </div>
     )
   }
   ```

**Checklist:**
- [ ] Auto-scroll hook implemented
- [ ] Auto-scroll during streaming
- [ ] Manual scroll disables auto-scroll
- [ ] Scroll to bottom button appears
- [ ] TypingIndicator component
- [ ] Typing indicator shows during streaming
- [ ] Smooth scrolling behavior
- [ ] `bun run biome check .` passes

---

### Day 12: Message Actions, Stop Generation, Timestamps

**Goal:** Copy message, regenerate response, stop streaming, show timestamps

**Tasks:**

1. Create MessageActions component (`src/components/chat/MessageActions.tsx`)
   ```typescript
   import { Copy, RotateCw } from 'lucide-react'
   import { toast } from 'sonner'

   interface MessageActionsProps {
     message: Message
     onRegenerate?: () => void
     disabled?: boolean
   }

   export function MessageActions({ message, onRegenerate, disabled }: MessageActionsProps) {
     const handleCopy = async () => {
       await navigator.clipboard.writeText(message.content)
       toast.success('Message copied!')
     }

     return (
       <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
         <button
           onClick={handleCopy}
           disabled={disabled}
           className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
         >
           <Copy className="h-4 w-4" />
         </button>

         {message.role === 'assistant' && onRegenerate && (
           <button
             onClick={onRegenerate}
             disabled={disabled}
             className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
           >
             <RotateCw className="h-4 w-4" />
           </button>
         )}
       </div>
     )
   }
   ```

2. Create timestamp formatter (`src/lib/utils.ts`)
   ```typescript
   import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

   export function formatTimestamp(date: Date): string {
     const now = new Date()
     const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

     if (diffInHours < 1) {
       return formatDistanceToNow(date, { addSuffix: true })
     } else if (isToday(date)) {
       return `Today at ${format(date, 'h:mm a')}`
     } else if (isYesterday(date)) {
       return `Yesterday at ${format(date, 'h:mm a')}`
     } else {
       return format(date, 'MMM d, yyyy \'at\' h:mm a')
     }
   }
   ```

3. Add stop generation button to ChatInput
   ```typescript
   function ChatInput() {
     const { isStreaming, stopGeneration } = useChatStream()

     return (
       <div className="relative">
         <textarea {...props} />

         {isStreaming ? (
           <button
             onClick={stopGeneration}
             className="absolute bottom-2 right-2 p-2 bg-red-500 text-white rounded"
           >
             Stop
           </button>
         ) : (
           <button type="submit" {...props}>
             Send
           </button>
         )}
       </div>
     )
   }
   ```

4. Update ChatMessage to show actions and timestamp
   ```typescript
   function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
     return (
       <div className="group relative">
         <div className="flex justify-between items-start">
           <ReactMarkdown>{message.content}</ReactMarkdown>
           <MessageActions message={message} onRegenerate={onRegenerate} />
         </div>
         <span className="text-xs text-gray-500 mt-1">
           {formatTimestamp(new Date(message.timestamp))}
         </span>
       </div>
     )
   }
   ```

**Checklist:**
- [ ] MessageActions component
- [ ] Copy message working
- [ ] Regenerate response working
- [ ] Stop generation button
- [ ] EventSource abort on stop
- [ ] Timestamps displaying correctly
- [ ] Relative time for recent messages
- [ ] `bun run biome check .` passes

---

### Day 13: Batch Operations & Advanced Document Features

**Goal:** Batch delete, delete all, retry failed documents, quota warnings

**Tasks:**

1. Add batch operations to DocumentList
   ```typescript
   function DocumentList() {
     const [selectedIds, setSelectedIds] = useState<string[]>([])
     const batchDelete = useBatchDeleteDocuments()
     const deleteAll = useDeleteAllDocuments()

     const handleBatchDelete = async () => {
       if (!confirm(`Delete ${selectedIds.length} documents?`)) return

       const result = await batchDelete.mutateAsync(selectedIds)
       toast.success(`Deleted ${result.success_count} documents`)
       if (result.failed_count > 0) {
         toast.error(`Failed to delete ${result.failed_count} documents`)
       }
       setSelectedIds([])
     }

     const handleDeleteAll = async () => {
       if (!confirm('Delete ALL your documents? This cannot be undone!')) return
       if (!confirm('Are you absolutely sure?')) return

       await deleteAll.mutateAsync()
       toast.success('All documents deleted')
     }

     return (
       <div>
         {selectedIds.length > 0 && (
           <button onClick={handleBatchDelete}>
             Delete {selectedIds.length} selected
           </button>
         )}
         <button onClick={handleDeleteAll} className="text-red-600">
           Delete All Documents
         </button>
         {/* Document table with checkboxes */}
       </div>
     )
   }
   ```

2. Add retry button for failed documents
   ```typescript
   function DocumentListItem({ document }: { document: Document }) {
     const retry = useRetryDocument()

     const showRetry = document.status === 'error' || (
       document.status === 'processing' &&
       new Date().getTime() - new Date(document.uploaded_at).getTime() > 30 * 60 * 1000
     )

     return (
       <tr>
         <td>{document.filename}</td>
         <td>
           <StatusBadge status={document.status} />
           {showRetry && (
             <button
               onClick={() => retry.mutate(document.document_id)}
               className="ml-2 text-blue-600"
             >
               Retry
             </button>
           )}
         </td>
       </tr>
     )
   }
   ```

3. Add storage quota warning
   ```typescript
   function StorageQuota() {
     const { data: user } = useUser()

     const usedPercent = (user.storage_used_bytes / user.storage_limit_bytes) * 100
     const color = usedPercent > 90 ? 'red' : usedPercent > 70 ? 'yellow' : 'green'

     return (
       <div className="p-4 border rounded">
         <h3>Storage Quota</h3>
         <div className="w-full bg-gray-200 rounded-full h-2.5">
           <div
             className={`h-2.5 rounded-full bg-${color}-500`}
             style={{ width: `${usedPercent}%` }}
           />
         </div>
         <p className="text-sm text-gray-600">
           {formatBytes(user.storage_used_bytes)} / {formatBytes(user.storage_limit_bytes)}
         </p>
         {usedPercent > 90 && (
           <p className="text-red-600 font-bold mt-2">
             ⚠️ Storage almost full! Delete documents to free up space.
           </p>
         )}
       </div>
     )
   }
   ```

**Checklist:**
- [ ] Batch delete with checkboxes
- [ ] Delete all with double confirmation
- [ ] Retry button for failed documents
- [ ] Retry button for stuck processing (>30 min)
- [ ] Storage quota progress bar
- [ ] Quota color coding (green/yellow/red)
- [ ] Warning when >90% used
- [ ] Block upload when quota exceeded (413 error)
- [ ] `bun run biome check .` passes

---

### Day 14: Navigation & User Profile

**Goal:** Complete navigation, user profile page

**Tasks:**

1. Create Header component with navigation
   - Use frontend-design skill with prompt:
     ```
     Create a header component with app logo, navigation links (Dashboard, Chat, Profile),
     user menu dropdown (Profile, Settings, Logout), and dark mode toggle placeholder.
     Modern design with subtle shadow.
     ```

2. Create Sidebar component for dashboard
   - Links to Documents, Collections, Admin (if admin role)
   - Use frontend-design skill

3. Create ProfilePage (`src/pages/ProfilePage.tsx`)
   - Display user email, role, created_at, last_login_at
   - Storage quota display
   - Invite code used (if any)
   - Change password form
   - Use frontend-design skill

4. Add ProfilePage to router

**Checklist:**
- [ ] Header component
- [ ] Sidebar component
- [ ] ProfilePage implemented
- [ ] User info displaying
- [ ] Storage quota on profile
- [ ] Change password working
- [ ] Navigation between pages
- [ ] Active link highlighting
- [ ] `bun run biome check .` passes

---

### Day 15: UX Testing & Refinement

**Goal:** Test all UX features, fix bugs

**Tasks:**

1. Manual testing checklist:
   - [ ] Markdown rendering with code blocks
   - [ ] Code copy button working
   - [ ] Auto-scroll during streaming
   - [ ] Manual scroll disables auto-scroll
   - [ ] Scroll to bottom button
   - [ ] Typing indicator animation
   - [ ] Message copy action
   - [ ] Regenerate response
   - [ ] Stop generation button
   - [ ] Message timestamps (recent, today, yesterday, older)
   - [ ] Batch delete documents
   - [ ] Delete all documents (double confirmation)
   - [ ] Retry failed document
   - [ ] Storage quota warning
   - [ ] Navigation between pages
   - [ ] User profile display
   - [ ] Change password

2. Fix bugs discovered

3. Run linting
   ```bash
   bun run biome check --write .
   ```

4. Commit UX features
   ```bash
   git add .
   git commit -m "feat(frontend): add UX features (markdown, auto-scroll, message actions, batch ops)"
   ```

**CHECKPOINT: UX Complete** ✅

---

## Phase 3: Polish (Days 16-22)

### Day 16: Dark Mode

**Goal:** Complete dark mode with toggle, persistence, system preference

**Tasks:**

1. Create dark mode store (`src/store/themeStore.ts`)
   ```typescript
   import { create } from 'zustand'
   import { persist } from 'zustand/middleware'

   interface ThemeState {
     darkMode: boolean
     toggleDarkMode: () => void
     setDarkMode: (value: boolean) => void
   }

   export const useThemeStore = create<ThemeState>()(
     persist(
       (set) => ({
         darkMode: false,
         toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
         setDarkMode: (value) => set({ darkMode: value }),
       }),
       {
         name: 'theme-storage',
       }
     )
   )
   ```

2. Create useDarkMode hook (`src/hooks/useDarkMode.ts`)
   ```typescript
   import { useEffect } from 'react'
   import { useThemeStore } from '../store/themeStore'

   export function useDarkMode() {
     const { darkMode, setDarkMode, toggleDarkMode } = useThemeStore()

     useEffect(() => {
       // Detect system preference on first load
       const savedTheme = localStorage.getItem('theme-storage')
       if (!savedTheme) {
         const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
         setDarkMode(prefersDark)
       }
     }, [])

     useEffect(() => {
       if (darkMode) {
         document.documentElement.classList.add('dark')
       } else {
         document.documentElement.classList.remove('dark')
       }
     }, [darkMode])

     return { darkMode, toggleDarkMode }
   }
   ```

3. Create DarkModeToggle component
   ```typescript
   import { Moon, Sun } from 'lucide-react'
   import { useDarkMode } from '../hooks/useDarkMode'

   export function DarkModeToggle() {
     const { darkMode, toggleDarkMode } = useDarkMode()

     return (
       <button
         onClick={toggleDarkMode}
         className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
       >
         {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
       </button>
     )
   }
   ```

4. Add dark mode classes to all components
   - Update background colors: `bg-white dark:bg-gray-900`
   - Update text colors: `text-gray-900 dark:text-gray-100`
   - Update borders: `border-gray-200 dark:border-gray-700`

5. Test dark mode across all pages

**Checklist:**
- [ ] Dark mode store
- [ ] useDarkMode hook
- [ ] DarkModeToggle component
- [ ] System preference detection
- [ ] localStorage persistence
- [ ] All components support dark mode
- [ ] Login/Register pages dark mode
- [ ] Dashboard dark mode
- [ ] Chat page dark mode
- [ ] Profile page dark mode
- [ ] `bun run biome check .` passes

---

### Day 17: Search & Prompt Templates

**Goal:** Search within conversation, conversation templates

**Tasks:**

1. Create ConversationSearch component
   ```typescript
   import { useState } from 'react'
   import { Search } from 'lucide-react'

   export function ConversationSearch({ messages }: { messages: Message[] }) {
     const [query, setQuery] = useState('')
     const [currentMatch, setCurrentMatch] = useState(0)

     const matches = messages.filter((msg) =>
       msg.content.toLowerCase().includes(query.toLowerCase())
     )

     const highlightMatch = (text: string) => {
       if (!query) return text

       const regex = new RegExp(`(${query})`, 'gi')
       return text.replace(regex, '<mark>$1</mark>')
     }

     return (
       <div className="flex items-center space-x-2 p-2 border-b">
         <Search className="h-4 w-4" />
         <input
           type="text"
           value={query}
           onChange={(e) => setQuery(e.target.value)}
           placeholder="Search conversation..."
           className="flex-1 px-2 py-1 border rounded"
         />
         {matches.length > 0 && (
           <div className="flex items-center space-x-2">
             <span className="text-sm text-gray-600">
               {currentMatch + 1} / {matches.length}
             </span>
             <button onClick={() => setCurrentMatch((prev) => Math.max(0, prev - 1))}>
               ↑
             </button>
             <button onClick={() => setCurrentMatch((prev) => Math.min(matches.length - 1, prev + 1))}>
               ↓
             </button>
           </div>
         )}
       </div>
     )
   }
   ```

2. Create PromptTemplates component
   ```typescript
   const templates = [
     {
       category: 'Getting Started',
       prompts: [
         'Summarize this document for me',
         'What are the main topics covered?',
         'List the key points from this document',
       ],
     },
     {
       category: 'Document Analysis',
       prompts: [
         'Compare these two documents',
         'Find contradictions in this document',
         'Extract action items from this meeting note',
       ],
     },
     {
       category: 'Common Questions',
       prompts: [
         'What does this acronym mean?',
         'When was this document created?',
         'Who are the authors mentioned?',
       ],
     },
   ]

   export function PromptTemplates({ onSelect }: { onSelect: (prompt: string) => void }) {
     return (
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
         {templates.map((category) => (
           <div key={category.category} className="border rounded-lg p-4">
             <h3 className="font-bold mb-2">{category.category}</h3>
             <div className="space-y-2">
               {category.prompts.map((prompt) => (
                 <button
                   key={prompt}
                   onClick={() => onSelect(prompt)}
                   className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                 >
                   {prompt}
                 </button>
               ))}
             </div>
           </div>
         ))}
       </div>
     )
   }
   ```

3. Integrate ConversationSearch into ChatPage header

4. Show PromptTemplates when conversation is empty

**Checklist:**
- [ ] ConversationSearch component
- [ ] Search input working
- [ ] Match highlighting
- [ ] Navigate matches (prev/next)
- [ ] Match counter display
- [ ] PromptTemplates component
- [ ] Template categories
- [ ] Click template to fill input
- [ ] Show templates when chat empty
- [ ] Hide templates after first message
- [ ] `bun run biome check .` passes

---

### Day 18: Error Handling & Loading States

**Goal:** Comprehensive error handling, loading skeletons

**Tasks:**

1. Create ErrorBoundary component
   ```typescript
   import { Component, type ReactNode } from 'react'

   interface Props {
     children: ReactNode
   }

   interface State {
     hasError: boolean
     error?: Error
   }

   export class ErrorBoundary extends Component<Props, State> {
     constructor(props: Props) {
       super(props)
       this.state = { hasError: false }
     }

     static getDerivedStateFromError(error: Error) {
       return { hasError: true, error }
     }

     render() {
       if (this.state.hasError) {
         return (
           <div className="flex flex-col items-center justify-center h-screen">
             <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
             <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
             <button
               onClick={() => window.location.reload()}
               className="px-4 py-2 bg-blue-500 text-white rounded"
             >
               Reload Page
             </button>
           </div>
         )
       }

       return this.props.children
     }
   }
   ```

2. Add global error handler for API errors
   ```typescript
   // src/lib/api.ts
   api.interceptors.response.use(
     (response) => response,
     (error) => {
       if (error.response?.status === 413) {
         toast.error('File too large or storage quota exceeded')
       } else if (error.response?.status === 429) {
         const retryAfter = error.response.headers['retry-after']
         toast.error(`Rate limit exceeded. Try again in ${retryAfter} seconds.`)
       } else if (error.response?.status === 504) {
         toast.error('Request timeout. Please try again.')
       } else {
         toast.error(error.response?.data?.detail || 'An error occurred')
       }

       return Promise.reject(error)
     }
   )
   ```

3. Create loading skeletons
   ```typescript
   export function DocumentListSkeleton() {
     return (
       <div className="space-y-4">
         {[1, 2, 3].map((i) => (
           <div key={i} className="animate-pulse flex space-x-4">
             <div className="h-12 bg-gray-200 rounded w-1/4" />
             <div className="h-12 bg-gray-200 rounded w-1/4" />
             <div className="h-12 bg-gray-200 rounded w-1/4" />
           </div>
         ))}
       </div>
     )
   }
   ```

4. Add loading states to all async components
   ```typescript
   function DocumentList() {
     const { data: documents, isLoading, error } = useDocuments()

     if (isLoading) return <DocumentListSkeleton />
     if (error) return <ErrorMessage error={error} />

     return <div>{/* Render documents */}</div>
   }
   ```

**Checklist:**
- [ ] ErrorBoundary component
- [ ] Global API error handler
- [ ] Toast notifications for errors
- [ ] 413 error (quota exceeded)
- [ ] 429 error (rate limit with countdown)
- [ ] 504 error (timeout)
- [ ] Loading skeletons for documents
- [ ] Loading skeletons for collections
- [ ] Loading skeletons for conversations
- [ ] Loading states on all buttons
- [ ] Disabled state during async operations
- [ ] `bun run biome check .` passes

---

### Day 19: Routing Guards & 404 Page

**Goal:** Protect routes, admin-only routes, 404 page

**Tasks:**

1. Create AdminRoute component
   ```typescript
   import { Navigate } from 'react-router-dom'
   import { useAuthStore } from '../store/authStore'

   export function AdminRoute({ children }: { children: ReactNode }) {
     const user = useAuthStore((state) => state.user)

     if (!user) return <Navigate to="/login" />
     if (user.role !== 'admin') return <Navigate to="/dashboard" />

     return <>{children}</>
   }
   ```

2. Create NotFoundPage (`src/pages/NotFoundPage.tsx`)
   - Use frontend-design skill with prompt:
     ```
     Create a 404 Not Found page with illustration or icon.
     Include message "Page not found" and button to go back to dashboard.
     Modern, friendly design.
     ```

3. Update router with guards
   ```typescript
   <Routes>
     <Route path="/login" element={<LoginPage />} />
     <Route path="/register" element={<RegisterPage />} />

     <Route path="/dashboard" element={
       <ProtectedRoute><DashboardPage /></ProtectedRoute>
     } />

     <Route path="/admin" element={
       <AdminRoute><AdminPage /></AdminRoute>
     } />

     <Route path="/" element={<Navigate to="/dashboard" />} />
     <Route path="*" element={<NotFoundPage />} />
   </Routes>
   ```

4. Redirect logged-in users away from login/register
   ```typescript
   function LoginPage() {
     const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

     if (isAuthenticated) return <Navigate to="/dashboard" />

     return <div>{/* Login form */}</div>
   }
   ```

**Checklist:**
- [ ] AdminRoute component
- [ ] NotFoundPage implemented
- [ ] Admin routes protected
- [ ] Redirect authenticated users from login
- [ ] Redirect unauthenticated users to login
- [ ] Test all route guards
- [ ] `bun run biome check .` passes

---

### Day 20: Responsive Design, Accessibility, Performance

**Goal:** Mobile-friendly, accessible, optimized

**Tasks:**

1. Make all components responsive
   - Use Tailwind responsive classes: `sm:`, `md:`, `lg:`
   - Test on mobile, tablet, desktop
   - Hamburger menu for mobile navigation
   - Collapsible sidebar on mobile

2. Add accessibility features
   - ARIA labels on buttons
   - Focus visible outlines
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader support
   ```typescript
   <button
     aria-label="Send message"
     className="focus:ring-2 focus:ring-blue-500"
   >
     Send
   </button>
   ```

3. Optimize performance
   - Lazy load pages
   ```typescript
   const ChatPage = lazy(() => import('./pages/ChatPage'))
   const DashboardPage = lazy(() => import('./pages/DashboardPage'))
   ```

   - Memoize expensive components
   ```typescript
   const MemoizedChatMessage = memo(ChatMessage)
   ```

   - Virtualize long lists (react-window)
   ```bash
   bun add react-window
   ```

4. Run Lighthouse audit
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90

**Checklist:**
- [ ] All pages responsive
- [ ] Mobile navigation working
- [ ] Sidebar collapses on mobile
- [ ] ARIA labels on interactive elements
- [ ] Focus visible on all inputs/buttons
- [ ] Keyboard navigation working
- [ ] Lazy loading pages
- [ ] Memoized components
- [ ] Virtualized long lists
- [ ] Lighthouse audit passing
- [ ] `bun run biome check .` passes

---

### Day 21: Testing

**Goal:** Unit tests for critical paths

**Tasks:**

1. Setup Vitest + React Testing Library
   ```bash
   bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. Create test setup (`src/test/setup.ts`)
   ```typescript
   import '@testing-library/jest-dom'
   import { afterEach } from 'vitest'
   import { cleanup } from '@testing-library/react'

   afterEach(() => {
     cleanup()
   })
   ```

3. Write tests for auth store
   ```typescript
   // src/store/__tests__/authStore.test.ts
   import { describe, it, expect } from 'vitest'
   import { useAuthStore } from '../authStore'

   describe('authStore', () => {
     it('should set tokens and mark as authenticated', () => {
       const { setTokens, isAuthenticated } = useAuthStore.getState()

       setTokens('access-token', 'refresh-token')

       expect(useAuthStore.getState().token).toBe('access-token')
       expect(useAuthStore.getState().isAuthenticated).toBe(true)
     })

     it('should logout and clear state', () => {
       const { logout } = useAuthStore.getState()

       logout()

       expect(useAuthStore.getState().token).toBeNull()
       expect(useAuthStore.getState().isAuthenticated).toBe(false)
     })
   })
   ```

4. Write tests for API client
   ```typescript
   // src/lib/__tests__/api.test.ts
   import { describe, it, expect, vi } from 'vitest'
   import axios from 'axios'
   import api from '../api'

   vi.mock('axios')

   describe('api client', () => {
     it('should add Authorization header when token exists', async () => {
       useAuthStore.setState({ token: 'test-token' })

       await api.get('/documents')

       expect(axios.request).toHaveBeenCalledWith(
         expect.objectContaining({
           headers: expect.objectContaining({
             Authorization: 'Bearer test-token',
           }),
         })
       )
     })
   })
   ```

5. Run tests
   ```bash
   bun test
   ```

**Checklist:**
- [ ] Vitest configured
- [ ] Auth store tests
- [ ] API client tests
- [ ] All tests passing
- [ ] Test coverage > 70% for critical paths

---

### Day 22: Final Review & Documentation

**Goal:** Production-ready codebase

**Tasks:**

1. Final code review
   - [ ] No console.logs
   - [ ] No TODO comments
   - [ ] All TypeScript errors resolved
   - [ ] No unused imports
   - [ ] Consistent naming conventions

2. Run final linting and tests
   ```bash
   bun run biome check --write .
   bun test
   bun run build
   ```

3. Update README.md
   ```markdown
   # AI Knowledge Base - Frontend

   ## Features
   - Authentication (login, register, password reset)
   - Document management (upload, CRUD, collections)
   - AI chat with RAG (SSE streaming, markdown, code highlighting)
   - Dark mode
   - Responsive design

   ## Tech Stack
   - React 18 + TypeScript
   - Vite + Bun
   - Tailwind CSS + shadcn/ui
   - Zustand + React Query
   - Axios

   ## Setup
   ```bash
   cd frontend
   bun install
   cp .env.example .env
   bun run dev
   ```

   ## Build
   ```bash
   bun run build
   bun run preview
   ```
   ```

4. Create deployment checklist
   - [ ] Environment variables set
   - [ ] API URL configured
   - [ ] Build successful
   - [ ] All features tested in production build

5. Final commit
   ```bash
   git add .
   git commit -m "feat(frontend): complete production-ready frontend with all features"
   ```

**CHECKPOINT: Production Ready** ✅

---

## Summary

**Total Duration:** 22 days
**Phases:** 3 (MVP → UX → Polish)
**Checkpoints:** Days 9, 15, 22

**Key Features Delivered:**
1. ✅ Authentication system (login, register, password reset, JWT)
2. ✅ Document management (upload, CRUD, collections, batch operations)
3. ✅ AI chat (SSE streaming, markdown, code highlighting, auto-scroll)
4. ✅ UX features (typing indicators, message actions, stop generation, timestamps)
5. ✅ Dark mode
6. ✅ Search & prompt templates
7. ✅ Responsive design
8. ✅ Accessibility
9. ✅ Error handling & loading states
10. ✅ Testing

**Production Ready:** Day 22 🎉
