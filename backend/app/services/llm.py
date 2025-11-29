"""
LLM Service for claim verification
Handles communication with LocalAI / llama.cpp endpoints
"""
import json
import httpx
import sys
import os
from typing import Dict, List, Optional, Any

# Add parent directory to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import settings


class LLMService:
    def __init__(
        self,
        endpoint: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        strict_json: Optional[bool] = None
    ):
        """
        Initialize LLM Service
        
        Args:
            endpoint: LLM API endpoint
            model: Model name
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            strict_json: Whether to enforce JSON output
        """
        self.endpoint = endpoint or settings.LLM_ENDPOINT
        self.model = model or settings.LLM_MODEL
        self.temperature = temperature if temperature is not None else settings.LLM_TEMPERATURE
        self.max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        self.strict_json = strict_json if strict_json is not None else settings.LLM_STRICT_JSON
    
    def generate(
        self,
        prompt: str,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        strict_json: Optional[bool] = None
    ) -> str:
        """
        Generate text completion from LLM
        
        Args:
            prompt: Input prompt
            temperature: Override default temperature
            max_tokens: Override default max_tokens
            strict_json: Override default strict_json
            
        Returns:
            Generated text response
        """
        temp = temperature if temperature is not None else self.temperature
        tokens = max_tokens or self.max_tokens
        json_mode = strict_json if strict_json is not None else self.strict_json
        
        # Format prompt for JSON mode if needed
        if json_mode:
            prompt = self._format_json_prompt(prompt)
        
        try:
            # Try OpenAI-compatible API first
            response = self._call_openai_api(prompt, temp, tokens, json_mode)
            return response
        except Exception as e:
            # Silently handle connection errors (expected when LLM server not running)
            if "10061" in str(e) or "actively refused" in str(e).lower():
                # Connection refused - LLM server not running, use fallback
                pass
            else:
                print(f"OpenAI-compatible API call failed: {e}")
            # Fallback to direct completion endpoint
            try:
                return self._call_completion_api(prompt, temp, tokens)
            except Exception as e2:
                # Silently handle connection errors
                if "10061" in str(e2) or "actively refused" in str(e2).lower():
                    # Connection refused - LLM server not running, use fallback
                    pass
                else:
                    print(f"Completion API call failed: {e2}")
                # Final fallback: return a simple rule-based response
                return self._rule_based_fallback(prompt)
    
    def _format_json_prompt(self, prompt: str) -> str:
        """Format prompt to encourage JSON output"""
        return f"""{prompt}

Important: Respond with valid JSON only. Do not include any text before or after the JSON."""
    
    def _call_openai_api(
        self,
        prompt: str,
        temperature: float,
        max_tokens: int,
        json_mode: bool
    ) -> str:
        """Call OpenAI-compatible API or Ollama API"""
        
        # Check if this is Ollama endpoint
        if "11434" in self.endpoint or "/api/generate" in self.endpoint:
            return self._call_ollama_api(prompt, temperature, max_tokens)
        
        # Standard OpenAI-compatible API
        payload = {
            "model": self.model,
            "prompt": prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if json_mode:
            payload["response_format"] = {"type": "json_object"}
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                self.endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Handle different response formats
            if "choices" in data:
                return data["choices"][0]["text"] if "text" in data["choices"][0] else data["choices"][0]["message"]["content"]
            elif "content" in data:
                return data["content"]
            else:
                return str(data)
    
    def _call_ollama_api(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call Ollama API (different format)"""
        payload = {
            "model": self.model,
            "prompt": prompt,
            "temperature": temperature,
            "num_predict": max_tokens,  # Ollama uses num_predict instead of max_tokens
            "stream": False
        }
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                self.endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Ollama response format
            if "response" in data:
                return data["response"]
            elif "content" in data:
                return data["content"]
            else:
                return str(data)
    
    def _call_completion_api(self, prompt: str, temperature: float, max_tokens: int) -> str:
        """Call direct completion API (llama.cpp style)"""
        payload = {
            "prompt": prompt,
            "temperature": temperature,
            "n_predict": max_tokens,
            "stop": ["</s>", "\n\n\n"]
        }
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                self.endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            if "content" in data:
                return data["content"]
            elif "text" in data:
                return data["text"]
            else:
                return str(data)
    
    def _rule_based_verify_claim(self, claim: str, evidence: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Rule-based claim verification when LLM is unavailable
        Analyzes evidence and claim text to provide evidence-based verification
        """
        claim_lower = claim.lower()
        
        # Count evidence sources
        evidence_count = len(evidence)
        web_sources = sum(1 for e in evidence if e.get("type") == "web")
        kb_sources = sum(1 for e in evidence if e.get("type") == "kb")
        
        # Analyze evidence content for claim support
        supporting_evidence = 0
        contradicting_evidence = 0
        evidence_snippets = []
        
        for ev in evidence:
            snippet = ev.get("snippet", "") or ev.get("text", "")
            snippet_lower = snippet.lower()
            claim_keywords = [word for word in claim_lower.split() if len(word) > 4]
            
            # Check if evidence mentions claim keywords
            if any(keyword in snippet_lower for keyword in claim_keywords):
                # Check for supporting/contradicting language
                if any(word in snippet_lower for word in ["confirm", "verify", "true", "accurate", "correct", "valid"]):
                    supporting_evidence += 1
                elif any(word in snippet_lower for word in ["false", "debunk", "disprove", "incorrect", "invalid", "misleading"]):
                    contradicting_evidence += 1
                else:
                    supporting_evidence += 0.5  # Neutral but relevant
                
                if len(evidence_snippets) < 2:
                    evidence_snippets.append(snippet[:150] + "..." if len(snippet) > 150 else snippet)
        
        # Simple keyword heuristics
        false_indicators = ["never happened", "fake", "hoax", "conspiracy", "false", "not true", "debunked"]
        true_indicators = ["confirmed", "verified", "proven", "fact", "true", "accurate", "established"]
        misleading_indicators = ["partially", "somewhat", "misleading", "out of context", "exaggerated"]
        
        false_count = sum(1 for indicator in false_indicators if indicator in claim_lower)
        true_count = sum(1 for indicator in true_indicators if indicator in claim_lower)
        misleading_count = sum(1 for indicator in misleading_indicators if indicator in claim_lower)
        
        # Determine verdict based on evidence analysis
        verdict = "unverified"
        confidence = 0.3
        explanation_parts = []
        
        if evidence_count == 0:
            verdict = "unverified"
            confidence = 0.2
            explanation = "No evidence sources found to verify this claim. Web search and Knowledge Base retrieval returned no results."
        else:
            # Build evidence-based explanation
            explanation_parts.append(f"Analyzed {evidence_count} evidence source(s)")
            if web_sources > 0:
                explanation_parts.append(f"{web_sources} web source(s)")
            if kb_sources > 0:
                explanation_parts.append(f"{kb_sources} knowledge base document(s)")
            
            # Determine verdict from evidence analysis
            if supporting_evidence > contradicting_evidence and supporting_evidence > 0:
                verdict = "true"
                confidence = min(0.75, 0.5 + (supporting_evidence * 0.1) + (evidence_count * 0.05))
                explanation_parts.append(f"Evidence supports this claim ({int(supporting_evidence)} supporting source(s))")
            elif contradicting_evidence > supporting_evidence and contradicting_evidence > 0:
                verdict = "false"
                confidence = min(0.75, 0.5 + (contradicting_evidence * 0.1) + (evidence_count * 0.05))
                explanation_parts.append(f"Evidence contradicts this claim ({int(contradicting_evidence)} contradicting source(s))")
            elif false_count > true_count and false_count > 0:
                verdict = "false"
                confidence = min(0.7, 0.4 + (evidence_count * 0.1))
                explanation_parts.append("Keyword analysis suggests this claim is false")
            elif true_count > false_count and true_count > 0:
                verdict = "true"
                confidence = min(0.7, 0.4 + (evidence_count * 0.1))
                explanation_parts.append("Keyword analysis suggests this claim is true")
            elif misleading_count > 0:
                verdict = "misleading"
                confidence = min(0.65, 0.35 + (evidence_count * 0.1))
                explanation_parts.append("This claim may be misleading or require additional context")
            else:
                # Default: unverified with evidence
                confidence = min(0.6, 0.3 + (evidence_count * 0.05))
                explanation_parts.append("Insufficient evidence to determine veracity")
            
            # Add evidence snippets if available
            if evidence_snippets:
                explanation_parts.append("\n\nRelevant evidence:")
                for idx, snippet in enumerate(evidence_snippets, 1):
                    explanation_parts.append(f"{idx}. {snippet}")
            
            explanation = ". ".join(explanation_parts)
        
        # Extract citations from evidence
        citations = []
        for ev in evidence[:5]:  # Top 5 sources
            if ev.get("url"):
                citations.append(ev.get("url"))
            elif ev.get("title"):
                citations.append(ev.get("title"))
        
        return {
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "citations": citations
        }
    
    def _rule_based_fallback(self, prompt: str) -> str:
        """
        Rule-based fallback when LLM is unavailable
        Provides basic fact-checking based on keyword matching and evidence presence
        """
        # Extract claim from prompt if possible
        claim_lower = prompt.lower()
        
        # Simple keyword-based heuristics
        false_indicators = ["never happened", "fake", "hoax", "conspiracy", "false", "not true"]
        true_indicators = ["confirmed", "verified", "proven", "fact", "true", "accurate"]
        misleading_indicators = ["partially", "somewhat", "misleading", "out of context"]
        
        verdict = "unverified"
        confidence = 0.5
        explanation = "Unable to verify using LLM. Please ensure a local LLM endpoint is running (e.g., LocalAI, llama.cpp, or TextGen WebUI) at the configured endpoint."
        
        false_count = sum(1 for indicator in false_indicators if indicator in claim_lower)
        true_count = sum(1 for indicator in true_indicators if indicator in claim_lower)
        misleading_count = sum(1 for indicator in misleading_indicators if indicator in claim_lower)
        
        if false_count > true_count and false_count > 0:
            verdict = "false"
            confidence = 0.6
            explanation = "Based on keyword analysis, this claim appears to be false. However, this is a fallback analysis - for accurate verification, please set up a local LLM endpoint."
        elif true_count > false_count and true_count > 0:
            verdict = "true"
            confidence = 0.6
            explanation = "Based on keyword analysis, this claim appears to be true. However, this is a fallback analysis - for accurate verification, please set up a local LLM endpoint."
        elif misleading_count > 0:
            verdict = "misleading"
            confidence = 0.55
            explanation = "Based on keyword analysis, this claim may be misleading. However, this is a fallback analysis - for accurate verification, please set up a local LLM endpoint."
        
        # Return JSON format
        return json.dumps({
            "verdict": verdict,
            "confidence": confidence,
            "explanation": explanation,
            "citations": []
        })
    
    def verify_claim(
        self,
        claim: str,
        evidence: List[Dict[str, str]],
        mode: str = "single"
    ) -> Dict[str, Any]:
        """
        Verify a claim using LLM
        
        Args:
            claim: Claim text to verify
            evidence: List of evidence sources
            mode: "single" or "debate"
            
        Returns:
            Verification result with verdict, confidence, explanation, and citations
        """
        # Build evidence context
        evidence_text = "\n".join([
            f"Source {idx + 1}: {ev.get('title', 'Unknown')}\n{ev.get('snippet', ev.get('text', ''))}\n"
            for idx, ev in enumerate(evidence[:5])  # Limit to top 5 evidence
        ])
        
        prompt = f"""You are a fact-checking expert. Analyze the following claim and evidence to determine its veracity.

Claim: {claim}

Evidence:
{evidence_text}

Provide your analysis in JSON format with the following structure:
{{
  "verdict": "true" | "false" | "misleading" | "unverified",
  "confidence": 0.0-1.0,
  "explanation": "Detailed explanation of your reasoning",
  "citations": ["source1", "source2"]
}}

JSON:"""
        
        try:
            response = self.generate(
                prompt=prompt,
                temperature=0.3,  # Lower temperature for more consistent results
                strict_json=True
            )
            
            # Parse JSON response
            # Try to extract JSON from response if it's wrapped in text
            response_clean = response.strip()
            if "{" in response_clean and "}" in response_clean:
                # Extract JSON part
                start = response_clean.find("{")
                end = response_clean.rfind("}") + 1
                response_clean = response_clean[start:end]
            
            result = json.loads(response_clean)
            
            # Validate and format
            return {
                "verdict": result.get("verdict", "unverified"),
                "confidence": float(result.get("confidence", 0.5)),
                "explanation": result.get("explanation", ""),
                "citations": result.get("citations", [])
            }
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response was: {response[:200] if response else 'None'}")
            # Use rule-based fallback if JSON parsing fails
            return self._rule_based_verify_claim(claim, evidence)
        except Exception as e:
            print(f"Verification error: {e}")
            # Use rule-based fallback on any error
            return self._rule_based_verify_claim(claim, evidence)

