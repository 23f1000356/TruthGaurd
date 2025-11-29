"""
Source Analyzer Route
Analyzes source credibility and domain metrics
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.credibility_analyzer import CredibilityAnalyzer
from app.utils.logging import log_api_request, log_api_response, default_logger

router = APIRouter(prefix="/analyze-source", tags=["source-analyzer"])


class AnalyzeSourceRequest(BaseModel):
    url: str


class AnalyzeSourceResponse(BaseModel):
    domain: str
    url: str
    trust_score: float
    domain_age: Optional[str] = None
    is_fact_checker: bool
    is_academic: bool
    is_unreliable: bool
    bias: str
    popularity: str
    metrics: Dict[str, Any]


credibility_analyzer = CredibilityAnalyzer()


@router.post("/", response_model=AnalyzeSourceResponse)
async def analyze_source(request: AnalyzeSourceRequest):
    """
    Analyze source credibility
    
    Args:
        request: Source URL to analyze
        
    Returns:
        Credibility analysis with trust score and metrics
    """
    log_api_request(default_logger, "/analyze-source", "POST", url=request.url)
    
    try:
        analysis = credibility_analyzer.analyze_source(request.url)
        
        log_api_response(default_logger, "/analyze-source", 200, domain=analysis.get("domain"))
        
        return AnalyzeSourceResponse(
            domain=analysis.get("domain", "unknown"),
            url=request.url,
            trust_score=analysis.get("trust_score", 0.0),
            domain_age=analysis.get("domain_age"),
            is_fact_checker=analysis.get("is_fact_checker", False),
            is_academic=analysis.get("is_academic", False),
            is_unreliable=analysis.get("is_unreliable", False),
            bias=analysis.get("bias", "unknown"),
            popularity=analysis.get("popularity", "unknown"),
            metrics=analysis
        )
    
    except Exception as e:
        default_logger.error(f"Analyze source error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze source: {str(e)}")


@router.post("/batch")
async def analyze_multiple_sources(urls: List[str]):
    """Analyze multiple sources and return aggregate metrics"""
    log_api_request(default_logger, "/analyze-source/batch", "POST", count=len(urls))
    
    try:
        analysis = credibility_analyzer.analyze_multiple_sources(urls)
        
        log_api_response(default_logger, "/analyze-source/batch", 200, sources_analyzed=len(urls))
        
        return analysis
    
    except Exception as e:
        default_logger.error(f"Batch analyze error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to analyze sources: {str(e)}")

