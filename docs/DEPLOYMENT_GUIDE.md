# 🚀 SentinelIQ - Deployment Guide

**Complete guide for deploying the Insider Threat Detection System**

---

## 📋 Prerequisites

### System Requirements

- **OS:** macOS, Linux, or Windows (with WSL2)
- **RAM:** Minimum 4GB, Recommended 8GB+
- **Disk:** 10GB free space
- **CPU:** 2+ cores recommended

### Software Requirements

- **Docker Desktop:** v20.10 or higher
- **Docker Compose:** v2.0 or higher
- **Git:** For cloning repository
- **Ports Available:** 3000, 8000, 5432

---

## 🐳 Docker Deployment (Recommended)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd insider-threat-detection
```

### Step 2: Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Initialize Database

```bash
# Initialize database schema
docker-compose exec api python -c "from database import init_db; init_db()"

# Populate with demo data
docker-compose exec api python populate_database.py
```

### Step 4: Verify Deployment

```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:8000/api/health

# Check database
docker-compose exec db psql -U threat_admin -d insider_threat_db -c "SELECT COUNT(*) FROM users;"
```

### Step 5: Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Admin Login:** `admin` / `admin123`

---

## 🔧 Service Management

### Start Services

```bash
docker-compose up -d
```

### Stop Services

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### Rebuild Services

```bash
# Rebuild all
docker-compose build --no-cache

# Rebuild specific service
docker-compose build --no-cache frontend
docker-compose build --no-cache backend
```

---

## 📊 Service Ports

| Service      | Port | Description     |
| ------------ | ---- | --------------- |
| **Frontend** | 3000 | React dashboard |
| **Backend**  | 8000 | FastAPI server  |
| **Database** | 5432 | PostgreSQL      |

---

## 🔐 Environment Variables

### Backend Environment

Create `.env` file in `backend/` directory:

```env
DATABASE_URL=postgresql://threat_admin:secure_password_123@db:5432/insider_threat_db
API_URL=http://localhost:8000
ENVIRONMENT=production
```

### Frontend Environment

Create `.env` file in `frontend/` directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

---

## 🗄️ Database Management

### Initialize Database

```bash
docker-compose exec api python -c "from database import init_db; init_db()"
```

### Populate Demo Data

```bash
docker-compose exec api python populate_database.py
```

### Backup Database

```bash
docker-compose exec db pg_dump -U threat_admin insider_threat_db > backup.sql
```

### Restore Database

```bash
docker-compose exec -T db psql -U threat_admin insider_threat_db < backup.sql
```

### Access Database

```bash
docker-compose exec db psql -U threat_admin -d insider_threat_db
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Clear Database

```bash
# WARNING: This deletes all data
docker-compose exec db psql -U threat_admin -d insider_threat_db -c "TRUNCATE TABLE users, activity_logs, threat_alerts CASCADE;"
```

### Reset Everything

```bash
# Stop and remove all containers
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d

# Reinitialize
docker-compose exec api python -c "from database import init_db; init_db()"
docker-compose exec api python populate_database.py
```

---

## 🚀 Production Deployment

### Security Considerations

1. **Change Default Passwords:**

   - Update database password
   - Update admin credentials
   - Use strong passwords

2. **Enable HTTPS:**

   - Use reverse proxy (Nginx)
   - Configure SSL certificates
   - Force HTTPS redirect

3. **Environment Variables:**

   - Use secure secret management
   - Don't commit `.env` files
   - Use different credentials per environment

4. **Database Security:**

   - Use strong database passwords
   - Limit database access
   - Enable SSL connections

5. **API Security:**
   - Implement JWT authentication
   - Add rate limiting
   - Enable CORS properly

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    restart: always

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - ENVIRONMENT=production
    restart: always
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=insider_threat_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
```

### Deploy to Cloud

#### Option 1: AWS/GCP/Azure

- Use managed PostgreSQL
- Deploy containers to ECS/GKE/AKS
- Use load balancer
- Configure auto-scaling

#### Option 2: Railway/Render

- Connect GitHub repository
- Auto-deploy on push
- Use managed PostgreSQL
- Configure environment variables

---

## 🧪 Testing Deployment

### Health Checks

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:8000/api/health

# Database
docker-compose exec db pg_isready -U threat_admin
```

### Functional Tests

```bash
# Test API endpoints
curl http://localhost:8000/api/dashboard/stats
curl http://localhost:8000/api/users
curl http://localhost:8000/api/alerts

# Test anomaly trigger
curl -X POST "http://localhost:8000/api/trigger/anomaly?user_id=U001&anomaly_type=data_exfiltration"
```

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Check port availability
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db psql -U threat_admin -d insider_threat_db -c "SELECT 1;"
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Check API URL
curl http://localhost:8000/api/health
```

### Backend Errors

```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Check database connection
docker-compose exec backend python -c "from database import SessionLocal; db = SessionLocal(); db.close()"
```

---

## 📈 Monitoring

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🔄 Backup & Recovery

### Backup Strategy

1. **Database Backup:**

   ```bash
   docker-compose exec db pg_dump -U threat_admin insider_threat_db > backup_$(date +%Y%m%d).sql
   ```

2. **Model Files:**

   ```bash
   tar -czf models_backup_$(date +%Y%m%d).tar.gz models/
   ```

3. **Configuration:**
   ```bash
   cp docker-compose.yml docker-compose.yml.backup
   cp .env .env.backup
   ```

### Recovery

```bash
# Restore database
docker-compose exec -T db psql -U threat_admin insider_threat_db < backup_20241114.sql

# Restore models
tar -xzf models_backup_20241114.tar.gz
```

---

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Review system requirements
- [ ] Install Docker Desktop
- [ ] Clone repository
- [ ] Check port availability

### Deployment

- [ ] Start services with `docker-compose up -d`
- [ ] Initialize database
- [ ] Populate demo data
- [ ] Verify all services running

### Post-Deployment

- [ ] Test frontend access
- [ ] Test backend API
- [ ] Test login functionality
- [ ] Test anomaly triggering
- [ ] Verify alerts generation

### Production

- [ ] Change default passwords
- [ ] Configure HTTPS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Document credentials securely

---

## 🆘 Support

For deployment issues:

1. Check logs: `docker-compose logs`
2. Review documentation in `docs/` folder
3. Check API health: `curl http://localhost:8000/api/health`
4. Verify database: `docker-compose exec db psql -U threat_admin -d insider_threat_db`

---

**Last Updated:** November 14, 2024  
**Version:** 1.0.0
