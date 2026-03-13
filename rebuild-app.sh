#!/usr/bin/env bash
# Rebuild and restart only the app container with minimal downtime.
# The build happens while the old container is still serving traffic.
git pull
docker compose build app
docker compose up -d --no-deps app
