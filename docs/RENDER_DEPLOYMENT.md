# 🚀 Ragify Backend - Render Deployment Guide

> Complete step-by-step guide to deploy the Ragify backend on Render.com

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [External Services Setup](#external-services-setup)
4. [Render Deployment](#render-deployment)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RENDER.COM                                   │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   ragify-api     │    │  ragify-worker   │                       │
│  │   (Web Service)  │    │  (Background)    │                       │
│  │   FastAPI        │    │  ARQ Worker      │                       │
│  └────────┬─────────┘    └────────┬─────────┘                       │
└───────────┼───────────────────────┼─────────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES (Free Tiers)                   │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   Neon      │  │  Upstash    │  │   Zilliz    │  │ Backblaze   │ │
│  │ PostgreSQL  │  │   Redis     │  │   Milvus    │  │     B2      │ │
│  │  Database   │  │   Cache     │  │  Vectors    │  │   Storage   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │   Resend    │  │   Google    │                                   │
│  │   Email     │  │   Gemini    │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- GitHub account (repo connected to Render)
- Accounts on external services (all have free tiers)

### Cost Summary

| Service | Free Tier | Paid Starting |
|---------|-----------|---------------|
| Render Web | ✅ Free | $7/mo |
| Render Worker | ✅ Free | $7/mo |
| Neon PostgreSQL | ✅ 0.5GB forever | $19/mo |
| Upstash Redis | ✅ 10K cmd/day | $0.20/100K cmd |
| Zilliz Milvus | ✅ Free tier | $0.07/hr |
| Backblaze B2 | ✅ 10GB | $0.005/GB |
| Resend Email | ✅ 3000/month | $20/mo |
| Google Gemini | ✅ Free tier | Pay-per-use |

**Total for free tier: $0/month** 🎉

---

## External Services Setup

### 1. 🐘 PostgreSQL (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **"Create Project"**
3. Choose:
   - **Project name**: `ragify`
   - **Region**: `US East` (or closest to you)
   - **PostgreSQL version**: `16`
4. After creation, copy the **Connection String**:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Modify for asyncpg** (add `+asyncpg`):
   ```
   postgresql+asyncpg://neondb_owner:xxxxx@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

> [!IMPORTANT]
> You MUST add `+asyncpg` after `postgresql` for the app to work!

---

### 2. 🔴 Redis (Upstash)

1. Go to [upstash.com](https://upstash.com) and sign up
2. Click **"Create Database"**
3. Choose:
   - **Name**: `ragify-redis`
   - **Type**: `Regional`
   - **Region**: `US-East-1` (match your Render region)
4. After creation, go to **Details** tab
5. Copy the **Redis URL** (with `rediss://`):
   ```
   rediss://default:xxxxxx@usw1-xxxxxx.upstash.io:6379
   ```

> [!TIP]
> Upstash is serverless - you only pay for what you use!

---

### 3. 🧠 Vector Database (Zilliz Cloud)

1. Go to [cloud.zilliz.com](https://cloud.zilliz.com) and sign up
2. Click **"Create Cluster"**
3. Choose **"Serverless"** (Free tier)
4. Configure:
   - **Cluster name**: `ragify`
   - **Cloud Provider**: `AWS`
   - **Region**: `us-east-1`
5. After creation, note:
   - **Public Endpoint** (this is your `MILVUS_URI`):
     ```
     https://in01-xxxxxx.serverless.gcp-us-west1.cloud.zilliz.com
     ```
   - **API Key** (create one):
     ```
     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```

---

### 4. 📁 File Storage (Backblaze B2)

1. Go to [backblaze.com/b2](https://www.backblaze.com/b2/cloud-storage.html) and sign up
2. Go to **"Buckets"** → **"Create a Bucket"**
3. Configure:
   - **Bucket name**: `ragify-files` (must be globally unique)
   - **Files in Bucket are**: `Private`
4. Go to **"App Keys"** → **"Add a New Application Key"**
5. Configure:
   - **Name**: `ragify-app`
   - **Allow access to Bucket(s)**: Select your bucket
   - **Type of Access**: `Read and Write`
6. Copy:
   - **keyID** → `B2_APPLICATION_KEY_ID`
   - **applicationKey** → `B2_APPLICATION_KEY`

---

### 5. 📧 Email Service (Resend)

1. Go to [resend.com](https://resend.com) and sign up
2. Go to **"API Keys"** → **"Create API Key"**
3. Copy the API key:
   ```
   re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
4. For `EMAIL_FROM_ADDRESS`:
   - Option A: Use `onboarding@resend.dev` (for testing)
   - Option B: Add your domain in **Domains** section

---

### 6. 🤖 Google Gemini API

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **"Get API key"** → **"Create API key"**
3. Choose or create a Google Cloud project
4. Copy the API key:
   ```
   AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

---

### 7. 🔑 Generate JWT Secret

Run this command to generate a secure secret:

```bash
# On Linux/Mac/WSL:
openssl rand -hex 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

Save the output - you'll need it for `JWT_SECRET_KEY`.

---

## Render Deployment

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add render.yaml for deployment"
git push origin main
```

### Step 2: Connect to Render

1. Go to [render.com](https://render.com) and sign up
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository with `render.yaml`

### Step 3: Add Environment Variables

Render will detect `render.yaml` and create services. For each variable marked `sync: false`, add them in the Render Dashboard:

| Variable | Where to Get It |
|----------|-----------------|
| `DATABASE_URL` | Neon connection string (with `+asyncpg`) |
| `REDIS_URL` | Upstash Redis URL |
| `GOOGLE_API_KEY` | Google AI Studio |
| `MILVUS_URI` | Zilliz Cloud endpoint |
| `MILVUS_TOKEN` | Zilliz Cloud API key |
| `B2_APPLICATION_KEY_ID` | Backblaze keyID |
| `B2_APPLICATION_KEY` | Backblaze applicationKey |
| `B2_BUCKET_NAME` | Your Backblaze bucket name |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM_ADDRESS` | Your email (or `onboarding@resend.dev`) |
| `JWT_SECRET_KEY` | Generated secret (openssl) |
| `FRONTEND_URL` | Your frontend URL (for CORS) |

### Step 4: Deploy

Click **"Create Blueprint"** and wait for deployment.

---

## Post-Deployment

### ⚠️ CRITICAL: Bootstrap Admin User First!

> [!CAUTION]
> The system has a **chicken-and-egg problem**:
> - `INVITE_ONLY=true` requires invite codes to register
> - Invite codes can only be created by **admin users**
> - Admin users can only be created by... registering with an invite code!
>
> **You MUST bootstrap the first admin manually.**

#### Option 1: Bootstrap Script (Recommended)

After deploying, run the bootstrap script via Render Shell:

1. Go to your `ragify-api` service in Render Dashboard
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=YourSecureP@ss1 uv run python -m scripts.bootstrap
   ```

This will:
- Create an admin user with the specified email/password
- Generate 5 invite codes for your first users

#### Option 2: Direct SQL (Via Neon Dashboard)

1. Go to [Neon Dashboard](https://console.neon.tech)
2. Open your project → **SQL Editor**
3. Run these SQL commands:

```sql
-- Step 1: Create admin user (replace email and password_hash)
-- Generate password hash locally first: 
--   python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['argon2']).hash('YourSecureP@ss1'))"

INSERT INTO users (user_id, email, password_hash, role, status, is_active, storage_limit_bytes, created_at, updated_at, invited_at)
VALUES (
    gen_random_uuid()::text,
    'admin@yourdomain.com',
    '$argon2id$v=19$m=65536,t=3,p=4$YOUR_HASH_HERE',  -- Replace with generated hash
    'admin',
    'active',
    true,
    1073741824,
    NOW(),
    NOW(),
    NOW()
);

-- Step 2: Create invite codes for users
INSERT INTO invite_codes (invite_code_id, code, max_uses, current_uses, status, created_at)
VALUES 
    (gen_random_uuid()::text, 'KB-BOOT-STRAP-0001', 1, 0, 'active', NOW()),
    (gen_random_uuid()::text, 'KB-BOOT-STRAP-0002', 1, 0, 'active', NOW()),
    (gen_random_uuid()::text, 'KB-BOOT-STRAP-0003', 1, 0, 'active', NOW());
```

#### Option 3: Disable INVITE_ONLY Temporarily

1. In Render Dashboard, set `INVITE_ONLY=false`
2. Register normally at `/auth/register`
3. Manually promote yourself to admin via SQL:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
4. Set `INVITE_ONLY=true` again in Render

---

### 1. Verify Deployment

Check the health endpoint:
```
https://ragify-api.onrender.com/api/v1/health
```

Should return:
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Access Admin Panel

After bootstrapping, login with your admin credentials at:
```
https://ragify-api.onrender.com/docs
```

Use the `/auth/login` endpoint to get your JWT token, then use admin endpoints to:
- Create more invite codes
- Manage users
- View system stats

### 3. API Documentation

Access Swagger docs at:
```
https://ragify-api.onrender.com/docs
```

---

## Troubleshooting

### Common Issues

#### 1. "Connection refused" to Database

**Cause**: Missing `+asyncpg` in DATABASE_URL

**Fix**: Ensure URL format is:
```
postgresql+asyncpg://user:pass@host/db
```

---

#### 2. Worker Not Processing Jobs

**Cause**: Redis connection failed

**Fix**: 
- Verify `REDIS_URL` uses `rediss://` (with double 's' for TLS)
- Check Upstash dashboard for connection errors

---

#### 3. "Milvus connection failed"

**Cause**: Wrong MILVUS_URI format or missing token

**Fix**:
- Use full HTTPS URL: `https://xxxxx.cloud.zilliz.com`
- Ensure `MILVUS_TOKEN` is set correctly

---

#### 4. Slow Cold Starts

**Cause**: Free tier containers spin down after inactivity

**Fix**: This is expected on free tier. First request after idle takes 30-60 seconds.

**Workaround**: Use a cron service like [cron-job.org](https://cron-job.org) to ping your health endpoint every 10 minutes.

---

### Logs

View logs in Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Look for startup errors

---

## Environment Variables Reference

```bash
# Required (add in Render Dashboard)
DATABASE_URL=postgresql+asyncpg://user:pass@host/db
REDIS_URL=rediss://default:pass@host:6379
GOOGLE_API_KEY=AIzaSy...
MILVUS_URI=https://xxxxx.cloud.zilliz.com
MILVUS_TOKEN=your-api-key
B2_APPLICATION_KEY_ID=xxx
B2_APPLICATION_KEY=xxx
B2_BUCKET_NAME=ragify-files
RESEND_API_KEY=re_xxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
JWT_SECRET_KEY=your-64-char-hex-secret
FRONTEND_URL=https://your-frontend.com

# Optional (defaults in render.yaml)
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=models/gemini-embedding-001
EMBEDDING_DIMENSION=1024
MILVUS_COLLECTION=knowledge_base
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_FILE_SIZE_MB=50
INVITE_ONLY=true
```

---

## File Location

> [!NOTE]
> The `render.yaml` file **MUST be in the repository root** (base folder), not in `/backend`.
> 
> Render looks for this file at the root when you connect your repo.

---

## Next Steps

1. [ ] Deploy frontend to Render/Vercel/Netlify
2. [ ] Set up custom domain
3. [ ] Enable HTTPS (automatic on Render)
4. [ ] Set up monitoring (Render has built-in metrics)

---

*Last updated: January 2026*
