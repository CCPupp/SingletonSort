import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CardListService } from '../../core';

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
  protected selectedDeckIndex = signal<number | null>(null);

  protected cardLists = computed(() => this.cardListService.cardLists());
  protected allCommonCards = computed(() => this.cardListService.commonCards());
  protected commonCards = computed(() => {
    const selected = this.selectedDeckIndex();
    const allCards = this.allCommonCards();

    if (selected === null) {
      return allCards;
    }

    // Filter to only show cards that include the selected deck
    return allCards.filter(card => card.deckIndices.includes(selected));
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
    // Clear selection if removing the selected deck
    if (this.selectedDeckIndex() === index) {
      this.selectedDeckIndex.set(null);
    } else if (this.selectedDeckIndex() !== null && this.selectedDeckIndex()! > index) {
      // Adjust selection index if a deck before it was removed
      this.selectedDeckIndex.set(this.selectedDeckIndex()! - 1);
    }
  }

  selectDeck(index: number) {
    // Toggle selection - if already selected, deselect
    if (this.selectedDeckIndex() === index) {
      this.selectedDeckIndex.set(null);
    } else {
      this.selectedDeckIndex.set(index);
    }
  }

  isSelected(index: number): boolean {
    return this.selectedDeckIndex() === index;
  }

  clearSelection() {
    this.selectedDeckIndex.set(null);
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
}
