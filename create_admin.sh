#!/bin/bash

# Check arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: ./create_admin.sh <username> <password>"
    exit 1
fi

# Ensure container is running
if ! docker ps | grep -q poll_backend; then
    echo "Error: Backend container 'poll_backend' is not running."
    echo "Please run 'docker compose up -d' first."
    exit 1
fi

echo "Creating temporary script..."

# Create the python script on the fly
cat << 'EOF' > _temp_create_admin.py
import sys
import os

# Add the 'backend' directory to sys.path so we can import 'app'
sys.path.append('/app') 

from app.database import SessionLocal
from app import models, auth

def create_admin(username, password):
    db = SessionLocal()
    try:
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
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python script.py <username> <password>")
        sys.exit(1)
    
    create_admin(sys.argv[1], sys.argv[2])
EOF

echo "Running admin creation inside Docker container..."

# Copy to container
docker cp _temp_create_admin.py poll_backend:/tmp/create_admin.py

# Run
docker exec -e PYTHONPATH=/app poll_backend python /tmp/create_admin.py "$1" "$2"

# Cleanup
rm _temp_create_admin.py
docker exec poll_backend rm /tmp/create_admin.py
