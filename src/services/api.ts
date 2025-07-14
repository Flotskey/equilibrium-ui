import { BACKEND_URL } from "@/config";
import { CcxtMarket, OhlcvCandle, OhlcvParams, Ticker } from "./types";

// Helper to wrap fetch and show notification on error
async function fetchWithNotify(
  url: string,
  notify: (n: { message: string; severity?: string }) => void
) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      let errMsg = res.statusText;
      try {
        // Try to parse error body as JSON, but handle empty/invalid JSON
        const text = await res.text();
        let err: any = {};
        try {
          err = JSON.parse(text);
        } catch {
          // Not JSON, maybe plain text
          err = { message: text };
        }
        if (typeof err.message === "string") {
          errMsg = err.message;
        } else if (err.message && typeof err.message === "object") {
          errMsg =
            err.message.message ||
            err.message.error ||
            JSON.stringify(err.message);
        } else if (err.error) {
          errMsg = err.error;
        }
      } catch {}
      notify({ message: errMsg, severity: "error" });
      throw new Error(errMsg);
    }
    // Try to parse success body as JSON, but handle empty/invalid JSON
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (err: any) {
    notify({ message: err?.message || "Unknown error", severity: "error" });
    throw err;
  }
}

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
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch OHLCV");
    return await res.json();
  }
}

// Fetch list of exchanges
export async function fetchExchangesList(): Promise<string[]> {
  const notify = (window as any).notify;
  const url = `${BACKEND_URL}/exchanges/public/list`;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch exchanges list");
    return await res.json();
  }
}

export async function fetchShortTickers(exchangeId: string): Promise<Ticker[]> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/short-tickers`;
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch short-tickers");
    return await res.json();
  }
}

// Fetch available timeframes for an exchange
export async function fetchTimeframes(
  exchangeId: string
): Promise<Record<string, string>> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/timeframes`;
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch timeframes");
    return await res.json();
  }
}

export async function fetchMarket(
  exchangeId: string,
  symbol: string
): Promise<CcxtMarket> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/market/${encodeURIComponent(
    symbol
  )}`;
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch market info");
    return await res.json();
  }
}
