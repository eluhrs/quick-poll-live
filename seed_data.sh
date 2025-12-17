#!/bin/bash
echo "Seeding data via Docker..."
docker compose exec backend python seed_data.py
