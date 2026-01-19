#!/bin/bash

# Wrapper script to manage admin users (embedded python)
# Usage: ./bin/manage_users.sh [list | <username> <password>]

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 [list | <username> <password>]"
    echo ""
    echo "Examples:"
    echo "  $0 list                (List all users)"
    echo "  $0 admin newpassword   (Update 'admin' password or create new user)"
    exit 1
fi

# Ensure container is running
if ! docker ps | grep -q poll_backend; then
    echo "Error: Backend container 'poll_backend' is not running."
    echo "Please run 'docker compose up -d' first."
    exit 1
fi

# Run the python script inside the container via stdin
docker exec -i -e PYTHONPATH=/app poll_backend python - "$@" << 'EOF'
import argparse
import sys
from app.database import SessionLocal
from app import models
from app.auth import get_password_hash

def list_users(db):
    users = db.query(models.User).all()
    print("Registered Users:")
    for user in users:
        print(f" - {user.username} (ID: {user.id})")

def upsert_user(db, username, password):
    hashed_password = get_password_hash(password)
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if user:
        print(f"Updating password for existing user: {username}")
        user.hashed_password = hashed_password
    else:
        print(f"Creating new user: {username}")
        user = models.User(username=username, hashed_password=hashed_password)
        db.add(user)
    
    db.commit()
    db.refresh(user)
    print(f"User '{user.username}' (ID: {user.id}) successfully updated.")

def main():
    parser = argparse.ArgumentParser(description="Manage Users")
    parser.add_argument("action_or_user", nargs="?", help="Command 'list' or Username")
    parser.add_argument("password", nargs="?", help="Password (if creating/updating user)")
    
    args = parser.parse_args()
    
    if not args.action_or_user:
        parser.print_help()
        print("\nExamples:")
        print("  python manage_users.py list")
        print("  python manage_users.py <username> <password>")
        sys.exit(1)

    db = SessionLocal()
    try:
        if args.action_or_user == "list":
            list_users(db)
        elif args.password:
            upsert_user(db, args.action_or_user, args.password)
        else:
            print("Error: Password required when creating/updating a user.")
            parser.print_help()
            sys.exit(1)

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
EOF
