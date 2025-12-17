import sqlite3
import os

# Define path to database
DB_PATH = "/Users/eluhrs/antigravity/mypoll/data/poll.db"

def update_database():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. Skipping update (it will be created fresh).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(polls)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "color_palette" not in columns:
            print("Adding 'color_palette' column to 'polls' table...")
            cursor.execute("ALTER TABLE polls ADD COLUMN color_palette VARCHAR DEFAULT 'lehigh_soft'")
            conn.commit()
            print("Column added successfully.")
        else:
            print("'color_palette' column already exists.")
            
    except Exception as e:
        print(f"Error updating database: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_database()
