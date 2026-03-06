/**
 * main.js  (src/main.js — bundled by esbuild into root main.js)
 * Vault Cipher — Obsidian plugin entry point.
 *
 * Encryption stack:
 *   Argon2id  →  derive key from password → unwrap vault key
 *   ChaCha20-Poly1305  →  encrypt vault key (key blob) + all notes
 *
 * Key storage:
 *   .vault-key  in vault root (syncs via LiveSync, hidden from file explorer)
 *
 * Session model:
 *   Password entered once on vault open → vault key held in memory →
 *   cleared on plugin unload / manual lock.
 */

import { Plugin, TFile, Notice } from "obsidian";
import { generateVaultKey, createKeyBlob, unlockKeyBlob, encryptNote, decryptNote } from "./crypto.js";
import { UnlockModal, SetupModal } from "./modals.js";
import { VaultCipherSettingsTab, DEFAULT_SETTINGS } from "./settings.js";

const KEY_BLOB_FILENAME = ".vault-key";
// Marker prepended to encrypted note content so we can detect it
const CIPHER_MARKER = "vault-cipher:v1:";

export default class VaultCipherPlugin extends Plugin {
  /** @type {Uint8Array | null} The vault key, held in memory for the session. */
  sessionKey = null;

  /** Tracks files currently being written by us so the patch doesn't double-encrypt them. */
  _writingFiles = new Set();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VaultCipherSettingsTab(this.app, this));

    // Hide key blob whenever it gets created (e.g. first setup)
    this.registerEvent(
      this.app.vault.on("create", (file) => this.maybeHideFile(file))
    );

    // On workspace ready: hide key blob and handle unlock/setup
    this.app.workspace.onLayoutReady(async () => {
      this.hideKeyBlobFromExplorer();
      // Always call promptUnlock — it figures out whether to show
      // setup (no key blob) or unlock (key blob exists) or nothing (already unlocked)
      await this.promptUnlock();
    });

    // Patch file open to transparently decrypt content into the editor
    // Also warns if a plaintext note is detected in an encrypted vault
    this.registerEvent(
      this.app.workspace.on("file-open", async (file) => {
        if (!file || !this.settings.enabled) return;
        await this.decryptFileIntoEditor(file);
        this.resetAutoLockTimer();
      })
    );

    // Reset auto-lock on any editor keystroke so active typing doesn't lock the vault
    this.registerEvent(
      this.app.workspace.on("editor-change", () => {
        if (this.sessionKey) this.resetAutoLockTimer();
      })
    );

    // Monkey-patch vault.modify to encrypt before writing
    this.patchVaultModify();

    // Command: lock vault
    this.addCommand({
      id: "lock-vault",
      name: "Lock vault",
      callback: () => {
        this.lockVault();
        new Notice("🔒 Vault locked.");
      },
    });

    // Command: unlock vault
    this.addCommand({
      id: "unlock-vault",
      name: "Unlock vault",
      callback: () => this.promptUnlock(),
    });

    // Command: encrypt all existing plaintext notes
    this.addCommand({
      id: "encrypt-all-notes",
      name: "Encrypt all existing notes",
      callback: () => this.encryptAllNotes(),
    });

    console.log("Vault Cipher loaded.");
  }

  onunload() {
    this.lockVault();
    this.clearAutoLockTimer();
    console.log("Vault Cipher unloaded — session key cleared.");
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // ── Session key management ─────────────────────────────────────────────────

  lockVault() {
    // Zero out the key bytes before nulling — best-effort in JS userland
    if (this.sessionKey) this.sessionKey.fill(0);
    this.sessionKey = null;
    this.clearAutoLockTimer();
  }

  // ── Auto-lock timer ────────────────────────────────────────────────────────

  resetAutoLockTimer() {
    if (!this.settings.autoLockMinutes || this.settings.autoLockMinutes <= 0) return;
    this.clearAutoLockTimer();
    this._autoLockTimer = setTimeout(() => {
      this.lockVault();
      new Notice("🔒 Vault Cipher: auto-locked after inactivity.");
    }, this.settings.autoLockMinutes * 60 * 1000);
  }

  clearAutoLockTimer() {
    if (this._autoLockTimer) {
      clearTimeout(this._autoLockTimer);
      this._autoLockTimer = null;
    }
  }

  async promptUnlock() {
    // Already unlocked this session — nothing to do
    if (this.sessionKey) return;

    const keyBlobExists = await this.keyBlobExists();

    if (!keyBlobExists) {
      // First launch — no key blob yet, run setup wizard
      new SetupModal(this.app, async (password) => {
        await this.setupEncryption(password);
      }).open();
    } else {
      // Returning session — unlock with password
      new UnlockModal(this.app, async (password) => {
        return await this.unlockWithPassword(password);
      }).open();
    }
  }

  async unlockWithPassword(password) {
    try {
      const blobJson = await this.readKeyBlob();
      this.sessionKey = unlockKeyBlob(password, blobJson);
      return true;
    } catch (e) {
      // Decryption failure = wrong password or corrupt blob
      return false;
    }
  }

  // ── First-time setup ───────────────────────────────────────────────────────

  async setupEncryption(password) {
    const vaultKey = generateVaultKey();
    const blob     = createKeyBlob(password, vaultKey);
    await this.writeKeyBlob(blob);
    this.sessionKey = vaultKey;
    this.settings.enabled = true;
    await this.saveSettings();
    this.hideKeyBlobFromExplorer();
  }

  // ── Key blob I/O ───────────────────────────────────────────────────────────

  async keyBlobExists() {
    return this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME) instanceof TFile;
  }

  async readKeyBlob() {
    const file = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (!file) throw new Error("Key blob not found");
    return await this.app.vault.read(file);
  }

  async writeKeyBlob(content) {
    const existing = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (existing instanceof TFile) {
      // Use _originalModify directly — the key blob is already encrypted JSON,
      // we must not let the vault.modify patch try to encrypt it again as a note.
      const writeFn = this._originalModify || this.app.vault.modify.bind(this.app.vault);
      await writeFn(existing, content);
    } else {
      await this.app.vault.create(KEY_BLOB_FILENAME, content);
    }
  }

  // ── Hide key blob from file explorer ──────────────────────────────────────

  hideKeyBlobFromExplorer() {
    // Inject a CSS rule to hide the key blob file item
    const styleId = "vault-cipher-hide-keyblob";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      // The file explorer renders nav-file-title with data-path attribute
      style.textContent = `
        .nav-file[data-path="${KEY_BLOB_FILENAME}"],
        .nav-file-title[data-path="${KEY_BLOB_FILENAME}"] {
          display: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  maybeHideFile(file) {
    if (file.path === KEY_BLOB_FILENAME) {
      this.hideKeyBlobFromExplorer();
    }
  }

  // ── Note encryption / decryption ───────────────────────────────────────────

  /**
   * Returns true if a note's content is encrypted by this plugin.
   */
  isEncrypted(content) {
    return typeof content === "string" && content.startsWith(CIPHER_MARKER);
  }

  isExcluded(filePath) {
    if (filePath === KEY_BLOB_FILENAME) return true;
    return this.settings.excludedFolders.some((folder) =>
      filePath.startsWith(folder + "/") || filePath === folder
    );
  }

  /**
   * Encrypt the plaintext content of a note.
   * Returns the ciphertext string (with marker prefix).
   */
  async encrypt(plaintext) {
    if (!this.sessionKey) throw new Error("Vault is locked");
    const ciphertext = encryptNote(this.sessionKey, plaintext);
    return CIPHER_MARKER + ciphertext;
  }

  /**
   * Decrypt the ciphertext content of a note.
   */
  async decrypt(ciphertext) {
    if (!this.sessionKey) throw new Error("Vault is locked");
    const payload = ciphertext.slice(CIPHER_MARKER.length);
    return decryptNote(this.sessionKey, payload);
  }

  /**
   * When a file is opened, if it's encrypted and we're unlocked,
   * read the encrypted content, decrypt it, and replace the editor content.
   */
  async decryptFileIntoEditor(file) {
    if (!(file instanceof TFile)) return;
    if (file.extension !== "md") return;
    if (this.isExcluded(file.path)) return;
    if (!this.sessionKey) return;

    const raw = await this.app.vault.read(file);

    if (!this.isEncrypted(raw)) {
      if (raw.trim().length > 0) {
        new Notice(
          `⚠️ Vault Cipher: "${file.name}" is not encrypted. ` +
          `Run "Encrypt all existing notes" to fix this.`,
          8000
        );
      }
      return;
    }

    try {
      const plaintext = await this.decrypt(raw);

      // Guard: make sure this file is still the active one after the async decrypt.
      // If the user switched notes during decryption, bail — don't overwrite the wrong editor.
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile || activeFile.path !== file.path) return;

      const editor = this.app.workspace.activeEditor?.editor;
      if (editor) {
        this._writingFiles.add(file.path);
        try {
          editor.setValue(plaintext);
        } finally {
          this._writingFiles.delete(file.path);
        }
      }
    } catch (e) {
      new Notice("Vault Cipher: failed to decrypt note — vault may be locked.");
      console.error("Vault Cipher decrypt error:", e);
    }
  }

  /**
   * Monkey-patch vault.modify so that any write to an .md file goes through
   * encryption first (unless we're in the middle of decrypting into the editor).
   */
  patchVaultModify() {
    const _originalModify = this.app.vault.modify.bind(this.app.vault);

    // Stash so writeKeyBlob can call it directly, bypassing encryption
    this._originalModify = _originalModify;

    this.app.vault.modify = async (file, data, options) => {
      if (
        this.settings.enabled &&
        this.sessionKey &&
        file instanceof TFile &&
        file.extension === "md" &&
        !this.isExcluded(file.path) &&
        !this._writingFiles.has(file.path) &&
        !this.isEncrypted(data)
      ) {
        try {
          data = await this.encrypt(data);
        } catch (e) {
          console.error("Vault Cipher: failed to encrypt on save:", e);
          new Notice("⚠️ Vault Cipher: encryption failed — note NOT saved to prevent plaintext leak.");
          // Return without saving rather than silently saving plaintext
          return;
        }
      }
      return _originalModify(file, data, options);
    };

    this.register(() => {
      this.app.vault.modify = _originalModify;
    });
  }

  // ── Bulk operations ────────────────────────────────────────────────────────

  /**
   * Encrypt all existing plaintext .md files in the vault.
   * Useful on first setup to encrypt notes you already have.
   */
  async encryptAllNotes() {
    if (!this.sessionKey) {
      new Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path)) continue;
      const content = await this.app.vault.read(file);
      if (this.isEncrypted(content)) continue;
      const encrypted = await this.encrypt(content);
      this._writingFiles.add(file.path);
      try {
        await this.app.vault.modify(file, encrypted);
      } finally {
        this._writingFiles.delete(file.path);
      }
      count++;
    }
    new Notice(`✅ Vault Cipher: encrypted ${count} notes.`);
  }

  async disableEncryption() {
    if (!this.sessionKey) {
      new Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path)) continue;
      const content = await this.app.vault.read(file);
      if (!this.isEncrypted(content)) continue;
      const plaintext = await this.decrypt(content);
      this._writingFiles.add(file.path);
      try {
        await this.app.vault.modify(file, plaintext);
      } finally {
        this._writingFiles.delete(file.path);
      }
      count++;
    }
    const keyFile = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (keyFile) await this.app.vault.delete(keyFile);
    this.lockVault();
    this.settings.enabled = false;
    await this.saveSettings();
    new Notice(`✅ Vault Cipher disabled. ${count} notes decrypted.`);
  }
}