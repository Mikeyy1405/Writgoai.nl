/**
 * Encryption Utilities for Email System
 * Uses AES-256-GCM encryption for securing sensitive data like passwords
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const AUTH_TAG_LENGTH = 16; // GCM auth tag length
const KEY_LENGTH = 32; // 256 bits

/**
 * Get encryption key from environment variable
 * Automatically generates and warns if not set (for development)
 */
function getEncryptionKey(): Buffer {
  const keyString = process.env.EMAIL_ENCRYPTION_KEY;
  
  if (!keyString) {
    // For development only - generate a temporary key
    console.warn('⚠️  EMAIL_ENCRYPTION_KEY not set! Using temporary key (development only)');
    return crypto.randomBytes(KEY_LENGTH);
  }
  
  // Convert hex string to buffer
  const key = Buffer.from(keyString, 'hex');
  
  if (key.length !== KEY_LENGTH) {
    throw new Error(`EMAIL_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }
  
  return key;
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns: iv:authTag:encrypted (all in hex)
 */
export function encrypt(text: string): string {
  if (!text) {
    return '';
  }
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with AES-256-GCM
 * Expects format: iv:authTag:encrypted (all in hex)
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    return '';
  }
  
  try {
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a new encryption key
 * Use this to generate the EMAIL_ENCRYPTION_KEY for production
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Test encryption/decryption
 */
export function testEncryption(): boolean {
  try {
    const testString = 'test-password-123';
    const encrypted = encrypt(testString);
    const decrypted = decrypt(encrypted);
    
    return testString === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}

/**
 * Hash a password using bcrypt (for user authentication)
 * Note: This is different from encryption - used for user passwords
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a bcrypt hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}
