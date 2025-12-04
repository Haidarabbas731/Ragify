"""
RAG Chat Prompt Templates.

This module contains prompt templates for the RAG (Retrieval-Augmented Generation) chat system.
"""

SYSTEM_PROMPT = """You are a helpful AI assistant for Ragify, an AI-powered knowledge base system. You help users find information in their uploaded documents using advanced RAG (Retrieval-Augmented Generation) technology.

IMPORTANT RULES:

1. **For greetings and general conversation** (hello, hi, how are you, thank you, etc.):
   - Respond naturally and warmly
   - Briefly introduce yourself as Ragify's AI assistant
   - Mention that you're here to help them search through their documents
   - Don't mention the provided context

2. **For questions about the system itself** (what can you do, how do you work, etc.):
   - Explain that you're Ragify's AI assistant powered by RAG technology
   - Mention you can search through their uploaded documents and answer questions
   - Highlight that you provide accurate answers with source citations
   - Don't reference the provided context

3. **For document-specific questions** (questions about topics, facts, data):
   - Answer using ONLY the provided context from their documents
   - Cite source document names when providing information
   - If the answer is not in the context, say: "I don't have enough information in your documents to answer that question. You may need to upload relevant documents to Ragify first."
   - Be concise and factual - don't elaborate beyond what's in the context
   - If multiple sources support your answer, mention all relevant sources

4. **Never make up information** - if you don't have the answer in the provided context and it's not a general greeting/conversation, say so clearly.

Your tone should be helpful, professional, and friendly. You represent the Ragify brand."""


def format_user_prompt(
    context: str, query: str, conversation_history: list[dict] | None = None
) -> str:
    """
    Format the user prompt with context, query, and optional conversation history.

    Args:
        context: Formatted context from search results
        query: User's question
        conversation_history: Optional list of previous messages (last 5)

    Returns:
        str: Formatted prompt combining conversation history, context, and query
    """
    # Build conversation history section if provided
    history_section = ""
    if conversation_history and len(conversation_history) > 0:
        history_lines = []
        for msg in conversation_history:
            role = msg.get("role", "").capitalize()
            content = msg.get("content", "")
            history_lines.append(f"{role}: {content}")

        history_section = f"""Previous conversation:
{chr(10).join(history_lines)}

---

"""

    return f"""{history_section}Context from user's documents:

{context}

---

User Question: {query}

Instructions:
- If this is a greeting or general conversation, respond naturally and warmly
- If this is a question about the system, explain your capabilities
- If this is a document-specific question, answer using ONLY the context above
- If this is a follow-up question, use the conversation history for context
- Always be helpful and professional"""


def format_context(chunks: list[dict]) -> str:
    """
    Format search result chunks into context string.

    Args:
        chunks: List of chunk dictionaries with document_id, chunk_text, score, etc.

    Returns:
        str: Formatted context string with document sources

    Note:
        Only uses top 5 chunks to stay within token limits
    """
    if not chunks:
        return "No relevant context found in your documents."

    formatted = []

    # Use only top 5 chunks to stay within context window
    for i, chunk in enumerate(chunks[:5], 1):
        document_name = chunk.get("document_name", "Unknown Document")
        chunk_text = chunk.get("chunk_text", "")
        score = chunk.get("score", 0.0)

        formatted.append(
            f"[Source {i}: {document_name}] (Relevance: {score:.2f})\n" f"{chunk_text}\n" f"---"
        )

    return "\n\n".join(formatted)


def format_context_with_metadata(chunks: list[dict]) -> tuple[str, list[dict]]:
    """
    Format context and extract source citations.

    Args:
        chunks: List of chunk dictionaries with full metadata

    Returns:
        tuple: (formatted_context, source_citations)
            - formatted_context: Text for LLM prompt
            - source_citations: List of source metadata for response
    """
    formatted_context = format_context(chunks)

    # Extract unique sources for citations
    sources = []
    seen_docs = set()

    for chunk in chunks[:5]:
        document_id = chunk.get("document_id")
        document_name = chunk.get("document_name", "Unknown Document")
        filename = chunk.get("filename", document_name)  # Fallback to document_name
        chunk_index = chunk.get("chunk_index", 0)

        if document_id and document_id not in seen_docs:
            sources.append(
                {
                    "document_id": document_id,
                    "document_name": document_name,
                    "filename": filename,
                    "chunk_index": chunk_index,
                    "chunk_text": chunk.get("chunk_text", "")[:200],  # First 200 chars
                    "relevance_score": chunk.get("score", 0.0),
                }
            )
            seen_docs.add(document_id)

    return formatted_context, sources
