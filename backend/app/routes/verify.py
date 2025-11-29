"""
Verification Route
Main endpoint for claim verification
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.claim_extractor import ClaimExtractor
from app.services.search_engine import SearchEngine
from app.services.rag_retriever import RAGRetriever
from app.services.llm import LLMService
from app.services.autogen_service import AutoGenService
from app.services.credibility_analyzer import CredibilityAnalyzer
from app.services.category_detector import detect_category
from app.utils.scoring import aggregate_verdicts, calculate_source_credibility_score
from app.utils.logging import log_api_request, log_api_response, default_logger

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings

router = APIRouter(prefix="/verify", tags=["verification"])


class VerifyRequest(BaseModel):
    text: str
    mode: str = "single"  # "single" or "debate"
    top_k_search: int = 5
    use_llm_extraction: bool = False


class VerifyResponse(BaseModel):
    claims: List[Dict[str, Any]]
    processing_time: float
    llm_results: Optional[List[Dict[str, Any]]] = None
    ddg_results: Optional[List[Dict[str, Any]]] = None


# Initialize services
# Claim extractor uses spaCy method first for accurate results
# RAG can be enabled for enhanced LLM extraction
llm_service = LLMService()
rag_retriever = RAGRetriever(
    db_path=settings.CHROMA_DB_PATH,
    embedding_model=settings.EMBEDDING_MODEL,
    top_k=settings.RAG_TOP_K
)
search_engine = SearchEngine(top_k=settings.SEARCH_TOP_K, region=settings.SEARCH_REGION)

# Use spaCy by default, LLM enabled for enhanced extraction
claim_extractor = ClaimExtractor(
    use_llm=True,  # ✅ LLM extraction enabled
    llm_service=llm_service,
    rag_retriever=rag_retriever  # RAG context for LLM extraction
)
autogen_service = AutoGenService() if settings.AUTOGEN_ENABLED else None
credibility_analyzer = CredibilityAnalyzer()


@router.post("/", response_model=VerifyResponse)
async def verify_claims(request: VerifyRequest):
    """
    Main verification endpoint
    
    Pipeline:
    1. Claim extraction
    2. Web search for each claim
    3. RAG retrieval from KB
    4. LLM evaluation
    5. Return verdicts
    """
    import time
    start_time = time.time()
    
    log_api_request(default_logger, "/verify", "POST", text_length=len(request.text), mode=request.mode)
    
    try:
        # Step 1: Extract claims using ALL three methods (spaCy, LLM, fallback)
        # The extractor automatically combines results from all available methods
        if request.use_llm_extraction:
            claim_extractor.use_llm = True
            claim_extractor.llm_service = llm_service
        else:
            # Even if use_llm_extraction is False, we still try LLM if available
            # but it will gracefully fall back if LLM is unavailable
            claim_extractor.use_llm = True
            claim_extractor.llm_service = llm_service
        
        extracted_claims = claim_extractor.extract(request.text)
        
        if not extracted_claims:
            return VerifyResponse(
                claims=[],
                processing_time=time.time() - start_time
            )
        
        # Step 2-4: Verify each claim
        verified_claims = []
        llm_results_list = []
        ddg_results_list = []
        
        for claim_data in extracted_claims:
            claim_text = claim_data["claim"]
            
            # Search web using DuckDuckGo
            search_results = search_engine.search(claim_text, max_results=request.top_k_search)
            
            # Retrieve from KB
            kb_results = rag_retriever.search(claim_text)
            
            # Prepare DDG-only results (separate from LLM)
            ddg_evidence = []
            for result in search_results:
                ddg_evidence.append({
                    "title": result["title"],
                    "url": result["url"],
                    "snippet": result["snippet"],
                    "source": result["source"],
                    "type": "web"
                })
            
            # DDG Results (search-based verification)
            ddg_result = {
                "id": claim_data["id"],
                "text": claim_text,
                "verdict": "unverified",  # DDG doesn't verify, just provides sources
                "confidence": 0.5,
                "explanation": f"Found {len(ddg_evidence)} web search results from DuckDuckGo. Review the sources below to verify the claim.",
                "citations": [e.get("url") for e in ddg_evidence if e.get("url")],
                "evidence_count": len(ddg_evidence),
                "source_credibility": 0.5,
                "evidence": ddg_evidence,
                "method": "ddg_search"
            }
            ddg_results_list.append(ddg_result)
            
            # Combine evidence for LLM (includes both web and KB)
            evidence = []
            for result in search_results:
                evidence.append({
                    "title": result["title"],
                    "url": result["url"],
                    "snippet": result["snippet"],
                    "source": result["source"],
                    "type": "web"
                })
            
            for result in kb_results:
                evidence.append({
                    "title": result["metadata"].get("title", "KB Document"),
                    "text": result["text"],
                    "source": result["metadata"].get("source", "Knowledge Base"),
                    "type": "kb"
                })
            
            # Analyze source credibility
            urls = [e.get("url") for e in evidence if e.get("url")]
            if urls:
                credibility = credibility_analyzer.analyze_multiple_sources(urls)
                source_credibility = credibility.get("average_trust_score", 0.5)
            else:
                source_credibility = 0.5
            
            # Step 4: LLM verification
            if request.mode == "debate" and autogen_service:
                verification_result = autogen_service.debate_claim(claim_text, evidence)
            else:
                verification_result = llm_service.verify_claim(claim_text, evidence)
            
            # LLM Results
            llm_result = {
                "id": claim_data["id"],
                "text": claim_text,
                "verdict": verification_result["verdict"],
                "confidence": verification_result["confidence"],
                "explanation": verification_result["explanation"],
                "citations": verification_result.get("citations", []),
                "evidence_count": len(evidence),
                "source_credibility": source_credibility,
                "evidence": evidence[:3],  # Include top 3 evidence
                "method": "llm_verification"
            }
            llm_results_list.append(llm_result)
            
            # Combined results (for backward compatibility)
            verified_claims.append({
                "id": claim_data["id"],
                "text": claim_text,
                "verdict": verification_result["verdict"],
                "confidence": verification_result["confidence"],
                "explanation": verification_result["explanation"],
                "citations": verification_result.get("citations", []),
                "evidence_count": len(evidence),
                "source_credibility": source_credibility,
                "evidence": evidence[:3]  # Include top 3 evidence
            })
        
        processing_time = time.time() - start_time
        
        # Auto-create/find project by category and add claims
        if verified_claims:
            try:
                from app.routes.projects import load_projects, save_projects
                from datetime import datetime
                
                # Detect category from first claim (or use text if available)
                category = detect_category(request.text or verified_claims[0].get("text", ""))
                
                # Find or create project with category name
                projects = load_projects()
                project_id = None
                
                # Search for existing project with this category name
                for pid, proj in projects.items():
                    if proj.get("name", "").lower() == category.lower():
                        project_id = pid
                        break
                
                # Create new project if not found
                if not project_id:
                    project_id = f"proj_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    projects[project_id] = {
                        "id": project_id,
                        "name": category.capitalize(),
                        "description": f"Auto-created project for {category} category",
                        "created_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                        "claims": [],
                        "status": "active"
                    }
                
                # Add claims to project with review status
                project = projects[project_id]
                for claim in verified_claims:
                    claim_with_review = {
                        **claim,
                        "review_status": "pending",  # pending, approved, rejected
                        "added_at": datetime.now().isoformat()
                    }
                    project["claims"].append(claim_with_review)
                
                project["updated_at"] = datetime.now().isoformat()
                save_projects(projects)
                
                default_logger.info(f"Added {len(verified_claims)} claims to project '{category}' ({project_id})")
            except Exception as e:
                default_logger.warning(f"Failed to auto-add claims to project: {e}")
        
        log_api_response(default_logger, "/verify", 200, claims_count=len(verified_claims))
        
        return VerifyResponse(
            claims=verified_claims,
            processing_time=processing_time,
            llm_results=llm_results_list,
            ddg_results=ddg_results_list
        )
    
    except Exception as e:
        default_logger.error(f"Verification error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

