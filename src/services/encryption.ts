import CryptoJS from "crypto-js";
import { EncryptedCredentials, ExchangeCredentialsDto } from "./types";

const CREDENTIALS_STORAGE_KEY = "equilibrium_encrypted_credentials";

export class CredentialEncryptionService {
  /**
   * Encrypt credentials with password and store in localStorage
   */
  static encryptAndStore(
    exchangeId: string,
    credentials: ExchangeCredentialsDto,
    password: string
  ): void {
    try {
      // Generate salt and IV
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);

      // Derive key from password and salt
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000, // Increased iterations for better security
      });

      // Convert credentials to JSON string
      const credentialsString = JSON.stringify(credentials);

      // Encrypt the credentials
      const encrypted = CryptoJS.AES.encrypt(credentialsString, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Create encrypted credentials object
      const encryptedCreds: EncryptedCredentials = {
        exchangeId,
        encryptedData: encrypted.toString(),
        iv: iv.toString(CryptoJS.enc.Hex),
        salt: salt.toString(CryptoJS.enc.Hex),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store in localStorage
      const existing = this.getAllEncryptedCredentials();
      existing[exchangeId] = encryptedCreds;
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error("Failed to encrypt credentials:", error);
      throw new Error(
        `Encryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Decrypt credentials from localStorage using password
   */
  static decryptCredentials(
    exchangeId: string,
    password: string
  ): ExchangeCredentialsDto | null {
    try {
      const encryptedCreds = this.getEncryptedCredentials(exchangeId);
      if (!encryptedCreds) {
        console.log("No encrypted credentials found for exchange:", exchangeId);
        return null;
      }

      // Parse salt and IV from hex strings
      const salt = CryptoJS.enc.Hex.parse(encryptedCreds.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedCreds.iv);

      // Recreate key from password and salt
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 10000, // Must match encryption iterations
      });

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        encryptedCreds.encryptedData,
        key,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        console.error(
          "Decryption resulted in empty string - likely wrong password"
        );
        return null;
      }

      const parsedCredentials = JSON.parse(decryptedString);

      return parsedCredentials;
    } catch (error) {
      console.error("Failed to decrypt credentials:", error);
      if (error instanceof SyntaxError) {
        console.error(
          "JSON parsing failed - likely wrong password or corrupted data"
        );
      }
      return null;
    }
  }

  /**
   * Test encryption/decryption with sample data
   */
  static testEncryption(password: string): boolean {
    try {
      const testCredentials: ExchangeCredentialsDto = {
        apiKey: "test-api-key",
        secret: "test-secret",
        uid: "test-uid",
      };

      console.log("Testing encryption with sample data:", testCredentials);

      // Encrypt
      this.encryptAndStore("test-exchange", testCredentials, password);

      // Decrypt
      const decrypted = this.decryptCredentials("test-exchange", password);

      // Clean up test data
      this.removeCredentials("test-exchange");

      const success =
        JSON.stringify(decrypted) === JSON.stringify(testCredentials);
      console.log("Encryption test result:", success);

      return success;
    } catch (error) {
      console.error("Encryption test failed:", error);
      return false;
    }
  }

  /**
   * Check if credentials exist for an exchange
   */
  static hasCredentials(exchangeId: string): boolean {
    return !!this.getEncryptedCredentials(exchangeId);
  }

  /**
   * Get encrypted credentials for a specific exchange
   */
  static getEncryptedCredentials(
    exchangeId: string
  ): EncryptedCredentials | null {
    const all = this.getAllEncryptedCredentials();
    return all[exchangeId] || null;
  }

  /**
   * Get all encrypted credentials
   */
  static getAllEncryptedCredentials(): Record<string, EncryptedCredentials> {
    try {
      const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error("Failed to parse stored credentials:", error);
      return {};
    }
  }

  /**
   * Remove credentials for a specific exchange
   */
  static removeCredentials(exchangeId: string): void {
    const all = this.getAllEncryptedCredentials();
    delete all[exchangeId];
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(all));
  }

  /**
   * Clear all encrypted credentials
   */
  static clearAllCredentials(): void {
    localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  }

  /**
   * Migrate old credentials format or clear corrupted data
   * This should only be called once during app initialization
   */
  static migrateCredentials(): void {
    try {
      console.log("Starting credentials migration...");

      const all = this.getAllEncryptedCredentials();
      const exchanges = Object.keys(all);

      if (exchanges.length === 0) {
        console.log("No credentials to migrate");
        return;
      }

      console.log("Found credentials for exchanges:", exchanges);

      // Check if migration has already been done
      const migrationKey = "equilibrium_credentials_migrated";
      const hasMigrated = localStorage.getItem(migrationKey);

      if (hasMigrated) {
        console.log("Migration already completed, skipping");
        return;
      }

      // For now, clear all existing credentials to force re-entry
      // This ensures we use the new encryption format
      this.clearAllCredentials();
      console.log("Cleared all existing credentials for migration");

      // Mark migration as completed
      localStorage.setItem(migrationKey, "true");
    } catch (error) {
      console.error("Migration failed:", error);
      // If migration fails, clear everything to be safe
      this.clearAllCredentials();
    }
  }

  /**
   * Validate that credentials can be decrypted with the given password
   */
  static validateCredentials(exchangeId: string, password: string): boolean {
    try {
      const decrypted = this.decryptCredentials(exchangeId, password);
      return decrypted !== null && Object.keys(decrypted).length > 0;
    } catch (error) {
      console.error("Credential validation failed:", error);
      return false;
    }
  }
}
