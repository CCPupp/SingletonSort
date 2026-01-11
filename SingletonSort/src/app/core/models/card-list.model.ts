/**
 * Simple card list models
 */

export interface CardListEntry {
  quantity: number;
  name: string;
}

export interface CardList {
  name: string;
  cards: CardListEntry[];
  totalCards: number;
  isCollapsed?: boolean;
}

export interface ParseResult {
  success: boolean;
  cardList: CardList | null;
  errors: string[];
}
