import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MoxfieldApiService } from '../../core';

@Component({
  selector: 'app-deck-viewer',
  imports: [CommonModule, FormsModule],
  templateUrl: './deck-viewer.html',
  styleUrl: './deck-viewer.scss'
})
export class DeckViewer {
  protected readonly moxfield = inject(MoxfieldApiService);

  protected deckUrl = signal('');
  protected isLoadingDeck = signal(false);

  protected deck = computed(() => this.moxfield.currentDeck());
  protected stats = computed(() => this.moxfield.deckStats());
  protected error = computed(() => this.moxfield.error());

  // Helper computed properties
  protected totalPrice = computed(() => {
    const deck = this.deck();
    if (!deck) return null;

    let total = 0;
    let hasPrice = false;

    // Calculate total from mainboard
    Object.values(deck.mainboard.cards).forEach(entry => {
      const price = parseFloat(entry.card.prices.usd || '0');
      if (price > 0) {
        total += price * entry.quantity;
        hasPrice = true;
      }
    });

    // Add commanders
    Object.values(deck.commanders.cards).forEach(entry => {
      const price = parseFloat(entry.card.prices.usd || '0');
      if (price > 0) {
        total += price * entry.quantity;
        hasPrice = true;
      }
    });

    return hasPrice ? total : null;
  });

  protected colorIdentity = computed(() => {
    const deck = this.deck();
    if (!deck || deck.commanders.count === 0) return [];

    // Get color identity from commander
    const commanders = Object.values(deck.commanders.cards);
    if (commanders.length > 0) {
      return commanders[0].card.color_identity;
    }

    return [];
  });

  async loadDeck() {
    const url = this.deckUrl().trim();
    if (!url) return;

    this.isLoadingDeck.set(true);
    this.moxfield.clearError();

    try {
      await this.moxfield.getDeckById(url);
    } catch (error) {
      console.error('Error loading deck:', error);
    } finally {
      this.isLoadingDeck.set(false);
    }
  }

  clearDeck() {
    this.moxfield.clearDeck();
    this.deckUrl.set('');
  }

  protected getColorSymbol(color: string): string {
    const symbols: Record<string, string> = {
      W: '⚪',
      U: '🔵',
      B: '⚫',
      R: '🔴',
      G: '🟢'
    };
    return symbols[color] || color;
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  protected formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
}
