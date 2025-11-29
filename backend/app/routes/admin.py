"""
Admin Route
Handles team management, user roles, and audit logs
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

router = APIRouter(prefix="/admin", tags=["admin"])


class TeamMember(BaseModel):
    id: str
    email: str
    name: str
    role: str  # viewer, analyst, admin
    invited_at: str
    last_active: Optional[str] = None


class InviteUserRequest(BaseModel):
    email: str
    name: str
    role: str = "viewer"


class UpdateRoleRequest(BaseModel):
    role: str


class AuditLog(BaseModel):
    id: str
    timestamp: str
    user_id: str
    action: str
    resource: str
    details: Dict[str, Any]


TEAM_FILE = Path("./database/team.json")
AUDIT_LOG_FILE = Path(settings.AUDIT_LOG_PATH)


def load_team() -> Dict[str, Dict[str, Any]]:
    """Load team members from file"""
    if not TEAM_FILE.exists():
        return {}
    
    try:
        with open(TEAM_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        default_logger.error(f"Error loading team: {e}")
        return {}


def save_team(team: Dict[str, Dict[str, Any]]):
    """Save team members to file"""
    TEAM_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TEAM_FILE, 'w') as f:
        json.dump(team, f, indent=2)


def load_audit_logs() -> List[Dict[str, Any]]:
    """Load audit logs from file"""
    if not AUDIT_LOG_FILE.exists():
        return []
    
    try:
        with open(AUDIT_LOG_FILE, 'r') as f:
            return json.load(f)
    except Exception as e:
        default_logger.error(f"Error loading audit logs: {e}")
        return []


def save_audit_log(log_entry: Dict[str, Any]):
    """Append audit log entry"""
    logs = load_audit_logs()
    logs.append(log_entry)
    
    # Keep only last 10000 entries
    if len(logs) > 10000:
        logs = logs[-10000:]
    
    AUDIT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIT_LOG_FILE, 'w') as f:
        json.dump(logs, f, indent=2)


@router.post("/invite", response_model=TeamMember)
async def invite_user(request: InviteUserRequest):
    """Invite a new user to the team"""
    log_api_request(default_logger, "/admin/invite", "POST", email=request.email)
    
    try:
        if request.role not in ["viewer", "analyst", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role. Use 'viewer', 'analyst', or 'admin'")
        
        team = load_team()
        
        # Check if user already exists
        for member in team.values():
            if member["email"] == request.email:
                raise HTTPException(status_code=400, detail="User with this email already exists")
        
        user_id = f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        member = {
            "id": user_id,
            "email": request.email,
            "name": request.name,
            "role": request.role,
            "invited_at": datetime.now().isoformat(),
            "last_active": None
        }
        
        team[user_id] = member
        save_team(team)
        
        # Log audit
        save_audit_log({
            "id": f"audit_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "user_id": "system",
            "action": "invite_user",
            "resource": user_id,
            "details": {"email": request.email, "role": request.role}
        })
        
        log_api_response(default_logger, "/admin/invite", 200, user_id=user_id)
        
        return TeamMember(**member)
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Invite user error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to invite user: {str(e)}")


@router.get("/team", response_model=List[TeamMember])
async def list_team_members():
    """List all team members"""
    log_api_request(default_logger, "/admin/team", "GET")
    
    try:
        team = load_team()
        members = [TeamMember(**member) for member in team.values()]
        
        log_api_response(default_logger, "/admin/team", 200, count=len(members))
        
        return members
    
    except Exception as e:
        default_logger.error(f"List team error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to list team members: {str(e)}")


@router.put("/team/{user_id}/role", response_model=TeamMember)
async def update_user_role(user_id: str, request: UpdateRoleRequest):
    """Update user role"""
    log_api_request(default_logger, f"/admin/team/{user_id}/role", "PUT")
    
    try:
        if request.role not in ["viewer", "analyst", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        team = load_team()
        
        if user_id not in team:
            raise HTTPException(status_code=404, detail="User not found")
        
        team[user_id]["role"] = request.role
        
        save_team(team)
        
        # Log audit
        save_audit_log({
            "id": f"audit_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "user_id": "system",
            "action": "update_role",
            "resource": user_id,
            "details": {"new_role": request.role}
        })
        
        log_api_response(default_logger, f"/admin/team/{user_id}/role", 200)
        
        return TeamMember(**team[user_id])
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Update role error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")


@router.delete("/team/{user_id}")
async def remove_user(user_id: str):
    """Remove a user from the team"""
    log_api_request(default_logger, f"/admin/team/{user_id}", "DELETE")
    
    try:
        team = load_team()
        
        if user_id not in team:
            raise HTTPException(status_code=404, detail="User not found")
        
        del team[user_id]
        save_team(team)
        
        # Log audit
        save_audit_log({
            "id": f"audit_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "user_id": "system",
            "action": "remove_user",
            "resource": user_id,
            "details": {}
        })
        
        log_api_response(default_logger, f"/admin/team/{user_id}", 200)
        
        return {"success": True, "user_id": user_id}
    
    except HTTPException:
        raise
    except Exception as e:
        default_logger.error(f"Remove user error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to remove user: {str(e)}")


@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(limit: int = 100, offset: int = 0):
    """Get audit logs"""
    log_api_request(default_logger, "/admin/audit-logs", "GET", limit=limit)
    
    try:
        logs = load_audit_logs()
        
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Paginate
        paginated = logs[offset:offset + limit]
        
        log_api_response(default_logger, "/admin/audit-logs", 200, count=len(paginated))
        
        return [AuditLog(**log) for log in paginated]
    
    except Exception as e:
        default_logger.error(f"Get audit logs error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit logs: {str(e)}")

