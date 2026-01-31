# Deployment & Configuration Changes

## Backend: Comprehensive Seeding on First Run

The backend now automatically seeds ALL sample data on the first run when no admin account exists. This includes:

- ✅ Admin account
- ✅ Sample users (students, staff, professors, vendors)
- ✅ Sample events (workshops, trips, bazaars, conferences, gym sessions)
- ✅ Sample registrations and payments
- ✅ Courts and reservations
- ✅ Vendor applications
- ✅ And more!

### Configuration

By default, comprehensive seeding happens automatically on first startup. To disable:

```env
SEED_COMPREHENSIVE=false
```

To force seeding even after first run:

```env
SEED_COMPREHENSIVE=true
```

## AI Service: Optional OpenAI API Key

The AI service now gracefully handles missing OpenAI API keys. This means:

- 🔓 **OpenAI key is now OPTIONAL**
- ✅ App functions normally without AI features
- ⚠️ AI endpoints return HTTP 503 with clear error messages when key is missing
- 🔑 You can add/remove the key at runtime without redeployment

### Configuration

Simply set (or unset) the `OPENAI_API_KEY` environment variable:

```env
# Enable AI features
OPENAI_API_KEY=sk-your-key-here

# Disable AI features (comment out or remove)
# OPENAI_API_KEY=
```

### Error Response

When OpenAI key is not configured, AI endpoints return:

```json
{
  "error": "AI Service Unavailable",
  "message": "OpenAI API key is not configured. This feature requires an OpenAI API key to function.",
  "code": "OPENAI_KEY_NOT_CONFIGURED",
  "suggestion": "Please set the OPENAI_API_KEY environment variable to enable AI features."
}
```

## Vercel Deployment

All three services are ready for Vercel deployment:

1. **Frontend** (`event-manager/`) - Static site with Vite
2. **Backend** (`backend/`) - Serverless Node.js functions  
3. **AI Service** (`ai-service/`) - Serverless Python functions

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### Environment Variables

Make sure to set all required environment variables in Vercel dashboard. OpenAI key is optional but recommended for full functionality.

## Testing

### Backend - Test Seeding

```bash
cd backend
npm install
npm run dev
```

On first run, you'll see comprehensive seeding logs. Sample login:
- Admin: check `.env` for credentials
- Student: `john.doe@student.guc.edu.eg` / `Password123!`

### AI Service - Test Without OpenAI Key

```bash
cd ai-service
pip install -r requirements.txt
python main.py
```

Try calling any AI endpoint - you'll get a proper 503 error instead of a crash.

### AI Service - Test With OpenAI Key

```bash
export OPENAI_API_KEY=sk-your-key
python main.py
```

Now AI endpoints will work properly.
