"""
Startup script for Render deployment
Handles database initialization and population before starting the server
"""
import os
import sys
import time
import subprocess
from database import init_db, SessionLocal, User
from populate_database import populate_users, populate_activities

def wait_for_db(max_retries=30, delay=2):
    """Wait for database to be ready"""
    import psycopg2
    from urllib.parse import urlparse
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("=" * 60)
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("=" * 60)
        print("Please set the DATABASE_URL environment variable in Render dashboard:")
        print("1. Go to your backend service settings")
        print("2. Navigate to 'Environment' tab")
        print("3. Add DATABASE_URL with your PostgreSQL internal database URL")
        print("   (Should look like: postgresql://user:pass@host:port/dbname)")
        sys.exit(1)
    
    # Validate that DATABASE_URL looks like a database URL
    if not database_url.startswith(('postgresql://', 'postgres://')):
        print("=" * 60)
        print("❌ ERROR: Invalid DATABASE_URL format")
        print("=" * 60)
        print(f"Current DATABASE_URL value: {database_url[:20]}...")
        print("DATABASE_URL should start with 'postgresql://' or 'postgres://'")
        print("Please set the correct Internal Database URL from your Render database service.")
        sys.exit(1)
    
    # Parse database URL
    parsed = urlparse(database_url)
    
    print("Waiting for database to be ready...")
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path[1:] if parsed.path else 'insider_threat_db'
            )
            conn.close()
            print("✅ Database is ready!")
            return True
        except Exception as e:
            if i < max_retries - 1:
                print(f"⏳ Database not ready yet (attempt {i+1}/{max_retries}): {e}")
                time.sleep(delay)
            else:
                print(f"❌ Failed to connect to database after {max_retries} attempts")
                print(f"Error: {e}")
                return False
    
    return False

def initialize_database():
    """Initialize database tables and populate with demo data"""
    print("Initializing database...")
    
    # Initialize tables
    init_db()
    print("✅ Database tables created")
    
    # Check if users already exist
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Populating database with demo data...")
            populate_users()
            populate_activities()
            print("✅ Demo data populated successfully")
        else:
            print(f"✅ Database already has {user_count} users, skipping population")
    except Exception as e:
        print(f"⚠️  Warning: Error during database population: {e}")
        print("Continuing with server startup...")
    finally:
        db.close()

def main():
    """Main startup function"""
    print("=" * 60)
    print("🚀 Starting Insider Threat Detection Backend")
    print("=" * 60)
    
    # Wait for database
    if not wait_for_db():
        print("❌ Failed to connect to database. Exiting.")
        sys.exit(1)
    
    # Initialize database
    try:
        initialize_database()
    except Exception as e:
        print(f"⚠️  Warning: Database initialization failed: {e}")
        print("Continuing with server startup anyway...")
    
    # Start the FastAPI server
    print("=" * 60)
    print("🌟 Starting FastAPI server...")
    print("=" * 60)
    
    port = os.getenv('PORT', '8000')
    host = os.getenv('HOST', '0.0.0.0')
    
    # Start uvicorn
    os.execvp("uvicorn", [
        "uvicorn",
        "main:app",
        "--host", host,
        "--port", port,
        "--workers", "1"  # Single worker for free tier
    ])

if __name__ == "__main__":
    main()

