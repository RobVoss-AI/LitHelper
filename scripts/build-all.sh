#!/bin/bash
# LitHelper production build script
# Builds backend (PyInstaller), frontend (Vite), and Electron app
# Usage: ./scripts/build-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo " LitHelper Production Build"
echo "========================================="

# Step 1: Build backend with PyInstaller
echo ""
echo "[1/3] Building backend with PyInstaller..."
cd "$PROJECT_DIR/backend"
source .venv/bin/activate 2>/dev/null || true
pip install pyinstaller 2>/dev/null
pyinstaller --onefile --name lithelper-backend \
  --hidden-import app.models.paper \
  --hidden-import app.models.collection \
  --hidden-import app.models.trail \
  --hidden-import app.models.author \
  --hidden-import app.models.monitor \
  --hidden-import app.models.zotero \
  --hidden-import aiosqlite \
  --hidden-import uvicorn.logging \
  --hidden-import uvicorn.protocols.http \
  --hidden-import uvicorn.protocols.http.auto \
  --hidden-import uvicorn.protocols.websockets \
  --hidden-import uvicorn.lifespan \
  --hidden-import uvicorn.lifespan.on \
  app/main.py
echo "Backend binary created at backend/dist/lithelper-backend"

# Step 2: Build frontend with Vite
echo ""
echo "[2/3] Building frontend with Vite..."
cd "$PROJECT_DIR/frontend"
npm run build
echo "Frontend built at frontend/dist/"

# Step 3: Build Electron app
echo ""
echo "[3/3] Building Electron app..."
cd "$PROJECT_DIR/electron"
npm install
npm run build
echo "Electron app built at dist-electron/"

echo ""
echo "========================================="
echo " Build complete!"
echo "========================================="
echo "Output: $PROJECT_DIR/dist-electron/"
