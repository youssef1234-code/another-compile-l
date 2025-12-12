"""
AI Description Service

Generates and improves event descriptions using OpenAI.
Supports markdown formatting and various tones.
"""

import os
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage

class DescriptionService:
    """Service for AI-powered event description generation"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def generate_description(
        self,
        event_name: str,
        event_type: str,
        location: str,
        start_date: str,
        end_date: Optional[str] = None,
        basic_info: Optional[str] = None,
        target_audience: Optional[str] = None,
        key_topics: Optional[list[str]] = None,
        professors: Optional[list[str]] = None,
        tone: str = "professional",
        include_markdown: bool = True
    ) -> dict:
        """Generate a compelling event description"""
        
        tone_instructions = {
            "professional": "Use a professional, formal tone suitable for an academic institution.",
            "casual": "Use a friendly, approachable tone that's engaging and easy to read.",
            "academic": "Use an academic tone with precise language appropriate for scholarly events.",
            "exciting": "Use an enthusiastic, energetic tone that creates excitement about the event."
        }
        
        format_instructions = """
Use markdown formatting including:
- **Bold** for key information
- Bullet points for lists
- ### Headers for sections
- > Blockquotes for important notes
""" if include_markdown else "Use plain text without any markdown formatting."
        
        system_prompt = f"""You are an expert event copywriter for the German University in Cairo (GUC).
Your task is to create compelling, informative event descriptions that encourage registration.

{tone_instructions.get(tone, tone_instructions['professional'])}

{format_instructions}

Guidelines:
- Keep descriptions concise but informative (150-300 words)
- Highlight key benefits for attendees
- Include practical details (what they'll learn/experience)
- Create a sense of value and urgency
- Be culturally appropriate for a university setting
- For workshops, emphasize learning outcomes
- For trips, emphasize experience and adventure
- For bazaars, emphasize variety and opportunities
- For conferences, emphasize networking and knowledge
"""

        user_prompt = f"""Create an engaging event description for:

**Event Name:** {event_name}
**Event Type:** {event_type}
**Location:** {location}
**Date:** {start_date}{f' to {end_date}' if end_date else ''}
{f'**Target Audience:** {target_audience}' if target_audience else ''}
{f'**Key Topics:** {", ".join(key_topics)}' if key_topics else ''}
{f'**Professors:** {", ".join(professors)}' if professors else ''}
{f'**Additional Info:** {basic_info}' if basic_info else ''}

Generate a compelling description that will encourage students and staff to register."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            description = response.content
            word_count = len(description.split())
            
            # Generate suggestions
            suggestions = await self._generate_suggestions(event_type, description)
            
            return {
                "description": description,
                "markdown": include_markdown,
                "suggestions": suggestions,
                "word_count": word_count
            }
        except Exception as e:
            raise Exception(f"Failed to generate description: {str(e)}")
    
    async def improve_description(
        self,
        current_description: str,
        event_type: str,
        improvement_focus: str = "engagement",
        tone: str = "professional",
        include_markdown: bool = True
    ) -> dict:
        """Improve an existing event description"""
        
        focus_instructions = {
            "clarity": "Focus on making the description clearer and easier to understand.",
            "engagement": "Focus on making the description more engaging and compelling.",
            "completeness": "Focus on adding missing important information.",
            "formatting": "Focus on improving structure and formatting."
        }
        
        system_prompt = f"""You are an expert editor improving event descriptions for GUC.

Your focus: {focus_instructions.get(improvement_focus, focus_instructions['engagement'])}

Guidelines:
- Preserve the core message and facts
- Enhance readability and appeal
- {'Use markdown formatting' if include_markdown else 'Use plain text'}
- Maintain a {tone} tone
- Keep similar length unless adding crucial info
"""

        user_prompt = f"""Improve this {event_type} event description:

---
{current_description}
---

Provide an improved version with better {improvement_focus}."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            improved = response.content
            word_count = len(improved.split())
            
            return {
                "description": improved,
                "markdown": include_markdown,
                "suggestions": [f"Improved {improvement_focus} of the description"],
                "word_count": word_count
            }
        except Exception as e:
            raise Exception(f"Failed to improve description: {str(e)}")
    
    async def generate_agenda(
        self,
        workshop_name: str,
        duration_hours: float,
        topics: list[str],
        skill_level: str = "intermediate"
    ) -> dict:
        """Generate a workshop agenda"""
        
        system_prompt = """You are an expert workshop facilitator creating detailed agendas.

Create structured agendas with:
- Clear time slots
- Breaks included
- Logical topic progression
- Interactive elements
- Q&A time

Use markdown table format for the schedule."""

        user_prompt = f"""Create a detailed agenda for:

**Workshop:** {workshop_name}
**Duration:** {duration_hours} hours
**Skill Level:** {skill_level}
**Topics to Cover:**
{chr(10).join(f'- {topic}' for topic in topics)}

Include opening, breaks, and closing. Allocate time appropriately."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            agenda = response.content
            
            # Calculate estimated times (simplified)
            total_minutes = duration_hours * 60
            estimated_times = {
                "total": f"{duration_hours} hours",
                "per_topic": f"~{int(total_minutes / (len(topics) + 2))} minutes avg"
            }
            
            return {
                "agenda": agenda,
                "estimated_times": estimated_times
            }
        except Exception as e:
            raise Exception(f"Failed to generate agenda: {str(e)}")
    
    async def get_suggestions(
        self,
        event_type: str,
        current_description: Optional[str] = None
    ) -> list[str]:
        """Get suggestions for event descriptions"""
        
        suggestions_by_type = {
            "WORKSHOP": [
                "Include specific learning outcomes",
                "Mention any prerequisites or required skills",
                "List tools/software participants should have",
                "Add information about certificates",
                "Highlight hands-on activities"
            ],
            "TRIP": [
                "Describe the destination highlights",
                "Include transportation details",
                "Mention what to bring",
                "Add photo opportunities",
                "Include safety information"
            ],
            "BAZAAR": [
                "List vendor categories expected",
                "Mention special activities or entertainment",
                "Include payment methods accepted",
                "Highlight exclusive deals",
                "Add food/refreshment info"
            ],
            "CONFERENCE": [
                "List keynote speakers",
                "Highlight networking opportunities",
                "Include session tracks",
                "Mention industry relevance",
                "Add certificate/CPD info"
            ],
            "GYM_SESSION": [
                "Specify fitness level required",
                "List equipment needed",
                "Include trainer qualifications",
                "Add health precautions",
                "Mention what to wear"
            ]
        }
        
        return suggestions_by_type.get(event_type, [
            "Add clear event objectives",
            "Include target audience",
            "Specify what participants will gain",
            "Add contact information",
            "Include any requirements"
        ])
    
    async def _generate_suggestions(self, event_type: str, description: str) -> list[str]:
        """Generate improvement suggestions based on current description"""
        base_suggestions = await self.get_suggestions(event_type)
        
        # Check what's missing
        suggestions = []
        lower_desc = description.lower()
        
        if "learn" not in lower_desc and "gain" not in lower_desc:
            suggestions.append("Consider adding learning outcomes or benefits")
        
        if "register" not in lower_desc and "sign up" not in lower_desc:
            suggestions.append("Add a clear call to action")
        
        if len(description) < 100:
            suggestions.append("Consider adding more details about the event")
        
        # Add some type-specific suggestions
        suggestions.extend(base_suggestions[:2])
        
        return suggestions[:5]  # Return top 5 suggestions
