import { PluginSettingTab, Setting, Notice } from "obsidian";
import { ConfirmModal, ChangePasswordModal, ImportKeyModal } from "./modals.js";

export const DEFAULT_SETTINGS = {
  enabled: false,
  keyBlobFile: ".vault-key",
  encryptedExtension: ".enc",
  excludedFolders: [],
  autoLockMinutes: 5,
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

    if (isEnabled && isUnlocked) {
      new Setting(containerEl)
        .setName("Lock vault")
        .setDesc("Clear the session key from memory.")
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
      .setDesc("Automatically lock the vault after N minutes (0 = disabled).")
      .addText((text) => {
        text.setPlaceholder("0")
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

    new Setting(containerEl)
      .setName("Excluded folders")
      .setDesc("Comma-separated folder paths to exclude from encryption.")
      .addText((text) => {
        text.setPlaceholder("Templates, Attachments")
          .setValue(this.plugin.settings.excludedFolders.join(", "))
          .onChange(async (val) => {
            this.plugin.settings.excludedFolders = val.split(",").map(s => s.trim()).filter(Boolean);
            await this.plugin.saveSettings();
          });
      });

    // Password change / key export/import
    containerEl.createEl("h3", { text: "Password & Key" });

    new Setting(containerEl)
      .setName("Change vault password")
      .setDesc("Re-wrap the vault key with a new password.")
      .addButton((btn) => {
        btn.setButtonText("Change password").onClick(() => {
          new ChangePasswordModal(this.app, this.plugin).open();
        });
      });

    new Setting(containerEl)
      .setName("Export .vault-key")
      .setDesc("Copy the .vault-key contents to clipboard for backup.")
      .addButton((btn) => {
        btn.setButtonText("Copy key blob").onClick(async () => {
          try {
            const blob = await this.plugin.readKeyBlob();
            if (navigator?.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(blob);
              new Notice("✅ .vault-key copied to clipboard. Store it safely.");
            } else {
              // fallback: show modal with text (simple prompt)
              window.prompt("Copy the .vault-key JSON (CTRL+C):", blob);
            }
          } catch (e) {
            new Notice("Failed to read .vault-key: " + e.message);
          }
        });
      });

    new Setting(containerEl)
      .setName("Import .vault-key")
      .setDesc("Paste a .vault-key JSON to overwrite current key (use with caution).")
      .addButton((btn) => {
        btn.setButtonText("Import key").onClick(() => {
          new ImportKeyModal(this.app, this.plugin).open();
        });
      });

    // Danger zone
    containerEl.createEl("h3", { text: "Danger Zone" });
    if (isEnabled) {
      new Setting(containerEl)
        .setName("Decrypt all notes and disable encryption")
        .setDesc("Permanently decrypts all notes and removes the key blob.")
        .addButton((btn) => {
          btn.setButtonText("Disable encryption").setClass("mod-warning").onClick(() => {
            if (!isUnlocked) {
              new Notice("Unlock the vault first.");
              return;
            }
            new ConfirmModal(this.app, {
              title: "Disable Vault Cipher?",
              message: "This will decrypt all your notes and delete the key blob. This cannot be undone.",
              confirmText: "Yes, decrypt everything",
              onConfirm: async () => {
                await this.plugin.disableEncryption();
                this.display();
              },
            }).open();
          });
        });
    }

    containerEl.createEl("h3", { text: "About" });
    containerEl.createEl("p", {
      text: "Vault Cipher encrypts your notes using Argon2id and ChaCha20-Poly1305. The vault key is stored in .vault-key at the vault root. Keep backups of that file.",
      cls: "vault-cipher-about",
    });
  }
}