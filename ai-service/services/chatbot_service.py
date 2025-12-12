"""
Event Q&A Chatbot Service

AI-powered chatbot that answers questions about specific events.
Uses LangChain for conversational capabilities.
"""

import os
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage

class ChatbotService:
    """Service for AI-powered event Q&A chatbot"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.5,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        # Common questions by event type
        self.common_questions = {
            "WORKSHOP": [
                "What will I learn in this workshop?",
                "Do I need any prerequisites?",
                "Will there be hands-on activities?",
                "Will I receive a certificate?",
                "What should I bring?"
            ],
            "TRIP": [
                "What's included in the trip?",
                "What's the transportation arrangement?",
                "What should I pack?",
                "Is food included?",
                "What's the cancellation policy?"
            ],
            "BAZAAR": [
                "What vendors will be there?",
                "Can I pay by card?",
                "Are there any special discounts?",
                "What time does it start/end?",
                "Can I bring friends from outside GUC?"
            ],
            "CONFERENCE": [
                "Who are the speakers?",
                "What are the main topics?",
                "Will sessions be recorded?",
                "Is there a networking session?",
                "Do I get CPD credits?"
            ],
            "GYM_SESSION": [
                "What fitness level is required?",
                "What should I wear?",
                "Do I need to bring equipment?",
                "How long is the session?",
                "Can beginners join?"
            ]
        }
    
    async def answer_question(
        self,
        event_context: dict,
        message: str,
        conversation_history: list[dict],
        user_id: Optional[str] = None,
        user_role: Optional[str] = None
    ) -> dict:
        """Answer a user question about an event"""
        
        # Build system context
        system_prompt = self._build_system_prompt(event_context, user_role)
        
        # Build message history
        messages = [SystemMessage(content=system_prompt)]
        
        for msg in conversation_history[-10:]:  # Last 10 messages for context
            if msg.get("role") == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=message))
        
        try:
            response = await self.llm.ainvoke(messages)
            answer = response.content
            
            # Generate follow-up suggestions
            suggested_questions = await self._generate_followups(
                event_context, message, answer
            )
            
            # Determine action buttons
            action_buttons = self._get_action_buttons(message, event_context)
            
            # Calculate confidence
            confidence = self._calculate_confidence(message, event_context, answer)
            
            return {
                "response": answer,
                "confidence": confidence,
                "sources": self._identify_sources(event_context, answer),
                "suggested_questions": suggested_questions,
                "action_buttons": action_buttons
            }
            
        except Exception as e:
            print(f"Chatbot error: {e}")
            return {
                "response": "I'm sorry, I couldn't process your question. Please try again or contact the event organizers directly.",
                "confidence": 0.0,
                "sources": [],
                "suggested_questions": self.common_questions.get(event_context.get("event_type"), [])[:3],
                "action_buttons": None
            }
    
    def _build_system_prompt(self, event_context: dict, user_role: Optional[str]) -> str:
        """Build system prompt with event context"""
        
        role_context = f"The user is a {user_role}." if user_role else ""
        
        return f"""You are a helpful assistant for the GUC Event Manager platform.
You're helping users with questions about a specific event.

EVENT DETAILS:
- Name: {event_context.get('event_name')}
- Type: {event_context.get('event_type')}
- Description: {event_context.get('description', 'No description available')}
- Location: {event_context.get('location')} {event_context.get('location_details', '')}
- Start Date: {event_context.get('start_date')}
- End Date: {event_context.get('end_date', 'Same day')}
- Capacity: {event_context.get('capacity', 'Not specified')}
- Price: {event_context.get('price', 0)} EGP
- Registration Deadline: {event_context.get('registration_deadline', 'Not specified')}
- Requirements: {event_context.get('requirements', 'None specified')}
- Agenda: {event_context.get('agenda', 'Not available')}
- Faculty: {event_context.get('faculty', 'All faculties welcome')}
- Professors: {', '.join(event_context.get('professors', [])) or 'Not specified'}

{role_context}

Guidelines:
- Answer based ONLY on the event information provided
- If you don't have information to answer, say so clearly
- Be helpful, friendly, and concise
- Encourage registration when appropriate
- For questions about payment, direct them to the registration page
- Don't make up information not in the context"""

    async def _generate_followups(
        self,
        event_context: dict,
        question: str,
        answer: str
    ) -> list[str]:
        """Generate follow-up question suggestions"""
        
        event_type = event_context.get("event_type", "")
        base_questions = self.common_questions.get(event_type, [])
        
        # Filter out questions similar to what was just asked
        question_lower = question.lower()
        relevant = [q for q in base_questions if not any(
            word in question_lower for word in q.lower().split()[:3]
        )]
        
        return relevant[:3]
    
    def _get_action_buttons(self, question: str, event_context: dict) -> Optional[list[dict]]:
        """Suggest action buttons based on question context"""
        
        question_lower = question.lower()
        buttons = []
        
        if any(word in question_lower for word in ["register", "sign up", "join", "attend"]):
            buttons.append({
                "label": "Register Now",
                "action": "navigate",
                "target": f"/events/{event_context.get('event_id')}/register"
            })
        
        if any(word in question_lower for word in ["location", "where", "venue", "map"]):
            buttons.append({
                "label": "View on Map",
                "action": "navigate",
                "target": "/platform-map"
            })
        
        if any(word in question_lower for word in ["contact", "questions", "help", "organizer"]):
            buttons.append({
                "label": "Contact Support",
                "action": "navigate",
                "target": "/support"
            })
        
        return buttons if buttons else None
    
    def _calculate_confidence(
        self,
        question: str,
        event_context: dict,
        answer: str
    ) -> float:
        """Calculate confidence score for the answer"""
        
        confidence = 0.7  # Base confidence
        
        # Higher confidence if question matches known fields
        question_lower = question.lower()
        
        high_confidence_keywords = {
            "when": ["start_date", "end_date"],
            "where": ["location", "location_details"],
            "cost": ["price"],
            "price": ["price"],
            "how much": ["price"],
            "capacity": ["capacity"],
            "deadline": ["registration_deadline"]
        }
        
        for keyword, fields in high_confidence_keywords.items():
            if keyword in question_lower:
                for field in fields:
                    if event_context.get(field):
                        confidence = 0.95
                        break
        
        # Lower confidence for vague questions
        if any(word in question_lower for word in ["think", "should i", "recommend"]):
            confidence = min(confidence, 0.7)
        
        return round(confidence, 2)
    
    def _identify_sources(self, event_context: dict, answer: str) -> list[str]:
        """Identify which event fields were used in the answer"""
        
        sources = []
        answer_lower = answer.lower()
        
        field_mappings = {
            "event description": "description",
            "event location": "location",
            "start date": "start_date",
            "end date": "end_date",
            "event capacity": "capacity",
            "event price": "price",
            "agenda": "agenda",
            "requirements": "requirements"
        }
        
        for source_name, field in field_mappings.items():
            value = event_context.get(field, "")
            if value and str(value).lower() in answer_lower:
                sources.append(source_name)
        
        return sources if sources else ["event information"]
    
    async def generate_faq(
        self,
        event_context: dict,
        num_questions: int = 5,
        focus_areas: Optional[list[str]] = None
    ) -> list[dict]:
        """Generate FAQ for an event"""
        
        event_type = event_context.get("event_type", "")
        
        system_prompt = """Generate FAQ items for an event.
Return a JSON array of {question: string, answer: string} objects.
Base answers ONLY on the provided event information.
If information isn't available, make the answer direct them to contact organizers."""

        context = f"""
Event: {event_context.get('event_name')} ({event_type})
Description: {event_context.get('description', '')}
Location: {event_context.get('location')}
Date: {event_context.get('start_date')}
Price: {event_context.get('price', 0)} EGP
Capacity: {event_context.get('capacity', 'Not specified')}
Requirements: {event_context.get('requirements', 'None')}

Generate {num_questions} FAQ items.
{f"Focus on: {', '.join(focus_areas)}" if focus_areas else ""}"""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=context)
            ])
            
            import json
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            return json.loads(content)
            
        except Exception as e:
            print(f"FAQ generation error: {e}")
            # Return default FAQs
            return [
                {"question": f"When is {event_context.get('event_name')}?",
                 "answer": f"The event is scheduled for {event_context.get('start_date')}."},
                {"question": "Where is the event?",
                 "answer": f"The event will be held at {event_context.get('location')}."},
                {"question": "How much does it cost?",
                 "answer": f"The event costs {event_context.get('price', 0)} EGP."}
            ]
    
    async def get_quick_answer(
        self,
        event_context: dict,
        question_type: str
    ) -> dict:
        """Get quick answer for common question types"""
        
        answers = {
            "registration": {
                "answer": f"To register for {event_context.get('event_name')}, visit the event page and click 'Register'. Registration deadline is {event_context.get('registration_deadline', 'not specified')}.",
                "action": {"label": "Register", "target": f"/events/{event_context.get('event_id')}/register"}
            },
            "location": {
                "answer": f"The event will be held at {event_context.get('location')}. {event_context.get('location_details', '')}",
                "action": {"label": "View Map", "target": "/platform-map"}
            },
            "schedule": {
                "answer": f"The event starts on {event_context.get('start_date')} and ends on {event_context.get('end_date', 'the same day')}.",
                "action": None
            },
            "price": {
                "answer": f"The event costs {event_context.get('price', 0)} EGP.",
                "action": {"label": "Register", "target": f"/events/{event_context.get('event_id')}/register"} if event_context.get('price', 0) > 0 else None
            },
            "requirements": {
                "answer": f"Requirements: {event_context.get('requirements', 'No specific requirements listed')}.",
                "action": None
            },
            "capacity": {
                "answer": f"The event has a capacity of {event_context.get('capacity', 'unlimited')} participants.",
                "action": None
            },
            "contact": {
                "answer": "For questions about this event, please contact the Events Office or reach out through the platform support.",
                "action": {"label": "Contact Support", "target": "/support"}
            },
            "general": {
                "answer": f"{event_context.get('event_name')} is a {event_context.get('event_type').lower()} event. {event_context.get('description', '')[:200]}",
                "action": None
            }
        }
        
        result = answers.get(question_type, answers["general"])
        return {
            "question_type": question_type,
            **result
        }
    
    async def suggest_questions(self, event_context: dict) -> list[str]:
        """Suggest questions based on event type"""
        
        event_type = event_context.get("event_type", "")
        base_questions = self.common_questions.get(event_type, [])
        
        # Add event-specific questions
        specific = []
        if event_context.get("price", 0) > 0:
            specific.append("What's included in the price?")
        if event_context.get("professors"):
            specific.append("Tell me about the professors leading this event")
        if event_context.get("requirements"):
            specific.append("What do I need to participate?")
        
        return specific + base_questions[:5 - len(specific)]
    
    async def summarize_event(
        self,
        event_context: dict,
        length: str = "medium"
    ) -> str:
        """Generate event summary"""
        
        length_guide = {
            "short": "1-2 sentences",
            "medium": "3-4 sentences",
            "long": "5-6 sentences"
        }
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=f"Summarize this event in {length_guide.get(length, '3-4 sentences')}. Be engaging and informative."),
                HumanMessage(content=f"""
Event: {event_context.get('event_name')} ({event_context.get('event_type')})
Description: {event_context.get('description', '')}
Date: {event_context.get('start_date')}
Location: {event_context.get('location')}
Price: {event_context.get('price', 0)} EGP
""")
            ])
            return response.content
        except Exception as e:
            return f"{event_context.get('event_name')} is a {event_context.get('event_type', 'event').lower()} at {event_context.get('location')} on {event_context.get('start_date')}."
    
    async def get_common_questions(self, event_type: str) -> list[str]:
        """Get common questions for event type"""
        return self.common_questions.get(event_type.upper(), [
            "What is this event about?",
            "When and where is it?",
            "How do I register?",
            "Is there a fee?",
            "Who can attend?"
        ])
