# 🚀 GitHub Hosting Guide

**Step-by-step guide to host SentinelIQ on GitHub**

---

## Prerequisites

- ✅ Git installed on your system
- ✅ GitHub account created
- ✅ Project ready (all files in place)

---

## Step 1: Initialize Git Repository

Open terminal in the project directory and run:

```bash
cd /Users/abhinavpv/Desktop/insider-threat-detection

# Initialize git repository
git init

# Check status
git status
```

---

## Step 2: Add All Files

```bash
# Add all files (respects .gitignore)
git add .

# Verify what will be committed
git status
```

**Note:** The `.gitignore` file will automatically exclude:
- `node_modules/`
- `__pycache__/`
- `.env` files
- Build artifacts
- Other unnecessary files

---

## Step 3: Make Initial Commit

```bash
# Create initial commit
git commit -m "Initial commit: SentinelIQ - Insider Threat Detection System

- Complete FastAPI backend with ML models
- React frontend dashboard
- Docker-based deployment
- Comprehensive documentation
- Pre-trained ML models included"

# Verify commit
git log
```

---

## Step 4: Create GitHub Repository

### Option A: Using GitHub Website (Recommended)

1. **Go to GitHub:** https://github.com
2. **Click the "+" icon** (top right) → **"New repository"**
3. **Fill in repository details:**
   - **Repository name:** `insider-threat-detection` (or your preferred name)
   - **Description:** `Enterprise-Grade AI/ML-Powered Insider Threat Detection Platform`
   - **Visibility:** 
     - ✅ **Public** (if you want it visible to everyone)
     - ✅ **Private** (if you want it private)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. **Click "Create repository"**

### Option B: Using GitHub CLI (if installed)

```bash
# Install GitHub CLI if not installed: brew install gh
gh auth login
gh repo create insider-threat-detection --public --description "Enterprise-Grade AI/ML-Powered Insider Threat Detection Platform"
```

---

## Step 5: Connect Local Repository to GitHub

After creating the repository on GitHub, you'll see instructions. Use these commands:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/insider-threat-detection.git

# Verify remote was added
git remote -v
```

**Example:**
```bash
git remote add origin https://github.com/abhinavpv/insider-threat-detection.git
```

---

## Step 6: Push Code to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push code to GitHub
git push -u origin main
```

**If prompted for credentials:**
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)
  - Generate token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Scopes needed: `repo` (full control of private repositories)

---

## Step 7: Update README with Repository URL

After pushing, update the README to replace placeholder URLs:

```bash
# Edit README.md and replace <repository-url> with actual URL
```

**Find and replace:**
- `git clone <repository-url>` → `git clone https://github.com/YOUR_USERNAME/insider-threat-detection.git`

---

## Step 8: Add Repository Topics (Optional but Recommended)

On GitHub repository page:

1. Click the **⚙️ gear icon** next to "About"
2. Add topics:
   - `cybersecurity`
   - `machine-learning`
   - `threat-detection`
   - `fastapi`
   - `react`
   - `docker`
   - `insider-threat`
   - `ml-models`
   - `anomaly-detection`

---

## Step 9: Verify Everything Works

1. **Check repository on GitHub:**
   - Visit: `https://github.com/YOUR_USERNAME/insider-threat-detection`
   - Verify all files are present
   - Check README displays correctly

2. **Test cloning:**
   ```bash
   cd /tmp
   git clone https://github.com/YOUR_USERNAME/insider-threat-detection.git
   cd insider-threat-detection
   ls -la
   ```

3. **Test Docker setup:**
   ```bash
   docker-compose up -d
   docker-compose exec backend python populate_database.py
   ```

---

## 🎯 Quick Command Summary

```bash
# 1. Initialize
cd /Users/abhinavpv/Desktop/insider-threat-detection
git init

# 2. Add files
git add .

# 3. Commit
git commit -m "Initial commit: SentinelIQ - Insider Threat Detection System"

# 4. Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/insider-threat-detection.git

# 5. Push
git branch -M main
git push -u origin main
```

---

## 🔐 Security Checklist

Before pushing, verify:

- ✅ No `.env` files with real credentials
- ✅ No API keys hardcoded in code
- ✅ Database passwords in docker-compose.yml are for demo only
- ✅ `.gitignore` properly configured
- ✅ No sensitive data in commit history

**If you accidentally committed sensitive data:**
```bash
# Remove sensitive file from git (but keep local)
git rm --cached .env

# Update .gitignore
echo ".env" >> .gitignore

# Commit the fix
git add .gitignore
git commit -m "Remove sensitive files from repository"
git push
```

---

## 📝 Post-Upload Tasks

1. **Update README URLs:**
   - Replace `<repository-url>` with actual GitHub URL
   - Add badges (optional):
     ```markdown
     [![GitHub](https://img.shields.io/github/stars/YOUR_USERNAME/insider-threat-detection?style=social)](https://github.com/YOUR_USERNAME/insider-threat-detection)
     ```

2. **Add License File** (if needed):
   ```bash
   # Create LICENSE file
   # Choose appropriate license (MIT, Apache 2.0, etc.)
   ```

3. **Set up GitHub Pages** (optional):
   - For hosting documentation
   - Settings → Pages → Select branch → Save

4. **Enable Issues and Discussions** (optional):
   - Settings → General → Features
   - Enable Issues, Discussions, Projects

---

## 🐛 Troubleshooting

### Issue: "Authentication failed"

**Solution:**
- Use Personal Access Token instead of password
- Generate token: GitHub → Settings → Developer settings → Personal access tokens

### Issue: "Repository not found"

**Solution:**
- Check repository name matches
- Verify you have access to the repository
- Check remote URL: `git remote -v`

### Issue: "Large files warning"

**Solution:**
- Check `.gitignore` includes large files
- Models (.pkl files) are included intentionally
- If needed, use Git LFS for large files

### Issue: "Merge conflicts"

**Solution:**
- If GitHub initialized with README, pull first:
  ```bash
  git pull origin main --allow-unrelated-histories
  # Resolve conflicts if any
  git push -u origin main
  ```

---

## ✅ Success Checklist

- [ ] Git repository initialized
- [ ] All files committed
- [ ] GitHub repository created
- [ ] Remote added and verified
- [ ] Code pushed to GitHub
- [ ] README updated with actual URL
- [ ] Repository topics added
- [ ] Tested cloning in fresh directory
- [ ] Docker setup verified

---

## 🎉 You're Done!

Your project is now hosted on GitHub! Share the repository URL:

**Repository URL:** `https://github.com/YOUR_USERNAME/insider-threat-detection`

---

**Need Help?**
- GitHub Docs: https://docs.github.com
- Git Documentation: https://git-scm.com/doc

