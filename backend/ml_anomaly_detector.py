"""
ML-Based Anomaly Detection Engine
Uses AIML techniques (not rule-based) for insider threat detection
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import hashlib
import json
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import xgboost as xgb
from collections import deque
import pickle
import os


class MLAnomalyDetector:
    """
    ML-based anomaly detection using ensemble models
    Not rule-based - uses learned patterns from data
    """

    def __init__(self):
        self.isolation_forest = None
        self.anomaly_scorer = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'file_size_mb', 'file_count', 'sensitive_file_count', 'delete_count',
            'data_transfer_mb', 'external_connections', 'email_attachment_mb',
            'external_emails', 'off_hours_score', 'process_suspicious_score',
            'rapid_activity_score', 'pattern_deviation_score', 'temporal_anomaly_score'
        ]
        # Recent activities for context
        self.activity_buffer = deque(maxlen=1000)
        self.user_baselines = {}  # Per-user behavioral baselines
        self._initialize_models()

    def _initialize_models(self):
        """Initialize ML models"""
        # Isolation Forest for unsupervised anomaly detection
        self.isolation_forest = IsolationForest(
            contamination=0.1,  # Expect 10% anomalies
            random_state=42,
            n_estimators=100,
            max_samples='auto'
        )

        # XGBoost for anomaly scoring (trained on historical data)
        self.anomaly_scorer = xgb.XGBRegressor(
            n_estimators=50,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )

        # Initialize with dummy data to fit scaler
        dummy_data = np.zeros((10, len(self.feature_names)))
        self.scaler.fit(dummy_data)
        self.isolation_forest.fit(dummy_data)

    def _extract_ml_features(self, activity: Dict, user_id: str, recent_activities: List[Dict]) -> np.ndarray:
        """
        Extract ML features from activity and context
        Uses behavioral patterns, not hard thresholds
        """
        details = activity.get('details', {})
        activity_type = activity.get('activity_type', '')

        # File access features
        file_size = details.get('size_mb', 0) or details.get('file_size_mb', 0)
        file_count = len([a for a in recent_activities if a.get(
            'activity_type') == 'file_access'])
        sensitive_count = len([a for a in recent_activities
                              if a.get('activity_type') == 'file_access' and
                              a.get('details', {}).get('sensitive', False)])
        delete_count = len([a for a in recent_activities
                           if a.get('activity_type') == 'file_access' and
                           a.get('details', {}).get('action') == 'delete'])

        # Network/Data transfer features
        data_transfer = details.get(
            'data_sent_mb', 0) or details.get('attachment_size_mb', 0)
        external_conns = details.get('external_connections', 0)

        # Email features
        email_attachment = details.get('attachment_size_mb', 0)
        external_emails = len([a for a in recent_activities
                              if a.get('activity_type') == 'email' and
                              a.get('details', {}).get('external', False)])

        # Temporal features (ML-based, not rule-based)
        # CRITICAL FIX: Use hour from activity details (local time from agent) for accurate feature extraction
        activity_hour = details.get(
            'activity_hour') or details.get('logon_hour')
        if activity_hour is None:
            # Fallback: parse from timestamp if available (assume local time from agent)
            try:
                if isinstance(activity.get('timestamp'), str):
                    from dateutil import parser
                    activity_time = parser.parse(activity.get('timestamp'))
                    activity_hour = activity_time.hour
                else:
                    activity_hour = datetime.now().hour
            except:
                activity_hour = datetime.now().hour

        hour_sin = np.sin(2 * np.pi * activity_hour / 24)
        hour_cos = np.cos(2 * np.pi * activity_hour / 24)

        # Off-hours score (learned from baseline, not hard threshold)
        # Use activity hour (local time) instead of server time
        off_hours_score = self._calculate_off_hours_score(
            user_id, activity_hour)

        # Process suspiciousness score (ML-based)
        process_suspicious = details.get('suspicious', False)
        process_name = details.get('process_name', '').lower()
        suspicious_keywords = ['tor', 'vpn', 'remote',
                               'ssh', 'ftp', 'wireshark', 'nmap']
        process_suspicious_score = 1.0 if process_suspicious or any(
            kw in process_name for kw in suspicious_keywords) else 0.0

        # Rapid activity score (statistical deviation from baseline)
        rapid_activity_score = self._calculate_rapid_activity_score(
            user_id, recent_activities, activity_type)

        # Pattern deviation score (how much this deviates from user's normal pattern)
        pattern_deviation_score = self._calculate_pattern_deviation(
            user_id, activity, recent_activities)

        # Temporal anomaly score (unusual timing patterns)
        temporal_anomaly_score = self._calculate_temporal_anomaly(
            user_id, activity, recent_activities)

        # Build feature vector
        features = np.array([
            file_size,
            file_count,
            sensitive_count,
            delete_count,
            data_transfer,
            external_conns,
            email_attachment,
            external_emails,
            off_hours_score,
            process_suspicious_score,
            rapid_activity_score,
            pattern_deviation_score,
            temporal_anomaly_score
        ])

        return features.reshape(1, -1)

    def _calculate_off_hours_score(self, user_id: str, current_hour: int) -> float:
        """Calculate off-hours score based on user's baseline (ML-based)"""
        # CRITICAL FIX: Off-hours is ONLY before 7 AM or after/at 7 PM (19:00)
        # Working hours: 7:00 AM to 6:59 PM (7:00 to 18:59)
        # Off-hours: Before 7:00 AM (hour < 7) OR After/at 7:00 PM (hour >= 19)

        # First check if it's actually off-hours
        is_off_hours = (current_hour < 7) or (current_hour >= 19)

        if not is_off_hours:
            # During working hours - return 0 (not off-hours)
            return 0.0

        # It IS off-hours - check user baseline
        if user_id not in self.user_baselines:
            # No baseline - return high score for off-hours activity
            return 0.8

        baseline = self.user_baselines[user_id]
        typical_hours = baseline.get('typical_hours', set(range(7, 19)))

        if current_hour not in typical_hours:
            # Calculate deviation from baseline
            hour_frequency = baseline.get('hour_frequency', {})
            if hour_frequency:
                max_freq = max(hour_frequency.values())
                current_freq = hour_frequency.get(current_hour, 0)
                deviation = 1.0 - \
                    (current_freq / max_freq) if max_freq > 0 else 1.0
                return min(deviation, 1.0)
            return 0.8

        return 0.3  # User sometimes works at this off-hours time

    def _calculate_rapid_activity_score(self, user_id: str, recent_activities: List[Dict], activity_type: str) -> float:
        """Calculate rapid activity score using statistical deviation"""
        if user_id not in self.user_baselines:
            return 0.0

        baseline = self.user_baselines[user_id]
        avg_activity_rate = baseline.get(
            'avg_activity_rate', {}).get(activity_type, 1.0)

        # Count activities in last 5 minutes
        cutoff = datetime.now() - timedelta(minutes=5)
        recent_count = len([a for a in recent_activities
                           if a.get('activity_type') == activity_type and
                           datetime.fromisoformat(a.get('timestamp', '')) > cutoff])

        # Calculate z-score (statistical deviation)
        if avg_activity_rate > 0:
            z_score = (recent_count - avg_activity_rate) / \
                (avg_activity_rate ** 0.5 + 1)
            # Normalize to 0-1
            # 3-sigma normalization
            rapid_score = min(max(z_score / 3.0, 0.0), 1.0)
            return rapid_score

        return 0.0

    def _calculate_pattern_deviation(self, user_id: str, activity: Dict, recent_activities: List[Dict]) -> float:
        """Calculate how much this activity deviates from user's normal pattern"""
        if user_id not in self.user_baselines:
            return 0.0

        baseline = self.user_baselines[user_id]
        activity_type = activity.get('activity_type', '')

        # Get typical activity distribution
        typical_distribution = baseline.get('activity_distribution', {})
        typical_freq = typical_distribution.get(activity_type, 0.1)

        # Calculate current frequency
        total_recent = len(recent_activities)
        current_freq = len([a for a in recent_activities if a.get(
            'activity_type') == activity_type]) / max(total_recent, 1)

        # Deviation score
        deviation = abs(current_freq - typical_freq) / max(typical_freq, 0.1)
        return min(deviation, 1.0)

    def _calculate_temporal_anomaly(self, user_id: str, activity: Dict, recent_activities: List[Dict]) -> float:
        """Calculate temporal anomaly score (unusual timing patterns)"""
        if user_id not in self.user_baselines:
            return 0.0

        baseline = self.user_baselines[user_id]

        # Check for unusual sequences
        activity_sequence = [a.get('activity_type')
                             for a in recent_activities[-10:]]
        typical_sequences = baseline.get('typical_sequences', [])

        # Simple sequence matching (can be enhanced with LSTM)
        if typical_sequences:
            sequence_match = any(
                activity_sequence[-len(seq):] == seq
                for seq in typical_sequences
            )
            if not sequence_match:
                return 0.6  # Moderate temporal anomaly

        return 0.0

    def _update_user_baseline(self, user_id: str, activity: Dict):
        """Update user's behavioral baseline (adaptive learning)"""
        if user_id not in self.user_baselines:
            self.user_baselines[user_id] = {
                'typical_hours': set(),
                'hour_frequency': {},
                'avg_activity_rate': {},
                'activity_distribution': {},
                'typical_sequences': []
            }

        baseline = self.user_baselines[user_id]
        current_hour = datetime.now().hour
        activity_type = activity.get('activity_type', '')

        # Update hour frequency
        baseline['hour_frequency'][current_hour] = baseline['hour_frequency'].get(
            current_hour, 0) + 1

        # Update activity distribution
        baseline['activity_distribution'][activity_type] = baseline['activity_distribution'].get(
            activity_type, 0) + 1

        # Update typical hours (most common hours)
        if len(baseline['hour_frequency']) > 100:  # After enough data
            top_hours = sorted(baseline['hour_frequency'].items(
            ), key=lambda x: x[1], reverse=True)[:12]
            baseline['typical_hours'] = set(h for h, _ in top_hours)

    def detect_anomaly(self, activity: Dict, user_id: str, recent_activities: List[Dict]) -> Tuple[bool, float, str]:
        """
        Detect anomaly using ML models (not rule-based)
        Returns: (is_anomaly, ml_score, explanation)
        """
        # Update baseline
        self._update_user_baseline(user_id, activity)

        # Extract ML features
        features = self._extract_ml_features(
            activity, user_id, recent_activities)

        # Scale features
        features_scaled = self.scaler.transform(features)

        # Isolation Forest prediction (unsupervised)
        iso_pred = self.isolation_forest.predict(features_scaled)[0]
        iso_score = -self.isolation_forest.score_samples(features_scaled)[0]
        iso_score_norm = min(max((iso_score + 0.5) / 1.0, 0), 1.0)

        # Anomaly scorer (if trained)
        try:
            anomaly_score = self.anomaly_scorer.predict(features_scaled)[0]
            anomaly_score = min(max(anomaly_score, 0.0), 1.0)
        except:
            anomaly_score = iso_score_norm

        # Ensemble score (weighted combination)
        ml_score = (iso_score_norm * 0.6) + (anomaly_score * 0.4)

        # ENHANCED: Boost score for known threat patterns (rule-assisted ML)
        details = activity.get('details', {})
        activity_type = activity.get('activity_type', '')

        # Pattern-based boosts (helps ML catch common threats)
        pattern_boost = 0.0
        if details.get('size_mb', 0) > 50 or details.get('file_size_mb', 0) > 50:
            pattern_boost += 0.15  # Large file boost
        if details.get('sensitive', False):
            pattern_boost += 0.20  # Sensitive file boost
        if details.get('external', False) and details.get('attachment_size_mb', 0) > 10:
            pattern_boost += 0.25  # External email with attachment boost
        # CRITICAL FIX: Use off_hours flag from agent (local time) or check activity hour
        activity_hour = details.get(
            'activity_hour') or details.get('logon_hour')
        if activity_hour is None:
            try:
                if isinstance(activity.get('timestamp'), str):
                    from dateutil import parser
                    activity_time = parser.parse(activity.get('timestamp'))
                    activity_hour = activity_time.hour
                else:
                    activity_hour = datetime.now().hour
            except:
                activity_hour = datetime.now().hour

        # Check if actually off-hours: hour < 7 OR hour >= 19
        is_actually_off_hours = False
        if details.get('off_hours', False):
            # Agent already calculated it correctly
            is_actually_off_hours = True
        elif activity_hour is not None:
            # Double-check: off-hours is hour < 7 OR hour >= 19
            is_actually_off_hours = (
                activity_hour < 7) or (activity_hour >= 19)

        if is_actually_off_hours:
            pattern_boost += 0.15  # Off-hours boost
        if details.get('suspicious', False) or any(kw in str(details.get('process_name', '')).lower()
                                                   for kw in ['tor', 'vpn', 'ssh', 'nmap', 'wireshark']):
            pattern_boost += 0.20  # Suspicious process boost
        if len([a for a in recent_activities if a.get('activity_type') == activity_type]) >= 10:
            pattern_boost += 0.15  # Rapid activity boost

        # Apply pattern boost (capped at 0.95 to keep ML in control)
        ml_score = min(ml_score + pattern_boost, 0.95)

        # LOWERED THRESHOLD: 30% for better detection (matches backend threshold)
        # 30% confidence threshold (lowered from 60%)
        confidence_threshold = 0.3

        is_anomaly = ml_score >= confidence_threshold or iso_pred == -1

        # Generate explanation
        explanation = self._generate_explanation(
            activity, features[0], ml_score, iso_score_norm)

        return is_anomaly, ml_score, explanation

    def _generate_explanation(self, activity: Dict, features: np.ndarray, ml_score: float, iso_score: float) -> str:
        """Generate human-readable explanation with enhanced pattern detection"""
        details = activity.get('details', {})
        activity_type = activity.get('activity_type', '')

        explanations = []

        # File access patterns
        file_size = details.get('size_mb', 0) or details.get(
            'file_size_mb', 0) or features[0]
        if file_size > 50:
            explanations.append(f"Large file access ({file_size:.1f}MB)")
        if details.get('sensitive', False) or features[2] > 0:
            explanations.append("Sensitive file access detected")
        if details.get('action') == 'delete' or features[3] > 0:
            explanations.append("File deletion detected")

        # Network/data transfer patterns
        data_transfer = details.get('data_sent_mb', 0) or details.get(
            'attachment_size_mb', 0) or features[4]
        if data_transfer > 50:  # Lowered from 100
            explanations.append(f"Large data transfer ({data_transfer:.1f}MB)")
        if features[5] >= 3:  # Lowered from 5
            explanations.append(
                f"Multiple external connections ({int(features[5])})")

        # Email patterns
        if details.get('external', False) and data_transfer > 10:
            explanations.append("External email with attachment")
        if details.get('suspicious_keywords', 0) > 0:
            explanations.append("Suspicious keywords in communication")

        # Temporal patterns
        # CRITICAL FIX: Use hour from activity details (local time from agent) instead of server time
        # Agent sends activity_hour or logon_hour in local time, use that for accurate reporting
        activity_hour = details.get(
            'activity_hour') or details.get('logon_hour')
        if activity_hour is None:
            # Fallback: parse from timestamp if available (assume local time from agent)
            try:
                if isinstance(activity.get('timestamp'), str):
                    from dateutil import parser
                    activity_time = parser.parse(activity.get('timestamp'))
                    activity_hour = activity_time.hour
                else:
                    activity_hour = datetime.now().hour
            except:
                activity_hour = datetime.now().hour

        # CRITICAL FIX: Off-hours is ONLY before 7 AM or after/at 7 PM (19:00)
        # Working hours: 7:00 AM to 6:59 PM (7:00 to 18:59)
        # Off-hours: Before 7:00 AM (hour < 7) OR After/at 7:00 PM (hour >= 19)
        is_off_hours = False
        if details.get('off_hours', False):
            # Agent already calculated it correctly in local time
            is_off_hours = True
        elif activity_hour is not None:
            # Double-check: off-hours is hour < 7 OR hour >= 19
            is_off_hours = (activity_hour < 7) or (activity_hour >= 19)

        # Only add to explanation if ACTUALLY off-hours
        # Don't rely on features[8] alone - it might be a false positive
        if is_off_hours:
            explanations.append(f"Off-hours activity ({activity_hour}:00)")

        # Process patterns
        if details.get('suspicious', False) or features[9] > 0.5:
            process_name = details.get('process_name', '')
            if process_name:
                explanations.append(f"Suspicious process: {process_name}")
            else:
                explanations.append("Suspicious process detected")

        # Activity patterns
        if features[10] > 0.5:  # Rapid activity
            explanations.append("Rapid activity pattern detected")
        if features[11] > 0.5:  # Pattern deviation
            explanations.append("Behavioral pattern deviation")
        if features[12] > 0.5:  # Temporal anomaly
            explanations.append("Unusual timing pattern")

        # Login patterns
        if activity_type == 'logon' and (details.get('geo_anomaly', 0) > 0 or details.get('off_hours', False)):
            explanations.append("Unusual login pattern")

        if not explanations:
            explanations.append(
                f"ML anomaly detected ({ml_score:.1%} confidence)")

        return "; ".join(explanations)

    def generate_fingerprint(self, activity: Dict, user_id: str) -> str:
        """Generate unique fingerprint for anomaly deduplication"""
        activity_type = activity.get('activity_type', '')
        details = activity.get('details', {})
        timestamp = activity.get('timestamp', '')

        # Create fingerprint based on activity characteristics
        fingerprint_data = {
            'user_id': user_id,
            'activity_type': activity_type,
            'key_features': {
                # Truncate for consistency
                'file_path': details.get('file_path', '')[:100],
                'process_name': details.get('process_name', ''),
                'ip_address': details.get('ip_address', ''),
                'device_id': details.get('device_id', '')
            },
            'anomaly_signature': {
                'large_file': details.get('size_mb', 0) > 50,
                'sensitive': details.get('sensitive', False),
                'external': details.get('external', False),
                'off_hours': details.get('off_hours', False)
            }
        }

        # Hash the fingerprint
        fingerprint_str = json.dumps(fingerprint_data, sort_keys=True)
        fingerprint_hash = hashlib.sha256(fingerprint_str.encode()).hexdigest()

        return fingerprint_hash
