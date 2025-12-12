"""
AI Comment Moderation Service

Multi-layer content moderation using:
1. better-profanity for fast local profanity detection (multi-language)
2. OpenAI for contextual analysis of nuanced cases

Detects: profanity, hate speech, harassment, spam, inappropriate content
"""

import os
import re
from typing import Optional, Literal
from better_profanity import profanity
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage

class ModerationService:
    """Service for AI-powered comment moderation"""
    
    def __init__(self):
        # Initialize profanity filter
        profanity.load_censor_words()
        
        # Initialize LLM for contextual analysis
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0,  # Deterministic for moderation
            api_key=os.getenv("OPENAI_API_KEY")
        )
        
        self.threshold = float(os.getenv("MODERATION_THRESHOLD", "0.7"))
        self.auto_flag_threshold = float(os.getenv("AUTO_FLAG_THRESHOLD", "0.9"))
        
        # Common spam patterns
        self.spam_patterns = [
            r'(buy|click|free|win|winner|prize|offer|discount|sale).*\b(now|today|limited)\b',
            r'http[s]?://(?![^\s]*guc)',  # External links (not GUC)
            r'(.)\1{4,}',  # Repeated characters
            r'\b(dm|message|contact)\s+me\b',
        ]
    
    async def moderate_comment(
        self,
        comment: str,
        comment_id: Optional[str] = None,
        event_id: Optional[str] = None,
        user_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> dict:
        """
        Moderate a single comment through multiple layers
        
        Returns:
            ModerationResult with is_appropriate, confidence, flags, severity
        """
        flags = []
        severity = "none"
        confidence = 1.0
        detected_issues = {}
        
        # Layer 1: Fast local profanity check
        profanity_result = self._check_profanity(comment)
        if profanity_result["contains_profanity"]:
            flags.append("profanity")
            detected_issues["profanity"] = profanity_result
            severity = self._escalate_severity(severity, "medium")
        
        # Layer 2: Spam detection
        spam_result = self._check_spam(comment)
        if spam_result["is_spam"]:
            flags.append("spam")
            detected_issues["spam"] = spam_result
            severity = self._escalate_severity(severity, "low")
        
        # Layer 3: LLM contextual analysis (for longer comments or when basic checks pass)
        if len(comment) > 20 or not flags:
            llm_result = await self._llm_analysis(comment, context)
            
            if llm_result.get("toxicity", 0) > self.threshold:
                flags.append("toxicity")
                detected_issues["toxicity"] = {"score": llm_result["toxicity"]}
                severity = self._escalate_severity(severity, "high")
            
            if llm_result.get("harassment", 0) > self.threshold:
                flags.append("harassment")
                detected_issues["harassment"] = {"score": llm_result["harassment"]}
                severity = self._escalate_severity(severity, "critical")
            
            if llm_result.get("hate_speech", 0) > self.threshold:
                flags.append("hate_speech")
                detected_issues["hate_speech"] = {"score": llm_result["hate_speech"]}
                severity = self._escalate_severity(severity, "critical")
            
            if llm_result.get("inappropriate", 0) > self.threshold:
                flags.append("inappropriate")
                detected_issues["inappropriate"] = {"score": llm_result["inappropriate"]}
                severity = self._escalate_severity(severity, "medium")
            
            confidence = llm_result.get("confidence", 0.8)
        
        # Determine if appropriate
        is_appropriate = len(flags) == 0
        
        # Generate suggestion
        suggestion = self._generate_suggestion(flags, severity)
        
        return {
            "is_appropriate": is_appropriate,
            "confidence": confidence,
            "flags": flags,
            "severity": severity,
            "suggestion": suggestion,
            "detected_issues": detected_issues if detected_issues else None
        }
    
    def _check_profanity(self, text: str) -> dict:
        """Fast local profanity check"""
        contains = profanity.contains_profanity(text)
        censored = profanity.censor(text) if contains else text
        
        return {
            "contains_profanity": contains,
            "censored_text": censored,
            "method": "better-profanity"
        }
    
    def _check_spam(self, text: str) -> dict:
        """Check for spam patterns"""
        text_lower = text.lower()
        matches = []
        
        for pattern in self.spam_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                matches.append(pattern)
        
        # Check for excessive caps
        if len(text) > 10:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.5:
                matches.append("excessive_caps")
        
        return {
            "is_spam": len(matches) > 0,
            "patterns_matched": matches
        }
    
    async def _llm_analysis(self, text: str, context: Optional[str] = None) -> dict:
        """Deep LLM analysis for nuanced content"""
        
        system_prompt = """You are a content moderation expert for a university event platform.
Analyze the following comment and rate it on these dimensions (0.0 to 1.0):

- toxicity: General toxic/negative content
- harassment: Targeting individuals or groups
- hate_speech: Discriminatory language based on protected characteristics
- inappropriate: Content inappropriate for a university setting
- confidence: Your confidence in this assessment

Consider context: This is a university event feedback system. Students and staff can rate and comment on events they attended.

Respond ONLY with a JSON object containing the scores."""

        user_prompt = f"""Analyze this comment:
"{text}"

{f'Context: {context}' if context else ''}

Return JSON with toxicity, harassment, hate_speech, inappropriate, and confidence scores (0.0-1.0)."""

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ])
            
            # Parse response
            import json
            content = response.content.strip()
            # Handle markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            
            result = json.loads(content)
            return result
        except Exception as e:
            print(f"LLM analysis error: {e}")
            return {
                "toxicity": 0.0,
                "harassment": 0.0,
                "hate_speech": 0.0,
                "inappropriate": 0.0,
                "confidence": 0.5
            }
    
    def _escalate_severity(self, current: str, new: str) -> str:
        """Escalate severity level"""
        levels = ["none", "low", "medium", "high", "critical"]
        current_idx = levels.index(current)
        new_idx = levels.index(new)
        return levels[max(current_idx, new_idx)]
    
    def _generate_suggestion(self, flags: list, severity: str) -> Optional[str]:
        """Generate action suggestion based on flags and severity"""
        if not flags:
            return None
        
        if severity == "critical":
            return "Immediately hide this comment and review user account"
        elif severity == "high":
            return "Hide comment and notify user about community guidelines"
        elif severity == "medium":
            return "Review comment manually before taking action"
        elif severity == "low":
            return "Monitor user for repeated violations"
        
        return "Review for potential issues"
    
    async def moderate_batch(
        self,
        comments: list[dict],
        event_id: Optional[str] = None
    ) -> dict:
        """Moderate multiple comments efficiently"""
        results = []
        flagged_count = 0
        
        for comment_data in comments:
            result = await self.moderate_comment(
                comment=comment_data.get("text", ""),
                comment_id=comment_data.get("id"),
                event_id=event_id
            )
            
            results.append({
                "id": comment_data.get("id"),
                "result": result
            })
            
            if not result["is_appropriate"]:
                flagged_count += 1
        
        return {
            "total": len(comments),
            "flagged": flagged_count,
            "results": results
        }
    
    async def analyze_content(
        self,
        text: str,
        analysis_type: str = "full"
    ) -> dict:
        """Deep content analysis"""
        
        # Get LLM analysis
        llm_result = await self._llm_analysis(text)
        
        # Determine sentiment
        if llm_result.get("toxicity", 0) < 0.3:
            sentiment = "positive" if len(text) < 50 else "neutral"
        elif llm_result.get("toxicity", 0) < 0.6:
            sentiment = "neutral"
        else:
            sentiment = "negative"
        
        # Calculate toxicity score (weighted average)
        toxicity_score = (
            llm_result.get("toxicity", 0) * 0.3 +
            llm_result.get("harassment", 0) * 0.3 +
            llm_result.get("hate_speech", 0) * 0.25 +
            llm_result.get("inappropriate", 0) * 0.15
        )
        
        summary = self._generate_analysis_summary(llm_result, sentiment)
        
        return {
            "toxicity_score": round(toxicity_score, 3),
            "sentiment": sentiment,
            "categories": llm_result,
            "summary": summary
        }
    
    def _generate_analysis_summary(self, scores: dict, sentiment: str) -> str:
        """Generate human-readable analysis summary"""
        issues = []
        
        if scores.get("toxicity", 0) > 0.5:
            issues.append("toxic language")
        if scores.get("harassment", 0) > 0.5:
            issues.append("harassment")
        if scores.get("hate_speech", 0) > 0.5:
            issues.append("hate speech")
        if scores.get("inappropriate", 0) > 0.5:
            issues.append("inappropriate content")
        
        if not issues:
            return f"Content appears appropriate with {sentiment} sentiment."
        
        return f"Content flagged for: {', '.join(issues)}. Overall sentiment: {sentiment}."
    
    async def get_stats(self, event_id: Optional[str] = None) -> dict:
        """Get moderation statistics (placeholder for database integration)"""
        return {
            "total_moderated": 0,
            "flagged_count": 0,
            "severity_breakdown": {
                "critical": 0,
                "high": 0,
                "medium": 0,
                "low": 0
            },
            "common_flags": [],
            "event_id": event_id
        }
    
    async def report_comment(
        self,
        comment_id: str,
        reason: str,
        reporter_id: str,
        additional_info: Optional[str] = None
    ) -> dict:
        """Handle user reports (placeholder for database integration)"""
        return {
            "report_id": f"report_{comment_id}_{reporter_id}",
            "status": "received",
            "message": "Thank you for reporting. Our team will review this comment."
        }
