import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardListService, ScryfallCardData } from '../../core';

@Component({
  selector: 'app-deck-viewer',
  imports: [CommonModule, FormsModule],
  templateUrl: './deck-viewer.html',
  styleUrl: './deck-viewer.scss'
})
export class DeckViewer {
  protected readonly cardListService = inject(CardListService);
  private readonly http = inject(HttpClient);

  protected cardListText = signal('');
  protected editingIndex = signal<number | null>(null);
  protected editingName = signal('');
  protected selectedDeckIndices = signal<number[]>([]);

  protected cardLists = computed(() => this.cardListService.cardLists());
  protected allCommonCards = computed(() => this.cardListService.commonCards());
  protected commonCards = computed(() => {
    const selected = this.selectedDeckIndices();
    const allCards = this.allCommonCards();

    if (selected.length === 0) {
      return allCards;
    }

    if (selected.length === 1) {
      // Filter to only show cards that include the selected deck
      return allCards.filter(card => card.deckIndices.includes(selected[0]));
    }

    // 2 selected: show only cards in BOTH decks
    return allCards.filter(card =>
      card.deckIndices.includes(selected[0]) &&
      card.deckIndices.includes(selected[1])
    );
  });
  protected errors = computed(() => this.cardListService.errors());
  protected hasErrors = computed(() => this.cardListService.hasErrors());

  loadCardList() {
    const text = this.cardListText().trim();
    if (!text) return;

    this.cardListService.parseAndSetCardList(text);
    this.cardListText.set('');
  }

  clearAllCardLists() {
    this.cardListService.clearCardList();
    this.cardListText.set('');
  }

  removeDeck(index: number) {
    this.cardListService.removeCardList(index);
    const current = this.selectedDeckIndices();
    // Remove the deck from selection if present, and adjust indices for decks after it
    const updated = current
      .filter(i => i !== index)
      .map(i => i > index ? i - 1 : i);
    this.selectedDeckIndices.set(updated);
  }

  selectDeck(index: number) {
    const current = this.selectedDeckIndices();
    if (current.includes(index)) {
      // Deselect
      this.selectedDeckIndices.set(current.filter(i => i !== index));
    } else if (current.length < 2) {
      // Select (max 2)
      this.selectedDeckIndices.set([...current, index]);
    }
    // If already 2 selected and clicking a third, do nothing
  }

  isSelected(index: number): boolean {
    return this.selectedDeckIndices().includes(index);
  }

  isDisabled(index: number): boolean {
    const selected = this.selectedDeckIndices();
    return !selected.includes(index) && selected.length >= 2;
  }

  clearSelection() {
    this.selectedDeckIndices.set([]);
  }

  clearErrors() {
    this.cardListService.clearErrors();
  }

  toggleCollapse(index: number) {
    this.cardListService.toggleCollapse(index);
  }

  startEditingName(index: number) {
    const lists = this.cardLists();
    if (index >= 0 && index < lists.length) {
      this.editingName.set(lists[index].name);
      this.editingIndex.set(index);
    }
  }

  saveName() {
    const index = this.editingIndex();
    const newName = this.editingName().trim();
    if (index !== null && newName) {
      this.cardListService.updateName(index, newName);
    }
    this.editingIndex.set(null);
  }

  cancelEdit() {
    this.editingIndex.set(null);
    this.editingName.set('');
  }

  isEditing(index: number): boolean {
    return this.editingIndex() === index;
  }

  // Download card list as text file
  downloadCardList(index: number) {
    const text = this.cardListService.getCardListText(index);
    if (!text) return;

    const lists = this.cardLists();
    const deckName = lists[index]?.name || 'card-list';

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deckName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Shutdown the local server
  shutdownServer() {
    if (confirm('Are you sure you want to shut down the server?')) {
      this.http.post('/api/shutdown', {}).subscribe({
        next: () => {
          alert('Server shutting down...');
        },
        error: () => {
          // Server already shut down, that's expected
        }
      });
    }
  }

  // Get Scryfall data for a card by name
  getCardData(cardName: string): ScryfallCardData | undefined {
    return this.cardListService.getCardData(cardName);
  }
}
