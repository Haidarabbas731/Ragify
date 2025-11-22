# Frontend UI/UX Design - Knowledge Base Management
## AI Knowledge Base Chat System (React)

**Version:** 1.0  
**Date:** November 16, 2025

---

## 1. Application Layout

### Technology Stack
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Routing:** React Router
- **State:** React Context API / Zustand
- **API Client:** Axios

### Main Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│  🤖 AI Knowledge Base Chat              👤 User    ⚙️ Settings  │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                       │
│  📚 KB   │                                                       │
│  💬 Chat │              MAIN CONTENT AREA                       │
│  📊 Stats│                                                       │
│  ⚙️ Sett │              (Dynamic based on sidebar selection)   │
│          │                                                       │
│          │                                                       │
├──────────┴──────────────────────────────────────────────────────┤
│  Status: Connected to Milvus ✓ | 25 docs indexed               │
└─────────────────────────────────────────────────────────────────┘
```

**Sidebar Navigation:**
- **📚 Knowledge Base** - Manage documents, collections
- **💬 Chat** - Main chat interface
- **📊 Analytics** - Usage statistics (Phase 2)
- **⚙️ Settings** - API keys, preferences

---

## 2. Knowledge Base Screen - Detailed Design

### 2.1 Default View - Document Library

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base                                 [+ Upload]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 Quick Stats                                          │  │
│  │                                                           │  │
│  │  25 Documents  |  1,247 Chunks  |  12.5 MB  |  89 Queries │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔍 [Search documents, tags, content...]      [🔽 Filters]│  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────┬──────────────────────────────────────────┐│
│  │ 📁 Collections  │  Documents                               ││
│  ├─────────────────┼──────────────────────────────────────────┤│
│  │                 │  Sort by: [Recent ▼]  View: [Grid ▼]   ││
│  │ All (25)        │                                          ││
│  │ > Policies (8)  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   ││
│  │   FAQs (5)      │  │  📄     │ │  📄     │ │  📄     │   ││
│  │ > Tech Docs(12) │  │ Refund  │ │ Privacy │ │ Terms   │   ││
│  │ > Uncategorized │  │ Policy  │ │ Policy  │ │ Service │   ││
│  │   (0)           │  │         │ │         │ │         │   ││
│  │                 │  │ 2.3 MB  │ │ 1.8 MB  │ │ 0.9 MB  │   ││
│  │ [+ New Coll.]   │  │ 45 chks │ │ 32 chks │ │ 18 chks │   ││
│  │                 │  │ Nov 15  │ │ Nov 14  │ │ Nov 14  │   ││
│  │                 │  │ [👁️][✏️][🗑️]│ [👁️][✏️][🗑️]│ [👁️][✏️][🗑️]│   ││
│  │                 │  └─────────┘ └─────────┘ └─────────┘   ││
│  │                 │                                          ││
│  │                 │  [Load More...]                          ││
│  └─────────────────┴──────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

Legend:
👁️ - View/Preview
✏️ - Edit metadata
🗑️ - Delete
```

**Key Features:**
1. **Quick Stats Bar** - At-a-glance overview
2. **Search & Filters** - Find documents instantly
3. **Collections Panel** - Organize documents hierarchically
4. **Document Grid/List** - Visual or detailed view
5. **Quick Actions** - View, edit, delete on hover

---

### 2.2 Upload Interface - Step by Step

#### Step 1: Upload Modal Trigger
```
Click [+ Upload] button → Opens Upload Modal
```

#### Step 2: File Selection
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Documents                                     [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │              ⬆️ DRAG & DROP FILES HERE               │  │
│  │                                                       │  │
│  │                      or                              │  │
│  │                                                       │  │
│  │              [📁 Browse Files]                       │  │
│  │                                                       │  │
│  │  ────────────────────────────────────────────────   │  │
│  │  Supported formats: PDF, DOCX, TXT, MD              │  │
│  │  Maximum file size: 50MB                            │  │
│  │  Multiple files: Yes (up to 10 at once)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  💡 Tip: PDFs work best with text-based content             │
│                                                              │
│                                    [Cancel]                 │
└─────────────────────────────────────────────────────────────┘
```

#### Step 3: File Preview & Metadata
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Documents (3 files selected)                  [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ refund_policy.pdf                        (2.3 MB) │  │
│  │   ┌──────────────────────────────────────────────┐  │  │
│  │   │ Collection: [Policies            ▼]          │  │  │
│  │   │ Tags: [refund] [policy] [+ Add tag]         │  │  │
│  │   │ Description: [Optional description...]       │  │  │
│  │   └──────────────────────────────────────────────┘  │  │
│  │   [🗑️ Remove]                                       │  │
│  │                                                      │  │
│  │ ✓ tech_manual.docx                         (5.1 MB) │  │
│  │   ┌──────────────────────────────────────────────┐  │  │
│  │   │ Collection: [Technical Docs      ▼]          │  │  │
│  │   │ Tags: [manual] [guide] [+ Add tag]          │  │  │
│  │   │ Description: [Optional description...]       │  │  │
│  │   └──────────────────────────────────────────────┘  │  │
│  │   [🗑️ Remove]                                       │  │
│  │                                                      │  │
│  │ ⚠️ large_file.pdf                         (75 MB)  │  │
│  │   ❌ Error: File exceeds 50MB limit                │  │
│  │   [🗑️ Remove]                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Advanced Options: [▼ Show]                                 │
│  • Chunk size: [1000] characters                            │
│  • Chunk overlap: [200] characters                          │
│  • Language: [Auto-detect ▼]                                │
│                                                              │
│                                    [Cancel] [Upload Files]  │
└─────────────────────────────────────────────────────────────┘
```

#### Step 4: Upload Progress
```
┌─────────────────────────────────────────────────────────────┐
│  Uploading Documents...                               [✕]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Overall Progress: 1 of 2 files (50%)                       │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░ 50%              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✅ refund_policy.pdf                                 │  │
│  │    ████████████████████████████████████ 100%        │  │
│  │    ✓ Text extracted                                 │  │
│  │    ✓ Split into 45 chunks                           │  │
│  │    ✓ Embeddings generated                           │  │
│  │    ✓ Stored in Milvus                               │  │
│  │                                                      │  │
│  │ ⏳ tech_manual.docx                                  │  │
│  │    ████████████████░░░░░░░░░░░░░░░░░░░░ 45%         │  │
│  │    ✓ Text extracted                                 │  │
│  │    ⏳ Generating embeddings... (54/120 chunks)      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Estimated time remaining: 23 seconds                       │
│                                                              │
│                                               [Cancel Upload]│
└─────────────────────────────────────────────────────────────┘
```

#### Step 5: Success Notification
```
┌─────────────────────────────────────────────────────────────┐
│  ✅ Upload Complete!                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Successfully processed 2 documents:                        │
│                                                              │
│  📄 refund_policy.pdf                                       │
│     • 45 chunks created                                     │
│     • Added to "Policies" collection                        │
│                                                              │
│  📄 tech_manual.docx                                        │
│     • 120 chunks created                                    │
│     • Added to "Technical Docs" collection                  │
│                                                              │
│  ──────────────────────────────────────────────────────    │
│  Your knowledge base now contains:                          │
│  • 27 documents (↑2)                                        │
│  • 1,412 searchable chunks (↑165)                           │
│  • 17.9 MB total (↑7.4 MB)                                  │
│                                                              │
│  Ready to answer questions! 🎉                              │
│                                                              │
│                [View Documents] [Upload More] [Start Chat]  │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 Document Detail View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Knowledge Base                              [✏️ Edit]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📄 refund_policy.pdf                                           │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📋 Document Information                                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • File Size: 2.3 MB                                       │ │
│  │ • Uploaded: Nov 15, 2025 at 2:30 PM                      │ │
│  │ • Chunks: 45 (avg. 512 chars per chunk)                  │ │
│  │ • Collection: Policies                                    │ │
│  │ • Tags: refund, policy, customer-service                 │ │
│  │ • Language: English (auto-detected)                       │ │
│  │ • Status: Active ✓                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📊 Usage Analytics                                        │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • Total Queries: 23                                       │ │
│  │ • Last Accessed: 2 hours ago                             │ │
│  │ • Most Relevant For:                                      │ │
│  │   - "refund policy" (12 times)                           │ │
│  │   - "return product" (5 times)                           │ │
│  │   - "money back" (6 times)                               │ │
│  │                                                           │ │
│  │ [View Query History]                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📝 Content Preview                           [Show All ▼] │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │ Chunk 1 of 45                         [Similarity: 0.95] │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ Our refund policy is designed to ensure customer   │ │ │
│  │ │ satisfaction. Customers may request a full refund  │ │ │
│  │ │ within 30 days of purchase for any reason. To     │ │ │
│  │ │ initiate a refund, please contact our support...  │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ Chunk 2 of 45                         [Similarity: 0.92] │ │
│  │ ┌─────────────────────────────────────────────────────┐ │ │
│  │ │ Refunds are processed within 5-7 business days     │ │ │
│  │ │ from the date of approval. The refund amount will  │ │ │
│  │ │ be credited to the original payment method...      │ │ │
│  │ └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │ [Previous] [Next] [Jump to chunk...]                     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ⚡ Quick Actions                                          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ [💬 Ask about this doc] [📥 Download Original]           │ │
│  │ [✏️ Edit Metadata] [🗑️ Delete Document]                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.4 Collections Management

```
┌─────────────────────────────────────────────────────────────────┐
│  📁 Manage Collections                         [+ New Collection]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Collections organize your knowledge base into logical groups.  │
│  Documents in the same collection are searched together for     │
│  better context and relevance.                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 All Documents                            (25 documents) │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • Default collection (cannot be deleted)                  │ │
│  │ • Used in 150 queries                                     │ │
│  │ • Created: Nov 1, 2025                                    │ │
│  │                                                           │ │
│  │ [✓ Set as Default for Chat]                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📂 Policies                                 (8 documents)  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • Company policies and procedures                         │ │
│  │ • Used in 45 queries                                      │ │
│  │ • Created: Nov 5, 2025                                    │ │
│  │ • Documents: refund_policy.pdf, privacy_policy.pdf...    │ │
│  │                                                           │ │
│  │ [✏️ Rename] [🎨 Change Color] [🗑️ Delete Collection]     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📂 Technical Documentation                (12 documents)  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • API docs, user guides, technical manuals                │ │
│  │ • Used in 89 queries                                      │ │
│  │ • Created: Nov 3, 2025                                    │ │
│  │ • Documents: api_reference.pdf, user_guide.docx...       │ │
│  │                                                           │ │
│  │ [✏️ Rename] [🎨 Change Color] [🗑️ Delete Collection]     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📂 FAQs                                     (5 documents)  │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ • Frequently asked questions and answers                  │ │
│  │ • Used in 16 queries                                      │ │
│  │ • Created: Nov 10, 2025                                   │ │
│  │ • Documents: general_faq.txt, billing_faq.txt...         │ │
│  │                                                           │ │
│  │ [✏️ Rename] [🎨 Change Color] [🗑️ Delete Collection]     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Creating New Collection:**
```
┌─────────────────────────────────────────────────────┐
│  Create New Collection                        [✕]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Collection Name *                                   │
│  [Marketing Materials                      ]        │
│                                                      │
│  Description (optional)                              │
│  [Marketing docs, brochures, presentations ]        │
│                                                      │
│  Color Theme                                         │
│  [🔴] [🟠] [🟡] [🟢] [🔵] [🟣] [⚫]                 │
│                                                      │
│  Import documents from:                              │
│  [ ] Another collection                              │
│  [ ] Upload new files                                │
│                                                      │
│                              [Cancel] [Create]      │
└─────────────────────────────────────────────────────┘
```

---

### 2.5 Search & Filter Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🔍 Search: [refund                              ] [🔎]   │ │
│  │                                                           │ │
│  │  Filters: [▼ Show Advanced]                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Advanced Filters                                         │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  Collection:     [All Collections        ▼]              │ │
│  │  File Type:      [All Types             ▼]              │ │
│  │  Date Range:     [Last 30 days          ▼]              │ │
│  │  Size:           [Any size              ▼]              │ │
│  │  Tags:           [+ Add tag filter]                      │ │
│  │  Sort By:        [Relevance             ▼]              │ │
│  │                                                           │ │
│  │  [Clear All] [Apply Filters]                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Search Results (3 documents)                             │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │                                                           │ │
│  │  📄 refund_policy.pdf                 [Match: 95%] 🟢    │ │
│  │  Policies | 2.3 MB | 45 chunks | Nov 15, 2025           │ │
│  │  Tags: refund, policy                                    │ │
│  │  "...customer may request a full refund within 30..."   │ │
│  │  [View] [Chat with this doc]                            │ │
│  │                                                           │ │
│  │  📄 refund_faq.txt                    [Match: 87%] 🟡    │ │
│  │  FAQs | 0.5 MB | 12 chunks | Nov 10, 2025               │ │
│  │  Tags: refund, faq, customer-support                     │ │
│  │  "...Q: How do I request a refund? A: Contact..."       │ │
│  │  [View] [Chat with this doc]                            │ │
│  │                                                           │ │
│  │  📄 terms_of_service.pdf              [Match: 62%] 🟠    │ │
│  │  Policies | 1.8 MB | 34 chunks | Nov 8, 2025            │ │
│  │  Tags: legal, terms                                      │ │
│  │  "...refunds are subject to the terms outlined..."      │ │
│  │  [View] [Chat with this doc]                            │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Tip: Use "Chat with this doc" to ask questions about        │
│     specific documents!                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Bulk Operations

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base                       [Bulk Actions ▼]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [☑️ Select All] [⬜ Deselect All]      3 documents selected    │
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐│
│  │[✓] 📄  │[✓] 📄  │[✓] 📄  │[ ] 📄  │[ ] 📄  │[ ] 📄  ││
│  │Refund  │Privacy │Terms   │Tech    │User    │API     ││
│  │Policy  │Policy  │Service │Manual  │Guide   │Docs    ││
│  │        │        │        │        │        │        ││
│  │2.3 MB  │1.8 MB  │0.9 MB  │5.1 MB  │3.2 MB  │2.7 MB  ││
│  │45 chks │32 chks │18 chks │120chks │67 chks │54 chks ││
│  │Nov 15  │Nov 14  │Nov 14  │Nov 13  │Nov 12  │Nov 11  ││
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘│
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Bulk Actions for 3 selected documents:                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  [📂 Move to Collection] [🏷️ Add Tags] [🗑️ Delete All]   │ │
│  │  [🔒 Archive]                                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Delete Confirmation (Soft Delete):**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Delete Documents                           [✕]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Are you sure you want to delete 3 documents?       │
│                                                      │
│  Documents will be marked for deletion:              │
│  • refund_policy.pdf (8.0 MB, 45 chunks)            │
│  • privacy_policy.pdf (2.5 MB, 28 chunks)           │
│  • terms_of_service.pdf (5.1 MB, 22 chunks)         │
│                                                      │
│  ℹ️ The documents will be removed from your         │
│     knowledge base immediately. Complete cleanup    │
│     from storage will happen in the background.     │
│                                                      │
│                              [Cancel] [Delete]      │
└─────────────────────────────────────────────────────┘
```

**Success Feedback (Instant Response):**
```
┌─────────────────────────────────────────────────────┐
│  ✅ Documents Deleted Successfully                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  3 documents have been removed from your            │
│  knowledge base.                                     │
│                                                      │
│  • Freed storage quota: 15.6 MB                     │
│  • Removed chunks: 95                                │
│                                                      │
│  Storage cleanup is in progress...                   │
│                                                      │
│                                         [Close]      │
└─────────────────────────────────────────────────────┘
```

---

## 3. Chat Screen with Knowledge Base Integration

### 3.1 Main Chat Interface

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Chat with Knowledge Base                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Search in: [All Collections ▼]     Top results: [5 ▼]         │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  Welcome! Ask me anything about your knowledge base.     │ │
│  │  I have access to 25 documents with 1,247 chunks.       │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ 👤 You (2:30 PM)                                    │ │ │
│  │  │ What is our refund policy?                          │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │ 🤖 Assistant (2:30 PM)              [Searching...] │ │ │
│  │  │                                                     │ │ │
│  │  │ Based on your knowledge base, here's the refund    │ │ │
│  │  │ policy:                                             │ │ │
│  │  │                                                     │ │ │
│  │  │ Customers can request a full refund within 30 days │ │ │
│  │  │ of purchase for any reason. Refunds are processed  │ │ │
│  │  │ within 5-7 business days and credited to the       │ │ │
│  │  │ original payment method.                            │ │ │
│  │  │                                                     │ │ │
│  │  │ 📚 Sources:                                         │ │ │
│  │  │ • refund_policy.pdf (Chunk 1, 2) - Match: 95% 🟢   │ │ │
│  │  │   [View Document]                                   │ │ │
│  │  │                                                     │ │ │
│  │  │ [👍] [👎] [📋 Copy] [🔄 Regenerate]                │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  [Type your question here...                            ] │ │
│  │                                                     [Send]│ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Suggested questions:                                        │
│  • How do I return a product?                                  │
│  • What are your shipping policies?                            │
│  • Tell me about technical specifications                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Chat Controls Explanation:**

- **Search in: [All Collections ▼]**: Filters which documents to search (e.g., only "Policies" collection)
- **Top results: [5 ▼]**: Controls the `top_k` parameter for vector search (how many chunks to retrieve: 3, 5, 10)
  - Higher values = more context but slower response
  - Lower values = faster but may miss relevant info
  - Default: 5 chunks (good balance)

---

### 3.2 Chat with Source Citations

**Click on [View Document] from sources:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📄 Source: refund_policy.pdf                             [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Chunk 1 (Similarity: 0.95)                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Our refund policy is designed to ensure customer         │ │
│  │ satisfaction. Customers may request a full refund        │ │
│  │ within 30 days of purchase for any reason. To            │ │
│  │ initiate a refund, please contact our support team...    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Chunk 2 (Similarity: 0.92)                                     │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Refunds are processed within 5-7 business days from      │ │
│  │ the date of approval. The refund amount will be          │ │
│  │ credited to the original payment method...               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [View Full Document] [Ask follow-up question]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Collection-Specific Chat

```
┌─────────────────────────────────────────────────────────────────┐
│  💬 Chat with Knowledge Base                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔍 Searching in: [Policies Only ▼]    📚 8 docs, 245 chunks   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🤖 I'm now focused on the "Policies" collection.        │ │
│  │     Ask me about company policies, procedures, and rules. │ │
│  │                                                           │ │
│  │  ... chat messages ...                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Switch to All Collections] [Manage Collections]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Responsive Design (Mobile View)

```
┌─────────────────────┐
│  🤖 KB Chat    ☰   │
├─────────────────────┤
│                     │
│ 📚 Knowledge Base   │
│                     │
│ ┌─────────────────┐│
│ │ 📊 Quick Stats  ││
│ │ 25 docs         ││
│ │ 1.2K chunks     ││
│ │ 12.5 MB         ││
│ └─────────────────┘│
│                     │
│ [+ Upload]          │
│                     │
│ 🔍 [Search...]      │
│                     │
│ Collections:        │
│ ▶ All (25)          │
│ ▶ Policies (8)      │
│ ▶ Tech Docs (12)    │
│                     │
│ Recent Docs:        │
│ ┌─────────────────┐│
│ │ 📄 Refund       ││
│ │    Policy       ││
│ │ 2.3 MB, 45 chks ││
│ │ [👁️] [🗑️]       ││
│ └─────────────────┘│
│ ┌─────────────────┐│
│ │ 📄 Privacy      ││
│ │    Policy       ││
│ │ 1.8 MB, 32 chks ││
│ │ [👁️] [🗑️]       ││
│ └─────────────────┘│
│                     │
│ [Load More...]      │
│                     │
└─────────────────────┘
```

---

## 5. State Management & Data Flow

### Frontend State (React Context / Zustand)

```javascript
// Using Zustand for global state management
import { create } from 'zustand';

export const useStore = create((set) => ({
  // Knowledge Base State
  documents: [],
  selectedCollection: 'All',
  collections: [],
  uploadProgress: {},
  selectedDocuments: [],
  
  // Chat State
  messages: [],
  currentQuery: '',
  contextMode: 'auto',
  
  // UI State
  currentPage: 'knowledge_base',
  showFilters: false,
  modalOpen: false,
  
  // Actions
  setDocuments: (documents) => set({ documents }),
  addDocument: (document) => set((state) => ({ 
    documents: [...state.documents, document] 
  })),
  removeDocument: (id) => set((state) => ({ 
    documents: state.documents.filter(doc => doc.id !== id) 
  })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
}));

// Or using React Context
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    documents: [],
    selectedCollection: 'All',
    collections: [],
    messages: [],
    // ... other state
  });
  
  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  );
};
```

### API Interaction Flow

#### Upload Document (React):
```javascript
// DocumentUpload.jsx
import axios from 'axios';
import apiClient from '../api/client';

const uploadDocument = async (files, metadata) => {
  const formData = new FormData();

  // Add files (can be single or multiple)
  if (Array.isArray(files)) {
    files.forEach(file => formData.append('file', file));
  } else {
    formData.append('file', files);
  }

  // Add optional metadata as form fields (not JSON)
  if (metadata?.category) {
    formData.append('category', metadata.category);
  }
  if (metadata?.tags && Array.isArray(metadata.tags)) {
    formData.append('tags', metadata.tags.join(','));
  }

  try {
    const response = await apiClient.post(
      '/api/v1/documents/upload',  // Updated endpoint
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Authorization header auto-added by apiClient interceptor
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      }
    );

    // Update documents list
    setDocuments([...documents, ...response.data.documents]);
    showSuccessNotification('Documents uploaded successfully!');
  } catch (error) {
    // Handle specific errors
    if (error.response?.status === 400) {
      const errorCode = error.response.data?.error;
      if (errorCode === 'FILE_TOO_LARGE') {
        showErrorNotification('File too large. Maximum size: 50MB');
      } else if (errorCode === 'UNSUPPORTED_FORMAT') {
        showErrorNotification('Invalid file type. Use PDF, DOCX, TXT, or MD');
      } else {
        showErrorNotification(error.response.data?.message || 'Upload failed');
      }
    } else if (error.response?.status === 413) {
      showErrorNotification('Storage quota exceeded');
    } else {
      showErrorNotification('Upload failed: ' + error.message);
    }
  }
};
```

**Complete Upload Component Example:**

```javascript
// src/components/Upload/DocumentUpload.jsx
import { useState } from 'react';
import apiClient from '../../api/client';

export default function DocumentUpload({ onSuccess }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types
    const allowedTypes = ['.pdf', '.txt', '.docx', '.md'];
    const invalidFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return !allowedTypes.includes(ext);
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Validate file sizes
    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setError('');
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setError('');
    setProgress(0);

    const formData = new FormData();

    // Add files
    selectedFiles.forEach(file => {
      formData.append('file', file);
    });

    // Add metadata
    if (category) formData.append('category', category);
    if (tags) formData.append('tags', tags);

    try {
      const response = await apiClient.post(
        '/api/v1/documents/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        }
      );

      // Success
      setSelectedFiles([]);
      setCategory('');
      setTags('');
      setProgress(100);

      if (onSuccess) {
        onSuccess(response.data.documents);
      }

    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid file');
      } else if (err.response?.status === 413) {
        setError('Storage quota exceeded');
      } else {
        setError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Upload Documents</h2>

      {/* File Input */}
      <input
        type="file"
        multiple
        accept=".pdf,.txt,.docx,.md"
        onChange={handleFileChange}
        className="block w-full mb-4"
        disabled={uploading}
      />

      {/* Metadata */}
      <input
        type="text"
        placeholder="Category (optional)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="block w-full mb-2 px-3 py-2 border rounded"
        disabled={uploading}
      />

      <input
        type="text"
        placeholder="Tags (comma-separated, optional)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        className="block w-full mb-4 px-3 py-2 border rounded"
        disabled={uploading}
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Selected Files:</p>
          {selectedFiles.map((file, idx) => (
            <p key={idx} className="text-sm text-gray-600">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {uploading && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">{progress}% uploaded</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={selectedFiles.length === 0 || uploading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
      </button>
    </div>
  );
}
```

#### Query Document (React):
```javascript
// ChatInterface.jsx
const sendQuery = async (query) => {
  try {
    // Add user message to UI
    addMessage({ role: 'user', content: query });
    
    // Call backend
    const response = await axios.post(
      'http://localhost:8000/api/v1/chat',
      { 
        query, 
        collection_filter: selectedCollection,
        top_k: 5 
      }
    );
    
    // Add assistant response
    addMessage({ 
      role: 'assistant', 
      content: response.data.answer,
      sources: response.data.sources
    });
  } catch (error) {
    showErrorNotification('Query failed: ' + error.message);
  }
};
```

#### Manage Collections (React):
```javascript
// CollectionManager.jsx
const createCollection = async (name, description) => {
  try {
    const response = await axios.post(
      'http://localhost:8000/api/v1/collections',
      { name, description }
    );
    
    setCollections([...collections, response.data]);
    showSuccessNotification(`Collection "${name}" created!`);
  } catch (error) {
    showErrorNotification('Failed to create collection');
  }
};

const assignDocumentToCollection = async (documentId, collectionName) => {
  try {
    await axios.patch(
      `http://localhost:8000/api/v1/documents/${documentId}`,
      { collection_name: collectionName }
    );
    
    // Update document in state
    updateDocument(documentId, { collection_name: collectionName });
  } catch (error) {
    showErrorNotification('Failed to update document');
  }
};
```

### React Component Structure

```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatWindow.jsx         # Main chat container
│   │   ├── MessageList.jsx        # Display messages
│   │   ├── ChatInput.jsx          # Input field
│   │   └── SourceCard.jsx         # Display sources
│   │
│   ├── Upload/
│   │   ├── UploadZone.jsx         # Drag & drop zone
│   │   ├── FilePreview.jsx        # Preview selected files
│   │   ├── UploadProgress.jsx     # Progress indicator
│   │   └── MetadataForm.jsx       # Collection/tags input
│   │
│   ├── KnowledgeBase/
│   │   ├── DocumentList.jsx       # List/grid of documents
│   │   ├── DocumentCard.jsx       # Single document card
│   │   ├── DocumentDetail.jsx     # Document detail view
│   │   ├── CollectionManager.jsx  # Manage collections
│   │   └── SearchFilter.jsx       # Search & filter UI
│   │
│   ├── Layout/
│   │   ├── Layout.jsx             # Main layout wrapper
│   │   ├── Header.jsx             # Top navigation
│   │   ├── Sidebar.jsx            # Side navigation
│   │   └── Modal.jsx              # Reusable modal
│   │
│   └── ui/                        # shadcn/ui components
│       ├── button.jsx
│       ├── dialog.jsx
│       ├── input.jsx
│       └── ...
│
├── lib/
│   ├── api.js                     # Axios API client
│   └── utils.js                   # Helper functions
│
├── hooks/
│   ├── useDocuments.js            # Document operations
│   ├── useChat.js                 # Chat operations
│   └── useUpload.js               # Upload operations
│
└── store/
    └── index.js                   # Zustand store
```

### Example React Components

#### ChatWindow Component
```jsx
// src/components/Chat/ChatWindow.jsx
import { useState } from 'react';
import { useStore } from '@/store';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import axios from 'axios';

export default function ChatWindow() {
  const { messages, addMessage, selectedCollection } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendMessage = async (query) => {
    setIsLoading(true);
    
    // Add user message
    addMessage({ role: 'user', content: query });
    
    try {
      const response = await axios.post('/api/v1/chat', {
        query,
        collection_filter: selectedCollection === 'All' ? null : selectedCollection,
        top_k: 5
      });
      
      // Add assistant message
      addMessage({
        role: 'assistant',
        content: response.data.answer,
        sources: response.data.sources,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} />
      </div>
      <div className="border-t p-4">
        <ChatInput 
          onSend={handleSendMessage} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
```

#### UploadZone Component
```jsx
// src/components/Upload/UploadZone.jsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

export default function UploadZone({ onFilesSelected }) {
  const [files, setFiles] = useState([]);
  
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });
  
  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
      `}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium text-gray-700">
        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        or click to browse
      </p>
      <p className="text-xs text-gray-400 mt-4">
        Supported: PDF, DOCX, TXT, MD (max 50MB)
      </p>
    </div>
  );
}
```

#### DocumentCard Component
```jsx
// src/components/KnowledgeBase/DocumentCard.jsx
import { FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DocumentCard({ document, onView, onEdit, onDelete }) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <FileText className="w-10 h-10 text-blue-500" />
          <div>
            <h3 className="font-medium text-gray-900 truncate">
              {document.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {document.size} • {document.chunks_count} chunks
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {document.upload_date}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView(document)}
        >
          <Eye className="w-4 h-4 mr-1" /> View
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onEdit(document)}
        >
          <Edit className="w-4 h-4 mr-1" /> Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDelete(document)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}
```

#### Document Delete with Soft Delete Pattern

```jsx
// src/components/KnowledgeBase/DeleteDocumentModal.jsx
import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

export default function DeleteDocumentModal({
  documents,
  onClose,
  onSuccess
}) {
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState('');
  const [deleteStats, setDeleteStats] = useState(null);

  const totalSize = documents.reduce((sum, doc) => sum + doc.size_bytes, 0);
  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks_count, 0);

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      // Delete all documents in parallel (use allSettled for robustness)
      const results = await Promise.allSettled(
        documents.map(doc =>
          apiClient.delete(`/api/v1/documents/${doc.document_id}`)
        )
      );

      // Count successes and failures
      const succeeded = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length === 0) {
        // All deletions succeeded
        setDeleted(true);
        setDeleteStats({
          total: documents.length,
          succeeded: succeeded.length,
          failed: 0,
          failedDocs: []
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else if (succeeded.length === 0) {
        // All deletions failed
        setError(`Failed to delete ${failed.length} document${failed.length > 1 ? 's' : ''}. Please try again.`);
        setDeleting(false);
      } else {
        // Partial success - show graceful error
        const failedDocs = documents.filter((doc, idx) => results[idx].status === 'rejected');

        setDeleted(true);
        setDeleteStats({
          total: documents.length,
          succeeded: succeeded.length,
          failed: failed.length,
          failedDocs: failedDocs.map(d => d.filename)
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete documents');
      setDeleting(false);
    }
  };

  if (deleted) {
    const isPartialSuccess = deleteStats && deleteStats.failed > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className={`flex items-center space-x-3 mb-4 ${
            isPartialSuccess ? 'text-amber-600' : 'text-green-600'
          }`}>
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">
              {isPartialSuccess ? 'Partial Success' : 'Documents Deleted Successfully'}
            </h3>
          </div>

          {isPartialSuccess ? (
            <>
              <p className="text-gray-700 mb-4">
                Successfully deleted {deleteStats.succeeded} of {deleteStats.total} document
                {deleteStats.total > 1 ? 's' : ''}.
              </p>

              {/* Failed documents list */}
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Failed to delete {deleteStats.failed} document{deleteStats.failed > 1 ? 's' : ''}:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  {deleteStats.failedDocs.map((filename, idx) => (
                    <li key={idx}>• {filename}</li>
                  ))}
                </ul>
                <p className="text-xs text-red-600 mt-2">
                  These documents may be in use or locked. Please try again later.
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-700 mb-4">
              {documents.length} document{documents.length > 1 ? 's have' : ' has'} been
              removed from your knowledge base.
            </p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              • Freed storage quota: {(totalSize / (1024 * 1024)).toFixed(1)} MB
            </p>
            <p className="text-sm text-blue-800">
              • Removed chunks: {totalChunks}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Storage cleanup is in progress...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold text-gray-900">Delete Documents</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={deleting}
          >
            ✕
          </button>
        </div>

        <p className="text-gray-700 mb-4">
          Are you sure you want to delete {documents.length} document{documents.length > 1 ? 's' : ''}?
        </p>

        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Documents will be marked for deletion:</p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {documents.map(doc => (
              <div key={doc.document_id} className="text-sm text-gray-600 pl-2">
                • {doc.filename} ({(doc.size_bytes / (1024 * 1024)).toFixed(1)} MB, {doc.chunks_count} chunks)
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            ℹ️ The documents will be removed from your knowledge base immediately.
            Complete cleanup from storage will happen in the background.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

#### Document List with Soft Delete Support

```jsx
// src/components/KnowledgeBase/DocumentList.jsx
import { useState, useEffect } from 'react';
import DocumentCard from './DocumentCard';
import DeleteDocumentModal from './DeleteDocumentModal';
import apiClient from '@/lib/api';

export default function DocumentList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/documents');

      // Filter out soft-deleted documents (status="deleted")
      // Backend should already exclude these, but double-check on frontend
      const activeDocuments = response.data.documents.filter(
        doc => doc.status !== 'deleted'
      );

      setDocuments(activeDocuments);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (document) => {
    setSelectedDocuments([document]);
    setDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    // Optimistically remove deleted documents from UI
    setDocuments(prev =>
      prev.filter(doc =>
        !selectedDocuments.some(selected => selected.document_id === doc.document_id)
      )
    );

    // Optionally refetch to ensure sync with backend
    // fetchDocuments();
  };

  if (loading) {
    return <div className="text-center py-8">Loading documents...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <DocumentCard
            key={doc.document_id}
            document={doc}
            onView={(doc) => console.log('View', doc)}
            onEdit={(doc) => console.log('Edit', doc)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {deleteModalOpen && (
        <DeleteDocumentModal
          documents={selectedDocuments}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
```

**Key Implementation Details:**

1. **Instant API Response**: DELETE endpoint returns immediately after marking `status="deleted"` in PostgreSQL
2. **Optimistic UI Update**: Documents removed from UI instantly without waiting for background cleanup
3. **Robust Bulk Delete**: Uses `Promise.allSettled` instead of `Promise.all` for graceful partial success handling
4. **Partial Success Feedback**: If 9/10 deletions succeed, shows "Successfully deleted 9 of 10 documents" with list of failed files
5. **Filter Active Documents**: Document list only displays `status="active"` documents
6. **Error Handling**: If soft delete fails, show error without breaking UI
7. **Background Cleanup**: arq job handles Milvus → B2 → PostgreSQL cleanup asynchronously

**Why `Promise.allSettled` Over `Promise.all`?**

- **`Promise.all`** (fail-fast): If deleting 10 documents and #3 fails, the entire operation rejects immediately. Documents #4-10 are never attempted. User sees generic error: "Failed to delete documents."

- **`Promise.allSettled`** (resilient): Attempts all 10 deletions regardless of failures. Afterwards, analyzes results and shows graceful message: "Successfully deleted 9 of 10 documents. Failed: file3.pdf (locked)."

This provides a much better user experience for bulk operations.

---

## 6. Key UX Principles

### 1. **Progressive Disclosure**
- Start simple (drag & drop)
- Show advanced options on demand
- Hide complexity until needed

### 2. **Immediate Feedback**
- Loading indicators for all async operations
- Success/error notifications
- Real-time progress bars

### 3. **Clear Information Hierarchy**
- Most important info (stats) at top
- Actions (upload, delete) clearly visible
- Secondary info (metadata) collapsible

### 4. **Forgiving Interactions**
- Confirmation for destructive actions
- Undo options where possible
- Clear error messages with solutions

### 5. **Discoverability**
- Tooltips on hover
- Suggested actions
- Empty state instructions

---

## 7. Accessibility Features

- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Reader Support**: ARIA labels on all components
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Clear focus states
- **Alt Text**: All icons have descriptive labels

---

## 8. Performance Considerations

### Frontend Optimizations (React):
- **Code Splitting**: Lazy load routes and components
  ```jsx
  const DocumentDetail = lazy(() => import('./components/DocumentDetail'));
  ```
- **Memoization**: Use React.memo() for expensive components
- **Virtual Scrolling**: For large document lists (react-window)
- **Debounced Search**: Delay search API calls
  ```jsx
  const debouncedSearch = useDebouncedCallback((query) => {
    searchDocuments(query);
  }, 500);
  ```
- **Optimistic Updates**: Update UI before API response
- **API Response Caching**: Use React Query or SWR
  ```jsx
  const { data, isLoading } = useQuery('documents', fetchDocuments);
  ```

### Backend Optimizations:
- Async file processing
- Batch embedding generation
- Connection pooling (Milvus)
- Response caching with Redis

---

## 9. Error Handling & User Feedback

### Error Toast/Notification Component
```jsx
// src/components/ui/ErrorToast.jsx
import { AlertCircle, X } from 'lucide-react';

export default function ErrorToast({ error, onClose }) {
  const getErrorMessage = (error) => {
    // Map backend errors to user-friendly messages
    const errorMessages = {
      'FILE_TOO_LARGE': `File exceeds 50MB limit`,
      'UNSUPPORTED_FORMAT': 'File format not supported. Use PDF, DOCX, TXT, or MD',
      'PROCESSING_FAILED': 'Failed to extract text. File may be corrupted or password-protected',
      'EMBEDDING_FAILED': 'Temporary AI service error. Please try again',
      'VECTOR_DB_ERROR': 'Storage service temporarily unavailable. Please retry',
      'NO_RESULTS': 'No relevant information found in your knowledge base',
      'RATE_LIMIT': 'Too many requests. Please wait a moment',
      'NETWORK_ERROR': 'Connection lost. Check your internet connection',
    };

    return errorMessages[error.code] || error.message || 'An error occurred';
  };

  return (
    <div className="fixed top-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
        <div className="flex-1">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-1">{getErrorMessage(error)}</p>
          {error.action && (
            <button
              onClick={error.action.onClick}
              className="text-sm text-red-600 underline mt-2"
            >
              {error.action.label}
            </button>
          )}
        </div>
        <button onClick={onClose} className="ml-4">
          <X className="w-5 h-5 text-red-400 hover:text-red-600" />
        </button>
      </div>
    </div>
  );
}
```

### Upload Error Handling Example
```jsx
// src/components/Upload/UploadProgress.jsx
const uploadDocument = async (file) => {
  try {
    // File size validation
    if (file.size > 50 * 1024 * 1024) {
      throw {
        code: 'FILE_TOO_LARGE',
        message: `${file.name} exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
        action: { label: 'Try compressing the file', onClick: () => {} }
      };
    }

    // Upload with progress
    const response = await axios.post('/api/v1/upload', formData, {
      onUploadProgress: (e) => setProgress((e.loaded / e.total) * 100)
    });

    showSuccess('Document uploaded successfully!');
  } catch (error) {
    if (error.response?.status === 400) {
      showError({
        code: 'UNSUPPORTED_FORMAT',
        message: error.response.data.message
      });
    } else if (error.response?.status === 500) {
      showError({
        code: 'PROCESSING_FAILED',
        message: 'Server error processing file',
        action: { label: 'Retry', onClick: () => uploadDocument(file) }
      });
    } else {
      showError({
        code: 'NETWORK_ERROR',
        message: 'Upload failed',
        action: { label: 'Retry', onClick: () => uploadDocument(file) }
      });
    }
  }
};
```

### Chat Error States
```jsx
// src/components/Chat/ChatWindow.jsx
const [errorState, setErrorState] = useState(null);

const handleEmptyKnowledgeBase = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <FileText className="w-16 h-16 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-700">Your knowledge base is empty</h3>
      <p className="text-sm text-gray-500 mt-2">Upload documents to get started</p>
      <Button onClick={() => navigate('/knowledge-base')} className="mt-4">
        Upload Documents
      </Button>
    </div>
  );
};

const handleNoResults = (query) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800">
        I couldn't find relevant information for "{query}"
      </p>
      <p className="text-sm text-blue-600 mt-2">
        Try:
      </p>
      <ul className="text-sm text-blue-600 mt-1 list-disc list-inside">
        <li>Rephrasing your question</li>
        <li>Uploading related documents</li>
        <li>Using different keywords</li>
      </ul>
    </div>
  );
};
```

### Connection Status Indicator
```jsx
// src/components/Layout/ConnectionStatus.jsx
import { Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnecting, setShowReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnecting(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnecting(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline || showReconnecting) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50">
        <WifiOff className="inline w-4 h-4 mr-2" />
        {showReconnecting ? 'Reconnecting...' : 'No internet connection'}
      </div>
    );
  }

  return null;
}
```

---

## 10. Document Download Feature

### Download Original File

Users can download the original uploaded file (PDF, DOCX, TXT, MD) from Backblaze B2 storage.

**Download Button Implementation:**
```jsx
// src/components/DocumentViewer/DownloadButton.jsx
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

export default function DownloadButton({ documentId, filename }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get pre-signed download URL (Bearer token auto-added by axios interceptor)
      const response = await axios.get(
        `/api/v1/documents/${documentId}/download`
      );

      const { download_url, filename: serverFilename, size_bytes, expires_in } = response.data;

      // Show confirmation for large files
      if (size_bytes > 10 * 1024 * 1024) {  // > 10MB
        const sizeMB = (size_bytes / (1024 * 1024)).toFixed(1);
        const confirmed = window.confirm(
          `Download ${serverFilename} (${sizeMB} MB)?`
        );
        if (!confirmed) {
          setIsLoading(false);
          return;
        }
      }

      // Download file
      const link = document.createElement('a');
      link.href = download_url;
      link.download = serverFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      showToast('success', `Downloading ${serverFilename}...`);

    } catch (err) {
      if (err.response?.status === 403) {
        setError('You don\'t have permission to download this file');
      } else if (err.response?.status === 404) {
        setError('File not found');
      } else {
        setError('Download failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download Original
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
```

**Security Considerations:**
- Pre-signed URLs expire after 15 minutes
- Requires authentication (Bearer token)
- Ownership verification on backend (user can only download their own documents)
- Large file confirmation dialog (>10MB)
- Token automatically included via axios interceptor

---

## 11. Authentication UI (JWT with Refresh + Access Tokens)

### Auth Context with Token Refresh

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track if we're currently refreshing to avoid multiple refresh requests
  const isRefreshing = useRef(false);
  const refreshSubscribers = useRef([]);

  useEffect(() => {
    // Check for stored tokens on mount
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (storedAccessToken && storedRefreshToken) {
      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`;
      // Verify token is still valid
      verifyToken(storedAccessToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      // Verify by fetching user profile
      const response = await axios.get('/api/v1/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      // Access token might be expired - try refreshing
      if (err.response?.status === 403 || err.response?.status === 401) {
        await handleTokenRefresh();
      } else {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenRefresh = async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (!storedRefreshToken) {
      logout();
      return null;
    }

    try {
      const response = await axios.post(
        '/api/v1/auth/refresh',
        {},
        {
          headers: { Authorization: `Bearer ${storedRefreshToken}` }
        }
      );

      const { access_token } = response.data;

      // Store new access token
      localStorage.setItem('access_token', access_token);
      setAccessToken(access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return access_token;
    } catch (err) {
      // Refresh token expired or invalid - logout
      logout();
      return null;
    }
  };

  const onRefreshed = (token) => {
    refreshSubscribers.current.forEach((callback) => callback(token));
    refreshSubscribers.current = [];
  };

  const addRefreshSubscriber = (callback) => {
    refreshSubscribers.current.push(callback);
  };

  const login = async (email, password) => {
    const response = await axios.post('/api/v1/auth/login', { email, password });
    const { access_token, refresh_token, user } = response.data;

    // Store both tokens
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    setIsAuthenticated(true);

    // Set default auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    return { success: true, user };
  };

  const register = async (email, password) => {
    const response = await axios.post('/api/v1/auth/register', { email, password });
    const { access_token, refresh_token, user } = response.data;

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);

    setAccessToken(access_token);
    setRefreshToken(refresh_token);
    setUser(user);
    setIsAuthenticated(true);

    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    return { success: true, user };
  };

  const logout = async () => {
    try {
      // Revoke access token on backend (adds to blocklist)
      await axios.post('/api/v1/auth/logout');
    } catch (err) {
      // Ignore logout errors - continue with local cleanup
    }

    // Clear all tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      refreshToken,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      handleTokenRefresh,
      isRefreshing,
      onRefreshed,
      addRefreshSubscriber
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Login/Register Screen

```jsx
// src/pages/Auth.jsx
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        // Registration requires invite code
        await register(email, password, inviteCode);
      }
      navigate('/knowledge-base');
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        (isLogin ? 'Invalid email or password' : 'Registration failed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Knowledge Base</h1>
            <p className="mt-2 text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 8 characters
                </p>
              )}
            </div>

            {/* Invite Code (Registration Only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="KB-XXXX-XXXX-XXXX"
                    required
                    minLength={17}
                    maxLength={17}
                    pattern="KB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the 17-character invite code you received
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Protected Routes

```jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Usage in App.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/knowledge-base"
    element={
      <ProtectedRoute>
        <KnowledgeBase />
      </ProtectedRoute>
    }
  />
</Routes>
```

---

## 11.2. User Settings Page

### Settings Page Component

```jsx
// src/pages/Settings.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../api/client';
import { User, Lock, HardDrive, LogOut } from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuth();
  const [storageUsage, setStorageUsage] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchStorageUsage();
  }, []);

  const fetchStorageUsage = async () => {
    try {
      const response = await apiClient.get('/api/v1/users/me/storage');
      setStorageUsage(response.data);
    } catch (err) {
      console.error('Failed to fetch storage usage', err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      await apiClient.post('/api/v1/auth/change-password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to change password'
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    // Redirect handled by AuthContext
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = storageUsage
    ? (storageUsage.used / storageUsage.limit) * 100
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Member Since</label>
            <p className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Storage Usage */}
      {storageUsage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold">Storage Usage</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">
                  {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    storagePercentage > 90
                      ? 'bg-red-500'
                      : storagePercentage > 70
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(storagePercentage)}% used
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{storageUsage.total_documents}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available Space</p>
                <p className="text-2xl font-bold">
                  {formatBytes(storageUsage.limit - storageUsage.used)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>

        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Change Password
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                minLength={8}
              />
            </div>

            {message.text && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Save New Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setMessage({ type: '', text: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logout */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-4">
          <LogOut className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-semibold">Session</h2>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
```

**Route Addition:**
```jsx
// App.jsx
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
```

---

## 11.3. Forgot/Reset Password Flow

### Forgot Password Page

```jsx
// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await apiClient.post('/api/v1/auth/password-reset/request', { email });
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-6">
              If an account with that email exists, we've sent a password reset link to{' '}
              <strong>{email}</strong>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="mt-2 text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Reset Password Page

```jsx
// src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/client';
import { Lock, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/api/v1/auth/password-reset/confirm', {
        token,
        new_password: password
      });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Invalid or expired reset token. Please request a new one.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600">Invalid reset link</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-gray-600">Enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Routes Addition:**
```jsx
// App.jsx
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

**Add Link to Login Page:**
```jsx
// In Auth.jsx, add below password field for login mode:
{isLogin && (
  <div className="text-right">
    <Link
      to="/forgot-password"
      className="text-sm text-blue-600 hover:text-blue-700"
    >
      Forgot password?
    </Link>
  </div>
)}
```

---

## 11.4. Admin Invite Code Management

### Invite Code Management Page (Admin Only)

```jsx
// src/pages/admin/InviteCodes.jsx
import { useState, useEffect } from 'react';
import { Plus, Copy, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import apiClient from '../api/client';

export default function InviteCodes() {
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'expired', 'revoked'

  useEffect(() => {
    fetchInviteCodes();
  }, [filter]);

  const fetchInviteCodes = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await apiClient.get('/api/v1/admin/invite-codes', { params });
      setInviteCodes(response.data);
    } catch (error) {
      console.error('Failed to fetch invite codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code) => {
    await navigator.clipboard.writeText(code);
    // Show toast notification
  };

  const revokeCode = async (codeId) => {
    if (!confirm('Are you sure you want to revoke this invite code?')) return;

    try {
      await apiClient.delete(`/api/v1/admin/invite-codes/${codeId}`);
      fetchInviteCodes();
    } catch (error) {
      console.error('Failed to revoke code:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'revoked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite Codes</h1>
          <p className="text-gray-600 mt-1">Manage user registration invites</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Generate Code
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {['all', 'active', 'expired', 'revoked'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition ${
              filter === status
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Invite Codes Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : inviteCodes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No invite codes found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inviteCodes.map((code) => (
                <tr key={code.invite_code_id} className="hover:bg-gray-50">
                  {/* Code */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {code.code}
                      </code>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(code.status)}
                      <span className="text-sm capitalize">{code.status}</span>
                    </div>
                  </td>

                  {/* Usage */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {code.current_uses} / {code.max_uses}
                    </span>
                  </td>

                  {/* Expires */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {code.expires_at
                        ? new Date(code.expires_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {code.description || '-'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {code.status === 'active' && (
                      <button
                        onClick={() => revokeCode(code.invite_code_id)}
                        className="text-red-600 hover:text-red-700"
                        title="Revoke code"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invite Code Modal */}
      {showCreateModal && (
        <CreateInviteCodeModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchInviteCodes}
        />
      )}
    </div>
  );
}
```

### Create Invite Code Modal

```jsx
// src/components/admin/CreateInviteCodeModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';
import apiClient from '../api/client';

export default function CreateInviteCodeModal({ onClose, onCreated }) {
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdCode, setCreatedCode] = useState(null);

  const handleCreate = async () => {
    setError('');
    setLoading(true);

    try {
      const payload = {
        max_uses: parseInt(maxUses),
        description: description || null,
      };

      if (expiresInDays) {
        payload.expires_in_days = parseInt(expiresInDays);
      }

      const response = await apiClient.post('/api/v1/admin/invite-codes', payload);
      setCreatedCode(response.data);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create invite code');
    } finally {
      setLoading(false);
    }
  };

  const copyAndClose = async () => {
    if (createdCode) {
      await navigator.clipboard.writeText(createdCode.code);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Generate Invite Code</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdCode ? (
          /* Success State */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">Invite code created successfully!</p>
              <div className="bg-white border border-green-300 rounded p-3">
                <code className="text-lg font-mono font-bold text-green-700">
                  {createdCode.code}
                </code>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> Copy this code now. You won't be able to see it again.
              </p>
            </div>

            <button
              onClick={copyAndClose}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Copy Code & Close
            </button>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4">
            {/* Max Uses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Uses
              </label>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
                max="100"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                How many times can this code be used? (1 = single-use)
              </p>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expires In (Days)
              </label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                min="1"
                max="365"
                placeholder="Leave empty for no expiration"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional. Leave empty if the code should never expire.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength="255"
                placeholder="e.g., For engineering team"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Generate Code'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Admin Route Protection

```jsx
// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/knowledge-base" replace />;
  }

  return children;
}

// Usage in App.jsx
<Routes>
  <Route path="/login" element={<Auth />} />

  <Route
    path="/knowledge-base"
    element={
      <ProtectedRoute>
        <KnowledgeBase />
      </ProtectedRoute>
    }
  />

  <Route
    path="/admin/invite-codes"
    element={
      <AdminRoute>
        <InviteCodes />
      </AdminRoute>
    }
  />
</Routes>
```

### Updated AuthContext with Role

```jsx
// src/contexts/AuthContext.jsx (updated register function)
const register = async (email, password, inviteCode) => {
  const response = await apiClient.post('/api/v1/auth/register', {
    email,
    password,
    invite_code: inviteCode,
  });

  // After successful registration, log in automatically
  const loginResponse = await apiClient.post('/api/v1/auth/login', {
    email,
    password,
  });

  const { access_token, refresh_token } = loginResponse.data;
  localStorage.setItem('access_token', access_token);
  localStorage.setItem('refresh_token', refresh_token);

  // Fetch user profile to get role
  const userResponse = await apiClient.get('/api/v1/users/me');
  setUser(userResponse.data);
  setIsAuthenticated(true);
};
```

### Navigation Update for Admin Access

```jsx
// src/components/Layout.jsx (add admin link if user is admin)
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

function Navigation() {
  const { user } = useAuth();

  return (
    <nav>
      {/* ... other nav items ... */}

      {user?.role === 'admin' && (
        <a
          href="/admin/invite-codes"
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <Shield className="w-5 h-5" />
          Admin: Invite Codes
        </a>
      )}
    </nav>
  );
}
```

---

## 11.5. Admin User & Document Management

### Admin Users Page

```jsx
// src/pages/admin/Users.jsx
import { useState, useEffect } from 'react';
import { Users as UsersIcon, Search, Trash2, Shield, User, ChevronDown } from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await apiClient.get('/api/v1/admin/users', { params });
      setUsers(response.data.users);
      setTotalUsers(response.data.total_users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to delete ${userEmail}? This will also delete all their documents.`)) {
      return;
    }

    const reason = prompt('Optional: Enter reason for deletion');

    try {
      await apiClient.delete(`/api/v1/admin/users/${userId}`, {
        data: {
          delete_documents: true,
          reason
        }
      });

      // Refresh list
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleToggleRole = async (userId, currentRole, userEmail) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'promote to admin' : 'demote to user';

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)}: ${userEmail}?`)) {
      return;
    }

    try {
      await apiClient.patch(`/api/v1/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update role');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <UsersIcon className="w-8 h-8" />
          User Management
        </h1>
        <p className="text-gray-600 mt-1">
          {totalUsers} total users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="user">Users Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Upload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    {/* User Email */}
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.email}</div>
                        <div className="text-xs text-gray-500">
                          ID: {user.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Documents */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {user.total_documents}
                      </span>
                    </td>

                    {/* Storage */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {formatBytes(user.total_storage_bytes)}
                      </span>
                    </td>

                    {/* Last Upload */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {user.last_upload_at
                          ? new Date(user.last_upload_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleRole(user.user_id, user.role, user.email)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm"
                          title={user.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.user_id, user.email)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, totalUsers)} of {totalUsers}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 50 >= totalUsers}
                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Admin Documents Browser

```jsx
// src/pages/admin/Documents.jsx
import { useState, useEffect } from 'react';
import { FileText, Search, Trash2, Download, Filter } from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchDocuments();
  }, [page, fileTypeFilter, searchTerm]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 50,
        ...(fileTypeFilter !== 'all' && { file_type: fileTypeFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await apiClient.get('/api/v1/admin/documents', { params });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (documentId, filename, ownerEmail) => {
    if (!confirm(`Delete "${filename}" owned by ${ownerEmail}?`)) {
      return;
    }

    const reason = prompt('Optional: Enter reason for deletion');

    try {
      await apiClient.delete(`/api/v1/admin/documents/${documentId}`, {
        params: { reason }
      });

      fetchDocuments();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete document');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-8 h-8" />
          All Documents
        </h1>
        <p className="text-gray-600 mt-1">
          Browse and manage documents across all users
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          {/* File Type Filter */}
          <div>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">All File Types</option>
              <option value="pdf">PDF</option>
              <option value="docx">DOCX</option>
              <option value="txt">TXT</option>
              <option value="md">Markdown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No documents found</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Chunks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Collection
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {documents.map((doc) => (
                  <tr key={doc.document_id} className="hover:bg-gray-50">
                    {/* Filename */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{doc.filename}</div>
                          <div className="text-xs text-gray-500 uppercase">{doc.file_type}</div>
                        </div>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{doc.user_email}</span>
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {formatBytes(doc.file_size_bytes)}
                      </span>
                    </td>

                    {/* Chunks */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{doc.chunk_count}</span>
                    </td>

                    {/* Collection */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {doc.collection_name || 'None'}
                      </span>
                    </td>

                    {/* Uploaded */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeleteDocument(doc.document_id, doc.filename, doc.user_email)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Page {page}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={documents.length < 50}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Admin Dashboard with Analytics

```jsx
// src/pages/admin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Users, FileText, Database, TrendingUp } from 'lucide-react';
import apiClient from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/analytics/system-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.new_users_last_30_days} in last 30 days
              </p>
            </div>
            <Users className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        {/* Total Documents */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_documents}</p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {stats.avg_documents_per_user.toFixed(1)}/user
              </p>
            </div>
            <FileText className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Total Storage */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(stats.total_storage_bytes)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {formatBytes(stats.avg_storage_per_user_bytes)}/user
              </p>
            </div>
            <Database className="w-12 h-12 text-purple-500" />
          </div>
        </div>

        {/* Vector Chunks */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vector Chunks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_vector_chunks.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                For RAG search
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Documents by Type */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Documents by Type</h2>
        <div className="space-y-3">
          {Object.entries(stats.documents_by_type).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700 uppercase">{type}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-64 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(count / stats.total_documents) * 100}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-16 text-right">
                  {count} ({((count / stats.total_documents) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Info */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Admins:</span>
              <span className="font-medium">{stats.total_admins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Invite Codes:</span>
              <span className="font-medium">{stats.active_invite_codes}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a
              href="/admin/users"
              className="block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              Manage Users
            </a>
            <a
              href="/admin/documents"
              className="block px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              Browse Documents
            </a>
            <a
              href="/admin/invite-codes"
              className="block px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
            >
              Manage Invite Codes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Updated Navigation with Admin Menu

```jsx
// src/components/Layout.jsx (updated navigation)
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, FileText, BarChart } from 'lucide-react';

function Navigation() {
  const { user } = useAuth();

  return (
    <nav>
      {/* ... other nav items ... */}

      {user?.role === 'admin' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">
            Admin
          </p>
          <a
            href="/admin/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <BarChart className="w-5 h-5" />
            Dashboard
          </a>
          <a
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Users className="w-5 h-5" />
            Users
          </a>
          <a
            href="/admin/documents"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <FileText className="w-5 h-5" />
            All Documents
          </a>
          <a
            href="/admin/invite-codes"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <Shield className="w-5 h-5" />
            Invite Codes
          </a>
        </div>
      )}
    </nav>
  );
}
```

---

## 12. Security Features

### Axios Interceptors with Automatic Token Refresh

```jsx
// src/api/client.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Add access token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token expiration and auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 403/401 and we haven't retried yet
    if (
      (error.response?.status === 403 || error.response?.status === 401) &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token - logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/api/v1/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` }
          }
        );

        const { access_token } = response.data;

        // Store new access token
        localStorage.setItem('access_token', access_token);

        // Update authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // Process queued requests with new token
        processQueue(null, access_token);

        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (err) {
        // Refresh failed - logout
        processQueue(err, null);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### Input Sanitization (XSS Prevention)

```jsx
import DOMPurify from 'dompurify';

// Sanitize user input before rendering
function SafeContent({ html }) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });

  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// Sanitize text input
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  // Strip all HTML tags
  const stripped = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  // Limit length
  return stripped.slice(0, 10000);
}

// Usage in forms
function QueryInput() {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sanitize before sending
    const sanitizedQuery = sanitizeInput(query);

    await apiClient.post('/api/v1/query', {
      query: sanitizedQuery
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={500}
        placeholder="Ask a question..."
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### File Upload Security

```jsx
// src/components/SecureFileUpload.jsx
import { useState } from 'react';
import apiClient from '../api/client';

const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function SecureFileUpload() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const validateFile = (file) => {
    // Check file extension
    const extension = `.${file.name.split('.').pop().toLowerCase()}`;
    const allowedExtensions = Object.values(ALLOWED_FILE_TYPES).flat();

    if (!allowedExtensions.includes(extension)) {
      return `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`;
    }

    // Check MIME type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return `Invalid file type: ${file.type}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 50MB`;
    }

    // Check filename length
    if (file.name.length > 255) {
      return 'Filename too long. Maximum 255 characters';
    }

    return null;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('Upload successful:', response.data);
      setFile(null);
    } catch (err) {
      if (err.response?.status === 413) {
        setError('File too large or storage quota exceeded');
      } else if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Invalid file');
      } else {
        setError('Upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf,.txt,.md,.docx"
        disabled={uploading}
      />

      {error && (
        <div className="text-red-600 text-sm mt-2">{error}</div>
      )}

      {file && (
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
}
```

### Rate Limit Display

```jsx
// src/components/RateLimitDisplay.jsx
import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function RateLimitDisplay() {
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    // Extract rate limit info from response headers
    const interceptor = apiClient.interceptors.response.use(
      (response) => {
        const limit = response.headers['x-ratelimit-limit'];
        const remaining = response.headers['x-ratelimit-remaining'];
        const reset = response.headers['x-ratelimit-reset'];

        if (limit && remaining) {
          setCredits({
            limit: parseInt(limit),
            remaining: parseInt(remaining),
            reset: reset ? new Date(parseInt(reset) * 1000) : null
          });
        }

        return response;
      },
      (error) => {
        // Check if rate limited
        if (error.response?.status === 429) {
          const detail = error.response.data?.detail;
          if (detail && typeof detail === 'object') {
            setCredits({
              limit: detail.required_credits || 0,
              remaining: detail.remaining_credits || 0,
              reset: null
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  if (!credits) return null;

  const percentage = (credits.remaining / credits.limit) * 100;

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">API Credits</span>
        <span className="text-sm text-gray-600">
          {credits.remaining} / {credits.limit}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage > 50
              ? 'bg-green-500'
              : percentage > 20
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {percentage < 10 && (
        <p className="text-xs text-red-600 mt-1">
          Low on credits! They regenerate over time.
        </p>
      )}
    </div>
  );
}
```

### Environment Variables (.env)

```bash
# frontend/.env
VITE_API_URL=http://localhost:8000
VITE_MAX_FILE_SIZE=52428800  # 50MB in bytes
VITE_ENVIRONMENT=development
```

### Security Best Practices Summary

**Authentication:**
- ✅ JWT with short-lived access tokens (1 hour)
- ✅ Long-lived refresh tokens (7 days)
- ✅ Automatic token refresh on expiration
- ✅ Request queuing during token refresh
- ✅ Token revocation on logout

**Input Security:**
- ✅ XSS prevention with DOMPurify
- ✅ Input length limits
- ✅ HTML tag stripping

**File Upload:**
- ✅ File type validation (extension + MIME type)
- ✅ File size limits (50MB)
- ✅ Client-side validation before upload
- ✅ Progress tracking
- ✅ Error handling for quota exceeded

**API Security:**
- ✅ Automatic Bearer token injection
- ✅ Token refresh retry logic
- ✅ Failed request queuing
- ✅ Timeout configuration (30s)
- ✅ HTTPS enforcement (production)

**Rate Limiting:**
- ✅ Visual credit display
- ✅ Rate limit header parsing
- ✅ Low credit warnings

**Storage Security:**
- ✅ Never store sensitive data in localStorage (only tokens)
- ✅ Clear tokens on logout
- ✅ Verify tokens on app mount

---

## Summary

The frontend knowledge base management with **React** provides:

✅ **Visual Document Library** - See all documents at a glance
✅ **Easy Upload** - Drag & drop with real-time progress tracking
✅ **Smart Organization** - Collections for categorization
✅ **Powerful Search** - Find documents and content quickly
✅ **Detailed Views** - Inspect document chunks and metadata
✅ **Bulk Operations** - Manage multiple documents efficiently
✅ **Integrated Chat** - Query your knowledge base seamlessly
✅ **Source Citations** - Always know where answers come from
✅ **Download Original Files** - Retrieve your uploaded documents from Backblaze B2
✅ **Secure Authentication** - JWT with refresh + access tokens, automatic token refresh
✅ **Input Sanitization** - XSS protection with DOMPurify
✅ **User Data Isolation** - Each user only sees their own documents and knowledge base
✅ **Error Handling** - Comprehensive error states and user feedback
✅ **Modern UI** - Professional, responsive design with React
✅ **Full Flexibility** - Customizable components and styling

This creates a **complete, secure knowledge management experience** where users can safely organize, search, download, and interact with their documents using a modern, professional React interface with robust security features!