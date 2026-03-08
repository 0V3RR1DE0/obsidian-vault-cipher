/**
 * modals.js
 * SetupModal, UnlockModal, ChangePasswordModal, ImportKeyModal, ConfirmModal
 */

import { Modal, Notice } from "obsidian";

// ── Shared helpers ─────────────────────────────────────────────────────────────

/**
 * Build a password field with show/hide toggle and return { wrap, input }.
 * @param {HTMLElement} parent
 * @param {string} placeholder
 * @param {string} autocomplete
 */
function makePasswordField(parent, placeholder, autocomplete = "current-password") {
  const wrap  = parent.createDiv({ cls: "vault-cipher-input-wrap" });
  const input = wrap.createEl("input", { type: "password", placeholder });
  input.autocomplete = autocomplete;

  const eye = wrap.createEl("button", { cls: "vault-cipher-eye", text: "👁" });
  eye.type = "button";
  eye.setAttribute("aria-label", "Show/hide password");
  eye.addEventListener("mousedown", (e) => {
    e.preventDefault(); // prevent blur on the input
    const isHidden = input.type === "password";
    input.type  = isHidden ? "text" : "password";
    eye.textContent = isHidden ? "🙈" : "👁";
  });

  return { wrap, input };
}

/**
 * Score a password 0–4 for strength.
 * Simple heuristic — not a crypto primitive.
 */
function scorePassword(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_CLASS = ["", "is-error", "is-warn", "is-warn", "is-ok"];

/**
 * Build a 4-segment strength bar and a hint line.
 * Returns { bars: HTMLElement[], hint: HTMLElement, update(pw) }
 */
function makeStrengthMeter(parent) {
  const barRow = parent.createDiv({ cls: "vault-cipher-strength" });
  const bars   = Array.from({ length: 4 }, () =>
    barRow.createDiv({ cls: "vault-cipher-strength-bar" })
  );
  const hint = parent.createDiv({ cls: "vault-cipher-hint" });

  function update(pw) {
    const score = scorePassword(pw);
    bars.forEach((b, i) => {
      b.className = "vault-cipher-strength-bar";
      if (pw.length > 0 && i < score) b.classList.add(`active-${score}`);
    });
    if (!pw) {
      hint.textContent = "";
      hint.className   = "vault-cipher-hint";
    } else {
      hint.textContent = STRENGTH_LABEL[score] || "Weak";
      hint.className   = `vault-cipher-hint ${STRENGTH_CLASS[score]}`;
    }
  }

  return { bars, hint, update };
}

// ── Setup Modal ────────────────────────────────────────────────────────────────

export class SetupModal extends Modal {
  constructor(app, plugin, onSubmit) {
    super(app);
    this.plugin   = plugin;
    this.onSubmit = onSubmit;
    this.password = "";
    this.confirm  = "";
  }

  async onOpen() {
    const { contentEl } = this;

    // Race condition guard: if a .vault-key appeared (e.g. LiveSync just synced it)
    // redirect straight to unlock instead of creating a new key over it.
    try {
      if (await this.plugin.keyBlobExists()) {
        this.close();
        new UnlockModal(this.app,
          (pw) => this.plugin.unlockWithPassword(pw)
        ).open();
        return;
      }
    } catch (e) { /* ignore, proceed with setup */ }

    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    // Header
    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "🔐", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Set Up Vault Cipher" });

    contentEl.createEl("p", {
      text: "Your notes will be encrypted on disk and only readable while your vault is unlocked.",
      cls: "vault-cipher-subtitle",
    });

    // How it works
    const how = contentEl.createDiv({ cls: "vault-cipher-how" });
    how.createEl("strong", { text: "How it works" });
    const steps = how.createEl("ol");
    [
      "A random 256-bit vault key is generated for this vault.",
      "Your password is hashed with Argon2id (64 MB, 3 iterations) producing a wrapping key.",
      "The wrapping key encrypts the vault key with ChaCha20-Poly1305 — stored as .vault-key.",
      "Every note is encrypted with the vault key + a unique random nonce on each save.",
      "On unlock, your password unwraps the vault key into memory. Notes decrypt transparently.",
    ].forEach(s => steps.createEl("li", { text: s }));

    // Warning
    const warning = contentEl.createDiv({ cls: "vault-cipher-warning" });
    warning.createSpan({ text: "⚠️", cls: "vault-cipher-warning-icon" });
    const wt = warning.createDiv({ cls: "vault-cipher-warning-text" });
    wt.createEl("strong", { text: "No password recovery" });
    wt.createEl("span", {
      text: "If you forget your password, your notes are permanently unrecoverable. " +
            "There is no reset, no backdoor. Store your password in a password manager.",
    });

    // Fields
    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });

    // Password
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const { input: pwInput } = makePasswordField(pwField, "Choose a strong password…", "new-password");
    const strength = makeStrengthMeter(pwField);

    // Confirm
    const cfField = fields.createDiv({ cls: "vault-cipher-field" });
    cfField.createEl("label", { text: "Confirm password" });
    const { input: cfInput } = makePasswordField(cfField, "Repeat password…", "new-password");
    const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });

    // Live validation
    const validate = () => {
      this.password = pwInput.value;
      this.confirm  = cfInput.value;
      strength.update(this.password);

      if (this.confirm.length === 0) {
        cfHint.textContent = "";
        cfHint.className   = "vault-cipher-hint";
        cfInput.classList.remove("is-error");
      } else if (this.confirm === this.password) {
        cfHint.textContent = "✓ Passwords match";
        cfHint.className   = "vault-cipher-hint is-ok";
        cfInput.classList.remove("is-error");
      } else {
        cfHint.textContent = "Passwords don't match";
        cfHint.className   = "vault-cipher-hint is-error";
        cfInput.classList.add("is-error");
      }
    };

    pwInput.addEventListener("input", validate);
    cfInput.addEventListener("input", validate);
    cfInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.submit(pwInput, cfInput, setupBtn);
    });

    // Buttons
    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new Notice("Vault Cipher: setup cancelled. Notes will not be encrypted.");
    });

    const altBtn = buttonRow.createEl("button", {
      text: "I already have a key",
      cls: "btn-secondary",
    });
    altBtn.addEventListener("click", () => {
      this.close();
      new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
    });

    const setupBtn = buttonRow.createEl("button", {
      text: "Set up encryption",
      cls: "btn-primary",
    });
    setupBtn.addEventListener("click", () => this.submit(pwInput, cfInput, setupBtn));

    setTimeout(() => pwInput.focus(), 50);
  }

  async submit(pwInput, cfInput, btn) {
    // Final race-condition check before committing
    try {
      if (await this.plugin.keyBlobExists()) {
        new Notice("A vault key was detected — unlocking instead.");
        this.close();
        new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
        return;
      }
    } catch (e) { /* ignore */ }

    if (!this.password)              { pwInput.focus(); return; }
    if (this.password.length < 8)    { new Notice("Password must be at least 8 characters."); pwInput.focus(); return; }
    if (this.password !== this.confirm) { new Notice("Passwords don't match."); cfInput.focus(); return; }

    btn.disabled    = true;
    btn.textContent = "Setting up… (Argon2id hashing, takes a moment)";

    try {
      await this.onSubmit(this.password);
      new Notice("✅ Vault Cipher active. Your notes are now encrypted.");
      this.close();
    } catch (e) {
      console.error("Vault Cipher setup error:", e);
      new Notice("❌ Setup failed: " + e.message);
      btn.disabled    = false;
      btn.textContent = "Set up encryption";
    }
  }

  onClose() { this.contentEl.empty(); }
}

// ── Unlock Modal ───────────────────────────────────────────────────────────────

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

    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "🔒", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Vault Locked" });

    contentEl.createEl("p", {
      text: "Enter your vault password. The vault key will be held in memory until you lock or close Obsidian.",
      cls: "vault-cipher-subtitle",
    });

    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
    const pwField = fields.createDiv({ cls: "vault-cipher-field" });
    pwField.createEl("label", { text: "Password" });
    const { input: pwInput } = makePasswordField(pwField, "Enter vault password…", "current-password");

    pwInput.addEventListener("input", () => { this.password = pwInput.value; });
    pwInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.submit(pwInput, unlockBtn);
    });

    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => {
      this.close();
      new Notice("Vault remains locked. Encrypted notes will show as ciphertext.");
    });

    const unlockBtn = buttonRow.createEl("button", { text: "Unlock", cls: "btn-primary" });
    unlockBtn.addEventListener("click", () => this.submit(pwInput, unlockBtn));

    setTimeout(() => pwInput.focus(), 50);
  }

  async submit(pwInput, btn) {
    if (!this.password) { pwInput.focus(); return; }

    btn.disabled    = true;
    btn.textContent = "Unlocking…";

    try {
      const success = await this.onSubmit(this.password);
      if (success) {
        new Notice("✅ Vault unlocked.");
        this.close();
      } else {
        new Notice("❌ Wrong password.");
        btn.disabled    = false;
        btn.textContent = "Unlock";
        pwInput.value   = "";
        this.password   = "";
        pwInput.focus();
      }
    } catch (e) {
      console.error("Vault Cipher unlock error:", e);
      new Notice("❌ Unlock failed: " + e.message);
      btn.disabled    = false;
      btn.textContent = "Unlock";
    }
  }

  onClose() { this.contentEl.empty(); }
}

// ── Change Password Modal ──────────────────────────────────────────────────────

export class ChangePasswordModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin  = plugin;
    this.current = "";
    this.newPass = "";
    this.confirm = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "🔑", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Change Vault Password" });

    const isUnlocked = !!this.plugin.sessionKey;
    contentEl.createEl("p", {
      text: isUnlocked
        ? "Enter a new password to re-wrap the vault key."
        : "Enter your current password and a new password.",
      cls: "vault-cipher-subtitle",
    });

    const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });

    let curInput = null;
    if (!isUnlocked) {
      const curField = fields.createDiv({ cls: "vault-cipher-field" });
      curField.createEl("label", { text: "Current password" });
      const pw = makePasswordField(curField, "Current password…", "current-password");
      curInput = pw.input;
      curInput.addEventListener("input", () => { this.current = curInput.value; });
    }

    const newField = fields.createDiv({ cls: "vault-cipher-field" });
    newField.createEl("label", { text: "New password" });
    const { input: newInput } = makePasswordField(newField, "New password…", "new-password");
    const strength = makeStrengthMeter(newField);
    newInput.addEventListener("input", () => {
      this.newPass = newInput.value;
      strength.update(this.newPass);
    });

    const cfField = fields.createDiv({ cls: "vault-cipher-field" });
    cfField.createEl("label", { text: "Confirm new password" });
    const { input: cfInput } = makePasswordField(cfField, "Repeat new password…", "new-password");
    const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });
    cfInput.addEventListener("input", () => {
      this.confirm = cfInput.value;
      if (!this.confirm) {
        cfHint.textContent = ""; cfHint.className = "vault-cipher-hint";
      } else if (this.confirm === this.newPass) {
        cfHint.textContent = "✓ Passwords match"; cfHint.className = "vault-cipher-hint is-ok";
      } else {
        cfHint.textContent = "Passwords don't match"; cfHint.className = "vault-cipher-hint is-error";
      }
    });

    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const saveBtn = buttonRow.createEl("button", { text: "Change password", cls: "btn-primary" });
    saveBtn.addEventListener("click", () => this.submit(saveBtn, newInput, cfInput));
  }

  async submit(btn, newInput, cfInput) {
    if (!this.newPass || this.newPass.length < 8) {
      new Notice("New password must be at least 8 characters."); newInput.focus(); return;
    }
    if (this.newPass !== this.confirm) {
      new Notice("Passwords don't match."); cfInput.focus(); return;
    }

    btn.disabled    = true;
    btn.textContent = "Changing…";

    try {
      const ok = await this.plugin.changePassword(this.current || null, this.newPass);
      if (ok) {
        new Notice("✅ Password changed.");
        this.close();
      } else {
        new Notice("❌ Failed — current password may be incorrect.");
        btn.disabled    = false;
        btn.textContent = "Change password";
      }
    } catch (e) {
      console.error("Change password error:", e);
      new Notice("❌ Error: " + e.message);
      btn.disabled    = false;
      btn.textContent = "Change password";
    }
  }

  onClose() { this.contentEl.empty(); }
}

// ── Import Key Modal ───────────────────────────────────────────────────────────

export class ImportKeyModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.text   = "";
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("vault-cipher-modal");

    const header = contentEl.createDiv({ cls: "vault-cipher-header" });
    header.createSpan({ text: "📥", cls: "vault-cipher-icon" });
    header.createEl("h2", { text: "Import .vault-key" });

    contentEl.createEl("p", {
      text: "Paste the contents of a .vault-key JSON file. This will overwrite the current key blob.",
      cls: "vault-cipher-subtitle",
    });

    const ta = contentEl.createEl("textarea", { cls: "vault-cipher-large-textarea" });
    ta.placeholder = '{"v":1,"salt":"…","encryptedKey":"…"}';
    ta.addEventListener("input", () => { this.text = ta.value.trim(); });

    contentEl.createEl("hr", { cls: "vault-cipher-divider" });
    const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });

    const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const importBtn = buttonRow.createEl("button", { text: "Import", cls: "btn-primary mod-warning" });
    importBtn.addEventListener("click", async () => {
      if (!this.text) { new Notice("Paste the .vault-key JSON first."); return; }
      let parsed;
      try { parsed = JSON.parse(this.text); } catch { new Notice("Invalid JSON — paste the full .vault-key contents."); return; }
      if (parsed.v !== 4)  { new Notice(`❌ Key blob version ${parsed.v ?? "unknown"} is not supported by this plugin version.`); return; }
      if (!parsed.salt)    { new Notice("❌ Key blob is missing the salt field."); return; }
      if (!parsed.encryptedKey) { new Notice("❌ Key blob is missing the encryptedKey field."); return; }

      this.close();
      new ConfirmModal(this.app, {
        title:       "Overwrite .vault-key?",
        message:     "This will replace the current vault key. Make sure you have a backup first.",
        confirmText: "Yes, overwrite",
        onConfirm:   async () => {
          try {
            await this.plugin.writeKeyBlob(this.text);
            new Notice("✅ .vault-key imported.");
          } catch (e) {
            new Notice("❌ Import failed: " + e.message);
          }
        },
      }).open();
    });
  }

  onClose() { this.contentEl.empty(); }
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────

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
    confirmBtn.addEventListener("click", () => { this.close(); this.onConfirm(); });
  }

  onClose() { this.contentEl.empty(); }
}