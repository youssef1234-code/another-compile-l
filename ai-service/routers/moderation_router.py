"""
AI Comment Moderation Router

Feature 2: AI-powered comment moderation for event feedback
Detects inappropriate content in comments using:
1. Local profanity detection (better-profanity for multi-language support)
2. LLM-based contextual analysis for nuanced cases

Helps Admin identify and flag inappropriate comments automatically.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.moderation_service import ModerationService
from utils.openai_key_check import require_openai_key

router = APIRouter()
moderation_service = ModerationService()

class ModerateCommentRequest(BaseModel):
    """Request model for moderating a single comment"""
    comment: str = Field(..., description="Comment text to moderate")
    comment_id: Optional[str] = Field(None, description="Comment ID for tracking")
    event_id: Optional[str] = Field(None, description="Associated event ID")
    user_id: Optional[str] = Field(None, description="User who posted the comment")
    context: Optional[str] = Field(None, description="Additional context (e.g., event name)")

class BatchModerateRequest(BaseModel):
    """Request model for moderating multiple comments"""
    comments: list[dict] = Field(..., description="List of comments with id and text")
    event_id: Optional[str] = Field(None, description="Associated event ID")

class ModerationResult(BaseModel):
    """Result of comment moderation"""
    is_appropriate: bool = Field(..., description="Whether the comment is appropriate")
    confidence: float = Field(..., description="Confidence score (0-1)")
    flags: list[str] = Field(default=[], description="Detected issue flags")
    severity: Literal["none", "low", "medium", "high", "critical"] = Field(..., description="Severity level")
    suggestion: Optional[str] = Field(None, description="Suggested action")
    detected_issues: Optional[dict] = Field(None, description="Detailed issue breakdown")

class ModerateCommentResponse(BaseModel):
    """Response for single comment moderation"""
    comment_id: Optional[str] = None
    result: ModerationResult

class BatchModerateResponse(BaseModel):
    """Response for batch comment moderation"""
    total: int = Field(..., description="Total comments processed")
    flagged: int = Field(..., description="Number of flagged comments")
    results: list[dict] = Field(..., description="Individual results")

class ContentAnalysisRequest(BaseModel):
    """Request for deep content analysis"""
    text: str = Field(..., description="Text to analyze")
    analysis_type: Literal["toxicity", "sentiment", "harassment", "spam", "full"] = Field("full", description="Type of analysis")

class ContentAnalysisResponse(BaseModel):
    """Response for content analysis"""
    toxicity_score: float = Field(..., description="Toxicity score (0-1)")
    sentiment: Literal["positive", "neutral", "negative"] = Field(..., description="Overall sentiment")
    categories: dict = Field(..., description="Detected category scores")
    summary: str = Field(..., description="Analysis summary")

@router.post("/moderate/comment", response_model=ModerateCommentResponse)
async def moderate_comment(request: ModerateCommentRequest):
    """
    Moderate a single comment for inappropriate content.
    
    Uses multi-layer detection:
    1. Fast local profanity check (multi-language)
    2. LLM contextual analysis for nuanced cases
    
    Returns detailed moderation result with confidence and severity.
    """
    require_openai_key()  # Check if OpenAI key is configured
    try:
        result = await moderation_service.moderate_comment(
            comment=request.comment,
            comment_id=request.comment_id,
            event_id=request.event_id,
            user_id=request.user_id,
            context=request.context
        )
        return ModerateCommentResponse(
            comment_id=request.comment_id,
            result=result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/batch", response_model=BatchModerateResponse)
async def moderate_batch(request: BatchModerateRequest):
    """
    Moderate multiple comments in batch.
    
    Efficient for processing all comments on an event page
    or for periodic moderation sweeps.
    """
    try:
        results = await moderation_service.moderate_batch(
            comments=request.comments,
            event_id=request.event_id
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/analyze", response_model=ContentAnalysisResponse)
async def analyze_content(request: ContentAnalysisRequest):
    """
    Deep content analysis for detailed insights.
    
    Provides comprehensive analysis including toxicity,
    sentiment, and category breakdown.
    """
    try:
        result = await moderation_service.analyze_content(
            text=request.text,
            analysis_type=request.analysis_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/moderate/stats")
async def get_moderation_stats(event_id: Optional[str] = None):
    """
    Get moderation statistics.
    
    Returns aggregated stats on flagged content,
    common issues, and moderation actions.
    """
    try:
        stats = await moderation_service.get_stats(event_id=event_id)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/moderate/report")
async def report_comment(
    comment_id: str,
    reason: str,
    reporter_id: str,
    additional_info: Optional[str] = None
):
    """
    Report a comment for review.
    
    Used when users report inappropriate content
    that wasn't automatically detected.
    """
    try:
        result = await moderation_service.report_comment(
            comment_id=comment_id,
            reason=reason,
            reporter_id=reporter_id,
            additional_info=additional_info
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
