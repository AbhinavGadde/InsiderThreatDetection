# 📡 SentinelIQ - Complete API Documentation

**RESTful API Reference for Insider Threat Detection System**

Base URL: `http://localhost:8000`

---

## 🔐 Authentication

Currently, authentication is handled via frontend session management. All endpoints are accessible without explicit authentication tokens (for development). In production, implement JWT or OAuth2.

---

## 📊 Core Endpoints

### 1. Health Check

**GET** `/api/health`

Check API health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-11-14T10:30:00Z"
}
```

---

### 2. Dashboard Statistics

**GET** `/api/dashboard/stats`

Get dashboard statistics including total users, high-risk users, alerts, and average ITS score.

**Response:**

```json
{
  "total_users": 50,
  "active_threats": 5,
  "alerts_today": 12,
  "average_its": 45.3,
  "high_risk_users": 5,
  "recent_alerts": [
    {
      "alert_id": "ALT00042",
      "user_id": "U002",
      "timestamp": "2024-11-14T10:25:00Z",
      "its_score": 78.5,
      "risk_level": "high",
      "anomalies": ["data_exfiltration", "off_hours"],
      "explanation": "Large file downloads detected"
    }
  ]
}
```

---

### 3. Get All Users

**GET** `/api/users`

Get list of all monitored users.

**Response:**

```json
[
  {
    "user_id": "U001",
    "name": "Abhinav P V",
    "email": "abhinav.pv@example.com",
    "role": "Developer",
    "department": "Engineering",
    "its_score": 35.2,
    "risk_level": "low",
    "status": "active"
  }
]
```

---

### 4. Get User Details

**GET** `/api/users/{user_id}`

Get detailed information about a specific user.

**Parameters:**

- `user_id` (path): User ID (e.g., "U001")

**Response:**

```json
{
  "user_id": "U001",
  "name": "Abhinav P V",
  "email": "abhinav.pv@example.com",
  "role": "Developer",
  "department": "Engineering",
  "its_score": 35.2,
  "risk_level": "low",
  "status": "active"
}
```

---

### 5. Get User Activities

**GET** `/api/users/{user_id}/activities`

Get activity timeline for a specific user.

**Parameters:**

- `user_id` (path): User ID
- `days` (query, optional): Number of days to retrieve (default: 7)

**Example:**

```
GET /api/users/U001/activities?days=7
```

**Response:**

```json
[
  {
    "activity_id": 12345,
    "timestamp": "2024-11-14T10:30:00Z",
    "activity_type": "file_access",
    "details": {
      "file_path": "/finance/report.xlsx",
      "action": "read",
      "size_mb": 15.5,
      "sensitive": true
    },
    "ip_address": "192.168.1.100",
    "device_id": "laptop-001"
  }
]
```

---

## 🚨 Alert Endpoints

### 6. Get Alerts

**GET** `/api/alerts`

Get recent threat alerts.

**Parameters:**

- `limit` (query, optional): Maximum number of alerts (default: 50)
- `unread_only` (query, optional): Filter only unread alerts (default: false)

**Example:**

```
GET /api/alerts?limit=20&unread_only=true
```

**Response:**

```json
[
  {
    "alert_id": "ALT00042",
    "alert_db_id": 42,
    "user_id": "U002",
    "timestamp": "2024-11-14T10:25:00Z",
    "its_score": 78.5,
    "risk_level": "high",
    "anomalies": ["data_exfiltration", "off_hours"],
    "explanation": "Large file downloads detected",
    "status": "open",
    "is_viewed": false
  }
]
```

---

### 7. Mark Alerts as Viewed

**POST** `/api/alerts/mark-viewed`

Mark alerts as viewed. If no alert_ids provided, marks all unread alerts.

**Request Body:**

```json
{
  "alert_ids": [42, 43, 44] // Optional: null to mark all
}
```

**Response:**

```json
{
  "status": "success",
  "marked_count": 3
}
```

---

## 📝 Incident Endpoints

### 8. Get Incidents

**GET** `/api/incidents`

Get all security incidents.

**Parameters:**

- `status` (query, optional): Filter by status (open, in_progress, resolved)
- `limit` (query, optional): Maximum number of incidents (default: 100)

**Example:**

```
GET /api/incidents?status=open&limit=50
```

**Response:**

```json
[
  {
    "id": "INC-042",
    "alert_id": 42,
    "user": "Abhinav Gadde",
    "user_id": "U002",
    "severity": "high",
    "status": "open",
    "created": "2024-11-14T10:25:00Z",
    "description": "Large file downloads detected",
    "its_score": 78.5,
    "resolution_notes": null
  }
]
```

---

### 9. Create Incident

**POST** `/api/incidents`

Create a new incident manually.

**Request Body:**

```json
{
  "user_id": "U002",
  "severity": "high",
  "description": "Suspicious activity detected",
  "explanation": "Multiple large file downloads to external email"
}
```

**Response:**

```json
{
  "id": "INC-043",
  "alert_id": 43,
  "user": "Abhinav Gadde",
  "user_id": "U002",
  "severity": "high",
  "status": "open",
  "created": "2024-11-14T10:30:00Z",
  "description": "Suspicious activity detected",
  "its_score": 50.0
}
```

---

### 10. Update Incident Status

**PATCH** `/api/incidents/{alert_id}/status`

Update incident status (e.g., to 'in_progress').

**Parameters:**

- `alert_id` (path): Alert/Incident ID

**Request Body:**

```json
{
  "status": "in_progress"
}
```

**Response:**

```json
{
  "status": "updated",
  "incident_id": 42,
  "new_status": "in_progress"
}
```

---

### 11. Resolve Incident

**POST** `/api/incidents/{alert_id}/resolve`

Resolve an incident with resolution notes.

**Parameters:**

- `alert_id` (path): Alert/Incident ID

**Request Body:**

```json
{
  "resolution_notes": "Investigated and confirmed false positive. User was authorized to download files for project."
}
```

**Response:**

```json
{
  "status": "resolved",
  "incident_id": 42,
  "resolved_at": "2024-11-14T10:35:00Z"
}
```

---

## 📊 Analytics Endpoints

### 12. Get Model Analytics

**GET** `/api/analytics/models`

Get ML model performance analytics.

**Response:**

```json
{
  "models": [
    {
      "name": "XGBoost",
      "f1": 0.884,
      "auc": 0.953,
      "accuracy": 0.914,
      "weight": "50%",
      "weight_calculation": "Based on highest combined F1 and AUC scores",
      "color": "bg-blue-600",
      "type": "supervised"
    },
    {
      "name": "Random Forest",
      "f1": 0.871,
      "auc": 0.937,
      "accuracy": 0.897,
      "weight": "30%",
      "weight_calculation": "Based on strong F1 and AUC performance",
      "color": "bg-green-600",
      "type": "supervised"
    },
    {
      "name": "Isolation Forest",
      "f1": 0.795,
      "auc": 0.892,
      "accuracy": 0.834,
      "weight": "20%",
      "weight_calculation": "Based on F1 and AUC - lower but valuable for anomaly detection",
      "color": "bg-purple-600",
      "type": "unsupervised"
    }
  ],
  "ensemble": {
    "overall_accuracy": 0.898,
    "ensemble_accuracy_percentage": 89.8,
    "explanation": "Combining multiple models improves accuracy...",
    "benefits": [
      "Reduces overfitting by combining diverse model perspectives",
      "Improves generalization to unseen threats",
      "Lowers false positive rate through consensus voting"
    ],
    "calculation": "Ensemble Accuracy = (XGBoost × 0.50) + (Random Forest × 0.30) + (Isolation Forest × 0.20) = 0.898 = 89.8%"
  },
  "system_stats": {
    "activities_processed": 1247893,
    "false_positive_rate": 3.2,
    "detection_time_ms": 48
  },
  "feature_importance": [
    { "name": "Off-hours activity", "importance": 0.18 },
    { "name": "Sensitive file access", "importance": 0.16 }
  ]
}
```

---

## 🔍 Intelligence Endpoints

### 13. Get User Intelligence

**GET** `/api/intelligence/{user_id}`

Get detailed intelligence and analytics for a specific user.

**Parameters:**

- `user_id` (path): User ID

**Response:**

```json
{
  "name": "Abhinav Gadde",
  "user_id": "U002",
  "its_score": 78.5,
  "risk_level": "high",
  "risk_trend": [
    { "date": "2024-11-08", "score": 35.2 },
    { "date": "2024-11-09", "score": 42.1 },
    { "date": "2024-11-10", "score": 55.3 }
  ],
  "behavioral_patterns": {
    "off_hours_activity": 75.5,
    "sensitive_file_access": 82.3,
    "external_email_ratio": 68.9
  },
  "anomalies": [
    "Large file downloads detected",
    "Off-hours access patterns",
    "External email with large attachments"
  ]
}
```

---

## 🚀 Activity & Simulation Endpoints

### 14. Ingest Activity

**POST** `/api/activities/ingest`

Ingest new user activity for real-time monitoring.

**Request Body:**

```json
{
  "user_id": "U001",
  "activity_type": "file_access",
  "timestamp": "2024-11-14T10:30:00Z",
  "details": {
    "file_path": "/finance/report.xlsx",
    "action": "read",
    "size_mb": 15.5,
    "sensitive": true
  },
  "ip_address": "192.168.1.100",
  "device_id": "laptop-001"
}
```

**Response:**

```json
{
  "status": "ok",
  "activity_logged": true,
  "its_score": 45.3,
  "alert": {
    "alert_id": "ALT00042",
    "its_score": 78.5,
    "risk_level": "high"
  }
}
```

---

### 15. Trigger Anomaly

**POST** `/api/trigger/anomaly`

Trigger a synthetic anomaly for testing purposes.

**Parameters:**

- `user_id` (query): User ID
- `anomaly_type` (query): Type of anomaly (data_exfiltration, off_hours, sabotage)

**Example:**

```
POST /api/trigger/anomaly?user_id=U002&anomaly_type=data_exfiltration
```

**Response:**

```json
{
  "status": "success",
  "user_id": "U002",
  "anomaly_type": "data_exfiltration",
  "its_score": 78.5,
  "risk_level": "high",
  "alert_id": "ALT00042",
  "activities_created": 8
}
```

---

### 16. Simulate Activity

**POST** `/api/simulate/activity`

Simulate user activities for testing.

**Parameters:**

- `user_id` (query): User ID
- `activity_count` (query, optional): Number of activities (default: 10)

**Example:**

```
POST /api/simulate/activity?user_id=U001&activity_count=20
```

---

## 📊 Graph & Geospatial Endpoints

### 17. Get Graph Intelligence

**GET** `/api/graph/intelligence`

Get network graph intelligence data.

**Response:**

```json
{
  "nodes": [
    { "id": "U001", "type": "user", "risk": "low" },
    { "id": "file_001", "type": "file", "sensitive": true }
  ],
  "edges": [{ "source": "U001", "target": "file_001", "weight": 0.8 }]
}
```

---

### 18. Get Geospatial Anomalies

**GET** `/api/geospatial/anomalies`

Get geospatial anomaly data.

**Response:**

```json
{
  "anomalies": [
    {
      "location": "New York, USA",
      "user": "Abhinav Gadde",
      "time": "2 hours ago",
      "risk": "High"
    }
  ]
}
```

---

## 🔧 Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "detail": "Invalid request parameters"
}
```

### 404 Not Found

```json
{
  "detail": "User not found"
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error"
}
```

---

## 📝 Request/Response Formats

### Timestamps

All timestamps are in ISO 8601 format: `YYYY-MM-DDTHH:MM:SSZ`

### Activity Types

- `logon` - User login events
- `logoff` - User logout events
- `file_access` - File read/write/delete
- `email` - Email sent/received

### Risk Levels

- `critical` - ITS ≥ 80
- `high` - ITS ≥ 60
- `medium` - ITS ≥ 40
- `low` - ITS < 40

### Incident Status

- `open` - New incident
- `in_progress` - Being investigated
- `resolved` - Closed with resolution

---

## 🔗 Interactive API Documentation

The API includes interactive Swagger documentation:

**Swagger UI:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`

---

## 📚 Example Usage

### Using cURL

```bash
# Get dashboard stats
curl http://localhost:8000/api/dashboard/stats

# Get all users
curl http://localhost:8000/api/users

# Get user activities
curl http://localhost:8000/api/users/U001/activities?days=7

# Trigger anomaly
curl -X POST "http://localhost:8000/api/trigger/anomaly?user_id=U002&anomaly_type=data_exfiltration"

# Create incident
curl -X POST http://localhost:8000/api/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "U002",
    "severity": "high",
    "description": "Suspicious activity",
    "explanation": "Large file downloads"
  }'
```

### Using Python

```python
import requests

# Get dashboard stats
response = requests.get("http://localhost:8000/api/dashboard/stats")
stats = response.json()

# Trigger anomaly
response = requests.post(
    "http://localhost:8000/api/trigger/anomaly",
    params={"user_id": "U002", "anomaly_type": "data_exfiltration"}
)
result = response.json()
```

---

## 🔐 Security Notes

- All endpoints should use HTTPS in production
- Implement authentication tokens (JWT)
- Rate limiting recommended
- Input validation on all endpoints
- SQL injection protection via ORM

---

**Last Updated:** November 14, 2024  
**API Version:** 1.0.0
