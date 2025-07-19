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

export interface CcxtRequiredCredentials {
  apiKey: boolean;
  secret: boolean;
  uid: boolean;
  login: boolean;
  password: boolean;
  twofa: boolean;
  privateKey: boolean;
  walletAddress: boolean;
  token: boolean;
}

export interface ExchangeCredentialsDto {
  apiKey?: string;
  secret?: string;
  uid?: string;
  login?: string;
  password?: string;
  twofa?: string;
  privateKey?: string;
  walletAddress?: string;
  token?: string;
}

export interface CreateConnectionDto {
  exchangeId: string;
  credentials: ExchangeCredentialsDto;
}

export interface CreateOrderDto {
  exchangeId: string;
  symbol: string;
  type: string;
  side: string;
  amount: number;
  price?: number;
  params?: Record<string, any>;
}

export interface CcxtOrder {
  id: string;
  clientOrderId?: string;
  datetime: string;
  timestamp: number;
  lastTradeTimestamp?: number;
  status: "open" | "closed" | "canceled" | "expired" | "rejected";
  symbol: string;
  type: "market" | "limit" | string;
  timeInForce?: "GTC" | "IOC" | "FOK" | "PO";
  side: "buy" | "sell";
  price: number;
  average?: number;
  amount: number;
  filled: number;
  remaining: number;
  cost: number;
  trades?: CcxtTrade[];
  fee?: CcxtFee;
  info: any;
}

export interface CcxtTrade {
  info: any;
  amount: number;
  datetime: number;
  id: string;
  order: string;
  price: number;
  timestamp: number;
  type: string;
  side: "buy" | "sell" | string;
  symbol: string;
  takerOrMaker: "taker" | "maker" | string;
  cost: number;
  fee: CcxtFee;
}

export interface CcxtFee {
  currency: string;
  cost: number;
  rate?: number;
}

export interface CcxtPosition {
  symbol: string;
  id?: string;
  info: any;
  timestamp?: number;
  datetime?: string;
  contracts?: number;
  contractSize?: number;
  side: "buy" | "sell";
  notional?: number;
  leverage?: number;
  unrealizedPnl?: number;
  realizedPnl?: number;
  collateral?: number;
  entryPrice?: number;
  markPrice?: number;
  liquidationPrice?: number;
  marginMode?: "isolated" | "cross";
  hedged?: boolean;
  maintenanceMargin?: number;
  maintenanceMarginPercentage?: number;
  initialMargin?: number;
  initialMarginPercentage?: number;
  marginRatio?: number;
  lastUpdateTimestamp?: number;
  lastPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  percentage?: number;
}
