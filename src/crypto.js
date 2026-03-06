/**
 * crypto.js
 * All cryptographic operations for Vault Cipher.
 *
 * Stack (two layers, both ChaCha20-Poly1305):
 *
 *   Layer 1 — key blob (.vault-key):
 *     Password → Argon2id (+salt) → derived key
 *     derived key → ChaCha20-Poly1305 → encrypts vault key
 *     (derived key is never stored, thrown away after unwrapping)
 *
 *   Layer 2 — notes:
 *     vault key (held in memory for session) → ChaCha20-Poly1305 → note ciphertext
 *     Each note gets a fresh random nonce prepended to its ciphertext.
 *
 * Why two layers?
 *   Password changes only re-encrypt the vault key, not every note.
 *
 * Dependencies: @noble/hashes, @noble/ciphers (no age-encryption)
 */

import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";
import { chacha20poly1305 } from "@noble/ciphers/chacha";

// ── Argon2id parameters ───────────────────────────────────────────────────────
// 128MB / 3 iterations — solid interactive balance.
// Bump ARGON2_MEM to 256*1024 for stronger security if ~1s latency is ok.
const ARGON2_MEM         = 128 * 1024; // 128 MB
const ARGON2_TIME        = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_KEY_LEN     = 32;         // 256-bit

const SALT_LEN  = 16; // Argon2id salt, 128-bit
const NONCE_LEN = 12; // ChaCha20-Poly1305 nonce, 96-bit
const KEY_LEN   = 32; // vault key, 256-bit

// ── Key derivation ────────────────────────────────────────────────────────────

/**
 * Derive a 256-bit key from a password + salt using Argon2id.
 * Explicitly UTF-8 encodes the password for consistent cross-platform behavior.
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Uint8Array} 32-byte derived key
 */
export function deriveKey(password, salt) {
  const pwBytes = new TextEncoder().encode(password);
  return argon2id(pwBytes, salt, {
    m: ARGON2_MEM,
    t: ARGON2_TIME,
    p: ARGON2_PARALLELISM,
    dkLen: ARGON2_KEY_LEN,
  });
}

// ── Vault key ─────────────────────────────────────────────────────────────────

/**
 * Generate a fresh random 256-bit vault key.
 * This is the symmetric key that encrypts all notes for this vault.
 * @returns {Uint8Array}
 */
export function generateVaultKey() {
  return randomBytes(KEY_LEN);
}

// ── Symmetric encryption (shared by key blob and notes) ───────────────────────

/**
 * Encrypt arbitrary bytes with ChaCha20-Poly1305.
 * Output: [nonce 12B | ciphertext+tag]
 * @param {Uint8Array} key
 * @param {Uint8Array} data
 * @returns {Uint8Array}
 */
function encryptBytes(key, data) {
  const nonce      = randomBytes(NONCE_LEN);
  const ciphertext = chacha20poly1305(key, nonce).encrypt(data);
  const out        = new Uint8Array(NONCE_LEN + ciphertext.length);
  out.set(nonce, 0);
  out.set(ciphertext, NONCE_LEN);
  return out;
}

/**
 * Decrypt a blob produced by encryptBytes.
 * Throws if the Poly1305 auth tag fails (wrong key or tampered data).
 * @param {Uint8Array} key
 * @param {Uint8Array} blob  [nonce 12B | ciphertext+tag]
 * @returns {Uint8Array} plaintext bytes
 */
function decryptBytes(key, blob) {
  const nonce      = blob.slice(0, NONCE_LEN);
  const ciphertext = blob.slice(NONCE_LEN);
  return chacha20poly1305(key, nonce).decrypt(ciphertext);
}

// ── Key blob (.vault-key) ─────────────────────────────────────────────────────

/**
 * Create the encrypted key blob to persist as .vault-key.
 *
 * Format (JSON):
 *   { v: 1, salt: "<hex>", encryptedKey: "<hex>" }
 *
 * The derived key (Argon2id output) is never stored — only used to wrap
 * the vault key then discarded.
 *
 * @param {string}     password
 * @param {Uint8Array} vaultKey  32-byte vault key
 * @returns {string} JSON string
 */
export function createKeyBlob(password, vaultKey) {
  const salt       = randomBytes(SALT_LEN);
  const derivedKey = deriveKey(password, salt);
  const encrypted  = encryptBytes(derivedKey, vaultKey);
  return JSON.stringify({
    v:            1,
    salt:         toHex(salt),
    encryptedKey: toHex(encrypted),
  });
}

/**
 * Unlock the key blob with a password, returning the vault key.
 * Throws on wrong password (Poly1305 tag mismatch) or malformed blob.
 * @param {string} password
 * @param {string} blobJson
 * @returns {Uint8Array} 32-byte vault key
 */
export function unlockKeyBlob(password, blobJson) {
  const blob = JSON.parse(blobJson);

  if (blob.v !== 1)
    throw new Error("Unsupported key blob version");
  if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
    throw new Error("Key blob: invalid or missing salt");
  if (typeof blob.encryptedKey !== "string" || blob.encryptedKey.length < NONCE_LEN * 2)
    throw new Error("Key blob: invalid or missing encryptedKey");

  const salt         = fromHex(blob.salt);
  const encryptedKey = fromHex(blob.encryptedKey);
  const derivedKey   = deriveKey(password, salt);

  // Will throw if wrong password — Poly1305 tag won't match
  return decryptBytes(derivedKey, encryptedKey);
}

// ── Note encryption ───────────────────────────────────────────────────────────

/**
 * Encrypt a note string with the vault key.
 * Each call uses a fresh random nonce — no nonce reuse ever.
 * @param {Uint8Array} vaultKey
 * @param {string}     plaintext
 * @returns {string}   base64-encoded [nonce | ciphertext+tag]
 */
export function encryptNote(vaultKey, plaintext) {
  const ptBytes = new TextEncoder().encode(plaintext);
  return toBase64(encryptBytes(vaultKey, ptBytes));
}

/**
 * Decrypt a note ciphertext with the vault key.
 * @param {Uint8Array} vaultKey
 * @param {string}     ciphertextB64
 * @returns {string}   plaintext
 */
export function decryptNote(vaultKey, ciphertextB64) {
  const ptBytes = decryptBytes(vaultKey, fromBase64(ciphertextB64));
  return new TextDecoder().decode(ptBytes);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++)
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
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