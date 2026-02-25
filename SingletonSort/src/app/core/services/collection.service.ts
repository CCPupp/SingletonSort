import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardListService } from './card-list.service';
import { CollectionEntry, ScryfallCardData } from '../models/card-list.model';

export interface CollectionCard {
  cardName: string;
  deckNames: string[];
  typeLine: string | null;
  scryfallData?: ScryfallCardData;
  currentDeck: string | null;
}

const TYPE_ORDER: Record<string, number> = {
  'Creatures': 1,
  'Planeswalkers': 2,
  'Instants': 3,
  'Sorceries': 4,
  'Artifacts': 5,
  'Enchantments': 6,
  'Lands': 7,
  'Battles': 8,
  'Other': 9
};

function getCardType(typeLine: string | null): string {
  if (!typeLine) return 'Other';
  // For double-faced cards use only the front face type (before " // ")
  const t = typeLine.split(' // ')[0];
  if (t.includes('Creature')) return 'Creatures';
  if (t.includes('Planeswalker')) return 'Planeswalkers';
  if (t.includes('Instant')) return 'Instants';
  if (t.includes('Sorcery')) return 'Sorceries';
  if (t.includes('Artifact')) return 'Artifacts';
  if (t.includes('Enchantment')) return 'Enchantments';
  if (t.includes('Land')) return 'Lands';
  if (t.includes('Battle')) return 'Battles';
  return 'Other';
}

const BASIC_LANDS = new Set(['Forest', 'Plains', 'Mountain', 'Island', 'Swamp']);

/**
 * Service for tracking which physical deck currently holds each card
 */
@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private readonly cardListService = inject(CardListService);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly API_URL = '/api/collection';

  private readonly assignmentsSignal = signal<CollectionEntry[]>([]);
  readonly assignments = this.assignmentsSignal.asReadonly();

  /** All unique non-basic cards across all loaded decks, enriched with assignment info */
  readonly collectionCards = computed<CollectionCard[]>(() => {
    const decks = this.cardListService.cardLists();
    const assignments = this.assignmentsSignal();
    const assignmentMap = new Map(assignments.map(a => [a.cardName, a.ownedBy]));

    const cardMap = new Map<string, { deckNames: Set<string>; scryfallData?: ScryfallCardData }>();

    for (const deck of decks) {
      for (const card of deck.cards) {
        if (BASIC_LANDS.has(card.name)) continue;
        if (!cardMap.has(card.name)) {
          cardMap.set(card.name, { deckNames: new Set(), scryfallData: card.scryfallData });
        }
        const entry = cardMap.get(card.name)!;
        entry.deckNames.add(deck.name);
        if (!entry.scryfallData && card.scryfallData) {
          entry.scryfallData = card.scryfallData;
        }
      }
    }

    return Array.from(cardMap.entries())
      .map(([name, data]) => ({
        cardName: name,
        deckNames: Array.from(data.deckNames).sort(),
        typeLine: data.scryfallData?.typeLine || null,
        scryfallData: data.scryfallData,
        currentDeck: assignmentMap.get(name) ?? null
      }))
      .sort((a, b) => {
        const typeA = TYPE_ORDER[getCardType(a.typeLine)] ?? 99;
        const typeB = TYPE_ORDER[getCardType(b.typeLine)] ?? 99;
        if (typeA !== typeB) return typeA - typeB;
        return a.cardName.localeCompare(b.cardName);
      });
  });

  /** Names of all currently loaded decks */
  readonly deckNames = computed(() => this.cardListService.cardLists().map(d => d.name));

  constructor() {
    if (this.isBrowser) {
      this.loadFromServer();
    }
  }

  private loadFromServer(): void {
    this.http.get<CollectionEntry[]>(this.API_URL).subscribe({
      next: (entries) => this.assignmentsSignal.set(entries),
      error: (err) => console.error('Failed to load collection:', err)
    });
  }

  /**
   * Assigns a card to a deck (or clears the assignment with null)
   */
  assignCard(cardName: string, deckName: string | null): void {
    const assignments = this.assignmentsSignal();
    const existing = assignments.findIndex(a => a.cardName === cardName);
    const newEntry: CollectionEntry = { cardName, ownedBy: deckName };

    if (existing >= 0) {
      this.assignmentsSignal.set(assignments.map((a, i) => i === existing ? newEntry : a));
    } else {
      this.assignmentsSignal.set([...assignments, newEntry]);
    }

    this.http.put(`${this.API_URL}/${encodeURIComponent(cardName)}`, { ownedBy: deckName }).subscribe({
      error: (err) => console.error('Failed to save assignment:', err)
    });
  }

  getCardType(typeLine: string | null): string {
    return getCardType(typeLine);
  }
}
