# Vault Cipher

End-to-end encryption for your Obsidian vault using Argon2id + ChaCha20-Poly1305.

## How it works

On first open, you choose a password for the vault. From there:

1. A random 256-bit vault key is generated
2. Your password is run through Argon2id (128MB, 3 iterations) to produce a derived key
3. The derived key encrypts the vault key with ChaCha20-Poly1305 — stored as `.vault-key` in your vault root
4. Every note is encrypted with the vault key + a fresh random nonce on save
5. On session open, you enter your password → vault key is unwrapped → notes decrypt transparently in the editor

The derived key is never stored anywhere. It's computed on unlock, used to unwrap the vault key, then thrown away.

## Why two layers?

Password changes only need to re-encrypt the vault key — not every note. Same vault key, new password wrapper.

## Crypto stack

| Purpose | Algorithm |
|---|---|
| Key derivation | Argon2id (128MB, 3 iterations) |
| Vault key storage | ChaCha20-Poly1305 |
| Note encryption | ChaCha20-Poly1305 (fresh nonce per note) |

## Sync

`.vault-key` syncs normally with LiveSync or any other sync tool. On a new device, enter your password and the session unlocks from the synced key blob. Each vault gets its own independent key and password.

**If you lose your password, your notes are unrecoverable. There is no reset. Use a password manager.**

## Installation

### From BRAT (before community plugin approval)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. In BRAT settings, add this repo URL
3. Enable Vault Cipher in Community Plugins

### Manual

1. Clone this repo
2. `npm install && npm run build`
3. Copy `main.js`, `manifest.json`, `styles.css` to `.obsidian/plugins/vault-cipher/`
4. Enable in Community Plugins

## Development

```bash
npm install
npm run build   # production bundle → main.js
```

## Libraries

- [@noble/hashes](https://github.com/paulmillr/noble-hashes) — Argon2id
- [@noble/ciphers](https://github.com/paulmillr/noble-ciphers) — ChaCha20-Poly1305

## License

MIT