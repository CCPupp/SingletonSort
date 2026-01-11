package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"
	"time"
)

//go:embed SingletonSort/dist/SingletonSort/browser/*
var content embed.FS

const port = "8989"

var server *http.Server

func main() {
	log.Println("Starting Singleton Sort...")

	// Start the web server
	startServer()
}

func startServer() {
	// Get the embedded filesystem
	distFS, err := fs.Sub(content, "SingletonSort/dist/SingletonSort/browser")
	if err != nil {
		log.Fatal("Failed to load embedded files:", err)
	}

	// Create file server
	fileServer := http.FileServer(http.FS(distFS))

	// Create router
	mux := http.NewServeMux()

	// Shutdown endpoint
	mux.HandleFunc("/api/shutdown", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":"Server shutting down..."}`))

		// Shutdown in background
		go func() {
			time.Sleep(500 * time.Millisecond)
			log.Println("Shutdown requested via API")

			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			if err := server.Shutdown(ctx); err != nil {
				log.Printf("Server shutdown error: %v", err)
			}
			os.Exit(0)
		}()
	})

	// Serve static files
	mux.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Add cache control headers for development
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		fileServer.ServeHTTP(w, r)
	}))

	// Create server
	server = &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	// Handle graceful shutdown
	go handleShutdown()

	// Open browser after a short delay
	go func() {
		time.Sleep(500 * time.Millisecond)
		url := fmt.Sprintf("http://localhost:%s", port)
		if err := openBrowser(url); err != nil {
			log.Printf("Failed to open browser automatically: %v", err)
			log.Printf("Please open your browser and navigate to: %s", url)
		}
	}()

	// Start server
	log.Printf("Starting Singleton Sort on http://localhost:%s", port)
	log.Println("Press Ctrl+C to stop the server")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("Server failed:", err)
	}
}

func handleShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan

	log.Println("\nShutting down gracefully...")

	// Create shutdown context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Shutdown server
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Println("Server stopped")
	os.Exit(0)
}

func openBrowser(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
		args = []string{url}
	}

	return exec.Command(cmd, args...).Start()
}
