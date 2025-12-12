"""
Smart Event Recommendations Service

AI-powered personalized event recommendations using:
- Content-based filtering (event similarities)
- User preference analysis
- Collaborative signals (faculty/role patterns)
"""

import os
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

class RecommendationsService:
    """Service for AI-powered event recommendations"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.3,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def get_personalized_recommendations(
        self,
        user_profile: dict,
        registration_history: Optional[dict] = None,
        favorite_event_ids: Optional[list[str]] = None,
        available_events: list[dict] = None,
        limit: int = 5,
        exclude_registered: bool = True
    ) -> dict:
        """Generate personalized event recommendations"""
        
        if not available_events:
            return {
                "recommendations": [],
                "reasoning": "No events available",
                "personalization_factors": []
            }
        
        # Extract registered event IDs
        registered_ids = set()
        if registration_history and registration_history.get("event_ids"):
            registered_ids = set(registration_history["event_ids"])
        
        # Filter out registered events if requested
        candidate_events = available_events
        if exclude_registered:
            candidate_events = [
                e for e in available_events 
                if e.get("id") not in registered_ids
            ]
        
        if not candidate_events:
            return {
                "recommendations": [],
                "reasoning": "No new events available (you may already be registered for all)",
                "personalization_factors": []
            }
        
        # Build user context for AI
        user_context = self._build_user_context(user_profile, registration_history, favorite_event_ids)
        events_context = self._build_events_context(candidate_events[:20])  # Limit for token efficiency
        
        system_prompt = """You are an AI recommendation engine for GUC's event management platform.
Your task is to recommend the most relevant events for a user based on their profile and history.

Consider:
1. User's faculty and role
2. Past event types they attended
3. Ratings they gave to events
4. Their stated interests
5. Event popularity and relevance

Return a JSON object with:
- recommendations: array of {event_id, score, reasons} sorted by relevance (0-100 score)
- personalization_factors: array of factors you considered
- reasoning: brief explanation of your recommendation logic"""

        user_prompt = f"""Recommend events for this user:

USER PROFILE:
{user_context}

AVAILABLE EVENTS:
{events_context}

Recommend up to {limit} events. Return JSON only."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            import json
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            
            # Enrich recommendations with full event data
            enriched_recs = []
            for rec in result.get("recommendations", [])[:limit]:
                event_id = rec.get("event_id")
                event_data = next((e for e in candidate_events if e.get("id") == event_id), None)
                if event_data:
                    enriched_recs.append({
                        **event_data,
                        "recommendation_score": rec.get("score", 50),
                        "recommendation_reasons": rec.get("reasons", [])
                    })
            
            return {
                "recommendations": enriched_recs,
                "reasoning": result.get("reasoning", "Based on your profile and interests"),
                "personalization_factors": result.get("personalization_factors", [])
            }
            
        except Exception as e:
            print(f"Recommendation error: {e}")
            # Fallback: simple rule-based recommendations
            return self._fallback_recommendations(
                user_profile, candidate_events, limit
            )
    
    def _build_user_context(
        self,
        profile: dict,
        history: Optional[dict],
        favorites: Optional[list[str]]
    ) -> str:
        """Build context string for user"""
        parts = [
            f"Role: {profile.get('role', 'Unknown')}",
            f"User ID: {profile.get('user_id', 'Unknown')}"
        ]
        
        if profile.get("faculty"):
            parts.append(f"Faculty: {profile['faculty']}")
        
        if profile.get("interests"):
            parts.append(f"Interests: {', '.join(profile['interests'])}")
        
        if history:
            if history.get("event_types"):
                parts.append(f"Previously attended event types: {', '.join(history['event_types'])}")
            if history.get("rated_events"):
                high_rated = [k for k, v in history["rated_events"].items() if v >= 4]
                if high_rated:
                    parts.append(f"Highly rated events: {len(high_rated)}")
        
        if favorites:
            parts.append(f"Favorited events: {len(favorites)}")
        
        return "\n".join(parts)
    
    def _build_events_context(self, events: list[dict]) -> str:
        """Build context string for events"""
        event_strs = []
        for e in events:
            event_str = f"""
ID: {e.get('id')}
Name: {e.get('name')}
Type: {e.get('type')}
Faculty: {e.get('faculty', 'All')}
Date: {e.get('startDate', 'TBD')}
Description: {e.get('description', '')[:200]}
Rating: {e.get('averageRating', 'N/A')}
"""
            event_strs.append(event_str.strip())
        
        return "\n---\n".join(event_strs)
    
    def _fallback_recommendations(
        self,
        user_profile: dict,
        events: list[dict],
        limit: int
    ) -> dict:
        """Simple fallback recommendations"""
        scored_events = []
        
        for event in events:
            score = 50  # Base score
            reasons = []
            
            # Faculty match
            if user_profile.get("faculty") and event.get("faculty") == user_profile["faculty"]:
                score += 20
                reasons.append("Matches your faculty")
            
            # Role match
            if user_profile.get("role") == "PROFESSOR" and event.get("type") == "WORKSHOP":
                score += 15
                reasons.append("Workshops for professors")
            elif user_profile.get("role") == "STUDENT" and event.get("type") in ["TRIP", "BAZAAR"]:
                score += 10
                reasons.append("Popular with students")
            
            # High rating
            if event.get("averageRating") and event["averageRating"] >= 4:
                score += 15
                reasons.append("Highly rated")
            
            scored_events.append({
                **event,
                "recommendation_score": min(score, 100),
                "recommendation_reasons": reasons
            })
        
        # Sort by score
        scored_events.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        return {
            "recommendations": scored_events[:limit],
            "reasoning": "Based on your faculty and role preferences",
            "personalization_factors": ["faculty", "role", "event_ratings"]
        }
    
    async def get_similar_events(
        self,
        event_id: str,
        event_data: dict,
        available_events: list[dict],
        limit: int = 5
    ) -> dict:
        """Find events similar to a given event"""
        
        # Filter out the reference event
        candidates = [e for e in available_events if e.get("id") != event_id]
        
        if not candidates:
            return {"similar_events": [], "similarity_factors": []}
        
        system_prompt = """You are analyzing event similarity for a university event platform.
Given a reference event and a list of candidate events, identify the most similar ones.

Consider:
- Event type
- Faculty/department
- Topic/description overlap
- Target audience
- Timing similarity

Return JSON: {similar_events: [{event_id, similarity_score, reasons}], similarity_factors: []}"""

        events_context = self._build_events_context(candidates[:15])
        
        user_prompt = f"""Find events similar to this one:

REFERENCE EVENT:
Name: {event_data.get('name')}
Type: {event_data.get('type')}
Faculty: {event_data.get('faculty', 'All')}
Description: {event_data.get('description', '')[:300]}

CANDIDATE EVENTS:
{events_context}

Find up to {limit} similar events. Return JSON only."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            import json
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            
            # Enrich with full event data
            enriched = []
            for item in result.get("similar_events", [])[:limit]:
                event = next((e for e in candidates if e.get("id") == item.get("event_id")), None)
                if event:
                    enriched.append({
                        **event,
                        "similarity_score": item.get("similarity_score", 50),
                        "similarity_reasons": item.get("reasons", [])
                    })
            
            return {
                "similar_events": enriched,
                "similarity_factors": result.get("similarity_factors", [])
            }
            
        except Exception as e:
            print(f"Similarity error: {e}")
            # Simple fallback: same type
            same_type = [e for e in candidates if e.get("type") == event_data.get("type")][:limit]
            return {
                "similar_events": same_type,
                "similarity_factors": ["event_type"]
            }
    
    async def analyze_trending(
        self,
        events: list[dict],
        time_period: str = "week",
        limit: int = 10
    ) -> dict:
        """Analyze trending events"""
        
        # Sort by registration count or engagement
        sorted_events = sorted(
            events,
            key=lambda x: x.get("registrationCount", 0),
            reverse=True
        )
        
        trending = []
        for i, event in enumerate(sorted_events[:limit]):
            trending.append({
                **event,
                "rank": i + 1,
                "momentum": "high" if i < 3 else "medium" if i < 7 else "growing"
            })
        
        return {
            "trending_events": trending,
            "time_period": time_period,
            "analysis": f"Top {limit} events by registration activity"
        }
    
    async def explain_recommendation(
        self,
        event_id: str,
        event_data: dict,
        user_profile: dict
    ) -> str:
        """Generate human-readable explanation for a recommendation"""
        
        prompt = f"""Explain in 2-3 sentences why this event would be good for this user:

Event: {event_data.get('name')} ({event_data.get('type')})
Description: {event_data.get('description', '')[:200]}

User: {user_profile.get('role')} from {user_profile.get('faculty', 'GUC')}

Be specific and personal."""

        try:
            response = await self.llm.ainvoke([
                HumanMessage(content=prompt)
            ])
            return response.content
        except Exception as e:
            return f"This {event_data.get('type', 'event').lower()} matches your interests and is popular among {user_profile.get('role', 'students').lower()}s."
    
    async def get_popular_by_faculty(
        self,
        faculty: str,
        limit: int = 5
    ) -> dict:
        """Get popular events for a faculty (placeholder for DB integration)"""
        return {
            "faculty": faculty,
            "popular_events": [],
            "message": "Integrate with backend to fetch actual data"
        }
