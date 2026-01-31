# 🚀 Complete Vercel Deployment Guide

## Quick Overview

This is a **monorepo** with 3 separate deployable services:
1. **Frontend** (`event-manager/`) - React + Vite
2. **Backend** (`backend/`) - Express + tRPC + TypeScript
3. **AI Service** (`ai-service/`) - FastAPI + Python

Each service must be deployed as a **separate Vercel project**.

---

## 📋 Prerequisites Checklist

Before deploying, ensure you have:
- [ ] MongoDB Atlas account & cluster created
- [ ] Mailgun account & API key
- [ ] Stripe account & API keys
- [ ] OpenAI API key (optional - for AI features)
- [ ] GitHub repository: `youssef1234-code/another-compile-l`

---

## 🎯 Deployment Order

**Deploy in this order:**
1. Backend first
2. AI Service second
3. Frontend last (needs backend URLs)

---

# Part 1: Backend Deployment

## Step 1: Fix Vercel Configuration

**IMPORTANT**: Before deploying, update `backend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "event-manager-backend",
  "buildCommand": "cd ../shared && npm install && npm run build && cd ../backend && npm install && npm run build && tsc api/index.ts --outDir api --module commonjs --esModuleInterop",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/api" }
  ]
}
```

**Also create** `backend/api/package.json`:

```json
{
  "type": "commonjs"
}
```

## Step 2: Deploy Backend on Vercel

1. Go to: https://vercel.com/new
2. Click "Import Project"
3. Select: `youssef1234-code/another-compile-l`
4. **Configure Project**:
   - **Project Name**: `another-compile-l-backend`
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: (use default from vercel.json)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

## Step 3: Add Environment Variables

Click "Environment Variables" and add ALL of these:

```env
NODE_ENV=production
PORT=5000
API_URL=https://your-backend-project.vercel.app
CLIENT_URL=https://your-frontend-project.vercel.app

# MongoDB Atlas - REQUIRED
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-manager?retryWrites=true&w=majority

# JWT Secrets - Generate 32+ character random strings
JWT_SECRET=YOUR_RANDOM_32_CHAR_STRING_HERE
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=YOUR_DIFFERENT_32_CHAR_STRING_HERE
JWT_REFRESH_EXPIRES_IN=30d

# Mailgun Email - REQUIRED
MAILGUN_API_KEY=key-your-mailgun-api-key
MAILGUN_DOMAIN=sandboxXXX.mailgun.org
EMAIL_FROM=noreply@yourdomain.com

# Stripe - REQUIRED
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_leave_empty_for_now

# Security
BCRYPT_ROUNDS=10
VERIFICATION_TOKEN_EXPIRES=24h
HOLD_MINUTES=15

# Admin Account (Change these!)
ADMIN_EMAIL=admin@guc.edu.eg
ADMIN_PASSWORD=YourSecurePassword123!
```

### How to Generate JWT Secrets:

**Windows PowerShell**:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Mac/Linux**:
```bash
openssl rand -base64 32
```

## Step 4: Deploy Backend

1. Click "Deploy"
2. Wait for build to complete (3-5 minutes)
3. Copy your backend URL: `https://your-backend-project.vercel.app`
4. **Update Environment Variables**:
   - Go to Settings → Environment Variables
   - Update `API_URL` with your actual backend URL
   - **Redeploy** from Deployments tab

---

# Part 2: Configure External Services

## 📧 Mailgun Setup

1. **Sign up**: https://signup.mailgun.com/
2. **Free plan**: 5,000 emails/month
3. **Get API Key**:
   - Go to: https://app.mailgun.com/app/account/security/api_keys
   - Copy **Private API key** (starts with `key-`)
4. **Get Domain**:
   - **For Testing**: Use sandbox domain at https://app.mailgun.com/app/sending/domains
     - Format: `sandboxXXX.mailgun.org`
     - Add authorized recipients for testing
   - **For Production**: Add custom domain `mg.yourdomain.com`
5. **Update Vercel**:
   ```
   MAILGUN_API_KEY=key-abc123...
   MAILGUN_DOMAIN=sandboxXXX.mailgun.org
   ```

## 💳 Stripe Configuration

### Get API Keys:
1. Go to: https://dashboard.stripe.com/apikeys
2. Copy **Secret key** (starts with `sk_test_`)
3. Copy **Publishable key** (starts with `pk_test_`)
4. Add to Vercel environment variables

### Setup Webhook:
1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://your-backend-project.vercel.app/webhooks/stripe`
4. **Destination name**: `GUC Event Manager Production`
5. **Events to send** - Select these:
   - ✅ `checkout.session.completed`
   - ✅ `checkout.session.expired`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.succeeded`
   - ✅ `charge.failed`
   - ✅ `charge.refunded`
   
   *Or select "Receive all events"*

6. Click "Add endpoint"
7. **Copy webhook secret** (starts with `whsec_`)
8. **Update Vercel**:
   - Go to Settings → Environment Variables
   - Update `STRIPE_WEBHOOK_SECRET=whsec_your_secret`
   - **Redeploy** backend

## 🗄️ MongoDB Atlas Setup

1. **Create cluster**: https://cloud.mongodb.com/
2. **Database Access**:
   - Create user: `eventmanager`
   - Generate strong password
   - Role: "Atlas admin" or "Read and write to any database"
3. **Network Access**:
   - Add IP: `0.0.0.0/0` (allow all - required for Vercel)
4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `event-manager`
   
   Example:
   ```
   mongodb+srv://eventmanager:YourPassword123@cluster0.abcde.mongodb.net/event-manager?retryWrites=true&w=majority
   ```

---

# Part 3: AI Service Deployment

## Step 1: Deploy AI Service

1. Go to: https://vercel.com/new
2. Import same repository: `youssef1234-code/another-compile-l`
3. **Configure Project**:
   - **Project Name**: `another-compile-l-ai-service`
   - **Framework Preset**: Other
   - **Root Directory**: `ai-service`
   - Leave other settings as default

## Step 2: Add Environment Variables

```env
# OpenAI (OPTIONAL - AI features disabled if not set)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# Backend URL
BACKEND_URL=https://your-backend-project.vercel.app

# Frontend URL (for CORS)
CLIENT_URL=https://your-frontend-project.vercel.app
```

**Note**: OpenAI key is optional. Without it, AI endpoints return HTTP 503 with helpful error messages.

## Step 3: Deploy

1. Click "Deploy"
2. Copy AI Service URL: `https://your-ai-service-project.vercel.app`

---

# Part 4: Frontend Deployment

## Step 1: Deploy Frontend

1. Go to: https://vercel.com/new
2. Import same repository: `youssef1234-code/another-compile-l`
3. **Configure Project**:
   - **Project Name**: `another-compile-l-frontend`
   - **Framework Preset**: Vite
   - **Root Directory**: `event-manager`
   - **Build Command**: `cd ../shared && npm install && npm run build && cd ../event-manager && npm install && npm run build`
   - **Output Directory**: `dist`

## Step 2: Add Environment Variables

```env
VITE_API_URL=https://your-backend-project.vercel.app
VITE_AI_SERVICE_URL=https://your-ai-service-project.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Step 3: Deploy

1. Click "Deploy"
2. Copy Frontend URL: `https://your-frontend-project.vercel.app`

---

# Part 5: Final Configuration

## Update All URLs

Now that all services are deployed, update the URLs:

### Backend Environment Variables:
- Update `CLIENT_URL` with frontend URL
- Redeploy

### AI Service Environment Variables:
- Update `BACKEND_URL` with backend URL
- Update `CLIENT_URL` with frontend URL
- Redeploy

### Stripe Webhook:
- Verify webhook endpoint URL is correct
- Test webhook with "Send test webhook" button

---

# ✅ Verification Checklist

After deployment, verify everything works:

## Backend Health Check:
```
https://your-backend-project.vercel.app/health
```
Should return: `{"status":"ok","timestamp":"..."}`

## AI Service Health Check:
```
https://your-ai-service-project.vercel.app/health
```
Should return: `{"status":"ok"}`

## Database Seeding:
- Check Vercel logs for backend
- Look for: "🎉 Database fully seeded! You can now explore the app with sample data."
- This happens automatically on first run

## Test Login:
Go to frontend and login with:
- **Admin**: Your `ADMIN_EMAIL` / Your `ADMIN_PASSWORD`
- **Student**: `john.doe@student.guc.edu.eg` / `Password123!`
- **Professor**: `prof.brown@prof.guc.edu.eg` / `Password123!`

## Test Email:
- Try registering a new user
- Check if verification email is sent (check Mailgun logs)

## Test Stripe:
- Try registering for a paid event
- Use Stripe test card: `4242 4242 4242 4242`
- Check Stripe Dashboard for payment

---

# 🐛 Troubleshooting

## Build Fails

### "Pattern doesn't match any Serverless Functions"
- Make sure `backend/vercel.json` uses the updated configuration above
- Ensure `backend/api/package.json` exists with `"type": "commonjs"`

### "Shared package not found"
- Build command must include building shared package first
- Verify: `cd ../shared && npm install && npm run build && cd ../backend...`

## Runtime Errors

### Database Connection Failed
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Ensure database user has correct permissions

### CORS Errors
- Verify all URLs in environment variables are correct
- No trailing slashes in URLs
- Check CORS headers in backend vercel.json

### Emails Not Sending
- Check Mailgun API key is correct (starts with `key-`)
- Verify Mailgun domain is correct
- For sandbox: ensure recipient is authorized

### Stripe Webhook Failing
- Verify webhook URL is exactly: `/webhooks/stripe`
- Check webhook secret matches in environment variables
- Look for errors in Stripe Dashboard → Webhooks → [your webhook] → Recent events

### AI Service 503 Errors
- This is normal if OpenAI key is not configured
- Add `OPENAI_API_KEY` to enable AI features
- Or ignore - app works without AI features

---

# 📊 What You Get After Deployment

## Automatic Features:
- ✅ Database auto-seeds on first run
- ✅ Admin account created automatically
- ✅ 20+ sample users
- ✅ 30+ sample events
- ✅ 50+ registrations
- ✅ Court reservations
- ✅ Sample comments (appropriate + inappropriate for AI testing)
- ✅ Interest-based data for recommendations

## Sample Accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | Your ADMIN_EMAIL | Your ADMIN_PASSWORD |
| Student | john.doe@student.guc.edu.eg | Password123! |
| Professor | prof.brown@prof.guc.edu.eg | Password123! |
| Events Office | events.office@guc.edu.eg | Password123! |
| Vendor | vendor@techcompany.com | Password123! |

---

# 🎉 Deployment Complete!

Your platform is now live with:
- ✅ Backend API running
- ✅ AI Service ready (with or without OpenAI)
- ✅ Frontend accessible
- ✅ Database seeded with test data
- ✅ Email verification working
- ✅ Stripe payments configured
- ✅ All features operational

**Next Steps**:
1. Test core features
2. Invite team members
3. Switch to production Stripe keys when ready
4. Add custom domain (optional)

---

# 📞 Need Help?

Check logs in Vercel:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Deployments"
4. Click on latest deployment
5. Click "Functions" tab
6. View function logs

Common log locations:
- Backend: Check `/api` function logs
- Build errors: Check "Build" tab
- Runtime errors: Check "Functions" tab
