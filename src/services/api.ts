import { BACKEND_URL } from "@/config";
import { auth } from "@/services/firebase";
import {
  CcxtMarket,
  CcxtRequiredCredentials,
  CcxtTicker,
  ExchangeCredentialsDto,
  OhlcvCandle,
  OhlcvParams,
  ShortMarketDto,
} from "./types";

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

// Helper to wrap fetch with Firebase ID token authorization
async function authorizedFetchWithNotify(
  url: string,
  notify: (n: { message: string; severity?: string }) => void,
  options?: RequestInit
) {
  try {
    // Get current user's ID token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      const error = "User not authenticated";
      notify({ message: error, severity: "error" });
      throw new Error(error);
    }

    const idToken = await currentUser.getIdToken();

    // Add Authorization header
    const authorizedOptions: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${idToken}`,
      },
    };

    return fetchWithNotify(url, notify, authorizedOptions);
  } catch (err: any) {
    console.error(`❌ authorizedFetchWithNotify caught error:`, err);
    notify({
      message: err?.message || "Authentication error",
      severity: "error",
    });
    throw err;
  }
}

// Helper for private API calls (with auth)
async function privateApiCall<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const notify = (window as any).notify;

  if (notify) {
    return authorizedFetchWithNotify(url, notify, options);
  } else {
    // For non-notify case, we still need to handle auth
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    const idToken = await currentUser.getIdToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API call failed: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    if (!text) return null as T;

    try {
      return JSON.parse(text);
    } catch {
      return text as T;
    }
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
): Promise<CcxtTicker[]> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/short-tickers`;

  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } else {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
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

export async function fetchShortMarkets(
  exchangeId: string
): Promise<ShortMarketDto[]> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/short-markets`;
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } else {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch short-markets");
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

// Credential management APIs
export async function fetchRequiredCredentials(
  exchangeId: string
): Promise<CcxtRequiredCredentials> {
  const url = `${BACKEND_URL}/exchanges/public/${exchangeId}/required-credentials`;
  const notify = (window as any).notify;
  if (notify) {
    return fetchWithNotify(url, notify);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch required credentials");
    return await res.json();
  }
}

export async function createConnection(
  exchangeId: string,
  credentials: ExchangeCredentialsDto
): Promise<boolean> {
  const url = `${BACKEND_URL}/exchanges/private/connection`;
  const payload = {
    exchangeId,
    credentials,
  };

  return privateApiCall<boolean>(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
