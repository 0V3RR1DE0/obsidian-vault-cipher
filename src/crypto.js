import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";
import { xchacha20poly1305 } from "@noble/ciphers/chacha";

const ARGON2_MEM         = 64 * 1024; // 64 MB
const ARGON2_TIME        = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_KEY_LEN     = 32;
const SALT_LEN           = 16;
const KEY_LEN            = 32;
const NONCE_LEN          = 24; // XChaCha20 uses 192-bit nonce

function deriveKey(password, salt) {
  const pwBytes = new TextEncoder().encode(password);
  return argon2id(pwBytes, salt, {
    m: ARGON2_MEM, t: ARGON2_TIME, p: ARGON2_PARALLELISM, dkLen: ARGON2_KEY_LEN,
  });
}

export function generateVaultKey() {
  return randomBytes(KEY_LEN);
}

// Output layout: nonce(24) || ciphertext || poly1305-tag(16)
function xcEncrypt(key, data) {
  const nonce = randomBytes(NONCE_LEN);
  const ct    = xchacha20poly1305(key, nonce).encrypt(data);
  const out   = new Uint8Array(NONCE_LEN + ct.length);
  out.set(nonce, 0);
  out.set(ct, NONCE_LEN);
  return out;
}

function xcDecrypt(key, blob) {
  if (blob.length < NONCE_LEN + 16)
    throw new Error("Ciphertext too short — data is corrupt");
  const nonce = blob.slice(0, NONCE_LEN);
  const ct    = blob.slice(NONCE_LEN);
  return xchacha20poly1305(key, nonce).decrypt(ct);
}

export function createKeyBlob(password, vaultKey) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const salt       = randomBytes(SALT_LEN);
        const derivedKey = deriveKey(password, salt);
        const encrypted  = xcEncrypt(derivedKey, vaultKey);
        resolve(JSON.stringify({ v: 4, salt: toHex(salt), encryptedKey: toHex(encrypted) }));
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
          throw new Error("Key blob: invalid or missing salt");
        if (typeof blob.encryptedKey !== "string" || blob.encryptedKey.length % 2 !== 0)
          throw new Error("Key blob: invalid encryptedKey");
        if (blob.v !== 4)
          throw new Error(
            blob.v === undefined
              ? "Key blob: missing version field"
              : `Key blob version ${blob.v} is not supported — delete .vault-key and run setup again`
          );

        const derivedKey = deriveKey(password, fromHex(blob.salt));
        const vaultKey   = xcDecrypt(derivedKey, fromHex(blob.encryptedKey));

        // Validate the unwrapped key is exactly 32 bytes
        if (vaultKey.length !== KEY_LEN)
          throw new Error(`Key blob: decrypted key is ${vaultKey.length} bytes, expected ${KEY_LEN}`);

        resolve(vaultKey);
      } catch (e) { reject(e); }
    }, 20);
  });
}

export function encryptNote(vaultKey, plaintext) {
  return toBase64(xcEncrypt(vaultKey, new TextEncoder().encode(plaintext)));
}

export function decryptNote(vaultKey, ciphertextB64) {
  return new TextDecoder().decode(xcDecrypt(vaultKey, fromBase64(ciphertextB64)));
}

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  if (hex.length % 2 !== 0)
    throw new Error(`fromHex: odd-length string (${hex.length} chars) — data is corrupt`);
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (isNaN(byte)) throw new Error(`fromHex: invalid hex character at position ${i * 2}`);
    arr[i] = byte;
  }
  return arr;
}

function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromBase64(b64) {
  const s = atob(b64);
  const a = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
  return a;
}