# Stripe Webhook Configuration Guide

## Step 1: Deploy Backend First
Before setting up Stripe webhook, deploy your backend to get the URL:
- Example: `https://another-compile-l-backend.vercel.app`

## Step 2: Create Stripe Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "**Add endpoint**"

### Webhook Settings:

**Endpoint URL:**
```
https://another-compile-l-backend.vercel.app/webhooks/stripe
```
Replace `another-compile-l-backend` with your actual Vercel backend URL

**Destination name:** (Can be anything, suggestions)
- `GUC Event Manager Backend`
- `Another Compile L Production`
- `Event Manager Vercel`

**Events to send:** (Select these events)
✅ `checkout.session.completed`
✅ `checkout.session.expired`
✅ `payment_intent.succeeded`
✅ `payment_intent.payment_failed`
✅ `payment_intent.canceled`
✅ `charge.succeeded`
✅ `charge.failed`
✅ `charge.refunded`

Or simply select: **"Receive all events"** for comprehensive coverage

**API Version:** Use your account's default

## Step 3: Get Webhook Secret

After creating the endpoint:
1. Click on the newly created webhook
2. Click "**Reveal**" under "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Vercel environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```
5. Redeploy backend for changes to take effect

## Step 4: Test Webhook

1. In Stripe Dashboard, click "**Send test webhook**"
2. Select `checkout.session.completed`
3. Click "Send test webhook"
4. Check Vercel logs to confirm receipt

## Quick Checklist:

- [ ] Backend deployed on Vercel
- [ ] Webhook endpoint created with correct URL
- [ ] All payment events selected
- [ ] Webhook secret copied to Vercel env vars
- [ ] Backend redeployed after adding secret
- [ ] Test webhook sent successfully

## Troubleshooting:

**Webhook failing?**
- Ensure URL is correct: `/webhooks/stripe` (not `/webhook` or `/stripe`)
- Check that backend is deployed and accessible
- Verify `STRIPE_WEBHOOK_SECRET` matches exactly
- Check Vercel function logs for errors

**Need to change webhook URL?**
- Edit the endpoint in Stripe Dashboard
- Or delete and create a new one
- Update `STRIPE_WEBHOOK_SECRET` if secret changes
