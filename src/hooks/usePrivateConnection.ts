import { useCredentialsStore } from "@/store/credentialsStore";
import { useEffect } from "react";

interface UsePrivateConnectionOptions {
  exchangeId: string | null;
  enabled?: boolean;
}

/**
 * Custom hook to manage private WebSocket connection refresh for a specific exchange.
 * Handles starting and stopping connection refresh based on credential availability.
 *
 * @param options - Configuration options for the connection
 * @param options.exchangeId - The exchange ID to manage connection for
 * @param options.enabled - Whether the connection should be enabled (defaults to true)
 */
export const usePrivateConnection = ({
  exchangeId,
  enabled = true,
}: UsePrivateConnectionOptions) => {
  const {
    credentialsMap,
    connectionStatus,
    checkCredentials,
    setHasCredentials,
    startConnectionRefresh,
    stopConnectionRefresh,
  } = useCredentialsStore();

  const hasCredentials = exchangeId
    ? credentialsMap[exchangeId] || false
    : false;
  const isConnected = exchangeId
    ? connectionStatus[exchangeId] || false
    : false;

  // Check if credentials exist for the selected exchange
  useEffect(() => {
    if (exchangeId && enabled) {
      const hasCreds = checkCredentials(exchangeId);
      if (hasCreds !== hasCredentials) {
        setHasCredentials(exchangeId, hasCreds);
      }
    }
  }, [
    exchangeId,
    enabled,
    checkCredentials,
    setHasCredentials,
    hasCredentials,
  ]);

  // Start connection refresh when credentials are available
  useEffect(() => {
    if (exchangeId && enabled) {
      if (hasCredentials) {
        console.log(
          `usePrivateConnection: Starting connection refresh for ${exchangeId}`
        );
        startConnectionRefresh(exchangeId);
      } else {
        console.log(
          `usePrivateConnection: Stopping connection refresh for ${exchangeId}`
        );
        stopConnectionRefresh(exchangeId);
      }
    }

    // Cleanup on unmount or when exchange changes
    return () => {
      if (exchangeId && enabled) {
        console.log(
          `usePrivateConnection: Cleanup - stopping connection refresh for ${exchangeId}`
        );
        stopConnectionRefresh(exchangeId);
      }
    };
  }, [
    exchangeId,
    enabled,
    hasCredentials,
    startConnectionRefresh,
    stopConnectionRefresh,
  ]);

  return {
    hasCredentials,
    isConnected,
    connectionStatus: exchangeId ? connectionStatus[exchangeId] : false,
  };
};
