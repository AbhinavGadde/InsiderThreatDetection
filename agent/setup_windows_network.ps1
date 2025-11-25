# SentinelIQ Windows Network Setup Script
# Run this script as Administrator to configure network and firewall

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SentinelIQ Windows Network Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges" -ForegroundColor Yellow
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Show network configuration
Write-Host "📡 Network Configuration:" -ForegroundColor Cyan
Write-Host ""
ipconfig | Select-String -Pattern "IPv4|Ethernet|Wi-Fi" -Context 0,2
Write-Host ""

# Step 2: Configure Windows Firewall
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Cyan

# Allow inbound on port 8000 (if server is on this machine)
try {
    $rule = Get-NetFirewallRule -DisplayName "SentinelIQ Backend" -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host "   Firewall rule already exists" -ForegroundColor Yellow
    } else {
        New-NetFirewallRule -DisplayName "SentinelIQ Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
        Write-Host "   ✅ Added inbound rule for port 8000" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not add firewall rule: $_" -ForegroundColor Yellow
}

# Allow outbound on port 8000 (for agent)
try {
    $rule = Get-NetFirewallRule -DisplayName "SentinelIQ Agent" -ErrorAction SilentlyContinue
    if ($rule) {
        Write-Host "   Outbound rule already exists" -ForegroundColor Yellow
    } else {
        New-NetFirewallRule -DisplayName "SentinelIQ Agent" -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
        Write-Host "   ✅ Added outbound rule for port 8000" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not add outbound rule: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Test network connectivity
Write-Host "🧪 Network Diagnostics:" -ForegroundColor Cyan
Write-Host ""

# Get server IP from user
$serverIP = Read-Host "Enter server IP address (e.g., 192.168.1.100)"

if ($serverIP) {
    Write-Host ""
    Write-Host "   Testing connection to $serverIP..." -ForegroundColor Yellow
    
    # Test ping
    Write-Host "   Ping test..." -NoNewline
    $ping = Test-Connection -ComputerName $serverIP -Count 2 -Quiet
    if ($ping) {
        Write-Host " ✅ SUCCESS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "      Server is not reachable via ping" -ForegroundColor Yellow
    }
    
    # Test port
    Write-Host "   Port 8000 test..." -NoNewline
    $portTest = Test-NetConnection -ComputerName $serverIP -Port 8000 -WarningAction SilentlyContinue
    if ($portTest.TcpTestSucceeded) {
        Write-Host " ✅ SUCCESS" -ForegroundColor Green
    } else {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "      Port 8000 is not accessible" -ForegroundColor Yellow
    }
    
    # Test API
    Write-Host "   API test..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://$serverIP:8000/api/health" -TimeoutSec 3 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅ SUCCESS" -ForegroundColor Green
            Write-Host ""
            Write-Host "✅ Server is accessible!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Run agent with:" -ForegroundColor Cyan
            Write-Host "   python3 realtime_monitor.py --user-id U002 --server http://$serverIP:8000" -ForegroundColor White
        } else {
            Write-Host " ❌ FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host " ❌ FAILED" -ForegroundColor Red
        Write-Host "      API endpoint not accessible" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  No server IP provided" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

