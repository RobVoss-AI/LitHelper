#!/bin/bash
# LitHelper dev mode - starts backend and frontend concurrently
# Usage: ./scripts/dev.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting LitHelper in development mode..."

# Start backend
echo "Starting FastAPI backend on port 8711..."
(cd "$PROJECT_DIR/backend" && source .venv/bin/activate && python -m uvicorn app.main:app --host 127.0.0.1 --port 8711 --reload) &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s http://127.0.0.1:8711/api/health > /dev/null 2>&1; then
    echo "Backend ready!"
    break
  fi
  sleep 1
done

# Start frontend
echo "Starting Vite dev server on port 5173..."
(cd "$PROJECT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "LitHelper is running:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8711"
echo "  API docs: http://localhost:8711/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
