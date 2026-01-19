#!/bin/bash

# Wrapper script to seed data
# Usage: ./bin/seed_data.sh [init [vote_count] | <poll_slug> <vote_count>]

# Function to show usage
show_usage() {
    echo "Usage: $0 <poll_slug> <vote_count>"
    echo "   or: $0 init [vote_count]  (default: 100)"
    echo ""
    echo "Examples:"
    echo "  $0 52bde0 50     (Add 50 votes to poll 52bde0)"
    echo "  $0 init          (Create new poll with 100 votes)"
    echo "  $0 init 500      (Create new poll with 500 votes)"
    exit 1
}

# Check arguments
if [ "$#" -eq 0 ]; then
    show_usage
fi

if [ "$1" == "init" ]; then
    # Default count to 100 if not provided
    COUNT=${2:-"100"}
    echo "Initializing new poll with sample data ($COUNT votes)..."
    docker compose exec -e PYTHONPATH=/app backend python /app/bin/seed_data.py --count "$COUNT"
else
    if [ "$#" -lt 2 ]; then
        echo "Error: targeted seeding requires both slug and vote count."
        show_usage
    fi
    
    SLUG=$1
    COUNT=$2
    
    echo "Seeding $COUNT votes to poll $SLUG..."
    docker compose exec -e PYTHONPATH=/app backend python /app/bin/seed_data.py --slug "$SLUG" --count "$COUNT"
fi
