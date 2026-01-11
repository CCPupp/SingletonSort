# Deck Viewer Feature

A feature component that displays information from public Moxfield deck links.

## Usage

This component is the main page of the application and displays at the root path (`/`).

### Features

- **URL Input**: Accepts both full Moxfield URLs or just deck IDs
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Displays helpful error messages for failed requests
- **Deck Information Display**:
  - Deck name and format
  - Color identity (for Commander decks)
  - Card counts (mainboard, sideboard, maybeboard, commanders, companions)
  - Commander card images and details
  - Estimated deck price (calculated from card prices)
  - Community stats (views, likes, comments)
  - Deck authors
  - Creation and update dates
  - Link to view full deck on Moxfield

### State Management

The component uses Angular signals for reactive state:
- `deckUrl` - Current input URL/ID
- `isLoadingDeck` - Loading state for the current request
- Computed signals derived from the MoxfieldApiService:
  - `deck` - Current deck data
  - `stats` - Deck statistics
  - `error` - Error state
  - `totalPrice` - Calculated deck price
  - `colorIdentity` - Commander color identity

### Example URLs

Valid Moxfield deck URLs:
- `https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA`
- `oEWXWHM5eEGMmopExLWRCA` (just the ID)

## File Structure

```
deck-viewer/
├── deck-viewer.ts          # Component logic
├── deck-viewer.html        # Component template
├── deck-viewer.scss        # Component styles
├── deck-viewer.spec.ts     # Component tests
└── README.md               # This file
```

## Styling

The component uses a card-based layout with:
- Responsive design (mobile-friendly)
- Loading animations
- Color-coded badges for formats
- Card image previews
- Engagement metrics display
- Clean, modern UI

## Dependencies

- `MoxfieldApiService` - For fetching deck data
- `FormsModule` - For two-way binding on the URL input
- `CommonModule` - For Angular directives and pipes
