import { EncryptedCredentials, ExchangeCredentialsDto } from "./types";

const CREDENTIALS_STORAGE_KEY = "equilibrium_encrypted_credentials";

export class CredentialEncryptionService {
  /**
   * Convert string to ArrayBuffer
   */
  private static stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  }

  /**
   * Convert ArrayBuffer to string
   */
  private static arrayBufferToString(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder();
    return decoder.decode(buffer);
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64;
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const buffer = bytes.buffer;
    return buffer;
  }

  /**
   * Generate a key from password using PBKDF2
   */
  private static async deriveKey(
    password: string,
    salt: ArrayBuffer
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const baseKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypt credentials with password and store in localStorage
   */
  static async encryptAndStore(
    exchangeId: string,
    credentials: ExchangeCredentialsDto,
    password: string
  ): Promise<void> {
    try {
      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM uses 12 bytes

      // Derive key from password
      const key = await this.deriveKey(password, salt.buffer);

      // Convert credentials to JSON string
      const credentialsString = JSON.stringify(credentials);

      const dataBuffer = this.stringToArrayBuffer(credentialsString);

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        dataBuffer
      );

      // Create encrypted credentials object
      const encryptedCreds: EncryptedCredentials = {
        exchangeId,
        encryptedData: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv.buffer),
        salt: this.arrayBufferToBase64(salt.buffer),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Store in localStorage
      const existing = this.getAllEncryptedCredentials();
      existing[exchangeId] = encryptedCreds;
      localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(existing));

      // Test decryption immediately
      const testDecrypted = await this.decryptCredentials(exchangeId, password);
    } catch (error) {
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

      // Convert base64 strings back to ArrayBuffers
      const salt = this.base64ToArrayBuffer(encryptedCreds.salt);
      const iv = this.base64ToArrayBuffer(encryptedCreds.iv);
      const encryptedData = this.base64ToArrayBuffer(
        encryptedCreds.encryptedData
      );

      // Recreate key from password and salt
      const key = await this.deriveKey(password, salt);

      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encryptedData
      );

      const decryptedString = this.arrayBufferToString(decryptedBuffer);

      if (!decryptedString) {
        return null;
      }

      const parsedCredentials = JSON.parse(decryptedString);

      return parsedCredentials;
    } catch (error) {
      console.error("🔓 [DECRYPT] Failed to decrypt credentials:", error);
      if (error instanceof SyntaxError) {
        console.error(
          "🔓 [DECRYPT] JSON parsing failed - likely wrong password or corrupted data"
        );
      }
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

      console.log("Testing encryption with sample data");

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

  /**
   * Debug function to clear all credentials and start fresh
   */
  static debugClearAll(): void {
    console.log("🧹 [DEBUG] Clearing all credentials for fresh start");
    this.clearAllCredentials();
    console.log("🧹 [DEBUG] All credentials cleared");
  }
}
