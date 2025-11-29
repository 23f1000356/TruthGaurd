"""
Test script for RAG Retriever
Tests document storage, retrieval, and search functionality
"""
import os
import sys
import tempfile
import shutil

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(__file__))

try:
    from app.services.rag_retriever import RAGRetriever
    from config import settings
except ImportError as e:
    print(f"[FAIL] Import error: {e}")
    print("Make sure you're running from the backend directory and dependencies are installed")
    sys.exit(1)


def test_rag_initialization():
    """Test RAG Retriever initialization"""
    print("=" * 60)
    print("Test 1: RAG Retriever Initialization")
    print("=" * 60)
    
    try:
        # Use temporary directory for testing
        test_db_path = os.path.join(tempfile.gettempdir(), "test_chroma_rag")
        
        # Clean up if exists
        if os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
        
        rag = RAGRetriever(
            db_path=test_db_path,
            embedding_model=settings.EMBEDDING_MODEL,
            top_k=5
        )
        
        print("[OK] RAG Retriever initialized successfully")
        print(f"    DB Path: {test_db_path}")
        print(f"    Embedding Model: {settings.EMBEDDING_MODEL}")
        print(f"    Top K: 5")
        
        # Cleanup
        if os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
        
        return rag, test_db_path
    except ImportError as e:
        print(f"[FAIL] Missing dependency: {e}")
        print("    Install with: pip install sentence-transformers chromadb")
        return None, None
    except Exception as e:
        print(f"[FAIL] Initialization error: {e}")
        return None, None


def test_document_storage(rag, test_db_path):
    """Test adding documents to RAG"""
    print("\n" + "=" * 60)
    print("Test 2: Document Storage")
    print("=" * 60)
    
    if not rag:
        print("[SKIP] Skipping test (initialization failed)")
        return False
    
    try:
        # Test document
        test_text = """
        Climate change is a long-term change in the average weather patterns that have come to define Earth's local, regional and global climates.
        These changes have a broad range of observed effects that are synonymous with the term.
        Climate change is primarily driven by human activities, particularly the emission of greenhouse gases.
        The main greenhouse gases include carbon dioxide, methane, and nitrous oxide.
        These gases trap heat in the Earth's atmosphere, leading to global warming.
        """
        
        metadata = {
            "title": "Climate Change Overview",
            "source": "test_document.pdf",
            "tags": ["climate", "environment", "science"],
            "added_at": "2025-01-01T00:00:00Z"
        }
        
        doc_id = rag.add_document(test_text, metadata)
        
        print(f"[OK] Document added successfully")
        print(f"    Document ID: {doc_id}")
        print(f"    Text length: {len(test_text)} characters")
        print(f"    Metadata: {metadata['title']}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Document storage error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_document_search(rag):
    """Test searching documents"""
    print("\n" + "=" * 60)
    print("Test 3: Document Search")
    print("=" * 60)
    
    if not rag:
        print("[SKIP] Skipping test (initialization failed)")
        return False
    
    try:
        # Test queries
        test_queries = [
            "climate change",
            "greenhouse gases",
            "global warming"
        ]
        
        for query in test_queries:
            results = rag.search(query, top_k=3)
            
            if results:
                print(f"[OK] Query: '{query}'")
                print(f"    Found {len(results)} results")
                for idx, result in enumerate(results[:2], 1):
                    snippet = result["text"][:100] + "..." if len(result["text"]) > 100 else result["text"]
                    distance = result.get("distance", "N/A")
                    print(f"    Result {idx}: {snippet}")
                    print(f"      Distance: {distance}")
                    print(f"      Title: {result['metadata'].get('title', 'N/A')}")
            else:
                print(f"[WARN] Query: '{query}' - No results found")
        
        return True
    except Exception as e:
        print(f"[FAIL] Search error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_document_listing(rag):
    """Test listing documents"""
    print("\n" + "=" * 60)
    print("Test 4: Document Listing")
    print("=" * 60)
    
    if not rag:
        print("[SKIP] Skipping test (initialization failed)")
        return False
    
    try:
        documents = rag.list_documents()
        
        print(f"[OK] Found {len(documents)} document(s)")
        for doc in documents:
            print(f"    ID: {doc['id']}")
            print(f"    Title: {doc['metadata'].get('title', 'N/A')}")
            print(f"    Chunks: {doc.get('chunk_count', 0)}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Listing error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_chunking():
    """Test text chunking functionality"""
    print("\n" + "=" * 60)
    print("Test 5: Text Chunking")
    print("=" * 60)
    
    try:
        test_db_path = os.path.join(tempfile.gettempdir(), "test_chroma_chunking")
        if os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
        
        rag = RAGRetriever(
            db_path=test_db_path,
            embedding_model=settings.EMBEDDING_MODEL,
            top_k=5
        )
        
        # Long text to test chunking
        long_text = " ".join([f"Sentence {i} about climate change and global warming." for i in range(50)])
        
        metadata = {"title": "Long Document Test", "source": "test.pdf"}
        doc_id = rag.add_document(long_text, metadata)
        
        # Check if chunks were created
        documents = rag.list_documents()
        if documents:
            chunk_count = documents[0].get('chunk_count', 0)
            print(f"[OK] Document chunked into {chunk_count} pieces")
            print(f"    Original text: {len(long_text)} characters")
            print(f"    Expected chunks: ~{len(long_text) // 500}")
        else:
            print("[WARN] Could not verify chunking")
        
        # Cleanup
        if os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
        
        return True
    except Exception as e:
        print(f"[FAIL] Chunking test error: {e}")
        return False


def test_integration_with_verify():
    """Test RAG integration with verification"""
    print("\n" + "=" * 60)
    print("Test 6: Integration with Verification")
    print("=" * 60)
    
    try:
        # Use actual database path
        rag = RAGRetriever(
            db_path=settings.CHROMA_DB_PATH,
            embedding_model=settings.EMBEDDING_MODEL,
            top_k=settings.RAG_TOP_K
        )
        
        # Test search (as used in verify.py)
        test_claim = "Climate change is real"
        results = rag.search(test_claim)
        
        print(f"[OK] RAG search works with verification pipeline")
        print(f"    Query: '{test_claim}'")
        print(f"    Results: {len(results)}")
        
        if results:
            print(f"    Sample result: {results[0]['text'][:100]}...")
        
        return True
    except Exception as e:
        print(f"[FAIL] Integration test error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("RAG Retriever Test Suite")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  DB Path: {settings.CHROMA_DB_PATH}")
    print(f"  Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"  Top K: {settings.RAG_TOP_K}")
    
    results = []
    test_db_path = None
    
    # Test 1: Initialization
    rag, test_db_path = test_rag_initialization()
    results.append(("Initialization", rag is not None))
    
    if rag:
        # Reinitialize for actual tests
        if test_db_path and os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
        
        rag = RAGRetriever(
            db_path=test_db_path,
            embedding_model=settings.EMBEDDING_MODEL,
            top_k=5
        )
        
        # Test 2: Storage
        results.append(("Document Storage", test_document_storage(rag, test_db_path)))
        
        # Test 3: Search
        results.append(("Document Search", test_document_search(rag)))
        
        # Test 4: Listing
        results.append(("Document Listing", test_document_listing(rag)))
        
        # Test 5: Chunking
        results.append(("Text Chunking", test_chunking()))
        
        # Cleanup test DB
        if test_db_path and os.path.exists(test_db_path):
            shutil.rmtree(test_db_path)
    
    # Test 6: Integration (uses actual DB)
    results.append(("Integration", test_integration_with_verify()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All RAG Retriever tests passed!")
        return 0
    else:
        print("\n[WARN] Some tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

