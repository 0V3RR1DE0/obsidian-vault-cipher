/**
 * crypto.js
 * Argon2id (argon2-browser / WASM) + ChaCha20-Poly1305 (@noble/ciphers)
 *
 * Works on desktop AND mobile — no Node.js builtins used anywhere.
 * argon2-browser runs via WASM in both Electron and the Obsidian mobile JS engine.
 *
 * Fixes vs previous version:
 *  - result.hash (Uint8Array) not result.arrayBuffer (doesn't exist)
 *  - base64 helpers use btoa/atob, not Buffer (mobile compat)
 *  - import path uses @noble/ciphers index, not /chacha subpath (bundler compat)
 */

import { hash as argon2Hash, ArgonType } from "argon2-browser";
import { randomBytes } from "@noble/hashes/utils";
import { chacha20poly1305 } from "@noble/ciphers/chacha";

// ── Argon2id parameters ────────────────────────────────────────────────────────
const ARGON2_MEM         = 128 * 1024; // 128 MB
const ARGON2_TIME        = 3;
const ARGON2_PARALLELISM = 1;
const ARGON2_KEY_LEN     = 32;         // 256-bit

const SALT_LEN  = 16;
const NONCE_LEN = 12;
const KEY_LEN   = 32;

// ── Key derivation ─────────────────────────────────────────────────────────────

/**
 * Derive a 32-byte key from password + salt using Argon2id (WASM).
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Promise<Uint8Array>}
 */
export async function deriveKey(password, salt) {
  const result = await argon2Hash({
    pass:        password,
    salt:        salt,
    time:        ARGON2_TIME,
    mem:         ARGON2_MEM,
    parallelism: ARGON2_PARALLELISM,
    hashLen:     ARGON2_KEY_LEN,
    type:        ArgonType.Argon2id,
  });

  // result.hash is a Uint8Array — this is the correct property
  return result.hash;
}

// ── Vault key ─────────────────────────────────────────────────────────────────

export function generateVaultKey() {
  return randomBytes(KEY_LEN);
}

// ── Symmetric helpers (ChaCha20-Poly1305) ─────────────────────────────────────

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

// ── Key blob ─────────────────────────────────────────────────────────────────

/**
 * Create the encrypted key blob to store as .vault-key.
 * @param {string}     password
 * @param {Uint8Array} vaultKey
 * @returns {Promise<string>} JSON string
 */
export async function createKeyBlob(password, vaultKey) {
  const salt       = randomBytes(SALT_LEN);
  const derivedKey = await deriveKey(password, salt);
  const encrypted  = encryptBytes(derivedKey, vaultKey);
  return JSON.stringify({
    v:            1,
    salt:         toHex(salt),
    encryptedKey: toHex(encrypted),
  });
}

/**
 * Unlock the key blob with a password, returning the vault key.
 * Throws on wrong password or malformed blob.
 * @param {string} password
 * @param {string} blobJson
 * @returns {Promise<Uint8Array>}
 */
export async function unlockKeyBlob(password, blobJson) {
  const blob = JSON.parse(blobJson);

  if (blob.v !== 1)
    throw new Error("Unsupported key blob version");
  if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
    throw new Error("Key blob: invalid or missing salt");
  if (typeof blob.encryptedKey !== "string" || blob.encryptedKey.length < NONCE_LEN * 2)
    throw new Error("Key blob: invalid or missing encryptedKey");

  const salt         = fromHex(blob.salt);
  const encryptedKey = fromHex(blob.encryptedKey);
  const derivedKey   = await deriveKey(password, salt);

  // Throws if wrong password — Poly1305 tag won't match
  return decryptBytes(derivedKey, encryptedKey);
}

// ── Note encryption ───────────────────────────────────────────────────────────

export function encryptNote(vaultKey, plaintext) {
  const ptBytes = new TextEncoder().encode(plaintext);
  return toBase64(encryptBytes(vaultKey, ptBytes));
}

export function decryptNote(vaultKey, ciphertextB64) {
  const ptBytes = decryptBytes(vaultKey, fromBase64(ciphertextB64));
  return new TextDecoder().decode(ptBytes);
}

// ── Helpers (no Buffer — works on mobile) ─────────────────────────────────────

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
  // btoa works in browser, Electron, and Obsidian mobile — no Buffer needed
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64) {
  const binary = atob(b64);
  const arr    = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    arr[i] = binary.charCodeAt(i);
  return arr;
}