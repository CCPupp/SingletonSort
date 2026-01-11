#!/bin/bash

set -e

echo "================================"
echo "Singleton Sort - Build Script"
echo "================================"
echo ""

# Build Angular app
echo "Step 1: Building Angular application..."
cd SingletonSort
npm run build
cd ..
echo "✓ Angular build complete"
echo ""

# Download Go dependencies
echo "Step 2: Downloading Go dependencies..."
go mod download
echo "✓ Go dependencies downloaded"
echo ""

# Build Go executable
echo "Step 3: Building Go executable..."
go build -ldflags="-s -w" -o singleton-sort
echo "✓ Go executable built"
echo ""

echo "================================"
echo "Build complete!"
echo "================================"
echo ""
echo "To run the application:"
echo "  ./singleton-sort"
echo ""
echo "The app will start on http://localhost:8989"
echo "and automatically open in your browser."
echo ""
