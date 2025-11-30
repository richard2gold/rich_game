
export enum TileType {
  PROPERTY = 'PROPERTY',
  START = 'START',
  CHANCE = 'CHANCE',
  JAIL = 'JAIL',
  BANK = 'BANK', // Get instant cash
  TAX = 'TAX',
  SHOP = 'SHOP', // New type for distinct visuals
  PARK = 'PARK', // Resting spot
}

export interface TileData {
  id: number;
  name: string;
  type: TileType;
  x: number; // Pixel Coordinate X
  y: number; // Pixel Coordinate Y
  next: number[]; // Array of next tile IDs (supports branching)
  price?: number; // Base purchase price
  rent?: number; // Base rent
  ownerId?: number | null; // ID of player who owns it
  level: number; // 0 = empty, 1-3 = houses, 4 = hotel
  color?: string; // Visual grouping
  description?: string;
  district?: string; // e.g., "Huangpu", "Pudong"
}

export interface Character {
  id: number;
  name: string;
  avatar: string; // Emoji or URL
  color: string;
  desc: string;
  iq: number; // Affects AI decision making
  charm: number; // Affects chance events
  luck: number; // Affects dice and fate
  isAI: boolean;
  catchphrase: string;
}

export interface Player extends Character {
  money: number;
  position: number; // Tile index
  isBankrupt: boolean;
  isJailed: number; // Turns remaining in jail
  properties: number[]; // Array of Tile IDs
  netWorth: number; // Money + Property Value
}

export type GlobalEventTarget = 'ALL' | 'POOR' | 'RICH' | 'LANDLORDS' | 'ODD_ID';

export interface GameState {
  players: Player[];
  tiles: TileData[];
  currentPlayerIndex: number;
  turnCount: number;
  gameStatus: 'SETUP' | 'SELECT_CHARACTER' | 'PLAYING' | 'WAITING_FOR_DIRECTION' | 'GAME_OVER';
  lastDiceRoll: number | null;
  remainingSteps: number; // Steps left after direction choice
  isMoving: boolean;
  pendingAction: 'NONE' | 'BUY_DECISION' | 'EVENT_PROCESSING' | 'SHOWING_EVENT';
  logs: GameLogEntry[];
  winner: Player | null;
}

export interface GameLogEntry {
  id: string;
  text: string;
  type: 'INFO' | 'DANGER' | 'SUCCESS' | 'EVENT' | 'BLACK_SWAN';
}
