# 🌐 Windows Network Setup Guide

**Complete guide to fix network connectivity issues for SentinelIQ Agent**

---

## 🐛 Problem: Server IP Not Reachable

**Error:** `WinError 10049 - The requested address is not valid in its context`  
**Symptom:** Ping times out, agent cannot connect to server

**Root Cause:** The IP address `10.66.100.255` is not the correct server IP or not accessible from your network.

---

## 🔧 Quick Fix (5 Minutes)

### Step 1: Find Correct Server IP

**On the SERVER machine (where backend is running):**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

**Look for output like:**
```
IPv4 Address. . . . . . . . . . . : 192.168.1.100
```

**This is your server IP!**

### Step 2: Test Connection

**On the CLIENT machine (Windows laptop):**

```powershell
# Test ping
ping 192.168.1.100

# Test port
Test-NetConnection -ComputerName 192.168.1.100 -Port 8000

# Test API
curl http://192.168.1.100:8000/api/health
```

### Step 3: Configure Firewall

**On CLIENT machine (run PowerShell as Administrator):**

```powershell
# Allow outbound connections to port 8000
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow
```

### Step 4: Run Agent with Correct IP

```powershell
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
```

---

## 🤖 Automated Setup (Recommended)

### Option 1: Use Helper Script (Easiest)

**On CLIENT machine:**

```powershell
# Run as Administrator
.\setup_windows_network.ps1
```

This script will:
- ✅ Show your network configuration
- ✅ Configure Windows Firewall automatically
- ✅ Test connection to server
- ✅ Provide exact command to run agent

### Option 2: Use IP Finder Tool

**On CLIENT machine:**

```powershell
# Find server IP automatically
python3 find_server_ip.py
```

This will:
- ✅ Scan network range for server
- ✅ Test common IPs
- ✅ Provide exact command to run agent

---

## 📋 Step-by-Step Manual Setup

### 1. Find Server IP

**On SERVER machine:**

**macOS/Linux:**
```bash
ifconfig
# Look for: inet 192.168.1.100
```

**Windows:**
```powershell
ipconfig
# Look for: IPv4 Address . . . . . . . . . . . : 192.168.1.100
```

**Note:** Use the IP that is NOT `127.0.0.1` or `localhost`

### 2. Verify Server is Running

**On SERVER machine:**

```bash
# Check if backend is running
docker-compose ps

# Test API locally
curl http://localhost:8000/api/health
# Should return: {"status":"healthy","models_loaded":true}
```

### 3. Test Network Connectivity

**On CLIENT machine (Windows):**

```powershell
# Replace 192.168.1.100 with your actual server IP

# Test ping
ping 192.168.1.100

# Test port 8000
Test-NetConnection -ComputerName 192.168.1.100 -Port 8000

# Test API endpoint
curl http://192.168.1.100:8000/api/health
```

**Expected Results:**
- ✅ Ping: Should get replies
- ✅ Port: Should show `TcpTestSucceeded : True`
- ✅ API: Should return JSON with `"status":"healthy"`

### 4. Configure Firewall

**On CLIENT machine (run PowerShell as Administrator):**

```powershell
# Allow outbound to port 8000
New-NetFirewallRule -DisplayName "SentinelIQ Agent Outbound" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow

# Verify rule was created
Get-NetFirewallRule -DisplayName "SentinelIQ*"
```

### 5. Run Agent

```powershell
# Use the correct server IP
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
```

---

## 🔍 Troubleshooting

### Issue: Ping Still Fails

**Possible Causes:**
1. **Wrong Network:** Client and server on different networks
2. **VPN Required:** Need VPN to access server
3. **Server IP Changed:** Server got new IP from DHCP

**Solutions:**
1. **Check Network:**
   ```powershell
   # On CLIENT
   ipconfig
   # Note your network (e.g., 192.168.1.x)
   
   # Server should be on same network
   # If server is 10.66.100.x and you're 192.168.1.x, they're different networks
   ```

2. **Use VPN:**
   - Connect to company VPN if required
   - Then try connecting again

3. **Check Server IP Again:**
   - Server IP might have changed
   - Re-run `ipconfig` on server

### Issue: Port 8000 Not Accessible

**Possible Causes:**
1. **Firewall Blocking:** Windows Firewall blocking connection
2. **Server Firewall:** Server firewall blocking port 8000
3. **Backend Not Running:** Backend not started on server

**Solutions:**

**On CLIENT:**
```powershell
# Check firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*8000*"}

# Add rule if missing
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow
```

**On SERVER:**
```bash
# Check if backend is running
docker-compose ps

# Check backend logs
docker-compose logs backend | tail -20

# Restart backend if needed
docker-compose restart backend
```

### Issue: Different Networks

**If client and server are on different networks:**

**Option 1: Use Public IP (if server has one)**
```powershell
# Use server's public IP
python3 realtime_monitor.py --user-id U002 --server http://PUBLIC_IP:8000
```

**Option 2: Use VPN**
- Connect both to same VPN
- Use VPN-assigned IPs

**Option 3: Port Forwarding**
- Configure router to forward port 8000 to server
- Use router's public IP

---

## ✅ Verification Checklist

Before running agent, verify:

- [ ] Server IP is correct (not 127.0.0.1)
- [ ] Ping to server succeeds
- [ ] Port 8000 is accessible (`Test-NetConnection` succeeds)
- [ ] API endpoint responds (`curl http://SERVER_IP:8000/api/health`)
- [ ] Firewall allows outbound on port 8000
- [ ] Both devices on same network (or VPN)

---

## 🎯 Example: Complete Setup

### Server (192.168.1.100):

```bash
# 1. Start backend
docker-compose up -d

# 2. Verify it's running
docker-compose ps

# 3. Test locally
curl http://localhost:8000/api/health

# 4. Find IP
ifconfig | grep "inet " | grep -v 127.0.0.1
# Output: inet 192.168.1.100
```

### Client (Windows Laptop):

```powershell
# 1. Test connection
ping 192.168.1.100
Test-NetConnection -ComputerName 192.168.1.100 -Port 8000

# 2. Configure firewall (as Administrator)
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow

# 3. Run agent
python3 realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
```

---

## 🚀 Quick Commands Reference

### Find Server IP
```bash
# Server
ipconfig | findstr IPv4  # Windows
ifconfig | grep "inet "  # Linux/Mac
```

### Test Connection
```powershell
# Client
ping SERVER_IP
Test-NetConnection -ComputerName SERVER_IP -Port 8000
curl http://SERVER_IP:8000/api/health
```

### Configure Firewall
```powershell
# Client (as Administrator)
New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow
```

### Run Agent
```powershell
python3 realtime_monitor.py --user-id U002 --server http://SERVER_IP:8000
```

---

## 📝 Important Notes

1. **IP Address Format:**
   - ✅ Correct: `http://192.168.1.100:8000`
   - ❌ Wrong: `http://10.66.100.255:8000` (if not reachable)

2. **Network Requirements:**
   - Client and server must be on same network (or VPN)
   - Port 8000 must be open
   - Firewall must allow connection

3. **Agent Offline Mode:**
   - Agent will queue activities locally if connection fails
   - Activities will be sent when connection is restored
   - No data loss during network outages

---

**Last Updated:** November 17, 2025  
**Status:** ✅ Complete Network Setup Guide

