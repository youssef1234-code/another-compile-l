"""
OpenAI Key Validation Utility

Provides helper functions to check if OpenAI API key is configured
and handle graceful degradation when it's not available.
"""

import os
from fastapi import HTTPException

def check_openai_key() -> bool:
    """Check if OpenAI API key is configured"""
    return bool(os.getenv("OPENAI_API_KEY"))

def require_openai_key():
    """Raise HTTPException if OpenAI key is not configured"""
    if not check_openai_key():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI Service Unavailable",
                "message": "OpenAI API key is not configured. This feature requires an OpenAI API key to function.",
                "code": "OPENAI_KEY_NOT_CONFIGURED",
                "suggestion": "Please set the OPENAI_API_KEY environment variable to enable AI features."
            }
        )

def get_openai_key_or_none() -> str | None:
    """Get OpenAI key or return None if not configured"""
    return os.getenv("OPENAI_API_KEY")
