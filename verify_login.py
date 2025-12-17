import sys
import os

# Add the 'backend' directory to sys.path so we can import 'app'
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Set default DATABASE_URL to point to ./data/poll.db if not set
if "DATABASE_URL" not in os.environ:
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'poll.db')
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

from app.database import SessionLocal
from app import models, auth

def verify_user(username, password):
    print(f"Checking user: {username}")
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print("User not found.")
            return

        print(f"Found user. Hash: {user.hashed_password}")
        is_valid = auth.verify_password(password, user.hashed_password)
        print(f"Password '{password}' valid? {is_valid}")
        
    except Exception as e:
        print(f"Error checking user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python verify_login.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    verify_user(username, password)
