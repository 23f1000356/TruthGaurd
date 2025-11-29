"""
Scoring utilities for claim verification
"""
from typing import Dict, List, Any
import math


def calculate_confidence_score(
    evidence_count: int,
    source_credibility: float,
    agreement_score: float,
    base_confidence: float = 0.5
) -> float:
    """
    Calculate confidence score from multiple factors
    
    Args:
        evidence_count: Number of evidence sources
        source_credibility: Average credibility of sources (0-1)
        agreement_score: How much evidence agrees (0-1)
        base_confidence: Base confidence level
        
    Returns:
        Confidence score (0-1)
    """
    # Evidence count factor (diminishing returns)
    evidence_factor = min(1.0, math.log(evidence_count + 1) / math.log(10))
    
    # Weighted combination
    confidence = (
        base_confidence * 0.3 +
        evidence_factor * 0.3 +
        source_credibility * 0.2 +
        agreement_score * 0.2
    )
    
    return max(0.0, min(1.0, confidence))


def calculate_agreement_score(verdicts: List[str]) -> float:
    """
    Calculate how much evidence agrees on a verdict
    
    Args:
        verdicts: List of verdict strings
        
    Returns:
        Agreement score (0-1)
    """
    if not verdicts:
        return 0.0
    
    # Count verdicts
    verdict_counts = {}
    for verdict in verdicts:
        verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
    
    # Calculate agreement (proportion of most common verdict)
    max_count = max(verdict_counts.values())
    agreement = max_count / len(verdicts)
    
    return agreement


def normalize_verdict(verdict: str) -> str:
    """
    Normalize verdict string to standard format
    
    Args:
        verdict: Verdict string
        
    Returns:
        Normalized verdict (true/false/misleading/unverified)
    """
    verdict_lower = verdict.lower().strip()
    
    # Map variations to standard verdicts
    true_variants = ["true", "correct", "accurate", "verified", "factual"]
    false_variants = ["false", "incorrect", "inaccurate", "debunked", "disproven"]
    misleading_variants = ["misleading", "partially true", "partially false", "mixed", "unclear"]
    
    if any(v in verdict_lower for v in true_variants):
        return "true"
    elif any(v in verdict_lower for v in false_variants):
        return "false"
    elif any(v in verdict_lower for v in misleading_variants):
        return "misleading"
    else:
        return "unverified"


def aggregate_verdicts(verdicts: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregate multiple verdicts into a single result
    
    Args:
        verdicts: List of verdict dictionaries with 'verdict' and 'confidence' keys
        
    Returns:
        Aggregated verdict
    """
    if not verdicts:
        return {
            "verdict": "unverified",
            "confidence": 0.0,
            "count": 0
        }
    
    # Normalize verdicts
    normalized = [normalize_verdict(v.get("verdict", "unverified")) for v in verdicts]
    
    # Count verdicts
    verdict_counts = {}
    for verdict in normalized:
        verdict_counts[verdict] = verdict_counts.get(verdict, 0) + 1
    
    # Majority vote
    final_verdict = max(verdict_counts.items(), key=lambda x: x[1])[0]
    
    # Average confidence for final verdict
    matching_verdicts = [
        v for v, n in zip(verdicts, normalized)
        if n == final_verdict
    ]
    avg_confidence = (
        sum(v.get("confidence", 0.0) for v in matching_verdicts) / len(matching_verdicts)
        if matching_verdicts else 0.0
    )
    
    return {
        "verdict": final_verdict,
        "confidence": avg_confidence,
        "count": len(verdicts),
        "distribution": verdict_counts
    }


def calculate_source_credibility_score(sources: List[Dict[str, Any]]) -> float:
    """
    Calculate average credibility score from sources
    
    Args:
        sources: List of source dictionaries with credibility metrics
        
    Returns:
        Average credibility score (0-1)
    """
    if not sources:
        return 0.0
    
    credibility_scores = [
        s.get("trust_score", 0.5) for s in sources
        if "trust_score" in s
    ]
    
    if not credibility_scores:
        return 0.5  # Default neutral
    
    return sum(credibility_scores) / len(credibility_scores)

