#!/bin/bash

# Wrapper script to manage admin users (embedded python)
# Usage: ./bin/manage_users.sh [list | <username> <password> | delete <username>]

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 [list | delete <username> | <username> <password>]"
    echo ""
    echo "Examples:"
    echo "  $0 list                (List all users)"
    echo "  $0 admin newpassword   (Update 'admin' password or create new user)"
    echo "  $0 delete olduser      (Delete 'olduser' and allow any other user to edit their polls)"
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

def delete_user(db, username):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        print(f"Error: User '{username}' not found.")
        sys.exit(1)
        return

    # Reassign polls to 'admin' (or system owner) to prevent deletion or constraint errors
    # Try to find 'admin' user
    fallback_user = db.query(models.User).filter(models.User.username == "admin").first()
    
    # If 'admin' doesn't exist (edge case), try ID 1, or just any user that isn't the one being deleted
    if not fallback_user:
        fallback_user = db.query(models.User).filter(models.User.id != user.id).first()
    
    if not fallback_user:
        print("Error: Could not find a fallback user (e.g. 'admin') to reassign polls to.")
        print("Cannot delete the only user if they own polls.")
        sys.exit(1)

    if fallback_user.id == user.id:
         # This should only happen if there is ONE user and we are trying to delete them
         # Check if they have polls
         has_polls = db.query(models.Poll).filter(models.Poll.owner_id == user.id).first()
         if has_polls:
             print("Error: This is the only user and they own polls. Cannot delete.")
             sys.exit(1)

    # Reassign polls
    user_polls = db.query(models.Poll).filter(models.Poll.owner_id == user.id).all()
    count = 0
    for poll in user_polls:
        poll.owner_id = fallback_user.id
        count += 1
    
    if count > 0:
        db.commit()
        print(f"Reassigned {count} polls from '{username}' to '{fallback_user.username}'.")
    
    try:
        db.delete(user)
        db.commit()
        print(f"User '{username}' successfully deleted.")
    except Exception as e:
        print(f"Error deleting user: {e}")
        db.rollback()
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Manage Users")
    parser.add_argument("action_or_user", nargs="?", help="Command 'list', 'delete', or Username")
    parser.add_argument("arg2", nargs="?", help="Password (if creating/updating) or Username (if deleting)")
    
    args = parser.parse_args()
    
    if not args.action_or_user:
        parser.print_help()
        print("\nExamples:")
        print("  python manage_users.py list")
        print("  python manage_users.py <username> <password>")
        print("  python manage_users.py delete <username>")
        sys.exit(1)

    db = SessionLocal()
    try:
        if args.action_or_user == "list":
            list_users(db)
        elif args.action_or_user == "delete":
            if not args.arg2:
                print("Error: Username definition is required for delete command.")
                sys.exit(1)
            delete_user(db, args.arg2)
        else:
            # Assume action_or_user is username, arg2 is password
            if not args.arg2:
                print("Error: Password required when creating/updating a user.")
                sys.exit(1)
            upsert_user(db, args.action_or_user, args.arg2)

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
EOF
