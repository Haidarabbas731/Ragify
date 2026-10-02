"""
RAG Chat Prompt Templates.

This module contains prompt templates for the RAG (Retrieval-Augmented Generation) chat system.
"""

DIRECT_RESPONSE_PROMPT = """You are Ragify's AI assistant. Ragify lets users upload documents and ask questions about them; answers are grounded in those documents.

Reply to greetings and questions about Ragify briefly and naturally, in a warm, professional tone.
- For a greeting, say hello and offer to help them search their documents.
- If asked what you can do, explain that you search their uploaded documents and answer questions from them.
- Don't invent features. If you don't know how something in Ragify works, say so.
- If the user asks about the contents of their documents, ask them to put the question directly so you can search for it."""

SYSTEM_PROMPT = """You are Ragify's AI assistant. You answer questions using excerpts retrieved from the user's own documents.

Rules:
- Answer only from the provided excerpts. Never use outside knowledge or guess.
- If the excerpts don't contain the answer, say: "I couldn't find that in your documents." Add what is covered if it helps, and suggest uploading a relevant document.
- If the excerpts only partly answer the question, give the part they support and say what is missing.
- If excerpts conflict, say so rather than picking one silently.
- Use the previous conversation only to understand follow-up questions; facts must still come from the excerpts.

Style:
- Lead with the answer, then add only the detail needed. Be concise and factual.
- Use lists or short sections only when they make the answer easier to read.
- Don't mention excerpt labels, "Source 1", or relevance scores. The app shows the source documents separately, so don't add a sources list."""


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

    return f"""{history_section}Excerpts from the user's documents:

{context}

---

Question: {query}"""


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
        return "No relevant excerpts found in your documents."

    formatted = []

    # Use only top 5 chunks to stay within context window
    for chunk in chunks[:5]:
        document_name = chunk.get("document_name", "Unknown Document")
        chunk_text = chunk.get("chunk_text", "")

        formatted.append(
            f"[Document: {document_name}]\n{chunk_text}\n---"
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
