"""
Citation Graph Route
Builds node graph JSON for claims, evidence, and sources
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.utils.logging import log_api_request, log_api_response, default_logger

router = APIRouter(prefix="/citation-graph", tags=["citation-graph"])


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # claim, evidence, source
    data: Dict[str, Any]


class GraphEdge(BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    weight: Optional[float] = None


class CitationGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class BuildGraphRequest(BaseModel):
    claims: List[Dict[str, Any]]


@router.post("/build", response_model=CitationGraph)
async def build_citation_graph(request: BuildGraphRequest):
    """
    Build citation graph from claims
    
    Args:
        request: Claims with evidence and citations
        
    Returns:
        Graph structure with nodes and edges
    """
    log_api_request(default_logger, "/citation-graph/build", "POST", claims_count=len(request.claims))
    
    try:
        nodes = []
        edges = []
        node_ids = set()
        
        for claim_idx, claim in enumerate(request.claims):
            claim_id = f"claim_{claim_idx}"
            claim_text = claim.get("text", claim.get("claim", "Unknown"))
            
            # Add claim node
            if claim_id not in node_ids:
                nodes.append(GraphNode(
                    id=claim_id,
                    label=claim_text[:50] + "..." if len(claim_text) > 50 else claim_text,
                    type="claim",
                    data={
                        "verdict": claim.get("verdict", "unverified"),
                        "confidence": claim.get("confidence", 0.0),
                        "full_text": claim_text
                    }
                ))
                node_ids.add(claim_id)
            
            # Add evidence nodes and edges
            evidence = claim.get("evidence", [])
            citations = claim.get("citations", [])
            
            for ev_idx, ev in enumerate(evidence[:5]):  # Limit to top 5
                ev_id = f"evidence_{claim_idx}_{ev_idx}"
                
                if ev_id not in node_ids:
                    nodes.append(GraphNode(
                        id=ev_id,
                        label=ev.get("title", ev.get("source", "Evidence"))[:50],
                        type="evidence",
                        data={
                            "source": ev.get("source", "unknown"),
                            "url": ev.get("url", ""),
                            "snippet": ev.get("snippet", ev.get("text", ""))[:200]
                        }
                    ))
                    node_ids.add(ev_id)
                
                # Edge from claim to evidence
                edges.append(GraphEdge(
                    source=claim_id,
                    target=ev_id,
                    label="has_evidence",
                    weight=1.0
                ))
            
            # Add source nodes from citations
            for cit_idx, citation in enumerate(citations):
                source_id = f"source_{claim_idx}_{cit_idx}"
                
                if source_id not in node_ids:
                    nodes.append(GraphNode(
                        id=source_id,
                        label=citation[:50] if isinstance(citation, str) else str(citation)[:50],
                        type="source",
                        data={"citation": citation}
                    ))
                    node_ids.add(source_id)
                
                # Edge from claim to source
                edges.append(GraphEdge(
                    source=claim_id,
                    target=source_id,
                    label="cited_by",
                    weight=0.8
                ))
        
        log_api_response(default_logger, "/citation-graph/build", 200, nodes=len(nodes), edges=len(edges))
        
        return CitationGraph(nodes=nodes, edges=edges)
    
    except Exception as e:
        default_logger.error(f"Build graph error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to build citation graph: {str(e)}")

