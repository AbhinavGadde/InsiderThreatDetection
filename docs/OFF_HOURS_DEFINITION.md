# ⏰ Off-Hours Definition

**Clear definition of working hours and off-hours for SentinelIQ**

---

## 📋 Business Hours Definition

### Working Hours (Normal Business Hours)

- **Start:** 7:00 AM (07:00)
- **End:** 6:59 PM (18:59)
- **Duration:** 12 hours (7:00 to 18:59)

### Off-Hours (Outside Business Hours)

- **Early Morning:** Before 7:00 AM (00:00 to 06:59)
- **Evening/Night:** After/at 7:00 PM (19:00 to 23:59)

---

## 🔍 Logic Implementation

### Off-Hours Detection Formula

```python
# Off-hours is TRUE if:
is_off_hours = (hour < 7) or (hour >= 19)

# Examples:
# 12:00 (noon) → hour = 12 → (12 < 7) = False, (12 >= 19) = False → is_off_hours = False ✅
# 05:00 (5 AM) → hour = 5 → (5 < 7) = True → is_off_hours = True ✅
# 20:00 (8 PM) → hour = 20 → (20 >= 19) = True → is_off_hours = True ✅
# 19:00 (7 PM) → hour = 19 → (19 >= 19) = True → is_off_hours = True ✅
```

### Working Hours Detection Formula

```python
# Working hours is TRUE if:
is_working_hours = (hour >= 7) and (hour < 19)

# Examples:
# 12:00 (noon) → hour = 12 → (12 >= 7) = True, (12 < 19) = True → is_working_hours = True ✅
# 09:00 (9 AM) → hour = 9 → (9 >= 7) = True, (9 < 19) = True → is_working_hours = True ✅
# 18:30 (6:30 PM) → hour = 18 → (18 >= 7) = True, (18 < 19) = True → is_working_hours = True ✅
```

---

## 📊 Hour-by-Hour Breakdown

| Hour  | Time               | Status           | Reason                |
| ----- | ------------------ | ---------------- | --------------------- |
| 0-6   | 12:00 AM - 6:59 AM | ⚠️ Off-Hours     | Before business hours |
| 7-18  | 7:00 AM - 6:59 PM  | ✅ Working Hours | Normal business hours |
| 19-23 | 7:00 PM - 11:59 PM | ⚠️ Off-Hours     | After business hours  |

---

## 🎯 Examples

### ✅ Working Hours (NOT flagged as off-hours)

- **7:00 AM** - Start of business day
- **9:00 AM** - Morning work
- **12:00 PM (noon)** - Lunch time (still working hours)
- **3:00 PM** - Afternoon work
- **6:00 PM** - End of business day
- **6:59 PM** - Last minute of working hours

### ⚠️ Off-Hours (Flagged as off-hours)

- **5:00 AM** - Early morning (before 7 AM)
- **6:59 AM** - Just before business hours
- **7:00 PM** - Start of off-hours
- **8:00 PM** - Evening
- **11:00 PM** - Late night
- **2:00 AM** - Very early morning

---

## 🔧 Code Implementation

### Agent (realtime_monitor.py)

```python
# Off-hours calculation
current_hour = datetime.now().hour
is_off_hours = (current_hour < 7) or (current_hour >= 19)

# Send in activity details
'off_hours': is_off_hours,
'activity_hour': current_hour
```

### Backend (ml_anomaly_detector.py)

```python
# Check if actually off-hours
activity_hour = details.get('activity_hour') or details.get('logon_hour')
is_off_hours = False

if details.get('off_hours', False):
    # Agent already calculated it correctly
    is_off_hours = True
elif activity_hour is not None:
    # Double-check: off-hours is hour < 7 OR hour >= 19
    is_off_hours = (activity_hour < 7) or (activity_hour >= 19)

# Only flag as off-hours if ACTUALLY off-hours
if is_off_hours:
    explanations.append(f"Off-hours activity ({activity_hour}:00)")
```

---

## ✅ Validation

**Test Cases:**

1. **12:00 PM (noon)** → `hour = 12`

   - `(12 < 7)` = False
   - `(12 >= 19)` = False
   - **Result:** NOT off-hours ✅

2. **5:00 AM** → `hour = 5`

   - `(5 < 7)` = True
   - **Result:** Off-hours ✅

3. **7:00 PM** → `hour = 19`

   - `(19 >= 19)` = True
   - **Result:** Off-hours ✅

4. **9:00 AM** → `hour = 9`
   - `(9 < 7)` = False
   - `(9 >= 19)` = False
   - **Result:** NOT off-hours ✅

---

## 🎯 Summary

**Off-Hours Definition:**

- **Before 7:00 AM** (hour < 7)
- **After/at 7:00 PM** (hour >= 19)

**Working Hours:**

- **7:00 AM to 6:59 PM** (7 <= hour < 19)

**The system will ONLY flag activities as "Off-hours" when they occur outside the 7 AM - 7 PM window.**

---

**Last Updated:** November 17, 2025  
**Status:** ✅ Fixed and Validated
