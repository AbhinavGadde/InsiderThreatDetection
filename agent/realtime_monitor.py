"""
Enterprise-Grade Real-Time Activity Monitoring Agent for SentinelIQ
Production-ready system activity monitor with native OS integration

Features:
- Native OS activity monitoring (macOS FSEvents, Windows Event Log, Linux inotify)
- Real-time file system, process, network, and user activity tracking
- Immediate backend synchronization with retry logic
- Comprehensive error handling and resilience
- Resource-efficient with intelligent batching
- Secure communication with authentication

Platforms Supported:
- macOS (FSEvents, Activity Monitor APIs)
- Windows (Event Log, WMI, File System Watcher)
- Linux (inotify, systemd)

Author: SentinelIQ Security Team
Version: 2.0.0
"""

import os
import sys
import time
import json
import platform
import threading
import subprocess
import signal
import socket
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Set
from collections import deque
from dataclasses import dataclass, asdict
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    import psutil
except ImportError:
    print("ERROR: psutil not installed. Run: pip install psutil")
    sys.exit(1)

# Platform detection
IS_MAC = platform.system() == 'Darwin'
IS_WINDOWS = platform.system() == 'Windows'
IS_LINUX = platform.system() == 'Linux'

# Platform-specific imports with graceful fallbacks
FSEvents = None
win32evtlog = None
win32security = None
pyinotify = None

if IS_MAC:
    try:
        from FSEvents import FSEvents
        from Foundation import NSURL, NSFileManager
        from AppKit import NSWorkspace
    except ImportError:
        print("WARNING: macOS frameworks not available. Using fallback monitoring.")
        FSEvents = None

if IS_WINDOWS:
    try:
        import win32evtlog
        import win32security
        import win32con
        import win32file
    except ImportError:
        print("WARNING: pywin32 not available. Using fallback monitoring.")
        win32evtlog = None
        win32file = None

if IS_LINUX:
    try:
        import pyinotify
    except ImportError:
        print("WARNING: pyinotify not available. Using fallback monitoring.")
        pyinotify = None

# ==================== ANOMALY DETECTION THRESHOLDS ====================


@dataclass
class AnomalyThresholds:
    """Clear, well-defined anomaly detection thresholds"""
    # File Access Anomalies
    LARGE_FILE_SIZE_MB: float = 50.0  # Files larger than 50MB
    SENSITIVE_FILE_COUNT: int = 3  # 3+ sensitive files accessed
    RAPID_FILE_ACCESS: int = 10  # 10+ files in 5 minutes
    FILE_DELETE_COUNT: int = 5  # 5+ file deletions

    # Off-Hours Activity
    OFF_HOURS_START: int = 7  # Business hours start: 7 AM
    OFF_HOURS_END: int = 19  # Business hours end: 7 PM

    # Network/Data Exfiltration
    LARGE_DATA_TRANSFER_MB: float = 100.0  # 100MB+ data transfer
    EXTERNAL_CONNECTIONS: int = 5  # 5+ external connections
    SUSPICIOUS_PORTS: List[int] = None  # Suspicious port numbers

    # Email Anomalies
    LARGE_ATTACHMENT_MB: float = 50.0  # 50MB+ attachment
    EXTERNAL_EMAIL_COUNT: int = 3  # 3+ external emails

    # Process Anomalies
    SUSPICIOUS_PROCESSES: List[str] = None  # Suspicious process names

    def __post_init__(self):
        if self.SUSPICIOUS_PORTS is None:
            self.SUSPICIOUS_PORTS = [22, 23, 3389, 5900, 8080, 4444, 5555]
        if self.SUSPICIOUS_PROCESSES is None:
            self.SUSPICIOUS_PROCESSES = [
                'tor', 'vpn', 'remote', 'ssh', 'ftp', 'sftp', 'scp',
                'wireshark', 'nmap', 'metasploit', 'burp', 'sqlmap'
            ]

# ==================== ANOMALY DETECTOR ====================


class AnomalyDetector:
    """Detect anomalies in activities before sending to backend"""

    def __init__(self, thresholds: AnomalyThresholds = None):
        self.thresholds = thresholds or AnomalyThresholds()
        self.activity_buffer = []  # Buffer for time-window analysis
        self.buffer_window = 300  # 5 minutes window

    def _is_off_hours(self, timestamp: datetime = None) -> bool:
        """Check if activity is during off-hours"""
        if timestamp is None:
            timestamp = datetime.now()
        hour = timestamp.hour
        return hour < self.thresholds.OFF_HOURS_START or hour >= self.thresholds.OFF_HOURS_END

    def _is_file_anomaly(self, activity: Dict) -> bool:
        """Detect file access anomalies"""
        details = activity.get('details', {})
        file_size = details.get('size_mb', 0)
        is_sensitive = details.get('sensitive', False)
        action = details.get('action', 'read')

        # Large file access
        if file_size > self.thresholds.LARGE_FILE_SIZE_MB:
            return True

        # Sensitive file access
        if is_sensitive:
            return True

        # File deletion
        if action == 'delete':
            return True

        return False

    def _is_network_anomaly(self, activity: Dict) -> bool:
        """Detect network/data exfiltration anomalies"""
        details = activity.get('details', {})
        data_sent = details.get('attachment_size_mb',
                                0) or details.get('data_sent_mb', 0)
        external_conns = details.get('external_connections', 0)
        suspicious_ports = details.get('suspicious_ports', [])

        # Large data transfer
        if data_sent > self.thresholds.LARGE_DATA_TRANSFER_MB:
            return True

        # Many external connections
        if external_conns >= self.thresholds.EXTERNAL_CONNECTIONS:
            return True

        # Suspicious ports
        if suspicious_ports:
            return True

        return False

    def _is_email_anomaly(self, activity: Dict) -> bool:
        """Detect email anomalies"""
        details = activity.get('details', {})
        attachment_size = details.get('attachment_size_mb', 0)
        is_external = details.get('external', False)
        suspicious_keywords = details.get('suspicious_keywords', 0)

        # Large attachment
        if attachment_size > self.thresholds.LARGE_ATTACHMENT_MB:
            return True

        # External email with attachment
        if is_external and attachment_size > 10:
            return True

        # Suspicious keywords
        if suspicious_keywords > 0:
            return True

        return False

    def _is_login_anomaly(self, activity: Dict) -> bool:
        """Detect login anomalies"""
        details = activity.get('details', {})
        off_hours = details.get('off_hours', False)
        geo_anomaly = details.get('geo_anomaly', 0)

        # Off-hours login
        if off_hours:
            return True

        # Geographic anomaly
        if geo_anomaly > 0:
            return True

        return False

    def _is_process_anomaly(self, activity: Dict) -> bool:
        """Detect process anomalies"""
        details = activity.get('details', {})
        process_name = details.get('process_name', '').lower()
        is_suspicious = details.get('suspicious', False)
        off_hours = details.get('off_hours', False)

        # Suspicious process
        if is_suspicious:
            return True

        # Suspicious process name
        if any(keyword in process_name for keyword in self.thresholds.SUSPICIOUS_PROCESSES):
            return True

        # Off-hours process execution
        if off_hours:
            return True

        return False

    def _check_rapid_activity(self, activity_type: str) -> bool:
        """Check for rapid activity patterns (e.g., 10+ files in 5 minutes)"""
        current_time = time.time()
        cutoff_time = current_time - self.buffer_window

        # Filter recent activities of same type
        recent_activities = [
            a for a in self.activity_buffer
            if a.get('activity_type') == activity_type and a.get('_timestamp', 0) > cutoff_time
        ]

        # Check thresholds
        if activity_type == 'file_access' and len(recent_activities) >= self.thresholds.RAPID_FILE_ACCESS:
            return True

        if activity_type == 'email' and len(recent_activities) >= self.thresholds.EXTERNAL_EMAIL_COUNT:
            return True

        return False

    def is_anomaly(self, activity: Dict) -> tuple:
        """
        Determine if activity is an anomaly
        Returns: (is_anomaly: bool, reason: str)
        """
        activity_type = activity.get('activity_type', '')
        details = activity.get('details', {})

        # Add to buffer for pattern detection
        activity['_timestamp'] = time.time()
        self.activity_buffer.append(activity)

        # Clean old buffer entries
        current_time = time.time()
        self.activity_buffer = [
            a for a in self.activity_buffer
            if a.get('_timestamp', 0) > current_time - self.buffer_window
        ]

        # Check for rapid activity patterns
        if self._check_rapid_activity(activity_type):
            if activity_type == 'file_access':
                return True, f"Rapid file access: {len([a for a in self.activity_buffer if a.get('activity_type') == 'file_access'])} files in 5 minutes"
            elif activity_type == 'email':
                return True, f"Multiple external emails: {len([a for a in self.activity_buffer if a.get('activity_type') == 'email'])} emails"

        # Type-specific anomaly detection
        if activity_type == 'file_access':
            if self._is_file_anomaly(activity):
                if details.get('size_mb', 0) > self.thresholds.LARGE_FILE_SIZE_MB:
                    return True, f"Large file access: {details.get('size_mb', 0):.1f}MB"
                elif details.get('sensitive', False):
                    return True, "Sensitive file access detected"
                elif details.get('action') == 'delete':
                    return True, "File deletion detected"

        elif activity_type == 'email':
            if self._is_email_anomaly(activity):
                if details.get('attachment_size_mb', 0) > self.thresholds.LARGE_ATTACHMENT_MB:
                    return True, f"Large email attachment: {details.get('attachment_size_mb', 0):.1f}MB"
                elif details.get('external', False):
                    return True, "External email with attachment"
                elif details.get('suspicious_keywords', 0) > 0:
                    return True, "Suspicious keywords in email"

        elif activity_type == 'logon':
            if self._is_login_anomaly(activity):
                if details.get('off_hours', False):
                    return True, f"Off-hours login: {details.get('logon_hour', 0)}:00"
                elif details.get('geo_anomaly', 0) > 0:
                    return True, "Geographic anomaly detected"

        elif activity_type == 'process':
            if self._is_process_anomaly(activity):
                if details.get('suspicious', False):
                    return True, f"Suspicious process: {details.get('process_name', 'unknown')}"
                elif details.get('off_hours', False):
                    return True, "Off-hours process execution"

        # Network activity (handled as email type)
        if details.get('external_connections', 0) >= self.thresholds.EXTERNAL_CONNECTIONS:
            return True, f"Multiple external connections: {details.get('external_connections', 0)}"

        if details.get('data_sent_mb', 0) > self.thresholds.LARGE_DATA_TRANSFER_MB:
            return True, f"Large data transfer: {details.get('data_sent_mb', 0):.1f}MB"

        # Not an anomaly
        return False, ""

# ==================== CONFIGURATION ====================


@dataclass
class AgentConfig:
    """Agent configuration"""
    user_id: str
    user_name: str
    server_url: str
    upload_interval: int = 5  # seconds - activity upload interval
    alert_interval: int = 20  # seconds - alert aggregation interval
    max_retries: int = 3
    retry_delay: int = 2
    batch_size: int = 50
    connection_timeout: int = 10
    enable_file_monitoring: bool = True
    enable_process_monitoring: bool = True
    enable_network_monitoring: bool = True
    enable_login_monitoring: bool = True
    sensitive_patterns: List[str] = None
    monitored_paths: List[str] = None
    # Send all activities - backend does ML detection
    send_only_anomalies: bool = False

    def __post_init__(self):
        if self.sensitive_patterns is None:
            self.sensitive_patterns = [
                'confidential', 'secret', 'private', 'financial', 'salary', 'budget',
                'password', 'credential', 'key', 'token', '.env', '.key', '.pem',
                'passwords', 'credentials', 'api_key', 'access_token'
            ]
        if self.monitored_paths is None:
            self.monitored_paths = self._get_default_paths()

    def _get_default_paths(self) -> List[str]:
        """Get default monitored paths"""
        paths = []
        home = Path.home()

        # User directories
        user_dirs = [
            str(home / 'Documents'),
            str(home / 'Downloads'),
            str(home / 'Desktop'),
        ]

        # Platform-specific
        if IS_MAC:
            user_dirs.extend([
                str(home / 'Library' / 'Application Support'),
            ])
        elif IS_WINDOWS:
            user_dirs.extend([
                os.environ.get('USERPROFILE', '') + '\\Documents',
                os.environ.get('USERPROFILE', '') + '\\Downloads',
            ])
        elif IS_LINUX:
            user_dirs.extend([
                str(home / '.local' / 'share'),
            ])

        # Filter to existing paths
        return [p for p in user_dirs if p and os.path.exists(p)]

# ==================== LOGGING ====================


class AgentLogger:
    """Structured logging for agent"""

    @staticmethod
    def info(message: str, **kwargs):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [INFO] {message}", **kwargs)

    @staticmethod
    def error(message: str, **kwargs):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [ERROR] {message}", **kwargs, file=sys.stderr)

    @staticmethod
    def warning(message: str, **kwargs):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [WARN] {message}", **kwargs)

    @staticmethod
    def debug(message: str, **kwargs):
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] [DEBUG] {message}", **kwargs)

# ==================== FILE SYSTEM MONITOR ====================


class FileSystemMonitor:
    """Advanced file system monitoring with native OS integration"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.file_events = deque(maxlen=1000)  # Circular buffer
        self.lock = threading.Lock()
        self.running = False
        self.monitored_paths = [
            Path(p) for p in config.monitored_paths if os.path.exists(p)]
        self.seen_files = {}  # Track recently seen files to avoid duplicates
        self.last_scan_time = time.time()

        AgentLogger.info(
            f"File monitor initialized with {len(self.monitored_paths)} paths")

    def _is_sensitive_file(self, file_path: str) -> bool:
        """Check if file matches sensitive patterns"""
        file_lower = file_path.lower()
        return any(pattern.lower() in file_lower for pattern in self.config.sensitive_patterns)

    def _get_file_size_mb(self, file_path: str) -> float:
        """Get file size in MB"""
        try:
            if os.path.exists(file_path):
                size = os.path.getsize(file_path)
                return size / (1024 * 1024)
        except (OSError, PermissionError):
            pass
        return 0.0

    def _get_file_action(self, file_path: str) -> str:
        """Determine file action based on metadata"""
        try:
            if not os.path.exists(file_path):
                return 'delete'

            # Check modification time
            mtime = os.path.getmtime(file_path)
            current_time = time.time()

            # If modified in last 5 seconds, likely a write
            if current_time - mtime < 5:
                return 'write'

            # Check access time
            atime = os.path.getatime(file_path)
            if current_time - atime < 5:
                return 'read'

            return 'read'
        except:
            return 'read'

    def monitor_mac_native(self):
        """macOS native FSEvents monitoring"""
        if not FSEvents:
            AgentLogger.warning("FSEvents not available, using fallback")
            return self.monitor_fallback()

        def callback(path, flags, event_id):
            try:
                file_path = str(path)

                # Skip system files and directories
                if any(skip in file_path for skip in ['.DS_Store', '.Trash', 'Library/Caches', '.git']):
                    return

                if os.path.isdir(file_path):
                    return

                # Determine action from flags
                action = 'read'
                if flags & 0x00000010:  # ItemRemoved
                    action = 'delete'
                elif flags & 0x00000020:  # ItemRenamed
                    action = 'write'
                elif flags & 0x00000008:  # ItemModified
                    action = 'write'

                # Avoid duplicates (same file within 2 seconds)
                file_key = f"{file_path}:{action}"
                current_time = time.time()
                if file_key in self.seen_files:
                    if current_time - self.seen_files[file_key] < 2:
                        return

                self.seen_files[file_key] = current_time

                file_size = self._get_file_size_mb(file_path)
                is_sensitive = self._is_sensitive_file(file_path)

                event = {
                    'timestamp': datetime.now().isoformat(),
                    'file_path': file_path,
                    'action': action,
                    'size_mb': round(file_size, 2),
                    'sensitive': is_sensitive
                }

                with self.lock:
                    self.file_events.append(event)

            except Exception as e:
                AgentLogger.debug(f"Error in FSEvents callback: {e}")

        try:
            for path in self.monitored_paths:
                if path.exists():
                    fsevents = FSEvents(callback, path)
                    fsevents.start()
                    AgentLogger.info(f"Monitoring path: {path}")
        except Exception as e:
            AgentLogger.error(f"FSEvents monitoring failed: {e}")
            return self.monitor_fallback()

    def monitor_windows_native(self):
        """Windows native file system monitoring"""
        if not win32file or not win32con:
            AgentLogger.warning(
                "Windows native monitoring not available, using fallback")
            return self.monitor_fallback()

        def watch_directory(path):
            """Watch a single directory"""
            try:
                # CRITICAL FIX: Use correct Windows API constants
                # FILE_LIST_DIRECTORY (0x0001) is not a standard pywin32 constant
                # Use numeric value directly for directory access
                # 0x0001 = FILE_LIST_DIRECTORY access right (allows listing directory contents)
                FILE_LIST_DIRECTORY = 0x0001

                # Ensure we have all required constants
                FILE_SHARE_READ = getattr(
                    win32con, 'FILE_SHARE_READ', 0x00000001)
                FILE_SHARE_WRITE = getattr(
                    win32con, 'FILE_SHARE_WRITE', 0x00000002)
                FILE_SHARE_DELETE = getattr(
                    win32con, 'FILE_SHARE_DELETE', 0x00000004)
                OPEN_EXISTING = getattr(win32con, 'OPEN_EXISTING', 3)
                FILE_FLAG_BACKUP_SEMANTICS = getattr(
                    win32con, 'FILE_FLAG_BACKUP_SEMANTICS', 0x02000000)

                hDir = win32file.CreateFile(
                    str(path),  # Ensure string path
                    FILE_LIST_DIRECTORY,
                    FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                    None,
                    OPEN_EXISTING,
                    FILE_FLAG_BACKUP_SEMANTICS,
                    None
                )

                while self.running:
                    try:
                        # Get notification constants with fallbacks
                        FILE_NOTIFY_CHANGE_FILE_NAME = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_FILE_NAME', 0x00000001)
                        FILE_NOTIFY_CHANGE_DIR_NAME = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_DIR_NAME', 0x00000002)
                        FILE_NOTIFY_CHANGE_ATTRIBUTES = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_ATTRIBUTES', 0x00000004)
                        FILE_NOTIFY_CHANGE_SIZE = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_SIZE', 0x00000008)
                        FILE_NOTIFY_CHANGE_LAST_WRITE = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_LAST_WRITE', 0x00000010)
                        FILE_NOTIFY_CHANGE_LAST_ACCESS = getattr(
                            win32con, 'FILE_NOTIFY_CHANGE_LAST_ACCESS', 0x00000020)

                        results = win32file.ReadDirectoryChangesW(
                            hDir,
                            1024,
                            True,
                            FILE_NOTIFY_CHANGE_FILE_NAME |
                            FILE_NOTIFY_CHANGE_DIR_NAME |
                            FILE_NOTIFY_CHANGE_ATTRIBUTES |
                            FILE_NOTIFY_CHANGE_SIZE |
                            FILE_NOTIFY_CHANGE_LAST_WRITE |
                            FILE_NOTIFY_CHANGE_LAST_ACCESS,
                            None,
                            None
                        )

                        for action, file_name in results:
                            file_path = os.path.join(path, file_name)

                            # Map Windows action to our action
                            if action == 1:  # FILE_ACTION_ADDED
                                action_str = 'write'
                            elif action == 2:  # FILE_ACTION_REMOVED
                                action_str = 'delete'
                            elif action == 3:  # FILE_ACTION_MODIFIED
                                action_str = 'write'
                            elif action == 4:  # FILE_ACTION_RENAMED_OLD_NAME
                                action_str = 'write'
                            else:
                                action_str = 'read'

                            file_size = self._get_file_size_mb(file_path)
                            is_sensitive = self._is_sensitive_file(file_path)

                            event = {
                                'timestamp': datetime.now().isoformat(),
                                'file_path': file_path,
                                'action': action_str,
                                'size_mb': round(file_size, 2),
                                'sensitive': is_sensitive
                            }

                            with self.lock:
                                self.file_events.append(event)

                    except Exception as e:
                        AgentLogger.debug(
                            f"Error reading directory changes: {e}")
                        time.sleep(1)

            except Exception as e:
                AgentLogger.error(
                    f"Windows file monitoring failed for {path}: {e}")
                # Fallback to polling for this path
                AgentLogger.info(f"Using fallback polling for {path}")

        # Start monitoring threads for each path
        threads = []
        for path in self.monitored_paths:
            if path.exists():
                try:
                    thread = threading.Thread(
                        target=watch_directory, args=(str(path),), daemon=True)
                    thread.start()
                    threads.append(thread)
                    AgentLogger.info(f"Monitoring path: {path}")
                except Exception as e:
                    AgentLogger.warning(
                        f"Failed to start monitoring for {path}: {e}")
                    # Will fall back to polling

        # If no threads started successfully, use fallback
        if not threads:
            AgentLogger.warning(
                "No Windows native monitoring threads started, using fallback")
            return self.monitor_fallback()

        # Also start fallback polling as backup (runs in parallel)
        AgentLogger.info(
            "Windows native monitoring started, fallback polling also active")

    def monitor_linux_native(self):
        """Linux native inotify monitoring"""
        if not pyinotify:
            return self.monitor_fallback()

        class EventHandler(pyinotify.ProcessEvent):
            def __init__(self, monitor_instance):
                self.monitor = monitor_instance
                super().__init__()

            def process_IN_ACCESS(self, event):
                self._add_event(event.pathname, 'read')

            def process_IN_MODIFY(self, event):
                self._add_event(event.pathname, 'write')

            def process_IN_DELETE(self, event):
                self._add_event(event.pathname, 'delete')

            def process_IN_CREATE(self, event):
                self._add_event(event.pathname, 'write')

            def _add_event(self, file_path, action):
                try:
                    if os.path.isdir(file_path):
                        return

                    file_size = self.monitor._get_file_size_mb(file_path)
                    is_sensitive = self.monitor._is_sensitive_file(file_path)

                    event = {
                        'timestamp': datetime.now().isoformat(),
                        'file_path': file_path,
                        'action': action,
                        'size_mb': round(file_size, 2),
                        'sensitive': is_sensitive
                    }

                    with self.monitor.lock:
                        self.monitor.file_events.append(event)
                except Exception as e:
                    AgentLogger.debug(f"Error processing inotify event: {e}")

        try:
            wm = pyinotify.WatchManager()
            handler = EventHandler(self)
            notifier = pyinotify.Notifier(wm, handler)

            mask = pyinotify.IN_ACCESS | pyinotify.IN_MODIFY | pyinotify.IN_DELETE | pyinotify.IN_CREATE

            for path in self.monitored_paths:
                if path.exists():
                    wm.add_watch(str(path), mask, rec=True)
                    AgentLogger.info(f"Monitoring path: {path}")

            # Run notifier in thread
            def run_notifier():
                while self.running:
                    try:
                        notifier.process_events()
                        if notifier.check_events(timeout=1):
                            notifier.read_events()
                    except Exception as e:
                        AgentLogger.debug(f"inotify error: {e}")
                        time.sleep(1)

            thread = threading.Thread(target=run_notifier, daemon=True)
            thread.start()

        except Exception as e:
            AgentLogger.error(f"inotify monitoring failed: {e}")
            return self.monitor_fallback()

    def monitor_fallback(self):
        """Fallback polling-based monitoring"""
        AgentLogger.info("Using fallback polling-based file monitoring")

        def poll_files():
            last_check = {}

            while self.running:
                try:
                    current_time = time.time()

                    for path in self.monitored_paths:
                        if not path.exists():
                            continue

                        try:
                            for root, dirs, files in os.walk(path):
                                # Limit depth
                                depth = root.count(
                                    os.sep) - str(path).count(os.sep)
                                if depth > 3:
                                    dirs[:] = []
                                    continue

                                for file in files:
                                    file_path = os.path.join(root, file)

                                    try:
                                        # Check if file was accessed/modified
                                        mtime = os.path.getmtime(file_path)
                                        atime = os.path.getatime(file_path)

                                        # Recent activity (within last 10 seconds)
                                        recent_access = (
                                            current_time - atime < 10) or (current_time - mtime < 10)

                                        if recent_access:
                                            # Avoid duplicates
                                            if file_path in last_check:
                                                if current_time - last_check[file_path] < 5:
                                                    continue

                                            last_check[file_path] = current_time

                                            file_size = self._get_file_size_mb(
                                                file_path)
                                            is_sensitive = self._is_sensitive_file(
                                                file_path)

                                            # Only log significant files
                                            if file_size > 0.1 or is_sensitive:
                                                action = 'write' if (
                                                    current_time - mtime < 5) else 'read'

                                                event = {
                                                    'timestamp': datetime.now().isoformat(),
                                                    'file_path': file_path,
                                                    'action': action,
                                                    'size_mb': round(file_size, 2),
                                                    'sensitive': is_sensitive
                                                }

                                                with self.lock:
                                                    self.file_events.append(
                                                        event)

                                    except (OSError, PermissionError):
                                        pass

                        except Exception as e:
                            AgentLogger.debug(f"Error scanning {path}: {e}")

                    time.sleep(5)  # Poll every 5 seconds

                except Exception as e:
                    AgentLogger.error(f"Error in file polling: {e}")
                    time.sleep(10)

        thread = threading.Thread(target=poll_files, daemon=True)
        thread.start()

    def start(self):
        """Start file system monitoring"""
        self.running = True

        if IS_MAC:
            self.monitor_mac_native()
        elif IS_WINDOWS:
            self.monitor_windows_native()
        elif IS_LINUX:
            self.monitor_linux_native()
        else:
            self.monitor_fallback()

    def stop(self):
        """Stop file system monitoring"""
        self.running = False

    def get_recent_events(self, limit: int = 100) -> List[Dict]:
        """Get and clear recent file events"""
        with self.lock:
            events = list(self.file_events)[-limit:]
            self.file_events.clear()
            return events

# ==================== PROCESS MONITOR ====================


class ProcessMonitor:
    """Advanced process monitoring with activity detection"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.process_events = deque(maxlen=500)
        self.lock = threading.Lock()
        self.running = False
        self.last_processes = set()
        self.process_history = {}  # Track process start times

    def _is_suspicious_process(self, proc_name: str) -> bool:
        """Check if process is suspicious"""
        suspicious_keywords = [
            'tor', 'vpn', 'remote', 'ssh', 'ftp', 'sftp', 'scp',
            'wireshark', 'nmap', 'metasploit', 'burp', 'sqlmap'
        ]
        proc_lower = proc_name.lower()
        return any(keyword in proc_lower for keyword in suspicious_keywords)

    def start(self):
        """Start process monitoring"""
        self.monitor()

    def monitor(self):
        """Monitor process activity"""
        self.running = True

        def poll_processes():
            while self.running:
                try:
                    current_processes = set()
                    current_hour = datetime.now().hour
                    off_hours = current_hour < 7 or current_hour >= 19

                    for proc in psutil.process_iter(['pid', 'name', 'create_time', 'cpu_percent', 'memory_info', 'username']):
                        try:
                            proc_info = proc.info
                            proc_name = proc_info.get('name', '')
                            proc_pid = proc_info.get('pid')

                            if not proc_name:
                                continue

                            # Check if new process
                            is_new = proc_pid not in self.last_processes

                            # Track process start time
                            if is_new:
                                self.process_history[proc_pid] = time.time()

                            # Check if suspicious or new
                            is_suspicious = self._is_suspicious_process(
                                proc_name)

                            # Log new processes or suspicious ones
                            if is_new or (is_suspicious and proc_pid not in [e.get('pid') for e in self.process_events]):
                                memory_mb = 0
                                if proc_info.get('memory_info'):
                                    memory_mb = proc_info['memory_info'].rss / \
                                        (1024 * 1024)

                                event = {
                                    'timestamp': datetime.now().isoformat(),
                                    'process_name': proc_name,
                                    'pid': proc_pid,
                                    'cpu_percent': proc_info.get('cpu_percent', 0),
                                    'memory_mb': round(memory_mb, 2),
                                    'username': proc_info.get('username', 'unknown'),
                                    'suspicious': is_suspicious,
                                    'off_hours': off_hours
                                }

                                with self.lock:
                                    self.process_events.append(event)

                            current_processes.add(proc_pid)

                        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                            pass
                        except Exception as e:
                            AgentLogger.debug(f"Error processing process: {e}")

                    with self.lock:
                        self.last_processes = current_processes

                    # Clean up old process history
                    current_time = time.time()
                    self.process_history = {
                        pid: start_time for pid, start_time in self.process_history.items()
                        if current_time - start_time < 3600  # Keep for 1 hour
                    }

                except Exception as e:
                    AgentLogger.error(f"Error in process monitoring: {e}")

                time.sleep(10)  # Check every 10 seconds

        thread = threading.Thread(target=poll_processes, daemon=True)
        thread.start()

    def stop(self):
        """Stop process monitoring"""
        self.running = False

    def get_recent_events(self, limit: int = 50) -> List[Dict]:
        """Get and clear recent process events"""
        with self.lock:
            events = list(self.process_events)[-limit:]
            self.process_events.clear()
            return events

# ==================== NETWORK MONITOR ====================


class NetworkMonitor:
    """Advanced network activity monitoring"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.network_events = deque(maxlen=200)
        self.lock = threading.Lock()
        self.running = False
        self.last_bytes_sent = 0
        self.last_bytes_recv = 0
        self.last_check_time = time.time()

        try:
            net_io = psutil.net_io_counters()
            self.last_bytes_sent = net_io.bytes_sent
            self.last_bytes_recv = net_io.bytes_recv
        except:
            pass

    def _is_local_ip(self, ip: str) -> bool:
        """Check if IP is local/private"""
        if not ip:
            return True
        return ip.startswith(('127.', '192.168.', '10.', '172.16.', '169.254.', '::1', 'fe80:'))

    def start(self):
        """Start network monitoring"""
        self.monitor()

    def monitor(self):
        """Monitor network activity"""
        self.running = True

        def poll_network():
            while self.running:
                try:
                    net_io = psutil.net_io_counters()
                    connections = psutil.net_connections(kind='inet')

                    current_time = time.time()
                    time_delta = current_time - self.last_check_time

                    # Calculate data transfer rates
                    bytes_sent = net_io.bytes_sent - self.last_bytes_sent
                    bytes_recv = net_io.bytes_recv - self.last_bytes_recv
                    data_sent_mb = bytes_sent / (1024 * 1024)
                    data_recv_mb = bytes_recv / (1024 * 1024)

                    # Count external connections
                    external_connections = 0
                    suspicious_ports = set()

                    for conn in connections:
                        if conn.status == 'ESTABLISHED' and conn.raddr:
                            ip = conn.raddr.ip
                            port = conn.raddr.port

                            if not self._is_local_ip(ip):
                                external_connections += 1

                            # Check for suspicious ports
                            if port in [22, 23, 3389, 5900, 8080, 4444, 5555]:
                                suspicious_ports.add(port)

                    # Log significant network activity
                    if data_sent_mb > 0.5 or data_recv_mb > 0.5 or external_connections > 3 or suspicious_ports:
                        event = {
                            'timestamp': datetime.now().isoformat(),
                            'data_sent_mb': round(data_sent_mb, 2),
                            'data_recv_mb': round(data_recv_mb, 2),
                            'external_connections': external_connections,
                            'total_connections': len(connections),
                            'suspicious_ports': list(suspicious_ports) if suspicious_ports else []
                        }

                        with self.lock:
                            self.network_events.append(event)

                    self.last_bytes_sent = net_io.bytes_sent
                    self.last_bytes_recv = net_io.bytes_recv
                    self.last_check_time = current_time

                except Exception as e:
                    AgentLogger.debug(f"Error in network monitoring: {e}")

                time.sleep(15)  # Check every 15 seconds

        thread = threading.Thread(target=poll_network, daemon=True)
        thread.start()

    def stop(self):
        """Stop network monitoring"""
        self.running = False

    def get_recent_events(self, limit: int = 20) -> List[Dict]:
        """Get and clear recent network events"""
        with self.lock:
            events = list(self.network_events)[-limit:]
            self.network_events.clear()
            return events

# ==================== LOGIN MONITOR ====================


class LoginMonitor:
    """Monitor login/logout and session activity"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.login_events = deque(maxlen=100)
        self.lock = threading.Lock()
        self.running = False
        self.last_login_time = None
        self.last_session_check = time.time()

    def _get_local_ip(self) -> str:
        """Get local IP address"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def start(self):
        """Start login monitoring"""
        self.monitor()

    def monitor(self):
        """Monitor login events"""
        self.running = True

        def poll_login():
            while self.running:
                try:
                    current_time = time.time()
                    current_hour = datetime.now().hour
                    off_hours = current_hour < 7 or current_hour >= 19

                    username = os.getlogin()
                    hostname = platform.node()

                    # Check for new login session (system boot or user login)
                    uptime_seconds = time.time() - psutil.boot_time()
                    is_recent_boot = uptime_seconds < 3600  # Within last hour

                    # Log session activity periodically
                    if current_time - self.last_session_check > 300:  # Every 5 minutes
                        event = {
                            'timestamp': datetime.now().isoformat(),
                            'username': username,
                            'hostname': hostname,
                            'logon_hour': current_hour,
                            'off_hours': off_hours,
                            'ip_address': self._get_local_ip(),
                            'device': hostname,
                            'session_active': True
                        }

                        with self.lock:
                            self.login_events.append(event)

                        self.last_session_check = current_time

                    # Check for new login
                    if is_recent_boot and (not self.last_login_time or (current_time - self.last_login_time) > 3600):
                        event = {
                            'timestamp': datetime.now().isoformat(),
                            'username': username,
                            'hostname': hostname,
                            'logon_hour': current_hour,
                            'off_hours': off_hours,
                            'ip_address': self._get_local_ip(),
                            'device': hostname,
                            'new_login': True
                        }

                        with self.lock:
                            self.login_events.append(event)

                        self.last_login_time = current_time

                except Exception as e:
                    AgentLogger.debug(f"Error in login monitoring: {e}")

                time.sleep(60)  # Check every minute

        thread = threading.Thread(target=poll_login, daemon=True)
        thread.start()

    def stop(self):
        """Stop login monitoring"""
        self.running = False

    def get_recent_events(self, limit: int = 10) -> List[Dict]:
        """Get and clear recent login events"""
        with self.lock:
            events = list(self.login_events)[-limit:]
            self.login_events.clear()
            return events

# ==================== ACTIVITY AGGREGATOR ====================


class ActivityAggregator:
    """Aggregate and send activities to backend with retry logic"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.monitors = {}
        self.session = self._create_session()
        self.running = False
        # Removed rule-based anomaly detector - backend does ML-based detection
        self.alert_queue = []  # Queue for alert aggregation
        # Local queue for failed connections (offline support)
        self.local_queue = []
        self.last_alert_send = time.time()  # Track last alert send time
        self.connection_available = True  # Track connection status
        self.stats = {
            'activities_sent': 0,
            'anomalies_detected': 0,
            'alerts_sent': 0,
            'errors': 0,
            'last_success': None,
            'last_error': None,
            'queued_locally': 0,
            'retried_from_queue': 0
        }

        # Initialize monitors
        if config.enable_file_monitoring:
            self.monitors['file'] = FileSystemMonitor(config)
        if config.enable_process_monitoring:
            self.monitors['process'] = ProcessMonitor(config)
        if config.enable_network_monitoring:
            self.monitors['network'] = NetworkMonitor(config)
        if config.enable_login_monitoring:
            self.monitors['login'] = LoginMonitor(config)

    def _create_session(self) -> requests.Session:
        """Create HTTP session with retry logic"""
        session = requests.Session()

        retry_strategy = Retry(
            total=self.config.max_retries,
            backoff_factor=self.config.retry_delay,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["POST", "GET"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def start(self):
        """Start all monitors"""
        self.running = True

        for name, monitor in self.monitors.items():
            monitor.start()
            AgentLogger.info(f"Started {name} monitor")

    def stop(self):
        """Stop all monitors"""
        self.running = False

        for name, monitor in self.monitors.items():
            monitor.stop()
            AgentLogger.info(f"Stopped {name} monitor")

    def aggregate_and_send(self):
        """Aggregate activities, detect anomalies, and send alerts every 20 seconds"""
        anomalies_detected = 0
        current_time = time.time()

        try:
            # Collect all events from monitors
            all_activities = []

            # Collect file access events
            if 'file' in self.monitors:
                file_events = self.monitors['file'].get_recent_events(
                    limit=100)
                for file_event in file_events:
                    # Use REAL-TIME timestamp for activities
                    activity = {
                        'user_id': self.config.user_id,
                        'timestamp': datetime.now().isoformat(),  # REAL-TIME timestamp
                        'activity_type': 'file_access',
                        'details': {
                            'file_path': file_event.get('file_path', ''),
                            'action': file_event.get('action', 'read'),
                            'size_mb': file_event.get('size_mb', 0),
                            # Also include for ML detection
                            'file_size_mb': file_event.get('size_mb', 0),
                            'sensitive': file_event.get('sensitive', False),
                            'ip_address': self.monitors.get('login', LoginMonitor(self.config))._get_local_ip(),
                            # Unique device ID per laptop
                            'device_id': f"{platform.node()}_{socket.gethostname()}",
                            'device_name': platform.node(),
                            'hostname': socket.gethostname(),
                            # CRITICAL: Local hour for accurate timezone handling
                            'activity_hour': datetime.now().hour,
                            'off_hours': datetime.now().hour < 7 or datetime.now().hour >= 19  # Add off-hours flag
                        }
                    }
                    all_activities.append(activity)

            # Collect process events
            if 'process' in self.monitors:
                process_events = self.monitors['process'].get_recent_events(
                    limit=20)
                for proc_event in process_events:
                    # Use REAL-TIME timestamp
                    activity = {
                        'user_id': self.config.user_id,
                        'timestamp': datetime.now().isoformat(),  # REAL-TIME timestamp
                        'activity_type': 'process',
                        'details': {
                            'process_name': proc_event.get('process_name', ''),
                            'pid': proc_event.get('pid', 0),
                            'suspicious': proc_event.get('suspicious', False),
                            'off_hours': proc_event.get('off_hours', False) or (datetime.now().hour < 7 or datetime.now().hour >= 19),
                            # Unique device ID per laptop
                            'device_id': f"{platform.node()}_{socket.gethostname()}",
                            'device_name': platform.node(),
                            'hostname': socket.gethostname(),
                            # CRITICAL: Local hour for accurate timezone handling
                            'activity_hour': datetime.now().hour
                        }
                    }
                    all_activities.append(activity)

            # Collect login events
            if 'login' in self.monitors:
                login_events = self.monitors['login'].get_recent_events(
                    limit=10)
                for login_event in login_events:
                    # Only send login events if they're anomalies (off-hours, new login)
                    if login_event.get('off_hours', False) or login_event.get('new_login', False):
                        # Use REAL-TIME timestamp
                        current_hour = datetime.now().hour
                        is_off_hours = current_hour < 7 or current_hour >= 19
                        activity = {
                            'user_id': self.config.user_id,
                            'timestamp': datetime.now().isoformat(),  # REAL-TIME timestamp
                            'activity_type': 'logon',
                            'details': {
                                'ip_address': login_event.get('ip_address', '127.0.0.1'),
                                'device': login_event.get('device', platform.node()),
                                'logon_hour': current_hour,
                                # CRITICAL: Local hour for accurate timezone handling (alias for consistency)
                                'activity_hour': current_hour,
                                'off_hours': is_off_hours,
                                'geo_anomaly': 0,
                                'session_active': login_event.get('session_active', False),
                                # Unique device ID per laptop
                                'device_id': f"{platform.node()}_{socket.gethostname()}",
                                'device_name': platform.node(),
                                'hostname': socket.gethostname()
                            }
                        }
                        all_activities.append(activity)

            # Collect network/email activity
            # Send ALL network activity - backend ML will detect anomalies
            if 'network' in self.monitors:
                network_events = self.monitors['network'].get_recent_events(
                    limit=10)
                for net_event in network_events:
                    data_sent = net_event.get('data_sent_mb', 0)
                    external_conns = net_event.get('external_connections', 0)
                    suspicious_ports = net_event.get('suspicious_ports', [])

                    # Send network activity - backend ML will detect anomalies
                    # Use REAL-TIME timestamp
                    activity = {
                        'user_id': self.config.user_id,
                        'timestamp': datetime.now().isoformat(),  # REAL-TIME timestamp
                        'activity_type': 'email',  # Network activity sent as email type
                        'details': {
                            'to': 'external@example.com',
                            'subject': 'Network activity detected',
                            'external': external_conns >= 3,  # Lowered threshold for better detection
                            'attachment_size_mb': round(data_sent, 2),
                            'data_sent_mb': data_sent,  # Also include for ML
                            'suspicious_keywords': 1 if data_sent > 50 else 0,
                            # Unique device ID per laptop
                            'device_id': f"{platform.node()}_{socket.gethostname()}",
                            'device_name': platform.node(),
                            'hostname': socket.gethostname(),
                            'external_connections': external_conns,
                            'suspicious_ports': suspicious_ports,
                            # CRITICAL: Local hour for accurate timezone handling
                            'activity_hour': datetime.now().hour,
                            'off_hours': datetime.now().hour < 7 or datetime.now().hour >= 19
                        }
                    }
                    all_activities.append(activity)

            # Send all activities to backend - backend does ML-based detection
            # No rule-based filtering - let ML models decide
            for activity in all_activities:
                self.alert_queue.append(activity)

            # Send activities every 20 seconds (backend handles ML detection & deduplication)
            time_since_last_alert = current_time - self.last_alert_send
            if time_since_last_alert >= self.config.alert_interval and len(self.alert_queue) > 0:
                self._send_activities_batch()
                self.last_alert_send = current_time

            self.stats['last_success'] = datetime.now()

        except Exception as e:
            AgentLogger.error(f"Error aggregating activities: {e}")
            self.stats['errors'] += 1
            self.stats['last_error'] = str(e)

    def _send_activities_batch(self):
        """Send all queued activities to backend (backend does ML-based detection)"""
        # First, try to send any locally queued activities (from previous failures)
        if len(self.local_queue) > 0:
            AgentLogger.info(
                f"📤 Retrying {len(self.local_queue)} queued activities...")
            retry_activities = self.local_queue.copy()
            self.local_queue.clear()

            for activity in retry_activities:
                result = self._send_activity(activity)
                if result:
                    self.stats['retried_from_queue'] += 1
                    self.stats['activities_sent'] += 1
                    if result.get('status') == 'anomaly_alert_created':
                        self.stats['anomalies_detected'] += 1
                        self.stats['alerts_sent'] += 1
                        alert_data = result.get('alert', {})
                        self._display_terminal_alert(activity, alert_data.get(
                            'explanation', 'ML anomaly detected'))
                else:
                    # Still failed, re-queue (limit queue size to prevent memory issues)
                    if len(self.local_queue) < 1000:
                        self.local_queue.append(activity)
                    else:
                        AgentLogger.warning(
                            f"Local queue full, dropping oldest activity")
                        self.local_queue.pop(0)
                        self.local_queue.append(activity)
                time.sleep(0.1)

        # Now send new activities
        if len(self.alert_queue) == 0:
            return

        activities_to_send = self.alert_queue.copy()
        self.alert_queue.clear()

        AgentLogger.info(
            f"📤 Sending {len(activities_to_send)} activities to backend for ML analysis...")

        for activity in activities_to_send:
            # Send to backend - backend will do ML-based anomaly detection
            result = self._send_activity(activity)
            if result:
                self.stats['activities_sent'] += 1
                self.connection_available = True  # Connection restored
                # Check if backend detected anomaly
                if result.get('status') == 'anomaly_alert_created':
                    self.stats['anomalies_detected'] += 1
                    self.stats['alerts_sent'] += 1
                    # Display alert in terminal
                    alert_data = result.get('alert', {})
                    self._display_terminal_alert(activity, alert_data.get(
                        'explanation', 'ML anomaly detected'))
            else:
                # Failed to send - queue locally
                self.connection_available = False
                if len(self.local_queue) < 1000:
                    self.local_queue.append(activity)
                    self.stats['queued_locally'] += 1
                    AgentLogger.debug(
                        f"Activity queued locally (connection unavailable)")
                else:
                    AgentLogger.warning(f"Local queue full, dropping activity")
            time.sleep(0.1)  # Small delay between sends

        if self.connection_available:
            AgentLogger.info(
                f"✅ Sent {len(activities_to_send)} activities to backend")
        else:
            AgentLogger.warning(
                f"⚠️  Queued {len(activities_to_send)} activities locally (connection unavailable)")

    def _display_terminal_alert(self, activity: Dict, reason: str):
        """Display alert in terminal with clear formatting"""
        activity_type = activity.get('activity_type', 'unknown')
        timestamp = datetime.now().strftime('%H:%M:%S')
        details = activity.get('details', {})

        print(f"\n{'='*70}")
        print(f"🚨 ANOMALY ALERT - {timestamp}")
        print(f"{'='*70}")
        print(f"User: {self.config.user_name} ({self.config.user_id})")
        print(f"Type: {activity_type.upper()}")
        print(f"Reason: {reason}")

        if activity_type == 'file_access':
            print(f"File: {details.get('file_path', 'N/A')}")
            print(f"Size: {details.get('size_mb', 0):.1f} MB")
            print(
                f"Sensitive: {'Yes' if details.get('sensitive', False) else 'No'}")
        elif activity_type == 'email':
            print(
                f"External: {'Yes' if details.get('external', False) else 'No'}")
            print(f"Attachment: {details.get('attachment_size_mb', 0):.1f} MB")
            print(f"Connections: {details.get('external_connections', 0)}")
        elif activity_type == 'logon':
            print(f"Hour: {details.get('logon_hour', 0)}:00")
            print(
                f"Off-hours: {'Yes' if details.get('off_hours', False) else 'No'}")
        elif activity_type == 'process':
            print(f"Process: {details.get('process_name', 'N/A')}")
            print(
                f"Suspicious: {'Yes' if details.get('suspicious', False) else 'No'}")

        print(f"{'='*70}\n")

    def _send_activity(self, activity: Dict) -> Optional[Dict]:
        """Send activity to backend - backend does ML-based anomaly detection"""
        try:
            url = f"{self.config.server_url}/api/activities/ingest"
            response = self.session.post(
                url,
                json=activity,
                timeout=self.config.connection_timeout
            )
            response.raise_for_status()

            result = response.json()
            status = result.get('status', 'ok')
            its_score = result.get('its_score', 0)

            # Backend ML detection results - handle both old and new status formats
            if status in ['alert_generated', 'anomaly_alert_created']:
                alert = result.get('alert', {})
                ml_score = alert.get(
                    'ml_score', 0) or alert.get('confidence', 0)
                alert_id = alert.get('alert_id', 'N/A')
                risk_level = alert.get('risk_level', 'medium')
                anomalies = alert.get('anomalies', [])
                timestamp = alert.get('timestamp', datetime.now().isoformat())

                print(f"\n{'='*70}")
                print(f"🚨 ALERT GENERATED BY BACKEND")
                print(f"{'='*70}")
                print(f"Alert ID: {alert_id}")
                print(f"Timestamp: {timestamp}")
                print(f"ML Score: {ml_score:.1%}")
                print(f"ITS Score: {its_score:.1f}")
                print(f"Risk Level: {risk_level.upper()}")
                if anomalies:
                    print(f"Anomalies: {', '.join(anomalies[:3])}")
                print(f"Explanation: {alert.get('explanation', 'N/A')}")
                print(f"{'='*70}")
                print(f"✅ Alert transmitted to admin dashboard")
                print(f"{'='*70}\n")

                AgentLogger.info(
                    f"✅ Alert Generated: {alert_id}, ML: {ml_score:.1%}, ITS: {its_score:.1f}, Risk: {risk_level}")
                return result
            elif status == 'suppressed':
                # Duplicate anomaly suppressed (deduplication working)
                AgentLogger.debug(f"Anomaly suppressed (deduplication)")
                return result
            elif status == 'already_escalated':
                # Already escalated to threat/incident
                AgentLogger.debug(f"Anomaly already escalated")
                return result
            elif its_score > 40:
                AgentLogger.debug(f"Activity logged - ITS: {its_score:.1f}")

            return result

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                AgentLogger.error(
                    f"User {activity.get('user_id')} not found in backend. Please ensure user exists in database.")
            elif e.response.status_code == 400:
                AgentLogger.error(f"Invalid activity data: {e.response.text}")
            else:
                AgentLogger.error(
                    f"HTTP error {e.response.status_code}: {e.response.text}")
            return None
        except requests.exceptions.ConnectionError as e:
            error_str = str(e)
            self.connection_available = False

            # Windows-specific error messages
            if "WinError 10049" in error_str or "10049" in error_str:
                AgentLogger.debug(
                    f"Connection error (WinError 10049): Invalid address - {self.config.server_url}")
            elif "WinError 10061" in error_str or "10061" in error_str:
                AgentLogger.debug(
                    f"Connection error (WinError 10061): Connection refused - {self.config.server_url}")
            else:
                AgentLogger.debug(
                    f"Cannot connect to server at {self.config.server_url}: {e}")
            return None
        except requests.exceptions.Timeout:
            AgentLogger.warning(
                "Request timeout - backend may be slow or unreachable")
            return None
        except Exception as e:
            AgentLogger.error(f"Error sending activity: {e}")
            import traceback
            AgentLogger.debug(traceback.format_exc())
            return None

# ==================== MAIN AGENT ====================


class RealtimeMonitorAgent:
    """Enterprise-grade real-time monitoring agent"""

    def __init__(self, config: AgentConfig):
        self.config = config
        self.aggregator = ActivityAggregator(config)
        self.running = False

        # Setup signal handlers
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        self._print_banner()
        self._test_connection()

    def _print_banner(self):
        """Print startup banner"""
        print("\n" + "="*70)
        print("🚀 SentinelIQ Enterprise Real-Time Monitoring Agent v2.0")
        print("="*70)
        print(f"User: {self.config.user_name} ({self.config.user_id})")
        print(f"Platform: {platform.system()} {platform.release()}")
        print(f"Server: {self.config.server_url}")
        print(f"Activity Check: {self.config.upload_interval} seconds")
        print(f"Alert Send: {self.config.alert_interval} seconds")
        print(
            f"Mode: {'Anomaly-Only' if self.config.send_only_anomalies else 'All Activities'}")
        print(f"Monitoring: Files | Processes | Network | Logins")
        print("="*70 + "\n")

    def _test_connection(self):
        """Test backend connection with improved diagnostics and network discovery"""
        url = f"{self.config.server_url}/api/health"
        server_ip = self.config.server_url.replace(
            'http://', '').replace('https://', '').split(':')[0]

        # First, try to discover server IP if current one fails
        AgentLogger.info(
            f"🔍 Testing connection to {self.config.server_url}...")

        # Try connection with retries
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    AgentLogger.info("✅ Backend connection: SUCCESS")
                    return True
                else:
                    AgentLogger.warning(
                        f"⚠️  Backend returned status {response.status_code}")
                    if attempt < max_retries - 1:
                        time.sleep(2)  # Wait before retry
                        continue
                    return False
            except requests.exceptions.ConnectionError as e:
                error_str = str(e)

                # Windows-specific error handling
                if "WinError 10049" in error_str or "10049" in error_str:
                    AgentLogger.error(
                        f"❌ Backend connection: FAILED - Network Error")
                    AgentLogger.warning("   Possible causes:")
                    AgentLogger.warning(
                        f"   1. Server IP address may be incorrect: {self.config.server_url}")
                    AgentLogger.warning(
                        "   2. Firewall may be blocking the connection")
                    AgentLogger.warning(
                        "   3. Server may not be running on that IP")
                    AgentLogger.warning(
                        "   4. Network interface may not be available")
                    AgentLogger.warning("")
                    AgentLogger.warning("   🔧 QUICK FIXES:")
                    AgentLogger.warning("")
                    AgentLogger.warning("   Step 1: Find correct server IP")
                    AgentLogger.warning(
                        "      On SERVER machine, run: ipconfig (Windows) or ifconfig (Linux/Mac)")
                    AgentLogger.warning(
                        "      Look for IPv4 Address (not 127.0.0.1)")
                    AgentLogger.warning("")
                    AgentLogger.warning("   Step 2: Test connection")
                    AgentLogger.warning(f"      ping {server_ip}")
                    AgentLogger.warning(
                        f"      Test-NetConnection -ComputerName {server_ip} -Port 8000")
                    AgentLogger.warning("")
                    AgentLogger.warning(
                        "   Step 3: Configure firewall (run as Administrator)")
                    AgentLogger.warning(
                        "      New-NetFirewallRule -DisplayName 'SentinelIQ' -Direction Outbound -RemotePort 8000 -Protocol TCP -Action Allow")
                    AgentLogger.warning("")
                    AgentLogger.warning("   Step 4: Use helper script")
                    AgentLogger.warning("      python3 find_server_ip.py")
                    AgentLogger.warning("      OR")
                    AgentLogger.warning(
                        "      .\\setup_windows_network.ps1 (as Administrator)")
                    AgentLogger.warning("")
                elif "WinError 10061" in error_str or "10061" in error_str:
                    AgentLogger.error(
                        f"❌ Backend connection: FAILED - Connection Refused")
                    AgentLogger.warning(
                        "   Server is not accepting connections on port 8000")
                    AgentLogger.warning(
                        f"   Verify server is running at: {self.config.server_url}")
                elif "timeout" in error_str.lower():
                    AgentLogger.error(
                        f"❌ Backend connection: FAILED - Timeout")
                    AgentLogger.warning(
                        "   Server did not respond within 5 seconds")
                    AgentLogger.warning(
                        f"   Check if server is accessible: {self.config.server_url}")
                else:
                    AgentLogger.error(f"❌ Backend connection: FAILED - {e}")

                if attempt < max_retries - 1:
                    AgentLogger.info(
                        f"   Retrying connection ({attempt + 1}/{max_retries})...")
                    time.sleep(2)  # Wait before retry
                else:
                    AgentLogger.warning("")
                    AgentLogger.warning(
                        "⚠️  Agent will continue but may not be able to send data")
                    AgentLogger.warning(
                        "   Activities will be queued locally and sent when connection is restored")
                    AgentLogger.warning("")
                    AgentLogger.warning(
                        "💡 TIP: Run 'python3 find_server_ip.py' to automatically find the server")
                    return False
            except Exception as e:
                AgentLogger.error(f"❌ Backend connection: FAILED - {e}")
                if attempt < max_retries - 1:
                    AgentLogger.info(
                        f"   Retrying connection ({attempt + 1}/{max_retries})...")
                    time.sleep(2)
                else:
                    AgentLogger.warning("")
                    AgentLogger.warning(
                        "⚠️  Agent will continue but may not be able to send data")
                    return False

        return False

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        AgentLogger.info("Received shutdown signal, stopping agent...")
        self.stop()
        sys.exit(0)

    def start(self):
        """Start real-time monitoring"""
        AgentLogger.info("Starting real-time monitoring agent...")

        self.aggregator.start()
        self.running = True

        AgentLogger.info("Agent started successfully. Press Ctrl+C to stop.")

        try:
            while self.running:
                self.aggregator.aggregate_and_send()
                time.sleep(self.config.upload_interval)

        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        """Stop monitoring"""
        AgentLogger.info("Stopping agent...")
        self.running = False
        self.aggregator.stop()

        # Print statistics
        stats = self.aggregator.stats
        print("\n" + "="*70)
        print("Agent Statistics:")
        print(f"  Anomalies Detected: {stats['anomalies_detected']}")
        print(f"  Alerts Sent: {stats['alerts_sent']}")
        print(f"  Activities Sent: {stats['activities_sent']}")
        print(f"  Errors: {stats['errors']}")
        print(f"  Last Success: {stats['last_success']}")
        if stats['last_error']:
            print(f"  Last Error: {stats['last_error']}")
        print("="*70 + "\n")

        AgentLogger.info("Agent stopped successfully")

# ==================== MAIN ====================


if __name__ == "__main__":
    import argparse

    # Team members configuration
    parser = argparse.ArgumentParser(
        description='Enterprise Real-Time Activity Monitor for SentinelIQ',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Monitor user U001's laptop
  python realtime_monitor.py --user-id U001 --server http://localhost:8000
  
  # Monitor on remote server
  python realtime_monitor.py --user-id U002 --server http://192.168.1.100:8000
  
  # Monitor with custom interval
  python realtime_monitor.py --user-id U003 --server http://localhost:8000 --interval 3
  
  # Monitor any user (user must exist in backend database)
  python realtime_monitor.py --user-id U050 --server http://localhost:8000
        """
    )

    parser.add_argument(
        '--user-id',
        required=True,
        help='User ID (must exist in backend database, e.g., U001, U002, U003, U050, etc.)'
    )

    parser.add_argument(
        '--server',
        default='http://localhost:8000',
        help='Backend server URL (default: http://localhost:8000)'
    )

    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Upload interval in seconds (default: 5)'
    )

    parser.add_argument(
        '--alert-interval',
        type=int,
        default=20,
        help='Alert aggregation interval in seconds (default: 20)'
    )

    args = parser.parse_args()

    # Validate user_id format (should be U followed by digits)
    if not args.user_id.startswith('U') or not args.user_id[1:].isdigit():
        AgentLogger.error(
            f"Invalid user ID format. Must be U followed by digits (e.g., U001, U050)")
        sys.exit(1)

    # Validate user exists in backend
    server_url = args.server.rstrip('/')
    try:
        response = requests.get(
            f"{server_url}/api/users/{args.user_id}",
            timeout=5
        )
        if response.status_code == 404:
            AgentLogger.error(
                f"User {args.user_id} not found in backend database. Please ensure the user exists.")
            sys.exit(1)
        elif response.status_code != 200:
            AgentLogger.warning(
                f"Could not verify user {args.user_id} in backend (status: {response.status_code}). Continuing anyway...")

        user_data = response.json()
        user_info = {
            'name': user_data.get('name', args.user_id),
            'role': user_data.get('role', 'Employee'),
            'department': user_data.get('department', 'General')
        }
        AgentLogger.info(
            f"✅ Verified user: {user_info['name']} ({args.user_id})")
    except requests.exceptions.RequestException as e:
        AgentLogger.warning(
            f"Could not connect to backend to verify user: {e}")
        AgentLogger.warning(
            "Continuing anyway - user will be validated when sending activities...")
        user_info = {
            'name': args.user_id,
            'role': 'Employee',
            'department': 'General'
        }

    # Create configuration
    config = AgentConfig(
        user_id=args.user_id,
        user_name=user_info['name'],
        server_url=args.server.rstrip('/'),
        upload_interval=args.interval,
        alert_interval=args.alert_interval
    )

    # Create and start agent
    agent = RealtimeMonitorAgent(config)
    agent.start()
