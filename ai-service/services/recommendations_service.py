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
        limit: int = 10,
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
        # Note: GYM_SESSION events are already filtered at the backend level
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
        
        # Process ALL events in batches of 20 for better token efficiency
        # This allows us to analyze hundreds of events while managing context size
        batch_size = 20
        all_recommendations = []
        
        print(f"[RECOMMENDATIONS] Processing {len(candidate_events)} events in batches of {batch_size}")
        
        # Process events in batches
        for batch_start in range(0, len(candidate_events), batch_size):
            batch_end = min(batch_start + batch_size, len(candidate_events))
            batch_events = candidate_events[batch_start:batch_end]
            
            print(f"[RECOMMENDATIONS] Processing batch {batch_start//batch_size + 1}: events {batch_start} to {batch_end}")
            
            events_context = self._build_events_context(batch_events)
            batch_recommendations = await self._get_batch_recommendations(
                user_context=user_context,
                events_context=events_context,
                events_to_process=batch_events,
                limit=limit,
                batch_number=batch_start//batch_size + 1,
                total_batches=(len(candidate_events) + batch_size - 1) // batch_size
            )
            
            all_recommendations.extend(batch_recommendations)
        
        # Sort all recommendations by score and take top limit
        all_recommendations.sort(key=lambda x: x.get("score", 0), reverse=True)
        top_recommendations = all_recommendations[:limit]
        
        print(f"[RECOMMENDATIONS] Collected {len(all_recommendations)} recommendations across all batches, returning top {len(top_recommendations)}")
        
        # Enrich recommendations with full event data
        enriched_recs = []
        for rec in top_recommendations:
            event_id = rec.get("event_id")
            # Search in all candidate events
            event_data = next((e for e in candidate_events if e.get("id") == event_id), None)
            if event_data:
                enriched_recs.append({
                    **event_data,
                    "recommendation_score": rec.get("score", 50),
                    "recommendation_reasons": rec.get("reasons", [])
                })
        
        print(f"[RECOMMENDATIONS] Returning {len(enriched_recs)} enriched recommendations")
        
        return {
            "recommendations": enriched_recs,
            "reasoning": f"Analyzed {len(candidate_events)} events and found {len(all_recommendations)} matches. Showing top {len(enriched_recs)} recommendations.",
            "personalization_factors": ["interests", "past_behavior", "quality"]
        }
    
    async def _get_batch_recommendations(
        self,
        user_context: str,
        events_context: str,
        events_to_process: list[dict],
        limit: int,
        batch_number: int,
        total_batches: int
    ) -> list[dict]:
        """Process a single batch of events and return scored recommendations"""
        
        system_prompt = f"""You are an intelligent event recommendation engine for GUC's campus event platform.
Processing batch {batch_number} of {total_batches}.

Your PRIMARY goal: Match users with events that DIRECTLY relate to their stated interests.

CRITICAL SCORING RULES:
1. **Interest Match is KING** (0-50 points): 
   - If user says interests are "fitness, basketball, sports" → ONLY recommend sports/fitness events
   - If user says interests are "programming, AI" → ONLY recommend tech workshops/conferences
   - If user says interests are "art, music, theater" → ONLY recommend creative/arts events
   - DO NOT recommend random events that don't match interests
   
2. **Faculty Alignment** (0-20 points): Events from user's faculty get bonus
3. **Event Quality** (0-15 points): High ratings, good attendance
4. **Past Behavior** (0-15 points): Similar to past attended events

STRICT RULES:
- If an event's description/name does NOT contain keywords related to user's interests → score it LOW (< 50)
- A "Siwa trip" or "Music festival" should NOT be recommended to someone interested in "fitness, basketball, sports"
- A "Nutrition Workshop" or "Basketball Tournament" SHOULD be recommended to fitness enthusiasts
- Be VERY strict about interest matching - it's the most important factor
- Only recommend events scoring >= 70 that truly match interests
- Return ALL matching events from this batch (we'll sort globally later)

INTEREST KEYWORD MATCHING:
- Sports/Fitness interests → Look for: gym, fitness, basketball, football, tournament, sports, wellness, nutrition, health
- Tech interests → Look for: programming, AI, machine learning, web, hackathon, coding, software, tech
- Business interests → Look for: entrepreneurship, startup, business, marketing, finance, networking
- Arts interests → Look for: art, design, photography, music, theater, creative, exhibition

Return ONLY valid JSON (no markdown):
{{
  "recommendations": [
    {{
      "event_id": "string",
      "score": 70-100,
      "reasons": ["SPECIFIC reason why this matches their interests"]
    }}
  ]
}}"""

        user_prompt = f"""Analyze this user and find matching events from this batch:

USER PROFILE:
{user_context}

AVAILABLE EVENTS IN THIS BATCH ({len(events_to_process)} events):
{events_context}

TASK:
1. Review ALL {len(events_to_process)} events in this batch
2. Find events that relate to the user's stated interests
3. Score each matching event (only include events scoring >= 70)
4. Return ALL good matches from this batch

Scoring guide:
- Direct interest match (e.g., "basketball" event for "basketball" interest) → 90-100
- Related interest match (e.g., "nutrition workshop" for "fitness" interest) → 75-89
- Same category (e.g., any workshop for someone who likes learning) → 60-74

IMPORTANT: 
- This is batch {batch_number} of {total_batches}
- Return ALL events from this batch that score >= 70
- Don't limit results - we'll sort globally across all batches

Return ONLY the JSON object (no markdown)."""

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
            return result.get("recommendations", [])
            
        except Exception as e:
            print(f"[RECOMMENDATIONS] Batch {batch_number} error: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _build_user_context(
        self,
        profile: dict,
        history: Optional[dict],
        favorites: Optional[list[str]]
    ) -> str:
        """Build context string for user - interests first!"""
        parts = []
        
        # PUT INTERESTS FIRST - most important for matching
        if profile.get("interests") and len(profile["interests"]) > 0:
            interests_str = ', '.join(profile['interests'])
            parts.append(f"⭐ USER'S INTERESTS (MOST IMPORTANT): {interests_str}")
            parts.append(f"   → Only recommend events related to these topics!")
        else:
            parts.append("⚠️ No specific interests provided - use faculty/role for matching")
        
        parts.append(f"Role: {profile.get('role', 'Unknown')}")
        
        if profile.get("faculty"):
            parts.append(f"Faculty: {profile['faculty']}")
        
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
        """Build context string for events with full descriptions for keyword matching"""
        event_strs = []
        for e in events:
            # Include full description for better keyword matching
            description = e.get('description', '')[:400]  # More description for better matching
            event_str = f"""
EVENT ID: {e.get('id')}
Name: {e.get('name')}
Type: {e.get('type')}
Faculty: {e.get('faculty', 'Open to all')}
Date: {e.get('startDate', 'TBD')}
Full Description: {description}
Rating: {e.get('averageRating', 'N/A')}
---"""
            event_strs.append(event_str.strip())
        
        return "\n".join(event_strs)
    
    async def get_similar_events(
        self,
        event_id: str,
        event_data: dict,
        available_events: list[dict],
        limit: int = 5
    ) -> dict:
        """Find events similar to a given event"""
        
        # Filter out the reference event
        # Note: GYM_SESSION events are already filtered at the backend level
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

        # Process more candidates for better similarity matching (up to 50)
        max_candidates = min(len(candidates), 50)
        events_to_compare = candidates[:max_candidates]
        events_context = self._build_events_context(events_to_compare)
        
        user_prompt = f"""Find events similar to this one:

REFERENCE EVENT:
Name: {event_data.get('name')}
Type: {event_data.get('type')}
Faculty: {event_data.get('faculty', 'All')}
Description: {event_data.get('description', '')[:300]}

CANDIDATE EVENTS ({len(events_to_compare)} events to compare):
{events_context}

Review ALL {len(events_to_compare)} candidate events and find up to {limit} most similar events. Return JSON only."""

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
            # No fallback - fail fast so AI issues are visible
            raise Exception(f"AI similarity analysis failed: {str(e)}")
    
    async def analyze_trending(
        self,
        events: list[dict],
        time_period: str = "week",
        limit: int = 10
    ) -> dict:
        """Analyze trending events"""
        
        # Note: GYM_SESSION events are already filtered at the backend level
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
