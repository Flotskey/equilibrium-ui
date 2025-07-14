import { BACKEND_URL } from "@/config";
import { io, Socket } from "socket.io-client";
import { OhlcvWsMessage, OrderBook, Ticker } from "./types";

let socket: Socket | null = null;

export function getStreamingSocket(): Socket {
  if (socket) return socket;
  socket = io(`${BACKEND_URL}/streaming`);
  return socket;
}

export function watchOhlcv(
  socket: Socket,
  params: { exchangeId: string; symbol: string; timeframe: string },
  onCandle: (candle: OhlcvWsMessage) => void
) {
  const watchTimeout = setTimeout(() => {
    socket.emit("watchOhlcv", params);
  }, 250);
  socket.on("ohlcv", onCandle);
  return () => {
    clearTimeout(watchTimeout);
    const unwatchTimeout = setTimeout(() => {
      socket.emit("unWatchOhlcv", params);
    }, 250);
    socket.off("ohlcv", onCandle);
    return () => clearTimeout(unwatchTimeout);
  };
}

export function watchOrderBook(
  socket: Socket,
  params: { exchangeId: string; symbol: string },
  onOrderBook: (orderBook: OrderBook) => void
) {
  const watchTimeout = setTimeout(() => {
    socket.emit("watchOrderBook", params);
  }, 250);
  socket.on("orderbook", onOrderBook);
  return () => {
    clearTimeout(watchTimeout);
    const unwatchTimeout = setTimeout(() => {
      socket.emit("unWatchOrderBook", params);
    }, 250);
    socket.off("orderbook", onOrderBook);
    return () => clearTimeout(unwatchTimeout);
  };
}

export function watchTicker(
  socket: Socket,
  params: { exchangeId: string; symbol: string },
  onTicker: (ticker: Ticker) => void
) {
  const watchTimeout = setTimeout(() => {
    socket.emit("watchTicker", params);
  }, 250);
  socket.on("ticker", onTicker);
  return () => {
    clearTimeout(watchTimeout);
    const unwatchTimeout = setTimeout(() => {
      socket.emit("unWatchTicker", params);
    }, 250);
    socket.off("ticker", onTicker);
    return () => clearTimeout(unwatchTimeout);
  };
}
