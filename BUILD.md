# Singleton Sort - Build Instructions

This document explains how to build Singleton Sort into a single executable file.

## Prerequisites

1. **Node.js and npm** - For building the Angular app
2. **Go 1.21+** - For building the Go server
   - Download from: https://go.dev/download/

## Build Steps

### 1. Build the Angular Application

```bash
cd SingletonSort
npm install
npm run build
cd ..
```

This creates the production build in `SingletonSort/dist/SingletonSort/browser/`

### 2. Download Go Dependencies

```bash
go mod download
```

### 3. Build the Executable

#### For your current platform:
```bash
go build -o singleton-sort
```

#### For Windows (from any platform):
```bash
GOOS=windows GOARCH=amd64 go build -o singleton-sort.exe
```

#### For macOS (from any platform):
```bash
GOOS=darwin GOARCH=amd64 go build -o singleton-sort-mac
# For Apple Silicon (M1/M2):
GOOS=darwin GOARCH=arm64 go build -o singleton-sort-mac-arm64
```

#### For Linux (from any platform):
```bash
GOOS=linux GOARCH=amd64 go build -o singleton-sort-linux
```

### 4. Build with Optimizations (Smaller File Size)

```bash
# For current platform
go build -ldflags="-s -w" -o singleton-sort

# For Windows with optimizations
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o singleton-sort.exe
```

The `-ldflags="-s -w"` flags strip debug information and reduce binary size.

## Running the Application

Simply run the executable:

```bash
# Linux/Mac
./singleton-sort

# Windows
singleton-sort.exe
```

The application will:
- Start a web server on http://localhost:8989
- Automatically open your default browser
- Add a system tray icon with options to:
  - Open the app in browser
  - Quit the application

## Graceful Shutdown

Press `Ctrl+C` in the terminal to gracefully shut down the server.

## Troubleshooting

### Build fails with "cannot find package"
Run `go mod download` to ensure all dependencies are downloaded.

### Browser doesn't open automatically
The app will print the URL in the console. Manually open: http://localhost:8989

### Port 8989 already in use
Close any application using port 8989 or modify the `port` constant in `main.go`

### Angular build warnings
The SCSS file may show a budget warning during build. This is non-critical and doesn't prevent the app from working.

## Build Script

Create a `build.sh` script for convenience:

```bash
#!/bin/bash

echo "Building Angular app..."
cd SingletonSort
npm run build
cd ..

echo "Building Go executable..."
go build -ldflags="-s -w" -o singleton-sort

echo "Build complete! Run with: ./singleton-sort"
```

Make it executable:
```bash
chmod +x build.sh
./build.sh
```

## Distribution

The final executable is completely standalone and can be distributed as a single file. No installation required - just run it!

**File sizes (approximate):**
- Unoptimized: ~50-70 MB
- Optimized with `-ldflags="-s -w"`: ~35-50 MB

The size includes:
- The entire Angular application
- Go runtime
- HTTP server
- System tray functionality
