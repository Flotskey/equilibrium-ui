import { createConnection } from "@/services/api";
import { CredentialEncryptionService } from "@/services/encryption";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface CredentialsState {
  // Map of exchangeId -> hasCredentials
  credentialsMap: Record<string, boolean>;
  // Map of exchangeId -> encryption password (stored in sessionStorage)
  encryptionPasswords: Record<string, string>;
  // Map of exchangeId -> connection status
  connectionStatus: Record<string, boolean>;

  // Actions
  setHasCredentials: (exchangeId: string, hasCredentials: boolean) => void;
  setEncryptionPassword: (exchangeId: string, password: string) => void;
  getEncryptionPassword: (exchangeId: string) => string | null;
  clearEncryptionPassword: (exchangeId: string) => void;
  checkCredentials: (exchangeId: string) => boolean;
  refreshAllCredentials: () => void;
  clearCredentials: (exchangeId: string) => void;
  clearAllCredentials: () => void;
  testConnection: (exchangeId: string) => Promise<boolean>;
  startConnectionRefresh: (exchangeId: string) => void;
  stopConnectionRefresh: (exchangeId: string) => void;
}

// SessionStorage key for encryption passwords
const ENCRYPTION_PASSWORDS_KEY = "equilibrium_encryption_passwords";

// Helper functions for sessionStorage
const getSessionPasswords = (): Record<string, string> => {
  try {
    const stored = sessionStorage.getItem(ENCRYPTION_PASSWORDS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Failed to parse session passwords:", error);
    return {};
  }
};

const setSessionPasswords = (passwords: Record<string, string>): void => {
  try {
    sessionStorage.setItem(ENCRYPTION_PASSWORDS_KEY, JSON.stringify(passwords));
  } catch (error) {
    console.error("Failed to save session passwords:", error);
  }
};

// Connection refresh intervals
const connectionIntervals: Record<string, NodeJS.Timeout> = {};

export const useCredentialsStore = create<CredentialsState>()(
  devtools(
    persist(
      (set, get) => ({
        credentialsMap: {},
        encryptionPasswords: {},
        connectionStatus: {},

        setHasCredentials: (exchangeId: string, hasCredentials: boolean) => {
          set(
            (state) => ({
              credentialsMap: {
                ...state.credentialsMap,
                [exchangeId]: hasCredentials,
              },
            }),
            false,
            "setHasCredentials"
          );
        },

        setEncryptionPassword: (exchangeId: string, password: string) => {
          // Update sessionStorage
          const sessionPasswords = getSessionPasswords();
          sessionPasswords[exchangeId] = password;
          setSessionPasswords(sessionPasswords);

          // Update store state
          set(
            (state) => ({
              encryptionPasswords: {
                ...state.encryptionPasswords,
                [exchangeId]: password,
              },
            }),
            false,
            "setEncryptionPassword"
          );
        },

        getEncryptionPassword: (exchangeId: string) => {
          // First try to get from sessionStorage
          const sessionPasswords = getSessionPasswords();
          if (sessionPasswords[exchangeId]) {
            return sessionPasswords[exchangeId];
          }

          // Fallback to store state
          return get().encryptionPasswords[exchangeId] || null;
        },

        clearEncryptionPassword: (exchangeId: string) => {
          // Remove from sessionStorage
          const sessionPasswords = getSessionPasswords();
          delete sessionPasswords[exchangeId];
          setSessionPasswords(sessionPasswords);

          // Update store state
          set(
            (state) => {
              const { [exchangeId]: removedPassword, ...remainingPasswords } =
                state.encryptionPasswords;
              return {
                encryptionPasswords: remainingPasswords,
              };
            },
            false,
            "clearEncryptionPassword"
          );
        },

        checkCredentials: (exchangeId: string) => {
          // Check if BOTH encrypted credentials exist AND password is available
          const hasEncryptedCredentials =
            CredentialEncryptionService.hasCredentials(exchangeId);
          const hasPassword = !!get().getEncryptionPassword(exchangeId);
          const hasCredentials = hasEncryptedCredentials && hasPassword;

          // Update the store if the state doesn't match
          const currentState = get().credentialsMap[exchangeId];
          if (currentState !== hasCredentials) {
            get().setHasCredentials(exchangeId, hasCredentials);
          }

          return hasCredentials;
        },

        testConnection: async (exchangeId: string) => {
          try {
            const password = get().getEncryptionPassword(exchangeId);
            if (!password) {
              set(
                (state) => ({
                  connectionStatus: {
                    ...state.connectionStatus,
                    [exchangeId]: false,
                  },
                }),
                false,
                "testConnection"
              );
              return false;
            }

            const credentials = CredentialEncryptionService.decryptCredentials(
              exchangeId,
              password
            );
            if (!credentials) {
              set(
                (state) => ({
                  connectionStatus: {
                    ...state.connectionStatus,
                    [exchangeId]: false,
                  },
                }),
                false,
                "testConnection"
              );
              return false;
            }

            // Test connection with backend
            await createConnection(exchangeId, credentials);

            set(
              (state) => ({
                connectionStatus: {
                  ...state.connectionStatus,
                  [exchangeId]: true,
                },
              }),
              false,
              "testConnection"
            );

            return true;
          } catch (error) {
            console.error(`Connection test failed for ${exchangeId}:`, error);
            set(
              (state) => ({
                connectionStatus: {
                  ...state.connectionStatus,
                  [exchangeId]: false,
                },
              }),
              false,
              "testConnection"
            );
            return false;
          }
        },

        startConnectionRefresh: (exchangeId: string) => {
          // Clear existing interval if any
          if (connectionIntervals[exchangeId]) {
            clearInterval(connectionIntervals[exchangeId]);
          }

          // Test connection immediately
          get().testConnection(exchangeId);

          // Set up interval for every 2 minutes (120000ms)
          connectionIntervals[exchangeId] = setInterval(() => {
            get().testConnection(exchangeId);
          }, 120000);
        },

        stopConnectionRefresh: (exchangeId: string) => {
          if (connectionIntervals[exchangeId]) {
            clearInterval(connectionIntervals[exchangeId]);
            delete connectionIntervals[exchangeId];
          }
        },

        refreshAllCredentials: () => {
          // Get all stored credentials and check if passwords are available
          const allEncrypted =
            CredentialEncryptionService.getAllEncryptedCredentials();
          const sessionPasswords = getSessionPasswords();
          const credentialsMap: Record<string, boolean> = {};

          Object.keys(allEncrypted).forEach((exchangeId) => {
            const hasPassword = !!sessionPasswords[exchangeId];
            credentialsMap[exchangeId] = hasPassword;
          });

          set({ credentialsMap }, false, "refreshAllCredentials");
        },

        clearCredentials: (exchangeId: string) => {
          CredentialEncryptionService.removeCredentials(exchangeId);

          // Remove from sessionStorage
          const sessionPasswords = getSessionPasswords();
          delete sessionPasswords[exchangeId];
          setSessionPasswords(sessionPasswords);

          // Stop connection refresh
          get().stopConnectionRefresh(exchangeId);

          // Update store state
          set(
            (state) => {
              const { [exchangeId]: removedPassword, ...remainingPasswords } =
                state.encryptionPasswords;
              return {
                credentialsMap: {
                  ...state.credentialsMap,
                  [exchangeId]: false,
                },
                encryptionPasswords: remainingPasswords,
                connectionStatus: {
                  ...state.connectionStatus,
                  [exchangeId]: false,
                },
              };
            },
            false,
            "clearCredentials"
          );
        },

        clearAllCredentials: () => {
          CredentialEncryptionService.clearAllCredentials();

          // Clear sessionStorage
          sessionStorage.removeItem(ENCRYPTION_PASSWORDS_KEY);

          // Stop all connection refreshes
          Object.keys(connectionIntervals).forEach((exchangeId) => {
            get().stopConnectionRefresh(exchangeId);
          });

          set(
            {
              credentialsMap: {},
              encryptionPasswords: {},
              connectionStatus: {},
            },
            false,
            "clearAllCredentials"
          );
        },
      }),
      {
        name: "credentials-store",
        // Only persist the credentialsMap, not the encryptionPasswords (they go to sessionStorage)
        partialize: (state) => ({
          credentialsMap: state.credentialsMap,
        }),
      }
    ),
    {
      name: "credentials-store",
    }
  )
);
