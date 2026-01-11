/**
 * Simple card list models
 */

export interface CardListEntry {
  quantity: number;
  name: string;
}

export interface CardList {
  cards: CardListEntry[];
  totalCards: number;
}

export interface ParseResult {
  success: boolean;
  cardList: CardList | null;
  errors: string[];
}
