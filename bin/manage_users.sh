#!/bin/bash

# Wrapper script to manage admin users
# Usage: ./bin/admin_user.sh [list | <username> <password>]

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

# Run the python script inside the container
docker exec -e PYTHONPATH=/app poll_backend python /app/bin/manage_users.py "$@"
