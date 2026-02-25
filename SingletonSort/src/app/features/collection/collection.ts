import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CollectionService, CollectionCard } from '../../core';
import { CardListService } from '../../core';

@Component({
  selector: 'app-collection',
  imports: [CommonModule, RouterLink],
  templateUrl: './collection.html',
  styleUrl: './collection.scss'
})
export class Collection {
  protected readonly collectionService = inject(CollectionService);
  protected readonly cardListService = inject(CardListService);

  protected showSharedOnly = signal(true);
  protected selectedType = signal<string>('All');

  protected cardLists = computed(() => this.cardListService.cardLists());
  protected deckNames = computed(() => this.collectionService.deckNames());

  protected totalUniqueCards = computed(() => this.collectionService.collectionCards().length);
  protected sharedCardCount = computed(() => {
    const cards = this.collectionService.collectionCards();
    let count = 0;
    for (const c of cards) { if (c.deckNames.length >= 2) count++; }
    return count;
  });
  protected assignedCount = computed(() => {
    const assignments = this.collectionService.assignments();
    let count = 0;
    for (const a of assignments) { if (a.ownedBy !== null) count++; }
    return count;
  });

  protected filteredCards = computed(() => {
    const cards = this.collectionService.collectionCards();
    const sharedOnly = this.showSharedOnly();
    const type = this.selectedType();

    return cards.filter(card => {
      if (sharedOnly && card.deckNames.length < 2) return false;
      if (type !== 'All' && this.getCardType(card) !== type) return false;
      return true;
    });
  });

  protected readonly CARD_TYPES = [
    'All', 'Creatures', 'Planeswalkers', 'Instants', 'Sorceries',
    'Artifacts', 'Enchantments', 'Lands', 'Battles', 'Other'
  ];

  getCardType(card: CollectionCard): string {
    return this.collectionService.getCardType(card.typeLine);
  }

  toggleDeckAssignment(cardName: string, deckName: string, currentDeck: string | null): void {
    const newDeck = currentDeck === deckName ? null : deckName;
    this.collectionService.assignCard(cardName, newDeck);
  }

  getStatusClass(card: CollectionCard): string {
    if (card.currentDeck === null) {
      return card.deckNames.length > 1 ? 'status-conflict' : 'status-unassigned';
    }
    return 'status-assigned';
  }

  getStatusTitle(card: CollectionCard): string {
    if (card.currentDeck === null) {
      return card.deckNames.length > 1
        ? `Wanted by ${card.deckNames.length} decks — not yet assigned`
        : 'Not yet assigned to a deck';
    }
    return `Currently in: ${card.currentDeck}`;
  }

  isTypeStart(index: number): boolean {
    const cards = this.filteredCards();
    if (index === 0) return true;
    return this.getCardType(cards[index]) !== this.getCardType(cards[index - 1]);
  }

  toggleSharedOnly(): void {
    this.showSharedOnly.update(v => !v);
  }
}
