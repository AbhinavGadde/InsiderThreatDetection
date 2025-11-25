"""
Automated ML Model Training and Retraining Pipeline
Runs periodically to retrain models with new data
"""

import os
import sys
import time
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.metrics import classification_report, roc_auc_score, f1_score
import xgboost as xgb
from tensorflow.keras.models import Model, Sequential
from tensorflow.keras.layers import LSTM, Dense, RepeatVector, TimeDistributed, Input
from tensorflow.keras.callbacks import EarlyStopping
import sqlalchemy
from sqlalchemy import create_engine
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://threat_admin:secure_password_123@localhost:5432/insider_threat_db'
)
MODEL_OUTPUT_PATH = os.getenv('MODEL_OUTPUT_PATH', '/models')
RETRAINING_INTERVAL_HOURS = int(os.getenv('RETRAINING_INTERVAL_HOURS', '24'))


class ModelTrainingPipeline:
    """Complete ML model training pipeline"""

    def __init__(self, db_url, output_path):
        self.db_url = db_url
        self.output_path = output_path
        self.engine = create_engine(db_url)

        # Ensure output directory exists
        os.makedirs(output_path, exist_ok=True)

        self.feature_cols = [
            'role_encoded', 'logon_hour', 'logon_count', 'geo_anomaly',
            'file_accesses', 'sensitive_file_access', 'file_download_size_mb',
            'emails_sent', 'external_emails', 'large_attachments', 'suspicious_keywords',
            'off_hours', 'file_to_email_ratio', 'external_email_ratio', 'sensitive_access_rate',
            'logon_count_ma7', 'file_accesses_ma7', 'emails_ma7'
        ]

    def fetch_training_data(self, days=90):
        """Fetch training data from database"""
        logger.info(f"Fetching training data for last {days} days...")

        query = f"""
        SELECT 
            al.user_id,
            u.role,
            EXTRACT(HOUR FROM al.timestamp) as logon_hour,
            COUNT(CASE WHEN al.activity_type = 'logon' THEN 1 END) as logon_count,
            SUM(CASE WHEN al.details->>'geo_anomaly' = 'true' THEN 1 ELSE 0 END) as geo_anomaly,
            COUNT(CASE WHEN al.activity_type = 'file_access' THEN 1 END) as file_accesses,
            COUNT(CASE WHEN al.activity_type = 'file_access' AND al.details->>'sensitive' = 'true' THEN 1 END) as sensitive_file_access,
            COALESCE(SUM(CASE WHEN al.activity_type = 'file_access' THEN (al.details->>'size_mb')::float END), 0) as file_download_size_mb,
            COUNT(CASE WHEN al.activity_type = 'email' THEN 1 END) as emails_sent,
            COUNT(CASE WHEN al.activity_type = 'email' AND al.details->>'external' = 'true' THEN 1 END) as external_emails,
            COUNT(CASE WHEN al.activity_type = 'email' AND (al.details->>'attachment_size_mb')::float > 10 THEN 1 END) as large_attachments,
            SUM(CASE WHEN al.activity_type = 'email' THEN (al.details->>'suspicious_keywords')::int ELSE 0 END) as suspicious_keywords,
            CASE WHEN ta.alert_id IS NOT NULL THEN 1 ELSE 0 END as is_threat
        FROM activity_logs al
        JOIN users u ON al.user_id = u.user_id
        LEFT JOIN threat_alerts ta ON al.user_id = ta.user_id 
            AND ta.timestamp BETWEEN al.timestamp - INTERVAL '24 hours' AND al.timestamp + INTERVAL '24 hours'
        WHERE al.timestamp > NOW() - INTERVAL '{days} days'
        GROUP BY al.user_id, u.role, DATE(al.timestamp), ta.alert_id
        """

        try:
            df = pd.read_sql(query, self.engine)
            logger.info(f"Fetched {len(df)} records")
            return df
        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            # Generate synthetic data as fallback
            return self._generate_synthetic_data()

    def _generate_synthetic_data(self, n_samples=3000):
        """Generate synthetic training data"""
        logger.info("Generating synthetic training data...")

        np.random.seed(42)
        data = []

        roles = ['Developer', 'HR', 'Finance', 'Manager', 'Sales']
        threat_ratio = 0.05

        for i in range(n_samples):
            is_threat = np.random.random() < threat_ratio
            role = np.random.choice(roles)

            if is_threat:
                logon_hour = np.random.choice([2, 3, 22, 23])
                logon_count = np.random.poisson(8)
                geo_anomaly = 1 if np.random.random() > 0.4 else 0
                file_accesses = np.random.poisson(100)
                sensitive_file_access = np.random.poisson(15)
                file_download_size_mb = np.random.exponential(500)
                emails_sent = np.random.poisson(60)
                external_emails = np.random.poisson(20)
                large_attachments = np.random.poisson(5)
                suspicious_keywords = np.random.poisson(3)
            else:
                logon_hour = max(0, min(23, np.random.normal(9, 2)))
                logon_count = max(1, np.random.poisson(3))
                geo_anomaly = 1 if np.random.random() > 0.95 else 0
                file_accesses = max(1, np.random.poisson(40))
                sensitive_file_access = max(0, np.random.poisson(2))
                file_download_size_mb = np.random.exponential(50)
                emails_sent = max(0, np.random.poisson(25))
                external_emails = max(0, np.random.poisson(5))
                large_attachments = max(0, np.random.poisson(1))
                suspicious_keywords = 1 if np.random.random() > 0.9 else 0

            data.append({
                'role': role,
                'logon_hour': logon_hour,
                'logon_count': logon_count,
                'geo_anomaly': geo_anomaly,
                'file_accesses': file_accesses,
                'sensitive_file_access': sensitive_file_access,
                'file_download_size_mb': file_download_size_mb,
                'emails_sent': emails_sent,
                'external_emails': external_emails,
                'large_attachments': large_attachments,
                'suspicious_keywords': suspicious_keywords,
                'is_threat': int(is_threat)
            })

        return pd.DataFrame(data)

    def feature_engineering(self, df):
        """Engineer features from raw data"""
        logger.info("Engineering features...")

        # Encode role
        le = LabelEncoder()
        df['role_encoded'] = le.fit_transform(df['role'])

        # Save label encoder
        with open(os.path.join(self.output_path, 'label_encoder.pkl'), 'wb') as f:
            pickle.dump(le, f)

        # Derived features
        df['off_hours'] = ((df['logon_hour'] < 7) | (
            df['logon_hour'] > 19)).astype(int)
        df['file_to_email_ratio'] = df['file_accesses'] / \
            (df['emails_sent'] + 1)
        df['external_email_ratio'] = df['external_emails'] / \
            (df['emails_sent'] + 1)
        df['sensitive_access_rate'] = df['sensitive_file_access'] / \
            (df['file_accesses'] + 1)

        # Rolling statistics (simplified for batch training)
        df['logon_count_ma7'] = df['logon_count']
        df['file_accesses_ma7'] = df['file_accesses']
        df['emails_ma7'] = df['emails_sent']

        return df

    def train_models(self, df):
        """Train all ML models"""
        logger.info("Starting model training...")

        # Prepare data
        X = df[self.feature_cols].fillna(0)
        y = df['is_threat']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        # Save scaler
        with open(os.path.join(self.output_path, 'scaler.pkl'), 'wb') as f:
            pickle.dump(scaler, f)

        metrics = {}

        # 1. Train XGBoost
        logger.info("Training XGBoost...")
        scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
        xgb_model = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            eval_metric='logloss'
        )
        xgb_model.fit(X_train_scaled, y_train)
        xgb_pred = xgb_model.predict(X_test_scaled)
        xgb_pred_proba = xgb_model.predict_proba(X_test_scaled)[:, 1]

        metrics['xgboost'] = {
            'f1_score': f1_score(y_test, xgb_pred),
            'auc_roc': roc_auc_score(y_test, xgb_pred_proba)
        }

        # Save model
        with open(os.path.join(self.output_path, 'xgb_model.pkl'), 'wb') as f:
            pickle.dump(xgb_model, f)

        logger.info(
            f"XGBoost - F1: {metrics['xgboost']['f1_score']:.4f}, AUC-ROC: {metrics['xgboost']['auc_roc']:.4f}")

        # 2. Train Random Forest
        logger.info("Training Random Forest...")
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced',
            n_jobs=-1
        )
        rf_model.fit(X_train_scaled, y_train)
        rf_pred = rf_model.predict(X_test_scaled)
        rf_pred_proba = rf_model.predict_proba(X_test_scaled)[:, 1]

        metrics['random_forest'] = {
            'f1_score': f1_score(y_test, rf_pred),
            'auc_roc': roc_auc_score(y_test, rf_pred_proba)
        }

        # Save model
        with open(os.path.join(self.output_path, 'rf_model.pkl'), 'wb') as f:
            pickle.dump(rf_model, f)

        logger.info(
            f"Random Forest - F1: {metrics['random_forest']['f1_score']:.4f}, AUC-ROC: {metrics['random_forest']['auc_roc']:.4f}")

        # 3. Train Isolation Forest
        logger.info("Training Isolation Forest...")
        X_train_normal = X_train_scaled[y_train == 0]
        iso_forest = IsolationForest(
            contamination=0.05, random_state=42, n_jobs=-1)
        iso_forest.fit(X_train_normal)

        iso_pred = iso_forest.predict(X_test_scaled)
        iso_pred = (iso_pred == -1).astype(int)
        iso_scores = -iso_forest.score_samples(X_test_scaled)

        metrics['isolation_forest'] = {
            'f1_score': f1_score(y_test, iso_pred),
            'auc_roc': roc_auc_score(y_test, iso_scores)
        }

        # Save model
        with open(os.path.join(self.output_path, 'iso_forest.pkl'), 'wb') as f:
            pickle.dump(iso_forest, f)

        logger.info(
            f"Isolation Forest - F1: {metrics['isolation_forest']['f1_score']:.4f}, AUC-ROC: {metrics['isolation_forest']['auc_roc']:.4f}")

        # Save metrics
        metrics['training_timestamp'] = datetime.now().isoformat()
        metrics['training_samples'] = len(X_train)
        metrics['test_samples'] = len(X_test)

        with open(os.path.join(self.output_path, 'model_metrics.pkl'), 'wb') as f:
            pickle.dump(metrics, f)

        logger.info("All models trained and saved successfully!")
        return metrics

    def run_training_cycle(self):
        """Execute complete training cycle"""
        try:
            logger.info("=" * 80)
            logger.info("Starting ML Model Training Cycle")
            logger.info("=" * 80)

            # Fetch data
            df = self.fetch_training_data(days=90)

            # Feature engineering
            df = self.feature_engineering(df)

            # Train models
            metrics = self.train_models(df)

            logger.info("=" * 80)
            logger.info("Training Cycle Completed Successfully")
            logger.info("=" * 80)

            return True
        except Exception as e:
            logger.error(f"Training cycle failed: {e}", exc_info=True)
            return False


def main():
    """Main training scheduler"""
    logger.info("Starting ML Training Scheduler...")

    pipeline = ModelTrainingPipeline(DATABASE_URL, MODEL_OUTPUT_PATH)

    # Run initial training
    logger.info("Running initial model training...")
    pipeline.run_training_cycle()

    # Schedule periodic retraining
    logger.info(
        f"Scheduling retraining every {RETRAINING_INTERVAL_HOURS} hours...")

    while True:
        time.sleep(RETRAINING_INTERVAL_HOURS * 3600)
        logger.info("Starting scheduled retraining...")
        pipeline.run_training_cycle()


if __name__ == "__main__":
    main()
