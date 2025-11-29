"""
Category Detection Service
Automatically detects category from claim text
"""
import re
from typing import Optional, List

# Predefined categories
CATEGORIES = [
    "politics",
    "games",
    "bollywood",
    "news",
    "farmers",
    "animals",
    "sports",
    "technology",
    "health",
    "education",
    "business",
    "entertainment",
    "science",
    "environment",
    "general"
]

# Category keywords mapping
CATEGORY_KEYWORDS = {
    "politics": [
        "election", "vote", "government", "minister", "parliament", "political", "party", 
        "democracy", "president", "prime minister", "congress", "bjp", "aap", "modi", 
        "rahul", "kejriwal", "politician", "policy", "law", "bill", "assembly"
    ],
    "games": [
        "game", "gaming", "player", "tournament", "cricket", "football", "soccer", 
        "basketball", "tennis", "olympics", "match", "score", "team", "championship",
        "esports", "video game", "console", "mobile game"
    ],
    "bollywood": [
        "bollywood", "actor", "actress", "movie", "film", "director", "producer",
        "song", "music", "album", "celebrity", "star", "release", "box office",
        "award", "oscar", "filmfare", "khan", "kapoor", "bhatt"
    ],
    "news": [
        "news", "report", "breaking", "headline", "journalist", "media", "press",
        "announcement", "update", "latest", "recent", "happened", "incident"
    ],
    "farmers": [
        "farmer", "agriculture", "crop", "harvest", "farming", "field", "land",
        "irrigation", "subsidy", "mandi", "kisan", "agricultural", "rural",
        "village", "crop price", "msp", "farmer protest"
    ],
    "animals": [
        "animal", "dog", "cat", "bird", "wildlife", "tiger", "elephant", "lion",
        "pet", "veterinary", "zoo", "conservation", "endangered", "species",
        "cattle", "livestock", "cow", "buffalo"
    ],
    "sports": [
        "sport", "athlete", "coach", "stadium", "league", "cup", "medal", "gold",
        "silver", "bronze", "champion", "world cup", "olympic", "cricket", "football"
    ],
    "technology": [
        "tech", "technology", "computer", "software", "app", "mobile", "phone",
        "internet", "ai", "artificial intelligence", "robot", "digital", "cyber",
        "startup", "innovation", "gadget", "device"
    ],
    "health": [
        "health", "medical", "doctor", "hospital", "disease", "medicine", "treatment",
        "patient", "covid", "vaccine", "healthcare", "surgery", "clinic", "diagnosis"
    ],
    "education": [
        "education", "school", "college", "university", "student", "teacher",
        "exam", "degree", "course", "learning", "academic", "study", "research"
    ],
    "business": [
        "business", "company", "corporate", "market", "stock", "economy", "trade",
        "industry", "revenue", "profit", "investment", "bank", "finance", "startup"
    ],
    "entertainment": [
        "entertainment", "tv", "television", "show", "series", "comedy", "drama",
        "reality show", "youtube", "streaming", "netflix", "amazon prime"
    ],
    "science": [
        "science", "scientist", "research", "study", "experiment", "discovery",
        "laboratory", "theory", "hypothesis", "data", "analysis", "publication"
    ],
    "environment": [
        "environment", "climate", "pollution", "green", "renewable", "energy",
        "carbon", "emission", "global warming", "sustainability", "eco-friendly"
    ]
}


def detect_category(claim_text: str) -> str:
    """
    Detect category from claim text using keyword matching
    
    Args:
        claim_text: The claim text to analyze
        
    Returns:
        Detected category name (defaults to "general" if no match)
    """
    if not claim_text:
        return "general"
    
    claim_lower = claim_text.lower()
    
    # Count keyword matches for each category
    category_scores = {}
    
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            # Count occurrences of keyword in claim
            score += len(re.findall(r'\b' + re.escape(keyword) + r'\b', claim_lower))
        
        if score > 0:
            category_scores[category] = score
    
    # Return category with highest score, or "general" if no matches
    if category_scores:
        return max(category_scores, key=category_scores.get)
    
    return "general"


def detect_category_llm(claim_text: str, llm_service=None) -> str:
    """
    Detect category using LLM (more accurate but slower)
    
    Args:
        claim_text: The claim text to analyze
        llm_service: Optional LLM service for better detection
        
    Returns:
        Detected category name
    """
    if not llm_service:
        return detect_category(claim_text)  # Fallback to keyword matching
    
    try:
        prompt = f"""Analyze the following claim and categorize it into one of these categories:
{', '.join(CATEGORIES)}

Claim: {claim_text}

Respond with only the category name (lowercase, one word). Examples: politics, games, bollywood, news, farmers, animals, sports, technology, health, education, business, entertainment, science, environment, or general.

Category:"""
        
        response = llm_service.generate(prompt, temperature=0.3, max_tokens=10)
        category = response.strip().lower()
        
        # Validate category
        if category in CATEGORIES:
            return category
        
        return detect_category(claim_text)  # Fallback if LLM returns invalid category
        
    except Exception as e:
        print(f"LLM category detection failed: {e}")
        return detect_category(claim_text)  # Fallback to keyword matching

