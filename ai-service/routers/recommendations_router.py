"""
Smart Event Recommendations Router

Feature 3: AI-powered personalized event recommendations
Suggests events to students based on:
- Registration history
- Faculty/major
- Favorite events
- Event ratings/popularity
- Similar user preferences

Helps students discover relevant events they might be interested in.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.recommendations_service import RecommendationsService

router = APIRouter()
recommendations_service = RecommendationsService()

class UserProfile(BaseModel):
    """User profile for recommendations"""
    user_id: str = Field(..., description="User ID")
    role: Literal["STUDENT", "STAFF", "TA", "PROFESSOR"] = Field(..., description="User role")
    faculty: Optional[str] = Field(None, description="User's faculty (MET, IET, etc.)")
    interests: Optional[list[str]] = Field(None, description="User interests/tags")

class RegistrationHistory(BaseModel):
    """User's registration history"""
    event_ids: list[str] = Field(default=[], description="IDs of events user registered for")
    event_types: list[str] = Field(default=[], description="Types of events attended")
    rated_events: Optional[dict] = Field(None, description="Event ID -> rating mapping")

class RecommendationRequest(BaseModel):
    """Request for event recommendations"""
    user_profile: UserProfile
    registration_history: Optional[RegistrationHistory] = None
    favorite_event_ids: Optional[list[str]] = Field(None, description="User's favorite events")
    available_events: list[dict] = Field(..., description="List of available events to recommend from")
    limit: int = Field(5, description="Max number of recommendations")
    exclude_registered: bool = Field(True, description="Exclude events user is already registered for")

class RecommendationResponse(BaseModel):
    """Response with recommended events"""
    recommendations: list[dict] = Field(..., description="Recommended events with scores")
    reasoning: Optional[str] = Field(None, description="AI reasoning for recommendations")
    personalization_factors: list[str] = Field(default=[], description="Factors considered")

class SimilarEventsRequest(BaseModel):
    """Request for similar events"""
    event_id: str = Field(..., description="Reference event ID")
    event_data: dict = Field(..., description="Reference event data")
    available_events: list[dict] = Field(..., description="Events to search for similarities")
    limit: int = Field(5, description="Max similar events to return")

class TrendingEventsRequest(BaseModel):
    """Request for trending events analysis"""
    events: list[dict] = Field(..., description="Events with registration counts")
    time_period: Literal["day", "week", "month"] = Field("week", description="Time period for trending analysis")
    limit: int = Field(10, description="Max trending events to return")

@router.post("/recommendations/personalized", response_model=RecommendationResponse)
async def get_personalized_recommendations(request: RecommendationRequest):
    """
    Get personalized event recommendations for a user.
    
    Uses AI to analyze user profile, history, and preferences
    to suggest the most relevant upcoming events.
    
    Perfect for:
    - Homepage "Recommended for You" section
    - Email newsletters with personalized suggestions
    - Discovery features
    """
    try:
        result = await recommendations_service.get_personalized_recommendations(
            user_profile=request.user_profile.model_dump(),
            registration_history=request.registration_history.model_dump() if request.registration_history else None,
            favorite_event_ids=request.favorite_event_ids,
            available_events=request.available_events,
            limit=request.limit,
            exclude_registered=request.exclude_registered
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/similar")
async def get_similar_events(request: SimilarEventsRequest):
    """
    Find events similar to a given event.
    
    Uses content-based similarity analysis considering:
    - Event type, faculty, topics
    - Description similarity
    - Target audience overlap
    
    Great for "You might also like" sections on event pages.
    """
    try:
        result = await recommendations_service.get_similar_events(
            event_id=request.event_id,
            event_data=request.event_data,
            available_events=request.available_events,
            limit=request.limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/trending")
async def get_trending_events(request: TrendingEventsRequest):
    """
    Analyze trending events based on registrations and engagement.
    
    Returns events gaining popularity with momentum scores.
    """
    try:
        result = await recommendations_service.analyze_trending(
            events=request.events,
            time_period=request.time_period,
            limit=request.limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/recommendations/explain")
async def explain_recommendation(
    event_id: str,
    event_data: dict,
    user_profile: dict
):
    """
    Explain why an event is recommended to a user.
    
    Provides human-readable reasoning for transparency.
    """
    try:
        explanation = await recommendations_service.explain_recommendation(
            event_id=event_id,
            event_data=event_data,
            user_profile=user_profile
        )
        return {"event_id": event_id, "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommendations/popular-by-faculty")
async def get_popular_by_faculty(faculty: str, limit: int = 5):
    """
    Get popular events for a specific faculty.
    
    Useful for faculty-specific dashboards.
    """
    try:
        result = await recommendations_service.get_popular_by_faculty(
            faculty=faculty,
            limit=limit
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
