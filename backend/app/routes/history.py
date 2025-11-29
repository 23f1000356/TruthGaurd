"""
History Route
Handles storing and retrieving verification history
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

from app.utils.logging import log_api_request, log_api_response, default_logger

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings

router = APIRouter(prefix="/history", tags=["history"])


class HistoryEntry(BaseModel):
    id: str
    timestamp: str
    text: str
    claims: List[Dict[str, Any]]
    processing_time: float


class HistoryResponse(BaseModel):
    entries: List[HistoryEntry]
    total: int


def load_history() -> List[Dict[str, Any]]:
    """Load history from JSON file"""
    history_path = Path(settings.HISTORY_STORE_PATH)
    if not history_path.exists():
        return []
    
    try:
        with open(history_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        default_logger.error(f"Error loading history: {e}")
        return []


def save_history(history: List[Dict[str, Any]]):
    """Save history to JSON file"""
    history_path = Path(settings.HISTORY_STORE_PATH)
    history_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)


@router.post("/")
async def add_history_entry(entry: HistoryEntry):
    """Add a new history entry"""
    log_api_request(default_logger, "/history", "POST", entry_id=entry.id)
    
    try:
        history = load_history()
        
        # Convert to dict
        entry_dict = entry.dict()
        history.append(entry_dict)
        
        # Keep only last 1000 entries
        if len(history) > 1000:
            history = history[-1000:]
        
        save_history(history)
        
        log_api_response(default_logger, "/history", 200, entry_id=entry.id)
        
        return {"success": True, "id": entry.id}
    
    except Exception as e:
        default_logger.error(f"Add history error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to add history entry: {str(e)}")


@router.get("/", response_model=HistoryResponse)
async def get_history(limit: int = 50, offset: int = 0):
    """Get verification history"""
    log_api_request(default_logger, "/history", "GET", limit=limit, offset=offset)
    
    try:
        history = load_history()
        
        # Sort by timestamp (newest first)
        history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Paginate
        total = len(history)
        paginated = history[offset:offset + limit]
        
        log_api_response(default_logger, "/history", 200, count=len(paginated), total=total)
        
        return HistoryResponse(
            entries=[HistoryEntry(**entry) for entry in paginated],
            total=total
        )
    
    except Exception as e:
        default_logger.error(f"Get history error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/{entry_id}")
async def get_history_entry(entry_id: str):
    """Get a specific history entry"""
    log_api_request(default_logger, f"/history/{entry_id}", "GET")
    
    try:
        history = load_history()
        
        for entry in history:
            if entry.get("id") == entry_id:
                log_api_response(default_logger, f"/history/{entry_id}", 200)
                return HistoryEntry(**entry)
        
        raise HTTPException(status_code=404, detail="History entry not found")
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Get history entry error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history entry: {str(e)}")


@router.delete("/{entry_id}")
async def delete_history_entry(entry_id: str):
    """Delete a history entry"""
    log_api_request(default_logger, f"/history/{entry_id}", "DELETE")
    
    try:
        history = load_history()
        
        original_count = len(history)
        history = [entry for entry in history if entry.get("id") != entry_id]
        
        if len(history) == original_count:
            raise HTTPException(status_code=404, detail="History entry not found")
        
        save_history(history)
        
        log_api_response(default_logger, f"/history/{entry_id}", 200)
        
        return {"success": True, "id": entry_id}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Delete history error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete history entry: {str(e)}")

