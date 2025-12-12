"""
Routers Package

Export all API routers for the AI service.
"""

from routers import (
    description_router,
    moderation_router,
    recommendations_router,
    analytics_router,
    chatbot_router,
    health_router
)

__all__ = [
    "description_router",
    "moderation_router", 
    "recommendations_router",
    "analytics_router",
    "chatbot_router",
    "health_router"
]
