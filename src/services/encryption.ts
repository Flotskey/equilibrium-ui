import * as CryptoJS from "crypto-js";
import { EncryptedCredentials, ExchangeCredentialsDto } from "./types";

const CREDENTIALS_STORAGE_KEY = "equilibrium_encrypted_credentials";

export class CredentialEncryptionService {
  /**
   * Encrypt credentials with password and store in localStorage
   */
  static async encryptAndStore(
    exchangeId: string,
    credentials: ExchangeCredentialsDto,
    password: string
  ): Promise<void> {
    try {
      // Convert credentials to JSON string
      const credentialsString = JSON.stringify(credentials);

      // Encrypt the credentials using CryptoJS
      const encrypted = CryptoJS.AES.encrypt(credentialsString, password);
      const encryptedData = encrypted.toString();

      // Create encrypted credentials object
      const encryptedCreds: EncryptedCredentials = {
        exchangeId,
        encryptedData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store in localStorage
      const existing = this.getAllEncryptedCredentials();
      existing[exchangeId] = encryptedCreds;
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error("🔐 [ENCRYPT] Encryption failed:", error);
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
  static async decryptCredentials(
    exchangeId: string,
    password: string
  ): Promise<ExchangeCredentialsDto | null> {
    try {
      const encryptedCreds = this.getEncryptedCredentials(exchangeId);
      if (!encryptedCreds) {
        return null;
      }

      // Check if encrypted data looks like valid CryptoJS format
      if (
        !encryptedCreds.encryptedData ||
        encryptedCreds.encryptedData.length < 10
      ) {
        console.error("🔍 [DEBUG] Encrypted data too short or empty");
        return null;
      }

      // Try to decrypt using CryptoJS
      let decryptedString;
      try {
        const decrypted = CryptoJS.AES.decrypt(
          encryptedCreds.encryptedData,
          password
        );
        decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (cryptoError) {
        console.error("🔍 [DEBUG] CryptoJS decryption error:", cryptoError);
        return null;
      }

      if (!decryptedString) {
        console.error(
          "🔍 [DEBUG] Decrypted string is empty - likely wrong password or corrupted data"
        );
        return null;
      }

      // Try to parse JSON
      let parsedCredentials;
      try {
        parsedCredentials = JSON.parse(decryptedString);
      } catch (jsonError) {
        console.error("🔍 [DEBUG] JSON parsing failed:", jsonError);
        console.error("🔍 [DEBUG] Raw decrypted string:", decryptedString);
        return null;
      }

      return parsedCredentials;
    } catch (error) {
      console.error("🔓 [DECRYPT] Failed to decrypt credentials:", error);
      return null;
    }
  }

  /**
   * Test encryption/decryption with sample data
   */
  static async testEncryption(password: string): Promise<boolean> {
    try {
      const testCredentials: ExchangeCredentialsDto = {
        apiKey: "test-api-key",
        secret: "test-secret",
        uid: "test-uid",
      };

      // Encrypt
      await this.encryptAndStore("test-exchange", testCredentials, password);

      // Decrypt
      const decrypted = await this.decryptCredentials(
        "test-exchange",
        password
      );

      // Clean up test data
      this.removeCredentials("test-exchange");

      const success =
        JSON.stringify(decrypted) === JSON.stringify(testCredentials);
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
   * Validate that credentials can be decrypted with the given password
   */
  static async validateCredentials(
    exchangeId: string,
    password: string
  ): Promise<boolean> {
    try {
      const decrypted = await this.decryptCredentials(exchangeId, password);
      return decrypted !== null && Object.keys(decrypted).length > 0;
    } catch (error) {
      console.error("Credential validation failed:", error);
      return false;
    }
  }
}
