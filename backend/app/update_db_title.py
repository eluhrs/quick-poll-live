from sqlalchemy import create_engine, text
import os

# Use environment variable or default to relative path for container
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./poll.db")

def upgrade():
    print(f"Connecting to {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        try:
            # Check if column exists
            result = conn.execute(text("PRAGMA table_info(polls)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'enable_title_page' not in columns:
                print("Adding enable_title_page column...")
                conn.execute(text("ALTER TABLE polls ADD COLUMN enable_title_page BOOLEAN DEFAULT 0"))
                conn.commit()
                print("Column added successfully.")
            else:
                print("Column enable_title_page already exists.")
                
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    upgrade()
