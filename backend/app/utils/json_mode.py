"""
JSON mode utilities for LLM responses
"""
import json
import re
from typing import Any, Dict, Optional


def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """
    Extract JSON from text that may contain other content
    
    Args:
        text: Text that may contain JSON
        
    Returns:
        Parsed JSON dictionary or None
    """
    # Try direct JSON parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON object in text
    json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
    matches = re.findall(json_pattern, text, re.DOTALL)
    
    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue
    
    # Try to find JSON array
    array_pattern = r'\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]'
    matches = re.findall(array_pattern, text, re.DOTALL)
    
    for match in matches:
        try:
            return json.loads(match)
        except json.JSONDecodeError:
            continue
    
    return None


def format_json_prompt(base_prompt: str, schema: Optional[Dict[str, Any]] = None) -> str:
    """
    Format prompt to encourage JSON output
    
    Args:
        base_prompt: Base prompt text
        schema: Optional JSON schema to include
        
    Returns:
        Formatted prompt
    """
    prompt = base_prompt
    
    if schema:
        prompt += f"\n\nJSON Schema:\n{json.dumps(schema, indent=2)}"
    
    prompt += "\n\nImportant: Respond with valid JSON only. Do not include any explanatory text before or after the JSON."
    
    return prompt


def validate_json_structure(data: Dict[str, Any], required_fields: List[str]) -> tuple[bool, Optional[str]]:
    """
    Validate JSON structure has required fields
    
    Args:
        data: JSON data to validate
        required_fields: List of required field names
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None


def sanitize_json_string(text: str) -> str:
    """
    Sanitize text to be JSON-safe
    
    Args:
        text: Text to sanitize
        
    Returns:
        Sanitized text
    """
    # Escape special characters
    text = text.replace('\\', '\\\\')
    text = text.replace('"', '\\"')
    text = text.replace('\n', '\\n')
    text = text.replace('\r', '\\r')
    text = text.replace('\t', '\\t')
    
    return text

