from app.database import SessionLocal
from app import models
from app.auth import get_password_hash
from sqlalchemy.exc import IntegrityError

def create_admin():
    db = SessionLocal()
    try:
        username = "admin"
        password = "password"
        
        # Check if exists
        user = db.query(models.User).filter(models.User.username == username).first()
        if user:
            print(f"User {username} already exists.")
            return

        hashed_password = get_password_hash(password)
        db_user = models.User(username=username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        print(f"Created user: {username} / {password}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exist (they should be auto-created by app startup, but safe to call)
    # models.Base.metadata.create_all(bind=engine) -> handled by main.py usually
    create_admin()
