"""
Health Check Router

Simple health check endpoint for monitoring.
"""

from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "service": "GUC Event Manager AI Service",
        "version": "1.0.0",
        "features": [
            "AI Event Description Writer",
            "AI Comment Moderator",
            "Smart Event Recommender",
            "AI Analytics Insights",
            "Event Q&A Chatbot"
        ]
    }
