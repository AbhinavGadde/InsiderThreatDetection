"""
Populate database with initial users and activities
Run this script to seed the database with realistic data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, ActivityLog, init_db
from datetime import datetime, timedelta
import numpy as np
import random

# Initialize database
init_db()

db = SessionLocal()

def populate_users():
    """Create users in the database"""
    print("Creating users...")
    
    # Delete existing users to recreate with Indian names
    existing_count = db.query(User).count()
    if existing_count > 0:
        print(f"Found {existing_count} existing users. Deleting to recreate with Indian names...")
        db.query(User).delete()
        db.commit()
    
    roles = ['Developer', 'HR', 'Finance', 'Manager', 'Sales']
    departments = ['Engineering', 'Human Resources', 'Finance', 'Management', 'Sales']
    
    # Indian names list
    indian_first_names = [
        'Arjun', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Kavya', 'Aditya', 'Meera', 'Rohan', 'Sneha',
        'Karan', 'Divya', 'Aryan', 'Pooja', 'Siddharth', 'Anjali', 'Raj', 'Neha', 'Amit', 'Shreya',
        'Vishal', 'Riya', 'Kunal', 'Isha', 'Nikhil', 'Tanvi', 'Ravi', 'Aishwarya', 'Suresh', 'Deepika',
        'Mohan', 'Kritika', 'Gaurav', 'Swati', 'Harsh', 'Nisha', 'Pranav', 'Radha', 'Yash', 'Sakshi',
        'Abhinav', 'Indushree', 'Manish', 'Pallavi', 'Sachin', 'Ritika', 'Varun', 'Ankita', 'Rohit', 'Kiran'
    ]
    
    indian_last_names = [
        'Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Rao', 'Mehta', 'Verma', 'Jain',
        'Shah', 'Desai', 'Nair', 'Iyer', 'Malhotra', 'Kapoor', 'Agarwal', 'Joshi', 'Bansal', 'Chopra',
        'Mishra', 'Pandey', 'Saxena', 'Tiwari', 'Dubey', 'Yadav', 'Khan', 'Ali', 'Hussain', 'Ahmed',
        'Krishnan', 'Menon', 'Nair', 'Pillai', 'Narayanan', 'Subramanian', 'Venkatesh', 'Raman', 'Ganesh', 'Murthy'
    ]
    
    # Team members (keep original)
    team_members = [
        {'user_id': 'U001', 'name': 'Abhinav P V', 'role': 'Developer', 'department': 'Engineering'},
        {'user_id': 'U002', 'name': 'Abhinav Gadde', 'role': 'Developer', 'department': 'Engineering'},
        {'user_id': 'U003', 'name': 'Indushree', 'role': 'Developer', 'department': 'Engineering'},
    ]
    
    # Create team members
    for member in team_members:
        user = User(
            user_id=member['user_id'],
            name=member['name'],
            email=f"{member['name'].lower().replace(' ', '.')}@company.com",
            role=member['role'],
            department=member['department'],
            hire_date=datetime.now() - timedelta(days=random.randint(365, 1095)),
            its_score=0.0,
            risk_level='low',
            status='active'
        )
        db.add(user)
    
    # Create additional users with Indian names
    used_names = set(['Abhinav P V', 'Abhinav Gadde', 'Indushree'])
    for i in range(4, 51):
        user_id = f"U{i:03d}"
        role_idx = i % len(roles)
        
        # Generate unique Indian name
        while True:
            first_name = random.choice(indian_first_names)
            last_name = random.choice(indian_last_names)
            full_name = f"{first_name} {last_name}"
            if full_name not in used_names:
                used_names.add(full_name)
                break
        
        user = User(
            user_id=user_id,
            name=full_name,
            email=f"{first_name.lower()}.{last_name.lower()}@company.com",
            role=roles[role_idx],
            department=departments[role_idx],
            hire_date=datetime.now() - timedelta(days=random.randint(365, 1825)),
            its_score=0.0,
            risk_level='low',
            status='active'
        )
        db.add(user)
    
    db.commit()
    print(f"✓ Created {db.query(User).count()} users")


def populate_activities():
    """Create activities for users"""
    print("Creating activities...")
    
    # Delete existing activities to recreate
    existing_count = db.query(ActivityLog).count()
    if existing_count > 0:
        print(f"Found {existing_count} existing activities. Deleting to recreate...")
        db.query(ActivityLog).delete()
        db.commit()
    
    users = db.query(User).all()
    
    # Generate activities for last 14 days (extended to ensure all users have recent activity)
    for day_offset in range(14):
        date = datetime.now() - timedelta(days=day_offset)
        
        # Skip weekends
        if date.weekday() >= 5:
            continue
        
        for user in users:
            # Generate 8-25 activities per day per user (increased to ensure better scoring)
            # More activities = better ITS score calculation
            num_activities = random.randint(8, 25)
            
            for _ in range(num_activities):
                activity_type = random.choice(['logon', 'file_access', 'email'])
                
                # Generate timestamp within the day - ensure it's in the past
                hour = random.randint(8, 18)
                minute = random.randint(0, 59)
                activity_timestamp = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                
                # If this is today and the timestamp is in the future, move it to the past
                if day_offset == 0 and activity_timestamp > datetime.now():
                    # Move to earlier today or yesterday
                    hours_back = (activity_timestamp - datetime.now()).total_seconds() / 3600
                    activity_timestamp = datetime.now() - timedelta(hours=hours_back + random.randint(1, 3))
                
                if activity_type == 'logon':
                    details = {
                        'ip_address': f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                        'device': 'laptop' if random.random() > 0.3 else 'mobile',
                        'geo_anomaly': 1 if random.random() > 0.9 else 0
                    }
                elif activity_type == 'file_access':
                    details = {
                        'file_path': random.choice([
                            '/documents/report.pdf',
                            '/finance/budget.xlsx',
                            '/hr/salaries.csv',
                            '/projects/code.py',
                            '/meetings/notes.docx'
                        ]),
                        'action': random.choice(['read', 'write', 'delete']),
                        'size_mb': float(np.random.exponential(10)),
                        'sensitive': random.random() > 0.7
                    }
                else:  # email
                    details = {
                        'to': f"user{random.randint(1, 100)}@company.com",
                        'subject': 'Regular email',
                        'external': random.random() > 0.7,
                        'attachment_size_mb': float(np.random.exponential(5)) if random.random() > 0.5 else 0,
                        'suspicious_keywords': 1 if random.random() > 0.9 else 0
                    }
                
                activity = ActivityLog(
                    user_id=user.user_id,
                    timestamp=activity_timestamp,
                    activity_type=activity_type,
                    details=details,
                    ip_address=details.get('ip_address'),
                    device_id=details.get('device')
                )
                db.add(activity)
    
    db.commit()
    print(f"✓ Created {db.query(ActivityLog).count()} activities")


if __name__ == "__main__":
    print("=" * 60)
    print("Populating Insider Threat Detection Database")
    print("=" * 60)
    print()
    
    try:
        populate_users()
        print()
        populate_activities()
        print()
        print("=" * 60)
        print("✓ Database population complete!")
        print("=" * 60)
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

