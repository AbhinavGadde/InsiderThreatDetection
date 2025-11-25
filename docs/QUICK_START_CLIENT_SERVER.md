# 🚀 Quick Start: Client vs Server Setup

**Clear instructions on what to run where**

---

## 📍 Overview

- **SERVER**: Where backend is running (your Mac/Linux machine)
- **CLIENT**: Windows laptop running the agent

---

## 🖥️ SERVER SIDE (Your Mac/Linux Machine)

### Step 1: Find Your Server IP Address

**On the SERVER machine:**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# OR simpler
ifconfig | grep "inet "
```

**Example output:**
```
inet 192.168.1.100 netmask 0xffffff00 broadcast 192.168.1.255
```

**Your server IP is:** `192.168.1.100` (use this IP, NOT 127.0.0.1)

### Step 2: Verify Backend is Running

```bash
# Check if backend is running
docker-compose ps

# Test API locally
curl http://localhost:8000/api/health
```

**Expected output:**
```json
{"status":"healthy","models_loaded":true}
```

### Step 3: Share the IP with Client

**Tell the Windows laptop user:**
- Server IP: `192.168.1.100` (or whatever your IP is)
- Port: `8000`

**That's it for the server!** ✅

---

## 💻 CLIENT SIDE (Windows Laptop)

### Option 1: Automated Setup (Easiest) ⭐

**Step 1: Run PowerShell as Administrator**

1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to agent folder:
   ```powershell
   cd C:\Abhinav\major_project
   ```

**Step 2: Run Setup Script**

```powershell
.\setup_windows_network.ps1
```

**The script will:**
- ✅ Show your network configuration
- ✅ Configure Windows Firewall automatically
- ✅ Ask for server IP (enter the IP from server)
- ✅ Test connection
- ✅ Provide exact command to run agent

**Step 3: Run Agent**

Use the command provided by the script, or:

```powershell
python3 realtime_monitor.py --user-id U002 --server http://SERVER_IP:8000
```

**Replace `SERVER_IP` with the IP from Step 1 on server (e.g., `192.168.1.100`)**

---

### Option 2: Find Server Automatically

**Step 1: Run IP Finder**

```powershell
python3 find_server_ip.py
```

**This will:**
- ✅ Scan network for server
- ✅ Test common IPs
- ✅ Provide exact command to run

**Step 2: Run Agent**

Use the command provided by the script.

---

### Option 3: Manual Setup

**Step 1: Test Connection**

```powershell
# Replace SERVER_IP with actual server IP
ping SERVER_IP
Test-NetConnection -ComputerName SERVER_IP -Port 8000
```

**Step 2: Configure Firewall (as Administrator)**

```powershell
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow
```

**Step 3: Run Agent**

```powershell
python3 realtime_monitor.py --user-id U002 --server http://SERVER_IP:8000
```

---

## 📋 Complete Example

### SERVER (Mac/Linux):

```bash
# 1. Find IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Output: inet 192.168.1.100

# 2. Verify backend
docker-compose ps
curl http://localhost:8000/api/health

# 3. Share IP: 192.168.1.100
```

### CLIENT (Windows):

```powershell
# Option A: Automated (Recommended)
.\setup_windows_network.ps1
# Enter server IP when asked: 192.168.1.100

# Option B: Manual
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
```

---

## 🎯 Quick Reference

| Task | Server | Client |
|------|--------|--------|
| Find IP | `ifconfig \| grep "inet "` | N/A |
| Configure Firewall | N/A | `setup_windows_network.ps1` |
| Test Connection | `curl http://localhost:8000/api/health` | `ping SERVER_IP` |
| Run Agent | N/A | `python3 realtime_monitor.py --user-id U002 --server http://SERVER_IP:8000` |

---

## ✅ Verification

### On SERVER:

```bash
# Should show backend running
docker-compose ps

# Should return JSON
curl http://localhost:8000/api/health
```

### On CLIENT:

```powershell
# Should get replies
ping SERVER_IP

# Should show TcpTestSucceeded: True
Test-NetConnection -ComputerName SERVER_IP -Port 8000

# Agent should show:
# ✅ Backend connection: SUCCESS
```

---

## 🐛 Troubleshooting

### Issue: Can't find server IP

**On SERVER:**
```bash
# Try these commands
ip addr show        # Linux
ifconfig           # macOS/Linux
hostname -I        # Linux
```

### Issue: Connection fails on client

**On CLIENT:**
1. Verify server IP is correct
2. Check firewall: `Get-NetFirewallRule -DisplayName "SentinelIQ*"`
3. Test ping: `ping SERVER_IP`
4. Run setup script: `.\setup_windows_network.ps1`

---

## 📝 Summary

**SERVER (Mac/Linux):**
1. ✅ Find IP: `ifconfig | grep "inet "`
2. ✅ Verify backend: `docker-compose ps`
3. ✅ Share IP with client

**CLIENT (Windows):**
1. ✅ Run: `.\setup_windows_network.ps1` (as Administrator)
2. ✅ Enter server IP when asked
3. ✅ Run agent with provided command

**That's it!** 🎉

---

**Last Updated:** November 17, 2025

