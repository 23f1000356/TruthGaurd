"""
Report Route
Handles report generation and export
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.exporter import ReportExporter
from app.utils.logging import log_api_request, log_api_response, default_logger

router = APIRouter(prefix="/report", tags=["report"])


class BuildReportRequest(BaseModel):
    claims: List[Dict[str, Any]]
    format: str = "pdf"  # pdf, html, markdown
    logo_path: Optional[str] = None
    footer_text: Optional[str] = None
    title: str = "Fact-Check Report"


@router.post("/build")
async def build_report(request: BuildReportRequest):
    """
    Build and export a report
    
    Args:
        request: Report request with claims and options
    """
    log_api_request(default_logger, "/report/build", "POST", format=request.format, claims_count=len(request.claims))
    
    try:
        if not request.claims:
            raise HTTPException(status_code=400, detail="No claims provided")
        
        exporter = ReportExporter()
        
        if request.format == "pdf":
            pdf_buffer = exporter.export_to_pdf(
                request.claims,
                request.logo_path,
                request.footer_text,
                request.title
            )
            from fastapi.responses import StreamingResponse
            log_api_response(default_logger, "/report/build", 200, format="pdf")
            return StreamingResponse(
                pdf_buffer,
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=report.pdf"}
            )
        
        elif request.format == "html":
            html_content = exporter.export_to_html(
                request.claims,
                request.logo_path,
                request.footer_text,
                request.title
            )
            from fastapi.responses import Response
            log_api_response(default_logger, "/report/build", 200, format="html")
            return Response(content=html_content, media_type="text/html")
        
        elif request.format == "markdown":
            md_content = exporter.export_to_markdown(
                request.claims,
                request.footer_text,
                request.title
            )
            from fastapi.responses import Response
            log_api_response(default_logger, "/report/build", 200, format="markdown")
            return Response(content=md_content, media_type="text/markdown")
        
        else:
            raise HTTPException(status_code=400, detail="Invalid format. Use 'pdf', 'html', or 'markdown'")
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Build report error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to build report: {str(e)}")

