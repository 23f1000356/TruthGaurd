"""
Configuration settings for TruthGuard Backend
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API Settings
    API_TITLE: str = "TruthGuard API"
    API_VERSION: str = "1.0.0"
    API_KEY: Optional[str] = os.getenv("API_KEY", "dev-key-change-in-production")
    
    # CORS Settings
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    # LLM Settings
    LLM_ENDPOINT: str = os.getenv("LLM_ENDPOINT", "http://localhost:8080/v1/completions")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "llama-3")
    LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2048"))
    LLM_STRICT_JSON: bool = os.getenv("LLM_STRICT_JSON", "true").lower() == "true"
    
    # Search Settings
    SEARCH_TOP_K: int = int(os.getenv("SEARCH_TOP_K", "5"))
    SEARCH_REGION: str = os.getenv("SEARCH_REGION", "us-en")
    
    # RAG Settings
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./database/chroma")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))
    
    # AutoGen Settings
    AUTOGEN_ENABLED: bool = os.getenv("AUTOGEN_ENABLED", "false").lower() == "true"
    AUTOGEN_ENDPOINT: Optional[str] = os.getenv("AUTOGEN_ENDPOINT", None)
    AUTOGEN_AGENT_COUNT: int = int(os.getenv("AUTOGEN_AGENT_COUNT", "3"))
    
    # Database Settings
    HISTORY_STORE_PATH: str = os.getenv("HISTORY_STORE_PATH", "./database/history_store.json")
    PROJECTS_STORE_PATH: str = os.getenv("PROJECTS_STORE_PATH", "./database/projects_store.json")
    AUDIT_LOG_PATH: str = os.getenv("AUDIT_LOG_PATH", "./database/audit_log.json")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    
    # Security
    ALLOWED_FILE_TYPES: list = [".pdf", ".txt", ".md"]
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

