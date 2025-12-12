"""
Event Q&A Chatbot Router

Feature 5: AI-powered Q&A chatbot for events
Answers attendee questions about specific events using:
- Event details (description, agenda, location, dates)
- FAQ generation
- Context-aware responses

Helps students get instant answers about events without waiting.
Uses LangGraph for conversational flow management.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.chatbot_service import ChatbotService

router = APIRouter()
chatbot_service = ChatbotService()

class EventContext(BaseModel):
    """Event context for the chatbot"""
    event_id: str = Field(..., description="Event ID")
    event_name: str = Field(..., description="Event name")
    event_type: str = Field(..., description="Event type")
    description: str = Field(..., description="Event description")
    location: str = Field(..., description="Event location")
    location_details: Optional[str] = Field(None, description="Detailed location info")
    start_date: str = Field(..., description="Event start date/time")
    end_date: Optional[str] = Field(None, description="Event end date/time")
    capacity: Optional[int] = Field(None, description="Event capacity")
    price: Optional[float] = Field(None, description="Event price")
    registration_deadline: Optional[str] = Field(None, description="Registration deadline")
    requirements: Optional[str] = Field(None, description="Event requirements")
    agenda: Optional[str] = Field(None, description="Event agenda (for workshops)")
    professors: Optional[list[str]] = Field(None, description="Participating professors")
    faculty: Optional[str] = Field(None, description="Target faculty")
    additional_info: Optional[dict] = Field(None, description="Any additional event info")

class ChatMessage(BaseModel):
    """Chat message model"""
    role: Literal["user", "assistant"] = Field(..., description="Message role")
    content: str = Field(..., description="Message content")

class ChatRequest(BaseModel):
    """Request for chat interaction"""
    event_context: EventContext = Field(..., description="Event context")
    message: str = Field(..., description="User's question")
    conversation_history: list[ChatMessage] = Field(default=[], description="Previous messages")
    user_id: Optional[str] = Field(None, description="User ID for personalization")
    user_role: Optional[str] = Field(None, description="User role")

class ChatResponse(BaseModel):
    """Response from chatbot"""
    response: str = Field(..., description="Chatbot response")
    confidence: float = Field(..., description="Confidence score (0-1)")
    sources: list[str] = Field(default=[], description="Information sources used")
    suggested_questions: list[str] = Field(default=[], description="Follow-up questions")
    action_buttons: Optional[list[dict]] = Field(None, description="Suggested actions")

class GenerateFAQRequest(BaseModel):
    """Request to generate FAQ for an event"""
    event_context: EventContext = Field(..., description="Event context")
    num_questions: int = Field(5, description="Number of FAQ items to generate")
    focus_areas: Optional[list[str]] = Field(None, description="Areas to focus on")

class FAQResponse(BaseModel):
    """Generated FAQ response"""
    faqs: list[dict] = Field(..., description="List of FAQ items with question and answer")
    event_id: str = Field(..., description="Event ID")

class QuickAnswerRequest(BaseModel):
    """Request for quick predefined answers"""
    event_context: EventContext = Field(..., description="Event context")
    question_type: Literal[
        "registration", "location", "schedule", "price", 
        "requirements", "capacity", "contact", "general"
    ] = Field(..., description="Type of question")

@router.post("/chatbot/ask", response_model=ChatResponse)
async def ask_question(request: ChatRequest):
    """
    Ask a question about an event.
    
    The chatbot uses the event context to provide accurate,
    helpful answers. It maintains conversation context for
    follow-up questions.
    
    Features:
    - Context-aware responses
    - Conversation memory
    - Suggested follow-up questions
    - Action suggestions (register, view map, etc.)
    """
    try:
        result = await chatbot_service.answer_question(
            event_context=request.event_context.model_dump(),
            message=request.message,
            conversation_history=[m.model_dump() for m in request.conversation_history],
            user_id=request.user_id,
            user_role=request.user_role
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/generate-faq", response_model=FAQResponse)
async def generate_faq(request: GenerateFAQRequest):
    """
    Generate FAQ for an event.
    
    Automatically creates common questions and answers
    based on the event details. Great for event pages.
    """
    try:
        result = await chatbot_service.generate_faq(
            event_context=request.event_context.model_dump(),
            num_questions=request.num_questions,
            focus_areas=request.focus_areas
        )
        return FAQResponse(
            faqs=result,
            event_id=request.event_context.event_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/quick-answer")
async def get_quick_answer(request: QuickAnswerRequest):
    """
    Get a quick answer for common question types.
    
    Faster than full chat for predefined question categories.
    """
    try:
        result = await chatbot_service.get_quick_answer(
            event_context=request.event_context.model_dump(),
            question_type=request.question_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/suggest-questions")
async def suggest_questions(event_context: EventContext):
    """
    Suggest questions users might want to ask.
    
    Returns relevant questions based on event type and details.
    """
    try:
        questions = await chatbot_service.suggest_questions(
            event_context=event_context.model_dump()
        )
        return {"suggested_questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chatbot/summarize-event")
async def summarize_event(
    event_context: EventContext,
    length: Literal["short", "medium", "long"] = "medium"
):
    """
    Generate a natural language summary of the event.
    
    Useful for quick overviews and sharing.
    """
    try:
        summary = await chatbot_service.summarize_event(
            event_context=event_context.model_dump(),
            length=length
        )
        return {"summary": summary, "event_id": event_context.event_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chatbot/common-questions/{event_type}")
async def get_common_questions(event_type: str):
    """
    Get common questions for an event type.
    
    Returns typical questions students ask about different event types.
    """
    try:
        questions = await chatbot_service.get_common_questions(event_type=event_type)
        return {"event_type": event_type, "questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
