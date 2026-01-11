import { Injectable } from '@angular/core';
import { CardList, CardListEntry, ParseResult } from '../models/card-list.model';

/**
 * Service for parsing card lists from text format
 *
 * Supports format: "quantity cardName" per line
 * Example:
 * 1 Lightning Bolt
 * 2 Forest
 * 1 Black Lotus
 */
@Injectable({
  providedIn: 'root'
})
export class CardListParserService {
  /**
   * Parses a card list from text input
   *
   * @param text - Text containing card list (one card per line)
   * @returns ParseResult with parsed cards or errors
   */
  parseCardList(text: string): ParseResult {
    const errors: string[] = [];
    const cards: CardListEntry[] = [];

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        cardList: null,
        errors: ['Card list is empty']
      };
    }

    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (line.length === 0) {
        continue;
      }

      // Parse line format: "quantity cardName"
      const match = line.match(/^(\d+)\s+(.+)$/);

      if (!match) {
        errors.push(`Line ${i + 1}: Invalid format - "${line}"`);
        continue;
      }

      const quantity = parseInt(match[1], 10);
      const name = match[2].trim();

      if (quantity <= 0) {
        errors.push(`Line ${i + 1}: Quantity must be positive`);
        continue;
      }

      if (name.length === 0) {
        errors.push(`Line ${i + 1}: Card name is empty`);
        continue;
      }

      cards.push({ quantity, name });
    }

    const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);

    const cardList: CardList = {
      cards,
      totalCards
    };

    return {
      success: errors.length === 0,
      cardList,
      errors
    };
  }

  /**
   * Converts a CardList back to text format
   *
   * @param cardList - CardList to convert
   * @returns Text representation
   */
  serializeCardList(cardList: CardList): string {
    return cardList.cards
      .map(card => `${card.quantity} ${card.name}`)
      .join('\n');
  }
}
