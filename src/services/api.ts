import { BACKEND_URL } from "@/config";
import { io, Socket } from "socket.io-client";

export interface OhlcvParams {
  exchangeId: string;
  symbol: string;
  timeframe: string;
  limit?: number;
  since?: number;
}

export type OhlcvCandle = [number, number, number, number, number, number]; // [timestamp, open, high, low, close, volume]

// REST API fetch
export async function fetchOhlcv({
  exchangeId,
  symbol,
  timeframe,
  limit,
  since,
}: OhlcvParams): Promise<OhlcvCandle[]> {
  const params = new URLSearchParams({ symbol, timeframe });
  if (limit) params.append("limit", String(limit));
  if (since) params.append("since", String(since));
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/ohlcv?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch OHLCV");
  return await res.json();
}

// WebSocket streaming
let socket: Socket | null = null;

export function getStreamingSocket(): Socket {
  if (socket) return socket;
  socket = io(`${BACKEND_URL}/streaming`);
  return socket;
}

// Generic version to support both OhlcvCandle and OhlcvWsMessage
export function watchOhlcv<T = OhlcvCandle>(
  socket: Socket,
  params: { exchangeId: string; symbol: string; timeframe: string },
  onCandle: (candle: T) => void
) {
  socket.emit("watchOhlcv", params);
  socket.on("ohlcv", onCandle);
  return () => {
    socket.emit("unWatchOhlcv", params);
    socket.off("ohlcv", onCandle);
  };
}

// Fetch list of exchanges
export async function fetchExchangesList(): Promise<string[]> {
  const url = `${BACKEND_URL}/exchanges/public/list`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch exchanges list");
  return await res.json();
}

// Fetch short-tickers for an exchange
export interface Ticker {
  symbol: string;
  last: number;
  change: number;
}

export async function fetchShortTickers(exchangeId: string): Promise<Ticker[]> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/short-tickers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch short-tickers");
  return await res.json();
}

// Fetch available timeframes for an exchange
export async function fetchTimeframes(
  exchangeId: string
): Promise<Record<string, string>> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/timeframes`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch timeframes");
  return await res.json();
}
