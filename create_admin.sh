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

echo "Running admin creation inside Docker container..."

# We need to copy the script because it's in root, not mounted in /app
docker cp create_admin.py poll_backend:/tmp/create_admin.py

# Run the script inside the container
docker exec -e PYTHONPATH=/app poll_backend python /tmp/create_admin.py "$1" "$2"

# Cleanup
docker exec poll_backend rm /tmp/create_admin.py
