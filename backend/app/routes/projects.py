"""
Projects Route
Handles project creation, claim management, and project exports
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
import sys
import os
from datetime import datetime
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.exporter import ReportExporter
from app.utils.logging import log_api_request, log_api_response, default_logger

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings

router = APIRouter(prefix="/projects", tags=["projects"])


class Project(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: str
    updated_at: str
    claims: List[Dict[str, Any]]
    status: str = "active"  # active, completed, archived


class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None


class AddClaimRequest(BaseModel):
    claim: Dict[str, Any]


def load_projects() -> Dict[str, Dict[str, Any]]:
    """Load projects from JSON file"""
    projects_path = Path(settings.PROJECTS_STORE_PATH)
    if not projects_path.exists():
        return {}
    
    try:
        with open(projects_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        default_logger.error(f"Error loading projects: {e}")
        return {}


def save_projects(projects: Dict[str, Dict[str, Any]]):
    """Save projects to JSON file"""
    projects_path = Path(settings.PROJECTS_STORE_PATH)
    projects_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(projects_path, 'w') as f:
        json.dump(projects, f, indent=2)


@router.post("/", response_model=Project)
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    log_api_request(default_logger, "/projects", "POST", name=request.name)
    
    try:
        projects = load_projects()
        
        project_id = f"proj_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        project = {
            "id": project_id,
            "name": request.name,
            "description": request.description,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "claims": [],
            "status": "active"
        }
        
        projects[project_id] = project
        save_projects(projects)
        
        log_api_response(default_logger, "/projects", 200, project_id=project_id)
        
        return Project(**project)
    
    except Exception as e:
        default_logger.error(f"Create project error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create project: {str(e)}")


@router.get("/", response_model=List[Project])
async def list_projects():
    """List all projects"""
    log_api_request(default_logger, "/projects", "GET")
    
    try:
        projects = load_projects()
        
        project_list = [Project(**proj) for proj in projects.values()]
        
        # Sort by updated_at (newest first)
        project_list.sort(key=lambda x: x.updated_at, reverse=True)
        
        log_api_response(default_logger, "/projects", 200, count=len(project_list))
        
        return project_list
    
    except Exception as e:
        default_logger.error(f"List projects error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")


@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project"""
    log_api_request(default_logger, f"/projects/{project_id}", "GET")
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        log_api_response(default_logger, f"/projects/{project_id}", 200)
        
        return Project(**projects[project_id])
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Get project error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve project: {str(e)}")


@router.post("/{project_id}/claims")
async def add_claim_to_project(project_id: str, request: AddClaimRequest):
    """Add a claim to a project"""
    log_api_request(default_logger, f"/projects/{project_id}/claims", "POST")
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[project_id]
        project["claims"].append(request.claim)
        project["updated_at"] = datetime.now().isoformat()
        
        save_projects(projects)
        
        log_api_response(default_logger, f"/projects/{project_id}/claims", 200)
        
        return {"success": True, "claim_count": len(project["claims"])}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Add claim error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add claim: {str(e)}")


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    log_api_request(default_logger, f"/projects/{project_id}", "DELETE")
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        del projects[project_id]
        save_projects(projects)
        
        log_api_response(default_logger, f"/projects/{project_id}", 200)
        
        return {"success": True, "project_id": project_id}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Delete project error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")


@router.put("/{project_id}/claims/{claim_id}/approve")
async def approve_claim(project_id: str, claim_id: str):
    """Approve a claim (move from pending to approved)"""
    log_api_request(default_logger, f"/projects/{project_id}/claims/{claim_id}/approve", "PUT")
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[project_id]
        
        # Find and update claim
        claim_found = False
        for claim in project["claims"]:
            if str(claim.get("id")) == str(claim_id):
                claim["review_status"] = "approved"
                claim["reviewed_at"] = datetime.now().isoformat()
                claim_found = True
                break
        
        if not claim_found:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        project["updated_at"] = datetime.now().isoformat()
        save_projects(projects)
        
        log_api_response(default_logger, f"/projects/{project_id}/claims/{claim_id}/approve", 200)
        
        return {"success": True, "review_status": "approved"}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Approve claim error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to approve claim: {str(e)}")


@router.put("/{project_id}/claims/{claim_id}/reject")
async def reject_claim(project_id: str, claim_id: str):
    """Reject a claim (move from pending to rejected)"""
    log_api_request(default_logger, f"/projects/{project_id}/claims/{claim_id}/reject", "PUT")
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[project_id]
        
        # Find and update claim
        claim_found = False
        for claim in project["claims"]:
            if str(claim.get("id")) == str(claim_id):
                claim["review_status"] = "rejected"
                claim["reviewed_at"] = datetime.now().isoformat()
                claim_found = True
                break
        
        if not claim_found:
            raise HTTPException(status_code=404, detail="Claim not found")
        
        project["updated_at"] = datetime.now().isoformat()
        save_projects(projects)
        
        log_api_response(default_logger, f"/projects/{project_id}/claims/{claim_id}/reject", 200)
        
        return {"success": True, "review_status": "rejected"}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Reject claim error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reject claim: {str(e)}")


@router.post("/{project_id}/export")
async def export_project(project_id: str, format: str = "pdf", logo_path: Optional[str] = None, footer_text: Optional[str] = None):
    """Export project as PDF, HTML, or Markdown"""
    log_api_request(default_logger, f"/projects/{project_id}/export", "POST", format=format)
    
    try:
        projects = load_projects()
        
        if project_id not in projects:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project = projects[project_id]
        claims = project["claims"]
        
        if not claims:
            raise HTTPException(status_code=400, detail="Project has no claims to export")
        
        exporter = ReportExporter()
        title = f"{project['name']} - Fact-Check Report"
        
        if format == "pdf":
            pdf_buffer = exporter.export_to_pdf(claims, logo_path, footer_text, title)
            from fastapi.responses import StreamingResponse
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={project_id}_report.pdf"}
            )
        elif format == "html":
            html_content = exporter.export_to_html(claims, logo_path, footer_text, title)
            from fastapi.responses import Response
            return Response(content=html_content, media_type="text/html")
        elif format == "markdown":
            md_content = exporter.export_to_markdown(claims, footer_text, title)
            from fastapi.responses import Response
            return Response(content=md_content, media_type="text/markdown")
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'pdf', 'html', or 'markdown'")
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Export project error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to export project: {str(e)}")

