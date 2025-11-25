"""
RAG Chat Prompt Templates.

This module contains prompt templates for the RAG (Retrieval-Augmented Generation) chat system.
"""

SYSTEM_PROMPT = """You are a helpful AI assistant that answers questions based ONLY on the provided context from the user's document library.

IMPORTANT RULES:
1. Answer questions using ONLY information from the provided context below
2. If the answer is not in the context, say "I don't have enough information in your documents to answer that question."
3. Be concise and factual - don't elaborate beyond what's in the context
4. Cite the source document name when providing information
5. If multiple sources support your answer, mention all relevant sources
6. Do not make up information or use external knowledge

Your responses should be helpful, accurate, and directly based on the user's uploaded documents."""


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

    return f"""{history_section}Context from your documents:

{context}

---

Current Question: {query}

Answer the question based on the context above. If this is a follow-up question, use the conversation history to understand the context, but still answer ONLY using information from the documents."""


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

        if document_id and document_id not in seen_docs:
            sources.append(
                {
                    "document_id": document_id,
                    "document_name": document_name,
                    "chunk_text": chunk.get("chunk_text", "")[:200],  # First 200 chars
                    "score": chunk.get("score", 0.0),
                }
            )
            seen_docs.add(document_id)

    return formatted_context, sources
