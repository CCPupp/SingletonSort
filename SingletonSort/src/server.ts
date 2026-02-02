import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

interface CardListEntry {
  quantity: number;
  name: string;
}

interface CardList {
  name: string;
  cards: CardListEntry[];
  totalCards: number;
  isCollapsed?: boolean;
}

const browserDistFolder = join(import.meta.dirname, '../browser');
// Store data outside dist folder so it persists across builds
const DATA_DIR = join(import.meta.dirname, '../../../data');
const DATA_FILE = join(DATA_DIR, 'decks.json');

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

// GET /api/decks - Return all decks
app.get('/api/decks', (_req, res) => {
  const decks = readDecks();
  res.json(decks);
});

// POST /api/decks - Add a new deck
app.post('/api/decks', (req, res) => {
  const deck = req.body as CardList;
  const decks = readDecks();
  decks.push(deck);
  writeDecks(decks);
  res.status(201).json(deck);
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
