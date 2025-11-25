# 🚨 Anomaly Trigger Guide - Complete Instructions

This guide explains how to trigger anomalies in the SentinelIQ system for testing and demonstration purposes.

---

## 🎯 Overview

The system supports three methods to trigger anomalies:

1. **Dashboard UI** (Easiest - Recommended)
2. **Command Line Script**
3. **API Direct Call**

---

## 🎯 Method 1: Using Dashboard (Easiest - Recommended)

### Step-by-Step Instructions:

#### 1. Login as Admin

```
URL: http://localhost:3000
Username: admin
Password: admin123
```

#### 2. Navigate to Simulation Tab

- Click on **"Simulation"** in the top navigation bar
- You'll see the Simulation page with user selection and anomaly types

#### 3. Select User

- Choose a user from the dropdown menu
- Recommended for demo: **"Abhinav Gadde" (U002)** or **"Abhinav P V" (U001)**

#### 4. Choose Anomaly Type

Three types available:

**a) Data Exfiltration:**

- Creates 5 large file accesses (100-200MB each)
- Creates 3 external emails with large attachments
- Typical ITS Score: 75-90
- Risk Level: High/Critical

**b) Off-Hours Activity:**

- Creates 8 late-night logons (22:00-23:59)
- All timestamps are in the past (12-36 hours ago)
- Typical ITS Score: 60-80
- Risk Level: High

**c) Insider Sabotage:**

- Creates 10 file deletions
- Targets sensitive/critical files
- Typical ITS Score: 70-85
- Risk Level: High/Critical

#### 5. Trigger Anomaly

- Click the **"Trigger Anomaly"** button
- Wait for success notification: "✅ Anomaly triggered successfully!"
- The button shows loading state during processing

#### 6. View Results

After triggering, check these locations:

**a) Alerts Tab:**

- Click "Alerts" in navigation
- New alert appears with red "NEW" badge
- Shows user, timestamp, ITS score, risk level

**b) Incidents Tab:**

- Click "Incidents" in navigation
- New incident created with status "open"
- Can be resolved or marked as "in_progress"

**c) Overview Tab:**

- User's ITS score increased (60-90)
- User appears in "Top Risky Users" section
- Risk level changed to "High" or "Critical"

**d) Intelligence Tab:**

- Select the user from dropdown
- See detailed analytics and anomalies
- View behavioral patterns

**e) Activity Timeline:**

- Go to user detail view
- See new activities in timeline
- Activities show with timestamps

---

## 🎯 Method 2: Using Command Line Script

### Quick Script Usage:

```bash
cd /Users/abhinavpv/Desktop/insider-threat-detection

# Trigger data exfiltration for U001
./trigger_anomaly.sh U001 data_exfiltration

# Trigger off-hours for U002
./trigger_anomaly.sh U002 off_hours

# Trigger sabotage for U003
./trigger_anomaly.sh U003 sabotage
```

### Available Commands:

```bash
# Data exfiltration (most common)
./trigger_anomaly.sh U001 data_exfiltration
./trigger_anomaly.sh U002 data_exfiltration
./trigger_anomaly.sh U003 data_exfiltration

# Off-hours activity
./trigger_anomaly.sh U001 off_hours
./trigger_anomaly.sh U002 off_hours
./trigger_anomaly.sh U003 off_hours

# Insider sabotage
./trigger_anomaly.sh U001 sabotage
./trigger_anomaly.sh U002 sabotage
./trigger_anomaly.sh U003 sabotage
```

### Script Output:

```
✅ Anomaly triggered successfully!
User: Abhinav Gadde (U002)
Anomaly Type: data_exfiltration
ITS Score: 78.5
Risk Level: high
Alert ID: ALT00042
```

---

## 🎯 Method 3: Using API Directly

### Using cURL:

```bash
# Trigger data exfiltration for U001
curl -X POST "http://localhost:8000/api/trigger/anomaly?user_id=U001&anomaly_type=data_exfiltration"

# Trigger off-hours for U002
curl -X POST "http://localhost:8000/api/trigger/anomaly?user_id=U002&anomaly_type=off_hours"

# Trigger sabotage for U003
curl -X POST "http://localhost:8000/api/trigger/anomaly?user_id=U003&anomaly_type=sabotage"
```

### Using Python:

```python
import requests

# Trigger anomaly
response = requests.post(
    "http://localhost:8000/api/trigger/anomaly",
    params={
        "user_id": "U001",
        "anomaly_type": "data_exfiltration"
    }
)

print(response.json())
```

### API Response:

```json
{
  "status": "success",
  "user_id": "U001",
  "anomaly_type": "data_exfiltration",
  "its_score": 78.5,
  "risk_level": "high",
  "alert_id": "ALT00042",
  "activities_created": 8
}
```

---

## 📊 What Happens After Triggering

### Immediate Results:

1. **Activities Created:**

   - 5-10 suspicious activities generated
   - Stored in database with timestamps
   - Visible in activity timeline

2. **ITS Score Updated:**

   - Score increases to 60-90 (High/Critical)
   - Risk level changes automatically
   - Updated in real-time

3. **Alert Generated:**

   - Appears in "Alerts" tab
   - Shows "NEW" badge if unread
   - Contains user, timestamp, score, anomalies

4. **Incident Created:**

   - Appears in "Incidents" tab
   - Status: "open"
   - Can be resolved or updated

5. **Activity Timeline:**
   - New activities appear
   - Shows file accesses, emails, logons
   - Timestamps are in the past (not future)

---

## 🔍 Verify Alert Was Created

### Check Alerts via API:

```bash
curl http://localhost:8000/api/alerts | python3 -m json.tool
```

### Check User's ITS Score:

```bash
curl http://localhost:8000/api/users/U002 | python3 -m json.tool
```

### Check Dashboard:

- Go to Alerts tab
- Look for new alert with red badge
- Check user's ITS score in Overview tab

---

## 🎯 Quick Demo Workflow

### Complete Step-by-Step Demo:

1. **Open Dashboard:**

   ```
   http://localhost:3000
   Login: admin / admin123
   ```

2. **Go to Simulation Tab:**

   - Click "Simulation" in navigation

3. **Trigger Anomaly:**

   - Select: "Abhinav Gadde" (U002)
   - Choose: "Data Exfiltration"
   - Click: "Trigger Anomaly"
   - Wait for: "✅ Anomaly triggered successfully!" message

4. **Check Alerts:**

   - Click "Alerts" tab
   - See new alert with "NEW" badge
   - Alert shows U002, high risk, ITS score

5. **Check Incidents:**

   - Click "Incidents" tab
   - See new incident for U002
   - Status: "open"

6. **Check Overview:**

   - Go to "Overview" tab
   - U002's ITS score increased
   - Appears in "Top Risky Users"

7. **Check Intelligence:**
   - Go to "Intelligence" tab
   - Select "Abhinav Gadde" from dropdown
   - See detailed analytics and anomalies

---

## 🚨 Anomaly Types Explained

### 1. Data Exfiltration

**What it creates:**

- 5 large file accesses (100-200MB each)
- Files in `/finance/confidential_*.xlsx`
- 3 external emails with large attachments (80-120MB)
- Suspicious keywords detected

**Typical Results:**

- ITS Score: 75-90
- Risk Level: High/Critical
- Alert Type: Data exfiltration detected

**Use Case:** Simulating employee stealing confidential data

---

### 2. Off-Hours Activity

**What it creates:**

- 8 late-night logons (22:00-23:59)
- Timestamps are in the past (12-36 hours ago)
- Geographic anomalies possible
- Unusual access patterns

**Typical Results:**

- ITS Score: 60-80
- Risk Level: High
- Alert Type: Off-hours activity detected

**Use Case:** Simulating unauthorized access after hours

---

### 3. Insider Sabotage

**What it creates:**

- 10 file deletions
- Targets critical project files
- Sensitive file access patterns
- Destructive behavior

**Typical Results:**

- ITS Score: 70-85
- Risk Level: High/Critical
- Alert Type: Insider sabotage detected

**Use Case:** Simulating malicious file deletion

---

## 💡 Pro Tips

### 1. Refresh After Triggering:

- Dashboard auto-refreshes every 30 seconds
- Or manually refresh (F5) to see updates immediately

### 2. Multiple Anomalies:

- Trigger different types for different users
- See how system handles multiple threats
- Compare ITS scores across users

### 3. Check Activity Timeline:

- Go to user detail view
- See new activities in timeline
- Verify timestamps are correct (not future)

### 4. Watch Real-Time:

- Keep dashboard open while triggering
- See updates appear automatically
- Alerts appear in real-time

### 5. Test Alert System:

- Trigger anomaly
- Open Alerts tab (auto-marks as viewed)
- Badge count becomes zero
- Alert shows as viewed

---

## ✅ Success Indicators

After triggering, you should see:

- ✅ Success notification: "✅ Anomaly triggered successfully!"
- ✅ Alert in "Alerts" tab with "NEW" badge
- ✅ Incident in "Incidents" tab (status: "open")
- ✅ User's ITS score increased (60-90)
- ✅ Risk level changed to "High" or "Critical"
- ✅ Activities in timeline
- ✅ User appears in "Top Risky Users"

---

## 🔧 Troubleshooting

### Anomaly Not Triggering:

1. Check backend is running: `docker-compose ps`
2. Check API is accessible: `curl http://localhost:8000/api/dashboard/stats`
3. Verify user exists: `curl http://localhost:8000/api/users/U001`
4. Check browser console for errors

### Alert Not Appearing:

1. Refresh dashboard (F5)
2. Check Alerts tab (not Incidents tab)
3. Verify ITS score ≥ 40
4. Check alert threshold in backend

### Activities Not Showing:

1. Check activity timeline for user
2. Verify timestamps are correct
3. Refresh dashboard
4. Check database for activities

---

## 📝 Notes

- **Timestamps:** All generated activities have timestamps in the past (not future)
- **Auto-Refresh:** Dashboard refreshes every 30 seconds
- **Badge Count:** Shows only unread alerts
- **Mark as Viewed:** Alerts auto-mark when Alerts tab is opened

---

**Ready to trigger?** Go to Simulation tab and click "Trigger Anomaly"!

**Need help?** Check [PROJECT_EXPLANATION.md](PROJECT_EXPLANATION.md) for more details.
