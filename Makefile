.PHONY: build clean run build-angular build-go install-deps all

# Default target
all: build

# Install dependencies
install-deps:
	@echo "Installing Node.js dependencies..."
	cd SingletonSort && npm install
	@echo "Downloading Go dependencies..."
	go mod download

# Build Angular application
build-angular:
	@echo "Building Angular application..."
	cd SingletonSort && npm run build

# Build Go executable
build-go:
	@echo "Building Go executable..."
	go build -ldflags="-s -w" -o singleton-sort

# Full build
build: build-angular build-go
	@echo ""
	@echo "Build complete! Run with: ./singleton-sort"

# Build for multiple platforms
build-all: build-angular
	@echo "Building for all platforms..."
	GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o singleton-sort-linux
	GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o singleton-sort-mac-amd64
	GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o singleton-sort-mac-arm64
	GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o singleton-sort.exe
	@echo "All platform builds complete!"

# Run the application
run: build
	./singleton-sort

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f singleton-sort singleton-sort-linux singleton-sort-mac-* singleton-sort.exe
	rm -rf SingletonSort/dist
	@echo "Clean complete!"

# Development server (Angular only)
dev:
	cd SingletonSort && npm start
