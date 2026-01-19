#!/bin/bash

# Wrapper script to run the bulk editor inside the docker container
# Usage: ./bulk_edit.sh [export|import] [args...]

if [ $# -eq 0 ]; then
    echo "Usage: ./bulk_edit.sh [export|import] [arguments...]"
    echo ""
    echo "Examples:"
    echo "  ./bulk_edit.sh export <poll_slug> <filename.json>"
    echo "  ./bulk_edit.sh import <filename.json>"
    exit 1
fi

# Run the python script inside the 'backend' container
docker compose exec backend python bulk_editor.py "$@"
