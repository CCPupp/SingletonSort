/**
 * Simple card list models
 */

export interface ScryfallCardData {
  name: string;
  imageUriSmall: string | null;   // For sidebar thumbnails
  imageUriNormal: string | null;  // For main grid display
  oracleText: string | null;
  manaCost: string | null;
  typeLine: string | null;
  error?: string;
}

export interface CardListEntry {
  quantity: number;
  name: string;
  scryfallData?: ScryfallCardData;
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

export interface CollectionEntry {
  cardName: string;
  ownedBy: string | null; // deck name that currently has this card physically
}
