import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

interface ScryfallCardData {
  name: string;
  imageUriSmall: string | null;
  imageUriNormal: string | null;
  oracleText: string | null;
  manaCost: string | null;
  typeLine: string | null;
  error?: string;
}

interface CardListEntry {
  quantity: number;
  name: string;
  scryfallData?: ScryfallCardData;
}

interface CardList {
  name: string;
  cards: CardListEntry[];
  totalCards: number;
  isCollapsed?: boolean;
}

interface ScryfallCard {
  name: string;
  image_uris?: {
    small?: string;
    normal?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small?: string;
      normal?: string;
    };
    oracle_text?: string;
    type_line?: string;
  }>;
  oracle_text?: string;
  mana_cost?: string;
  type_line?: string;
  prints_search_uri?: string;
}

interface ScryfallCollectionResponse {
  data: ScryfallCard[];
  not_found: Array<{ name: string }>;
}

interface ScryfallSearchResponse {
  data: ScryfallCard[];
}

const browserDistFolder = join(import.meta.dirname, '../browser');
// Store data outside dist folder so it persists across builds
const DATA_DIR = join(import.meta.dirname, '../../../data');
const DATA_FILE = join(DATA_DIR, 'decks.json');
const CACHE_FILE = join(DATA_DIR, 'card-cache.json');
const COLLECTION_FILE = join(DATA_DIR, 'collection.json');
const SCRYFALL_BASE = 'https://api.scryfall.com';

// In-memory cache
let cardCache: Map<string, ScryfallCardData> = new Map();

// Load cache from file, dropping any DFC entries stored with the old combined type line
// so they are re-fetched with the correct front-face type and images.
function loadCache(): void {
  if (existsSync(CACHE_FILE)) {
    try {
      const data = readFileSync(CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(data) as Record<string, ScryfallCardData>;
      cardCache = new Map(Object.entries(parsed));
      let invalidated = 0;
      for (const [name, entry] of cardCache) {
        if (entry.typeLine?.includes(' // ')) {
          cardCache.delete(name);
          invalidated++;
        }
      }
      console.log(`Loaded ${cardCache.size} cards from cache${invalidated ? ` (invalidated ${invalidated} DFC entries for re-fetch)` : ''}`);
    } catch (err) {
      console.error('Failed to load cache:', err);
      cardCache = new Map();
    }
  }
}

// Save cache to file
function saveCache(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const obj = Object.fromEntries(cardCache);
  writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
}

// Rate-limited fetch with 100ms delay
let lastFetchTime = 0;
async function rateLimitedFetch(url: string, options?: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastFetch = now - lastFetchTime;
  if (timeSinceLastFetch < 100) {
    await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastFetch));
  }
  lastFetchTime = Date.now();
  return fetch(url, options);
}

// Get image URIs from a Scryfall card (handles double-faced cards)
function getImageUris(card: ScryfallCard): { small: string | null; normal: string | null } {
  if (card.image_uris) {
    return {
      small: card.image_uris.small || null,
      normal: card.image_uris.normal || null
    };
  }
  // Double-faced cards store images in card_faces
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return {
      small: card.card_faces[0].image_uris.small || null,
      normal: card.card_faces[0].image_uris.normal || null
    };
  }
  return { small: null, normal: null };
}

// Fetch oldest printing for a card to get original art
async function fetchOldestPrinting(cardName: string): Promise<ScryfallCard | null> {
  try {
    const encodedName = encodeURIComponent(`!"${cardName}"`);
    const url = `${SCRYFALL_BASE}/cards/search?q=${encodedName}&unique=prints&order=released&dir=asc`;
    const response = await rateLimitedFetch(url);
    if (!response.ok) {
      return null;
    }
    const data = await response.json() as ScryfallSearchResponse;
    return data.data[0] || null;
  } catch {
    return null;
  }
}

// Fetch cards from Scryfall using /cards/collection endpoint
async function fetchCardsFromScryfall(cardNames: string[]): Promise<Map<string, ScryfallCardData>> {
  const results = new Map<string, ScryfallCardData>();
  const uncachedNames = cardNames.filter(name => !cardCache.has(name));

  if (uncachedNames.length === 0) {
    // All cards are cached
    cardNames.forEach(name => {
      const cached = cardCache.get(name);
      if (cached) results.set(name, cached);
    });
    return results;
  }

  console.log(`Fetching ${uncachedNames.length} cards from Scryfall...`);

  // Batch into groups of 75 (Scryfall limit)
  const batches: string[][] = [];
  for (let i = 0; i < uncachedNames.length; i += 75) {
    batches.push(uncachedNames.slice(i, i + 75));
  }

  for (const batch of batches) {
    try {
      const identifiers = batch.map(name => ({ name }));
      const response = await rateLimitedFetch(`${SCRYFALL_BASE}/cards/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers })
      });

      if (!response.ok) {
        console.error(`Scryfall API error: ${response.status}`);
        continue;
      }

      const data = await response.json() as ScryfallCollectionResponse;

      // Process found cards - fetch oldest printing for each
      for (const card of data.data) {
        const oldestPrinting = await fetchOldestPrinting(card.name);

        // Use oldest printing images when available, fall back to collection-endpoint card
        // (some DFC oldest printings lack card_faces image data)
        let images = oldestPrinting ? getImageUris(oldestPrinting) : null;
        if (!images?.small && !images?.normal) {
          images = getImageUris(card);
        }

        // For double-faced cards use the front face type line; fall back to combined type line
        const typeLine = card.card_faces?.[0]?.type_line ?? card.type_line ?? null;

        const scryfallData: ScryfallCardData = {
          name: card.name,
          imageUriSmall: images?.small ?? null,
          imageUriNormal: images?.normal ?? null,
          oracleText: card.oracle_text || (card.card_faces?.[0]?.oracle_text) || null,
          manaCost: card.mana_cost || null,
          typeLine
        };
        cardCache.set(card.name, scryfallData);
        results.set(card.name, scryfallData);
      }

      // Handle not found cards
      for (const notFound of data.not_found) {
        const scryfallData: ScryfallCardData = {
          name: notFound.name,
          imageUriSmall: null,
          imageUriNormal: null,
          oracleText: null,
          manaCost: null,
          typeLine: null,
          error: 'Card not found'
        };
        cardCache.set(notFound.name, scryfallData);
        results.set(notFound.name, scryfallData);
      }
    } catch (err) {
      console.error('Error fetching batch from Scryfall:', err);
    }
  }

  // Save updated cache
  saveCache();

  // Include any previously cached cards
  cardNames.forEach(name => {
    if (!results.has(name)) {
      const cached = cardCache.get(name);
      if (cached) results.set(name, cached);
    }
  });

  return results;
}

// Enrich deck cards with Scryfall data
async function enrichDeckWithScryfallData(deck: CardList): Promise<CardList> {
  const cardNames = deck.cards.map(c => c.name);
  const scryfallData = await fetchCardsFromScryfall(cardNames);

  return {
    ...deck,
    cards: deck.cards.map(card => ({
      ...card,
      scryfallData: scryfallData.get(card.name)
    }))
  };
}

// Enrich all decks with cached Scryfall data (sync, for GET)
function enrichDecksWithCache(decks: CardList[]): CardList[] {
  return decks.map(deck => ({
    ...deck,
    cards: deck.cards.map(card => ({
      ...card,
      scryfallData: cardCache.get(card.name)
    }))
  }));
}


interface CollectionEntry {
  cardName: string;
  ownedBy: string | null;
}

function readCollection(): CollectionEntry[] {
  if (!existsSync(COLLECTION_FILE)) return [];
  const data = readFileSync(COLLECTION_FILE, 'utf-8');
  return JSON.parse(data) as CollectionEntry[];
}

function writeCollection(entries: CollectionEntry[]): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(COLLECTION_FILE, JSON.stringify(entries, null, 2));
}

function readDecks(): CardList[] {
  if (!existsSync(DATA_FILE)) {
    return [];
  }
  const data = readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data) as CardList[];
}

function writeDecks(decks: CardList[]): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(DATA_FILE, JSON.stringify(decks, null, 2));
}

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

// GET /api/decks - Return all decks enriched with Scryfall data
// Fetches any uncached cards before responding so the client always gets full data.
app.get('/api/decks', async (_req, res) => {
  try {
    const decks = readDecks();
    const allCardNames = new Set<string>();
    decks.forEach(deck => deck.cards.forEach(card => allCardNames.add(card.name)));
    const uncached = Array.from(allCardNames).filter(name => !cardCache.has(name));
    if (uncached.length > 0) {
      await fetchCardsFromScryfall(uncached);
    }
    const enrichedDecks = enrichDecksWithCache(decks);
    res.json(enrichedDecks);
  } catch (err) {
    console.error('Error loading decks:', err);
    res.status(500).json({ error: 'Failed to load decks' });
  }
});

// POST /api/decks - Add a new deck (async to fetch Scryfall data)
app.post('/api/decks', async (req, res) => {
  try {
    const deck = req.body as CardList;
    const enrichedDeck = await enrichDeckWithScryfallData(deck);
    const decks = readDecks();
    decks.push(deck); // Save without Scryfall data to keep decks.json clean
    writeDecks(decks);
    res.status(201).json(enrichedDeck); // Return with Scryfall data
  } catch (err) {
    console.error('Error adding deck:', err);
    res.status(500).json({ error: 'Failed to add deck' });
  }
});

// PUT /api/decks/:index - Update deck name
app.put('/api/decks/:index', (req, res) => {
  const index = parseInt(req.params['index'], 10);
  const { name } = req.body as { name: string };
  const decks = readDecks();
  if (index < 0 || index >= decks.length) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }
  decks[index].name = name;
  writeDecks(decks);
  res.json(decks[index]);
});

// DELETE /api/decks/:index - Remove a deck
app.delete('/api/decks/:index', (req, res) => {
  const index = parseInt(req.params['index'], 10);
  const decks = readDecks();
  if (index < 0 || index >= decks.length) {
    res.status(404).json({ error: 'Deck not found' });
    return;
  }
  const removed = decks.splice(index, 1);
  writeDecks(decks);
  res.json(removed[0]);
});

// DELETE /api/decks - Clear all decks
app.delete('/api/decks', (_req, res) => {
  writeDecks([]);
  res.status(204).send();
});

// GET /api/collection - Return all card assignments
app.get('/api/collection', (_req, res) => {
  res.json(readCollection());
});

// PUT /api/collection/:cardName - Upsert a card assignment
app.put('/api/collection/:cardName', (req, res) => {
  const cardName = decodeURIComponent(req.params['cardName']);
  const { ownedBy } = req.body as { ownedBy: string | null };
  const entries = readCollection();
  const existing = entries.findIndex(e => e.cardName === cardName);
  if (existing >= 0) {
    entries[existing].ownedBy = ownedBy;
  } else {
    entries.push({ cardName, ownedBy });
  }
  writeCollection(entries);
  res.json({ cardName, ownedBy });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  loadCache();

  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
