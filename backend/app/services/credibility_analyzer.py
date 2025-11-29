"""
Credibility Analyzer Service
Analyzes domain credibility, trust scores, and source reliability
"""
import re
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse
import httpx
from datetime import datetime


class CredibilityAnalyzer:
    def __init__(self):
        """Initialize credibility analyzer"""
        # Known fact-checking domains
        self.fact_check_domains = {
            "factcheck.org", "snopes.com", "politifact.com",
            "fullfact.org", "checkyourfact.com", "leadstories.com"
        }
        
        # Known unreliable domains (example list - should be maintained)
        self.unreliable_domains = {
            "infowars.com", "naturalnews.com"
        }
        
        # Academic domains
        self.academic_domains = {
            ".edu", ".ac.uk", ".edu.au"
        }
    
    def analyze_source(self, url: str) -> Dict[str, Any]:
        """
        Analyze source credibility
        
        Args:
            url: Source URL to analyze
            
        Returns:
            Credibility metrics including domain age, trust score, bias, etc.
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "").lower()
            
            # Basic metrics
            metrics = {
                "domain": domain,
                "url": url,
                "domain_age": self._estimate_domain_age(domain),
                "trust_score": 0.5,  # Default neutral
                "popularity": "unknown",
                "bias": "unknown",
                "fact_check_history": [],
                "is_fact_checker": domain in self.fact_check_domains,
                "is_unreliable": domain in self.unreliable_domains,
                "is_academic": any(domain.endswith(ext) for ext in self.academic_domains),
                "tld": parsed.netloc.split(".")[-1] if "." in parsed.netloc else ""
            }
            
            # Calculate trust score
            metrics["trust_score"] = self._calculate_trust_score(metrics)
            
            # Try to fetch additional metadata
            try:
                additional_metrics = self._fetch_domain_metadata(domain)
                metrics.update(additional_metrics)
            except:
                pass  # Continue with basic metrics if fetch fails
            
            return metrics
        except Exception as e:
            print(f"Error analyzing source: {e}")
            return {
                "domain": "unknown",
                "url": url,
                "trust_score": 0.0,
                "error": str(e)
            }
    
    def _estimate_domain_age(self, domain: str) -> Optional[str]:
        """Estimate domain age (simplified - would need WHOIS in production)"""
        # This is a placeholder - real implementation would use WHOIS API
        # For now, return based on TLD and known patterns
        if domain.endswith(".edu") or domain.endswith(".gov"):
            return "established"
        elif domain.endswith(".org"):
            return "likely_established"
        else:
            return "unknown"
    
    def _calculate_trust_score(self, metrics: Dict[str, Any]) -> float:
        """Calculate trust score from metrics"""
        score = 0.5  # Start neutral
        
        # Boost for fact-checkers
        if metrics.get("is_fact_checker"):
            score += 0.3
        
        # Boost for academic domains
        if metrics.get("is_academic"):
            score += 0.2
        
        # Penalize unreliable domains
        if metrics.get("is_unreliable"):
            score -= 0.4
        
        # Boost for established domains
        if metrics.get("domain_age") == "established":
            score += 0.1
        
        # Clamp between 0 and 1
        return max(0.0, min(1.0, score))
    
    def _fetch_domain_metadata(self, domain: str) -> Dict[str, Any]:
        """Fetch additional domain metadata (placeholder)"""
        # In production, this could query:
        # - WHOIS API for domain age
        # - Alexa/SimilarWeb for popularity
        # - Media Bias Fact Check API for bias
        # - Custom fact-check history database
        
        return {
            "popularity_rank": None,
            "bias_rating": None,
            "country": None
        }
    
    def analyze_multiple_sources(self, urls: List[str]) -> Dict[str, Any]:
        """
        Analyze multiple sources and provide aggregate metrics
        
        Args:
            urls: List of source URLs
            
        Returns:
            Aggregate credibility analysis
        """
        analyses = [self.analyze_source(url) for url in urls]
        
        if not analyses:
            return {
                "average_trust_score": 0.0,
                "source_count": 0,
                "sources": []
            }
        
        avg_trust = sum(a.get("trust_score", 0.0) for a in analyses) / len(analyses)
        fact_checker_count = sum(1 for a in analyses if a.get("is_fact_checker"))
        academic_count = sum(1 for a in analyses if a.get("is_academic"))
        unreliable_count = sum(1 for a in analyses if a.get("is_unreliable"))
        
        return {
            "average_trust_score": avg_trust,
            "source_count": len(analyses),
            "fact_checker_sources": fact_checker_count,
            "academic_sources": academic_count,
            "unreliable_sources": unreliable_count,
            "sources": analyses
        }

