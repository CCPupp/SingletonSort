# Singleton Sort

A web application for comparing multiple Magic: The Gathering card lists and finding common cards between them.

## Features

- **Multi-Deck Management**: Add and manage multiple card lists
- **Common Card Detection**: Automatically finds cards that appear in 2+ decks
- **Interactive UI**:
  - Sidebar for deck management
  - Main area showcasing common cards
  - Collapsible deck views
  - Renameable decks
  - Download individual decks
- **Excludes Basic Lands**: Automatically filters out Forest, Plains, Mountain, Island, and Swamp
- **Persistent Storage**: Saves your decks in browser localStorage

## Quick Start

### Option 1: Run as Standalone Executable (Recommended)

1. Build the app (first time only):
   ```bash
   ./build.sh    # Linux/Mac
   build.bat     # Windows
   ```

2. Run the executable:
   ```bash
   ./singleton-sort      # Linux/Mac
   singleton-sort.exe    # Windows
   ```

The app will automatically:
- Start a web server on http://localhost:8989
- Open your default browser

### Option 2: Run Development Server

```bash
cd SingletonSort
npm install
npm start
```

Navigate to http://localhost:4200

## Building

See [BUILD.md](BUILD.md) for detailed build instructions and cross-compilation options.

## Usage

1. **Add a Deck**: Paste your card list in the sidebar (format: `1 Card Name` per line)
2. **Click "Add Deck"**: The deck appears in the sidebar
3. **Add More Decks**: Repeat for each deck you want to compare
4. **View Common Cards**: The main area shows all cards that appear in multiple decks

### Example Card List Format
```
1 Lightning Bolt
4 Brainstorm
1 Sol Ring
2 Counterspell
```

## Technologies

- **Frontend**: Angular 19 with standalone components
- **Backend**: Go 1.21+ with embedded filesystem
- **Styling**: Custom SCSS with responsive design

## License

MIT

## Development

The app is split into two parts:
- `SingletonSort/` - Angular application
- `main.go` - Go server that embeds and serves the Angular build

For development, use the Angular dev server. For production, build both and run the Go executable.
