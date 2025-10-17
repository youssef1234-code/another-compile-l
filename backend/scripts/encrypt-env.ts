import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Encrypts the .env file using AES-256-GCM encryption
 * Usage: npm run env:encrypt <secret>
 */

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

function encryptEnvFile(secret: string): void {
  const envPath = path.join(__dirname, '..', '.env');
  const encryptedPath = path.join(__dirname, '..', '.env.encrypted');

  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found!');
    process.exit(1);
  }

  // Read the .env file
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Generate salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive encryption key from secret
  const key = deriveKey(secret, salt);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the content
  let encrypted = cipher.update(envContent, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([salt, iv, tag, encrypted]);

  // Write to file as base64
  fs.writeFileSync(encryptedPath, combined.toString('base64'), 'utf8');

  console.log('✅ .env file encrypted successfully!');
  console.log(`📁 Encrypted file saved to: ${encryptedPath}`);
  console.log(`🔑 Secret used: ${secret}`);
  console.log('\n⚠️  IMPORTANT:');
  console.log('   1. Share the secret securely with your team');
  console.log('   2. Do NOT commit the .env file');
  console.log('   3. Commit the .env.encrypted file instead');
}

// Main execution
const secret = process.argv[2];

if (!secret) {
  console.error('❌ Error: Please provide a secret key');
  console.log('Usage: ts-node scripts/encrypt-env.ts <secret>');
  console.log('Example: ts-node scripts/encrypt-env.ts MyS3cr3t!');
  process.exit(1);
}

encryptEnvFile(secret);
