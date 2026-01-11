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
  private readonly cardListSignal = signal<CardList | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorsSignal = signal<string[]>([]);

  // Public readonly signals
  readonly currentCardList = this.cardListSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly errors = this.errorsSignal.asReadonly();

  // Computed signals
  readonly hasErrors = computed(() => this.errors().length > 0);
  readonly hasCardList = computed(() => this.currentCardList() !== null);

  constructor() {
    // Load from localStorage on init (only in browser)
    if (this.isBrowser) {
      this.loadFromStorage();
    }
  }

  /**
   * Parses and sets a card list from text input
   *
   * @param text - Card list text
   * @returns ParseResult
   */
  parseAndSetCardList(text: string): ParseResult {
    this.loadingSignal.set(true);
    this.errorsSignal.set([]);

    const result = this.parser.parseCardList(text);

    if (result.success && result.cardList) {
      this.cardListSignal.set(result.cardList);
      this.saveToStorage(text);
    } else {
      this.errorsSignal.set(result.errors);
    }

    this.loadingSignal.set(false);
    return result;
  }

  /**
   * Clears the current card list
   */
  clearCardList(): void {
    this.cardListSignal.set(null);
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
   * Gets the text representation of the current card list
   */
  getCardListText(): string | null {
    const cardList = this.currentCardList();
    if (!cardList) return null;

    return this.parser.serializeCardList(cardList);
  }

  /**
   * Saves card list text to localStorage
   */
  private saveToStorage(text: string): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, text);
    } catch (error) {
      console.error('Failed to save card list to localStorage:', error);
    }
  }

  /**
   * Loads card list from localStorage
   */
  private loadFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const savedText = localStorage.getItem(this.STORAGE_KEY);
      if (savedText) {
        this.parseAndSetCardList(savedText);
      }
    } catch (error) {
      console.error('Failed to load card list from localStorage:', error);
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
