"""
AI Analytics Insights Service

Generates natural language insights from event data using LangGraph.
Provides actionable insights for Admin/Event Office dashboard.
"""

import os
from typing import Optional, Literal
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

class AnalyticsService:
    """Service for AI-powered analytics and insights"""
    
    def __init__(self):
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.4,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def generate_event_insights(
        self,
        event_id: str,
        event_data: dict,
        registrations: list[dict],
        feedback: list[dict],
        include_recommendations: bool = True
    ) -> dict:
        """Generate comprehensive insights for an event"""
        
        # Calculate metrics
        metrics = self._calculate_metrics(event_data, registrations, feedback)
        
        # Analyze feedback sentiment
        sentiment_analysis = None
        if feedback:
            sentiment_analysis = await self._analyze_sentiment(feedback)
        
        # Generate AI insights
        insights = await self._generate_insights(
            event_data, metrics, sentiment_analysis, include_recommendations
        )
        
        return {
            "summary": insights.get("summary", ""),
            "key_metrics": metrics,
            "trends": insights.get("trends", []),
            "sentiment_analysis": sentiment_analysis,
            "recommendations": insights.get("recommendations", []) if include_recommendations else [],
            "highlights": insights.get("highlights", []),
            "concerns": insights.get("concerns", [])
        }
    
    def _calculate_metrics(
        self,
        event_data: dict,
        registrations: list[dict],
        feedback: list[dict]
    ) -> dict:
        """Calculate key performance metrics"""
        
        capacity = event_data.get("capacity", 0)
        total_registrations = len(registrations)
        confirmed = len([r for r in registrations if r.get("status") == "CONFIRMED"])
        cancelled = len([r for r in registrations if r.get("status") == "CANCELLED"])
        
        # Rating stats
        ratings = [f.get("rating") for f in feedback if f.get("rating")]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
        
        # Fill rate
        fill_rate = (confirmed / capacity * 100) if capacity > 0 else 0
        
        return {
            "total_registrations": total_registrations,
            "confirmed_registrations": confirmed,
            "cancelled_registrations": cancelled,
            "capacity": capacity,
            "fill_rate": round(fill_rate, 1),
            "average_rating": round(avg_rating, 2) if avg_rating else None,
            "total_ratings": len(ratings),
            "total_comments": len([f for f in feedback if f.get("comment")]),
            "cancellation_rate": round(cancelled / total_registrations * 100, 1) if total_registrations > 0 else 0
        }
    
    async def _analyze_sentiment(self, feedback: list[dict]) -> dict:
        """Analyze sentiment of feedback comments"""
        
        comments = [f.get("comment", "") for f in feedback if f.get("comment")]
        ratings = [f.get("rating") for f in feedback if f.get("rating")]
        
        if not comments and not ratings:
            return {
                "overall": "neutral",
                "positive_ratio": 0,
                "negative_ratio": 0,
                "neutral_ratio": 1
            }
        
        # Simple rating-based sentiment
        positive = len([r for r in ratings if r >= 4])
        negative = len([r for r in ratings if r <= 2])
        neutral = len([r for r in ratings if r == 3])
        total = len(ratings) or 1
        
        positive_ratio = positive / total
        negative_ratio = negative / total
        
        overall = "positive" if positive_ratio > 0.6 else "negative" if negative_ratio > 0.4 else "neutral"
        
        return {
            "overall": overall,
            "positive_ratio": round(positive_ratio, 2),
            "negative_ratio": round(negative_ratio, 2),
            "neutral_ratio": round(neutral / total, 2),
            "sample_size": len(ratings)
        }
    
    async def _generate_insights(
        self,
        event_data: dict,
        metrics: dict,
        sentiment: Optional[dict],
        include_recommendations: bool
    ) -> dict:
        """Generate AI-powered insights"""
        
        system_prompt = """You are an analytics expert for a university event platform.
Generate concise, actionable insights from event data.

Your response should be JSON with:
- summary: 2-3 sentence executive summary
- trends: array of observed trends (strings)
- highlights: array of positive highlights
- concerns: array of areas of concern
- recommendations: array of actionable suggestions (if requested)

Be specific and data-driven. Focus on actionable insights."""

        context = f"""
Event: {event_data.get('name')} ({event_data.get('type')})

METRICS:
- Registrations: {metrics['total_registrations']} ({metrics['confirmed_registrations']} confirmed)
- Fill Rate: {metrics['fill_rate']}%
- Average Rating: {metrics['average_rating'] or 'No ratings yet'}
- Cancellation Rate: {metrics['cancellation_rate']}%
- Comments: {metrics['total_comments']}

SENTIMENT: {sentiment.get('overall', 'N/A') if sentiment else 'No feedback yet'}
{f"Positive: {sentiment['positive_ratio']*100:.0f}%" if sentiment else ''}

Generate insights. {'Include recommendations.' if include_recommendations else 'Skip recommendations.'}"""

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
            print(f"Insights generation error: {e}")
            return {
                "summary": f"{event_data.get('name')} has {metrics['confirmed_registrations']} confirmed registrations.",
                "trends": [],
                "highlights": [f"{metrics['fill_rate']}% fill rate"] if metrics['fill_rate'] > 50 else [],
                "concerns": [f"High cancellation rate ({metrics['cancellation_rate']}%)"] if metrics['cancellation_rate'] > 20 else [],
                "recommendations": []
            }
    
    async def generate_dashboard_insights(
        self,
        events: list[dict],
        time_period: str = "month",
        focus_areas: Optional[list[str]] = None
    ) -> dict:
        """Generate platform-wide dashboard insights"""
        
        if not events:
            return {
                "overview": "No events data available for analysis.",
                "performance_summary": {},
                "top_performers": [],
                "areas_for_improvement": [],
                "predictions": None,
                "action_items": []
            }
        
        # Aggregate metrics
        total_events = len(events)
        total_registrations = sum(e.get("registrationCount", 0) for e in events)
        avg_fill_rate = sum(e.get("fillRate", 0) for e in events) / total_events if total_events > 0 else 0
        
        # Find top performers
        sorted_by_registrations = sorted(
            events, 
            key=lambda x: x.get("registrationCount", 0), 
            reverse=True
        )
        top_performers = sorted_by_registrations[:3]
        
        # Event type breakdown
        type_counts = {}
        for e in events:
            t = e.get("type", "OTHER")
            type_counts[t] = type_counts.get(t, 0) + 1
        
        system_prompt = """You are a strategic analytics advisor for a university event platform.
Provide high-level insights for administrators.

Return JSON with:
- overview: 2-3 sentence platform overview
- top_insights: array of key insights
- areas_for_improvement: array of suggestions
- action_items: array of specific actions to take
- predictions: object with expected trends"""

        context = f"""
PLATFORM OVERVIEW ({time_period}):
- Total Events: {total_events}
- Total Registrations: {total_registrations}
- Average Fill Rate: {avg_fill_rate:.1f}%
- Event Type Breakdown: {type_counts}

TOP PERFORMING EVENTS:
{chr(10).join(f"- {e.get('name')}: {e.get('registrationCount', 0)} registrations" for e in top_performers)}

Generate strategic insights."""

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
            
            result = json.loads(content)
            
            return {
                "overview": result.get("overview", ""),
                "performance_summary": {
                    "total_events": total_events,
                    "total_registrations": total_registrations,
                    "average_fill_rate": round(avg_fill_rate, 1),
                    "event_types": type_counts
                },
                "top_performers": [{"name": e.get("name"), "registrations": e.get("registrationCount", 0)} for e in top_performers],
                "areas_for_improvement": result.get("areas_for_improvement", []),
                "predictions": result.get("predictions"),
                "action_items": result.get("action_items", [])
            }
            
        except Exception as e:
            print(f"Dashboard insights error: {e}")
            return {
                "overview": f"Platform has {total_events} events with {total_registrations} total registrations.",
                "performance_summary": {
                    "total_events": total_events,
                    "total_registrations": total_registrations,
                    "average_fill_rate": round(avg_fill_rate, 1),
                    "event_types": type_counts
                },
                "top_performers": [{"name": e.get("name"), "registrations": e.get("registrationCount", 0)} for e in top_performers],
                "areas_for_improvement": [],
                "predictions": None,
                "action_items": []
            }
    
    async def analyze_feedback(
        self,
        event_id: str,
        feedback: list[dict],
        analysis_depth: str = "standard"
    ) -> dict:
        """Deep feedback analysis"""
        
        if not feedback:
            return {
                "overall_sentiment": "neutral",
                "sentiment_score": 0,
                "rating_analysis": {"average": None, "distribution": {}},
                "common_themes": [],
                "notable_comments": [],
                "improvement_suggestions": [],
                "summary": "No feedback available for analysis."
            }
        
        # Rating analysis
        ratings = [f.get("rating") for f in feedback if f.get("rating")]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        
        distribution = {}
        for r in ratings:
            distribution[str(r)] = distribution.get(str(r), 0) + 1
        
        comments = [f.get("comment", "") for f in feedback if f.get("comment")]
        
        # Sentiment score (-1 to 1)
        sentiment_score = (avg_rating - 3) / 2 if avg_rating else 0
        
        overall_sentiment = (
            "very_positive" if sentiment_score > 0.6 else
            "positive" if sentiment_score > 0.2 else
            "neutral" if sentiment_score > -0.2 else
            "negative" if sentiment_score > -0.6 else
            "very_negative"
        )
        
        # LLM analysis for themes (if we have comments)
        themes = []
        notable = []
        suggestions = []
        
        if comments and analysis_depth in ["standard", "deep"]:
            analysis = await self._analyze_comments(comments, analysis_depth)
            themes = analysis.get("themes", [])
            notable = analysis.get("notable_comments", [])
            suggestions = analysis.get("suggestions", [])
        
        summary = f"Event received {len(ratings)} ratings with an average of {avg_rating:.1f}/5. "
        summary += f"Overall sentiment is {overall_sentiment.replace('_', ' ')}."
        
        return {
            "overall_sentiment": overall_sentiment,
            "sentiment_score": round(sentiment_score, 2),
            "rating_analysis": {
                "average": round(avg_rating, 2) if avg_rating else None,
                "distribution": distribution,
                "total": len(ratings)
            },
            "common_themes": themes,
            "notable_comments": notable,
            "improvement_suggestions": suggestions,
            "summary": summary
        }
    
    async def _analyze_comments(self, comments: list[str], depth: str) -> dict:
        """Analyze comment content for themes"""
        
        sample = comments[:20] if depth == "standard" else comments[:50]
        
        system_prompt = """Analyze these event feedback comments.
Return JSON with:
- themes: array of {theme: string, frequency: string, sentiment: string}
- notable_comments: array of {comment: string, type: "positive"|"negative"|"constructive"}
- suggestions: array of improvement suggestions based on feedback"""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Comments to analyze:\n{chr(10).join(f'- {c}' for c in sample)}")
            ])
            
            import json
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            return json.loads(content)
            
        except Exception as e:
            print(f"Comment analysis error: {e}")
            return {"themes": [], "notable_comments": [], "suggestions": []}
    
    async def compare_events(
        self,
        events: list[dict],
        comparison_aspects: Optional[list[str]] = None
    ) -> dict:
        """Compare multiple events"""
        
        if len(events) < 2:
            return {"error": "Need at least 2 events to compare"}
        
        aspects = comparison_aspects or ["registrations", "ratings", "engagement"]
        
        comparison = {
            "events": [e.get("name") for e in events],
            "metrics_comparison": {},
            "winner_by_aspect": {},
            "summary": ""
        }
        
        # Compare each metric
        for aspect in aspects:
            values = []
            for e in events:
                if aspect == "registrations":
                    values.append(e.get("registrationCount", 0))
                elif aspect == "ratings":
                    values.append(e.get("averageRating", 0))
                else:
                    values.append(0)
            
            comparison["metrics_comparison"][aspect] = dict(zip(
                [e.get("name") for e in events], values
            ))
            
            if values:
                max_idx = values.index(max(values))
                comparison["winner_by_aspect"][aspect] = events[max_idx].get("name")
        
        comparison["summary"] = f"Compared {len(events)} events across {len(aspects)} aspects."
        
        return comparison
    
    async def generate_report(
        self,
        event_ids: list[str],
        report_type: str = "summary",
        format: str = "markdown"
    ) -> dict:
        """Generate formatted report"""
        
        # Placeholder - would integrate with backend to fetch actual data
        return {
            "report": f"# Event Report\n\nReport type: {report_type}\nEvents: {len(event_ids)}\n\n*Data would be fetched from backend*",
            "format": format,
            "generated_at": "2024-01-01T00:00:00Z"
        }
    
    async def get_quick_stats(self, event_id: str) -> dict:
        """Quick stats summary"""
        return {
            "event_id": event_id,
            "quick_summary": "Integrate with backend to fetch real-time stats",
            "status": "placeholder"
        }
