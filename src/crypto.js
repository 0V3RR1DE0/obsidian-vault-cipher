import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";
import { chacha20poly1305 } from "@noble/ciphers/chacha";

const ARGON2_MEM         = 64 * 1024; // 64 MB
const ARGON2_TIME        = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_KEY_LEN     = 32;

const SALT_LEN  = 16;
const NONCE_LEN = 12;
const KEY_LEN   = 32;

function deriveKey(password, salt) {
  const pwBytes = new TextEncoder().encode(password);
  return argon2id(pwBytes, salt, {
    m: ARGON2_MEM, t: ARGON2_TIME, p: ARGON2_PARALLELISM, dkLen: ARGON2_KEY_LEN,
  });
}

export function generateVaultKey() {
  return randomBytes(KEY_LEN);
}

function encryptBytes(key, data) {
  const nonce      = randomBytes(NONCE_LEN);
  const ciphertext = chacha20poly1305(key, nonce).encrypt(data);
  const out        = new Uint8Array(NONCE_LEN + ciphertext.length);
  out.set(nonce, 0);
  out.set(ciphertext, NONCE_LEN);
  return out;
}

function decryptBytes(key, blob) {
  const nonce      = blob.slice(0, NONCE_LEN);
  const ciphertext = blob.slice(NONCE_LEN);
  return chacha20poly1305(key, nonce).decrypt(ciphertext);
}

// Wrapped in Promise+setTimeout so the UI spinner renders before the thread blocks
export function createKeyBlob(password, vaultKey) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const salt       = randomBytes(SALT_LEN);
        const derivedKey = deriveKey(password, salt);
        const encrypted  = encryptBytes(derivedKey, vaultKey);
        resolve(JSON.stringify({ v: 1, salt: toHex(salt), encryptedKey: toHex(encrypted) }));
      } catch (e) { reject(e); }
    }, 20);
  });
}

export function unlockKeyBlob(password, blobJson) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const blob = JSON.parse(blobJson);
        if (blob.v !== 1) throw new Error("Unsupported key blob version");
        if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
          throw new Error("Key blob: invalid salt");
        if (typeof blob.encryptedKey !== "string" || blob.encryptedKey.length < NONCE_LEN * 2)
          throw new Error("Key blob: invalid encryptedKey");

        const derivedKey = deriveKey(password, fromHex(blob.salt));
        resolve(decryptBytes(derivedKey, fromHex(blob.encryptedKey)));
      } catch (e) { reject(e); }
    }, 20);
  });
}

export function encryptNote(vaultKey, plaintext) {
  return toBase64(encryptBytes(vaultKey, new TextEncoder().encode(plaintext)));
}

export function decryptNote(vaultKey, ciphertextB64) {
  return new TextDecoder().decode(decryptBytes(vaultKey, fromBase64(ciphertextB64)));
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