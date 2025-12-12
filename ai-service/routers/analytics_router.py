"""
AI Analytics Insights Router

Feature 4: AI-powered analytics and insights generation
Generates natural language insights from event data for Admin/Event Office:
- Event performance summaries
- Registration trend analysis
- Feedback sentiment analysis
- Actionable recommendations

Uses LangGraph for structured analysis workflows.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.analytics_service import AnalyticsService

router = APIRouter()
analytics_service = AnalyticsService()

class EventAnalyticsRequest(BaseModel):
    """Request for event analytics insights"""
    event_id: str = Field(..., description="Event ID")
    event_data: dict = Field(..., description="Event details")
    registrations: list[dict] = Field(default=[], description="Registration data")
    feedback: list[dict] = Field(default=[], description="Feedback/ratings data")
    include_recommendations: bool = Field(True, description="Include actionable recommendations")

class EventInsightsResponse(BaseModel):
    """Response with event insights"""
    summary: str = Field(..., description="Executive summary")
    key_metrics: dict = Field(..., description="Key performance metrics")
    trends: list[str] = Field(default=[], description="Identified trends")
    sentiment_analysis: Optional[dict] = Field(None, description="Feedback sentiment breakdown")
    recommendations: list[str] = Field(default=[], description="Actionable recommendations")
    highlights: list[str] = Field(default=[], description="Notable highlights")
    concerns: list[str] = Field(default=[], description="Areas of concern")

class DashboardInsightsRequest(BaseModel):
    """Request for dashboard-level insights"""
    events: list[dict] = Field(..., description="List of events with data")
    time_period: Literal["day", "week", "month", "quarter", "year"] = Field("month", description="Analysis period")
    focus_areas: Optional[list[str]] = Field(None, description="Specific areas to focus on")

class DashboardInsightsResponse(BaseModel):
    """Response with dashboard insights"""
    overview: str = Field(..., description="Overall platform overview")
    performance_summary: dict = Field(..., description="Performance metrics summary")
    top_performers: list[dict] = Field(default=[], description="Best performing events")
    areas_for_improvement: list[str] = Field(default=[], description="Areas needing attention")
    predictions: Optional[dict] = Field(None, description="Predictions and forecasts")
    action_items: list[str] = Field(default=[], description="Suggested actions")

class FeedbackAnalysisRequest(BaseModel):
    """Request for feedback analysis"""
    event_id: str = Field(..., description="Event ID")
    feedback: list[dict] = Field(..., description="Feedback entries with comments and ratings")
    analysis_depth: Literal["quick", "standard", "deep"] = Field("standard", description="Analysis depth")

class FeedbackAnalysisResponse(BaseModel):
    """Response with feedback analysis"""
    overall_sentiment: Literal["very_positive", "positive", "neutral", "negative", "very_negative"]
    sentiment_score: float = Field(..., description="Sentiment score (-1 to 1)")
    rating_analysis: dict = Field(..., description="Rating breakdown and trends")
    common_themes: list[dict] = Field(default=[], description="Common themes in feedback")
    notable_comments: list[dict] = Field(default=[], description="Notable positive/negative comments")
    improvement_suggestions: list[str] = Field(default=[], description="AI-generated improvement suggestions")
    summary: str = Field(..., description="Natural language summary")

class ComparativeAnalysisRequest(BaseModel):
    """Request for comparing events"""
    events: list[dict] = Field(..., min_length=2, description="Events to compare")
    comparison_aspects: Optional[list[str]] = Field(None, description="Aspects to compare")

@router.post("/analytics/event-insights", response_model=EventInsightsResponse)
async def get_event_insights(request: EventAnalyticsRequest):
    """
    Generate AI-powered insights for a specific event.
    
    Analyzes registrations, feedback, and event data to provide:
    - Executive summary
    - Key performance metrics
    - Sentiment analysis
    - Actionable recommendations
    
    Perfect for post-event reports and performance reviews.
    """
    try:
        result = await analytics_service.generate_event_insights(
            event_id=request.event_id,
            event_data=request.event_data,
            registrations=request.registrations,
            feedback=request.feedback,
            include_recommendations=request.include_recommendations
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/dashboard-insights", response_model=DashboardInsightsResponse)
async def get_dashboard_insights(request: DashboardInsightsRequest):
    """
    Generate platform-wide insights for the admin dashboard.
    
    Provides high-level overview of all events with:
    - Performance summaries
    - Top performers
    - Areas for improvement
    - Predictions and trends
    """
    try:
        result = await analytics_service.generate_dashboard_insights(
            events=request.events,
            time_period=request.time_period,
            focus_areas=request.focus_areas
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/feedback-analysis", response_model=FeedbackAnalysisResponse)
async def analyze_feedback(request: FeedbackAnalysisRequest):
    """
    Deep analysis of event feedback and comments.
    
    Uses NLP to extract:
    - Sentiment patterns
    - Common themes
    - Notable feedback
    - Improvement suggestions
    """
    try:
        result = await analytics_service.analyze_feedback(
            event_id=request.event_id,
            feedback=request.feedback,
            analysis_depth=request.analysis_depth
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/compare-events")
async def compare_events(request: ComparativeAnalysisRequest):
    """
    Compare multiple events side by side.
    
    Generates comparative insights across selected aspects.
    """
    try:
        result = await analytics_service.compare_events(
            events=request.events,
            comparison_aspects=request.comparison_aspects
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/generate-report")
async def generate_report(
    event_ids: list[str],
    report_type: Literal["summary", "detailed", "executive"],
    format: Literal["text", "markdown", "html"] = "markdown"
):
    """
    Generate a comprehensive report for selected events.
    
    Returns formatted report suitable for sharing or presentation.
    """
    try:
        result = await analytics_service.generate_report(
            event_ids=event_ids,
            report_type=report_type,
            format=format
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/quick-stats")
async def get_quick_stats(event_id: str):
    """
    Get quick AI-generated stats summary for an event.
    
    Fast endpoint for inline stats display.
    """
    try:
        result = await analytics_service.get_quick_stats(event_id=event_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
