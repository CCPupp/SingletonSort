import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardList, ParseResult, ScryfallCardData } from '../models/card-list.model';
import { CardListParserService } from './card-list-parser.service';

/**
 * Service for managing card lists with state and persistence
 */
@Injectable({
  providedIn: 'root'
})
export class CardListService {
  private readonly parser = inject(CardListParserService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly API_URL = '/api/decks';

  private readonly cardListsSignal = signal<CardList[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorsSignal = signal<string[]>([]);

  readonly cardLists = this.cardListsSignal.asReadonly();
  readonly errors = this.errorsSignal.asReadonly();

  readonly hasErrors = computed(() => this.errors().length > 0);
  readonly commonCards = computed(() => this.findCommonCards());

  constructor() {
    if (this.isBrowser) {
      this.loadFromServer();
    }
  }

  private loadFromServer(): void {
    this.http.get<CardList[]>(this.API_URL).subscribe({
      next: (decks) => this.cardListsSignal.set(decks),
      error: (err) => console.error('Failed to load decks from server:', err)
    });
  }

  /**
   * Parses and adds a card list from text input
   *
   * @param text - Card list text
   * @returns ParseResult
   */
  parseAndSetCardList(text: string): ParseResult {
    this.loadingSignal.set(true);
    this.errorsSignal.set([]);

    const result = this.parser.parseCardList(text);

    if (result.success && result.cardList) {
      const currentLists = this.cardListsSignal();
      const newIndex = currentLists.length;
      // Add deck locally first (without Scryfall data)
      this.cardListsSignal.set([...currentLists, result.cardList]);

      // Post to server and update with enriched data when response arrives
      this.http.post<CardList>(this.API_URL, result.cardList).subscribe({
        next: (enrichedDeck) => {
          // Replace the deck at newIndex with the enriched version from server
          const lists = this.cardListsSignal();
          const updatedLists = lists.map((deck, i) =>
            i === newIndex ? enrichedDeck : deck
          );
          this.cardListsSignal.set(updatedLists);
        },
        error: (err) => console.error('Failed to save deck to server:', err)
      });
    } else {
      this.errorsSignal.set(result.errors);
    }

    this.loadingSignal.set(false);
    return result;
  }

  /**
   * Removes a specific card list by index
   */
  removeCardList(index: number): void {
    const currentLists = this.cardListsSignal();
    if (index >= 0 && index < currentLists.length) {
      this.cardListsSignal.set(currentLists.filter((_, i) => i !== index));
      this.http.delete(`${this.API_URL}/${index}`).subscribe({
        error: (err) => console.error('Failed to remove deck from server:', err)
      });
    }
  }

  /**
   * Clears all card lists
   */
  clearCardList(): void {
    this.cardListsSignal.set([]);
    this.errorsSignal.set([]);
    this.http.delete(this.API_URL).subscribe({
      error: (err) => console.error('Failed to clear decks from server:', err)
    });
  }

  /**
   * Clears current errors
   */
  clearErrors(): void {
    this.errorsSignal.set([]);
  }

  /**
   * Toggles the collapse state of a specific card list
   */
  toggleCollapse(index: number): void {
    const currentLists = this.cardListsSignal();
    if (index >= 0 && index < currentLists.length) {
      const updatedLists = currentLists.map((list, i) =>
        i === index ? { ...list, isCollapsed: !list.isCollapsed } : list
      );
      this.cardListsSignal.set(updatedLists);
    }
  }

  /**
   * Updates the name of a specific card list
   */
  updateName(index: number, newName: string): void {
    const currentLists = this.cardListsSignal();
    if (index >= 0 && index < currentLists.length) {
      const updatedLists = currentLists.map((list, i) =>
        i === index ? { ...list, name: newName } : list
      );
      this.cardListsSignal.set(updatedLists);
      this.http.put(`${this.API_URL}/${index}`, { name: newName }).subscribe({
        error: (err) => console.error('Failed to update deck name on server:', err)
      });
    }
  }

  /**
   * Categorizes a card into a land group or returns null
   */
  private getLandGroup(cardName: string): string | null {
    const fetchLands = new Set([
      'Flooded Strand', 'Polluted Delta', 'Bloodstained Mire', 'Wooded Foothills',
      'Windswept Heath', 'Marsh Flats', 'Scalding Tarn', 'Verdant Catacombs',
      'Arid Mesa', 'Misty Rainforest'
    ]);

    const surveilLands = new Set([
      'Shadowy Backstreet', 'Elegant Parlor', 'Lush Portico', 'Raucous Theater',
      'Commercial District', 'Meticulous Archive', 'Thundering Falls', 'Hedge Maze',
      'Blazing Greenhouse', 'Underground Mortuary'
    ]);

    const dualLands = new Set([
      'Tundra', 'Underground Sea', 'Badlands', 'Taiga', 'Savannah',
      'Scrubland', 'Volcanic Island', 'Bayou', 'Plateau', 'Tropical Island'
    ]);

    const shockLands = new Set([
      'Hallowed Fountain', 'Watery Grave', 'Blood Crypt', 'Stomping Ground',
      'Temple Garden', 'Godless Shrine', 'Steam Vents', 'Overgrown Tomb',
      'Sacred Foundry', 'Breeding Pool'
    ]);

    const triLands = new Set([
      'Spara\'s Headquarters', 'Raffine\'s Tower', 'Xander\'s Lounge',
      'Ziatora\'s Proving Ground', 'Jetmir\'s Garden', 'Zagoth Triome',
      'Raugrin Triome', 'Savai Triome', 'Ketria Triome', 'Indatha Triome'
    ]);

    if (fetchLands.has(cardName)) return 'Fetch Lands';
    if (surveilLands.has(cardName)) return 'Surveil Lands';
    if (dualLands.has(cardName)) return 'Dual Lands';
    if (shockLands.has(cardName)) return 'Shock Lands';
    if (triLands.has(cardName)) return 'Tri Lands';

    return null;
  }

  /**
   * Extracts the main card type from a type line
   */
  private getCardType(typeLine: string | null | undefined): string {
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

  /**
   * Finds cards that appear in multiple decks
   */
  private findCommonCards(): Array<{ name: string; deckIndices: number[]; group: string | null; subgroup: string | null }> {
    const lists = this.cardListsSignal();
    if (lists.length < 2) return [];

    const basicLands = new Set(['Forest', 'Plains', 'Mountain', 'Island', 'Swamp']);
    const cardMap = new Map<string, { deckIndices: Set<number>; typeLine: string | null }>();

    lists.forEach((list, deckIndex) => {
      list.cards.forEach(card => {
        if (basicLands.has(card.name)) {
          return;
        }

        if (!cardMap.has(card.name)) {
          cardMap.set(card.name, {
            deckIndices: new Set(),
            typeLine: card.scryfallData?.typeLine || null
          });
        }
        cardMap.get(card.name)!.deckIndices.add(deckIndex);
        // Update typeLine if we have it now but didn't before
        if (!cardMap.get(card.name)!.typeLine && card.scryfallData?.typeLine) {
          cardMap.get(card.name)!.typeLine = card.scryfallData.typeLine;
        }
      });
    });

    const commonCards: Array<{ name: string; deckIndices: number[]; group: string | null; subgroup: string | null }> = [];
    cardMap.forEach((data, cardName) => {
      if (data.deckIndices.size > 1) {
        const cardType = this.getCardType(data.typeLine);
        const landGroup = this.getLandGroup(cardName);
        commonCards.push({
          name: cardName,
          deckIndices: Array.from(data.deckIndices).sort(),
          group: cardType,
          subgroup: cardType === 'Lands' ? landGroup : null
        });
      }
    });

    // Define type order for sorting
    const typeOrder: Record<string, number> = {
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

    return commonCards.sort((a, b) => {
      // Sort by card type first
      const typeA = typeOrder[a.group || 'Other'] || 99;
      const typeB = typeOrder[b.group || 'Other'] || 99;
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      // Within lands, sort by subgroup
      if (a.group === 'Lands' && b.group === 'Lands') {
        const subA = a.subgroup || 'zzz';
        const subB = b.subgroup || 'zzz';
        if (subA !== subB) {
          return subA.localeCompare(subB);
        }
      }
      // Finally, sort by name
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Gets the text representation of a specific card list
   */
  getCardListText(index: number): string | null {
    const lists = this.cardListsSignal();
    if (index < 0 || index >= lists.length) return null;

    return this.parser.serializeCardList(lists[index]);
  }

  /**
   * Gets Scryfall data for a card by name from loaded decks
   */
  getCardData(cardName: string): ScryfallCardData | undefined {
    const decks = this.cardListsSignal();
    for (const deck of decks) {
      const card = deck.cards.find(c => c.name === cardName);
      if (card?.scryfallData) return card.scryfallData;
    }
    return undefined;
  }

}
