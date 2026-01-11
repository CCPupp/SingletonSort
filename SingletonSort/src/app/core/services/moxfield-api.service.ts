import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GetDeckOptions, MoxfieldDeck, MoxfieldError } from '../models/moxfield.model';

/**
 * Service for interacting with the unofficial Moxfield API
 *
 * Note: This API is unofficial and may change without notice.
 * Moxfield's terms of service prohibit scraping. Use responsibly.
 *
 * @example
 * ```typescript
 * const moxfieldService = inject(MoxfieldApiService);
 *
 * // Fetch a deck
 * await moxfieldService.getDeckById('oEWXWHM5eEGMmopExLWRCA');
 *
 * // Access state
 * console.log(moxfieldService.currentDeck());
 * console.log(moxfieldService.isLoading());
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class MoxfieldApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://api2.moxfield.com';

  // State management with signals
  private readonly deckSignal = signal<MoxfieldDeck | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<MoxfieldError | null>(null);

  // Public readonly signals
  readonly currentDeck = this.deckSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // Computed signals
  readonly hasError = computed(() => this.error() !== null);
  readonly hasDeck = computed(() => this.currentDeck() !== null);

  // Deck statistics (computed from current deck)
  readonly deckStats = computed(() => {
    const deck = this.currentDeck();
    if (!deck) return null;

    return {
      totalCards: deck.mainboard.count,
      sideboardCards: deck.sideboard.count,
      maybeboardCards: deck.maybeboard.count,
      commanderCount: deck.commanders.count,
      companionCount: deck.companions.count
    };
  });

  /**
   * Fetches a deck by ID from Moxfield
   *
   * @param deckId - Deck ID or full Moxfield URL
   * @returns Promise resolving to the deck data
   *
   * @example
   * ```typescript
   * // Using just the ID
   * const deck = await service.getDeckById('oEWXWHM5eEGMmopExLWRCA');
   *
   * // Using full URL
   * const deck = await service.getDeckById('https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA');
   * ```
   */
  async getDeckById(deckId: string): Promise<MoxfieldDeck> {
    const cleanId = this.extractDeckId(deckId);

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const deck = await firstValueFrom(
        this.http.get<MoxfieldDeck>(`${this.baseUrl}/v2/decks/all/${cleanId}`)
      );

      this.deckSignal.set(deck);
      return deck;
    } catch (error) {
      const moxfieldError = this.handleError(error);
      this.errorSignal.set(moxfieldError);
      throw moxfieldError;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Fetches a deck by ID with options
   *
   * @param options - Options including deck ID
   * @returns Promise resolving to the deck data
   */
  async getDeck(options: GetDeckOptions): Promise<MoxfieldDeck> {
    return this.getDeckById(options.deckId);
  }

  /**
   * Clears the current deck from state
   */
  clearDeck(): void {
    this.deckSignal.set(null);
    this.errorSignal.set(null);
  }

  /**
   * Clears the current error
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  /**
   * Extracts deck ID from a full Moxfield URL or returns the ID as-is
   *
   * @param deckIdOrUrl - Deck ID or full Moxfield URL
   * @returns Clean deck ID
   *
   * @example
   * ```typescript
   * extractDeckId('https://moxfield.com/decks/abc123') // returns 'abc123'
   * extractDeckId('abc123') // returns 'abc123'
   * ```
   */
  private extractDeckId(deckIdOrUrl: string): string {
    // Check if it's a URL
    if (deckIdOrUrl.includes('moxfield.com/decks/')) {
      const parts = deckIdOrUrl.split('/decks/');
      return parts[parts.length - 1].split(/[?#]/)[0]; // Remove query params and hash
    }

    // Already a clean ID
    return deckIdOrUrl;
  }

  /**
   * Handles HTTP errors and converts them to MoxfieldError
   */
  private handleError(error: unknown): MoxfieldError {
    if (error instanceof HttpErrorResponse) {
      return {
        message: error.error?.message || error.message || 'An error occurred while fetching deck data',
        statusCode: error.status
      };
    }

    return {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 0
    };
  }
}
