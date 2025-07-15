#!/bin/bash

# FlowCue Setup Script
# This script installs dependencies for both frontend and backend

echo "🚀 Setting up FlowCue..."

# Root dependencies
echo "📦 Installing root dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Root dependencies installed successfully"
else
    echo "❌ Failed to install root dependencies"
    exit 1
fi

# Front-end
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --legacy-peer-deps

if [ $? -eq 0 ]; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Back-end
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

if [ $? -eq 0 ]; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Return to root directory
cd ..

# Create demo songs
echo "� Setting up demo songs..."
echo "Demo songs will be automatically initialized when you start the server for the first time."

echo "�🎉 Setup complete! FlowCue is ready to go."
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start both frontend and backend"
echo "2. Open http://localhost:5173/ in your browser"
echo "3. Demo songs will be automatically added to your library"
echo ""
echo "Available interfaces:"
echo "- Controller: http://localhost:5173/controller"
echo "- Performer: http://localhost:5173/performer" 
echo "- Audience: http://localhost:5173/audience"
