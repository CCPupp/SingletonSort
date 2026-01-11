# Moxfield API Service

Angular service for interacting with the unofficial Moxfield API to fetch deck data.

## Quick Start

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { MoxfieldApiService } from './core/services/moxfield-api.service';

@Component({
  selector: 'app-deck-viewer',
  template: `
    @if (moxfield.isLoading()) {
      <p>Loading deck...</p>
    } @else if (moxfield.hasError()) {
      <p>Error: {{ moxfield.error()?.message }}</p>
    } @else if (moxfield.hasDeck()) {
      <h1>{{ moxfield.currentDeck()?.name }}</h1>
      <p>Format: {{ moxfield.currentDeck()?.format }}</p>
      <p>Cards: {{ moxfield.deckStats()?.totalCards }}</p>
    }
  `
})
export class DeckViewer implements OnInit {
  protected readonly moxfield = inject(MoxfieldApiService);

  async ngOnInit() {
    await this.moxfield.getDeckById('oEWXWHM5eEGMmopExLWRCA');
  }
}
```

## Features

### Signal-Based State Management
The service uses Angular signals for reactive state:

```typescript
const moxfield = inject(MoxfieldApiService);

// Reactive state signals
moxfield.currentDeck();  // MoxfieldDeck | null
moxfield.isLoading();    // boolean
moxfield.error();        // MoxfieldError | null
moxfield.hasError();     // boolean (computed)
moxfield.hasDeck();      // boolean (computed)
moxfield.deckStats();    // { totalCards, sideboardCards, ... } | null
```

### Fetch Deck by ID

```typescript
// Using just the deck ID
await moxfield.getDeckById('oEWXWHM5eEGMmopExLWRCA');

// Using full Moxfield URL (automatically extracts ID)
await moxfield.getDeckById('https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA');

// Using options object
await moxfield.getDeck({ deckId: 'oEWXWHM5eEGMmopExLWRCA' });
```

### Error Handling

```typescript
try {
  const deck = await moxfield.getDeckById('invalid-id');
} catch (error) {
  console.error('Failed to load deck:', error);
}

// Or use signals
if (moxfield.hasError()) {
  console.log(moxfield.error()?.message);
  console.log(moxfield.error()?.statusCode);
}
```

### State Management

```typescript
// Clear current deck
moxfield.clearDeck();

// Clear error
moxfield.clearError();
```

## Available Data

The `MoxfieldDeck` interface provides access to:

### Deck Metadata
- `id`, `name`, `description`
- `format` (commander, standard, modern, etc.)
- `visibility`, `publicUrl`, `publicId`
- `likeCount`, `viewCount`, `commentCount`
- `createdAtUtc`, `lastUpdatedAtUtc`
- `authors[]` - Array of deck authors

### Card Boards
Each board contains `count` and `cards` object:
- `mainboard` - Main deck cards
- `sideboard` - Sideboard cards
- `maybeboard` - Maybe board cards
- `commanders` - Commander cards
- `companions` - Companion cards
- `tokens` - Token cards

### Card Entry Structure
Each card in a board has:
- `quantity` - Number of copies
- `boardType` - Which board it belongs to
- `finish` - 'nonfoil' | 'foil' | 'etched'
- `isFoil`, `isAlter`, `isProxy` - Card properties
- `card` - Full card data object

### Card Data
Each card includes:
- Basic info: `id`, `name`, `set`, `cn` (collector number)
- Game data: `cmc`, `type`, `type_line`, `oracle_text`, `mana_cost`
- Colors: `colors[]`, `color_identity[]`
- Legalities: `legalities{}` (format: 'legal' | 'not_legal' | 'restricted' | 'banned')
- Pricing: `prices{}` (usd, usd_foil, eur, cardmarket, etc.)
- Images: `image_uris{}` (small, normal, large, art_crop, etc.)
- Market IDs: `tcgplayer_id`, `cardmarket_id`, `cardkingdom_id`
- Other: `artist`, `rarity`, `edhrec_rank`

## Computed Deck Stats

```typescript
const stats = moxfield.deckStats();

if (stats) {
  console.log('Total cards:', stats.totalCards);
  console.log('Sideboard:', stats.sideboardCards);
  console.log('Maybeboard:', stats.maybeboardCards);
  console.log('Commanders:', stats.commanderCount);
  console.log('Companions:', stats.companionCount);
}
```

## Example: Display Deck Cards

```typescript
@Component({
  selector: 'app-deck-list',
  template: `
    @if (moxfield.currentDeck(); as deck) {
      <h2>{{ deck.name }}</h2>

      <h3>Commanders ({{ deck.commanders.count }})</h3>
      @for (entry of getCards(deck.commanders.cards); track entry.card.id) {
        <div class="card">
          {{ entry.quantity }}x {{ entry.card.name }}
          <img [src]="entry.card.image_uris.small" [alt]="entry.card.name">
        </div>
      }

      <h3>Main Deck ({{ deck.mainboard.count }})</h3>
      @for (entry of getCards(deck.mainboard.cards); track entry.card.id) {
        <div class="card">
          {{ entry.quantity }}x {{ entry.card.name }}
          <span class="mana-cost">{{ entry.card.mana_cost }}</span>
        </div>
      }
    }
  `
})
export class DeckList {
  protected readonly moxfield = inject(MoxfieldApiService);

  getCards(cardBoard: Record<string, CardEntry>): CardEntry[] {
    return Object.values(cardBoard);
  }
}
```

## Important Notes

⚠️ **Unofficial API**: This service uses Moxfield's unofficial API which may change without notice.

⚠️ **Terms of Service**: According to Moxfield's terms, scraping is prohibited. Use this service responsibly and consider:
- Implementing rate limiting
- Caching responses
- Contacting support@moxfield.com for authorized access

⚠️ **CORS**: The Moxfield API may require CORS configuration. For SSR applications, API calls on the server side avoid CORS issues.

## Type Safety

All types are fully typed with TypeScript. Import from:

```typescript
import { MoxfieldDeck, CardEntry, Card, BoardType } from './core/models/moxfield.model';
```

## Testing

The service includes comprehensive unit tests. Run them with:

```bash
npm test
```

See `moxfield-api.service.spec.ts` for test examples.
