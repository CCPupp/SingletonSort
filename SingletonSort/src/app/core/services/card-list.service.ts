import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardList, ParseResult } from '../models/card-list.model';
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
      this.cardListsSignal.set([...currentLists, result.cardList]);
      this.http.post<CardList>(this.API_URL, result.cardList).subscribe({
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
   * Finds cards that appear in multiple decks
   */
  private findCommonCards(): Array<{ name: string; deckIndices: number[]; group: string | null }> {
    const lists = this.cardListsSignal();
    if (lists.length < 2) return [];

    const basicLands = new Set(['Forest', 'Plains', 'Mountain', 'Island', 'Swamp']);
    const cardMap = new Map<string, Set<number>>();

    lists.forEach((list, deckIndex) => {
      list.cards.forEach(card => {
        if (basicLands.has(card.name)) {
          return;
        }

        if (!cardMap.has(card.name)) {
          cardMap.set(card.name, new Set());
        }
        cardMap.get(card.name)!.add(deckIndex);
      });
    });

    const commonCards: Array<{ name: string; deckIndices: number[]; group: string | null }> = [];
    cardMap.forEach((deckIndices, cardName) => {
      if (deckIndices.size > 1) {
        commonCards.push({
          name: cardName,
          deckIndices: Array.from(deckIndices).sort(),
          group: this.getLandGroup(cardName)
        });
      }
    });

    return commonCards.sort((a, b) => {
      const groupA = a.group || 'zzz';
      const groupB = b.group || 'zzz';
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }
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

}
