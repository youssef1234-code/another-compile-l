"""
AI Service - Main Entry Point

FastAPI server providing AI-powered features for the GUC Event Manager:
1. AI Event Description Writer
2. AI Comment Moderator
3. Smart Event Recommender
4. AI Analytics Insights Generator
5. Event Q&A Chatbot
6. Background moderation polling

Uses LangChain + LangGraph with OpenAI as the AI provider.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

# Import routers
from routers import (
    description_router,
    moderation_router,
    recommendations_router,
    analytics_router,
    chatbot_router,
    health_router,
    assistant_router
)

# Import polling service
from services.polling_service import polling_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    print("🚀 AI Service starting up...")
    print(f"📡 Backend URL: {os.getenv('BACKEND_URL', 'http://localhost:5000')}")
    print(f"🤖 OpenAI Model: {os.getenv('OPENAI_MODEL', 'gpt-4o-mini')}")
    
    # Start background polling for unmoderated comments
    await polling_service.start()
    
    yield
    
    # Stop polling on shutdown
    await polling_service.stop()
    print("👋 AI Service shutting down...")

# Create FastAPI app
app = FastAPI(
    title="GUC Event Manager AI Service",
    description="AI-powered features for event management including description generation, comment moderation, recommendations, analytics insights, and Q&A chatbot.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Frontend dev
        "http://localhost:5000",  # Backend
        os.getenv("CLIENT_URL", "http://localhost:5173")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router.router, tags=["Health"])
app.include_router(description_router.router, prefix="/api/ai", tags=["Description Writer"])
app.include_router(moderation_router.router, prefix="/api/ai", tags=["Comment Moderation"])
app.include_router(recommendations_router.router, prefix="/api/ai", tags=["Recommendations"])
app.include_router(analytics_router.router, prefix="/api/ai", tags=["Analytics Insights"])
app.include_router(chatbot_router.router, prefix="/api/ai", tags=["Event Q&A Chatbot"])
app.include_router(assistant_router.router, prefix="/api/ai", tags=["General Assistant"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("AI_SERVICE_HOST", "0.0.0.0"),
        port=int(os.getenv("AI_SERVICE_PORT", 8000)),
        reload=True
    )
