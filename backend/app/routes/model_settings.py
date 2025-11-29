"""
Model Settings Route
Handles LLM configuration and settings
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import json
import sys
import os
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.utils.logging import log_api_request, log_api_response, default_logger

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings

router = APIRouter(prefix="/model-settings", tags=["model-settings"])


class ModelSettings(BaseModel):
    llm_endpoint: str
    llm_model: str
    temperature: float
    max_tokens: int
    strict_json: bool
    autogen_enabled: bool
    autogen_endpoint: Optional[str] = None
    autogen_agent_count: int


class UpdateSettingsRequest(BaseModel):
    llm_endpoint: Optional[str] = None
    llm_model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    strict_json: Optional[bool] = None
    autogen_enabled: Optional[bool] = None
    autogen_endpoint: Optional[str] = None
    autogen_agent_count: Optional[int] = None


SETTINGS_FILE = Path("./database/model_settings.json")


def load_settings() -> Dict[str, Any]:
    """Load model settings from file or use defaults"""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            default_logger.error(f"Error loading settings: {e}")
    
    # Return defaults from config
    return {
        "llm_endpoint": settings.LLM_ENDPOINT,
        "llm_model": settings.LLM_MODEL,
        "temperature": settings.LLM_TEMPERATURE,
        "max_tokens": settings.LLM_MAX_TOKENS,
        "strict_json": settings.LLM_STRICT_JSON,
        "autogen_enabled": settings.AUTOGEN_ENABLED,
        "autogen_endpoint": settings.AUTOGEN_ENDPOINT,
        "autogen_agent_count": settings.AUTOGEN_AGENT_COUNT
    }


def save_settings(settings_dict: Dict[str, Any]):
    """Save model settings to file"""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SETTINGS_FILE, 'w') as f:
        json.dump(settings_dict, f, indent=2)


@router.get("/", response_model=ModelSettings)
async def get_settings():
    """Get current model settings"""
    log_api_request(default_logger, "/model-settings", "GET")
    
    try:
        settings_dict = load_settings()
        log_api_response(default_logger, "/model-settings", 200)
        return ModelSettings(**settings_dict)
    
    except Exception as e:
        default_logger.error(f"Get settings error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve settings: {str(e)}")


@router.put("/", response_model=ModelSettings)
async def update_settings(request: UpdateSettingsRequest):
    """Update model settings"""
    log_api_request(default_logger, "/model-settings", "PUT")
    
    try:
        current_settings = load_settings()
        
        # Update only provided fields
        if request.llm_endpoint is not None:
            current_settings["llm_endpoint"] = request.llm_endpoint
        if request.llm_model is not None:
            current_settings["llm_model"] = request.llm_model
        if request.temperature is not None:
            current_settings["temperature"] = request.temperature
        if request.max_tokens is not None:
            current_settings["max_tokens"] = request.max_tokens
        if request.strict_json is not None:
            current_settings["strict_json"] = request.strict_json
        if request.autogen_enabled is not None:
            current_settings["autogen_enabled"] = request.autogen_enabled
        if request.autogen_endpoint is not None:
            current_settings["autogen_endpoint"] = request.autogen_endpoint
        if request.autogen_agent_count is not None:
            current_settings["autogen_agent_count"] = request.autogen_agent_count
        
        save_settings(current_settings)
        
        log_api_response(default_logger, "/model-settings", 200)
        
        return ModelSettings(**current_settings)
    
    except Exception as e:
        default_logger.error(f"Update settings error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")


@router.post("/reset")
async def reset_settings():
    """Reset settings to defaults"""
    log_api_request(default_logger, "/model-settings/reset", "POST")
    
    try:
        # Use defaults from config
        default_settings = {
            "llm_endpoint": settings.LLM_ENDPOINT,
            "llm_model": settings.LLM_MODEL,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS,
            "strict_json": settings.LLM_STRICT_JSON,
            "autogen_enabled": settings.AUTOGEN_ENABLED,
            "autogen_endpoint": settings.AUTOGEN_ENDPOINT,
            "autogen_agent_count": settings.AUTOGEN_AGENT_COUNT
        }
        
        save_settings(default_settings)
        
        log_api_response(default_logger, "/model-settings/reset", 200)
        
        return ModelSettings(**default_settings)
    
    except Exception as e:
        default_logger.error(f"Reset settings error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reset settings: {str(e)}")

