"""
General Assistant Router

Generic AI assistant for the Another Compile L platform.
Handles general questions, navigation help, and platform guidance.
Uses actual event data when available.
"""

import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage
import json

router = APIRouter()

# Initialize LLM
llm = ChatOpenAI(
    model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    temperature=0.7,
    api_key=os.getenv("OPENAI_API_KEY")
)

class UserContext(BaseModel):
    """User context for personalization"""
    user_id: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    faculty: Optional[str] = None

class EventContext(BaseModel):
    """Event data for context"""
    id: str
    name: str
    type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    price: Optional[float] = None
    capacity: Optional[int] = None
    registrationCount: Optional[int] = None
    isExclusive: Optional[bool] = None  # True if event has whitelist

class ConversationMessage(BaseModel):
    """A message in the conversation"""
    role: Literal["user", "assistant"]
    content: str

class AssistantRequest(BaseModel):
    """Request for general assistant"""
    message: str = Field(..., description="User's message")
    conversation_history: list[ConversationMessage] = Field(default=[], description="Previous messages")
    user_context: Optional[UserContext] = Field(None, description="User info for personalization")
    available_events: list[EventContext] = Field(default=[], description="Available events for context")
    registered_event_ids: list[str] = Field(default=[], description="Event IDs user is already registered for")

class SuggestedAction(BaseModel):
    """Suggested action for the user"""
    label: str
    action: str
    icon: Optional[str] = None
    actionType: Optional[str] = None  # 'register', 'cancel', 'navigate', 'query'
    eventId: Optional[str] = None  # For register/cancel actions

class AssistantResponse(BaseModel):
    """Response from assistant"""
    response: str = Field(..., description="Assistant response")
    suggested_actions: list[SuggestedAction] = Field(default=[], description="Suggested follow-up actions")
    confidence: float = Field(default=0.8, description="Response confidence")

def format_events_for_context(events: list[EventContext]) -> str:
    """Format events for AI context"""
    if not events:
        return "No events data available."
    
    formatted = []
    for e in events[:15]:  # Limit for token efficiency
        price_str = f"EGP {e.price}" if e.price and e.price > 0 else "Free"
        spots = ""
        if e.capacity and e.registrationCount is not None:
            remaining = e.capacity - e.registrationCount
            spots = f" ({remaining} spots left)" if remaining > 0 else " (SOLD OUT)"
        
        exclusive_tag = " 🔒 Exclusive" if e.isExclusive else ""
        
        # Get emoji for event type
        type_emoji = {
            "WORKSHOP": "📚",
            "TRIP": "✈️",
            "BAZAAR": "🛍️",
            "CONFERENCE": "🎤",
            "GYM_SESSION": "💪"
        }.get(e.type or "", "📅")
        
        formatted.append(
            f"- {type_emoji} **{e.name}** ({e.type or 'Event'}){exclusive_tag}: {e.location or 'TBA'} | "
            f"{e.startDate[:10] if e.startDate else 'TBA'} | {price_str}{spots}"
        )
    
    return "\n".join(formatted)

def build_system_prompt(events: list[EventContext]) -> str:
    """Build system prompt with event context"""
    events_info = format_events_for_context(events)
    
    return f"""You are a friendly, helpful AI assistant for Another Compile L, a university event management platform at GUC (German University in Cairo).

PERSONALITY:
- Warm, conversational, and genuinely helpful
- Use emojis sparingly to add personality (1-2 per response max)
- Be concise but thorough - students are busy!
- Show enthusiasm about events without being over-the-top

PLATFORM KNOWLEDGE:
Event Types (use these emojis when mentioning):
- 📚 WORKSHOP: Academic sessions, professor talks, hands-on learning
- ✈️ TRIP: Off-campus excursions, travel experiences
- 🎤 CONFERENCE: Multi-day professional events, networking
- 💪 GYM_SESSION: Fitness classes, sports activities
- 🛍️ BAZAAR: Marketplace events, vendor booths, shopping

Key Features:
- Registration: Students reserve spots (some events have limited capacity)
- Payments: Via Stripe for paid events, refunds available on cancellation
- Loyalty Program: Earn points by attending → Bronze → Silver → Gold → Platinum tiers
- Exclusive Events: Some events are 🔒 exclusive (you're seeing ones you have access to)
- Favorites: Save events to track them easily
- Ratings: Give feedback after attending

AVAILABLE EVENTS (only showing events you can access):
{events_info}

RESPONSE GUIDELINES:
1. When listing events, use the ACTUAL data above - never make up events
2. Format event mentions nicely:
   - Include: emoji, name, date, location, price
   - Example: "📚 **Machine Learning Workshop** on Jan 15 at Room C7.203 - Free!"
3. If an event is 🔒 Exclusive, mention it's a special invite-only opportunity
4. For sold out events, suggest checking back or browsing similar ones
5. Keep responses focused - 2-3 short paragraphs max

HANDLING REQUESTS:
- "Show me events" → List relevant events from the data above
- "Register for X" → Confirm the event and offer registration action
- "Cancel X" → Confirm and offer cancellation action  
- "What's happening this week?" → Filter by date and list upcoming ones
- Unclear which event → Ask for clarification with helpful options

IMPORTANT:
- Only recommend events from the list above (user has access to these)
- Be accurate about prices, dates, and availability
- If you don't know something, say so rather than guessing"""

async def generate_ai_response(
    message: str,
    events: list[EventContext],
    user_context: Optional[UserContext],
    conversation_history: list[ConversationMessage],
    registered_event_ids: list[str] = []
) -> dict:
    """Generate AI-powered response using LLM"""
    
    system_prompt = build_system_prompt(events)
    
    # Build conversation messages
    messages = [SystemMessage(content=system_prompt)]
    
    # Add conversation history (last 5 exchanges)
    for msg in conversation_history[-10:]:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(SystemMessage(content=f"Your previous response: {msg.content}"))
    
    # Add user context to the current message
    user_info = ""
    if user_context:
        if user_context.name:
            user_info += f"User: {user_context.name}. "
        if user_context.faculty:
            user_info += f"Faculty: {user_context.faculty}. "
    
    current_message = f"{user_info}\nUser message: {message}" if user_info else message
    messages.append(HumanMessage(content=current_message))
    
    try:
        response = await llm.ainvoke(messages)
        
        # Generate suggested actions based on response and message intent
        actions = []
        response_lower = response.content.lower()
        message_lower = message.lower()
        
        # Detect registration intent
        if any(word in message_lower for word in ['register', 'book', 'sign up', 'join']):
            # Try to extract event from message or response
            for event in events:
                if event.name.lower() in message_lower or event.name.lower() in response_lower:
                    # Only offer registration if not already registered
                    if event.id not in registered_event_ids:
                        actions.append({
                            "label": f"Register for {event.name}",
                            "action": f"register:{event.id}",
                            "icon": "calendar",
                            "actionType": "register",
                            "eventId": event.id
                        })
                    break
        
        # Detect cancellation intent
        if any(word in message_lower for word in ['cancel', 'unregister', 'remove']):
            # Try to find specific event mentioned
            for event in events:
                if event.id in registered_event_ids and (event.name.lower() in message_lower or event.name.lower() in response_lower):
                    actions.append({
                        "label": f"Cancel {event.name}",
                        "action": f"cancel:{event.id}",
                        "icon": "cancel",
                        "actionType": "cancel",
                        "eventId": event.id
                    })
                    break
            else:
                # If no specific event, offer to view registrations
                actions.append({
                    "label": "View My Events",
                    "action": "navigate:my-events",
                    "icon": "calendar",
                    "actionType": "navigate"
                })
        
        # Add browse action if discussing events
        if "event" in response_lower or "workshop" in response_lower or "trip" in response_lower:
            actions.append({"label": "Browse All Events", "action": "navigate:events", "icon": "search", "actionType": "navigate"})
        
        # Default actions if none matched
        if not actions:
            actions = [
                {"label": "Find Events", "action": "What events are happening?", "icon": "search"},
                {"label": "Get Help", "action": "What can you help me with?", "icon": "help"}
            ]
        
        return {
            "response": response.content,
            "actions": actions[:3],  # Limit to 3 actions
            "confidence": 0.9
        }
    except Exception as e:
        print(f"LLM Error: {e}")
        return {
            "response": "I'm having trouble processing that. Please try again or visit the Events page to browse upcoming events.",
            "actions": [{"label": "Browse Events", "action": "Show me events", "icon": "search"}],
            "confidence": 0.5
        }

@router.post("/assistant/chat", response_model=AssistantResponse)
async def chat_with_assistant(request: AssistantRequest):
    """
    Chat with the general assistant.
    
    Uses AI to provide intelligent, context-aware responses about events,
    registration, and platform navigation using actual event data.
    """
    try:
        result = await generate_ai_response(
            request.message,
            request.available_events,
            request.user_context,
            request.conversation_history,
            request.registered_event_ids
        )
        
        return AssistantResponse(
            response=result["response"],
            suggested_actions=[
                SuggestedAction(
                    label=a["label"], 
                    action=a["action"], 
                    icon=a.get("icon"),
                    actionType=a.get("actionType"),
                    eventId=a.get("eventId")
                )
                for a in result.get("actions", [])
            ],
            confidence=result.get("confidence", 0.8)
        )
    except Exception as e:
        print(f"Assistant error: {e}")
        # Return a friendly error response
        return AssistantResponse(
            response="I'm having trouble processing that right now. Please try again in a moment, or visit the Events page directly to browse upcoming events.",
            suggested_actions=[
                SuggestedAction(label="Browse Events", action="Show me events", icon="search")
            ],
            confidence=0.3
        )

@router.get("/assistant/suggestions")
async def get_suggestions(user_role: Optional[str] = None):
    """
    Get suggested questions based on user role.
    """
    base_suggestions = [
        "What events are happening this week?",
        "Show me upcoming workshops",
        "How do I register for an event?",
        "How do loyalty points work?"
    ]
    
    if user_role == "ADMIN" or user_role == "EVENT_OFFICE":
        base_suggestions.extend([
            "How do I create an event?",
            "Show event analytics",
            "Review pending approvals"
        ])
    
    return {"suggestions": base_suggestions}
