export interface OhlcvWsMessage {
  candle: [number, number, number, number, number, number];
  closed: boolean;
}

export interface OrderBook {
  asks: [number, number][];
  bids: [number, number][];
  datetime: string;
  timestamp: number;
  nonce: number;
  symbol: string;
}

export interface OhlcvParams {
  exchangeId: string;
  symbol: string;
  timeframe: string;
  limit?: number;
  since?: number;
}

export type OhlcvCandle = [number, number, number, number, number, number]; // [timestamp, open, high, low, close, volume]

export interface CcxtMarket {
  id: string;
  symbol: string;
  base: string;
  quote: string;
  baseId: string;
  quoteId: string;
  active: boolean;
  type: "spot" | "margin" | "swap" | "future" | "option" | string;
  spot: boolean;
  margin: boolean;
  swap: boolean;
  future: boolean;
  option: boolean;
  contract: boolean;
  settle?: string;
  settleId?: string;
  contractSize?: number;
  linear?: boolean;
  inverse?: boolean;
  expiry?: number;
  expiryDatetime?: string;
  strike?: number;
  optionType?: "call" | "put";
  taker: number;
  maker: number;
  percentage?: boolean;
  tierBased?: boolean;
  feeSide?: "get" | "give" | "base" | "quote" | "other";
  precision: {
    price: number;
    amount: number;
    cost?: number;
  };
  limits: {
    amount: { min?: number; max?: number };
    price?: { min?: number; max?: number };
    cost?: { min?: number; max?: number };
    leverage?: { min?: number; max?: number };
  };
  info: Record<string, any>;
}

export interface CcxtTicker {
  symbol: string;
  info: any;
  timestamp: number;
  datetime: string;
  high: number;
  low: number;
  bid: number;
  bidVolume: number;
  ask: number;
  askVolume: number;
  vwap: number;
  open: number;
  close: number;
  last: number;
  previousClose: number;
  change: number;
  percentage: number;
  average: number;
  quoteVolume: number;
  baseVolume: number;
  indexPrice: number;
  markPrice: number;
}

export interface ShortMarketDto {
  symbol: string;
}

// Auth and Encryption Types
export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

export interface EncryptedCredentials {
  exchangeId: string;
  encryptedData: string;
  iv: string;
  salt: string;
  createdAt: number;
  updatedAt: number;
}
