import { BACKEND_URL } from "@/config";
import { CcxtMarket, OhlcvCandle, OhlcvParams, Ticker } from "./types";

// Helper to wrap fetch and show notification on error
async function fetchWithNotify(
  url: string,
  notify: (n: { message: string; severity?: string }) => void,
  options?: RequestInit
) {
  try {
    const res = await fetch(url, options);

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
      console.error(`❌ fetchWithNotify error:`, errMsg);
      notify({ message: errMsg, severity: "error" });
      throw new Error(errMsg);
    }
    // Try to parse success body as JSON, but handle empty/invalid JSON
    const text = await res.text();

    if (!text) {
      console.warn(`⚠️ Empty response text`);
      return null;
    }

    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.warn(`⚠️ Failed to parse JSON, returning text:`, parseError);
      return text;
    }
  } catch (err: any) {
    console.error(`❌ fetchWithNotify caught error:`, err);
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

export async function fetchShortTickers(
  exchangeId: string,
  body?: Record<string, any>
): Promise<Ticker[]> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/short-tickers`;

  // Prepare request body
  let requestBody: Record<string, any> | undefined;

  // костыль для bybit
  if (exchangeId === "bybit") {
    requestBody = { category: "spot" };
  } else if (body) {
    requestBody = body;
  }

  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
  } else {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ Error response for ${exchangeId}:`, errorText);
      throw new Error(
        `Failed to fetch short-tickers: ${res.status} ${res.statusText}`
      );
    }

    const data = await res.json();
    return data;
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
