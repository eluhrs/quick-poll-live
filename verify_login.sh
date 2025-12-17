#!/bin/bash
docker exec -e PYTHONPATH=/app poll_backend python /tmp/verify_login.py "$1" "$2"
