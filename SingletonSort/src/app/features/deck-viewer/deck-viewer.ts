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

  protected cardList = computed(() => this.cardListService.currentCardList());
  protected errors = computed(() => this.cardListService.errors());
  protected hasErrors = computed(() => this.cardListService.hasErrors());

  loadCardList() {
    const text = this.cardListText().trim();
    if (!text) return;

    this.cardListService.parseAndSetCardList(text);
  }

  clearCardList() {
    this.cardListService.clearCardList();
    this.cardListText.set('');
  }

  clearErrors() {
    this.cardListService.clearErrors();
  }

  // Download card list as text file
  downloadCardList() {
    const text = this.cardListService.getCardListText();
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'card-list.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}
