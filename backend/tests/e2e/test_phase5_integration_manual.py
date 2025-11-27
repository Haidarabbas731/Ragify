"""
Phase 5 Integration Test - Complete RAG Workflow

Tests the entire Phase 5 RAG functionality end-to-end:
1. Login
2. Create a collection
3. Upload a document to that collection
4. Wait for processing
5. Chat with collection filter
6. Chat without collection filter
7. List conversations
8. Verify responses and sources
"""

import asyncio
import time
from pathlib import Path

import httpx
import pytest

BASE_URL = "http://localhost:8000"
EMAIL = "phase5test@example.com"
PASSWORD = "Test123!@#"


@pytest.fixture
async def auth_token():
    """Create or login a test user, return auth token."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        # First, try to create an invite code (need admin user first)
        # Create a test user directly in the database
        import uuid

        from app.core.security import hash_password
        from app.db.database import async_session_maker
        from app.models.invite_code import InviteCode
        from app.models.user import User

        async with async_session_maker() as session:
            # Create invite code if not exists
            from sqlmodel import select
            result = await session.exec(select(InviteCode).where(InviteCode.code == "KB-FREE-TIER-2024"))
            invite = result.one_or_none()

            if not invite:
                invite = InviteCode(
                    invite_code_id=str(uuid.uuid4()),
                    code="KB-FREE-TIER-2024",
                    max_uses=1000,
                    current_uses=0,
                    status="active",
                    description="Test invite code",
                )
                session.add(invite)
                await session.commit()

            # Check if user exists
            result = await session.exec(select(User).where(User.email == EMAIL))
            user = result.one_or_none()

            if not user:
                # Create test user
                user = User(
                    user_id=str(uuid.uuid4()),
                    email=EMAIL,
                    password_hash=hash_password(PASSWORD),
                    role="user",
                    storage_used_bytes=0,
                    storage_limit_bytes=1073741824,
                    status="active",
                    is_active=True,
                    invited_by_code="KB-FREE-TIER-2024",
                )
                session.add(user)
                await session.commit()

        # Now login
        login_response = await client.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"email": EMAIL, "password": PASSWORD},
        )

        if login_response.status_code != 200:
            raise Exception(f"Login failed: {login_response.text}")

        login_data = login_response.json()
        return login_data["access_token"]


@pytest.mark.asyncio
@pytest.mark.e2e
async def test_phase5_complete_workflow(auth_token):
    """Test complete Phase 5 RAG workflow."""

    async with httpx.AsyncClient(timeout=120.0) as client:
        headers = {"Authorization": f"Bearer {auth_token}"}

        print("\n" + "="*60)
        print("PHASE 5 INTEGRATION TEST")
        print("="*60)

        # Step 1: Create a collection (with unique name to avoid conflicts)
        print("\n[1/8] Creating collection...")
        collection_name = f"Test HR Docs {int(time.time())}"
        collection_response = await client.post(
            f"{BASE_URL}/api/v1/collections",
            headers=headers,
            json={"name": collection_name, "description": "Testing RAG with HR documents"},
        )
        assert collection_response.status_code == 201, f"Create collection failed: {collection_response.text}"
        collection_data = collection_response.json()
        collection_id = collection_data["collection_id"]
        print(f"[OK] Created collection: {collection_data['name']} (ID: {collection_id})")

        # Step 2: Upload document to collection
        print("\n[2/8] Uploading document...")
        test_doc_path = Path("public/docs/Internal Employee Handbook (HR Policy).txt")
        assert test_doc_path.exists(), f"Test document not found: {test_doc_path}"

        with open(test_doc_path, "rb") as f:
            upload_response = await client.post(
                f"{BASE_URL}/api/v1/documents/upload",
                headers=headers,
                files={"file": (test_doc_path.name, f, "text/plain")},
                data={"collection_id": collection_id},
            )
        assert upload_response.status_code == 201, f"Upload failed: {upload_response.text}"
        upload_data = upload_response.json()
        document_id = upload_data["document_id"]
        print(f"[OK] Document uploaded: {upload_data['filename']}")
        print(f"  Document ID: {document_id}")
        print(f"  Status: {upload_data['status']}")

        # Step 3: Wait for processing
        print("\n[3/8] Waiting for document processing...")
        max_wait = 90
        start_time = time.time()

        while time.time() - start_time < max_wait:
            doc_response = await client.get(
                f"{BASE_URL}/api/v1/documents/{document_id}",
                headers=headers,
            )
            doc_data = doc_response.json()
            status = doc_data["status"]

            if status == "active":
                print("[OK] Document processed successfully!")
                print(f"  Chunks created: {doc_data.get('chunk_count', 'N/A')}")
                break
            elif status == "error":
                pytest.fail(f"Document processing failed: {doc_data.get('error_message')}")
            else:
                print(f"  Status: {status}, waiting...")
                await asyncio.sleep(3)
        else:
            pytest.fail(f"Document processing timed out after {max_wait}s")

        # Step 4: List collections
        print("\n[4/8] Listing collections...")
        collections_response = await client.get(
            f"{BASE_URL}/api/v1/collections",
            headers=headers,
        )
        assert collections_response.status_code == 200
        collections = collections_response.json()
        print(f"[OK] Found {len(collections)} collections")
        assert any(c["collection_id"] == collection_id for c in collections)

        # Step 5: Chat WITH collection filter
        print("\n[5/8] Testing chat WITH collection filter...")
        chat_query_1 = {
            "query": "What is the vacation policy?",
            "collection_id": collection_id,
            "top_k": 5,
        }
        chat_response_1 = await client.post(
            f"{BASE_URL}/api/v1/chat",
            headers=headers,
            json=chat_query_1,
        )
        assert chat_response_1.status_code == 200, f"Chat failed: {chat_response_1.text}"
        chat_data_1 = chat_response_1.json()

        print("[OK] Chat query processed")
        print(f"\n  Query: {chat_query_1['query']}")
        print(f"  Answer: {chat_data_1['answer'][:150]}...")
        print(f"  Sources: {len(chat_data_1.get('sources', []))} found")

        assert "answer" in chat_data_1
        assert "conversation_id" in chat_data_1
        assert "sources" in chat_data_1
        assert len(chat_data_1["sources"]) > 0, "No sources returned!"

        conversation_id = chat_data_1["conversation_id"]

        # Print sources
        for i, src in enumerate(chat_data_1["sources"][:3], 1):
            print(f"    {i}. {src['document_name']} (score: {src['score']:.3f})")

        # Step 6: Chat WITHOUT collection filter (same conversation)
        print("\n[6/8] Testing chat WITHOUT collection filter...")
        chat_query_2 = {
            "query": "How many vacation days do I get?",
            "conversation_id": conversation_id,  # Continue same conversation
            "top_k": 3,
        }
        chat_response_2 = await client.post(
            f"{BASE_URL}/api/v1/chat",
            headers=headers,
            json=chat_query_2,
        )
        assert chat_response_2.status_code == 200
        chat_data_2 = chat_response_2.json()

        print("[OK] Chat query processed")
        print(f"\n  Query: {chat_query_2['query']}")
        print(f"  Answer: {chat_data_2['answer'][:150]}...")
        print(f"  Same conversation: {chat_data_2['conversation_id'] == conversation_id}")

        # Step 7: List conversations
        print("\n[7/8] Listing conversations...")
        conversations_response = await client.get(
            f"{BASE_URL}/api/v1/conversations",
            headers=headers,
            params={"limit": 10},
        )
        assert conversations_response.status_code == 200
        conversations = conversations_response.json()

        print(f"[OK] Found {len(conversations)} conversations")
        assert any(c["conversation_id"] == conversation_id for c in conversations)

        # Step 8: Get full conversation
        print("\n[8/8] Getting full conversation...")
        conv_response = await client.get(
            f"{BASE_URL}/api/v1/conversations/{conversation_id}",
            headers=headers,
        )
        assert conv_response.status_code == 200
        conv_data = conv_response.json()

        print("[OK] Retrieved conversation")
        print(f"  Messages: {conv_data['message_count']}")
        print("  Expected: 4 messages (2 user + 2 assistant)")

        assert conv_data["message_count"] == 4
        assert len(conv_data["messages"]) == 4

        # Verify message structure
        assert conv_data["messages"][0]["role"] == "user"
        assert conv_data["messages"][1]["role"] == "assistant"
        assert "sources" in conv_data["messages"][1]

        # Success summary
        print("\n" + "="*60)
        print("[OK] ALL TESTS PASSED!")
        print("="*60)
        print(f"\n[OK] Collection created and working: {collection_id}")
        print(f"[OK] Document uploaded and processed: {document_id}")
        print("[OK] Chat with collection filter: Working")
        print("[OK] Chat without collection filter: Working")
        print("[OK] Conversation history: Working")
        print("[OK] Source citations: Working")
        print("[OK] Multi-turn conversation: Working")
        print("\n[SUCCESS] Phase 5 RAG functionality is fully operational!")
