# Phase 5: RAG Chat System

**Priority:** Critical  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 4 (Document Processing completed)  
**PRD Reference:** Section 7.2 (Chat Query Flow), Section 9.2 (Chat Query API), Section 11.3 (RAG Prompt Template)

---

## ⚠️ IMPORTANT GIT RULES (READ FIRST)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Git Workflow:
1. ✅ **ALWAYS** work on `dev` branch (not `main`)
2. ✅ **ALWAYS** run tests before committing (`pytest`)
3. ✅ **ALWAYS** run linting before committing (`ruff check .`)
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Example: feat(chat): implement RAG query system
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all functions** with docstrings (purpose, args, returns, raises)
- ✅ **Use type hints** for all function signatures
- ✅ **Follow consistent patterns** across all files
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in this file are for verification only, NOT for code comments.

---

## 5.1 Chat Service Layer Setup

**IMPORTANT:** All database operations use SQLModel with AsyncSession (PRD Section 10)

### Chat Service Files
**PRD Reference:** Section 11.1 (Project Structure - services/)
- [ ] Create `backend/app/services/llm_service.py` (this section)
- [ ] Create `backend/app/services/chat_service.py` (section 5.3 - orchestrates RAG flow)
- [ ] Create `backend/app/services/conversation_service.py` (section 5.4)

---

## 5.2 Google Gemini LLM Service

### Gemini Client Setup
**PRD Reference:** Section 5 (Technical Architecture - Google Gemini 2.5 Flash), Section 11.2.2 (Config)
- [ ] Install `google-generativeai` dependency (already done in Phase 0)
- [ ] Verify GOOGLE_API_KEY in `.env`
- [ ] Create `backend/app/services/llm_service.py`
- [ ] Initialize Gemini client with API key
- [ ] Configure model: `gemini-2.0-flash-exp` (as per PRD Section 11.2.2)
- [ ] Test API connection

### Generate Chat Response
**PRD Reference:** Section 7.2 (Chat Query Flow - Step 8)
- [ ] Implement `generate_response(prompt: str, context: str, query: str) -> str`
- [ ] Build prompt with system instructions + context + user query
- [ ] Call Gemini API with prompt
- [ ] Return generated answer
- [ ] Handle API errors (rate limits, timeouts)
- [ ] Test response generation

### Streaming Responses (Optional - Future)
- [ ] Implement streaming for real-time response
- [ ] Use Server-Sent Events (SSE) or WebSocket
- [ ] Test streaming (can be deferred to Phase 11)

---

## 5.3 RAG Prompt Engineering

### Prompt Template
**PRD Reference:** Section 11.3 (RAG Prompt Template)
- [ ] Create `backend/app/prompts/chat_prompt.py`
- [ ] Define system prompt:
  ```
  You are a helpful AI assistant that answers questions based ONLY on the provided context.
  If the answer is not in the context, say "I don't have enough information to answer that."
  Always cite the source document in your response.
  ```
- [ ] Define user prompt template:
  ```
  Context from documents:
  {context}
  
  User Question: {query}
  
  Answer based ONLY on the context above:
  ```
- [ ] Test prompt template

### Context Formatting
**PRD Reference:** Section 7.2 (Chat Query Flow - Step 6)
- [ ] Implement `format_context(chunks: List[SearchResult]) -> str`
- [ ] Format each chunk as:
  ```
  [Document: {document_name}]
  {chunk_text}
  ---
  ```
- [ ] Limit context to top 5 chunks
- [ ] Test context formatting

---

## 5.4 Chat Service Orchestration

### RAG Chat Service
**PRD Reference:** Section 11.1 (Project Structure - services/chat_service.py)
- [ ] Create `backend/app/services/chat_service.py`
- [ ] Implement `execute_rag_query(query, user_id, collection_id, top_k, db) -> ChatResponse`
- [ ] Orchestrate full RAG flow:
  - Generate query embedding
  - Search Milvus for similar chunks
  - Format context from chunks
  - Build RAG prompt
  - Call LLM service
  - Format response with citations
- [ ] Test chat service end-to-end

---

## 5.5 Chat Query Endpoint

### Chat API
**PRD Reference:** Section 9.2 (Chat Query API)
- [ ] Create `backend/app/api/v1/chat.py`
- [ ] Implement `POST /api/v1/chat` endpoint
- [ ] Request schema: `ChatQuery(query, conversation_id, top_k, collection_id)`
- [ ] Require authentication (`get_current_user`)
- [ ] Validate query length (max 1000 characters)
- [ ] Test chat endpoint

### RAG Query Flow
**PRD Reference:** Section 7.2 (Chat Query Flow - Complete)
- [ ] Step 1: Receive user query
- [ ] Step 2: Generate query embedding using embedding_service
- [ ] Step 3: Search Milvus for similar chunks (user_id filter + optional collection_id filter)
- [ ] Step 4: Retrieve top K chunks (default K=5)
- [ ] Step 5: Format context from chunks
- [ ] Step 6: Build RAG prompt (system + context + query)
- [ ] Step 7: Call Gemini LLM to generate answer
- [ ] Step 8: Extract source citations from chunks
- [ ] Step 9: Save conversation to database
- [ ] Step 10: Return response with answer + sources
- [ ] Test end-to-end RAG flow

### Source Citations
**PRD Reference:** Section 9.2 (Chat Response - sources field)
- [ ] For each chunk used in context, create citation:
  - `document_id`
  - `document_name`
  - `chunk_id`
  - `similarity_score`
  - `text` (excerpt from chunk)
- [ ] Sort citations by similarity score (highest first)
- [ ] Limit to 5 citations
- [ ] Test citation generation

---

## 5.6 Conversation Management

### Create/Update Conversation
**PRD Reference:** Section 10.4 (Conversation Model)
- [ ] Create `backend/app/services/conversation_service.py`
- [ ] Implement `get_or_create_conversation(user_id, conversation_id) -> Conversation`
- [ ] If conversation_id is None, create new conversation
- [ ] If conversation_id provided, fetch existing conversation
- [ ] Verify conversation ownership (user_id match)
- [ ] Test conversation retrieval

### Add Message to Conversation
**PRD Reference:** Section 10.4 (Message Structure JSONB)
- [ ] Implement `add_message(conversation_id, role, content, sources)`
- [ ] Append message to conversation.messages JSONB array
- [ ] Message format:
  ```json
  {
    "role": "user" | "assistant",
    "content": "message text",
    "timestamp": "2025-01-19T10:30:00Z",
    "sources": ["chunk_id_1", "chunk_id_2"]  // Only for assistant
  }
  ```
- [ ] Increment conversation.message_count
- [ ] Update conversation.updated_at
- [ ] Test message addition

### Conversation Context
**PRD Reference:** Section 8.3 (Conversation Context - last 5 messages)
- [ ] Implement `get_conversation_context(conversation_id, limit=5) -> List[Message]`
- [ ] Retrieve last N messages from conversation
- [ ] Use for follow-up question understanding (optional - can be Phase 11)
- [ ] Test context retrieval

---

## 5.7 Conversation History Endpoints

### List Conversations
**PRD Reference:** Section 9.8 (Conversation Management API)
- [ ] Implement `GET /api/v1/conversations` endpoint
- [ ] Query parameters: limit (default=20), offset (default=0)
- [ ] Filter by user_id (data isolation)
- [ ] Return conversations sorted by updated_at DESC
- [ ] Response: `ConversationListItem` (lightweight, with preview)
- [ ] Test listing

### Get Single Conversation
**PRD Reference:** Section 9.8 (Get Single Conversation)
- [ ] Implement `GET /api/v1/conversations/{conversation_id}` endpoint
- [ ] Verify conversation ownership
- [ ] Return full conversation with all messages
- [ ] Response: `ConversationResponse`
- [ ] Test retrieval

### Delete Conversation
**PRD Reference:** Section 9.8 (Delete Conversation)
- [ ] Implement `DELETE /api/v1/conversations/{conversation_id}` endpoint
- [ ] Verify ownership
- [ ] Soft delete or hard delete (hard delete recommended for simplicity)
- [ ] Response: `{"message": "Conversation deleted successfully"}`
- [ ] Test deletion

---

## 5.8 Collection Filtering in Chat

### Collection-Based Search
**PRD Reference:** Section 8.2 (Collections/Namespaces Management)
- [ ] Add `collection_id` parameter to chat endpoint
- [ ] If provided, filter Milvus search by collection_id
- [ ] Search expression: `user_id == "{user_id}" AND collection_id == "{collection_id}"`
- [ ] Test collection filtering

### Collection Endpoints
**PRD Reference:** Section 9.9 (Collection Management API)
- [ ] Create `backend/app/api/v1/collections.py`
- [ ] Implement `POST /api/v1/collections` (create collection)
- [ ] Implement `GET /api/v1/collections` (list user collections)
- [ ] Implement `PUT /api/v1/collections/{id}` (update collection)
- [ ] Implement `DELETE /api/v1/collections/{id}` (delete collection)
- [ ] Add unique constraint on (user_id, name)
- [ ] Test collection CRUD

---

## 5.9 Error Handling & Edge Cases

### No Results Found
**PRD Reference:** Section 8.4 (Query/Chat Errors - No Results Found)
- [ ] If Milvus search returns 0 results, return friendly message
- [ ] Response: `"I couldn't find relevant information in your knowledge base for this question."`
- [ ] Suggest uploading related documents
- [ ] Test no-results scenario

### Empty Knowledge Base
**PRD Reference:** Section 8.4 (Empty Knowledge Base)
- [ ] Check if user has any documents with status=ACTIVE
- [ ] If empty, return helpful message
- [ ] Response: `"Your knowledge base is empty. Upload documents to get started."`
- [ ] Test empty knowledge base

### LLM Timeout
**PRD Reference:** Section 8.4 (LLM API Timeout)
- [ ] Set timeout for Gemini API call (10 seconds)
- [ ] If timeout, return error with retry option
- [ ] Test timeout handling

### Rate Limiting
**PRD Reference:** Section 11.4 (Rate Limit Hierarchy)
- [ ] Apply rate limit: 100 chat queries per hour per user
- [ ] Use Redis rate limiting service
- [ ] Return 429 error if exceeded
- [ ] Include retry-after header
- [ ] Test rate limiting

---

## 5.10 Testing RAG Chat System

### Unit Tests
- [ ] Create `backend/tests/test_llm_service.py`
- [ ] Test Gemini API call
- [ ] Test prompt template
- [ ] Test context formatting

### Integration Tests
- [ ] Create `backend/tests/test_chat_api.py`
- [ ] Test chat endpoint with valid query
- [ ] Test chat with collection filter
- [ ] Test chat with no results
- [ ] Test chat with empty knowledge base
- [ ] Test conversation creation and retrieval
- [ ] Test multi-turn conversation
- [ ] Test source citations

### RAG Quality Tests
- [ ] Upload sample documents
- [ ] Ask questions and verify answers
- [ ] Check source citations are relevant
- [ ] Verify user data isolation (user A cannot see user B's documents)

---

## ✅ Phase 5 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check chat flow with PRD Section 7.2**
- [ ] **Verify prompt template matches PRD Section 11.3**
- [ ] **Confirm chat API matches PRD Section 9.2**
- [ ] **Verify conversation model matches PRD Section 10.4**
- [ ] **Check rate limits match PRD Section 11.4 (100 queries/hour)**
- [ ] **Verify response time target <3 seconds**
- [ ] **Confirm context window (last 5 messages) matches PRD Section 8.3**

Before moving to Phase 6, verify:
- [ ] Chat endpoint working end-to-end
- [ ] Gemini LLM generating responses
- [ ] Vector search returning relevant chunks
- [ ] Source citations included in responses
- [ ] Conversations saved to database
- [ ] Conversation history working
- [ ] Collection filtering working
- [ ] Error handling for edge cases
- [ ] Rate limiting enforced
- [ ] User data isolation verified
- [ ] All tests passing (`pytest backend/tests/test_chat*.py`)
- [ ] Can ask questions and get answers
- [ ] Can see conversation history
- [ ] Can filter by collection
- [ ] Response time <3 seconds for most queries

---

**Next Phase:** [Phase 6: Email Service](06-EMAIL-SERVICE.md)
