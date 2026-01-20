#!/usr/bin/env python3
import sys
import os
import argparse
from datetime import datetime, timedelta

# Add parent directory to path to import app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app import models, database
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

def purge_votes(start_time_str, end_time_str, poll_slug, dry_run=True):
    """
    Deletes votes for a specific poll within a time range.
    Time Format: 'YYYY-MM-DD HH:MM:SS' (UTC recommended, or server local time)
    """
    DATABASE_URL = "sqlite:///../data/poll.db" # Adjust if running from outside bin/
    if os.path.exists("../data/poll.db"):
         # Running from bin/
        db_path = "sqlite:///../data/poll.db"
    elif os.path.exists("data/poll.db"):
        # Running from root
        db_path = "sqlite:///data/poll.db"
    else:
        print("Error: Could not find database file.")
        return

    engine = create_engine(db_path)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Parse Times
        start_time = datetime.strptime(start_time_str, '%Y-%m-%d %H:%M:%S')
        end_time = datetime.strptime(end_time_str, '%Y-%m-%d %H:%M:%S')

        # Find Poll
        poll = db.query(models.Poll).filter(models.Poll.slug == poll_slug).first()
        if not poll:
            print(f"Error: Poll with slug '{poll_slug}' not found.")
            return

        print(f"[-] Targeting Poll: {poll.title} ({poll.slug})")
        print(f"[-] Time Window: {start_time} to {end_time}")

        # Query Votes
        query = db.query(models.Vote).join(models.Question).filter(
            models.Question.poll_id == poll.id,
            models.Vote.created_at >= start_time,
            models.Vote.created_at <= end_time
        )
        
        count = query.count()
        print(f"[-] Votes found in window: {count}")

        if count == 0:
            print("No votes to delete.")
            return

        if dry_run:
            print("[DRY RUN] No changes made. Run without --dry-run to execute.")
        else:
            confirm = input(f"Are you sure you want to DELETE {count} votes? (yes/no): ")
            if confirm.lower() == 'yes':
                query.delete(synchronize_session=False)
                db.commit()
                print(f"[SUCCESS] Deleted {count} votes.")
            else:
                print("[CANCELLED] Operation aborted.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Purge votes within a specific time window.")
    parser.add_argument("poll_slug", help="The slug/code of the poll (e.g. 52bde0)")
    parser.add_argument("start_time", help="Start time 'YYYY-MM-DD HH:MM:SS'")
    parser.add_argument("end_time", help="End time 'YYYY-MM-DD HH:MM:SS'")
    parser.add_argument("--force", action="store_false", dest="dry_run", help="Execute the deletion (default is dry-run)")
    
    args = parser.parse_args()
    
    print("WARNING: Ideally run this inside the backend container to ensure environment match.")
    print("Example: docker exec -it poll_backend python3 bin/purge_votes.py ...")
    
    purge_votes(args.start_time, args.end_time, args.poll_slug, args.dry_run)
