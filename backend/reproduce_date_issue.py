from app.database import SessionLocal
from app import models
from datetime import datetime
import sys

def test_date_update():
    db = SessionLocal()
    try:
        # 1. Get a poll
        poll = db.query(models.Poll).first()
        if not poll:
            print("No polls found")
            return

        print(f"Original Close Date: {poll.closes_at}")

        # 2. Simulate correct update
        new_date = datetime(2025, 12, 25, 12, 0, 0)
        poll.closes_at = new_date
        db.commit()
        db.refresh(poll)
        
        print(f"Updated Close Date (Direct DB): {poll.closes_at}")

        if poll.closes_at != new_date:
            print("FAIL: Database did not persist date.")
        else:
            print("SUCCESS: Database persisted date.")

    finally:
        db.close()

if __name__ == "__main__":
    test_date_update()
