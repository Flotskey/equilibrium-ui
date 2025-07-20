import { fetchBalance } from "@/services/api";
import { CcxtBalances } from "@/services/types";
import { getPrivateStreamingSocket, watchBalance } from "@/services/ws-api";
import { useCredentialsStore } from "@/store/credentialsStore";
import { useEffect, useState } from "react";

interface UseBalanceProps {
  exchangeId: string | null;
}

export const useBalance = ({ exchangeId }: UseBalanceProps) => {
  const [balance, setBalance] = useState<CcxtBalances | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscribed, setHasSubscribed] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Get connection status from credentials store
  const { connectionStatus } = useCredentialsStore();

  useEffect(() => {
    if (!exchangeId) {
      setBalance(null);
      setError(null);
      setHasSubscribed(false);
      setHasInitialData(false);
      return;
    }

    // Check if connection is established for this exchange
    const isConnected = connectionStatus[exchangeId];

    if (!isConnected) {
      console.log(
        `Balance subscription skipped - no connection for ${exchangeId}`
      );
      setBalance(null);
      setLoading(false);
      setError(null);
      setHasSubscribed(false);
      setHasInitialData(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let loadingTimeout: NodeJS.Timeout | null = null;

    const setupBalanceWatching = async () => {
      try {
        setLoading(true);
        setError(null);
        setHasSubscribed(false);
        setHasInitialData(false);
        console.log(`Setting up balance subscription for ${exchangeId}`);

        // First, fetch initial balance data via REST API
        try {
          console.log(
            `Fetching initial balance for ${exchangeId} via REST API`
          );
          const initialBalance = await fetchBalance(exchangeId);
          console.log(
            `Received initial balance for ${exchangeId}:`,
            initialBalance
          );
          setBalance(initialBalance);
          setHasInitialData(true);
        } catch (fetchError) {
          console.warn(
            `Failed to fetch initial balance for ${exchangeId}:`,
            fetchError
          );
          // Continue with WebSocket subscription even if REST fetch fails
        }

        const socket = await getPrivateStreamingSocket();

        unsubscribe = await watchBalance(
          socket,
          { exchangeId },
          (newBalance: CcxtBalances) => {
            console.log(
              `Received balance update for ${exchangeId}:`,
              newBalance
            );
            setBalance(newBalance);
            setLoading(false);
            setHasSubscribed(true);
            if (loadingTimeout) {
              clearTimeout(loadingTimeout);
              loadingTimeout = null;
            }
          }
        );

        setHasSubscribed(true);

        // Stop loading after 3 seconds if no WebSocket data received
        // Some exchanges only send balance updates on changes, not on initial subscription
        loadingTimeout = setTimeout(() => {
          console.log(
            `Balance loading timeout for ${exchangeId} - no WebSocket data received`
          );
          setLoading(false);
        }, 250);
      } catch (err) {
        console.error("Failed to setup balance watching:", err);
        setError(err instanceof Error ? err.message : "Failed to load balance");
        setLoading(false);
        setHasSubscribed(false);
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
          loadingTimeout = null;
        }
      }
    };

    setupBalanceWatching();

    return () => {
      if (unsubscribe) {
        console.log(`Cleaning up balance subscription for ${exchangeId}`);
        unsubscribe();
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
    };
  }, [exchangeId, connectionStatus]);

  // Helper function to get free balance for a specific currency
  const getFreeBalance = (currency: string): number => {
    if (!balance || !balance[currency]) {
      return 0;
    }
    return balance[currency].free;
  };

  return {
    balance,
    loading,
    error,
    hasSubscribed,
    hasInitialData,
    getFreeBalance,
  };
};
