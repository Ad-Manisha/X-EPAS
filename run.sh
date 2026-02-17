#!/bin/bash

# Prevent Python from creating __pycache__ directories
export PYTHONDONTWRITEBYTECODE=1

# Change to backend directory and run the FastAPI app with uvicorn
cd "$(dirname "$0")/backend"
source .venv/bin/activate 2>/dev/null || true
uvicorn main:app --reload --host 127.0.0.1 --port 8000
