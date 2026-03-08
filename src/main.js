/**
 * main.js — plugin entry.
 *
 * Updated to use async crypto helpers and to provide password-change/export/import UX.
 */

import { Plugin, TFile, Notice } from "obsidian";
import { generateVaultKey, createKeyBlob, unlockKeyBlob, encryptNote, decryptNote } from "./crypto.js";
import { UnlockModal, SetupModal, ChangePasswordModal, ImportKeyModal } from "./modals.js";
import { VaultCipherSettingsTab, DEFAULT_SETTINGS } from "./settings.js";

const KEY_BLOB_FILENAME = ".vault-key";
const CIPHER_MARKER = "vault-cipher:v1:";

export default class VaultCipherPlugin extends Plugin {
  sessionKey = null;
  _writingFiles = new Set();

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VaultCipherSettingsTab(this.app, this));

    this.registerEvent(this.app.vault.on("create", (file) => this.maybeHideFile(file)));

    this.app.workspace.onLayoutReady(async () => {
      this.hideKeyBlobFromExplorer();
      // Wait briefly for sync to land remote files before deciding to show Setup.
      // This reduces race conditions when a synced .vault-key arrives shortly after opening.
      await this.promptUnlock();
    });

    this.registerEvent(this.app.workspace.on("file-open", async (file) => {
      if (!file || !this.settings.enabled) return;
      await this.decryptFileIntoEditor(file);
      this.resetAutoLockTimer();
    }));

    this.registerEvent(this.app.workspace.on("editor-change", () => {
      if (this.sessionKey) this.resetAutoLockTimer();
    }));

    this.patchVaultModify();

    this.addCommand({
      id: "lock-vault",
      name: "Lock vault",
      callback: () => {
        this.lockVault();
        new Notice("🔒 Vault locked.");
      },
    });

    this.addCommand({
      id: "unlock-vault",
      name: "Unlock vault",
      callback: () => this.promptUnlock(),
    });

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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() { await this.saveData(this.settings); }

  lockVault() {
    if (this.sessionKey) this.sessionKey.fill(0);
    this.sessionKey = null;
    this.clearAutoLockTimer();
  }

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

  async waitForRemoteKey(ms = 3000, interval = 300) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (await this.keyBlobExists()) return true;
      await new Promise(r => setTimeout(r, interval));
    }
    return false;
  }

  async promptUnlock() {
    if (this.sessionKey) return;

    // If a remote .vault-key might land shortly, wait a short moment to avoid spuriously creating a new key.
    const sawRemote = await this.waitForRemoteKey(1500, 250);

    const keyBlobExists = await this.keyBlobExists();

    if (!keyBlobExists && !sawRemote) {
      new SetupModal(this.app, this, async (password) => {
        await this.setupEncryption(password);
      }).open();
    } else {
      new UnlockModal(this.app, async (password) => {
        return await this.unlockWithPassword(password);
      }).open();
    }
  }

  async unlockWithPassword(password) {
    try {
      const blobJson = await this.readKeyBlob();
      this.sessionKey = await unlockKeyBlob(password, blobJson);
      return true;
    } catch (e) {
      return false;
    }
  }

  async setupEncryption(password) {
    const vaultKey = generateVaultKey();
    const blob = await createKeyBlob(password, vaultKey);
    await this.writeKeyBlob(blob);
    this.sessionKey = vaultKey;
    this.settings.enabled = true;
    await this.saveSettings();
    this.hideKeyBlobFromExplorer();
  }

  // Change password: re-wrap in-place using sessionKey (must be unlocked)
  async changePassword(currentPasswordOrNull, newPassword) {
    // If unlocked, use sessionKey directly
    if (this.sessionKey) {
      const newBlob = await createKeyBlob(newPassword, this.sessionKey);
      await this.writeKeyBlob(newBlob);
      new Notice("✅ Password changed.");
      return true;
    }
    // If locked and currentPassword provided, try unlock then rewrap
    if (currentPasswordOrNull) {
      const ok = await this.unlockWithPassword(currentPasswordOrNull);
      if (!ok) return false;
      try {
        const newBlob = await createKeyBlob(newPassword, this.sessionKey);
        await this.writeKeyBlob(newBlob);
        new Notice("✅ Password changed.");
        return true;
      } finally {
        // keep session unlocked (user might expect to remain unlocked after changing)
      }
    }
    return false;
  }

  async keyBlobExists() {
    return this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME) instanceof TFile;
  }

  async readKeyBlob() {
    const file = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (!file) throw new Error("Key blob not found");
    return await this.app.vault.read(file);
  }

  async writeKeyBlob(content) {
    // Prefer to use the original modify/create functions to avoid double-encryption.
    const existing = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    try {
      if (existing instanceof TFile) {
        const writeFn = this._originalModify || this.app.vault.modify.bind(this.app.vault);
        await writeFn(existing, content);
      } else {
        await this.app.vault.create(KEY_BLOB_FILENAME, content);
      }
    } catch (e) {
      // Fallback to adapter write if available (attempt atomic write)
      try {
        const adapter = this.app.vault.adapter;
        if (adapter && adapter.write) {
          await adapter.write(KEY_BLOB_FILENAME, content);
        } else {
          throw e;
        }
      } catch (err) {
        console.error("Failed to write key blob:", err);
        throw err;
      }
    }
  }

  hideKeyBlobFromExplorer() {
    const styleId = "vault-cipher-hide-keyblob";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
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
    if (file.path === KEY_BLOB_FILENAME) this.hideKeyBlobFromExplorer();
  }

  isEncrypted(content) {
    return typeof content === "string" && content.startsWith(CIPHER_MARKER);
  }

  isExcluded(filePath) {
    if (filePath === KEY_BLOB_FILENAME) return true;
    return this.settings.excludedFolders.some((folder) =>
      filePath.startsWith(folder + "/") || filePath === folder
    );
  }

  async encrypt(plaintext) {
    if (!this.sessionKey) throw new Error("Vault is locked");
    const ciphertext = encryptNote(this.sessionKey, plaintext);
    return CIPHER_MARKER + ciphertext;
  }

  async decrypt(ciphertext) {
    if (!this.sessionKey) throw new Error("Vault is locked");
    const payload = ciphertext.slice(CIPHER_MARKER.length);
    return decryptNote(this.sessionKey, payload);
  }

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

  patchVaultModify() {
    const _originalModify = this.app.vault.modify.bind(this.app.vault);
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
          return;
        }
      }
      return _originalModify(file, data, options);
    };

    this.register(() => {
      this.app.vault.modify = _originalModify;
    });
  }

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