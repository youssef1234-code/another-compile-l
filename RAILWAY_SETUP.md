# Railway Deployment Guide - Monorepo

This is a monorepo containing three services:
- **backend** - Node.js/TypeScript API (tRPC + Express + MongoDB)
- **event-manager** - React/Vite frontend
- **ai-service** - Python FastAPI service

## Deploying Backend to Railway

Railway detected your monorepo structure. Here are **two methods** to deploy the backend:

### Method 1: Set Root Directory in Railway (Recommended)

This is the simplest approach. Railway will treat the backend folder as the root.

1. **Create a new project** on Railway dashboard
2. **Connect your GitHub repository**
3. **Configure Root Directory**:
   - In Railway dashboard → Service Settings
   - Find "Root Directory" field
   - Set it to: `backend`
   - Click "Save"
4. **Deploy**: Railway will automatically detect Node.js and deploy

✅ With this method, Railway will use the configurations in `backend/`:
- `backend/railway.toml`
- `backend/nixpacks.toml`
- `backend/Procfile`
- `backend/package.json`

### Method 2: Deploy from Root (Alternative)

If you want to deploy from the repository root, the configuration files are already set up:

**Files created at root level**:
- `railway.toml` - Main Railway configuration
- `nixpacks.toml` - Build configuration
- `start.sh` - Startup script
- `package.json` - Monorepo package file

These files automatically navigate to the `backend/` directory for build and runtime.

1. **Create a new project** on Railway dashboard
2. **Connect your GitHub repository**
3. **Deploy**: Railway will use root-level configs

## Quick Deploy Commands

### Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Navigate to project root
cd /path/to/another-compile-l

# Option 1: Deploy backend directly
cd backend
railway init
railway up

# Option 2: Deploy from root
railway init
railway up
```

## Environment Variables

Set these in Railway dashboard under **Variables**:

### Required

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-manager
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
API_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
CLIENT_URL=https://your-frontend-url.com
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

See `backend/.env.railway` for complete list with descriptions.

## Verification

After deployment:

```bash
# Test health endpoint
curl https://your-app.up.railway.app/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-13T00:00:00.000Z"}
```

## Deploying Other Services

### Frontend (event-manager)

1. Create a separate Railway service
2. Set root directory to: `event-manager`
3. Set environment variable: `VITE_API_URL=https://your-backend-url`

### AI Service (ai-service)

1. Create a separate Railway service
2. Set root directory to: `ai-service`
3. Railway will auto-detect Python/FastAPI
4. Set required OpenAI API keys

## Troubleshooting

### "Script start.sh not found"

**Cause**: Railway is looking at root but can't find proper configs  
**Solution**: Use Method 1 (set root directory to `backend`)

### "Could not determine how to build"

**Cause**: Railway couldn't detect project type  
**Solution**: 
- Ensure `package.json` exists in root or backend folder
- Set root directory to `backend` in Railway settings
- Check that `railway.toml` exists

### Build Succeeds but App Crashes

**Cause**: Missing environment variables  
**Solution**: 
- Add all required variables in Railway dashboard
- Check logs for which variable is missing
- Verify `MONGODB_URI` connection string

### Port Binding Error

**Cause**: Backend trying to use hardcoded port  
**Solution**: Backend already uses `process.env.PORT`, Railway sets this automatically

## Monitoring

- **Logs**: Railway Dashboard → Your Service → "View Logs"
- **Metrics**: Dashboard shows CPU, memory, network usage
- **Health**: Monitor `/health` endpoint

## Project Structure

```
another-compile-l/
├── backend/              ← Deploy this as main service
│   ├── src/
│   ├── package.json
│   ├── railway.toml
│   └── RAILWAY_DEPLOYMENT.md
├── event-manager/        ← Deploy as separate service
│   ├── src/
│   └── package.json
├── ai-service/           ← Deploy as separate service
│   ├── main.py
│   └── requirements.txt
├── railway.toml          ← Root config (if deploying from root)
├── nixpacks.toml         ← Root build config
├── start.sh              ← Root startup script
└── package.json          ← Monorepo config
```

## Next Steps

1. ✅ Deploy backend to Railway (this guide)
2. Deploy frontend to Vercel/Railway/Netlify
3. Deploy AI service to Railway
4. Update environment variables with deployed URLs
5. Configure Stripe webhooks
6. Test end-to-end functionality

## Additional Resources

- Backend docs: [backend/RAILWAY_DEPLOYMENT.md](backend/RAILWAY_DEPLOYMENT.md)
- Railway docs: https://docs.railway.app
- Monorepo guide: https://docs.railway.app/deploy/monorepo
