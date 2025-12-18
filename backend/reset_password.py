from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
import sys

def reset_password(username, new_password):
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            print(f"User {username} not found!")
            return

        user.hashed_password = get_password_hash(new_password)
        db.commit()
        print(f"Password for {username} updated successfully.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 reset_password.py <username> <new_password>")
        exit(1)
    
    reset_password(sys.argv[1], sys.argv[2])
