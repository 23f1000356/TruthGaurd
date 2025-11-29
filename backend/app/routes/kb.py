"""
Knowledge Base Route
Handles PDF upload, document management, and KB operations
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.rag_retriever import RAGRetriever
from app.utils.parsers import extract_text_from_pdf, clean_text
from app.utils.logging import log_api_request, log_api_response, default_logger

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings

router = APIRouter(prefix="/kb", tags=["knowledge-base"])


class WebSourceRequest(BaseModel):
    url: str
    title: Optional[str] = None
    tags: Optional[List[str]] = None


class DocumentResponse(BaseModel):
    id: str
    title: str
    source: str
    tags: List[str]
    added_at: str
    chunk_count: int


# Initialize RAG retriever
rag_retriever = RAGRetriever(
    db_path=settings.CHROMA_DB_PATH,
    embedding_model=settings.EMBEDDING_MODEL,
    top_k=settings.RAG_TOP_K
)


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    title: Optional[str] = None,
    tags: Optional[str] = None
):
    """
    Upload PDF to knowledge base
    
    Args:
        file: PDF file
        title: Optional document title
        tags: Optional comma-separated tags
    """
    log_api_request(default_logger, "/kb/upload-pdf", "POST", filename=file.filename)
    
    # Validate file type (case-insensitive)
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400, 
            detail=f"Only PDF files are supported. Received: {file.filename}"
        )
    
    # Validate file size
    file_content = await file.read()
    file_size_mb = len(file_content) / (1024 * 1024)
    if file_size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds {settings.MAX_FILE_SIZE_MB}MB limit"
        )
    
    try:
        # Extract text from PDF
        try:
            text = extract_text_from_pdf(file_content)
            text = clean_text(text)
        except ImportError as e:
            raise HTTPException(
                status_code=500,
                detail=f"PDF processing libraries not available: {str(e)}"
            )
        except Exception as e:
            default_logger.error(f"PDF extraction error: {e}", exc_info=True)
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from PDF: {str(e)}"
            )
        
        if not text or len(text.strip()) < 50:
            raise HTTPException(
                status_code=400,
                detail=f"PDF contains insufficient text (extracted {len(text.strip())} characters, minimum 50 required). The PDF may be image-based or corrupted."
            )
        
        # Parse tags
        tag_list = []
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",")]
        
        # Add to knowledge base
        metadata = {
            "title": title or file.filename,
            "source": "upload",
            "filename": file.filename,
            "tags": tag_list,
            "added_at": datetime.now().isoformat(),
            "file_size_mb": round(file_size_mb, 2)
        }
        
        doc_id = rag_retriever.add_document(text, metadata)
        
        log_api_response(default_logger, "/kb/upload-pdf", 200, doc_id=doc_id)
        
        return {
            "success": True,
            "doc_id": doc_id,
            "title": metadata["title"],
            "text_length": len(text),
            "chunks": len(text) // 500  # Approximate chunk count
        }
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"PDF upload error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")


@router.post("/add-web-source")
async def add_web_source(request: WebSourceRequest):
    """
    Add web source to knowledge base
    
    Args:
        request: Web source request with URL
    """
    log_api_request(default_logger, "/kb/add-web-source", "POST", url=request.url)
    
    try:
        from app.services.search_engine import SearchEngine
        search_engine = SearchEngine()
        
        # Fetch content
        content = search_engine.fetch_page_content(request.url)
        
        if not content or len(content.strip()) < 50:
            raise HTTPException(status_code=400, detail="Failed to fetch or extract content from URL")
        
        # Add to knowledge base
        metadata = {
            "title": request.title or request.url,
            "source": "web",
            "url": request.url,
            "tags": request.tags or [],
            "added_at": datetime.now().isoformat()
        }
        
        doc_id = rag_retriever.add_document(content, metadata)
        
        log_api_response(default_logger, "/kb/add-web-source", 200, doc_id=doc_id)
        
        return {
            "success": True,
            "doc_id": doc_id,
            "title": metadata["title"],
            "url": request.url,
            "text_length": len(content)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Web source addition error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add web source: {str(e)}")


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents():
    """List all documents in knowledge base"""
    log_api_request(default_logger, "/kb/documents", "GET")
    
    try:
        documents = rag_retriever.list_documents()
        
        formatted_docs = []
        for doc in documents:
            formatted_docs.append(DocumentResponse(
                id=doc["id"],
                title=doc["metadata"].get("title", "Untitled"),
                source=doc["metadata"].get("source", "unknown"),
                tags=doc["metadata"].get("tags", []),
                added_at=doc["metadata"].get("added_at", ""),
                chunk_count=doc.get("chunk_count", 0)
            ))
        
        log_api_response(default_logger, "/kb/documents", 200, count=len(formatted_docs))
        
        return formatted_docs
    
    except Exception as e:
        default_logger.error(f"List documents error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list documents: {str(e)}")


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from knowledge base"""
    log_api_request(default_logger, f"/kb/documents/{doc_id}", "DELETE")
    
    try:
        success = rag_retriever.delete_document(doc_id)
        
        if success:
            log_api_response(default_logger, f"/kb/documents/{doc_id}", 200)
            return {"success": True, "doc_id": doc_id}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Delete document error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")


@router.get("/search")
async def search_kb(query: str, top_k: int = 5):
    """Search knowledge base"""
    log_api_request(default_logger, "/kb/search", "GET", query=query)
    
    try:
        results = rag_retriever.search(query, top_k=top_k)
        
        log_api_response(default_logger, "/kb/search", 200, results_count=len(results))
        
        return {
            "query": query,
            "results": results
        }
    
    except Exception as e:
        default_logger.error(f"KB search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/documents/{doc_id}/analyze")
async def analyze_document(doc_id: str):
    """
    Analyze a document to determine true/false content breakdown
    Returns statistics on claim verification results
    """
    log_api_request(default_logger, f"/kb/documents/{doc_id}/analyze", "GET")
    
    try:
        # Get document text from ChromaDB
        document_text = rag_retriever.get_document_text(doc_id)
        
        if not document_text:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Import verification services
        from app.services.claim_extractor import ClaimExtractor
        from app.services.search_engine import SearchEngine
        from app.services.llm import LLMService
        from app.services.credibility_analyzer import CredibilityAnalyzer
        from app.utils.scoring import aggregate_verdicts, calculate_source_credibility_score
        
        # Initialize services
        llm_service = LLMService()
        search_engine = SearchEngine(top_k=settings.SEARCH_TOP_K, region=settings.SEARCH_REGION)
        credibility_analyzer = CredibilityAnalyzer()
        
        claim_extractor = ClaimExtractor(
            use_llm=True,
            llm_service=llm_service,
            rag_retriever=rag_retriever
        )
        
        # Extract claims
        extracted_claims = claim_extractor.extract(document_text)
        
        if not extracted_claims:
            return {
                "doc_id": doc_id,
                "total_claims": 0,
                "statistics": {
                    "true": 0,
                    "false": 0,
                    "misleading": 0,
                    "unverified": 0
                },
                "percentages": {
                    "true": 0.0,
                    "false": 0.0,
                    "misleading": 0.0,
                    "unverified": 100.0
                },
                "claims": []
            }
        
        # Verify each claim
        verified_claims = []
        for claim in extracted_claims:
            claim_text = claim.get("claim", "")
            
            # Search for evidence
            web_results = search_engine.search(claim_text)
            kb_results = rag_retriever.search(claim_text, top_k=settings.RAG_TOP_K)
            
            # Combine evidence
            all_evidence = []
            for result in web_results:
                all_evidence.append({
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "snippet": result.get("snippet", ""),
                    "source": result.get("source", ""),
                    "type": "web"
                })
            
            for result in kb_results:
                all_evidence.append({
                    "title": result.get("metadata", {}).get("title", ""),
                    "text": result.get("text", ""),
                    "source": "knowledge_base",
                    "type": "kb"
                })
            
            # Analyze source credibility
            source_scores = []
            for evidence in all_evidence:
                if evidence.get("url"):
                    credibility = credibility_analyzer.analyze_source(evidence["url"])
                    source_scores.append(credibility.get("trust_score", 0.5))
            
            avg_credibility = sum(source_scores) / len(source_scores) if source_scores else 0.5
            
            # Verify with LLM
            try:
                verification_result = llm_service.verify_claim(claim_text, all_evidence)
                verdict = verification_result.get("verdict", "unverified")
                confidence = verification_result.get("confidence", 0.5)
                explanation = verification_result.get("explanation", "")
            except Exception as e:
                default_logger.warning(f"LLM verification failed for claim: {e}")
                verdict = "unverified"
                confidence = 0.0
                explanation = "Could not verify claim due to LLM error"
            
            verified_claims.append({
                "id": claim.get("id", 0),
                "text": claim_text,
                "verdict": verdict,
                "confidence": confidence,
                "explanation": explanation,
                "evidence_count": len(all_evidence),
                "source_credibility": avg_credibility
            })
        
        # Calculate statistics
        verdict_counts = {
            "true": 0,
            "false": 0,
            "misleading": 0,
            "unverified": 0
        }
        
        for claim in verified_claims:
            verdict = claim.get("verdict", "unverified")
            if verdict in verdict_counts:
                verdict_counts[verdict] += 1
        
        total_claims = len(verified_claims)
        percentages = {
            "true": (verdict_counts["true"] / total_claims * 100) if total_claims > 0 else 0.0,
            "false": (verdict_counts["false"] / total_claims * 100) if total_claims > 0 else 0.0,
            "misleading": (verdict_counts["misleading"] / total_claims * 100) if total_claims > 0 else 0.0,
            "unverified": (verdict_counts["unverified"] / total_claims * 100) if total_claims > 0 else 0.0
        }
        
        # Generate document summary
        summary = ""
        overall_accuracy = "unknown"
        try:
            # Truncate document text if too long (to avoid token limits)
            doc_preview = document_text[:1500] if len(document_text) > 1500 else document_text
            if len(document_text) > 1500:
                doc_preview += "..."
            
            # Create summary prompt
            summary_prompt = f"""Provide a brief summary (2-3 sentences) of the following document content:

{doc_preview}

Summary:"""
            
            summary_response = llm_service.generate(
                prompt=summary_prompt,
                temperature=0.5,
                max_tokens=150,
                strict_json=False
            )
            summary = summary_response.strip() if summary_response else ""
            
            # Clean up summary (remove any prompt artifacts)
            if summary:
                # Remove common prefixes
                for prefix in ["Summary:", "The document", "This document"]:
                    if summary.startswith(prefix):
                        summary = summary[len(prefix):].strip()
                        if summary.startswith(":"):
                            summary = summary[1:].strip()
        except Exception as e:
            default_logger.warning(f"Summary generation failed: {e}")
            # Fallback summary based on claims
            if total_claims > 0:
                true_count = verdict_counts["true"]
                false_count = verdict_counts["false"]
                if true_count > false_count:
                    summary = f"This document contains {total_claims} claims, with {true_count} verified as true and {false_count} as false. The content appears to be mostly accurate."
                elif false_count > true_count:
                    summary = f"This document contains {total_claims} claims, with {false_count} verified as false and {true_count} as true. The content contains significant false information."
                else:
                    summary = f"This document contains {total_claims} factual claims with mixed accuracy."
            else:
                summary = f"This document contains {total_claims} factual claims covering various topics."
        
        # Determine overall accuracy assessment
        true_percentage = percentages["true"]
        false_percentage = percentages["false"]
        misleading_percentage = percentages["misleading"]
        
        if total_claims == 0:
            overall_accuracy = "unknown"
            accuracy_assessment = "No claims found in document"
        elif true_percentage >= 70:
            overall_accuracy = "mostly_accurate"
            accuracy_assessment = f"Document is mostly accurate ({true_percentage:.1f}% true content)"
        elif false_percentage >= 50:
            overall_accuracy = "mostly_false"
            accuracy_assessment = f"Document contains significant false information ({false_percentage:.1f}% false content)"
        elif misleading_percentage >= 40:
            overall_accuracy = "misleading"
            accuracy_assessment = f"Document contains misleading information ({misleading_percentage:.1f}% misleading content)"
        elif true_percentage >= 50:
            overall_accuracy = "mixed"
            accuracy_assessment = f"Document has mixed accuracy ({true_percentage:.1f}% true, {false_percentage:.1f}% false)"
        else:
            overall_accuracy = "unverified"
            accuracy_assessment = f"Document content could not be fully verified ({percentages['unverified']:.1f}% unverified)"
        
        log_api_response(default_logger, f"/kb/documents/{doc_id}/analyze", 200, 
                        total_claims=total_claims, statistics=verdict_counts)
        
        return {
            "doc_id": doc_id,
            "total_claims": total_claims,
            "statistics": verdict_counts,
            "percentages": percentages,
            "claims": verified_claims,
            "summary": summary,
            "overall_accuracy": overall_accuracy,
            "accuracy_assessment": accuracy_assessment
        }
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Document analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze document: {str(e)}")

