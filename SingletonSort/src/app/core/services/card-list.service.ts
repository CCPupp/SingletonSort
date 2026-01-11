import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly STORAGE_KEY = 'singleton-sort-card-list';

  // State management with signals
  private readonly cardListsSignal = signal<CardList[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorsSignal = signal<string[]>([]);

  // Public readonly signals
  readonly cardLists = this.cardListsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly errors = this.errorsSignal.asReadonly();

  // Computed signals
  readonly hasErrors = computed(() => this.errors().length > 0);
  readonly hasCardLists = computed(() => this.cardLists().length > 0);
  readonly commonCards = computed(() => this.findCommonCards());

  constructor() {
    // Load from localStorage on init (only in browser)
    if (this.isBrowser) {
      this.loadFromStorage();
    }
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
      this.saveToStorage();
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
      this.saveToStorage();
    }
  }

  /**
   * Clears all card lists
   */
  clearCardList(): void {
    this.cardListsSignal.set([]);
    this.errorsSignal.set([]);
    this.clearStorage();
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
      this.saveToStorage();
    }
  }

  /**
   * Finds cards that appear in multiple decks
   */
  private findCommonCards(): Array<{ name: string; deckIndices: number[] }> {
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

    const commonCards: Array<{ name: string; deckIndices: number[] }> = [];
    cardMap.forEach((deckIndices, cardName) => {
      if (deckIndices.size > 1) {
        commonCards.push({
          name: cardName,
          deckIndices: Array.from(deckIndices).sort()
        });
      }
    });

    return commonCards.sort((a, b) => a.name.localeCompare(b.name));
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
   * Saves all card lists to localStorage
   */
  private saveToStorage(): void {
    if (!this.isBrowser) return;

    try {
      const lists = this.cardListsSignal();
      const dataToSave = JSON.stringify(lists);
      localStorage.setItem(this.STORAGE_KEY, dataToSave);
    } catch (error) {
      console.error('Failed to save card lists to localStorage:', error);
    }
  }

  /**
   * Loads card lists from localStorage
   */
  private loadFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        const lists = JSON.parse(savedData) as CardList[];
        this.cardListsSignal.set(lists);
      }
    } catch (error) {
      console.error('Failed to load card lists from localStorage:', error);
    }
  }

  /**
   * Clears card list from localStorage
   */
  private clearStorage(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear card list from localStorage:', error);
    }
  }
}
