"""
Database models and connection management
"""

from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://threat_admin:secure_password_123@localhost:5432/insider_threat_db'
)

# Create engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True,
                       pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==================== MODELS ====================


class User(Base):
    __tablename__ = 'users'

    user_id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    hire_date = Column(DateTime, nullable=False)
    status = Column(String(50), default='active')
    its_score = Column(Float, default=0.0)
    risk_level = Column(String(20), default='low')
    last_updated = Column(DateTime, default=datetime.utcnow,
                          onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    activities = relationship(
        'ActivityLog', back_populates='user', cascade='all, delete-orphan')
    alerts = relationship(
        'ThreatAlert', back_populates='user', cascade='all, delete-orphan')
    baselines = relationship(
        'UserBaseline', back_populates='user', cascade='all, delete-orphan')


class ActivityLog(Base):
    __tablename__ = 'activity_logs'

    activity_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    activity_type = Column(String(50), nullable=False)
    details = Column(JSON, nullable=False)
    ip_address = Column(String(45))
    device_id = Column(String(100))
    location = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship('User', back_populates='activities')


class ThreatAlert(Base):
    __tablename__ = 'threat_alerts'

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    its_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    anomalies = Column(JSON, nullable=False)
    explanation = Column(Text)
    status = Column(String(50), default='open')
    assigned_to = Column(String(255))
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_viewed = Column(Boolean, default=False)
    viewed_at = Column(DateTime)

    # Relationships
    user = relationship('User', back_populates='alerts')


class AnomalyAlert(Base):
    """Real-time alerts - potential anomalies detected (low confidence)"""
    __tablename__ = 'anomaly_alerts'

    alert_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    anomaly_type = Column(String(50), nullable=False)  # file_access, email, logon, process, network
    anomaly_fingerprint = Column(String(255), nullable=False, unique=True)  # Hash for deduplication
    ml_anomaly_score = Column(Float, nullable=False)  # ML-based score (0-1)
    confidence = Column(Float, nullable=False)  # Confidence level (0-1)
    activity_details = Column(JSON, nullable=False)
    status = Column(String(20), default='new')  # new, validated, dismissed, escalated
    escalated_to_threat_id = Column(Integer, ForeignKey('threats.threat_id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    suppressed_until = Column(DateTime, nullable=True)  # Time-based suppression


class Threat(Base):
    """Confirmed threats - validated anomalies requiring investigation (medium-high confidence)"""
    __tablename__ = 'threats'

    threat_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    threat_type = Column(String(50), nullable=False)  # data_exfiltration, sabotage, unauthorized_access, etc.
    threat_fingerprint = Column(String(255), nullable=False, unique=True)
    ml_threat_score = Column(Float, nullable=False)  # ML-based threat score (0-1)
    its_score = Column(Float, nullable=False)  # Overall ITS score
    risk_level = Column(String(20), nullable=False)  # low, medium, high, critical
    anomalies = Column(JSON, nullable=False)  # List of contributing anomalies
    explanation = Column(Text)
    ml_explanation = Column(Text)  # ML model explanation
    status = Column(String(20), default='open')  # open, investigating, resolved, false_positive
    assigned_to = Column(String(255))
    investigation_notes = Column(Text)
    resolved_at = Column(DateTime, nullable=True)
    escalated_to_incident_id = Column(Integer, ForeignKey('incidents.incident_id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Incident(Base):
    """Confirmed security incidents - validated threats requiring action (high confidence)"""
    __tablename__ = 'incidents'

    incident_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    threat_id = Column(Integer, ForeignKey('threats.threat_id'), nullable=True)
    timestamp = Column(DateTime, nullable=False)
    incident_type = Column(String(50), nullable=False)  # data_breach, insider_attack, policy_violation, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    ml_incident_score = Column(Float, nullable=False)  # ML-based incident score
    its_score = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=False)  # Supporting evidence
    status = Column(String(20), default='open')  # open, in_progress, resolved, closed
    assigned_to = Column(String(255))
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AnomalyFingerprint(Base):
    """Track anomaly fingerprints to prevent duplicates"""
    __tablename__ = 'anomaly_fingerprints'

    fingerprint_id = Column(Integer, primary_key=True, autoincrement=True)
    fingerprint_hash = Column(String(255), nullable=False, unique=True, index=True)
    user_id = Column(String(50), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    anomaly_type = Column(String(50), nullable=False)
    first_seen = Column(DateTime, nullable=False)
    last_seen = Column(DateTime, nullable=False)
    count = Column(Integer, default=1)
    suppressed_until = Column(DateTime, nullable=True)
    escalated = Column(Boolean, default=False)


class UserBaseline(Base):
    __tablename__ = 'user_baselines'

    baseline_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    feature_name = Column(String(100), nullable=False)
    baseline_value = Column(Float, nullable=False)
    std_deviation = Column(Float)
    confidence_level = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow,
                          onupdate=datetime.utcnow)

    # Relationships
    user = relationship('User', back_populates='baselines')


class ModelMetric(Base):
    __tablename__ = 'model_metrics'

    metric_id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    metric_type = Column(String(50), nullable=False)
    metric_value = Column(Float, nullable=False)
    evaluation_date = Column(DateTime, default=datetime.utcnow)
    dataset_size = Column(Integer)
    notes = Column(Text)


class AuditLog(Base):
    __tablename__ = 'audit_logs'

    audit_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(String(100))
    details = Column(JSON)
    ip_address = Column(String(45))
    timestamp = Column(DateTime, default=datetime.utcnow)


class GeoAnomaly(Base):
    __tablename__ = 'geo_anomalies'

    geo_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    location_1 = Column(String(255), nullable=False)
    location_2 = Column(String(255), nullable=False)
    time_difference_minutes = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)


class FileAccessPattern(Base):
    __tablename__ = 'file_access_patterns'

    access_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    file_path = Column(String(500), nullable=False)
    access_type = Column(String(50), nullable=False)
    file_size_mb = Column(Float)
    sensitivity_level = Column(String(20))
    is_anomalous = Column(Boolean, default=False)
    anomaly_reason = Column(Text)


class EmailPattern(Base):
    __tablename__ = 'email_patterns'

    email_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey(
        'users.user_id', ondelete='CASCADE'), nullable=False)
    timestamp = Column(DateTime, nullable=False)
    recipient_email = Column(String(255), nullable=False)
    is_external = Column(Boolean, default=False)
    attachment_count = Column(Integer, default=0)
    total_attachment_size_mb = Column(Float, default=0.0)
    suspicious_keywords_count = Column(Integer, default=0)
    sentiment_score = Column(Float)
    is_anomalous = Column(Boolean, default=False)


class SystemConfig(Base):
    __tablename__ = 'system_config'

    config_key = Column(String(100), primary_key=True)
    config_value = Column(Text, nullable=False)
    description = Column(Text)
    last_updated = Column(DateTime, default=datetime.utcnow,
                          onupdate=datetime.utcnow)


class HistoricalITSScore(Base):
    """Store daily ITS scores for trend analysis"""
    __tablename__ = 'historical_its_scores'

    score_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)  # Date for this score (normalized to midnight)
    its_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    alert_count = Column(Integer, default=0)  # Number of alerts on this day
    activity_count = Column(Integer, default=0)  # Number of activities on this day
    created_at = Column(DateTime, default=datetime.utcnow)

# ==================== DATABASE UTILITIES ====================


def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


def seed_demo_data():
    """Seed database with demo data"""
    db = SessionLocal()
    try:
        # Check if data already exists
        if db.query(User).count() > 0:
            print("Demo data already exists")
            return

        # Create demo users
        import random
        from datetime import timedelta

        roles = ['Developer', 'HR', 'Finance', 'Manager', 'Sales']
        departments = ['Engineering', 'Human Resources',
                       'Finance', 'Management', 'Sales']

        for i in range(50):
            role_idx = i % 5
            user = User(
                user_id=f'U{i:03d}',
                name=f'Employee {i}',
                email=f'employee{i}@company.com',
                role=roles[role_idx],
                department=departments[role_idx],
                hire_date=datetime.now() - timedelta(days=random.randint(365, 1825)),
                its_score=random.uniform(0, 100),
                risk_level=random.choice(
                    ['low', 'low', 'low', 'medium', 'high'])
            )
            db.add(user)

        db.commit()
        print("Demo data seeded successfully")
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()
