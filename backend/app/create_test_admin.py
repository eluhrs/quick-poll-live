from app.database import SessionLocal
from app import models, auth
import os

def create_admin(username, password):
    print(f"Creating admin user: {username}")
    db = SessionLocal()
    try:
        existing_user = db.query(models.User).filter(models.User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists.")
            # Optional: update password?
            # existing_user.hashed_password = auth.get_password_hash(password)
            # db.commit()
            # print("Password updated.")
            return

        hashed_password = auth.get_password_hash(password)
        user = models.User(username=username, hashed_password=hashed_password)
        db.add(user)
        db.commit()
        print(f"Admin user '{username}' created successfully.")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin("testadmin", "testpass")
