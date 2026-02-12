#!/bin/bash
# Railway start script for backend

echo "🚀 Starting Event Manager Backend..."
echo "📦 Node version: $(node --version)"
echo "📍 Working directory: $(pwd)"
echo ""

# Run the production server
exec npm start
