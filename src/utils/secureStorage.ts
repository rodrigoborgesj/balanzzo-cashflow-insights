/**
 * Secure storage utility that provides encrypted session storage
 * Replaces insecure localStorage for sensitive data
 */

interface SecureStorageItem {
  data: string;
  timestamp: number;
  expiry?: number;
}

class SecureStorage {
  private static instance: SecureStorage;
  private readonly prefix = 'sec_';
  private readonly defaultTTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * Simple XOR encryption for browser storage (better than plaintext)
   * For production, consider using Web Crypto API
   */
  private encrypt(data: string): string {
    const key = this.generateKey();
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(encrypted);
  }

  private decrypt(encryptedData: string): string {
    try {
      const key = this.generateKey();
      const data = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < data.length; i++) {
        decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch {
      return '';
    }
  }

  private generateKey(): string {
    // Use session-specific data for key generation
    const userAgent = navigator.userAgent;
    const sessionId = sessionStorage.getItem('session_id') || this.createSessionId();
    return btoa(userAgent + sessionId).slice(0, 32);
  }

  private createSessionId(): string {
    const sessionId = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('session_id', sessionId);
    return sessionId;
  }

  /**
   * Store data securely with optional expiry
   */
  setItem(key: string, value: any, ttlMs?: number): void {
    try {
      const item: SecureStorageItem = {
        data: this.encrypt(JSON.stringify(value)),
        timestamp: Date.now(),
        expiry: ttlMs ? Date.now() + ttlMs : Date.now() + this.defaultTTL
      };
      
      sessionStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.warn('SecureStorage: Failed to store item', error);
    }
  }

  /**
   * Retrieve and decrypt data
   */
  getItem<T>(key: string): T | null {
    try {
      const stored = sessionStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const item: SecureStorageItem = JSON.parse(stored);
      
      // Check expiry
      if (item.expiry && Date.now() > item.expiry) {
        this.removeItem(key);
        return null;
      }

      const decrypted = this.decrypt(item.data);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (error) {
      console.warn('SecureStorage: Failed to retrieve item', error);
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Check if item exists and is not expired
   */
  hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }
}

export const secureStorage = SecureStorage.getInstance();