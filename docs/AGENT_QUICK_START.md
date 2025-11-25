# 🚀 SentinelIQ Real-Time Monitoring Agent

**Complete Guide to Setting Up and Using the Monitoring Agent**

Production-ready, enterprise-grade activity monitoring agent for real-time employee tracking and insider threat detection.

---

## 📋 Table of Contents

- [Features](#features)
- [Quick Setup (5 Minutes)](#quick-setup-5-minutes)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Monitoring Capabilities](#monitoring-capabilities)
- [Anomaly Detection](#anomaly-detection)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## ✨ Features

- **Native OS Integration**: Uses platform-specific APIs for efficient monitoring

  - macOS: FSEvents for real-time file system monitoring
  - Windows: Event Log and File System Watcher
  - Linux: inotify for file system events

- **Comprehensive Activity Tracking**:

  - File system access (read, write, delete)
  - Process execution and monitoring
  - Network connections and data transfer
  - Login/logout and session activity

- **Real-Time Updates**: Immediate synchronization with backend (configurable interval, default 5 seconds)

- **Robust Error Handling**: Automatic retry logic, graceful degradation, comprehensive logging

- **Resource Efficient**: Intelligent batching, circular buffers, minimal system impact

- **Security**: Secure communication, authentication support, sensitive file detection

---

## ⚡ Quick Setup (5 Minutes)

### Step 1: Copy Files to Remote System

Copy these **2 files only** to the target system:

1. **`agent/realtime_monitor.py`** - Main agent script
2. **`agent/requirements.txt`** - Python dependencies

**Copy methods:**

- USB drive
- Email/Cloud (zip the 2 files)
- Network share
- Git clone (if repo is shared)

### Step 2: Create Folder

```bash
# macOS/Linux
mkdir ~/sentinel-agent && cd ~/sentinel-agent

# Windows
mkdir C:\sentinel-agent && cd C:\sentinel-agent
```

### Step 3: Install Dependencies

```bash
# macOS/Linux
pip3 install -r requirements.txt
pip3 install pyobjc-framework-Cocoa pyobjc-framework-FSEvents  # macOS only

# Windows
pip install -r requirements.txt
pip install pywin32  # Windows only

# Linux
pip3 install -r requirements.txt
pip3 install pyinotify  # Linux only
```

### Step 4: Find Server IP

**On the admin's system (where SentinelIQ backend is running):**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

**Note the IP address** (e.g., `192.168.1.100`)

### Step 5: Run Agent

```bash
# Monitor Abhinav P V (U001)
python3 realtime_monitor.py --user-id U001 --server http://localhost:8000

# Monitor Abhinav Gadde (U002) on remote server
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000

# Monitor Indushree (U003) with custom interval
python3 realtime_monitor.py --user-id U003 --server http://localhost:8000 --interval 3
```

**Replace `192.168.1.100` with your actual server IP!**

---

## ✅ Verify It's Working

### Check Agent Output

You should see:

```
🚀 SentinelIQ Enterprise Real-Time Monitoring Agent v2.0
======================================================================
User: Abhinav Gadde (U002)
Platform: Darwin 24.6.0
Server: http://192.168.1.100:8000
Upload Interval: 5 seconds
Monitoring: Files | Processes | Network | Logins
======================================================================
[2025-11-14 20:15:05] [INFO] ✅ Backend connection: SUCCESS
[2025-11-14 20:15:05] [INFO] Starting real-time monitoring agent...
📊 Monitoring system activity...
```

### Check Admin Dashboard

1. Login as admin (`admin` / `admin123`)
2. Go to **Overview** tab
3. Look for activities appearing for the monitored user
4. Check **Alerts** tab for any anomalies detected

### Trigger Test Anomaly

1. Access a large file (>50MB) on the monitored system
2. Check agent terminal - should show alert
3. Check admin dashboard - alert should appear within 5 seconds

---

## 📦 Installation

### Quick Install (macOS)

```bash
pip3 install -r requirements.txt

# Optional: Install platform-specific dependencies for enhanced monitoring
# macOS:
#   pip3 install pyobjc-framework-Cocoa pyobjc-framework-FSEvents
# Linux:
#   pip3 install pyinotify
# Windows:
#   pip install pywin32
```

### Manual Installation

```bash
# Install core dependencies
pip install -r requirements.txt

# macOS specific
pip install pyobjc-framework-Cocoa pyobjc-framework-FSEvents

# Linux specific
pip install pyinotify

# Windows specific
pip install pywin32
```

### Using Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

---

## 🚀 Usage

### Command Line Arguments

- `--user-id` (required): User ID (U001, U002, or U003)
- `--server` (optional): Backend server URL (default: http://localhost:8000)
- `--interval` (optional): Upload interval in seconds (default: 5)

### Basic Usage Examples

```bash
# Monitor Abhinav P V (U001) on localhost
python3 realtime_monitor.py --user-id U001 --server http://localhost:8000

# Monitor Abhinav Gadde (U002) on remote server
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000

# Monitor Indushree (U003) with custom interval (3 seconds)
python3 realtime_monitor.py --user-id U003 --server http://localhost:8000 --interval 3
```

---

## 🏗️ Architecture

### Components

1. **FileSystemMonitor**: Monitors file access, modifications, and deletions
2. **ProcessMonitor**: Tracks process execution and suspicious activities
3. **NetworkMonitor**: Monitors network connections and data transfer
4. **LoginMonitor**: Tracks login/logout and session activity
5. **ActivityAggregator**: Aggregates activities and sends to backend with retry logic

### Data Flow

```
OS Activity → Native Monitor → Event Queue → Aggregator → Backend API
```

### Configuration

The agent uses intelligent defaults but can be customized:

- **Upload Interval**: How often to send activities (default: 5 seconds)
- **Monitored Paths**: User directories (Documents, Downloads, Desktop)
- **Sensitive Patterns**: Keywords for sensitive file detection
- **Retry Logic**: Automatic retry with exponential backoff

---

## 📊 Monitoring Capabilities

### File System

- Real-time file access tracking
- Sensitive file detection
- File size monitoring
- Action detection (read/write/delete)

### Process

- New process detection
- Suspicious process identification
- Resource usage tracking
- Off-hours activity detection

### Network

- External connection tracking
- Data transfer monitoring
- Suspicious port detection
- Connection count tracking

### Login

- Session activity tracking
- Off-hours login detection
- IP address tracking
- Device identification

---

## 🔍 Anomaly Detection

The agent uses intelligent anomaly detection based on:

- **File Access Patterns**: Large files (>50MB), sensitive directories, rapid access
- **Process Monitoring**: Suspicious processes (nmap, wireshark, etc.)
- **Network Activity**: External connections, high data transfer
- **Time Patterns**: Off-hours activity (before 7 AM or after 7 PM)
- **Behavioral Deviations**: Rapid activity spikes, unusual patterns

### Alert Thresholds

- **Large file access**: >50MB
- **Sensitive file**: finance/, hr/, confidential/ directories
- **Rapid access**: 10+ files in 5 minutes
- **Off-hours**: Before 7 AM or after 7 PM
- **Suspicious process**: Security tools, network scanners
- **External email**: >50MB attachment

---

## 🔒 Security & Privacy

- All communication with backend is over HTTP/HTTPS
- No data is stored locally (only in-memory buffers)
- Sensitive file detection is pattern-based (no content scanning)
- Agent can be stopped at any time with Ctrl+C

---

## 🛠️ Troubleshooting

### Connection Issues

```bash
# Test backend connection
curl http://localhost:8000/api/health

# Check agent logs
# Agent will show connection status on startup
```

**Common Solutions:**

- Verify backend is running: `docker-compose ps`
- Check firewall settings
- Verify server IP address is correct
- Check network connectivity

### Permission Issues

- **macOS**: May need to grant Full Disk Access in System Preferences
- **Windows**: Run as Administrator for full monitoring
- **Linux**: May need to run with appropriate permissions

### Performance Issues

- Increase upload interval: `--interval 10`
- Reduce monitored paths (edit config in `realtime_monitor.py`)
- Check system resources: `top` or Task Manager

### Installation Issues

**macOS - Xcode Required:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Then install macOS dependencies
pip install pyobjc-framework-Cocoa pyobjc-framework-FSEvents
```

**Note**: Agent will work without Xcode using fallback polling-based monitoring, but native FSEvents is more efficient.

---

## 📝 Logging

The agent provides structured logging:

- `[INFO]`: General information
- `[WARN]`: Warnings (non-critical issues)
- `[ERROR]`: Errors (connection failures, etc.)
- `[DEBUG]`: Debug information (detailed activity)

---

## 📊 Statistics

On shutdown (Ctrl+C), the agent displays:

- Total activities sent
- Error count
- Last successful upload
- Last error (if any)

---

## 🆘 Support

For issues or questions:

1. Check backend is running: `http://localhost:8000/api/health`
2. Verify user ID is correct (U001, U002, or U003)
3. Check network connectivity
4. Review agent logs for specific errors
5. Check [docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment issues

---

## 📄 License

Proprietary - SentinelIQ Security Platform

---

**Last Updated:** November 2025  
**Version:** 2.0.0
