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
    interests: Optional[list[str]] = None  # User's stated interests
    registered_events: Optional[list[dict]] = None  # User's registered events with details

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
    """Format events for AI context - includes all events for better recommendations"""
    if not events:
        return "No events data available."
    
    formatted = []
    # Process up to 50 events for better coverage while managing token usage
    # Use concise format for larger lists
    max_events = min(len(events), 50)
    for e in events[:max_events]:
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
    
    if len(events) > max_events:
        formatted.append(f"\n... and {len(events) - max_events} more events available")
    
    return "\n".join(formatted)

def build_system_prompt(events: list[EventContext], registered_event_ids: list[str] = []) -> str:
    """Build system prompt with event context"""
    events_info = format_events_for_context(events)
    
    # Identify registered events for context
    registered_events = [e for e in events if e.id in registered_event_ids]
    registered_info = ", ".join([e.name for e in registered_events]) if registered_events else "None yet"
    
    total_events = len(events)
    
    return f"""You are a friendly, action-oriented AI assistant for Another Compile L, a university event management platform at GUC (German University in Cairo).

IMPORTANT: You have access to {total_events} upcoming events. When recommending events, consider the FULL list available.

PERSONALITY:
- Warm, conversational, and genuinely helpful
- Proactive - suggest actions, don't just describe
- Use emojis sparingly to add personality (1-2 per response max)
- Be concise - students are busy! Short, punchy responses
- Never ask for unnecessary confirmations

PLATFORM KNOWLEDGE:
Event Types:
- 📚 WORKSHOP: Academic sessions led by professors, hands-on learning, certificates on completion
- ✈️ TRIP: Off-campus excursions, travel experiences
- 🎤 CONFERENCE: Multi-day professional events, networking, external speakers
- 💪 GYM_SESSION: Fitness classes (yoga, pilates, Zumba, kickboxing, cross circuit, aerobics)
- 🛍️ BAZAAR: Marketplace events with vendor booths, shopping

BUSINESS RULES YOU MUST KNOW:
1. **Registration**: Students/Staff/TA/Professor can register for workshops and trips
2. **Payment**: Credit/debit card via Stripe, or use wallet balance if available
3. **Cancellation Policy**: Can only cancel if there are STILL 2+ WEEKS before the event starts
4. **Refunds**: Cancelled registrations are refunded to user's WALLET (not card)
5. **Certificates**: Only for WORKSHOPS - sent via email after the workshop ends
6. **Ratings/Comments**: Can only rate/comment on events you ATTENDED (after they end)
7. **Favorites**: Save events to track them - doesn't require registration
8. **Gym Sessions**: Check the monthly schedule, register to attend specific sessions
9. **Bazaars**: Students can attend for free, see participating vendors
10. **Conferences**: Have external landing pages with all details

LOYALTY PROGRAM:
- Earn points by attending events
- Tiers: Bronze → Silver → Gold → Platinum
- Higher tiers unlock 🔒 exclusive events
- Some events are invite-only for specific tiers

USER'S REGISTERED EVENTS: {registered_info}

AVAILABLE EVENTS (user has access to these):
{events_info}

RESPONSE STYLE:
- Be direct and actionable - no fluff
- Format events: "**Event Name** - Date - Price - one sentence"
- For paid events: "Click below - you'll checkout securely (EGP X)"
- For free events: "Free! Click below to grab your spot"
- Max 2-3 short paragraphs

REGISTRATION FLOW (CRITICAL - DO NOT DEVIATE):
1. When user wants to register, IMMEDIATELY provide the register button
2. Say "Great choice! Click below to register" - that's it!
3. For paid: "Click below to secure your spot - checkout follows (EGP X)"
4. For free: "Click below and you're in!"
5. NEVER say "let me proceed" or "processing" - the button does everything
6. NEVER ask "are you sure?" or "shall I register you?"

CANCELLATION:
- Can ONLY cancel if 2+ weeks before event
- Say "Click below to cancel - refund goes to your wallet"
- If within 2 weeks: "Sorry, cancellation window has closed (must be 2+ weeks before event)"

COMMON QUESTIONS:
- "How do I pay?" → "Card via Stripe or wallet balance at checkout"
- "Can I get a refund?" → "Yes, if you cancel 2+ weeks before the event - refunds go to wallet"
- "Where's my certificate?" → "Certificates are emailed after workshop completion"
- "How do loyalty points work?" → "Attend events to earn points, climb tiers, unlock exclusive events"
- "What's in my wallet?" → "Check your profile - wallet shows refunds and can be used for payments"

IMPORTANT:
- Only reference events from the list above
- Be accurate about prices, dates, availability
- If sold out, suggest alternatives
- Never make up information
- Be helpful but CONCISE"""

async def generate_ai_response(
    message: str,
    events: list[EventContext],
    user_context: Optional[UserContext],
    conversation_history: list[ConversationMessage],
    registered_event_ids: list[str] = []
) -> dict:
    """Generate AI-powered response using LLM"""
    
    system_prompt = build_system_prompt(events, registered_event_ids)
    
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
        # Add registered events to context
        if user_context.registered_events:
            reg_list = ", ".join([f"{r.get('eventName', 'Unknown')} on {r.get('eventDate', 'TBD')[:10] if r.get('eventDate') else 'TBD'}" for r in user_context.registered_events[:5]])
            user_info += f"Currently registered for: {reg_list}. "
    
    current_message = f"{user_info}\nUser message: {message}" if user_info else message
    messages.append(HumanMessage(content=current_message))
    
    try:
        response = await llm.ainvoke(messages)
        
        # Generate suggested actions based on response and message intent
        actions = []
        response_lower = response.content.lower()
        message_lower = message.lower()
        
        # Detect registration intent - be aggressive about offering registration
        registration_words = ['register', 'book', 'sign up', 'join', 'attend', 'go to', 'interested', 'want to go', 'sounds good', 'yes', 'confirm', 'do it']
        if any(word in message_lower for word in registration_words):
            # Try to extract event from message or response
            for event in events:
                event_name_lower = event.name.lower()
                # Check if event is mentioned in message or AI response
                if event_name_lower in message_lower or event_name_lower in response_lower or any(word in message_lower for word in event_name_lower.split()[:3]):
                    # Only offer registration if not already registered
                    if event.id not in registered_event_ids:
                        price = event.price if event.price and event.price > 0 else 0
                        price_str = f" · EGP {price}" if price > 0 else ""
                        actions.append({
                            "label": f"✓ Register{price_str}",
                            "action": f"register:{event.id}",
                            "icon": "calendar",
                            "actionType": "register",
                            "eventId": event.id
                        })
                    else:
                        actions.append({
                            "label": f"Already registered ✓",
                            "action": "navigate:my-events",
                            "icon": "calendar",
                            "actionType": "navigate"
                        })
                    break
        
        # Also check for events mentioned in response even without explicit registration intent
        # This helps when AI recommends an event
        if not any(a.get('actionType') == 'register' for a in actions):
            for event in events:
                if event.name.lower() in response_lower and event.id not in registered_event_ids:
                    price = event.price if event.price and event.price > 0 else 0
                    price_str = f" · EGP {price}" if price > 0 else ""
                    event_name = event.name[:22] + '...' if len(event.name) > 22 else event.name
                    actions.append({
                        "label": f"✓ {event_name}{price_str}",
                        "action": f"register:{event.id}",
                        "icon": "calendar",
                        "actionType": "register",
                        "eventId": event.id
                    })
                    # Also offer view details
                    actions.append({
                        "label": f"📋 View Details",
                        "action": f"navigate:event:{event.id}",
                        "icon": "search",
                        "actionType": "navigate",
                        "eventId": event.id
                    })
                    break
        
        # Detect cancellation intent
        if any(word in message_lower for word in ['cancel', 'unregister', 'remove']):
            # Try to find specific event mentioned
            for event in events:
                if event.id in registered_event_ids and (event.name.lower() in message_lower or event.name.lower() in response_lower):
                    event_name = event.name[:20] + '...' if len(event.name) > 20 else event.name
                    actions.append({
                        "label": f"❌ {event_name}",
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
        
        # Check for "my events" or "my registrations" queries
        if any(word in message_lower for word in ['my event', 'my registration', 'registered for', 'booked', 'signed up']):
            if registered_event_ids:
                actions.append({
                    "label": "📅 View My Events",
                    "action": "navigate:my-events",
                    "icon": "calendar",
                    "actionType": "navigate"
                })
        
        # Check for wallet/payment queries
        if any(word in message_lower for word in ['wallet', 'balance', 'refund', 'money']):
            actions.append({
                "label": "💰 View Wallet",
                "action": "navigate:wallet",
                "icon": "help",
                "actionType": "navigate"
            })
        
        # Check for gym/fitness queries
        if any(word in message_lower for word in ['gym', 'fitness', 'yoga', 'pilates', 'zumba', 'workout', 'exercise']):
            actions.append({
                "label": "💪 Gym Schedule",
                "action": "navigate:gym",
                "icon": "calendar",
                "actionType": "navigate"
            })
        
        # Check for loyalty/points queries
        if any(word in message_lower for word in ['loyalty', 'points', 'tier', 'discount', 'partner']):
            actions.append({
                "label": "⭐ Loyalty Program",
                "action": "navigate:loyalty",
                "icon": "help",
                "actionType": "navigate"
            })
        
        # Check for favorites
        if any(word in message_lower for word in ['favorite', 'saved', 'bookmark']):
            actions.append({
                "label": "❤️ My Favorites",
                "action": "navigate:favorites",
                "icon": "calendar",
                "actionType": "navigate"
            })
        
        # Add browse action if discussing events
        if any(word in response_lower for word in ["event", "workshop", "trip", "conference", "bazaar", "gym"]):
            if not any(a.get('actionType') == 'navigate' and 'events' in a.get('action', '') for a in actions):
                actions.append({"label": "🔍 Browse Events", "action": "navigate:events", "icon": "search", "actionType": "navigate"})
        
        # Default actions if none matched
        if not actions:
            actions = [
                {"label": "🔍 Find Events", "action": "What events are happening?", "icon": "search"},
                {"label": "📅 My Events", "action": "Show my registrations", "icon": "calendar"},
                {"label": "❓ Help", "action": "What can you help me with?", "icon": "help"}
            ]
        
        return {
            "response": response.content,
            "actions": actions[:4],  # Limit to 4 actions
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
        # Check if user is asking for personalized recommendations
        message_lower = request.message.lower()
        recommendation_keywords = [
            'recommend', 'suggest', 'for me', 'i might like', 'i would like',
            'based on my interests', 'personalized', 'what should i', 
            'events for me', 'match my interests'
        ]
        
        is_recommendation_request = any(keyword in message_lower for keyword in recommendation_keywords)
        
        # If asking for recommendations AND has user context with interests, use recommendations service
        if is_recommendation_request and request.user_context and hasattr(request.user_context, 'role'):
            from services.recommendations_service import RecommendationsService
            recommendations_service = RecommendationsService()
            
            # Get personalized recommendations
            rec_result = await recommendations_service.get_personalized_recommendations(
                user_profile={
                    'user_id': request.user_context.user_id or 'unknown',
                    'role': request.user_context.role or 'STUDENT',
                    'faculty': request.user_context.faculty,
                    'interests': request.user_context.interests or []
                },
                registration_history={
                    'event_ids': request.registered_event_ids,
                    'event_types': [],
                    'rated_events': {}
                },
                available_events=[e.dict() if hasattr(e, 'dict') else dict(e) for e in request.available_events],
                limit=5,
                exclude_registered=True
            )
            
            # Format recommendations into a response
            if rec_result.get('recommendations'):
                recs = rec_result['recommendations']
                response_text = f"Based on your interests, here are my top recommendations:\n\n"
                for i, rec in enumerate(recs[:5], 1):
                    reasons = rec.get('recommendation_reasons', ['Matches your interests'])
                    response_text += f"{i}. **{rec['name']}** ({rec['type']})\n"
                    response_text += f"   📅 {rec['startDate'][:10] if rec.get('startDate') else 'TBA'}\n"
                    response_text += f"   💡 {reasons[0] if reasons else 'Good match'}\n\n"
                
                # Generate action buttons with concise labels
                actions = []
                for rec in recs[:3]:  # Top 3 get action buttons
                    if rec['id'] not in request.registered_event_ids:
                        price = rec.get('price', 0)
                        price_str = f" · EGP {price}" if price > 0 else ""
                        # Keep event name short for button
                        event_name = rec['name'][:25] + '...' if len(rec['name']) > 25 else rec['name']
                        actions.append({
                            "label": f"✓ {event_name}{price_str}",
                            "action": f"register:{rec['id']}",
                            "icon": "calendar",
                            "actionType": "register",
                            "eventId": rec['id']
                        })
                
                return AssistantResponse(
                    response=response_text.strip(),
                    suggested_actions=[
                        SuggestedAction(
                            label=a["label"],
                            action=a["action"],
                            icon=a.get("icon"),
                            actionType=a.get("actionType"),
                            eventId=a.get("eventId")
                        )
                        for a in actions
                    ],
                    confidence=0.9
                )
        
        # Otherwise, use regular conversational assistant
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
