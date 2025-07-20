import { BACKEND_URL } from "@/config";
import { getAuth } from "firebase/auth";
import { io, Socket } from "socket.io-client";
import {
  CcxtBalances,
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

/**
 * Wait for socket to be connected
 */
async function waitForSocketConnection(socket: Socket): Promise<void> {
  if (socket.connected) {
    return;
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Socket connection timeout"));
    }, 10000); // 10 second timeout

    if (socket.connected) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    socket.once("connect", () => {
      clearTimeout(timeout);
      resolve();
    });

    socket.once("connect_error", (error) => {
      clearTimeout(timeout);
      reject(new Error(`Socket connection failed: ${error.message}`));
    });
  });
}

export async function watchOhlcv(
  socket: Socket,
  params: { exchangeId: string; symbol: string; timeframe: string },
  onCandle: (candle: OhlcvWsMessage) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("📊 [WS] Watching OHLCV:", params);
    socket.emit("watchOhlcv", params);
    socket.on("ohlcv", onCandle);

    return () => {
      console.log("📊 [WS] Unwatching OHLCV:", params);
      socket.emit("unWatchOhlcv", params);
      socket.off("ohlcv", onCandle);
    };
  } catch (error) {
    console.error("📊 [WS] Failed to watch OHLCV:", error);
    throw error;
  }
}

export async function watchOrderBook(
  socket: Socket,
  params: { exchangeId: string; symbol: string },
  onOrderBook: (orderBook: OrderBook) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("📚 [WS] Watching OrderBook:", params);
    socket.emit("watchOrderBook", params);
    socket.on("orderbook", onOrderBook);

    return () => {
      console.log("📚 [WS] Unwatching OrderBook:", params);
      socket.emit("unWatchOrderBook", params);
      socket.off("orderbook", onOrderBook);
    };
  } catch (error) {
    console.error("📚 [WS] Failed to watch OrderBook:", error);
    throw error;
  }
}

export async function watchTicker(
  socket: Socket,
  params: { exchangeId: string; symbol: string },
  onTicker: (ticker: CcxtTicker) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("📈 [WS] Watching Ticker:", params);
    socket.emit("watchTicker", params);
    socket.on("ticker", onTicker);

    return () => {
      console.log("📈 [WS] Unwatching Ticker:", params);
      socket.emit("unWatchTicker", params);
      socket.off("ticker", onTicker);
    };
  } catch (error) {
    console.error("📈 [WS] Failed to watch Ticker:", error);
    throw error;
  }
}

export async function watchOrders(
  socket: Socket,
  params: { exchangeId: string; symbol?: string },
  onOrders: (orders: CcxtOrder[]) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("📋 [WS] Watching Orders:", params);
    socket.emit("watchOrders", params);
    socket.on("orders", onOrders);

    return () => {
      console.log("📋 [WS] Unwatching Orders:", params);
      socket.emit("unWatchOrders", params);
      socket.off("orders", onOrders);
    };
  } catch (error) {
    console.error("📋 [WS] Failed to watch Orders:", error);
    throw error;
  }
}

export async function watchPositions(
  socket: Socket,
  params: { exchangeId: string; symbol?: string },
  onPositions: (positions: CcxtPosition[]) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("💰 [WS] Watching Positions:", params);
    socket.emit("watchPositions", params);
    socket.on("positions", onPositions);

    return () => {
      console.log("💰 [WS] Unwatching Positions:", params);
      socket.emit("unWatchPositions", params);
      socket.off("positions", onPositions);
    };
  } catch (error) {
    console.error("💰 [WS] Failed to watch Positions:", error);
    throw error;
  }
}

export async function watchBalance(
  socket: Socket,
  params: { exchangeId: string },
  onBalance: (balance: CcxtBalances) => void
): Promise<() => void> {
  try {
    await waitForSocketConnection(socket);

    console.log("💳 [WS] Watching Balance:", params);
    socket.emit("watchBalance", params);
    socket.on("balance", onBalance);

    return () => {
      console.log("💳 [WS] Unwatching Balance:", params);
      socket.emit("unWatchBalance", params);
      socket.off("balance", onBalance);
    };
  } catch (error) {
    console.error("💳 [WS] Failed to watch Balance:", error);
    throw error;
  }
}
