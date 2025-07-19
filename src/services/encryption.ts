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
    // Generate salt and IV
    const salt = CryptoJS.lib.WordArray.random(128 / 8);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    // Derive key from password and salt
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    // Encrypt the credentials
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(credentials), key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Create encrypted credentials object
    const encryptedCreds: EncryptedCredentials = {
      exchangeId,
      encryptedData: encrypted.toString(),
      iv: iv.toString(),
      salt: salt.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Store in localStorage
    const existing = this.getAllEncryptedCredentials();
    existing[exchangeId] = encryptedCreds;
    localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(existing));
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
      if (!encryptedCreds) return null;

      // Recreate key from password and salt
      const key = CryptoJS.PBKDF2(
        password,
        CryptoJS.enc.Hex.parse(encryptedCreds.salt),
        {
          keySize: 256 / 32,
          iterations: 1000,
        }
      );

      // Decrypt
      const decrypted = CryptoJS.AES.decrypt(
        encryptedCreds.encryptedData,
        key,
        {
          iv: CryptoJS.enc.Hex.parse(encryptedCreds.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error("Failed to decrypt credentials:", error);
      return null;
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
}
