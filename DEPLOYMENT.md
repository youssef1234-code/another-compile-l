# Vercel Deployment Guide

This guide explains how to deploy the Event Manager monorepo to Vercel.

## Architecture Overview

This project consists of three separate deployable services:

1. **Frontend (`event-manager/`)** - Vite + React + TypeScript
2. **Backend (`backend/`)** - Express + tRPC + TypeScript  
3. **AI Service (`ai-service/`)** - FastAPI + Python

Each service will be deployed as a separate Vercel project.

---

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas** - Set up a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Stripe Account** - For payment processing
4. **OpenAI API Key** - For AI service features
5. **SMTP Service** - Gmail, SendGrid, or Mailgun for emails

---

## Step 1: Database Setup (MongoDB Atlas)

1. Create a MongoDB Atlas account and cluster
2. Create a database user with read/write permissions
3. Whitelist IP addresses (use `0.0.0.0/0` for Vercel serverless)
4. Get your connection string: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/event-manager`

---

## Step 2: Deploy Backend

### Option A: Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository: `youssef1234-code/another-compile-l`
3. Set the **Root Directory** to `backend`
4. Framework Preset: **Other**
5. Build Command: `cd ../shared && npm install && npm run build && cd ../backend && npm install && npm run build`
6. Output Directory: `dist`
7. Install Command: `npm install`

### Option B: Via Vercel CLI

```bash
cd backend
vercel --prod
```

### Environment Variables (Backend)

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
NODE_ENV=production
PORT=5000
API_URL=https://your-backend.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/event-manager
JWT_SECRET=<generate-a-strong-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generate-another-strong-secret>
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
BCRYPT_ROUNDS=10
VERIFICATION_TOKEN_EXPIRES=24h
HOLD_MINUTES=15
```

---

## Step 3: Deploy AI Service

### Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same repository
3. Set the **Root Directory** to `ai-service`
4. Framework Preset: **Other**
5. Leave build settings as detected

### Environment Variables (AI Service)

```
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
BACKEND_URL=https://your-backend.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
```

---

## Step 4: Deploy Frontend

### Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the same repository
3. Set the **Root Directory** to `event-manager`
4. Framework Preset: **Vite**
5. Build Command: `cd ../shared && npm install && npm run build && cd ../event-manager && npm install && npm run build`
6. Output Directory: `dist`

### Environment Variables (Frontend)

```
VITE_API_URL=https://your-backend.vercel.app
VITE_AI_SERVICE_URL=https://your-ai-service.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
```

---

## Step 5: Update CORS & URLs

After deployment, update environment variables on each service with the actual Vercel URLs:

1. **Backend**: Update `CLIENT_URL` with frontend URL
2. **AI Service**: Update `BACKEND_URL` and `CLIENT_URL`
3. **Frontend**: Update `VITE_API_URL` and `VITE_AI_SERVICE_URL`

---

## Step 6: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend.vercel.app/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, etc.
4. Copy the webhook secret and update `STRIPE_WEBHOOK_SECRET` in backend

---

## Troubleshooting

### Build Fails with Shared Package Error
The build command includes building the shared package first. Make sure the build command is:
```
cd ../shared && npm install && npm run build && cd ../[project] && npm install && npm run build
```

### CORS Errors
Ensure all URLs are correctly set in environment variables and match exactly (no trailing slashes).

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

### Serverless Function Timeout
Backend and AI service functions have increased timeout limits. If you still experience timeouts:
- Optimize database queries
- Add indexes to MongoDB collections
- Consider using MongoDB Atlas Data API for complex queries

---

## Custom Domain Setup

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update all environment variables with new domain URLs

---

## Monitoring & Logs

- View logs: Vercel Dashboard → Project → Deployments → Functions tab
- Set up alerts: Vercel Dashboard → Project Settings → Notifications
- Monitor usage: Vercel Dashboard → Usage

---

## Local Development with Production Backend

To test frontend locally with production backend:

```bash
cd event-manager
echo "VITE_API_URL=https://your-backend.vercel.app" > .env.local
npm run dev
```
