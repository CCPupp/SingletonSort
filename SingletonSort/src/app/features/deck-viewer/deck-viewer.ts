import { Component, signal, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CardListService } from '../../core';

@Component({
  selector: 'app-deck-viewer',
  imports: [CommonModule, FormsModule],
  templateUrl: './deck-viewer.html',
  styleUrl: './deck-viewer.scss'
})
export class DeckViewer {
  protected readonly cardListService = inject(CardListService);

  protected cardListText = signal('');
  protected editingIndex = signal<number | null>(null);
  protected editingName = signal('');

  protected cardLists = computed(() => this.cardListService.cardLists());
  protected commonCards = computed(() => this.cardListService.commonCards());
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
}
