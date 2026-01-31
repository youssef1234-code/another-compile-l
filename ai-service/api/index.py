"""
Vercel Serverless Function Entry Point for AI Service

This file adapts the FastAPI app for Vercel's serverless environment.
"""

import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

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

# Create FastAPI app for serverless
app = FastAPI(
    title="GUC Event Manager AI Service",
    description="AI-powered features for event management",
    version="1.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5000",
        os.getenv("CLIENT_URL", "*"),
        os.getenv("BACKEND_URL", "*"),
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

@app.get("/")
async def root():
    return {"message": "AI Service is running", "status": "ok"}

# Handler for Vercel (uses Mangum to adapt ASGI to AWS Lambda-style handler)
handler = Mangum(app, lifespan="off")
