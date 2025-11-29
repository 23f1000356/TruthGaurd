"""
AutoGen Debate Service (Optional)
Aggregates responses from multiple AI agents for debate-based verification
"""
import httpx
import sys
import os
from typing import Dict, List, Any, Optional

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings


class AutoGenService:
    def __init__(self, endpoint: Optional[str] = None, agent_count: int = 3):
        """
        Initialize AutoGen Service
        
        Args:
            endpoint: AutoGen microservice endpoint
            agent_count: Number of debate agents
        """
        self.endpoint = endpoint or settings.AUTOGEN_ENDPOINT
        self.agent_count = agent_count
        self.enabled = settings.AUTOGEN_ENABLED and self.endpoint is not None
    
    def debate_claim(
        self,
        claim: str,
        evidence: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Run debate-based verification using multiple agents
        
        Args:
            claim: Claim to verify
            evidence: List of evidence sources
            
        Returns:
            Aggregated verdict with agent responses
        """
        if not self.enabled:
            return {
                "verdict": "unverified",
                "confidence": 0.0,
                "explanation": "AutoGen service not enabled",
                "agent_responses": []
            }
        
        try:
            payload = {
                "claim": claim,
                "evidence": evidence,
                "agent_count": self.agent_count
            }
            
            with httpx.Client(timeout=120.0) as client:
                response = client.post(
                    f"{self.endpoint}/debate",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"AutoGen service error: {e}")
            return {
                "verdict": "unverified",
                "confidence": 0.0,
                "explanation": f"AutoGen service unavailable: {str(e)}",
                "agent_responses": []
            }
    
    def aggregate_verdicts(self, agent_responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate multiple agent verdicts into a final result
        
        Args:
            agent_responses: List of agent responses
            
        Returns:
            Aggregated verdict
        """
        if not agent_responses:
            return {
                "verdict": "unverified",
                "confidence": 0.0,
                "explanation": "No agent responses"
            }
        
        # Count verdicts
        verdict_counts = {}
        total_confidence = 0.0
        
        for response in agent_responses:
            verdict = response.get("verdict", "unverified")
            confidence = response.get("confidence", 0.0)
            
            verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
            total_confidence += confidence
        
        # Majority vote
        final_verdict = max(verdict_counts.items(), key=lambda x: x[1])[0]
        avg_confidence = total_confidence / len(agent_responses)
        
        # Build explanation from all agents
        explanations = [r.get("explanation", "") for r in agent_responses]
        combined_explanation = "\n\n".join([
            f"Agent {idx + 1}: {exp}" for idx, exp in enumerate(explanations)
        ])
        
        return {
            "verdict": final_verdict,
            "confidence": avg_confidence,
            "explanation": combined_explanation,
            "agent_responses": agent_responses,
            "verdict_distribution": verdict_counts
        }

