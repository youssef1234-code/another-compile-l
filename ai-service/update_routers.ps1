# Script to add OpenAI key checks to all AI router endpoints
# This ensures graceful handling when OpenAI API key is not configured

$routerFiles = @(
    "C:\Users\youss\Desktop\ACL-NEW\temp-mirror\another-compile-l\ai-service\routers\recommendations_router.py",
    "C:\Users\youss\Desktop\ACL-NEW\temp-mirror\another-compile-l\ai-service\routers\analytics_router.py",
    "C:\Users\youss\Desktop\ACL-NEW\temp-mirror\another-compile-l\ai-service\routers\chatbot_router.py",
    "C:\Users\youss\Desktop\ACL-NEW\temp-mirror\another-compile-l\ai-service\routers\assistant_router.py"
)

foreach ($file in $routerFiles) {
    Write-Host "Updating $file..."
    $content = Get-Content $file -Raw
    
    # Add import if not already present
    if ($content -notmatch "from utils\.openai_key_check import require_openai_key") {
        $content = $content -replace "(from services\.\w+ import \w+)", "`$1`nfrom utils.openai_key_check import require_openai_key"
    }
    
    # Add require_openai_key() after each @router.post or @router.get docstring (before try:)
    # Match pattern: @router.post/get -> function -> docstring -> try:
    $content = $content -replace '(async def \w+\([^)]+\):\s+"""[^"]*"""\s+)(try:)', '$1require_openai_key()  # Check if OpenAI key is configured${2}`n    $3'
    
    Set-Content $file $content -NoNewline
}

Write-Host "Done! All routers updated."
