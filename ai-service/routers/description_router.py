"""
AI Description Writer Router

Feature 1: AI-powered event description generation
Helps Professors and Event Office create compelling, well-formatted event descriptions.

Supports:
- Generating descriptions from basic event info
- Improving existing descriptions
- Generating markdown-formatted content
- Multiple tones (professional, casual, academic)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.description_service import DescriptionService

router = APIRouter()
description_service = DescriptionService()

class GenerateDescriptionRequest(BaseModel):
    """Request model for generating event descriptions"""
    event_name: str = Field(..., description="Name of the event")
    event_type: Literal["WORKSHOP", "TRIP", "BAZAAR", "CONFERENCE", "GYM_SESSION"] = Field(..., description="Type of event")
    location: str = Field(..., description="Event location")
    start_date: str = Field(..., description="Event start date/time")
    end_date: Optional[str] = Field(None, description="Event end date/time")
    basic_info: Optional[str] = Field(None, description="Basic information about the event")
    target_audience: Optional[str] = Field(None, description="Target audience (e.g., 'MET students', 'All faculties')")
    key_topics: Optional[list[str]] = Field(None, description="Key topics or highlights")
    professors: Optional[list[str]] = Field(None, description="Participating professors (for workshops)")
    tone: Literal["professional", "casual", "academic", "exciting"] = Field("professional", description="Writing tone")
    include_markdown: bool = Field(True, description="Include markdown formatting")

class ImproveDescriptionRequest(BaseModel):
    """Request model for improving existing descriptions"""
    current_description: str = Field(..., description="Current event description to improve")
    event_type: Literal["WORKSHOP", "TRIP", "BAZAAR", "CONFERENCE", "GYM_SESSION"] = Field(..., description="Type of event")
    improvement_focus: Optional[Literal["clarity", "engagement", "completeness", "formatting"]] = Field("engagement", description="What to focus on")
    tone: Literal["professional", "casual", "academic", "exciting"] = Field("professional", description="Target tone")
    include_markdown: bool = Field(True, description="Format with markdown")

class GenerateAgendaRequest(BaseModel):
    """Request model for generating workshop agendas"""
    workshop_name: str = Field(..., description="Name of the workshop")
    duration_hours: float = Field(..., description="Total duration in hours")
    topics: list[str] = Field(..., description="Topics to cover")
    skill_level: Literal["beginner", "intermediate", "advanced"] = Field("intermediate", description="Target skill level")

class DescriptionResponse(BaseModel):
    """Response model for generated descriptions"""
    description: str = Field(..., description="Generated/improved description")
    markdown: bool = Field(..., description="Whether markdown formatting is included")
    suggestions: Optional[list[str]] = Field(None, description="Additional suggestions")
    word_count: int = Field(..., description="Word count of the description")

class AgendaResponse(BaseModel):
    """Response model for generated agendas"""
    agenda: str = Field(..., description="Generated agenda in markdown format")
    estimated_times: dict = Field(..., description="Estimated time for each section")

@router.post("/description/generate", response_model=DescriptionResponse)
async def generate_description(request: GenerateDescriptionRequest):
    """
    Generate a compelling event description from basic information.
    
    This endpoint uses AI to create professional, engaging event descriptions
    with optional markdown formatting. Great for professors creating workshops
    or event office staff setting up new events.
    """
    try:
        result = await description_service.generate_description(
            event_name=request.event_name,
            event_type=request.event_type,
            location=request.location,
            start_date=request.start_date,
            end_date=request.end_date,
            basic_info=request.basic_info,
            target_audience=request.target_audience,
            key_topics=request.key_topics,
            professors=request.professors,
            tone=request.tone,
            include_markdown=request.include_markdown
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/description/improve", response_model=DescriptionResponse)
async def improve_description(request: ImproveDescriptionRequest):
    """
    Improve an existing event description.
    
    Enhances clarity, engagement, completeness, or formatting
    based on the specified focus area.
    """
    try:
        result = await description_service.improve_description(
            current_description=request.current_description,
            event_type=request.event_type,
            improvement_focus=request.improvement_focus,
            tone=request.tone,
            include_markdown=request.include_markdown
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/description/agenda", response_model=AgendaResponse)
async def generate_agenda(request: GenerateAgendaRequest):
    """
    Generate a detailed workshop agenda.
    
    Creates a structured agenda with time allocations
    based on workshop duration and topics.
    """
    try:
        result = await description_service.generate_agenda(
            workshop_name=request.workshop_name,
            duration_hours=request.duration_hours,
            topics=request.topics,
            skill_level=request.skill_level
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/description/suggestions")
async def get_description_suggestions(event_type: str, current_description: Optional[str] = None):
    """
    Get suggestions for improving event descriptions.
    
    Returns actionable tips based on the event type and current content.
    """
    try:
        suggestions = await description_service.get_suggestions(
            event_type=event_type,
            current_description=current_description
        )
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
