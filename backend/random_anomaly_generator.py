"""
Random Anomaly Generator - Background Task
Automatically generates random anomalies for users to simulate real-world scenarios
Runs as a background task in the backend
"""

import asyncio
import random
from datetime import datetime, timedelta
from database import SessionLocal, User, ActivityLog, ThreatAlert as ThreatAlertDB
from main import ThreatDetectionEngine
import time

# Configuration
ANOMALY_INTERVAL = 300  # Generate anomaly every 5 minutes (300 seconds)
ANOMALY_PROBABILITY = 0.3  # 30% chance per interval

def generate_random_anomaly():
    """Generate a random anomaly for a random user"""
    db = SessionLocal()
    try:
        # Get all active users
        users = db.query(User).filter(User.status == 'active').all()
        if not users:
            return
        
        # Randomly select a user
        user = random.choice(users)
        
        # Randomly select anomaly type
        anomaly_types = ['data_exfiltration', 'off_hours', 'sabotage']
        anomaly_type = random.choice(anomaly_types)
        
        now = datetime.now()
        
        # Generate suspicious activities based on anomaly type
        if anomaly_type == "data_exfiltration":
            # Large file downloads + external emails
            for i in range(random.randint(3, 6)):
                activity = ActivityLog(
                    user_id=user.user_id,
                    timestamp=now - timedelta(minutes=i*5),
                    activity_type='file_access',
                    details={
                        'file_path': f'/finance/confidential_{i}.xlsx',
                        'action': 'read',
                        'size_mb': 100.0 + random.random() * 100,
                        'sensitive': True
                    },
                    ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    device_id='laptop'
                )
                db.add(activity)
            
            for i in range(random.randint(2, 4)):
                activity = ActivityLog(
                    user_id=user.user_id,
                    timestamp=now - timedelta(minutes=i*10),
                    activity_type='email',
                    details={
                        'to': f'external{i}@suspicious.com',
                        'subject': 'Important documents',
                        'external': True,
                        'attachment_size_mb': 80.0 + random.random() * 40,
                        'suspicious_keywords': 1
                    },
                    ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    device_id='laptop'
                )
                db.add(activity)
        
        elif anomaly_type == "off_hours":
            # Off-hours logons - ensure timestamps are in the past
            for i in range(random.randint(5, 10)):
                # Generate timestamp in the past (yesterday or earlier) with off-hours time
                hours_ago = random.randint(12, 36)  # 12-36 hours ago
                off_hours_timestamp = now - timedelta(hours=hours_ago)
                # Set to off-hours (22:00-23:59) but keep it in the past
                off_hours_timestamp = off_hours_timestamp.replace(hour=random.randint(22, 23), minute=random.randint(0, 59), second=0, microsecond=0)
                # If somehow it's still in the future, subtract a day
                if off_hours_timestamp > now:
                    off_hours_timestamp = off_hours_timestamp - timedelta(days=1)
                
                activity = ActivityLog(
                    user_id=user.user_id,
                    timestamp=off_hours_timestamp,
                    activity_type='logon',
                    details={
                        'ip_address': f"203.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                        'device': 'laptop',
                        'geo_anomaly': 1
                    },
                    ip_address=f"203.0.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    device_id='laptop'
                )
                db.add(activity)
        
        elif anomaly_type == "sabotage":
            # Multiple file deletions
            for i in range(random.randint(8, 12)):
                activity = ActivityLog(
                    user_id=user.user_id,
                    timestamp=now - timedelta(minutes=i*2),
                    activity_type='file_access',
                    details={
                        'file_path': f'/projects/critical_file_{i}.py',
                        'action': 'delete',
                        'size_mb': 0,
                        'sensitive': True
                    },
                    ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                    device_id='laptop'
                )
                db.add(activity)
        
        db.commit()
        
        # Recalculate ITS score
        score_data = ThreatDetectionEngine.calculate_its_score(db, user.user_id)
        user.its_score = score_data['its_score']
        user.risk_level = score_data['risk_level']
        user.last_updated = now
        db.commit()
        
        # Create alert if threshold met
        if score_data['its_score'] >= 40 or score_data['risk_level'] in ['high', 'critical']:
            alert = ThreatAlertDB(
                user_id=user.user_id,
                timestamp=now,
                its_score=score_data['its_score'],
                risk_level=score_data['risk_level'],
                anomalies=score_data.get('anomalies', []),
                explanation=f"Random anomaly detected: {anomaly_type}",
                status='open'
            )
            db.add(alert)
            db.commit()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 🚨 Random anomaly generated for {user.name} ({user.user_id}) - ITS: {score_data['its_score']:.1f}")
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] ⚠️  Random activity for {user.name} ({user.user_id}) - ITS: {score_data['its_score']:.1f}")
        
    except Exception as e:
        print(f"Error generating random anomaly: {e}")
        db.rollback()
    finally:
        db.close()

async def random_anomaly_loop():
    """Background loop to generate random anomalies"""
    print("[Random Anomaly Generator] Started - Will generate anomalies every 5 minutes")
    while True:
        try:
            await asyncio.sleep(ANOMALY_INTERVAL)
            
            # Random chance to generate anomaly
            if random.random() < ANOMALY_PROBABILITY:
                generate_random_anomaly()
            else:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] No anomaly generated this cycle")
                
        except Exception as e:
            print(f"Error in random anomaly loop: {e}")
            await asyncio.sleep(60)  # Wait 1 minute on error

