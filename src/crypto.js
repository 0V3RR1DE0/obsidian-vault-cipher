import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";
import { xchacha20poly1305, chacha20poly1305 } from "@noble/ciphers/chacha";
import { managedNonce } from "@noble/ciphers/webcrypto";

const ARGON2_MEM         = 64 * 1024;
const ARGON2_TIME        = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_KEY_LEN     = 32;

const SALT_LEN = 16;
const KEY_LEN  = 32;

// v2 cipher: managedNonce(xchacha20poly1305) — correct, used for all new writes
function makeCipher(key) {
  return managedNonce(xchacha20poly1305)(key);
}

function deriveKey(password, salt) {
  const pwBytes = new TextEncoder().encode(password);
  return argon2id(pwBytes, salt, {
    m: ARGON2_MEM, t: ARGON2_TIME, p: ARGON2_PARALLELISM, dkLen: ARGON2_KEY_LEN,
  });
}

export function generateVaultKey() {
  return randomBytes(KEY_LEN);
}

export function createKeyBlob(password, vaultKey) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const salt       = randomBytes(SALT_LEN);
        const derivedKey = deriveKey(password, salt);
        const encrypted  = makeCipher(derivedKey).encrypt(vaultKey);
        resolve(JSON.stringify({ v: 2, salt: toHex(salt), encryptedKey: toHex(encrypted) }));
      } catch (e) { reject(e); }
    }, 20);
  });
}

export function unlockKeyBlob(password, blobJson) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const blob = JSON.parse(blobJson);
        if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
          throw new Error("Key blob: invalid salt");

        const derivedKey = deriveKey(password, fromHex(blob.salt));

        if (blob.v === 2) {
          resolve(makeCipher(derivedKey).decrypt(fromHex(blob.encryptedKey)));
        } else if (blob.v === 1) {
          // v1 blob: chacha20poly1305 with manual 12-byte nonce — decrypt best-effort
          const raw   = fromHex(blob.encryptedKey);
          const nonce = raw.slice(0, 12);
          const ct    = raw.slice(12);
          resolve(chacha20poly1305(derivedKey, nonce).decrypt(ct));
        } else {
          throw new Error("Unknown key blob version: " + blob.v);
        }
      } catch (e) { reject(e); }
    }, 20);
  });
}

// Notes: v2 format uses managedNonce xchacha20poly1305
// v1 notes (marker: vault-cipher:v1:) used chacha20poly1305 with manual 12-byte nonce
// decryptNote handles both so old notes open correctly after upgrade

export function encryptNote(vaultKey, plaintext) {
  return toBase64(makeCipher(vaultKey).encrypt(new TextEncoder().encode(plaintext)));
}

export function decryptNote(vaultKey, ciphertextB64) {
  const raw = fromBase64(ciphertextB64);
  // Detect v1 note: 24-byte xchacha nonce means total >= 24+16=40 bytes min.
  // v1 notes had 12-byte nonce. Heuristic: try v2 first, fall back to v1.
  try {
    return new TextDecoder().decode(makeCipher(vaultKey).decrypt(raw));
  } catch {
    // Fall back to v1 chacha20poly1305 with 12-byte nonce
    const nonce = raw.slice(0, 12);
    const ct    = raw.slice(12);
    return new TextDecoder().decode(chacha20poly1305(vaultKey, nonce).decrypt(ct));
  }
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const arr    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}