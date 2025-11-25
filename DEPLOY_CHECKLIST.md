# ✅ Render Deployment Checklist

Follow these steps to deploy your application to Render:

## 📋 Pre-Deployment Checklist

- [ ] Code is pushed to GitHub/GitLab/Bitbucket
- [ ] You have a Render account (sign up at https://render.com)
- [ ] All files are committed and pushed to your repository

## 🚀 Deployment Steps

### Step 1: Connect Repository to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your Git repository (GitHub/GitLab/Bitbucket)
4. Render will automatically detect `render.yaml`

### Step 2: Deploy Blueprint

1. Review the services that will be created:
   - ✅ `insider-threat-db` (PostgreSQL)
   - ✅ `insider-threat-backend` (Backend API)
   - ✅ `insider-threat-frontend` (Frontend)
2. Click **"Apply"** to create all services
3. Wait for initial deployment (5-10 minutes)

### Step 3: Configure Environment Variables

**After services are created, set these environment variables:**

#### Backend Service (`insider-threat-backend`)

1. Go to the backend service in Render dashboard
2. Navigate to **"Environment"** tab
3. Add/Update:
   - `CORS_ORIGINS`: `https://insider-threat-frontend.onrender.com` (or your actual frontend URL)
   - Verify `DATABASE_URL` is auto-set (should be there)
   - Verify `SECRET_KEY` is auto-generated (should be there)
4. Click **"Save Changes"** (this will trigger a redeploy)

#### Frontend Service (`insider-threat-frontend`)

1. Go to the frontend service in Render dashboard
2. Navigate to **"Environment"** tab
3. Add/Update:
   - `REACT_APP_API_URL`: `https://insider-threat-backend.onrender.com` (or your actual backend URL)
4. Click **"Save Changes"**
5. **IMPORTANT:** Go to **"Manual Deploy"** → **"Deploy latest commit"** to rebuild with the new API URL

### Step 4: Verify Deployment

1. **Check Backend:**
   - Visit: `https://insider-threat-backend.onrender.com/api/health`
   - Should return: `{"status": "healthy", ...}`

2. **Check Frontend:**
   - Visit: `https://insider-threat-frontend.onrender.com`
   - Should show the login page

3. **Test Login:**
   - Username: `admin` | Password: `admin123`
   - Should successfully log in and show dashboard

### Step 5: Access Your Application

- **Frontend URL:** `https://insider-threat-frontend.onrender.com`
- **Backend API:** `https://insider-threat-backend.onrender.com`
- **API Docs:** `https://insider-threat-backend.onrender.com/docs`

## 🔍 Troubleshooting

### If backend won't start:
- Check logs in Render dashboard
- Verify `DATABASE_URL` is set correctly
- Wait 2-3 minutes after database creation

### If frontend can't connect to API:
- Verify `REACT_APP_API_URL` is set correctly
- **Redeploy frontend** after setting the variable
- Check browser console for errors

### If database connection fails:
- Wait for database to fully initialize (2-3 minutes)
- Verify using internal database URL (auto-set by Render)

## 📝 Notes

- **Free tier services sleep after 15 minutes** of inactivity
- First request after sleep may take 30-60 seconds to wake up
- Database initialization happens automatically on first backend start
- Demo data (50 users) is populated automatically

## ✅ Post-Deployment

- [ ] Backend is running and healthy
- [ ] Frontend is accessible
- [ ] Can log in with admin credentials
- [ ] Dashboard loads correctly
- [ ] API endpoints respond

---

**Need help?** Check `RENDER_DEPLOYMENT.md` for detailed documentation.

