"""
Background Polling Service

Periodically fetches unmoderated comments from the backend
and processes them through AI moderation.
"""

import os
import asyncio
import httpx
from typing import Optional
from datetime import datetime

from services.moderation_service import ModerationService

class PollingService:
    """Service for polling and processing unmoderated comments"""
    
    def __init__(self):
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:5000")
        self.poll_interval = int(os.getenv("MODERATION_POLL_INTERVAL", "60"))  # seconds
        self.batch_size = int(os.getenv("MODERATION_BATCH_SIZE", "50"))
        self.moderation_service = ModerationService()
        self._running = False
        self._task: Optional[asyncio.Task] = None
        
    async def start(self):
        """Start the background polling task"""
        if self._running:
            print("⚠️ Polling service already running")
            return
            
        self._running = True
        self._task = asyncio.create_task(self._poll_loop())
        print(f"🔄 Moderation polling service started (interval: {self.poll_interval}s)")
        
    async def stop(self):
        """Stop the background polling task"""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("⏹️ Moderation polling service stopped")
        
    async def _poll_loop(self):
        """Main polling loop"""
        while self._running:
            try:
                await self._process_unmoderated_comments()
            except Exception as e:
                print(f"❌ Polling error: {e}")
            
            # Wait for next poll interval
            await asyncio.sleep(self.poll_interval)
    
    async def _process_unmoderated_comments(self):
        """Fetch and process unmoderated comments"""
        print(f"\n🔍 [{datetime.now().strftime('%H:%M:%S')}] Checking for unmoderated comments...")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                # Fetch unmoderated comments from backend
                # Using a direct REST endpoint instead of tRPC for simplicity
                response = await client.get(
                    f"{self.backend_url}/api/feedback/unmoderated",
                    params={"limit": self.batch_size}
                )
                
                if response.status_code != 200:
                    print(f"⚠️ Failed to fetch unmoderated comments: {response.status_code}")
                    return
                
                data = response.json()
                comments = data.get("comments", [])
                total = data.get("total", 0)
                
                if not comments:
                    print("✅ No unmoderated comments found")
                    return
                
                print(f"📝 Processing {len(comments)} unmoderated comments (total pending: {total})")
                
                # Process each comment through moderation
                results = []
                for comment in comments:
                    try:
                        moderation_result = await self.moderation_service.moderate_comment(
                            comment=comment["content"],
                            comment_id=comment["id"],
                            event_id=comment.get("eventId"),
                            user_id=comment.get("userId"),
                            context=f"Event: {comment.get('eventName', 'Unknown')}"
                        )
                        
                        # Determine AI suggestion
                        ai_suggestion = "approve" if moderation_result["is_appropriate"] else "remove"
                        
                        # Generate reasoning
                        ai_reasoning = None
                        if moderation_result["flags"]:
                            ai_reasoning = f"Detected issues: {', '.join(moderation_result['flags'])}. {moderation_result.get('suggestion', '')}"
                        
                        results.append({
                            "feedbackId": comment["id"],
                            "isAppropriate": moderation_result["is_appropriate"],
                            "flags": moderation_result["flags"],
                            "severity": moderation_result["severity"],
                            "confidence": moderation_result["confidence"],
                            "aiSuggestion": ai_suggestion,
                            "aiReasoning": ai_reasoning,
                        })
                        
                        # Log flagged comments
                        if not moderation_result["is_appropriate"]:
                            print(f"  🚩 Flagged: '{comment['content'][:50]}...' - {moderation_result['severity']} ({', '.join(moderation_result['flags'])})")
                        
                    except Exception as e:
                        print(f"  ❌ Error processing comment {comment['id']}: {e}")
                
                # Send results back to backend
                if results:
                    update_response = await client.post(
                        f"{self.backend_url}/api/feedback/batch-moderation",
                        json={"results": results}
                    )
                    
                    if update_response.status_code == 200:
                        update_data = update_response.json()
                        print(f"✅ Updated {update_data.get('updated', 0)} comments, {update_data.get('failed', 0)} failed")
                    else:
                        print(f"⚠️ Failed to update moderation results: {update_response.status_code}")
                        
            except httpx.RequestError as e:
                print(f"❌ Network error: {e}")
            except Exception as e:
                print(f"❌ Unexpected error: {e}")
    
    async def process_single(self, comment_id: str, content: str, event_name: str = "Unknown"):
        """Process a single comment immediately (for real-time moderation)"""
        try:
            result = await self.moderation_service.moderate_comment(
                comment=content,
                comment_id=comment_id,
                context=f"Event: {event_name}"
            )
            return result
        except Exception as e:
            print(f"❌ Error processing single comment: {e}")
            return None


# Singleton instance
polling_service = PollingService()
