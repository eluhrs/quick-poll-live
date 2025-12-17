#!/usr/bin/env python3
import sys
import os

# Add the 'backend' directory to sys.path so we can import 'app'
# Assuming script is in project root and backend is in ./backend
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Set default DATABASE_URL to point to ./data/poll.db if not set
# This ensures running from root uses the persistent volume data
if "DATABASE_URL" not in os.environ:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'poll.db')
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from app.database import SessionLocal, engine
from app import models, auth
from app.models import Base

def create_admin(username, password):
    print(f"Connecting to database at: {os.environ['DATABASE_URL']}")
    db = SessionLocal()
    try:
        # data check
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists.")
            return

        hashed_password = auth.get_password_hash(password)
        user = models.User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        print(f"Admin user '{username}' created successfully.")
    except Exception as e:
        print(f"Error creating user: {e}")
        print("Note: If you are running this locally, ensure you have dependencies installed:\n pip install sqlalchemy passlib bcrypt")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.path) > 1:
        # Ensure tables exist
        Base.metadata.create_all(bind=engine)
    
    if len(sys.argv) != 3:
        print("Usage: ./create_admin.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    create_admin(username, password)
