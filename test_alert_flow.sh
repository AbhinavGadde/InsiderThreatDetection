#!/bin/bash

# End-to-End Alert Flow Test Script
# Tests complete flow: Agent → Backend → Frontend

echo "═══════════════════════════════════════════════════════════"
echo "🚀 SentinelIQ Alert Flow Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

API_URL="${API_URL:-http://localhost:8000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend Health
echo "📡 Test 1: Backend Health Check"
response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/health")
if [ "$response" == "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend not responding (HTTP $response)${NC}"
    exit 1
fi
echo ""

# Test 2: Send Test Activity (Large File Access)
echo "📤 Test 2: Sending Threat Activity (Large File Access)"
test_activity=$(cat <<EOF
{
  "user_id": "U001",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S")",
  "activity_type": "file_access",
  "details": {
    "file_path": "/tmp/large_test_file.bin",
    "action": "read",
    "size_mb": 75.5,
    "file_size_mb": 75.5,
    "sensitive": false,
    "ip_address": "192.168.1.100",
    "device_id": "test-laptop",
    "off_hours": false
  }
}
EOF
)

response=$(curl -s -X POST "$API_URL/api/activities/ingest" \
  -H "Content-Type: application/json" \
  -d "$test_activity")

status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$status" == "alert_generated" ]; then
    echo -e "${GREEN}✅ Alert generated successfully!${NC}"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
else
    echo -e "${YELLOW}⚠️  Activity logged but no alert (status: $status)${NC}"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
fi
echo ""

# Test 3: Check Alerts Endpoint
echo "📋 Test 3: Fetching Alerts"
alerts_response=$(curl -s "$API_URL/api/alerts?limit=5")
alert_count=$(echo "$alerts_response" | grep -o '"alert_id"' | wc -l | tr -d ' ')

if [ "$alert_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $alert_count alert(s)${NC}"
    echo "$alerts_response" | python3 -m json.tool 2>/dev/null | head -30
else
    echo -e "${YELLOW}⚠️  No alerts found${NC}"
fi
echo ""

# Test 4: Check Dashboard Stats
echo "📊 Test 4: Dashboard Stats"
stats_response=$(curl -s "$API_URL/api/dashboard/stats")
alerts_today=$(echo "$stats_response" | grep -o '"alerts_today":[0-9]*' | cut -d':' -f2)

if [ -n "$alerts_today" ]; then
    echo -e "${GREEN}✅ Alerts today: $alerts_today${NC}"
else
    echo -e "${YELLOW}⚠️  Could not fetch alerts count${NC}"
fi
echo ""

# Test 5: Verify Alert Timestamp
echo "🕐 Test 5: Alert Timestamp Verification"
if [ "$alert_count" -gt 0 ]; then
    latest_alert=$(echo "$alerts_response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data and len(data) > 0:
        print(json.dumps(data[0], indent=2))
except:
    pass
" 2>/dev/null)
    
    if [ -n "$latest_alert" ]; then
        timestamp=$(echo "$latest_alert" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
        echo "Latest alert timestamp: $timestamp"
        
        # Check if timestamp is recent (within last 5 minutes)
        current_time=$(date -u +%s)
        alert_time=$(date -u -d "$timestamp" +%s 2>/dev/null || echo "0")
        time_diff=$((current_time - alert_time))
        
        if [ "$time_diff" -lt 300 ]; then
            echo -e "${GREEN}✅ Alert timestamp is recent (${time_diff}s ago)${NC}"
        else
            echo -e "${YELLOW}⚠️  Alert timestamp is old (${time_diff}s ago)${NC}"
        fi
    fi
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo "Backend Health: $([ "$response" == "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "Alert Generation: $([ "$status" == "alert_generated" ] && echo "✅ PASS" || echo "⚠️  CHECK")"
echo "Alerts Endpoint: $([ "$alert_count" -gt 0 ] && echo "✅ PASS ($alert_count alerts)" || echo "⚠️  NO ALERTS")"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 Next Steps:"
echo "   1. Check admin dashboard at http://localhost:3000"
echo "   2. Navigate to 'Alerts' tab"
echo "   3. Verify alert appears with real-time timestamp"
echo "   4. Check activity timeline for the user"
echo ""

