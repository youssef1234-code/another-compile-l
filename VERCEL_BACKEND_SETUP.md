# 🚀 Quick Vercel Deployment - Backend Setup

## ✅ Vercel Project Configuration

Use these exact settings when creating the project:

```
Project Name: another-compile-l-backend
Framework Preset: Express
Root Directory: backend
Build Command: cd ../shared && npm install && npm run build && cd ../backend && npm install && npm run build
Output Directory: dist
Install Command: npm install
```

---

## 📋 Environment Variables to Add

**Copy ALL of these into Vercel → Environment Variables:**

```env
NODE_ENV=production
PORT=5000
API_URL=https://another-compile-l-backend.vercel.app
CLIENT_URL=https://another-compile-l-frontend.vercel.app
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-manager?retryWrites=true&w=majority
JWT_SECRET=CHANGE_THIS_TO_RANDOM_32_CHAR_STRING
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=CHANGE_THIS_TO_DIFFERENT_32_CHAR_STRING
JWT_REFRESH_EXPIRES_IN=30d
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=mg.yourdomain.com
EMAIL_FROM=noreply@yourdomain.com
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_leave_empty_for_now
BCRYPT_ROUNDS=10
VERIFICATION_TOKEN_EXPIRES=24h
HOLD_MINUTES=15
ADMIN_EMAIL=admin@guc.edu.eg
ADMIN_PASSWORD=Admin123!@#SecurePassword
```

### 🔑 Important Fields to Update:

1. **API_URL** - Update after deployment (will be `https://your-project-name.vercel.app`)
2. **CLIENT_URL** - Update after frontend deployment
3. **MONGODB_URI** - Get from MongoDB Atlas
4. **JWT_SECRET** - Generate random string (32+ chars)
5. **JWT_REFRESH_SECRET** - Generate different random string (32+ chars)
6. **MAILGUN_API_KEY** - From Mailgun Dashboard (see setup below)
7. **MAILGUN_DOMAIN** - Your Mailgun domain (e.g., `mg.yourdomain.com`)
8. **STRIPE_SECRET_KEY** - From Stripe Dashboard
9. **STRIPE_PUBLISHABLE_KEY** - From Stripe Dashboard
10. **STRIPE_WEBHOOK_SECRET** - Leave empty for now, add after webhook setup
11. **ADMIN_EMAIL** & **ADMIN_PASSWORD** - Change these to your preferred admin credentials

---

## 🎯 Stripe Webhook Setup

### After Backend Deployment:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. **Click**: "Add endpoint"
3. **Fill in**:
   - **Endpoint URL**: `https://your-backend-url.vercel.app/webhooks/stripe`
   - **Destination name**: `GUC Event Manager Backend` (can be anything)
   - **Events to send**: Select these:
     - ✅ `checkout.session.completed`
     - ✅ `checkout.session.expired`
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `charge.refunded`
     
     *Or just select "Receive all events" to be safe*

4. **Click**: "Add endpoint"
5. **Copy the webhook secret** (starts with `whsec_`)
6. **Add to Vercel**:
   - Go to Vercel Project → Settings → Environment Variables
   - Find `STRIPE_WEBHOOK_SECRET`
   - Update the value with your webhook secret
7. **Redeploy** the backend

---

## 🔐 Generate Secure Secrets

### For JWT_SECRET and JWT_REFRESH_SECRET:

**Option 1: Online** (quick)
- Go to: https://www.lastpass.com/features/password-generator
- Generate 32+ character password
- Use different ones for each secret

**Option 2: Command Line** (recommended)
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📧 Mailgun Email Setup (for email verification)

Mailgun is already integrated in the backend and is the recommended email service.

1. **Sign up for Mailgun**: https://signup.mailgun.com/
2. **Choose a plan**:
   - Free tier: 5,000 emails/month (perfect for testing)
   - Pay as you go for production
3. **Get your API key**:
   - Go to: https://app.mailgun.com/app/account/security/api_keys
   - Copy your **Private API key** (starts with `key-`)
4. **Set up your domain**:
   - **Option A: Use Mailgun's sandbox domain** (for testing):
     - Go to: https://app.mailgun.com/app/sending/domains
     - Use the sandbox domain (e.g., `sandboxXXX.mailgun.org`)
     - **Note**: Sandbox only sends to authorized recipients
   - **Option B: Add your own domain** (for production):
     - Go to: https://app.mailgun.com/app/sending/domains
     - Click "Add New Domain"
     - Enter: `mg.yourdomain.com`
     - Follow DNS setup instructions
     - Verify domain
5. **Configure in Vercel**:
   ```
   MAILGUN_API_KEY=key-your-mailgun-private-api-key
   MAILGUN_DOMAIN=sandboxXXX.mailgun.org (or mg.yourdomain.com)
   EMAIL_FROM=noreply@yourdomain.com
   ```

### Mailgun Sandbox Testing

If using sandbox domain, you need to add authorized recipients:
1. Go to: https://app.mailgun.com/app/sending/domains/[your-sandbox]/recipients
2. Add email addresses that can receive test emails
3. They'll receive a confirmation email

### For Production:
- Add your own domain (`mg.yourdomain.com`)
- Update DNS records as instructed
- No recipient restrictions
- Can send to any email address

---

## 📦 MongoDB Atlas Setup

1. **Create Cluster**: https://cloud.mongodb.com/
2. **Create Database User**:
   - Username: `eventmanager`
   - Password: Generate strong password
3. **Whitelist IP**:
   - Go to Network Access
   - Add IP: `0.0.0.0/0` (allow all - required for Vercel)
4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `event-manager`

Example:
```
mongodb+srv://eventmanager:YourPassword123@cluster0.abcde.mongodb.net/event-manager?retryWrites=true&w=majority
```

---

## ✅ Final Checklist

Before deploying:
- [ ] All environment variables added to Vercel
- [ ] MongoDB Atlas cluster created and IP whitelisted
- [ ] Gmail App Password generated
- [ ] Strong JWT secrets generated
- [ ] Stripe account set up
- [ ] Admin credentials set

After first deployment:
- [ ] Update `API_URL` with actual Vercel URL
- [ ] Set up Stripe webhook
- [ ] Update `STRIPE_WEBHOOK_SECRET`
- [ ] Redeploy backend
- [ ] Test with a simple health check: `https://your-backend.vercel.app/health`

---

## 🎉 Expected Result

On first deployment, the backend will automatically:
- ✅ Connect to MongoDB
- ✅ Create admin account (using ADMIN_EMAIL & ADMIN_PASSWORD)
- ✅ Seed sample data (users, events, registrations, etc.)
- ✅ Be ready for testing!

**Default Login Credentials:**
- Admin: Your `ADMIN_EMAIL` / Your `ADMIN_PASSWORD`
- Sample Student: `john.doe@student.guc.edu.eg` / `Password123!`

---

## 🐛 Troubleshooting

**Build fails?**
- Check that `backend` is set as Root Directory
- Verify build command includes `cd ../shared && npm install && npm run build`

**Database connection fails?**
- Verify MongoDB URI format
- Check IP whitelist includes `0.0.0.0/0`
- Ensure database user has correct permissions

**Emails not sending?**
- Verify Gmail App Password (not regular password)
- Check 2FA is enabled on Gmail account
- Ensure no spaces in app password

Need help? Check the logs in Vercel Dashboard → Deployments → Functions
