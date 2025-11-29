"""
RAG Retriever Service using ChromaDB
"""
import os
from typing import List, Dict, Optional

# Required imports - will fail if not installed
import chromadb
from chromadb.config import Settings

# Optional imports with fallbacks
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    SentenceTransformer = None

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    RecursiveCharacterTextSplitter = None


class RAGRetriever:
    def __init__(self, db_path: str, embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2", top_k: int = 5):
        """
        Initialize RAG Retriever
        
        Args:
            db_path: Path to ChromaDB storage
            embedding_model: Model name for embeddings
            top_k: Number of top results to return
        """
        self.db_path = db_path
        self.top_k = top_k
        self.embedding_model_name = embedding_model
        
        # Initialize embedding model
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is required for RAG. Install with: pip install sentence-transformers"
            )
        self.embedder = SentenceTransformer(embedding_model)
        
        # Initialize ChromaDB
        os.makedirs(db_path, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=db_path,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="knowledge_base",
            metadata={"hnsw:space": "cosine"}
        )
        
        # Initialize text splitter
        if LANGCHAIN_AVAILABLE:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50
            )
        else:
            # Simple fallback splitter
            self.text_splitter = None
    
    def add_document(self, text: str, metadata: Dict[str, any], doc_id: Optional[str] = None) -> str:
        """
        Add a document to the knowledge base
        
        Args:
            text: Document text
            metadata: Document metadata (title, source, tags, etc.)
            doc_id: Optional document ID
            
        Returns:
            Document ID
        """
        # Split text into chunks
        if self.text_splitter:
            chunks = self.text_splitter.split_text(text)
        else:
            # Simple fallback: split by paragraphs
            chunks = [chunk.strip() for chunk in text.split('\n\n') if chunk.strip()]
            # Further split large chunks
            max_chunk_size = 500
            final_chunks = []
            for chunk in chunks:
                if len(chunk) <= max_chunk_size:
                    final_chunks.append(chunk)
                else:
                    # Split by sentences
                    sentences = chunk.split('. ')
                    current_chunk = ""
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) <= max_chunk_size:
                            current_chunk += sentence + ". "
                        else:
                            if current_chunk:
                                final_chunks.append(current_chunk.strip())
                            current_chunk = sentence + ". "
                    if current_chunk:
                        final_chunks.append(current_chunk.strip())
            chunks = final_chunks
        
        if not doc_id:
            doc_id = f"doc_{len(self.collection.get()['ids'])}"
        
        # Generate embeddings and add to collection
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []
        
        # Convert metadata to ChromaDB-compatible format (no lists)
        clean_metadata = {}
        for key, value in metadata.items():
            if isinstance(value, list):
                # Convert lists to comma-separated strings
                clean_metadata[key] = ",".join(str(v) for v in value) if value else ""
            elif value is None:
                # Convert None to empty string
                clean_metadata[key] = ""
            else:
                clean_metadata[key] = value
        
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk_{idx}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk)
            chunk_metadatas.append({
                **clean_metadata,
                "chunk_index": idx,
                "total_chunks": len(chunks)
            })
        
        # Generate embeddings
        embeddings = self.embedder.encode(chunk_texts).tolist()
        
        # Add to ChromaDB
        self.collection.add(
            ids=chunk_ids,
            documents=chunk_texts,
            metadatas=chunk_metadatas,
            embeddings=embeddings
        )
        
        return doc_id
    
    def delete_document(self, doc_id: str) -> bool:
        """
        Delete a document from the knowledge base
        
        Args:
            doc_id: Document ID to delete
            
        Returns:
            True if successful
        """
        try:
            # Get all chunks for this document
            results = self.collection.get(where={"doc_id": doc_id})
            if results["ids"]:
                self.collection.delete(ids=results["ids"])
            return True
        except Exception as e:
            print(f"Error deleting document: {e}")
            return False
    
    def search(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, any]]:
        """
        Search the knowledge base
        
        Args:
            query: Search query
            top_k: Number of results to return (defaults to self.top_k)
            
        Returns:
            List of relevant document chunks with metadata
        """
        if not query:
            return []
        
        top_k = top_k or self.top_k
        
        # Generate query embedding
        query_embedding = self.embedder.encode([query]).tolist()[0]
        
        # Search ChromaDB
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # Format results
        formatted_results = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for idx in range(len(results["ids"][0])):
                formatted_results.append({
                    "text": results["documents"][0][idx],
                    "metadata": results["metadatas"][0][idx],
                    "distance": results["distances"][0][idx] if "distances" in results else None,
                    "id": results["ids"][0][idx]
                })
        
        return formatted_results
    
    def list_documents(self) -> List[Dict[str, any]]:
        """
        List all documents in the knowledge base
        
        Returns:
            List of document metadata
        """
        try:
            all_data = self.collection.get()
            
            # Group by document ID
            documents = {}
            for idx, doc_id in enumerate(all_data["ids"]):
                base_id = doc_id.rsplit("_chunk_", 1)[0]
                if base_id not in documents:
                    # Convert metadata back to proper types (strings to lists where needed)
                    metadata = all_data["metadatas"][idx].copy()
                    # Convert tags string back to list if it exists
                    if "tags" in metadata and isinstance(metadata["tags"], str):
                        metadata["tags"] = [tag.strip() for tag in metadata["tags"].split(",") if tag.strip()]
                    
                    documents[base_id] = {
                        "id": base_id,
                        "metadata": metadata,
                        "chunk_count": 1
                    }
                else:
                    documents[base_id]["chunk_count"] += 1
            
            return list(documents.values())
        except Exception as e:
            print(f"Error listing documents: {e}")
            return []
    
    def get_document_text(self, doc_id: str) -> str:
        """
        Get full text of a document by concatenating all its chunks
        
        Args:
            doc_id: Document ID
            
        Returns:
            Full document text
        """
        try:
            # Get all chunks for this document
            all_data = self.collection.get()
            
            if not all_data["ids"]:
                return ""
            
            # Find all chunks that belong to this document
            chunks = []
            for idx, chunk_id in enumerate(all_data["ids"]):
                # Handle both formats: "doc_id_chunk_0" and just "doc_id"
                if "_chunk_" in chunk_id:
                    base_id = chunk_id.rsplit("_chunk_", 1)[0]
                else:
                    base_id = chunk_id
                
                if base_id == doc_id:
                    chunk_text = all_data["documents"][idx] if idx < len(all_data["documents"]) else ""
                    chunk_index = all_data["metadatas"][idx].get("chunk_index", 0) if idx < len(all_data["metadatas"]) else 0
                    chunks.append({
                        "text": chunk_text,
                        "chunk_index": chunk_index
                    })
            
            if not chunks:
                return ""
            
            # Sort by chunk index
            chunks.sort(key=lambda x: x["chunk_index"])
            
            # Concatenate text
            full_text = " ".join([chunk["text"] for chunk in chunks])
            
            return full_text
        except Exception as e:
            print(f"Error getting document text: {e}")
            return ""

