/**
 * Moxfield API Type Definitions
 * Based on unofficial Moxfield API v2
 */

export interface MoxfieldDeck {
  id: string;
  name: string;
  description: string;
  format: string;
  visibility: string;
  publicUrl: string;
  publicId: string;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  areCommentsEnabled: boolean;
  isShared: boolean;
  authorsCanEdit: boolean;
  createdAtUtc: string;
  lastUpdatedAtUtc: string;
  mainboard: CardBoard;
  sideboard: CardBoard;
  maybeboard: CardBoard;
  commanders: CardBoard;
  companions: CardBoard;
  tokens: CardBoard;
  hubs: string[];
  authors: Author[];
}

export interface CardBoard {
  count: number;
  cards: Record<string, CardEntry>;
}

export interface CardEntry {
  quantity: number;
  boardType: BoardType;
  finish: CardFinish;
  isFoil: boolean;
  isAlter: boolean;
  isProxy: boolean;
  card: Card;
}

export interface Card {
  id: string;
  uniqueCardId: string;
  scrycardId: string;
  set: string;
  name: string;
  cn: string;
  layout: string;
  cmc: number;
  type: string;
  type_line: string;
  oracle_text: string;
  mana_cost: string;
  colors: string[];
  color_identity: string[];
  legalities: Record<string, Legality>;
  frame: string;
  reserved: boolean;
  digital: boolean;
  foil: boolean;
  nonfoil: boolean;
  etched: boolean;
  promo: boolean;
  reprint: boolean;
  set_name: string;
  set_type: string;
  rarity: Rarity;
  artist: string;
  edhrec_rank: number;
  multiverse_ids: number[];
  cardmarket_id: number;
  tcgplayer_id: number;
  cardkingdom_id: number;
  prices: CardPrices;
  image_uris: CardImageUris;
  default_finish: CardFinish;
}

export interface CardPrices {
  usd: string | null;
  usd_foil: string | null;
  usd_etched: string | null;
  eur: string | null;
  eur_foil: string | null;
  tix: string | null;
  cardmarket: string | null;
  cardkingdom: string | null;
  cardkingdom_foil: string | null;
}

export interface CardImageUris {
  small: string;
  normal: string;
  large: string;
  art_crop: string;
  border_crop: string;
  png: string;
}

export interface Author {
  userId: string;
  userName: string;
  displayName: string;
  profileImageUrl: string;
}

export type BoardType =
  | 'mainboard'
  | 'sideboard'
  | 'maybeboard'
  | 'commanders'
  | 'companions'
  | 'tokens';

export type CardFinish = 'nonfoil' | 'foil' | 'etched';

export type Legality = 'legal' | 'not_legal' | 'restricted' | 'banned';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus';

/**
 * Error response from Moxfield API
 */
export interface MoxfieldError {
  message: string;
  statusCode: number;
}

/**
 * Options for fetching a deck
 */
export interface GetDeckOptions {
  /**
   * Deck ID or full Moxfield URL
   * Examples:
   * - 'oEWXWHM5eEGMmopExLWRCA'
   * - 'https://moxfield.com/decks/oEWXWHM5eEGMmopExLWRCA'
   */
  deckId: string;
}
