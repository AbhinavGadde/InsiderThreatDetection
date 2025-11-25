# 🌐 Network Setup for Windows Agent

## Quick Fix (5 Minutes)

The IP `10.66.100.255` is not reachable. Follow these steps:

### Step 1: Find Correct Server IP

**On the SERVER machine (where backend is running):**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

**Copy the IP address (e.g., `192.168.1.100`)**

### Step 2: Test Connection

**On Windows laptop:**

```powershell
# Replace with your server IP
ping 192.168.1.100
Test-NetConnection -ComputerName 192.168.1.100 -Port 8000
```

### Step 3: Configure Firewall

**Run PowerShell as Administrator:**

```powershell
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow
```

### Step 4: Run Agent

```powershell
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
```

---

## Automated Setup (Easiest)

### Option 1: Use PowerShell Script

**Run PowerShell as Administrator:**

```powershell
.\setup_windows_network.ps1
```

This will:
- ✅ Configure firewall automatically
- ✅ Test connection
- ✅ Provide exact command to run

### Option 2: Use IP Finder

```powershell
python3 find_server_ip.py
```

This will:
- ✅ Scan network for server
- ✅ Test common IPs
- ✅ Provide exact command

---

## Complete Guide

See: `docs/NETWORK_SETUP_WINDOWS.md`

