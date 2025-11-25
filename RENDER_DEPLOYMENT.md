# 🚀 Render Deployment Guide

This guide will help you deploy the Insider Threat Detection application on Render.

## 📋 Prerequisites

1. A [Render account](https://render.com) (Free tier works fine)
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Basic understanding of environment variables

## 🎯 Quick Deployment Steps

### Option 1: Using Render Blueprint (Recommended)

Render Blueprints allow you to deploy all services at once using the `render.yaml` file.

**IMPORTANT:** Create the PostgreSQL database FIRST before deploying the Blueprint.

1. **Create PostgreSQL Database First:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "PostgreSQL"
   - Configure:
     - **Name:** `insider-threat-db`
     - **Database:** `insider_threat_db`
     - **User:** `threat_admin`
     - **Plan:** Starter (Free)
   - Click "Create Database"
   - **IMPORTANT:** Copy the **Internal Database URL** (you'll need this)
   - Wait 2-3 minutes for database to initialize

2. **Connect your repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your Git repository
   - Render will automatically detect `render.yaml`

3. **Deploy the Blueprint:**
   - Render will parse `render.yaml` and create web services (backend & frontend)
   - Review the services and click "Apply"
   - Wait for services to be created

4. **Configure Environment Variables:**
   After deployment, you'll need to manually set these:

   **Backend Service (`insider-threat-backend`):**
   - `DATABASE_URL`: Paste the **Internal Database URL** you copied in step 1
   - `CORS_ORIGINS`: Set to your frontend URL (e.g., `https://insider-threat-frontend.onrender.com`)
   - `SECRET_KEY`: Will be auto-generated
   - Save changes (this will trigger a redeploy)

   **Frontend Service (`insider-threat-frontend`):**
   - `REACT_APP_API_URL`: Set to your backend URL (e.g., `https://insider-threat-backend.onrender.com`)
   - **Important:** After setting this, you'll need to **redeploy the frontend** for the change to take effect (React builds environment variables at build time)
   
   **To redeploy frontend:**
   - Go to the frontend service in Render dashboard
   - Click "Manual Deploy" → "Deploy latest commit"
   - The new API URL will be baked into the build

5. **Wait for deployment:**
   - Backend will connect to database and initialize tables
   - Demo data (50 users) will be populated automatically
   - Frontend will build and deploy

6. **Access your application:**
   - Frontend: `https://insider-threat-frontend.onrender.com`
   - Backend API: `https://insider-threat-backend.onrender.com`
   - API Docs: `https://insider-threat-backend.onrender.com/docs`

### Option 2: Manual Deployment

#### Step 1: Deploy PostgreSQL Database

1. Go to Render Dashboard → "New +" → "PostgreSQL"
2. Configure:
   - **Name:** `insider-threat-db`
   - **Database:** `insider_threat_db`
   - **User:** `threat_admin`
   - **Plan:** Starter (Free)
3. Click "Create Database"
4. **Important:** Copy the "Internal Database URL" - you'll need it later

#### Step 2: Deploy Backend Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name:** `insider-threat-backend`
   - **Runtime:** Docker
   - **Region:** Choose closest to you
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** Leave blank
   - **Dockerfile Path:** `./backend/Dockerfile`
   - **Docker Context:** `.` (project root)
   - **Build Command:** (leave blank)
   - **Start Command:** `cd backend && python startup.py`
   - **Plan:** Starter (Free)

4. **Environment Variables:**
   - `DATABASE_URL`: Use the internal database URL from Step 1
   - `SECRET_KEY`: Generate a random string (e.g., use `openssl rand -hex 32`)
   - `MODEL_PATH`: `/app/models`
   - `CORS_ORIGINS`: Will set after frontend is deployed
   - `PORT`: `8000`

5. Click "Create Web Service"

#### Step 3: Deploy Frontend Service

1. Go to Render Dashboard → "New +" → "Web Service"
2. Connect your repository (same as backend)
3. Configure:
   - **Name:** `insider-threat-frontend`
   - **Runtime:** Docker
   - **Region:** Same as backend
   - **Branch:** `main`
   - **Dockerfile Path:** `./frontend/Dockerfile`
   - **Docker Context:** `./frontend`
   - **Build Command:** (leave blank)
   - **Start Command:** (leave blank - nginx auto-starts)
   - **Plan:** Starter (Free)

4. **Environment Variables:**
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://insider-threat-backend.onrender.com`)

5. Click "Create Web Service"

#### Step 4: Link Services

After both services are deployed:

1. **Update Backend CORS:**
   - Go to backend service settings
   - Add/Update `CORS_ORIGINS` environment variable
   - Value: Your frontend URL (e.g., `https://insider-threat-frontend.onrender.com`)
   - Save changes (this will trigger a redeploy)

2. **Verify Frontend API URL:**
   - Go to frontend service settings
   - Ensure `REACT_APP_API_URL` points to your backend URL
   - Should be: `https://insider-threat-backend.onrender.com`

## 🔧 Configuration Details

### Database Initialization

The backend automatically:
- Waits for database to be ready (up to 60 seconds)
- Creates all necessary tables
- Populates with 50 demo users if database is empty
- Generates 7 days of activity history

### Environment Variables Reference

#### Backend (`insider-threat-backend`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string (auto-set from database service) |
| `SECRET_KEY` | ✅ Yes | - | Secret key for session management (auto-generated in Blueprint) |
| `MODEL_PATH` | ❌ No | `/app/models` | Path to ML model files |
| `CORS_ORIGINS` | ✅ Yes | `*` | Comma-separated list of allowed origins |
| `PORT` | ❌ No | `8000` | Port to run the server on |

#### Frontend (`insider-threat-frontend`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | ✅ Yes | `http://localhost:8000` | Backend API URL |

**Important Note:** React environment variables must be set **before building**. After setting `REACT_APP_API_URL`, you must **redeploy** the frontend service for the change to take effect (use "Manual Deploy" in Render dashboard).

#### Database (`insider-threat-db`)

| Setting | Value |
|---------|-------|
| Database Name | `insider_threat_db` |
| User | `threat_admin` |
| Max Connections | 25 (Free tier) |

## 🔐 Login Credentials

After deployment, you can log in with:

### Admin Accounts:
- **Username:** `admin` | **Password:** `admin123`
- **Username:** `secadmin` | **Password:** `secure123`

### User Accounts:
- **Username:** `U001` to `U050` | **Password:** `user123`

## 🐛 Troubleshooting

### Backend won't start

1. **Check logs** in Render dashboard
2. **Verify DATABASE_URL** is correctly set
3. **Check health endpoint:** `https://your-backend.onrender.com/api/health`
4. **Common issues:**
   - Database not ready: Wait a few minutes after database creation
   - Connection string wrong: Use internal database URL, not external
   - Port conflicts: Ensure PORT env var is `8000`

### Frontend shows "Cannot connect to API"

1. **Verify REACT_APP_API_URL** environment variable
2. **Check CORS_ORIGINS** in backend includes frontend URL
3. **Verify backend is running:** Visit backend URL directly
4. **Check browser console** for CORS errors

### Database connection errors

1. **Use internal database URL** (not external)
2. **Verify database service** is running
3. **Check connection string format:** Should start with `postgresql://`
4. **Wait for database** to fully initialize (2-3 minutes)

### Models not loading

- Models are trained at runtime if not found
- This is normal for first deployment
- Models will be trained automatically on startup

## 📊 Free Tier Limitations

Render's free tier has some limitations:

- **Services sleep after 15 minutes of inactivity** (wake on next request)
- **512 MB RAM** per service
- **Limited build time** (may need to optimize Dockerfiles)
- **PostgreSQL has 90-day retention** on free tier
- **Build minutes:** 500/month

To avoid sleep: Upgrade to paid tier or use a service like [UptimeRobot](https://uptimerobot.com) to ping your services.

## 🔄 Updating Your Deployment

To update your application:

1. **Push changes** to your Git repository
2. **Render auto-deploys** on push (if enabled)
3. **Or manually trigger** deployment from Render dashboard

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## ✅ Post-Deployment Checklist

- [ ] Database service is running
- [ ] Backend service is running and healthy
- [ ] Frontend service is running
- [ ] Environment variables are set correctly
- [ ] CORS is configured properly
- [ ] Can access frontend URL
- [ ] Can login with admin credentials
- [ ] API endpoints respond correctly
- [ ] Database is populated with demo data

## 🆘 Need Help?

- Check application logs in Render dashboard
- Review [Render Status Page](https://status.render.com)
- Check [GitHub Issues](https://github.com/your-repo/issues) for known issues

---

**Happy Deploying! 🚀**

