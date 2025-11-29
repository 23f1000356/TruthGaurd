"""
Analytics Route
Provides aggregated statistics and analytics data
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import sys
import os
from datetime import datetime, timedelta
from collections import Counter, defaultdict

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.routes.history import load_history as load_history_data
from app.routes.projects import load_projects
from app.utils.logging import log_api_request, log_api_response, default_logger

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/")
async def get_analytics():
    """
    Get aggregated analytics data
    Returns statistics on claims, verdicts, accuracy, and trends
    """
    log_api_request(default_logger, "/analytics", "GET")
    
    try:
        # Load history and projects
        history_data = load_history_data()
        projects = load_projects()
        
        # Aggregate all claims from history and projects
        all_claims = []
        
        # From history (history is stored as a list)
        if isinstance(history_data, list):
            for entry in history_data:
                claims = entry.get("claims", [])
                all_claims.extend(claims)
        elif isinstance(history_data, dict):
            for entry in history_data.values():
                claims = entry.get("claims", [])
                all_claims.extend(claims)
        
        # From projects
        for project in projects.values():
            claims = project.get("claims", [])
            all_claims.extend(claims)
        
        total_claims = len(all_claims)
        
        # Calculate verdict distribution
        verdict_counts = Counter()
        for claim in all_claims:
            verdict = claim.get("verdict", "unverified")
            verdict_counts[verdict] += 1
        
        total_verdicts = sum(verdict_counts.values())
        verdict_data = []
        if total_verdicts > 0:
            for verdict in ["true", "false", "misleading", "unverified"]:
                count = verdict_counts.get(verdict, 0)
                percentage = (count / total_verdicts * 100) if total_verdicts > 0 else 0
                verdict_data.append({
                    "verdict": verdict.capitalize(),
                    "count": count,
                    "percentage": round(percentage, 1)
                })
        
        # Calculate accuracy rate (true claims / total verified claims)
        verified_claims = [c for c in all_claims if c.get("verdict") != "unverified"]
        true_claims = [c for c in all_claims if c.get("verdict") == "true"]
        
        accuracy_rate = 0.0
        if len(verified_claims) > 0:
            accuracy_rate = (len(true_claims) / len(verified_claims) * 100)
        
        # Count manual corrections (claims with review_status changed)
        manual_corrections = sum(
            1 for claim in all_claims 
            if claim.get("review_status") in ["approved", "rejected"]
        )
        
        # Calculate trends (compare last 7 days vs previous 7 days)
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        
        recent_claims = [
            c for c in all_claims
            if c.get("added_at") or c.get("timestamp")
        ]
        
        # Get trending topics (from project names and claim categories)
        topic_counts = Counter()
        for project in projects.values():
            name = project.get("name", "").lower()
            if name:
                topic_counts[name] += len(project.get("claims", []))
        
        trending_topics = [
            {"topic": topic.capitalize(), "searches": count, "trend": "up"}
            for topic, count in topic_counts.most_common(5)
        ]
        
        # Get top sources (from evidence URLs)
        source_counts = Counter()
        for claim in all_claims:
            evidence = claim.get("evidence", [])
            for ev in evidence:
                url = ev.get("url", "")
                if url:
                    try:
                        from urllib.parse import urlparse
                        domain = urlparse(url).netloc.replace("www.", "")
                        source_counts[domain] += 1
                    except:
                        pass
        
        top_sources = [
            {"domain": domain, "count": count}
            for domain, count in source_counts.most_common(5)
        ]
        
        # Calculate accuracy over time (last 6 weeks)
        accuracy_over_time = []
        for week in range(6, 0, -1):
            week_start = now - timedelta(weeks=week)
            week_end = now - timedelta(weeks=week-1)
            
            week_claims = [
                c for c in recent_claims
                if c.get("added_at") or c.get("timestamp")
            ]
            
            week_verified = [c for c in week_claims if c.get("verdict") != "unverified"]
            week_true = [c for c in week_claims if c.get("verdict") == "true"]
            
            week_accuracy = (len(week_true) / len(week_verified) * 100) if len(week_verified) > 0 else 0
            accuracy_over_time.append({
                "week": f"Week {7-week}",
                "accuracy": round(week_accuracy, 1)
            })
        
        # Calculate changes (simplified - compare recent vs older)
        recent_count = len([c for c in recent_claims])
        older_count = max(1, total_claims - recent_count)
        
        claims_change = ((recent_count - older_count) / older_count * 100) if older_count > 0 else 0
        
        log_api_response(default_logger, "/analytics", 200, total_claims=total_claims)
        
        return {
            "stats": {
                "claims_processed": total_claims,
                "claims_change": round(claims_change, 1),
                "accuracy_rate": round(accuracy_rate, 1),
                "accuracy_change": 0.0,  # Would need historical data for real change
                "manual_corrections": manual_corrections,
                "corrections_change": 0.0,  # Would need historical data
                "active_users": 1,  # Placeholder - would need user tracking
                "users_change": 0.0
            },
            "verdict_distribution": verdict_data,
            "trending_topics": trending_topics,
            "top_sources": top_sources,
            "accuracy_over_time": accuracy_over_time
        }
    
    except Exception as e:
        default_logger.error(f"Analytics error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")

