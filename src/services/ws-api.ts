import { BACKEND_URL } from "@/config";
import { getAuth } from "firebase/auth";
import { io, Socket } from "socket.io-client";
import {
  CcxtOrder,
  CcxtPosition,
  CcxtTicker,
  OhlcvWsMessage,
  OrderBook,
} from "./types";

let socket: Socket | null = null;
let privateSocket: Socket | null = null;

export function getStreamingSocket(): Socket {
  if (socket) return socket;
  socket = io(`${BACKEND_URL}/streaming`);
  return socket;
}

export async function getPrivateStreamingSocket(): Promise<Socket> {
  if (privateSocket) return privateSocket;

  // Get Firebase auth instance
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No authenticated user found. Please sign in first.");
  }

  // Get the ID token for authentication
  const idToken = await currentUser.getIdToken();

  // Create socket with authorization header
  privateSocket = io(`${BACKEND_URL}/private-streaming`, {
    auth: {
      token: idToken,
    },
  });

  return privateSocket;
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
  onTicker: (ticker: CcxtTicker) => void
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

export function watchOrders(
  socket: Socket,
  params: { exchangeId: string; symbol?: string },
  onOrders: (orders: CcxtOrder[]) => void
) {
  const watchTimeout = setTimeout(() => {
    socket.emit("watchOrders", params);
  }, 250);
  socket.on("orders", onOrders);
  return () => {
    clearTimeout(watchTimeout);
    const unwatchTimeout = setTimeout(() => {
      socket.emit("unWatchOrders", params);
    }, 250);
    socket.off("orders", onOrders);
    return () => clearTimeout(unwatchTimeout);
  };
}

export function watchPositions(
  socket: Socket,
  params: { exchangeId: string; symbol?: string },
  onPositions: (positions: CcxtPosition[]) => void
) {
  const watchTimeout = setTimeout(() => {
    socket.emit("watchPositions", params);
  }, 250);
  socket.on("positions", onPositions);
  return () => {
    clearTimeout(watchTimeout);
    const unwatchTimeout = setTimeout(() => {
      socket.emit("unWatchPositions", params);
    }, 250);
    socket.off("positions", onPositions);
    return () => clearTimeout(unwatchTimeout);
  };
}
