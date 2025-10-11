import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Decrypts the .env.encrypted file using AES-256-GCM encryption
 * Usage: npm run env:decrypt <secret>
 */

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

function decryptEnvFile(secret: string): void {
  const encryptedPath = path.join(__dirname, '..', '.env.encrypted');
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(encryptedPath)) {
    console.error('❌ Error: .env.encrypted file not found!');
    console.log('\n💡 Tip: Run encrypt-env.ts first to create the encrypted file');
    process.exit(1);
  }

  try {
    // Read the encrypted file
    const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
    const combined = Buffer.from(encryptedContent, 'base64');

    // Extract components
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    // Derive decryption key from secret
    const key = deriveKey(secret, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Decrypt the content
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Write to .env file
    fs.writeFileSync(envPath, decrypted.toString('utf8'), 'utf8');

    console.log('✅ .env file decrypted successfully!');
    console.log(`📁 Decrypted file saved to: ${envPath}`);
    console.log('\n⚠️  IMPORTANT: Do NOT commit the .env file to git!');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('auth') || error.message.includes('tag')) {
        console.error('❌ Error: Invalid secret key or corrupted encrypted file!');
      } else {
        console.error(`❌ Error: ${error.message}`);
      }
    } else {
      console.error('❌ Error: Failed to decrypt file');
    }
    process.exit(1);
  }
}

// Main execution
const secret = process.argv[2];

if (!secret) {
  console.error('❌ Error: Please provide a secret key');
  console.log('Usage: ts-node scripts/decrypt-env.ts <secret>');
  console.log('Example: ts-node scripts/decrypt-env.ts MyS3cr3t!');
  process.exit(1);
}

decryptEnvFile(secret);
