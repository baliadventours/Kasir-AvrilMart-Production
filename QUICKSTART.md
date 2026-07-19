# 🚀 Quick Setup Guide

## 1. Setup Supabase (5 minutes)

1. Go to https://supabase.com → Create account → New Project
2. Save your **Database Password**!
3. Wait for project creation (~2 mins)
4. Go to **SQL Editor** → New Query
5. Copy ALL from `supabase-schema.sql` → Paste → Run
6. Go to **Project Settings** → **API** → Copy:
   - Project URL: `https://xxxxx.supabase.co`
   - anon public key: `eyJhbGc...`

## 2. Setup Supabase Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project (get ref from dashboard URL)
supabase link --project-ref your-project-ref

# Deploy the signup function
supabase functions deploy server

# Set secrets
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Deploy to Vercel (3 minutes)

### Option A: Via GitHub (Recommended)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/pos-app.git
git push -u origin main
```

Then:
1. Go to https://vercel.com
2. Import repository
3. Add environment variables:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Deploy!

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts
# Add environment variables when asked
```

## 4. Create First Admin (1 minute)

⚠️ **NO PUBLIC SIGNUP**: Hanya admin yang bisa membuat user baru. Admin pertama harus dibuat via Supabase Dashboard.

### Cara: Via Supabase Dashboard

1. **Authentication** → **Users** → **Add user**
2. Email: `admin@toko.com`
3. Password: `admin123456`
4. ✅ Auto Confirm User
5. Create user
6. Click user → User Metadata → Edit → Add:
   ```json
   {
     "name": "Administrator",
     "role": "admin"
   }
   ```
7. Save

### ✅ Done! Login dengan admin@toko.com

## 📋 Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] Edge function deployed
- [ ] Secrets configured
- [ ] App deployed to Vercel
- [ ] Environment variables set
- [ ] First admin created
- [ ] Successfully logged in

## 🔗 Quick Links

- **Supabase Dashboard**: https://app.supabase.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## ⚡ Environment Variables Needed

```bash
# .env.local (local development)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Vercel (production)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

## 🐛 Common Issues

**"Failed to fetch" error**
→ Check edge function deployed: `supabase functions list`

**"Invalid JWT" error**
→ Verify anon key in environment variables

**Database errors**
→ Re-run `supabase-schema.sql` in SQL Editor

**Can't login**
→ Check admin user exists in Authentication → Users

---

Need help? Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions!