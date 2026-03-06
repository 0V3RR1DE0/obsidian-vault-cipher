/**
 * settings.js
 * Obsidian settings tab for Vault Cipher.
 */

import { PluginSettingTab, Setting, Notice } from "obsidian";
import { ConfirmModal } from "./modals.js";

export const DEFAULT_SETTINGS = {
  enabled: false,
  keyBlobFile: ".vault-key",
  encryptedExtension: ".enc",
  excludedFolders: [],
  autoLockMinutes: 5,  // lock after 5 minutes of inactivity (0 = disabled)
};

export class VaultCipherSettingsTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Vault Cipher Settings" });

    // ── Status ──────────────────────────────────────────────────────────────
    const statusDiv = containerEl.createDiv({ cls: "vault-cipher-status" });
    const isUnlocked = this.plugin.sessionKey !== null;
    const isEnabled = this.plugin.settings.enabled;

    statusDiv.createEl("p", {
      text: isEnabled
        ? isUnlocked
          ? "🔓 Vault is unlocked for this session."
          : "🔒 Vault is locked. Notes are encrypted."
        : "⚠️ Encryption is not enabled for this vault.",
    });

    // ── Lock / Unlock ────────────────────────────────────────────────────────
    if (isEnabled && isUnlocked) {
      new Setting(containerEl)
        .setName("Lock vault")
        .setDesc("Clear the session key from memory. Notes will be unreadable until you unlock again.")
        .addButton((btn) => {
          btn.setButtonText("Lock now").onClick(() => {
            this.plugin.lockVault();
            new Notice("Vault locked.");
            this.display();
          });
        });
    }

    new Setting(containerEl)
      .setName("Auto-lock after inactivity")
      .setDesc("Automatically lock the vault after N minutes of no note opens. Set to 0 to disable.")
      .addText((text) => {
        text
          .setPlaceholder("0")
          .setValue(String(this.plugin.settings.autoLockMinutes ?? 0))
          .onChange(async (val) => {
            const mins = parseInt(val, 10);
            this.plugin.settings.autoLockMinutes = isNaN(mins) || mins < 0 ? 0 : mins;
            await this.plugin.saveSettings();
            this.plugin.resetAutoLockTimer();
          });
        text.inputEl.type = "number";
        text.inputEl.min = "0";
      });

    // ── Excluded folders ────────────────────────────────────────────────────
    new Setting(containerEl)
      .setName("Excluded folders")
      .setDesc("Comma-separated folder paths to exclude from encryption (e.g. Templates, Attachments).")
      .addText((text) => {
        text
          .setPlaceholder("Templates, Attachments")
          .setValue(this.plugin.settings.excludedFolders.join(", "))
          .onChange(async (val) => {
            this.plugin.settings.excludedFolders = val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            await this.plugin.saveSettings();
          });
      });

    // ── Danger zone ─────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "Danger Zone" });

    if (isEnabled) {
      new Setting(containerEl)
        .setName("Decrypt all notes and disable encryption")
        .setDesc(
          "Permanently decrypts all notes and removes the key blob. " +
          "You must be unlocked to do this. This cannot be undone."
        )
        .addButton((btn) => {
          btn.setButtonText("Disable encryption").setClass("mod-warning").onClick(() => {
            if (!isUnlocked) {
              new Notice("Unlock the vault first.");
              return;
            }
            new ConfirmModal(this.app, {
              title: "Disable Vault Cipher?",
              message:
                "This will decrypt all your notes and delete the key blob. " +
                "Anyone with access to your vault files will be able to read them. " +
                "This cannot be undone.",
              confirmText: "Yes, decrypt everything",
              onConfirm: async () => {
                await this.plugin.disableEncryption();
                this.display();
              },
            }).open();
          });
        });
    }

    // ── About ────────────────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: "About" });
    containerEl.createEl("p", {
      text: "Vault Cipher encrypts your notes using Argon2id for key derivation and ChaCha20-Poly1305 for encryption. " +
            "Your vault key is derived from your password using Argon2id and stored encrypted in " +
            ".vault-key at the vault root. This file syncs with LiveSync or any other sync tool.",
      cls: "vault-cipher-about",
    });
  }
}