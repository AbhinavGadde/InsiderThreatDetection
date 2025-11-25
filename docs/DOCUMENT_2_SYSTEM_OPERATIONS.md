# 🔧 SentinelIQ - System Operations & Data Flow

**Complete Guide to How the System Operates, Processes Data, and Displays Information**

---

## 📋 Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Agent Operations](#agent-operations)
3. [Backend Processing](#backend-processing)
4. [Frontend Dashboard Logic](#frontend-dashboard-logic)
5. [Data Flow & Transformations](#data-flow--transformations)
6. [Docker & Deployment](#docker--deployment)
7. [Real-Time Updates Mechanism](#real-time-updates-mechanism)
8. [Graphs & Visualizations Logic](#graphs--visualizations-logic)

---

## 🏗️ System Architecture Overview

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: PRESENTATION LAYER                              │
│  React Frontend (Port 3000)                             │
│  - User Interface                                        │
│  - Real-time Data Display                                │
│  - Interactive Charts                                    │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST API
┌────────────────────┴────────────────────────────────────┐
│  TIER 2: APPLICATION LAYER                              │
│  FastAPI Backend (Port 8000)                            │
│  - Business Logic                                       │
│  - ML Model Inference                                   │
│  - Threat Detection Engine                              │
│  - API Endpoints                                        │
└────────────────────┬────────────────────────────────────┘
                     │ SQL Queries
┌────────────────────┴────────────────────────────────────┐
│  TIER 3: DATA LAYER                                     │
│  PostgreSQL Database (Port 5432)                         │
│  - Users, Activities, Alerts, Incidents                 │
│  - Historical Data                                      │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction

```
Agent (Laptop) → Backend API → Database
                      ↓
                  ML Models
                      ↓
                  Alert Generation
                      ↓
Frontend Dashboard ← API Polling ← Database
```

---

## 🤖 Agent Operations

### What the Agent Does

The agent (`agent/realtime_monitor.py`) runs on employee laptops and:

1. **Monitors System Activity:**
   - File system access (read, write, delete)
   - Process execution
   - Network connections
   - Login/logout events

2. **Detects Anomalies Locally:**
   - Large files (>50MB)
   - Off-hours activity (before 7 AM, after 7 PM)
   - Sensitive file access
   - Suspicious processes

3. **Sends to Backend:**
   - Aggregates activities
   - Sends every 5 seconds
   - Includes metadata (timestamp, file size, etc.)

### Agent Architecture

```python
# agent/realtime_monitor.py

class RealtimeMonitorAgent:
    def __init__(self, user_id, server_url):
        self.user_id = user_id
        self.server_url = server_url
        self.file_monitor = FileSystemMonitor()
        self.process_monitor = ProcessMonitor()
        self.network_monitor = NetworkMonitor()
        self.aggregator = ActivityAggregator()
    
    def start(self):
        # Start all monitors
        self.file_monitor.start()
        self.process_monitor.start()
        self.network_monitor.start()
        
        # Start aggregator (sends to backend)
        self.aggregator.start()
```

### How Agent Detects Anomalies

```python
# agent/realtime_monitor.py - AnomalyDetector class

class AnomalyDetector:
    def is_anomaly(self, activity: Dict) -> tuple:
        """Check if activity is anomalous"""
        details = activity.get('details', {})
        
        # File anomalies
        if details.get('size_mb', 0) > 50:  # Large file
            return True, "Large file access"
        
        if details.get('sensitive', False):  # Sensitive file
            return True, "Sensitive file access"
        
        # Off-hours check
        current_hour = datetime.now().hour
        if current_hour < 7 or current_hour >= 19:
            return True, "Off-hours activity"
        
        return False, ""
```

### Agent → Backend Communication

```python
# agent/realtime_monitor.py - ActivityAggregator

class ActivityAggregator:
    def upload_activities(self):
        """Send activities to backend"""
        activities_to_send = self.get_pending_activities()
        
        payload = {
            'user_id': self.user_id,
            'activities': activities_to_send
        }
        
        # POST to backend
        response = requests.post(
            f"{self.server_url}/api/activities/ingest",
            json=payload,
            timeout=10
        )
        
        if response.ok:
            result = response.json()
            if result.get('status') == 'alert_generated':
                # Alert was generated!
                print("🚨 ALERT GENERATED:", result.get('explanation'))
```

**Key Points:**
- Agent sends **all activities** (not just anomalies)
- Backend does final ML analysis
- Agent gets alert confirmation from backend
- Upload interval: 5 seconds (configurable)

---

## ⚙️ Backend Processing

### Activity Ingestion Flow

```python
# backend/main.py - ingest_activity()

@app.post("/api/activities/ingest")
async def ingest_activity(activity: UserActivity):
    # 1. Store activity in database
    activity_log = ActivityLog(
        user_id=activity.user_id,
        timestamp=activity.timestamp,
        activity_type=activity.activity_type,
        details=activity.details
    )
    db.add(activity_log)
    db.commit()
    
    # 2. Get recent activities for context
    recent_activities = get_recent_activities(db, user_id, hours=1)
    
    # 3. ML-based anomaly detection
    is_anomaly, ml_score, explanation = ml_detector.detect_anomaly(
        activity_dict, user_id, recent_activities
    )
    
    # 4. Check for duplicate (fingerprint)
    fingerprint = ml_detector.generate_fingerprint(activity_dict, user_id)
    if is_duplicate(fingerprint):
        return {'status': 'suppressed'}
    
    # 5. If anomaly detected, generate alert
    if is_anomaly and ml_score >= 0.3:  # 30% threshold
        # Calculate ITS score
        score_data = ThreatDetectionEngine.calculate_its_score(db, user_id)
        
        # Create alert
        alert = ThreatAlertDB(
            user_id=user_id,
            timestamp=datetime.now(),  # Real-time timestamp!
            its_score=score_data['its_score'],
            risk_level=score_data['risk_level'],
            anomalies=score_data['anomalies'],
            explanation=explanation,
            status='open',
            is_viewed=False
        )
        db.add(alert)
        db.commit()
        
        return {'status': 'alert_generated', 'its_score': score_data['its_score']}
    
    return {'status': 'logged'}
```

### ITS Score Calculation (Detailed)

```python
# backend/main.py - ThreatDetectionEngine.calculate_its_score()

@staticmethod
def calculate_its_score(db: Session, user_id: str) -> Dict:
    """Calculate Insider Threat Score using ensemble ML"""
    
    # 1. Get user's activities from last 7 days
    cutoff = datetime.now() - timedelta(days=7)
    activities_db = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.timestamp >= cutoff
    ).all()
    
    # 2. Convert to list of dicts
    activities = [
        {
            'activity_type': a.activity_type,
            'timestamp': a.timestamp,
            'details': a.details
        }
        for a in activities_db
    ]
    
    # 3. Extract features (20+ features)
    features_df = ThreatDetectionEngine.extract_features(
        user_id, activities, user.role
    )
    
    # 4. Scale features
    features_scaled = models.scaler.transform(features_df)
    
    # 5. Run ML models
    xgb_proba = models.xgb_model.predict_proba(features_scaled)[0][1]
    rf_proba = models.rf_model.predict_proba(features_scaled)[0][1]
    iso_score = models.iso_forest.decision_function(features_scaled)[0]
    iso_score_norm = max(0, min(1, (iso_score + 0.5) / 1.0))
    
    # 6. Ensemble calculation (weighted average)
    ensemble_score = (xgb_proba * 0.50) + (rf_proba * 0.30) + (iso_score_norm * 0.20)
    
    # 7. Convert to 0-100 scale
    its_score = ensemble_score * 100.0
    
    # 8. Apply baseline (minimum score for users with activity)
    if its_score < 8.0 and len(activities) > 0:
        its_score = 8.0 + (len(activities) * 0.1)
    
    # 9. Cap at 100
    its_score = min(its_score, 100.0)
    
    # 10. Determine risk level
    if its_score >= 75: risk_level = 'critical'
    elif its_score >= 50: risk_level = 'high'
    elif its_score >= 25: risk_level = 'medium'
    else: risk_level = 'low'
    
    return {
        'its_score': its_score,
        'risk_level': risk_level,
        'anomalies': identify_anomalies(features_df),
        'explanation': generate_explanation(its_score, features_df)
    }
```

### Feature Extraction (How Features are Created)

```python
# backend/main.py - extract_features()

@staticmethod
def extract_features(user_id: str, activities: List[Dict], user_role: str) -> pd.DataFrame:
    """Extract 20+ features from activities"""
    
    df = pd.DataFrame(activities)
    
    # Separate by activity type
    logon_activities = df[df['activity_type'] == 'logon']
    file_activities = df[df['activity_type'] == 'file_access']
    email_activities = df[df['activity_type'] == 'email']
    
    # Calculate logon hour (average)
    logon_hour = logon_activities['timestamp'].apply(lambda x: x.hour).mean()
    
    # Build feature dictionary
    features = {
        'role_encoded': role_mapping.get(user_role, 0),
        'logon_hour': logon_hour,
        'logon_count': len(logon_activities),
        'geo_anomaly': sum(logon_activities['details'].apply(lambda x: x.get('geo_anomaly', 0))),
        'file_accesses': len(file_activities),
        'sensitive_file_access': sum(file_activities['details'].apply(lambda x: 1 if x.get('sensitive') else 0)),
        'file_download_size_mb': sum(file_activities['details'].apply(lambda x: x.get('size_mb', 0))),
        'emails_sent': len(email_activities),
        'external_emails': sum(email_activities['details'].apply(lambda x: 1 if x.get('external') else 0)),
        'large_attachments': sum(email_activities['details'].apply(lambda x: 1 if x.get('attachment_size_mb', 0) > 10 else 0)),
        'suspicious_keywords': sum(email_activities['details'].apply(lambda x: x.get('suspicious_keywords', 0))),
    }
    
    # Derived features
    features['off_hours'] = 1 if features['logon_hour'] < 7 or features['logon_hour'] > 19 else 0
    features['file_to_email_ratio'] = features['file_accesses'] / (features['emails_sent'] + 1)
    features['external_email_ratio'] = features['external_emails'] / (features['emails_sent'] + 1)
    features['sensitive_access_rate'] = features['sensitive_file_access'] / (features['file_accesses'] + 1)
    
    # Moving averages (simplified)
    features['logon_count_ma7'] = features['logon_count']
    features['file_accesses_ma7'] = features['file_accesses']
    features['emails_ma7'] = features['emails_sent']
    
    return pd.DataFrame([features])
```

**Key Features Explained:**
- `logon_hour`: Average hour of logons (0-23)
- `sensitive_file_access`: Count of sensitive files accessed
- `off_hours`: 1 if activity outside 7 AM - 7 PM
- `external_email_ratio`: Percentage of emails to external domains
- `file_download_size_mb`: Total MB downloaded

---

## 🎨 Frontend Dashboard Logic

### How Frontend Fetches Data

```javascript
// frontend/src/App.js

// 1. Fetch Dashboard Stats (every 3 seconds)
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch(`${API_URL}/api/dashboard/stats`);
    const data = await response.json();
    
    setDashboardStats({
      total_users: data.total_users,
      active_threats: data.active_threats,
      alerts_today: data.alerts_today,
      average_its: data.average_its,
      ensemble_accuracy: data.ensemble_accuracy
    });
  };
  
  fetchStats();
  const interval = setInterval(fetchStats, 3000);  // Every 3 seconds
  return () => clearInterval(interval);
}, [API_URL]);

// 2. Fetch Alerts (every 3 seconds)
useEffect(() => {
  const fetchAlerts = async () => {
    const response = await fetch(`${API_URL}/api/alerts?limit=50`);
    const data = await response.json();
    setAlerts(data);
    
    // Update badge count (unread alerts)
    const unreadCount = data.filter(a => !a.is_viewed).length;
    // Badge updates automatically
  };
  
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 3000);
  return () => clearInterval(interval);
}, [API_URL]);

// 3. Fetch Users (every 5 seconds)
useEffect(() => {
  const fetchUsers = async () => {
    const response = await fetch(`${API_URL}/api/users`);
    const data = await response.json();
    
    // Filter by role
    if (currentUser?.role === 'user') {
      // User sees only their data
      const userProfile = data.find(u => u.user_id === currentUser.userId);
      setUsers(userProfile ? [userProfile] : []);
    } else {
      // Admin sees all users
      setUsers(data || []);
    }
  };
  
  fetchUsers();
  const interval = setInterval(fetchUsers, 5000);
  return () => clearInterval(interval);
}, [API_URL, currentUser]);
```

### How Dashboard Displays Data

**KPI Cards:**
```javascript
// Dashboard Overview - KPI Cards
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* Total Users Card */}
  <div className="bg-white rounded-lg p-6 shadow">
    <p className="text-gray-600">Total Users</p>
    <p className="text-3xl font-bold">{dashboardStats.total_users}</p>
  </div>
  
  {/* Active Threats Card */}
  <div className="bg-white rounded-lg p-6 shadow">
    <p className="text-gray-600">Active Threats</p>
    <p className="text-3xl font-bold text-red-600">{dashboardStats.active_threats}</p>
  </div>
  
  {/* Alerts Today Card */}
  <div className="bg-white rounded-lg p-6 shadow">
    <p className="text-gray-600">Alerts Today</p>
    <p className="text-3xl font-bold text-orange-600">{dashboardStats.alerts_today}</p>
  </div>
  
  {/* Average ITS Card */}
  <div className="bg-white rounded-lg p-6 shadow">
    <p className="text-gray-600">Average ITS</p>
    <p className="text-3xl font-bold">{dashboardStats.average_its.toFixed(1)}</p>
  </div>
</div>
```

**User List Table:**
```javascript
// User List with Risk Badges
{users.map(user => (
  <tr key={user.user_id}>
    <td>{user.name}</td>
    <td>{user.user_id}</td>
    <td>
      <span className={`px-2 py-1 rounded ${
        user.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
        user.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
        user.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
        'bg-green-100 text-green-700'
      }`}>
        {user.risk_level}
      </span>
    </td>
    <td className="font-bold">{user.its_score.toFixed(1)}</td>
  </tr>
))}
```

---

## 📊 Data Flow & Transformations

### Complete Data Journey

```
1. EMPLOYEE ACTION
   ↓
   Employee accesses file (75MB, confidential, 11 PM)
   
2. AGENT DETECTION
   ↓
   FileSystemMonitor detects file access
   Creates activity object:
   {
     user_id: "U001",
     activity_type: "file_access",
     timestamp: "2025-11-16T23:00:00",
     details: {
       file_path: "/Documents/confidential.pdf",
       size_mb: 75.5,
       sensitive: true,
       action: "read"
     }
   }
   
3. AGENT → BACKEND
   ↓
   POST /api/activities/ingest
   {
     "user_id": "U001",
     "timestamp": "2025-11-16T23:00:00",
     "activity_type": "file_access",
     "details": {...}
   }
   
4. BACKEND STORAGE
   ↓
   INSERT INTO activity_logs
   (user_id, timestamp, activity_type, details)
   VALUES ('U001', '2025-11-16 23:00:00', 'file_access', '{...}')
   
5. FEATURE EXTRACTION
   ↓
   extract_features() creates:
   {
     file_accesses: 1,
     sensitive_file_access: 1,
     file_download_size_mb: 75.5,
     off_hours: 1,  # 11 PM = off-hours
     logon_hour: 23
   }
   
6. ML MODEL PREDICTION
   ↓
   XGBoost: 0.85 (85% threat)
   Random Forest: 0.82 (82% threat)
   Isolation Forest: -0.3 → normalized to 0.65
   
7. ENSEMBLE CALCULATION
   ↓
   (0.85 × 0.50) + (0.82 × 0.30) + (0.65 × 0.20)
   = 0.425 + 0.246 + 0.130
   = 0.801
   ITS Score = 0.801 × 100 = 80.1
   
8. ALERT GENERATION
   ↓
   ITS ≥ 40 → Generate Alert!
   INSERT INTO threat_alerts
   (user_id, timestamp, its_score, risk_level, anomalies, explanation)
   VALUES ('U001', NOW(), 80.1, 'critical', 
           ['Large file access', 'Off-hours activity', 'Sensitive file'],
           'ITS Score: 80.1. Large file access (75.5MB) during off-hours (23:00)')
   
9. FRONTEND POLLING
   ↓
   GET /api/alerts (every 3 seconds)
   Response: [
     {
       alert_id: "ALT00001",
       user_id: "U001",
       timestamp: "2025-11-16T23:00:00",
       its_score: 80.1,
       risk_level: "critical",
       anomalies: ["Large file access", "Off-hours activity"],
       is_viewed: false
     }
   ]
   
10. DASHBOARD DISPLAY
    ↓
    - Badge count increments (1 unread alert)
    - Alert appears in Alerts tab
    - User's ITS score updates to 80.1
    - Risk badge changes to "critical"
```

### Timestamp Handling (Critical!)

**Problem:** PostgreSQL stores timestamps in UTC, but we need local time (IST) in frontend.

**Solution:**

**Backend:**
```python
# backend/main.py
import pytz

local_tz = pytz.timezone('Asia/Kolkata')

# When retrieving from database
timestamp = activity.timestamp  # Naive datetime (assumed UTC)
if timestamp.tzinfo is None:
    utc_timestamp = pytz.UTC.localize(timestamp)
    local_timestamp = utc_timestamp.astimezone(local_tz)
    timestamp_str = local_timestamp.replace(tzinfo=None).isoformat()
```

**Frontend:**
```javascript
// frontend/src/App.js - formatTimestamp()

const formatTimestamp = (timestamp) => {
  // Parse ISO string without timezone as LOCAL time
  const [datePart, timePart] = timestamp.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Create Date in LOCAL timezone (not UTC!)
  const date = new Date(year, month - 1, day, hour, minute, second);
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

---

## 🐳 Docker & Deployment

### Docker Compose Architecture

```yaml
# docker-compose.yml

services:
  # Database Service
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: insider_threat_db
      POSTGRES_USER: threat_admin
      POSTGRES_PASSWORD: secure_password_123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Health check ensures DB is ready before backend starts
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U threat_admin"]
      interval: 10s

  # Backend Service
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql://threat_admin:secure_password_123@db:5432/insider_threat_db
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app  # Live code reload
      - ./models:/app/models  # ML models
    depends_on:
      db:
        condition: service_healthy  # Wait for DB to be ready
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"  # Nginx serves on port 80 inside container
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://localhost:8000
```

### How Docker Works

1. **Build Process:**
   ```bash
   docker-compose build
   # Builds each service's Docker image
   ```

2. **Start Services:**
   ```bash
   docker-compose up -d
   # Starts all services in order:
   # 1. Database (no dependencies)
   # 2. Backend (waits for DB health check)
   # 3. Frontend (waits for backend)
   ```

3. **Service Communication:**
   - Services communicate via Docker network (`threat_network`)
   - Backend connects to DB using service name: `db:5432`
   - Frontend connects to backend using service name: `backend:8000`
   - External access: `localhost:3000` (frontend), `localhost:8000` (backend)

### Dockerfile Examples

**Backend Dockerfile:**
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy code
COPY . .

# Expose port
EXPOSE 8000

# Run server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🔄 Real-Time Updates Mechanism

### How Real-Time Works

**Frontend Polling Strategy:**

```javascript
// Multiple useEffect hooks for different data types

// 1. Dashboard Stats (every 3 seconds)
useEffect(() => {
  const fetchStats = async () => {
    const response = await fetch(`${API_URL}/api/dashboard/stats`);
    const data = await response.json();
    setDashboardStats(data);
  };
  
  fetchStats();
  const interval = setInterval(fetchStats, 3000);
  return () => clearInterval(interval);  // Cleanup on unmount
}, [API_URL]);

// 2. Alerts (every 3 seconds)
useEffect(() => {
  const fetchAlerts = async () => {
    const response = await fetch(`${API_URL}/api/alerts?limit=50`);
    const data = await response.json();
    setAlerts(data);
  };
  
  fetchAlerts();
  const interval = setInterval(fetchAlerts, 3000);
  return () => clearInterval(interval);
}, [API_URL]);

// 3. Users (every 5 seconds)
useEffect(() => {
  const fetchUsers = async () => {
    const response = await fetch(`${API_URL}/api/users`);
    const data = await response.json();
    setUsers(data);
  };
  
  fetchUsers();
  const interval = setInterval(fetchUsers, 5000);
  return () => clearInterval(interval);
}, [API_URL]);
```

**Why Polling Instead of WebSockets?**

- **Simplicity:** No need for WebSocket server
- **Reliability:** Works with standard HTTP
- **Scalability:** Easy to scale with load balancers
- **Trade-off:** Slight delay (3-5 seconds) vs instant updates

**Update Flow:**
```
1. Agent sends activity → Backend
2. Backend processes → Creates alert in DB
3. Frontend polls /api/alerts (every 3s)
4. New alert detected → State updates
5. React re-renders → Alert appears in UI
```

---

## 📈 Graphs & Visualizations Logic

### 1. ITS Score Trend Chart

**Data Source:**
```javascript
// Fetch historical ITS data
const fetchHistoricalITS = async () => {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/historical-its?days=7`
  );
  const data = await response.json();
  setItsScoreTrend(data.trend);
};

// Data format:
[
  { day: 'Day 1', date: '2025-11-10', score: 25.3, alerts: 2, activities: 45 },
  { day: 'Day 2', date: '2025-11-11', score: 28.7, alerts: 1, activities: 52 },
  ...
]
```

**Chart Rendering:**
```javascript
// Using Recharts
<LineChart data={itsScoreTrend}>
  <XAxis dataKey="day" />
  <YAxis />
  <CartesianGrid strokeDasharray="3 3" />
  <Tooltip />
  <Line 
    type="monotone" 
    dataKey="score" 
    stroke="#3b82f6" 
    strokeWidth={2}
  />
</LineChart>
```

**Backend Calculation:**
```python
# backend/main.py - get_user_historical_its()

# For each day in last 7 days:
for i in range(days):
    day_date = start_date + timedelta(days=i)
    
    # Get activities for this day
    day_activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id,
        ActivityLog.timestamp >= day_start,
        ActivityLog.timestamp < day_end
    ).all()
    
    # Calculate ITS score for this day
    features_df = extract_features(user_id, day_activities, user.role)
    xgb_proba = models.xgb_model.predict_proba(features_df)[0][1]
    iso_score = models.iso_forest.decision_function(features_df)[0]
    ensemble_score = (xgb_proba * 0.50) + (iso_score_norm * 0.30) + ...
    its_score = ensemble_score * 100.0
    
    # Save snapshot
    snapshot = HistoricalITSScore(
        user_id=user_id,
        date=day_start,
        its_score=its_score,
        alert_count=day_alerts_count,
        activity_count=len(day_activities)
    )
    db.add(snapshot)
```

### 2. Risk Distribution Pie Chart

**Data Source:**
```javascript
// Calculate from users array
const riskDistribution = useMemo(() => {
  const counts = {
    critical: users.filter(u => u.risk_level === 'critical').length,
    high: users.filter(u => u.risk_level === 'high').length,
    medium: users.filter(u => u.risk_level === 'medium').length,
    low: users.filter(u => u.risk_level === 'low').length
  };
  
  return [
    { name: 'Critical', value: counts.critical, color: '#ef4444' },
    { name: 'High', value: counts.high, color: '#f97316' },
    { name: 'Medium', value: counts.medium, color: '#eab308' },
    { name: 'Low', value: counts.low, color: '#22c55e' }
  ];
}, [users]);
```

**Chart Rendering:**
```javascript
<PieChart>
  <Pie
    data={riskDistribution}
    dataKey="value"
    nameKey="name"
    cx="50%"
    cy="50%"
    outerRadius={100}
    label
  >
    {riskDistribution.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip />
  <Legend />
</PieChart>
```

### 3. Activity Timeline

**Data Source:**
```javascript
// Fetch user activities
const fetchUserActivities = async (userId) => {
  const response = await fetch(
    `${API_URL}/api/users/${userId}/activities?days=7`
  );
  const data = await response.json();
  setUserActivities(data.activities);
};

// Data format:
[
  {
    user_id: "U001",
    timestamp: "2025-11-16T23:00:00",
    activity_type: "file_access",
    details: {
      file_path: "/Documents/file.pdf",
      size_mb: 75.5,
      action: "read"
    }
  },
  ...
]
```

**Display Logic:**
```javascript
// Render activities in timeline
{userActivities.map((activity, idx) => (
  <div key={idx} className="flex items-start space-x-4 p-4">
    {/* Icon based on activity type */}
    {activity.activity_type === 'file_access' && <FileText />}
    {activity.activity_type === 'email' && <Mail />}
    {activity.activity_type === 'logon' && <Activity />}
    
    {/* Activity details */}
    <div>
      <p className="font-medium">{activity.activity_type}</p>
      <p className="text-sm text-gray-500">
        {formatTimestamp(activity.timestamp)}
      </p>
      <p className="text-xs text-gray-400">
        {formatTimeAgo(activity.timestamp)}
      </p>
    </div>
  </div>
))}
```

---

## 🔍 Key Operational Details

### Alert Generation Logic

**When is an alert generated?**

1. **ML Detection:**
   - ML score ≥ 30% (confidence threshold)
   - OR Isolation Forest detects anomaly

2. **ITS Threshold:**
   - ITS score ≥ 40
   - OR Risk level = High/Critical

3. **Deduplication:**
   - Same anomaly within 24 hours → Suppressed
   - Uses fingerprint hash for detection

**Alert Lifecycle:**
```
Activity → ML Analysis → Anomaly Detected → ITS Calculated → 
ITS ≥ 40 → Alert Created → Stored in DB → Frontend Polls → 
Alert Displayed → Admin Views → Marked as Viewed
```

### Auto-Escalation (Alert → Incident)

**When alerts become incidents:**

```python
# backend/main.py - Auto-escalation logic

# High-risk alerts automatically become incidents
if alert.risk_level in ['high', 'critical'] and alert.its_score >= 60:
    # Check if incident already exists
    existing_incident = db.query(Incident).filter(
        Incident.user_id == alert.user_id,
        Incident.status != 'resolved',
        Incident.timestamp >= datetime.now() - timedelta(hours=1)
    ).first()
    
    if not existing_incident:
        # Create incident
        incident = Incident(
            user_id=alert.user_id,
            threat_id=alert.alert_id,
            timestamp=alert.timestamp,
            incident_type='auto_escalated',
            severity=alert.risk_level,
            ml_incident_score=alert.its_score / 100.0,
            its_score=alert.its_score,
            description=alert.explanation,
            evidence={'alert_id': alert.alert_id},
            status='open'
        )
        db.add(incident)
        db.commit()
```

---

## 🎯 Summary: How Everything Works Together

1. **Agent monitors** employee laptop → Detects activity
2. **Agent sends** activity to backend every 5 seconds
3. **Backend stores** activity in database
4. **Backend extracts** 20+ features from activity
5. **Backend runs** 3 ML models (XGBoost, RF, IF)
6. **Backend calculates** ensemble ITS score (0-100)
7. **If ITS ≥ 40** → Backend creates alert in database
8. **Frontend polls** `/api/alerts` every 3 seconds
9. **Frontend receives** new alert → Updates state
10. **React re-renders** → Alert appears in dashboard
11. **Admin sees** alert → Investigates → Takes action

**All happens in real-time with <10 second latency!**

---

**Last Updated:** November 2025  
**Version:** 1.0.0

