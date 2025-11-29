"""
Test script for Ollama LLM integration
Tests connection, model availability, and basic generation
"""
import os
import sys
import json
import httpx
from typing import Dict, Any

# Fix Windows console encoding
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(__file__))
from config import settings


def test_ollama_connection() -> bool:
    """Test if Ollama is running and accessible"""
    print("=" * 60)
    print("Test 1: Checking Ollama Connection")
    print("=" * 60)
    
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get("http://localhost:11434/api/tags")
            response.raise_for_status()
            print("[OK] Ollama is running and accessible")
            return True
    except httpx.ConnectError:
        print("[FAIL] Cannot connect to Ollama")
        print("   Make sure Ollama is running: https://ollama.ai/download")
        return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


def test_model_availability() -> bool:
    """Test if the configured model is available"""
    print("\n" + "=" * 60)
    print("Test 2: Checking Model Availability")
    print("=" * 60)
    
    try:
        with httpx.Client(timeout=5.0) as client:
            response = client.get("http://localhost:11434/api/tags")
            response.raise_for_status()
            data = response.json()
            
            models = [model.get("name", "") for model in data.get("models", [])]
            print(f"Available models: {', '.join(models) if models else 'None'}")
            
            # Check if configured model is available
            configured_model = settings.LLM_MODEL
            model_found = any(configured_model in model for model in models)
            
            if model_found:
                print(f"[OK] Model '{configured_model}' is available")
                return True
            else:
                print(f"[FAIL] Model '{configured_model}' not found")
                print(f"   Available models: {', '.join(models)}")
                print(f"   To download: ollama pull {configured_model}")
                return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


def test_ollama_generate() -> bool:
    """Test basic text generation with Ollama"""
    print("\n" + "=" * 60)
    print("Test 3: Testing Text Generation")
    print("=" * 60)
    
    endpoint = settings.LLM_ENDPOINT
    model = settings.LLM_MODEL
    
    print(f"Endpoint: {endpoint}")
    print(f"Model: {model}")
    
    # Simple test prompt
    test_prompt = "Say 'Hello, Ollama is working!' in one sentence."
    
    payload = {
        "model": model,
        "prompt": test_prompt,
        "temperature": 0.7,
        "num_predict": 50,
        "stream": False
    }
    
    try:
        print(f"\nSending test prompt: '{test_prompt}'")
        print("Waiting for response...")
        
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract response
            generated_text = data.get("response", "") or data.get("content", "")
            
            if generated_text:
                print(f"[OK] Generation successful!")
                print(f"Response: {generated_text.strip()}")
                return True
            else:
                print("[FAIL] No response generated")
                print(f"Response data: {json.dumps(data, indent=2)}")
                return False
    except httpx.ConnectError:
        print("[FAIL] Cannot connect to Ollama endpoint")
        print(f"   Check if endpoint is correct: {endpoint}")
        return False
    except httpx.TimeoutException:
        print("[FAIL] Request timed out (model might be slow)")
        return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        print(f"   Response: {response.text if 'response' in locals() else 'N/A'}")
        return False


def test_claim_verification_format() -> bool:
    """Test JSON-formatted claim verification"""
    print("\n" + "=" * 60)
    print("Test 4: Testing Claim Verification Format")
    print("=" * 60)
    
    endpoint = settings.LLM_ENDPOINT
    model = settings.LLM_MODEL
    
    # Test claim verification prompt (similar to what backend uses)
    prompt = """Analyze the following claim and return a JSON response with verdict, confidence, explanation, and citations.

Claim: "The Earth is round."

Evidence:
1. Title: Scientific Evidence, URL: https://example.com, Snippet: Multiple space missions have confirmed the Earth's spherical shape.

Return JSON format:
{
  "verdict": "true" or "false" or "misleading" or "unverified",
  "confidence": 0.0 to 1.0,
  "explanation": "detailed explanation",
  "citations": ["url1", "url2"]
}

JSON:"""
    
    payload = {
        "model": model,
        "prompt": prompt,
        "temperature": 0.3,
        "num_predict": 500,
        "stream": False
    }
    
    try:
        print("Sending claim verification test...")
        
        with httpx.Client(timeout=60.0) as client:
            response = client.post(
                endpoint,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()
            
            generated_text = data.get("response", "") or data.get("content", "")
            
            if generated_text:
                print("[OK] Response received")
                print(f"Raw response: {generated_text[:200]}...")
                
                # Try to parse JSON
                try:
                    # Extract JSON from response
                    response_clean = generated_text.strip()
                    if "{" in response_clean and "}" in response_clean:
                        start = response_clean.find("{")
                        end = response_clean.rfind("}") + 1
                        json_str = response_clean[start:end]
                        result = json.loads(json_str)
                        
                        print("[OK] JSON parsing successful!")
                        print(f"Verdict: {result.get('verdict', 'N/A')}")
                        print(f"Confidence: {result.get('confidence', 'N/A')}")
                        print(f"Explanation: {result.get('explanation', 'N/A')[:100]}...")
                        return True
                    else:
                        print("[WARN] Response doesn't contain JSON")
                        return False
                except json.JSONDecodeError as e:
                    print(f"[WARN] JSON parsing failed: {e}")
                    print("   Response might need better formatting")
                    return False
            else:
                print("[FAIL] No response generated")
                return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Ollama Integration Test Suite")
    print("=" * 60)
    print(f"\nConfiguration:")
    print(f"  LLM Endpoint: {settings.LLM_ENDPOINT}")
    print(f"  LLM Model: {settings.LLM_MODEL}")
    print(f"  Temperature: {settings.LLM_TEMPERATURE}")
    print(f"  Max Tokens: {settings.LLM_MAX_TOKENS}")
    
    results = []
    
    # Run tests
    results.append(("Connection", test_ollama_connection()))
    results.append(("Model Availability", test_model_availability()))
    results.append(("Text Generation", test_ollama_generate()))
    results.append(("Claim Verification", test_claim_verification_format()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n[SUCCESS] All tests passed! Ollama is ready to use.")
        return 0
    else:
        print("\n[WARN] Some tests failed. Check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

