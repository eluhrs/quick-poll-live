from sqlalchemy import create_engine, text
import os

# Use environment variable or default to relative path for container
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./poll.db")
# For sqlite, we might need the raw path for os.path.exists check, but sqlalchemy handles URL
# We'll rely on sqlalchemy to connect. If file doesn't exist, it might create empty or fail depending on mode.
# But for migration of *existing* DB, we assume it's there.

def upgrade():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(polls)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'slide_duration' not in columns:
                print("Adding slide_duration column...")
                conn.execute(text("ALTER TABLE polls ADD COLUMN slide_duration INTEGER DEFAULT 3"))
                print("Column added successfully.")
            else:
                print("Column slide_duration already exists.")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    upgrade()
