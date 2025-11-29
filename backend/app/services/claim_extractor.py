"""
Claim Extraction Service
Extracts structured claims from input text using spaCy or LLM
"""
import re
from typing import List, Dict, Optional

# Try to import spaCy (optional)
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    spacy = None

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    # Fallback if langchain not available
    RecursiveCharacterTextSplitter = None


class ClaimExtractor:
    def __init__(self, use_llm: bool = False, llm_service=None, rag_retriever=None):
        """
        Initialize claim extractor
        
        Args:
            use_llm: If True, use LLM for extraction (higher recall)
            llm_service: LLM service instance if use_llm is True
            rag_retriever: RAG retriever instance for context-aware extraction
        """
        self.use_llm = use_llm
        self.llm_service = llm_service
        self.rag_retriever = rag_retriever
        
        # Initialize spaCy if available
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except OSError:
                self.nlp = None
                print("Warning: spaCy model not found. Using simple claim extraction. Install with: python -m spacy download en_core_web_sm")
        else:
            self.nlp = None
            print("Info: spaCy not installed. Using simple claim extraction. For better results, install: pip install spacy && python -m spacy download en_core_web_sm")
        
        # Initialize text splitter if langchain available
        if RecursiveCharacterTextSplitter:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50
            )
        else:
            self.text_splitter = None
    
    def extract_with_spacy(self, text: str) -> List[Dict[str, any]]:
        """
        Extract claims using spaCy dependency parsing for accurate results
        
        Uses dependency parsing to identify declarative sentences with factual content
        """
        if not self.nlp:
            return []  # Return empty list, fallback will be called separately
        
        claims = []
        doc = self.nlp(text)
        
        # Extract declarative sentences
        for sent in doc.sents:
            sent_text = sent.text.strip()
            
            # Skip very short sentences
            if len(sent_text) < 15:
                continue
            
            # Skip questions (sentences ending with ?)
            if sent_text.endswith('?'):
                continue
            
            # Check for declarative structure: must have a root verb
            has_root_verb = any(
                token.dep_ == "ROOT" and token.pos_ in ["VERB", "AUX"] 
                for token in sent
            )
            
            if not has_root_verb:
                continue
            
            # Filter out common non-claim patterns
            sent_lower = sent_text.lower()
            skip_patterns = [
                "according to",
                "as reported by",
                "sources say",
                "it is said",
                "some believe",
                "many think",
                "people say"
            ]
            
            if any(pattern in sent_lower for pattern in skip_patterns):
                continue
            
            # Check for factual claim indicators
            claim_indicators = [
                "is", "are", "was", "were", "will be", "has been", "have been",
                "causes", "caused", "leads to", "results in", "means",
                "contains", "includes", "consists of", "comprises"
            ]
            
            # Prefer sentences with claim indicators for higher confidence
            confidence = 0.7
            if any(indicator in sent_lower for indicator in claim_indicators):
                confidence = 0.8
            
            # Additional check: sentence should have subject and predicate
            has_subject = any(
                token.dep_ in ["nsubj", "nsubjpass", "csubj"] 
                for token in sent
            )
            
            if has_subject:
                claims.append({
                    "id": len(claims) + 1,
                    "claim": sent_text,
                    "confidence": confidence
                })
        
        return claims
    
    def extract_with_llm(self, text: str, rag_retriever=None) -> List[Dict[str, any]]:
        """
        Extract claims using LLM for better recall
        Optionally enhanced with RAG for context-aware extraction
        """
        if not self.llm_service:
            return []
        
        # Use provided rag_retriever or fall back to instance's rag_retriever
        active_rag_retriever = rag_retriever or self.rag_retriever
        
        # Build context from RAG if available
        context = ""
        if active_rag_retriever:
            try:
                # Search knowledge base for relevant context
                rag_results = active_rag_retriever.search(text, top_k=3)
                if rag_results:
                    context = "\n\nRelevant Knowledge Base Context:\n"
                    for idx, result in enumerate(rag_results, 1):
                        context += f"{idx}. {result['text'][:200]}...\n"
                        if result.get('metadata', {}).get('title'):
                            context += f"   Source: {result['metadata']['title']}\n"
            except Exception as e:
                print(f"RAG retrieval error: {e}")
        
        prompt = f"""Extract all factual claims from the following text. Return a JSON array of claims.

{context}

Text to Analyze:
{text}

Return format:
[
  {{"id": 1, "claim": "claim text here"}},
  {{"id": 2, "claim": "another claim"}}
]

Only extract factual, verifiable claims. Ignore questions, opinions, and statements without factual content.
Use the knowledge base context above to better understand domain-specific terms and concepts.
JSON:"""
        
        try:
            response = self.llm_service.generate(
                prompt=prompt,
                temperature=0.3,
                max_tokens=1000,
                strict_json=True
            )
            
            # Parse JSON response
            import json
            # Try to extract JSON from response if it's wrapped in text
            response_clean = response.strip()
            if "{" in response_clean and "}" in response_clean:
                start = response_clean.find("[")
                end = response_clean.rfind("]") + 1
                if start >= 0 and end > start:
                    response_clean = response_clean[start:end]
            
            claims_data = json.loads(response_clean)
            
            # Ensure it's a list
            if not isinstance(claims_data, list):
                claims_data = [claims_data] if isinstance(claims_data, dict) else []
            
            # Higher confidence if RAG context was used
            base_confidence = 0.85 if active_rag_retriever and context else 0.8
            
            return [
                {
                    "id": idx + 1,
                    "claim": claim.get("claim", ""),
                    "confidence": base_confidence,
                    "method": "llm_rag" if (active_rag_retriever and context) else "llm"
                }
                for idx, claim in enumerate(claims_data)
                if claim.get("claim", "").strip()
            ]
        except Exception as e:
            print(f"LLM extraction failed: {e}")
            return []  # Return empty list instead of falling back
    
    def _extract_simple(self, text: str) -> List[Dict[str, any]]:
        """Simple regex-based extraction fallback"""
        claims = []
        # Split by sentence endings
        sentences = re.split(r'[.!?]+', text)
        
        for idx, sentence in enumerate(sentences):
            sentence = sentence.strip()
            if len(sentence) > 20 and any(keyword in sentence.lower() for keyword in ['is', 'are', 'was', 'were', 'will', 'can', 'has', 'have']):
                claims.append({
                    "id": idx + 1,
                    "claim": sentence,
                    "confidence": 0.6
                })
        
        return claims
    
    def extract(self, text: str) -> List[Dict[str, any]]:
        """
        Main extraction method - uses ALL three methods and combines results
        
        Args:
            text: Input text to extract claims from
            
        Returns:
            List of claim dictionaries with id, claim text, and confidence
            Combines results from spaCy, LLM, and fallback methods
        """
        if not text or len(text.strip()) < 10:
            return []
        
        all_claims = []
        claim_texts = set()  # For deduplication
        
        # Method 1: spaCy extraction
        try:
            spacy_claims = self.extract_with_spacy(text)
            for claim in spacy_claims:
                claim_text = claim["claim"].strip().lower()
                if claim_text not in claim_texts:
                    claim_texts.add(claim_text)
                    all_claims.append({
                        "id": len(all_claims) + 1,
                        "claim": claim["claim"],
                        "confidence": claim.get("confidence", 0.7),
                        "method": "spacy"
                    })
        except Exception as e:
            print(f"spaCy extraction error: {e}")
        
        # Method 2: LLM extraction (if available)
        if self.use_llm and self.llm_service:
            try:
                llm_claims = self.extract_with_llm(text, rag_retriever=self.rag_retriever)
                # Only process if we got valid claims (not empty list from fallback)
                if llm_claims:
                    for claim in llm_claims:
                        claim_text = claim["claim"].strip().lower()
                        # Check for similarity (not just exact match)
                        is_duplicate = False
                        for existing_text in claim_texts:
                            # Check if very similar (one contains the other or vice versa)
                            if claim_text in existing_text or existing_text in claim_text:
                                if len(claim_text) > 20 and len(existing_text) > 20:
                                    is_duplicate = True
                                    break
                        
                        if not is_duplicate and claim_text not in claim_texts:
                            claim_texts.add(claim_text)
                            all_claims.append({
                                "id": len(all_claims) + 1,
                                "claim": claim["claim"],
                                "confidence": claim.get("confidence", 0.8),
                                "method": claim.get("method", "llm")
                            })
            except Exception as e:
                # Silently handle LLM errors - fallback methods will still work
                # Only log if it's not a connection error (expected when LLM server not running)
                if "10061" not in str(e) and "actively refused" not in str(e).lower():
                    print(f"LLM extraction error: {e}")
        
        # Method 3: Simple fallback extraction
        try:
            simple_claims = self._extract_simple(text)
            for claim in simple_claims:
                claim_text = claim["claim"].strip().lower()
                # Check for similarity (not just exact match)
                is_duplicate = False
                for existing_text in claim_texts:
                    # Check if very similar (one contains the other or vice versa)
                    if claim_text in existing_text or existing_text in claim_text:
                        if len(claim_text) > 20 and len(existing_text) > 20:
                            is_duplicate = True
                            break
                
                if not is_duplicate and claim_text not in claim_texts:
                    claim_texts.add(claim_text)
                    all_claims.append({
                        "id": len(all_claims) + 1,
                        "claim": claim["claim"],
                        "confidence": claim.get("confidence", 0.6),
                        "method": "fallback"
                    })
        except Exception as e:
            print(f"Fallback extraction error: {e}")
        
        # Sort by confidence (highest first) and renumber IDs
        all_claims.sort(key=lambda x: x["confidence"], reverse=True)
        for idx, claim in enumerate(all_claims, 1):
            claim["id"] = idx
        
        return all_claims

