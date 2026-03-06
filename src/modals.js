/**
 * modals.js
 * UI modals for Vault Cipher.
 */

import { Modal, Notice } from "obsidian";

// ── Setup Modal (first launch) ─────────────────────────────────────────────────

/**
 * Shown once on first launch. Walks the user through choosing a password
 * and explains exactly how the encryption works.
 */
export class SetupModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.password = "";
    this.confirm  = "";
    // Prevent closing by clicking outside during setup
    this.modalEl.addEventListener("click", (e) => e.stopPropagation());
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    // ── Header ──────────────────────────────────────────────────────────────
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "🔐", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Set Up Vault Cipher" });

    contentEl.createEl("p", {
      text: "Your notes will be encrypted on disk and only readable while your vault is unlocked.",
      cls: "vault-cipher-subtitle",
    });

    // ── How it works ────────────────────────────────────────────────────────
    const how = contentEl.createDiv({ cls: "vault-cipher-how" });
    how.createEl("strong", { text: "How it works" });
    const steps = how.createEl("ol");
    [
      "A random 256-bit vault key is generated for this vault.",
      "Your password is hashed with Argon2id (128 MB, 3 iterations) to produce a wrapping key.",
      "The wrapping key encrypts the vault key with ChaCha20-Poly1305 — stored as .vault-key.",
      "Every note is encrypted with the vault key + a unique random nonce on each save.",
      "On unlock, your password unwraps the vault key into memory. Notes decrypt transparently.",
    ].forEach(s => steps.createEl("li", { text: s }));

    // ── Warning ─────────────────────────────────────────────────────────────
    const warning = contentEl.createDiv({ cls: "vault-cipher-warning" });
    warning.createSpan({ text: "⚠️", cls: "vault-cipher-warning-icon" });
    const warnText = warning.createDiv({ cls: "vault-cipher-warning-text" });
    warnText.createEl("strong", { text: "No password recovery" });
    warnText.createEl("span", {
      text: "If you forget your password, your notes are permanently unrecoverable. " +
            "There is no reset, no backdoor, no support ticket that can help. " +
            "Store your password in a password manager.",
    });

    // ── Fields ───────────────────────────────────────────────────────────────
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });

    // Password field
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const pwInput = pwField.createEl("input", {
      type: "password",
      placeholder: "Choose a strong password…",
    });
    pwInput.autocomplete = "new-password";
    const pwHint = pwField.createDiv({ cls: "vault-cipher-hint" });

    // Confirm field
    const cfField = fields.createDiv({ cls: "vault-cipher-field" });
    cfField.createEl("label", { text: "Confirm password" });
    const cfInput = cfField.createEl("input", {
      type: "password",
      placeholder: "Repeat password…",
    });
    cfInput.autocomplete = "new-password";
    const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });

    // ── Live validation ──────────────────────────────────────────────────────
    const validate = () => {
      this.password = pwInput.value;
      this.confirm  = cfInput.value;

      // Password strength hint
      if (this.password.length === 0) {
        pwHint.textContent = "";
        pwHint.className = "vault-cipher-hint";
      } else if (this.password.length < 8) {
        pwHint.textContent = "Too short — use at least 8 characters.";
        pwHint.className = "vault-cipher-hint is-error";
        pwInput.classList.add("is-error");
      } else if (this.password.length < 12) {
        pwHint.textContent = "Acceptable, but longer is stronger.";
        pwHint.className = "vault-cipher-hint";
        pwInput.classList.remove("is-error");
      } else {
        pwHint.textContent = "✓ Strong password.";
        pwHint.className = "vault-cipher-hint is-ok";
        pwInput.classList.remove("is-error");
      }

      // Confirm match hint
      if (this.confirm.length === 0) {
        cfHint.textContent = "";
        cfHint.className = "vault-cipher-hint";
        cfInput.classList.remove("is-error");
      } else if (this.confirm === this.password) {
        cfHint.textContent = "✓ Passwords match.";
        cfHint.className = "vault-cipher-hint is-ok";
        cfInput.classList.remove("is-error");
      } else {
        cfHint.textContent = "Passwords don't match.";
        cfHint.className = "vault-cipher-hint is-error";
        cfInput.classList.add("is-error");
      }
    };

    pwInput.addEventListener("input", validate);
    cfInput.addEventListener("input", validate);
    cfInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.submit(pwInput, cfInput, setupBtn);
    });

    // ── Buttons ──────────────────────────────────────────────────────────────
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", {
      text: "Cancel",
      cls: "btn-cancel",
    });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new Notice("Vault Cipher: setup cancelled. The plugin will not encrypt notes until set up.");
    });

    const setupBtn = buttonRow.createEl("button", {
      text: "Set up encryption",
      cls: "btn-primary",
    });
    setupBtn.addEventListener("click", () => this.submit(pwInput, cfInput, setupBtn));

    // Focus password input
    setTimeout(() => pwInput.focus(), 50);
  }

  async submit(pwInput, cfInput, btn) {
    if (!this.password) {
      pwInput.focus();
      return;
    }
    if (this.password.length < 8) {
      new Notice("Password must be at least 8 characters.");
      pwInput.focus();
      return;
    }
    if (this.password !== this.confirm) {
      new Notice("Passwords don't match.");
      cfInput.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Setting up… (Argon2id hashing, this takes a moment)";

    try {
      await this.onSubmit(this.password);
      new Notice("✅ Vault Cipher is active. Your notes are now encrypted.");
      this.close();
    } catch (e) {
      console.error("Vault Cipher setup error:", e);
      new Notice("❌ Setup failed: " + e.message);
      btn.disabled = false;
      btn.textContent = "Set up encryption";
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── Unlock Modal (returning session) ──────────────────────────────────────────

/**
 * Shown on every vault open after setup. User enters password to unlock session.
 */
export class UnlockModal extends Modal {
  constructor(app, onSubmit) {
    super(app);
    this.onSubmit = onSubmit;
    this.password = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    // ── Header ──────────────────────────────────────────────────────────────
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "🔒", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Vault Locked" });

    contentEl.createEl("p", {
      text: "Enter your vault password to decrypt your notes for this session. " +
            "The vault key will be held in memory until you lock or close Obsidian.",
      cls: "vault-cipher-subtitle",
    });

    // ── Field ────────────────────────────────────────────────────────────────
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const pwInput = pwField.createEl("input", {
      type: "password",
      placeholder: "Enter vault password…",
    });
    pwInput.autocomplete = "current-password";
    pwInput.addEventListener("input", () => { this.password = pwInput.value; });
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.submit(pwInput, unlockBtn);
    });

    // ── Buttons ──────────────────────────────────────────────────────────────
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", {
      text: "Cancel",
      cls: "btn-cancel",
    });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new Notice("Vault Cipher: vault remains locked. Encrypted notes will show as ciphertext.");
    });

    const unlockBtn = buttonRow.createEl("button", {
      text: "Unlock",
      cls: "btn-primary",
    });
    unlockBtn.addEventListener("click", () => this.submit(pwInput, unlockBtn));

    setTimeout(() => pwInput.focus(), 50);
  }

  async submit(pwInput, btn) {
    if (!this.password) {
      pwInput.focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = "Unlocking…";

    try {
      const success = await this.onSubmit(this.password);
      if (success) {
        new Notice("✅ Vault unlocked.");
        this.close();
      } else {
        new Notice("❌ Wrong password.");
        btn.disabled = false;
        btn.textContent = "Unlock";
        pwInput.value = "";
        this.password = "";
        pwInput.focus();
      }
    } catch (e) {
      console.error("Vault Cipher unlock error:", e);
      new Notice("❌ Unlock failed: " + e.message);
      btn.disabled = false;
      btn.textContent = "Unlock";
    }
  }

  onClose() {
    this.contentEl.empty();
  }
}

// ── Confirm Modal (danger zone actions) ───────────────────────────────────────

export class ConfirmModal extends Modal {
  constructor(app, { title, message, confirmText, onConfirm }) {
    super(app);
    this.title       = title;
    this.message     = message;
    this.confirmText = confirmText || "Confirm";
    this.onConfirm   = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "⚠️", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: this.title });

    contentEl.createEl("p", { text: this.message, cls: "vault-cipher-subtitle" });

    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const confirmBtn = buttonRow.createEl("button", {
      text: this.confirmText,
      cls: "btn-primary mod-warning",
    });
    confirmBtn.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}