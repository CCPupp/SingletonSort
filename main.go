package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

const port = "4000"

var nodeProcess *exec.Cmd

func main() {
	log.Println("Starting Singleton Sort...")

	// Start the Node.js SSR server
	startNodeServer()
}

func startNodeServer() {
	// Get the directory where the executable is located
	execPath, err := os.Executable()
	if err != nil {
		log.Fatal("Failed to get executable path:", err)
	}
	execDir := filepath.Dir(execPath)

	// Look for the server.mjs file in the dist folder
	serverPath := filepath.Join(execDir, "SingletonSort", "dist", "SingletonSort", "server", "server.mjs")

	// If not found relative to executable, try relative to working directory
	if _, err := os.Stat(serverPath); os.IsNotExist(err) {
		workDir, _ := os.Getwd()
		serverPath = filepath.Join(workDir, "SingletonSort", "dist", "SingletonSort", "server", "server.mjs")
	}

	// Check if server file exists
	if _, err := os.Stat(serverPath); os.IsNotExist(err) {
		log.Fatal("Server file not found. Please run 'npm run build' in the SingletonSort directory first.\nExpected path:", serverPath)
	}

	log.Printf("Starting Node.js server from: %s", serverPath)

	// Create the node command
	nodeProcess = exec.Command("node", serverPath)
	nodeProcess.Env = append(os.Environ(), fmt.Sprintf("PORT=%s", port))
	nodeProcess.Stdout = os.Stdout
	nodeProcess.Stderr = os.Stderr

	// Handle graceful shutdown
	go handleShutdown()

	// Open browser after a short delay
	go func() {
		time.Sleep(1500 * time.Millisecond) // Give Node server time to start
		url := fmt.Sprintf("http://localhost:%s", port)
		if err := openBrowser(url); err != nil {
			log.Printf("Failed to open browser automatically: %v", err)
			log.Printf("Please open your browser and navigate to: %s", url)
		}
	}()

	// Start the Node server
	log.Printf("Singleton Sort starting on http://localhost:%s", port)
	log.Println("Press Ctrl+C to stop the server")
	log.Println("Deck data will be saved to SingletonSort/data/decks.json")

	if err := nodeProcess.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			log.Printf("Node server exited with code: %d", exitErr.ExitCode())
		} else {
			log.Fatal("Failed to start Node server:", err)
		}
	}
}

func handleShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan

	log.Println("\nShutting down gracefully...")

	// Kill the Node process
	if nodeProcess != nil && nodeProcess.Process != nil {
		if err := nodeProcess.Process.Signal(syscall.SIGTERM); err != nil {
			log.Printf("Failed to send SIGTERM to Node process: %v", err)
			// Try harder
			nodeProcess.Process.Kill()
		}

		// Wait for process to exit (with timeout)
		done := make(chan error, 1)
		go func() {
			_, err := nodeProcess.Process.Wait()
			done <- err
		}()

		select {
		case <-done:
			log.Println("Node server stopped")
		case <-time.After(5 * time.Second):
			log.Println("Timeout waiting for Node server, forcing kill")
			nodeProcess.Process.Kill()
		}
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
