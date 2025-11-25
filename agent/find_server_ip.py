#!/usr/bin/env python3
"""
Network Diagnostic Tool for SentinelIQ Agent
Helps find the correct server IP address
"""

import socket
import subprocess
import platform
import sys
import requests
from typing import List, Optional

def get_local_ips() -> List[str]:
    """Get all local IP addresses"""
    ips = []
    try:
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        ips.append(local_ip)
    except:
        pass
    
    # Get all network interfaces
    try:
        if platform.system() == 'Windows':
            result = subprocess.run(['ipconfig'], capture_output=True, text=True, timeout=5)
            for line in result.stdout.split('\n'):
                if 'IPv4 Address' in line or 'IPv4' in line:
                    ip = line.split(':')[-1].strip()
                    if ip and ip != '127.0.0.1':
                        ips.append(ip)
        else:
            result = subprocess.run(['ifconfig'], capture_output=True, text=True, timeout=5)
            for line in result.stdout.split('\n'):
                if 'inet ' in line and '127.0.0.1' not in line:
                    parts = line.split()
                    for i, part in enumerate(parts):
                        if part == 'inet':
                            ip = parts[i+1].split('/')[0]
                            if ip and ip != '127.0.0.1':
                                ips.append(ip)
    except:
        pass
    
    return list(set(ips))

def test_server_connection(ip: str, port: int = 8000) -> bool:
    """Test if server is reachable"""
    try:
        url = f"http://{ip}:{port}/api/health"
        response = requests.get(url, timeout=3)
        if response.status_code == 200:
            return True
    except:
        pass
    return False

def scan_network_range(base_ip: str, port: int = 8000) -> List[str]:
    """Scan common IPs in the network range"""
    found_servers = []
    
    # Extract network base (e.g., 10.66.100 from 10.66.100.255)
    parts = base_ip.split('.')
    if len(parts) == 4:
        base = '.'.join(parts[:3])
        
        # Check common IPs in the range
        common_ips = [
            f"{base}.1",
            f"{base}.10",
            f"{base}.50",
            f"{base}.100",
            f"{base}.101",
            f"{base}.200",
            f"{base}.254"
        ]
        
        print(f"\n🔍 Scanning network {base}.x for server...")
        for ip in common_ips:
            print(f"   Testing {ip}:{port}...", end=' ')
            if test_server_connection(ip, port):
                print("✅ FOUND!")
                found_servers.append(ip)
            else:
                print("❌")
    
    return found_servers

def main():
    print("="*70)
    print("🔍 SentinelIQ Server IP Finder")
    print("="*70)
    
    # Get local IPs
    local_ips = get_local_ips()
    print(f"\n📡 Your local IP addresses:")
    for ip in local_ips:
        print(f"   - {ip}")
    
    # Test common server IPs
    print(f"\n🌐 Testing common server IPs...")
    
    # Test the provided IP
    provided_ip = "10.66.100.255"
    print(f"\n   Testing provided IP: {provided_ip}:8000...", end=' ')
    if test_server_connection(provided_ip, 8000):
        print("✅ WORKING!")
        print(f"\n✅ Server found at: http://{provided_ip}:8000")
        print(f"\nRun agent with:")
        print(f"   python3 realtime_monitor.py --user-id U002 --server http://{provided_ip}:8000")
        return
    else:
        print("❌ NOT REACHABLE")
    
    # Scan network range
    found_servers = scan_network_range(provided_ip, 8000)
    
    if found_servers:
        print(f"\n✅ Found {len(found_servers)} server(s):")
        for ip in found_servers:
            print(f"   - http://{ip}:8000")
        print(f"\nRun agent with:")
        print(f"   python3 realtime_monitor.py --user-id U002 --server http://{found_servers[0]}:8000")
    else:
        print(f"\n❌ No server found in network range")
        print(f"\n📋 Manual Steps:")
        print(f"   1. On the SERVER machine, run: ipconfig (Windows) or ifconfig (Linux/Mac)")
        print(f"   2. Find the IPv4 Address (not 127.0.0.1)")
        print(f"   3. Use that IP in the agent command")
        print(f"\n   Example:")
        print(f"   python3 realtime_monitor.py --user-id U002 --server http://SERVER_IP:8000")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    main()

