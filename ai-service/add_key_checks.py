"""
Script to add require_openai_key() checks to all AI endpoint functions
"""
import re
import os

files_to_update = [
    ("C:\\Users\\youss\\Desktop\\ACL-NEW\\temp-mirror\\another-compile-l\\ai-service\\routers\\recommendations_router.py", [
        "personalized", "similar", "trending", "explain"
    ]),
    ("C:\\Users\\youss\\Desktop\\ACL-NEW\\temp-mirror\\another-compile-l\\ai-service\\routers\\analytics_router.py", [
        "event-insights", "dashboard-insights", "feedback-analysis", "compare-events", "generate-report"
    ]),
    ("C:\\Users\\youss\\Desktop\\ACL-NEW\\temp-mirror\\another-compile-l\\ai-service\\routers\\chatbot_router.py", [
        "ask", "generate-faq", "quick-answer", "suggest-questions", "summarize-event"
    ]),
    ("C:\\Users\\youss\\Desktop\\ACL-NEW\\temp-mirror\\another-compile-l\\ai-service\\routers\\assistant_router.py", [
        "chat"
    ]),
    ("C:\\Users\\youss\\Desktop\\ACL-NEW\\temp-mirror\\another-compile-l\\ai-service\\routers\\moderation_router.py", [
        "batch", "analyze", "report"
    ])
]

for filepath, endpoints in files_to_update:
    print(f"Processing {os.path.basename(filepath)}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # For each endpoint, find the function and add require_openai_key() if not present
    for endpoint in endpoints:
        # Pattern: Find async def function_name(...): """docstring""" followed by try: or other code
        pattern = rf'(async def \w+\([^)]*\):\s+"""[^"]*"""\s+)(?!require_openai_key)(.*?)(try:)'
        
        def replacer(match):
            if 'require_openai_key' not in match.group(0):
                return f'{match.group(1)}require_openai_key()  # Check if OpenAI key is configured\n    {match.group(3)}'
            return match.group(0)
        
        content = re.sub(pattern, replacer, content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  ✓ Updated {len(endpoints)} endpoints")

print("\nAll files updated!")
