"""
Logging utilities
"""
import logging
import sys
from datetime import datetime
from typing import Optional
import json
from pathlib import Path


def setup_logger(
    name: str = "truthguard",
    level: int = logging.INFO,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Setup logger with console and file handlers
    
    Args:
        name: Logger name
        level: Logging level
        log_file: Optional log file path
        
    Returns:
        Configured logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(level)
        file_format = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)
    
    return logger


def log_api_request(logger: logging.Logger, endpoint: str, method: str, **kwargs):
    """
    Log API request
    
    Args:
        logger: Logger instance
        endpoint: API endpoint
        method: HTTP method
        **kwargs: Additional request data
    """
    logger.info(f"API Request: {method} {endpoint} | {json.dumps(kwargs, default=str)}")


def log_api_response(logger: logging.Logger, endpoint: str, status_code: int, **kwargs):
    """
    Log API response
    
    Args:
        logger: Logger instance
        endpoint: API endpoint
        status_code: HTTP status code
        **kwargs: Additional response data
    """
    logger.info(f"API Response: {endpoint} | Status: {status_code} | {json.dumps(kwargs, default=str)}")


def log_error(logger: logging.Logger, error: Exception, context: Optional[str] = None):
    """
    Log error with context
    
    Args:
        logger: Logger instance
        error: Exception object
        context: Optional context string
    """
    error_msg = f"Error: {type(error).__name__}: {str(error)}"
    if context:
        error_msg = f"{context} | {error_msg}"
    logger.error(error_msg, exc_info=True)


# Default logger instance
default_logger = setup_logger()

