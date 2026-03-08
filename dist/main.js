var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/modals.js
var modals_exports = {};
__export(modals_exports, {
  ChangePasswordModal: () => ChangePasswordModal,
  ConfirmModal: () => ConfirmModal,
  ImportKeyModal: () => ImportKeyModal,
  SetupModal: () => SetupModal,
  UnlockModal: () => UnlockModal
});
function makePasswordField(parent, placeholder, autocomplete = "current-password") {
  const wrap = parent.createDiv({ cls: "vault-cipher-input-wrap" });
  const input = wrap.createEl("input", { type: "password", placeholder });
  input.autocomplete = autocomplete;
  const eye = wrap.createEl("button", { cls: "vault-cipher-eye", text: "\u{1F441}" });
  eye.type = "button";
  eye.setAttribute("aria-label", "Show/hide password");
  eye.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    eye.textContent = isHidden ? "\u{1F648}" : "\u{1F441}";
  });
  return { wrap, input };
}
function scorePassword(pw) {
  if (!pw)
    return 0;
  let score = 0;
  if (pw.length >= 8)
    score++;
  if (pw.length >= 14)
    score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))
    score++;
  if (/[0-9]/.test(pw))
    score++;
  if (/[^A-Za-z0-9]/.test(pw))
    score++;
  return Math.min(score, 4);
}
function makeStrengthMeter(parent) {
  const barRow = parent.createDiv({ cls: "vault-cipher-strength" });
  const bars = Array.from(
    { length: 4 },
    () => barRow.createDiv({ cls: "vault-cipher-strength-bar" })
  );
  const hint = parent.createDiv({ cls: "vault-cipher-hint" });
  function update(pw) {
    const score = scorePassword(pw);
    bars.forEach((b, i) => {
      b.className = "vault-cipher-strength-bar";
      if (pw.length > 0 && i < score)
        b.classList.add(`active-${score}`);
    });
    if (!pw) {
      hint.textContent = "";
      hint.className = "vault-cipher-hint";
    } else {
      hint.textContent = STRENGTH_LABEL[score] || "Weak";
      hint.className = `vault-cipher-hint ${STRENGTH_CLASS[score]}`;
    }
  }
  return { bars, hint, update };
}
var import_obsidian, STRENGTH_LABEL, STRENGTH_CLASS, SetupModal, UnlockModal, ChangePasswordModal, ImportKeyModal, ConfirmModal;
var init_modals = __esm({
  "src/modals.js"() {
    import_obsidian = require("obsidian");
    STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
    STRENGTH_CLASS = ["", "is-error", "is-warn", "is-warn", "is-ok"];
    SetupModal = class extends import_obsidian.Modal {
      constructor(app, plugin, onSubmit) {
        super(app);
        this.plugin = plugin;
        this.onSubmit = onSubmit;
        this.password = "";
        this.confirm = "";
      }
      async onOpen() {
        const { contentEl } = this;
        try {
          if (await this.plugin.keyBlobExists()) {
            this.close();
            new UnlockModal(
              this.app,
              (pw) => this.plugin.unlockWithPassword(pw)
            ).open();
            return;
          }
        } catch (e) {
        }
        contentEl.empty();
        contentEl.addClass("vault-cipher-modal");
        const header = contentEl.createDiv({ cls: "vault-cipher-header" });
        header.createSpan({ text: "\u{1F510}", cls: "vault-cipher-icon" });
        header.createEl("h2", { text: "Set Up Vault Cipher" });
        contentEl.createEl("p", {
          text: "Your notes will be encrypted on disk and only readable while your vault is unlocked.",
          cls: "vault-cipher-subtitle"
        });
        const how = contentEl.createDiv({ cls: "vault-cipher-how" });
        how.createEl("strong", { text: "How it works" });
        const steps = how.createEl("ol");
        [
          "A random 256-bit vault key is generated for this vault.",
          "Your password is hashed with Argon2id (128 MB, 3 iterations) producing a wrapping key.",
          "The wrapping key encrypts the vault key with ChaCha20-Poly1305 \u2014 stored as .vault-key.",
          "Every note is encrypted with the vault key + a unique random nonce on each save.",
          "On unlock, your password unwraps the vault key into memory. Notes decrypt transparently."
        ].forEach((s) => steps.createEl("li", { text: s }));
        const warning = contentEl.createDiv({ cls: "vault-cipher-warning" });
        warning.createSpan({ text: "\u26A0\uFE0F", cls: "vault-cipher-warning-icon" });
        const wt = warning.createDiv({ cls: "vault-cipher-warning-text" });
        wt.createEl("strong", { text: "No password recovery" });
        wt.createEl("span", {
          text: "If you forget your password, your notes are permanently unrecoverable. There is no reset, no backdoor. Store your password in a password manager."
        });
        const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
        const pwField = fields.createDiv({ cls: "vault-cipher-field" });
        pwField.createEl("label", { text: "Password" });
        const { input: pwInput } = makePasswordField(pwField, "Choose a strong password\u2026", "new-password");
        const strength = makeStrengthMeter(pwField);
        const cfField = fields.createDiv({ cls: "vault-cipher-field" });
        cfField.createEl("label", { text: "Confirm password" });
        const { input: cfInput } = makePasswordField(cfField, "Repeat password\u2026", "new-password");
        const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });
        const validate = () => {
          this.password = pwInput.value;
          this.confirm = cfInput.value;
          strength.update(this.password);
          if (this.confirm.length === 0) {
            cfHint.textContent = "";
            cfHint.className = "vault-cipher-hint";
            cfInput.classList.remove("is-error");
          } else if (this.confirm === this.password) {
            cfHint.textContent = "\u2713 Passwords match";
            cfHint.className = "vault-cipher-hint is-ok";
            cfInput.classList.remove("is-error");
          } else {
            cfHint.textContent = "Passwords don't match";
            cfHint.className = "vault-cipher-hint is-error";
            cfInput.classList.add("is-error");
          }
        };
        pwInput.addEventListener("input", validate);
        cfInput.addEventListener("input", validate);
        cfInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter")
            this.submit(pwInput, cfInput, setupBtn);
        });
        contentEl.createEl("hr", { cls: "vault-cipher-divider" });
        const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
        const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
        cancelBtn.addEventListener("click", () => {
          this.close();
          new import_obsidian.Notice("Vault Cipher: setup cancelled. Notes will not be encrypted.");
        });
        const altBtn = buttonRow.createEl("button", {
          text: "I already have a key",
          cls: "btn-secondary"
        });
        altBtn.addEventListener("click", () => {
          this.close();
          new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
        });
        const setupBtn = buttonRow.createEl("button", {
          text: "Set up encryption",
          cls: "btn-primary"
        });
        setupBtn.addEventListener("click", () => this.submit(pwInput, cfInput, setupBtn));
        setTimeout(() => pwInput.focus(), 50);
      }
      async submit(pwInput, cfInput, btn) {
        try {
          if (await this.plugin.keyBlobExists()) {
            new import_obsidian.Notice("A vault key was detected \u2014 unlocking instead.");
            this.close();
            new UnlockModal(this.app, (pw) => this.plugin.unlockWithPassword(pw)).open();
            return;
          }
        } catch (e) {
        }
        if (!this.password) {
          pwInput.focus();
          return;
        }
        if (this.password.length < 8) {
          new import_obsidian.Notice("Password must be at least 8 characters.");
          pwInput.focus();
          return;
        }
        if (this.password !== this.confirm) {
          new import_obsidian.Notice("Passwords don't match.");
          cfInput.focus();
          return;
        }
        btn.disabled = true;
        btn.textContent = "Setting up\u2026 (Argon2id hashing, takes a moment)";
        try {
          await this.onSubmit(this.password);
          new import_obsidian.Notice("\u2705 Vault Cipher active. Your notes are now encrypted.");
          this.close();
        } catch (e) {
          console.error("Vault Cipher setup error:", e);
          new import_obsidian.Notice("\u274C Setup failed: " + e.message);
          btn.disabled = false;
          btn.textContent = "Set up encryption";
        }
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    UnlockModal = class extends import_obsidian.Modal {
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
        header.createSpan({ text: "\u{1F512}", cls: "vault-cipher-icon" });
        header.createEl("h2", { text: "Vault Locked" });
        contentEl.createEl("p", {
          text: "Enter your vault password. The vault key will be held in memory until you lock or close Obsidian.",
          cls: "vault-cipher-subtitle"
        });
        const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
        const pwField = fields.createDiv({ cls: "vault-cipher-field" });
        pwField.createEl("label", { text: "Password" });
        const { input: pwInput } = makePasswordField(pwField, "Enter vault password\u2026", "current-password");
        pwInput.addEventListener("input", () => {
          this.password = pwInput.value;
        });
        pwInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter")
            this.submit(pwInput, unlockBtn);
        });
        contentEl.createEl("hr", { cls: "vault-cipher-divider" });
        const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
        const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
        cancelBtn.addEventListener("click", () => {
          this.close();
          new import_obsidian.Notice("Vault remains locked. Encrypted notes will show as ciphertext.");
        });
        const unlockBtn = buttonRow.createEl("button", { text: "Unlock", cls: "btn-primary" });
        unlockBtn.addEventListener("click", () => this.submit(pwInput, unlockBtn));
        setTimeout(() => pwInput.focus(), 50);
      }
      async submit(pwInput, btn) {
        if (!this.password) {
          pwInput.focus();
          return;
        }
        btn.disabled = true;
        btn.textContent = "Unlocking\u2026";
        try {
          const success = await this.onSubmit(this.password);
          if (success) {
            new import_obsidian.Notice("\u2705 Vault unlocked.");
            this.close();
          } else {
            new import_obsidian.Notice("\u274C Wrong password.");
            btn.disabled = false;
            btn.textContent = "Unlock";
            pwInput.value = "";
            this.password = "";
            pwInput.focus();
          }
        } catch (e) {
          console.error("Vault Cipher unlock error:", e);
          new import_obsidian.Notice("\u274C Unlock failed: " + e.message);
          btn.disabled = false;
          btn.textContent = "Unlock";
        }
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    ChangePasswordModal = class extends import_obsidian.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.current = "";
        this.newPass = "";
        this.confirm = "";
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("vault-cipher-modal");
        const header = contentEl.createDiv({ cls: "vault-cipher-header" });
        header.createSpan({ text: "\u{1F511}", cls: "vault-cipher-icon" });
        header.createEl("h2", { text: "Change Vault Password" });
        const isUnlocked = !!this.plugin.sessionKey;
        contentEl.createEl("p", {
          text: isUnlocked ? "Enter a new password to re-wrap the vault key." : "Enter your current password and a new password.",
          cls: "vault-cipher-subtitle"
        });
        const fields = contentEl.createDiv({ cls: "vault-cipher-fields" });
        let curInput = null;
        if (!isUnlocked) {
          const curField = fields.createDiv({ cls: "vault-cipher-field" });
          curField.createEl("label", { text: "Current password" });
          const pw = makePasswordField(curField, "Current password\u2026", "current-password");
          curInput = pw.input;
          curInput.addEventListener("input", () => {
            this.current = curInput.value;
          });
        }
        const newField = fields.createDiv({ cls: "vault-cipher-field" });
        newField.createEl("label", { text: "New password" });
        const { input: newInput } = makePasswordField(newField, "New password\u2026", "new-password");
        const strength = makeStrengthMeter(newField);
        newInput.addEventListener("input", () => {
          this.newPass = newInput.value;
          strength.update(this.newPass);
        });
        const cfField = fields.createDiv({ cls: "vault-cipher-field" });
        cfField.createEl("label", { text: "Confirm new password" });
        const { input: cfInput } = makePasswordField(cfField, "Repeat new password\u2026", "new-password");
        const cfHint = cfField.createDiv({ cls: "vault-cipher-hint" });
        cfInput.addEventListener("input", () => {
          this.confirm = cfInput.value;
          if (!this.confirm) {
            cfHint.textContent = "";
            cfHint.className = "vault-cipher-hint";
          } else if (this.confirm === this.newPass) {
            cfHint.textContent = "\u2713 Passwords match";
            cfHint.className = "vault-cipher-hint is-ok";
          } else {
            cfHint.textContent = "Passwords don't match";
            cfHint.className = "vault-cipher-hint is-error";
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
          new import_obsidian.Notice("New password must be at least 8 characters.");
          newInput.focus();
          return;
        }
        if (this.newPass !== this.confirm) {
          new import_obsidian.Notice("Passwords don't match.");
          cfInput.focus();
          return;
        }
        btn.disabled = true;
        btn.textContent = "Changing\u2026";
        try {
          const ok = await this.plugin.changePassword(this.current || null, this.newPass);
          if (ok) {
            new import_obsidian.Notice("\u2705 Password changed.");
            this.close();
          } else {
            new import_obsidian.Notice("\u274C Failed \u2014 current password may be incorrect.");
            btn.disabled = false;
            btn.textContent = "Change password";
          }
        } catch (e) {
          console.error("Change password error:", e);
          new import_obsidian.Notice("\u274C Error: " + e.message);
          btn.disabled = false;
          btn.textContent = "Change password";
        }
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    ImportKeyModal = class extends import_obsidian.Modal {
      constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.text = "";
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("vault-cipher-modal");
        const header = contentEl.createDiv({ cls: "vault-cipher-header" });
        header.createSpan({ text: "\u{1F4E5}", cls: "vault-cipher-icon" });
        header.createEl("h2", { text: "Import .vault-key" });
        contentEl.createEl("p", {
          text: "Paste the contents of a .vault-key JSON file. This will overwrite the current key blob.",
          cls: "vault-cipher-subtitle"
        });
        const ta = contentEl.createEl("textarea", { cls: "vault-cipher-large-textarea" });
        ta.placeholder = '{"v":1,"salt":"\u2026","encryptedKey":"\u2026"}';
        ta.addEventListener("input", () => {
          this.text = ta.value.trim();
        });
        contentEl.createEl("hr", { cls: "vault-cipher-divider" });
        const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
        const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
        cancelBtn.addEventListener("click", () => this.close());
        const importBtn = buttonRow.createEl("button", { text: "Import", cls: "btn-primary mod-warning" });
        importBtn.addEventListener("click", async () => {
          if (!this.text) {
            new import_obsidian.Notice("Paste the .vault-key JSON first.");
            return;
          }
          try {
            JSON.parse(this.text);
          } catch (e) {
            new import_obsidian.Notice("Invalid JSON.");
            return;
          }
          this.close();
          new ConfirmModal(this.app, {
            title: "Overwrite .vault-key?",
            message: "This will replace the current vault key. Make sure you have a backup first.",
            confirmText: "Yes, overwrite",
            onConfirm: async () => {
              try {
                await this.plugin.writeKeyBlob(this.text);
                new import_obsidian.Notice("\u2705 .vault-key imported.");
              } catch (e) {
                new import_obsidian.Notice("\u274C Import failed: " + e.message);
              }
            }
          }).open();
        });
      }
      onClose() {
        this.contentEl.empty();
      }
    };
    ConfirmModal = class extends import_obsidian.Modal {
      constructor(app, { title, message, confirmText, onConfirm }) {
        super(app);
        this.title = title;
        this.message = message;
        this.confirmText = confirmText || "Confirm";
        this.onConfirm = onConfirm;
      }
      onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("vault-cipher-modal");
        const header = contentEl.createDiv({ cls: "vault-cipher-header" });
        header.createSpan({ text: "\u26A0\uFE0F", cls: "vault-cipher-icon" });
        header.createEl("h2", { text: this.title });
        contentEl.createEl("p", { text: this.message, cls: "vault-cipher-subtitle" });
        contentEl.createEl("hr", { cls: "vault-cipher-divider" });
        const buttonRow = contentEl.createDiv({ cls: "vault-cipher-button-row" });
        const cancelBtn = buttonRow.createEl("button", { text: "Cancel", cls: "btn-cancel" });
        cancelBtn.addEventListener("click", () => this.close());
        const confirmBtn = buttonRow.createEl("button", {
          text: this.confirmText,
          cls: "btn-primary mod-warning"
        });
        confirmBtn.addEventListener("click", () => {
          this.close();
          this.onConfirm();
        });
      }
      onClose() {
        this.contentEl.empty();
      }
    };
  }
});

// src/main.js
var main_exports = {};
__export(main_exports, {
  default: () => VaultCipherPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// node_modules/@noble/hashes/esm/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n, le = false) {
  if (le)
    return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
  return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
}
var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
var rotr32H = (_h, l) => l;
var rotr32L = (h, _l) => h;
function add(Ah, Al, Bh, Bl) {
  const l = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;

// node_modules/@noble/hashes/esm/crypto.js
var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/@noble/hashes/esm/utils.js
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function anumber(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("positive integer expected, got " + n);
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u8(arr) {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function byteSwap(word) {
  return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
}
var swap8IfBE = isLE ? (n) => n : (n) => byteSwap(n);
function byteSwap32(arr) {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = byteSwap(arr[i]);
  }
  return arr;
}
var swap32IfBE = isLE ? (u) => u : byteSwap32;
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
function kdfInputToBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
var Hash = class {
};
function createOptHasher(hashCons) {
  const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
  const tmp = hashCons({});
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  return hashC;
}
function randomBytes(bytesLength = 32) {
  if (crypto && typeof crypto.getRandomValues === "function") {
    return crypto.getRandomValues(new Uint8Array(bytesLength));
  }
  if (crypto && typeof crypto.randomBytes === "function") {
    return Uint8Array.from(crypto.randomBytes(bytesLength));
  }
  throw new Error("crypto.getRandomValues must be defined");
}

// node_modules/@noble/hashes/esm/_blake.js
var BSIGMA = /* @__PURE__ */ Uint8Array.from([
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9,
  12,
  5,
  1,
  15,
  14,
  13,
  4,
  10,
  0,
  7,
  6,
  3,
  9,
  2,
  8,
  11,
  13,
  11,
  7,
  14,
  12,
  1,
  3,
  9,
  5,
  0,
  15,
  4,
  8,
  6,
  2,
  10,
  6,
  15,
  14,
  9,
  11,
  3,
  0,
  8,
  12,
  2,
  13,
  7,
  1,
  4,
  10,
  5,
  10,
  2,
  8,
  4,
  7,
  6,
  1,
  5,
  15,
  11,
  9,
  14,
  3,
  12,
  13,
  0,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  14,
  10,
  4,
  8,
  9,
  15,
  13,
  6,
  1,
  12,
  0,
  2,
  11,
  7,
  5,
  3,
  // Blake1, unused in others
  11,
  8,
  12,
  0,
  5,
  2,
  15,
  13,
  10,
  14,
  3,
  6,
  7,
  1,
  9,
  4,
  7,
  9,
  3,
  1,
  13,
  12,
  11,
  14,
  2,
  6,
  5,
  10,
  4,
  0,
  15,
  8,
  9,
  0,
  5,
  7,
  2,
  4,
  10,
  15,
  14,
  1,
  11,
  12,
  6,
  8,
  3,
  13,
  2,
  12,
  6,
  10,
  0,
  11,
  8,
  3,
  4,
  13,
  7,
  5,
  15,
  14,
  1,
  9
]);

// node_modules/@noble/hashes/esm/blake2.js
var B2B_IV = /* @__PURE__ */ Uint32Array.from([
  4089235720,
  1779033703,
  2227873595,
  3144134277,
  4271175723,
  1013904242,
  1595750129,
  2773480762,
  2917565137,
  1359893119,
  725511199,
  2600822924,
  4215389547,
  528734635,
  327033209,
  1541459225
]);
var BBUF = /* @__PURE__ */ new Uint32Array(32);
function G1b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function G2b(a, b, c, d, msg, x) {
  const Xl = msg[x], Xh = msg[x + 1];
  let Al = BBUF[2 * a], Ah = BBUF[2 * a + 1];
  let Bl = BBUF[2 * b], Bh = BBUF[2 * b + 1];
  let Cl = BBUF[2 * c], Ch = BBUF[2 * c + 1];
  let Dl = BBUF[2 * d], Dh = BBUF[2 * d + 1];
  let ll = add3L(Al, Bl, Xl);
  Ah = add3H(ll, Ah, Bh, Xh);
  Al = ll | 0;
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = add(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  BBUF[2 * a] = Al, BBUF[2 * a + 1] = Ah;
  BBUF[2 * b] = Bl, BBUF[2 * b + 1] = Bh;
  BBUF[2 * c] = Cl, BBUF[2 * c + 1] = Ch;
  BBUF[2 * d] = Dl, BBUF[2 * d + 1] = Dh;
}
function checkBlake2Opts(outputLen, opts = {}, keyLen, saltLen, persLen) {
  anumber(keyLen);
  if (outputLen < 0 || outputLen > keyLen)
    throw new Error("outputLen bigger than keyLen");
  const { key, salt, personalization } = opts;
  if (key !== void 0 && (key.length < 1 || key.length > keyLen))
    throw new Error("key length must be undefined or 1.." + keyLen);
  if (salt !== void 0 && salt.length !== saltLen)
    throw new Error("salt must be undefined or " + saltLen);
  if (personalization !== void 0 && personalization.length !== persLen)
    throw new Error("personalization must be undefined or " + persLen);
}
var BLAKE2 = class extends Hash {
  constructor(blockLen, outputLen) {
    super();
    this.finished = false;
    this.destroyed = false;
    this.length = 0;
    this.pos = 0;
    anumber(blockLen);
    anumber(outputLen);
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.buffer = new Uint8Array(blockLen);
    this.buffer32 = u32(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { blockLen, buffer, buffer32 } = this;
    const len = data.length;
    const offset = data.byteOffset;
    const buf = data.buffer;
    for (let pos = 0; pos < len; ) {
      if (this.pos === blockLen) {
        swap32IfBE(buffer32);
        this.compress(buffer32, 0, false);
        swap32IfBE(buffer32);
        this.pos = 0;
      }
      const take = Math.min(blockLen - this.pos, len - pos);
      const dataOffset = offset + pos;
      if (take === blockLen && !(dataOffset % 4) && pos + take < len) {
        const data32 = new Uint32Array(buf, dataOffset, Math.floor((len - pos) / 4));
        swap32IfBE(data32);
        for (let pos32 = 0; pos + blockLen < len; pos32 += buffer32.length, pos += blockLen) {
          this.length += blockLen;
          this.compress(data32, pos32, false);
        }
        swap32IfBE(data32);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      this.length += take;
      pos += take;
    }
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    const { pos, buffer32 } = this;
    this.finished = true;
    clean(this.buffer.subarray(pos));
    swap32IfBE(buffer32);
    this.compress(buffer32, 0, true);
    swap32IfBE(buffer32);
    const out32 = u32(out);
    this.get().forEach((v, i) => out32[i] = swap8IfBE(v));
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    const { buffer, length, finished, destroyed, outputLen, pos } = this;
    to || (to = new this.constructor({ dkLen: outputLen }));
    to.set(...this.get());
    to.buffer.set(buffer);
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    to.outputLen = outputLen;
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var BLAKE2b = class extends BLAKE2 {
  constructor(opts = {}) {
    const olen = opts.dkLen === void 0 ? 64 : opts.dkLen;
    super(128, olen);
    this.v0l = B2B_IV[0] | 0;
    this.v0h = B2B_IV[1] | 0;
    this.v1l = B2B_IV[2] | 0;
    this.v1h = B2B_IV[3] | 0;
    this.v2l = B2B_IV[4] | 0;
    this.v2h = B2B_IV[5] | 0;
    this.v3l = B2B_IV[6] | 0;
    this.v3h = B2B_IV[7] | 0;
    this.v4l = B2B_IV[8] | 0;
    this.v4h = B2B_IV[9] | 0;
    this.v5l = B2B_IV[10] | 0;
    this.v5h = B2B_IV[11] | 0;
    this.v6l = B2B_IV[12] | 0;
    this.v6h = B2B_IV[13] | 0;
    this.v7l = B2B_IV[14] | 0;
    this.v7h = B2B_IV[15] | 0;
    checkBlake2Opts(olen, opts, 64, 16, 16);
    let { key, personalization, salt } = opts;
    let keyLength = 0;
    if (key !== void 0) {
      key = toBytes(key);
      keyLength = key.length;
    }
    this.v0l ^= this.outputLen | keyLength << 8 | 1 << 16 | 1 << 24;
    if (salt !== void 0) {
      salt = toBytes(salt);
      const slt = u32(salt);
      this.v4l ^= swap8IfBE(slt[0]);
      this.v4h ^= swap8IfBE(slt[1]);
      this.v5l ^= swap8IfBE(slt[2]);
      this.v5h ^= swap8IfBE(slt[3]);
    }
    if (personalization !== void 0) {
      personalization = toBytes(personalization);
      const pers = u32(personalization);
      this.v6l ^= swap8IfBE(pers[0]);
      this.v6h ^= swap8IfBE(pers[1]);
      this.v7l ^= swap8IfBE(pers[2]);
      this.v7h ^= swap8IfBE(pers[3]);
    }
    if (key !== void 0) {
      const tmp = new Uint8Array(this.blockLen);
      tmp.set(key);
      this.update(tmp);
    }
  }
  // prettier-ignore
  get() {
    let { v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h } = this;
    return [v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h];
  }
  // prettier-ignore
  set(v0l, v0h, v1l, v1h, v2l, v2h, v3l, v3h, v4l, v4h, v5l, v5h, v6l, v6h, v7l, v7h) {
    this.v0l = v0l | 0;
    this.v0h = v0h | 0;
    this.v1l = v1l | 0;
    this.v1h = v1h | 0;
    this.v2l = v2l | 0;
    this.v2h = v2h | 0;
    this.v3l = v3l | 0;
    this.v3h = v3h | 0;
    this.v4l = v4l | 0;
    this.v4h = v4h | 0;
    this.v5l = v5l | 0;
    this.v5h = v5h | 0;
    this.v6l = v6l | 0;
    this.v6h = v6h | 0;
    this.v7l = v7l | 0;
    this.v7h = v7h | 0;
  }
  compress(msg, offset, isLast) {
    this.get().forEach((v, i) => BBUF[i] = v);
    BBUF.set(B2B_IV, 16);
    let { h, l } = fromBig(BigInt(this.length));
    BBUF[24] = B2B_IV[8] ^ l;
    BBUF[25] = B2B_IV[9] ^ h;
    if (isLast) {
      BBUF[28] = ~BBUF[28];
      BBUF[29] = ~BBUF[29];
    }
    let j = 0;
    const s = BSIGMA;
    for (let i = 0; i < 12; i++) {
      G1b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G2b(0, 4, 8, 12, msg, offset + 2 * s[j++]);
      G1b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G2b(1, 5, 9, 13, msg, offset + 2 * s[j++]);
      G1b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G2b(2, 6, 10, 14, msg, offset + 2 * s[j++]);
      G1b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G2b(3, 7, 11, 15, msg, offset + 2 * s[j++]);
      G1b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G2b(0, 5, 10, 15, msg, offset + 2 * s[j++]);
      G1b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G2b(1, 6, 11, 12, msg, offset + 2 * s[j++]);
      G1b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G2b(2, 7, 8, 13, msg, offset + 2 * s[j++]);
      G1b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
      G2b(3, 4, 9, 14, msg, offset + 2 * s[j++]);
    }
    this.v0l ^= BBUF[0] ^ BBUF[16];
    this.v0h ^= BBUF[1] ^ BBUF[17];
    this.v1l ^= BBUF[2] ^ BBUF[18];
    this.v1h ^= BBUF[3] ^ BBUF[19];
    this.v2l ^= BBUF[4] ^ BBUF[20];
    this.v2h ^= BBUF[5] ^ BBUF[21];
    this.v3l ^= BBUF[6] ^ BBUF[22];
    this.v3h ^= BBUF[7] ^ BBUF[23];
    this.v4l ^= BBUF[8] ^ BBUF[24];
    this.v4h ^= BBUF[9] ^ BBUF[25];
    this.v5l ^= BBUF[10] ^ BBUF[26];
    this.v5h ^= BBUF[11] ^ BBUF[27];
    this.v6l ^= BBUF[12] ^ BBUF[28];
    this.v6h ^= BBUF[13] ^ BBUF[29];
    this.v7l ^= BBUF[14] ^ BBUF[30];
    this.v7h ^= BBUF[15] ^ BBUF[31];
    clean(BBUF);
  }
  destroy() {
    this.destroyed = true;
    clean(this.buffer32);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var blake2b = /* @__PURE__ */ createOptHasher((opts) => new BLAKE2b(opts));

// node_modules/@noble/hashes/esm/argon2.js
var AT = { Argond2d: 0, Argon2i: 1, Argon2id: 2 };
var ARGON2_SYNC_POINTS = 4;
var abytesOrZero = (buf) => {
  if (buf === void 0)
    return Uint8Array.of();
  return kdfInputToBytes(buf);
};
function mul(a, b) {
  const aL = a & 65535;
  const aH = a >>> 16;
  const bL = b & 65535;
  const bH = b >>> 16;
  const ll = Math.imul(aL, bL);
  const hl = Math.imul(aH, bL);
  const lh = Math.imul(aL, bH);
  const hh = Math.imul(aH, bH);
  const carry = (ll >>> 16) + (hl & 65535) + lh;
  const high = hh + (hl >>> 16) + (carry >>> 16) | 0;
  const low = carry << 16 | ll & 65535;
  return { h: high, l: low };
}
function mul2(a, b) {
  const { h, l } = mul(a, b);
  return { h: (h << 1 | l >>> 31) & 4294967295, l: l << 1 & 4294967295 };
}
function blamka(Ah, Al, Bh, Bl) {
  const { h: Ch, l: Cl } = mul2(Al, Bl);
  const Rll = add3L(Al, Bl, Cl);
  return { h: add3H(Rll, Ah, Bh, Ch), l: Rll | 0 };
}
var A2_BUF = new Uint32Array(256);
function G(a, b, c, d) {
  let Al = A2_BUF[2 * a], Ah = A2_BUF[2 * a + 1];
  let Bl = A2_BUF[2 * b], Bh = A2_BUF[2 * b + 1];
  let Cl = A2_BUF[2 * c], Ch = A2_BUF[2 * c + 1];
  let Dl = A2_BUF[2 * d], Dh = A2_BUF[2 * d + 1];
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotr32H(Dh, Dl), Dl: rotr32L(Dh, Dl) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrSH(Bh, Bl, 24), Bl: rotrSL(Bh, Bl, 24) });
  ({ h: Ah, l: Al } = blamka(Ah, Al, Bh, Bl));
  ({ Dh, Dl } = { Dh: Dh ^ Ah, Dl: Dl ^ Al });
  ({ Dh, Dl } = { Dh: rotrSH(Dh, Dl, 16), Dl: rotrSL(Dh, Dl, 16) });
  ({ h: Ch, l: Cl } = blamka(Ch, Cl, Dh, Dl));
  ({ Bh, Bl } = { Bh: Bh ^ Ch, Bl: Bl ^ Cl });
  ({ Bh, Bl } = { Bh: rotrBH(Bh, Bl, 63), Bl: rotrBL(Bh, Bl, 63) });
  A2_BUF[2 * a] = Al, A2_BUF[2 * a + 1] = Ah;
  A2_BUF[2 * b] = Bl, A2_BUF[2 * b + 1] = Bh;
  A2_BUF[2 * c] = Cl, A2_BUF[2 * c + 1] = Ch;
  A2_BUF[2 * d] = Dl, A2_BUF[2 * d + 1] = Dh;
}
function P(v00, v01, v02, v03, v04, v05, v06, v07, v08, v09, v10, v11, v12, v13, v14, v15) {
  G(v00, v04, v08, v12);
  G(v01, v05, v09, v13);
  G(v02, v06, v10, v14);
  G(v03, v07, v11, v15);
  G(v00, v05, v10, v15);
  G(v01, v06, v11, v12);
  G(v02, v07, v08, v13);
  G(v03, v04, v09, v14);
}
function block(x, xPos, yPos, outPos, needXor) {
  for (let i = 0; i < 256; i++)
    A2_BUF[i] = x[xPos + i] ^ x[yPos + i];
  for (let i = 0; i < 128; i += 16) {
    P(i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9, i + 10, i + 11, i + 12, i + 13, i + 14, i + 15);
  }
  for (let i = 0; i < 16; i += 2) {
    P(i, i + 1, i + 16, i + 17, i + 32, i + 33, i + 48, i + 49, i + 64, i + 65, i + 80, i + 81, i + 96, i + 97, i + 112, i + 113);
  }
  if (needXor)
    for (let i = 0; i < 256; i++)
      x[outPos + i] ^= A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  else
    for (let i = 0; i < 256; i++)
      x[outPos + i] = A2_BUF[i] ^ x[xPos + i] ^ x[yPos + i];
  clean(A2_BUF);
}
function Hp(A, dkLen) {
  const A8 = u8(A);
  const T = new Uint32Array(1);
  const T8 = u8(T);
  T[0] = dkLen;
  if (dkLen <= 64)
    return blake2b.create({ dkLen }).update(T8).update(A8).digest();
  const out = new Uint8Array(dkLen);
  let V = blake2b.create({}).update(T8).update(A8).digest();
  let pos = 0;
  out.set(V.subarray(0, 32));
  pos += 32;
  for (; dkLen - pos > 64; pos += 32) {
    const Vh = blake2b.create({}).update(V);
    Vh.digestInto(V);
    Vh.destroy();
    out.set(V.subarray(0, 32), pos);
  }
  out.set(blake2b(V, { dkLen: dkLen - pos }), pos);
  clean(V, T);
  return u32(out);
}
function indexAlpha(r, s, laneLen, segmentLen, index, randL, sameLane = false) {
  let area;
  if (r === 0) {
    if (s === 0)
      area = index - 1;
    else if (sameLane)
      area = s * segmentLen + index - 1;
    else
      area = s * segmentLen + (index == 0 ? -1 : 0);
  } else if (sameLane)
    area = laneLen - segmentLen + index - 1;
  else
    area = laneLen - segmentLen + (index == 0 ? -1 : 0);
  const startPos = r !== 0 && s !== ARGON2_SYNC_POINTS - 1 ? (s + 1) * segmentLen : 0;
  const rel = area - 1 - mul(area, mul(randL, randL).h).h;
  return (startPos + rel) % laneLen;
}
var maxUint32 = Math.pow(2, 32);
function isU32(num) {
  return Number.isSafeInteger(num) && num >= 0 && num < maxUint32;
}
function argon2Opts(opts) {
  const merged = {
    version: 19,
    dkLen: 32,
    maxmem: maxUint32 - 1,
    asyncTick: 10
  };
  for (let [k, v] of Object.entries(opts))
    if (v != null)
      merged[k] = v;
  const { dkLen, p, m, t, version, onProgress } = merged;
  if (!isU32(dkLen) || dkLen < 4)
    throw new Error("dkLen should be at least 4 bytes");
  if (!isU32(p) || p < 1 || p >= Math.pow(2, 24))
    throw new Error("p should be 1 <= p < 2^24");
  if (!isU32(m))
    throw new Error("m should be 0 <= m < 2^32");
  if (!isU32(t) || t < 1)
    throw new Error("t (iterations) should be 1 <= t < 2^32");
  if (onProgress !== void 0 && typeof onProgress !== "function")
    throw new Error("progressCb should be function");
  if (!isU32(m) || m < 8 * p)
    throw new Error("memory should be at least 8*p bytes");
  if (version !== 16 && version !== 19)
    throw new Error("unknown version=" + version);
  return merged;
}
function argon2Init(password, salt, type, opts) {
  password = kdfInputToBytes(password);
  salt = kdfInputToBytes(salt);
  abytes(password);
  abytes(salt);
  if (!isU32(password.length))
    throw new Error("password should be less than 4 GB");
  if (!isU32(salt.length) || salt.length < 8)
    throw new Error("salt should be at least 8 bytes and less than 4 GB");
  if (!Object.values(AT).includes(type))
    throw new Error("invalid type");
  let { p, dkLen, m, t, version, key, personalization, maxmem, onProgress, asyncTick } = argon2Opts(opts);
  key = abytesOrZero(key);
  personalization = abytesOrZero(personalization);
  const h = blake2b.create({});
  const BUF = new Uint32Array(1);
  const BUF8 = u8(BUF);
  for (let item of [p, dkLen, m, t, version, type]) {
    BUF[0] = item;
    h.update(BUF8);
  }
  for (let i of [password, salt, key, personalization]) {
    BUF[0] = i.length;
    h.update(BUF8).update(i);
  }
  const H0 = new Uint32Array(18);
  const H0_8 = u8(H0);
  h.digestInto(H0_8);
  const lanes = p;
  const mP = 4 * p * Math.floor(m / (ARGON2_SYNC_POINTS * p));
  const laneLen = Math.floor(mP / p);
  const segmentLen = Math.floor(laneLen / ARGON2_SYNC_POINTS);
  const memUsed = mP * 256;
  if (!isU32(maxmem) || memUsed > maxmem)
    throw new Error("mem should be less than 2**32, got: maxmem=" + maxmem + ", memused=" + memUsed);
  const B = new Uint32Array(memUsed);
  for (let l = 0; l < p; l++) {
    const i = 256 * laneLen * l;
    H0[17] = l;
    H0[16] = 0;
    B.set(Hp(H0, 1024), i);
    H0[16] = 1;
    B.set(Hp(H0, 1024), i + 256);
  }
  let perBlock = () => {
  };
  if (onProgress) {
    const totalBlock = t * ARGON2_SYNC_POINTS * p * segmentLen;
    const callbackPer = Math.max(Math.floor(totalBlock / 1e4), 1);
    let blockCnt = 0;
    perBlock = () => {
      blockCnt++;
      if (onProgress && (!(blockCnt % callbackPer) || blockCnt === totalBlock))
        onProgress(blockCnt / totalBlock);
    };
  }
  clean(BUF, H0);
  return { type, mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock, asyncTick };
}
function argon2Output(B, p, laneLen, dkLen) {
  const B_final = new Uint32Array(256);
  for (let l = 0; l < p; l++)
    for (let j = 0; j < 256; j++)
      B_final[j] ^= B[256 * (laneLen * l + laneLen - 1) + j];
  const res = u8(Hp(B_final, dkLen));
  clean(B_final);
  return res;
}
function processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor) {
  if (offset % laneLen)
    prev = offset - 1;
  let randL, randH;
  if (dataIndependent) {
    let i128 = index % 128;
    if (i128 === 0) {
      address[256 + 12]++;
      block(address, 256, 2 * 256, 0, false);
      block(address, 0, 2 * 256, 0, false);
    }
    randL = address[2 * i128];
    randH = address[2 * i128 + 1];
  } else {
    const T = 256 * prev;
    randL = B[T];
    randH = B[T + 1];
  }
  const refLane = r === 0 && s === 0 ? l : randH % lanes;
  const refPos = indexAlpha(r, s, laneLen, segmentLen, index, randL, refLane == l);
  const refBlock = laneLen * refLane + refPos;
  block(B, 256 * prev, 256 * refBlock, offset * 256, needXor);
}
function argon2(type, password, salt, opts) {
  const { mP, p, t, version, B, laneLen, lanes, segmentLen, dkLen, perBlock } = argon2Init(password, salt, type, opts);
  const address = new Uint32Array(3 * 256);
  address[256 + 6] = mP;
  address[256 + 8] = t;
  address[256 + 10] = type;
  for (let r = 0; r < t; r++) {
    const needXor = r !== 0 && version === 19;
    address[256 + 0] = r;
    for (let s = 0; s < ARGON2_SYNC_POINTS; s++) {
      address[256 + 4] = s;
      const dataIndependent = type == AT.Argon2i || type == AT.Argon2id && r === 0 && s < 2;
      for (let l = 0; l < p; l++) {
        address[256 + 2] = l;
        address[256 + 12] = 0;
        let startPos = 0;
        if (r === 0 && s === 0) {
          startPos = 2;
          if (dataIndependent) {
            address[256 + 12]++;
            block(address, 256, 2 * 256, 0, false);
            block(address, 0, 2 * 256, 0, false);
          }
        }
        let offset = l * laneLen + s * segmentLen + startPos;
        let prev = offset % laneLen ? offset - 1 : offset + laneLen - 1;
        for (let index = startPos; index < segmentLen; index++, offset++, prev++) {
          perBlock();
          processBlock(B, address, l, r, s, index, laneLen, segmentLen, lanes, offset, prev, dataIndependent, needXor);
        }
      }
    }
  }
  clean(address);
  return argon2Output(B, p, laneLen, dkLen);
}
var argon2id = (password, salt, opts) => argon2(AT.Argon2id, password, salt, opts);

// node_modules/@noble/ciphers/esm/_assert.js
function number(n) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error(`positive integer expected, not ${n}`);
}
function bool(b) {
  if (typeof b !== "boolean")
    throw new Error(`boolean expected, not ${b}`);
}
function isBytes2(a) {
  return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
}
function bytes(b, ...lengths) {
  if (!isBytes2(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error(`Uint8Array expected of length ${lengths}, not of length=${b.length}`);
}
function exists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function output(out, instance) {
  bytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error(`digestInto() expects output buffer of length at least ${min}`);
  }
}

// node_modules/@noble/ciphers/esm/utils.js
var u322 = (arr) => new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
var isLE2 = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
if (!isLE2)
  throw new Error("Non little-endian hardware is not supported");
function utf8ToBytes2(str) {
  if (typeof str !== "string")
    throw new Error(`string expected, got ${typeof str}`);
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes2(data) {
  if (typeof data === "string")
    data = utf8ToBytes2(data);
  else if (isBytes2(data))
    data = copyBytes(data);
  else
    throw new Error(`Uint8Array expected, got ${typeof data}`);
  return data;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i = 0; i < arrays.length; i++) {
    const a = arrays[i];
    bytes(a);
    sum += a.length;
  }
  const res = new Uint8Array(sum);
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const a = arrays[i];
    res.set(a, pad);
    pad += a.length;
  }
  return res;
}
function checkOpts(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes(a, b) {
  if (a.length !== b.length)
    return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i];
  return diff === 0;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, c) => {
  Object.assign(c, params);
  return c;
};
function setBigUint64(view, byteOffset, value, isLE3) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE3);
  const _32n2 = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n2 & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE3 ? 4 : 0;
  const l = isLE3 ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE3);
  view.setUint32(byteOffset + l, wl, isLE3);
}
function copyBytes(bytes2) {
  return Uint8Array.from(bytes2);
}
function clean2(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}

// node_modules/@noble/ciphers/esm/_arx.js
var _utf8ToBytes = (str) => Uint8Array.from(str.split("").map((c) => c.charCodeAt(0)));
var sigma16 = _utf8ToBytes("expand 16-byte k");
var sigma32 = _utf8ToBytes("expand 32-byte k");
var sigma16_32 = u322(sigma16);
var sigma32_32 = u322(sigma32);
var sigma = sigma32_32.slice();
function rotl(a, b) {
  return a << b | a >>> 32 - b;
}
function isAligned32(b) {
  return b.byteOffset % 4 === 0;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = 2 ** 32 - 1;
var U32_EMPTY = new Uint32Array();
function runCipher(core, sigma2, key, nonce, data, output2, counter, rounds) {
  const len = data.length;
  const block2 = new Uint8Array(BLOCK_LEN);
  const b32 = u322(block2);
  const isAligned = isAligned32(data) && isAligned32(output2);
  const d32 = isAligned ? u322(data) : U32_EMPTY;
  const o32 = isAligned ? u322(output2) : U32_EMPTY;
  for (let pos = 0; pos < len; counter++) {
    core(sigma2, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output2[posj] = data[posj] ^ block2[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  number(counterLength);
  number(rounds);
  bool(counterRight);
  bool(allowShortKeys);
  return (key, nonce, data, output2, counter = 0) => {
    bytes(key);
    bytes(nonce);
    bytes(data);
    const len = data.length;
    if (output2 === void 0)
      output2 = new Uint8Array(len);
    bytes(output2);
    number(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    if (output2.length < len)
      throw new Error(`arx: output (${output2.length}) is shorter than data (${len})`);
    const toClean = [];
    let l = key.length, k, sigma2;
    if (l === 32) {
      toClean.push(k = copyBytes(key));
      sigma2 = sigma32_32;
    } else if (l === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma2 = sigma16_32;
      toClean.push(k);
    } else {
      throw new Error(`arx: invalid 32-byte key, got length=${l}`);
    }
    if (!isAligned32(nonce))
      toClean.push(nonce = copyBytes(nonce));
    const k32 = u322(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      extendNonceFn(sigma2, k32, u322(nonce.subarray(0, 16)), k32);
      nonce = nonce.subarray(16);
    }
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = u322(nonce);
    runCipher(core, sigma2, k32, n32, data, output2, counter, rounds);
    clean2(...toClean);
    return output2;
  };
}

// node_modules/@noble/ciphers/esm/_poly1305.js
var u8to16 = (a, i) => a[i++] & 255 | (a[i++] & 255) << 8;
var Poly1305 = class {
  constructor(key) {
    this.blockLen = 16;
    this.outputLen = 16;
    this.buffer = new Uint8Array(16);
    this.r = new Uint16Array(10);
    this.h = new Uint16Array(10);
    this.pad = new Uint16Array(8);
    this.pos = 0;
    this.finished = false;
    key = toBytes2(key);
    bytes(key, 32);
    const t0 = u8to16(key, 0);
    const t1 = u8to16(key, 2);
    const t2 = u8to16(key, 4);
    const t3 = u8to16(key, 6);
    const t4 = u8to16(key, 8);
    const t5 = u8to16(key, 10);
    const t6 = u8to16(key, 12);
    const t7 = u8to16(key, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i = 0; i < 8; i++)
      this.pad[i] = u8to16(key, 16 + 2 * i);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r } = this;
    const r0 = r[0];
    const r1 = r[1];
    const r2 = r[2];
    const r3 = r[3];
    const r4 = r[4];
    const r5 = r[5];
    const r6 = r[6];
    const r7 = r[7];
    const r8 = r[8];
    const r9 = r[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c = 0;
    let d0 = c + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r2) + h9 * (5 * r1);
    c += d0 >>> 13;
    d0 &= 8191;
    let d1 = c + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r2);
    c += d1 >>> 13;
    d1 &= 8191;
    let d2 = c + h0 * r2 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c += d2 >>> 13;
    d2 &= 8191;
    let d3 = c + h0 * r3 + h1 * r2 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c += d3 >>> 13;
    d3 &= 8191;
    let d4 = c + h0 * r4 + h1 * r3 + h2 * r2 + h3 * r1 + h4 * r0;
    c = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c += d4 >>> 13;
    d4 &= 8191;
    let d5 = c + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r2 + h4 * r1;
    c = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c += d5 >>> 13;
    d5 &= 8191;
    let d6 = c + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r2;
    c = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c += d6 >>> 13;
    d6 &= 8191;
    let d7 = c + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r2 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c += d7 >>> 13;
    d7 &= 8191;
    let d8 = c + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r2 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c += d8 >>> 13;
    d8 &= 8191;
    let d9 = c + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r2 + h8 * r1 + h9 * r0;
    c += d9 >>> 13;
    d9 &= 8191;
    c = (c << 2) + c | 0;
    c = c + d0 | 0;
    d0 = c & 8191;
    c = c >>> 13;
    d1 += c;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad } = this;
    const g = new Uint16Array(10);
    let c = h[1] >>> 13;
    h[1] &= 8191;
    for (let i = 2; i < 10; i++) {
      h[i] += c;
      c = h[i] >>> 13;
      h[i] &= 8191;
    }
    h[0] += c * 5;
    c = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c;
    c = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c;
    g[0] = h[0] + 5;
    c = g[0] >>> 13;
    g[0] &= 8191;
    for (let i = 1; i < 10; i++) {
      g[i] = h[i] + c;
      c = g[i] >>> 13;
      g[i] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask = (c ^ 1) - 1;
    for (let i = 0; i < 10; i++)
      g[i] &= mask;
    mask = ~mask;
    for (let i = 0; i < 10; i++)
      h[i] = h[i] & mask | g[i];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f = h[0] + pad[0];
    h[0] = f & 65535;
    for (let i = 1; i < 8; i++) {
      f = (h[i] + pad[i] | 0) + (f >>> 16) | 0;
      h[i] = f & 65535;
    }
    clean2(g);
  }
  update(data) {
    exists(this);
    const { buffer, blockLen } = this;
    data = toBytes2(data);
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    clean2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(out) {
    exists(this);
    output(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i = 0; i < 8; i++) {
      out[opos++] = h[i] >>> 0;
      out[opos++] = h[i] >>> 8;
    }
    return out;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
function wrapConstructorWithKey(hashCons) {
  const hashC = (msg, key) => hashCons(key).update(toBytes2(msg)).digest();
  const tmp = hashCons(new Uint8Array(32));
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (key) => hashCons(key);
  return hashC;
}
var poly1305 = wrapConstructorWithKey((key) => new Poly1305(key));

// node_modules/@noble/ciphers/esm/chacha.js
function chachaCore(s, k, n, out, cnt, rounds = 20) {
  let y00 = s[0], y01 = s[1], y02 = s[2], y03 = s[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n[0], y14 = n[1], y15 = n[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r = 0; r < rounds; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
function hchacha(s, k, i, o32) {
  let x00 = s[0], x01 = s[1], x02 = s[2], x03 = s[3], x04 = k[0], x05 = k[1], x06 = k[2], x07 = k[3], x08 = k[4], x09 = k[5], x10 = k[6], x11 = k[7], x12 = i[0], x13 = i[1], x14 = i[2], x15 = i[3];
  for (let r = 0; r < 20; r += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  o32[oi++] = x00;
  o32[oi++] = x01;
  o32[oi++] = x02;
  o32[oi++] = x03;
  o32[oi++] = x12;
  o32[oi++] = x13;
  o32[oi++] = x14;
  o32[oi++] = x15;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var xchacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 8,
  extendNonceFn: hchacha,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const left = msg.length % 16;
  if (left)
    h.update(ZEROS16.subarray(left));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, data, AAD) {
  const authKey = fn(key, nonce, ZEROS32);
  const h = poly1305.create(authKey);
  if (AAD)
    updatePadded(h, AAD);
  updatePadded(h, data);
  const num = new Uint8Array(16);
  const view = createView(num);
  setBigUint64(view, 0, BigInt(AAD ? AAD.length : 0), true);
  setBigUint64(view, 8, BigInt(data.length), true);
  h.update(num);
  const res = h.digest();
  clean2(authKey, num);
  return res;
}
var _poly1305_aead = (xorStream) => (key, nonce, AAD) => {
  const tagLength = 16;
  bytes(key, 32);
  bytes(nonce);
  return {
    encrypt(plaintext, output2) {
      const plength = plaintext.length;
      const clength = plength + tagLength;
      if (output2) {
        bytes(output2, clength);
      } else {
        output2 = new Uint8Array(clength);
      }
      xorStream(key, nonce, plaintext, output2, 1);
      const tag = computeTag(xorStream, key, nonce, output2.subarray(0, -tagLength), AAD);
      output2.set(tag, plength);
      clean2(tag);
      return output2;
    },
    decrypt(ciphertext, output2) {
      const clength = ciphertext.length;
      const plength = clength - tagLength;
      if (clength < tagLength)
        throw new Error(`encrypted data must be at least ${tagLength} bytes`);
      if (output2) {
        bytes(output2, plength);
      } else {
        output2 = new Uint8Array(plength);
      }
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = computeTag(xorStream, key, nonce, data, AAD);
      if (!equalBytes(passedTag, tag))
        throw new Error("invalid tag");
      xorStream(key, nonce, data, output2, 1);
      clean2(tag);
      return output2;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 12, tagLength: 16 }, _poly1305_aead(chacha20));
var xchacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 24, tagLength: 16 }, _poly1305_aead(xchacha20));

// node_modules/@noble/ciphers/esm/crypto.js
var crypto2 = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;

// node_modules/@noble/ciphers/esm/webcrypto.js
function randomBytes2(bytesLength = 32) {
  if (crypto2 && typeof crypto2.getRandomValues === "function")
    return crypto2.getRandomValues(new Uint8Array(bytesLength));
  throw new Error("crypto.getRandomValues must be defined");
}
function getWebcryptoSubtle() {
  if (crypto2 && typeof crypto2.subtle === "object" && crypto2.subtle != null)
    return crypto2.subtle;
  throw new Error("crypto.subtle must be defined");
}
function managedNonce(fn) {
  number(fn.nonceLength);
  return (key, ...args) => ({
    encrypt(plaintext, ...argsEnc) {
      const { nonceLength } = fn;
      const nonce = randomBytes2(nonceLength);
      const ciphertext = fn(key, nonce, ...args).encrypt(plaintext, ...argsEnc);
      const out = concatBytes(nonce, ciphertext);
      ciphertext.fill(0);
      return out;
    },
    decrypt(ciphertext, ...argsDec) {
      const { nonceLength } = fn;
      const nonce = ciphertext.subarray(0, nonceLength);
      const data = ciphertext.subarray(nonceLength);
      return fn(key, nonce, ...args).decrypt(data, ...argsDec);
    }
  });
}
var utils = {
  async encrypt(key, keyParams, cryptParams, plaintext) {
    const cr = getWebcryptoSubtle();
    const iKey = await cr.importKey("raw", key, keyParams, true, ["encrypt"]);
    const ciphertext = await cr.encrypt(cryptParams, iKey, plaintext);
    return new Uint8Array(ciphertext);
  },
  async decrypt(key, keyParams, cryptParams, ciphertext) {
    const cr = getWebcryptoSubtle();
    const iKey = await cr.importKey("raw", key, keyParams, true, ["decrypt"]);
    const plaintext = await cr.decrypt(cryptParams, iKey, ciphertext);
    return new Uint8Array(plaintext);
  }
};
var mode = {
  CBC: "AES-CBC",
  CTR: "AES-CTR",
  GCM: "AES-GCM"
};
function getCryptParams(algo, nonce, AAD) {
  if (algo === mode.CBC)
    return { name: mode.CBC, iv: nonce };
  if (algo === mode.CTR)
    return { name: mode.CTR, counter: nonce, length: 64 };
  if (algo === mode.GCM) {
    if (AAD)
      return { name: mode.GCM, iv: nonce, additionalData: AAD };
    else
      return { name: mode.GCM, iv: nonce };
  }
  throw new Error("unknown aes block mode");
}
function generate(algo) {
  return (key, nonce, AAD) => {
    bytes(key);
    bytes(nonce);
    const keyParams = { name: algo, length: key.length * 8 };
    const cryptParams = getCryptParams(algo, nonce, AAD);
    return {
      // keyLength,
      encrypt(plaintext) {
        bytes(plaintext);
        return utils.encrypt(key, keyParams, cryptParams, plaintext);
      },
      decrypt(ciphertext) {
        bytes(ciphertext);
        return utils.decrypt(key, keyParams, cryptParams, ciphertext);
      }
    };
  };
}
var cbc = generate(mode.CBC);
var ctr = generate(mode.CTR);
var gcm = generate(mode.GCM);

// src/crypto.js
var ARGON2_MEM = 64 * 1024;
var ARGON2_TIME = 3;
var ARGON2_PARALLELISM = 1;
var ARGON2_KEY_LEN = 32;
var SALT_LEN = 16;
var KEY_LEN = 32;
function makeCipher(key) {
  return managedNonce(xchacha20poly1305)(key);
}
function deriveKey(password, salt) {
  const pwBytes = new TextEncoder().encode(password);
  return argon2id(pwBytes, salt, {
    m: ARGON2_MEM,
    t: ARGON2_TIME,
    p: ARGON2_PARALLELISM,
    dkLen: ARGON2_KEY_LEN
  });
}
function generateVaultKey() {
  return randomBytes(KEY_LEN);
}
function createKeyBlob(password, vaultKey) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const salt = randomBytes(SALT_LEN);
        const derivedKey = deriveKey(password, salt);
        const encrypted = makeCipher(derivedKey).encrypt(vaultKey);
        resolve(JSON.stringify({ v: 2, salt: toHex(salt), encryptedKey: toHex(encrypted) }));
      } catch (e) {
        reject(e);
      }
    }, 20);
  });
}
function unlockKeyBlob(password, blobJson) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const blob = JSON.parse(blobJson);
        if (blob.v !== 2)
          throw new Error("Key blob created with old plugin version \u2014 please delete .vault-key and run setup again");
        if (typeof blob.salt !== "string" || blob.salt.length !== SALT_LEN * 2)
          throw new Error("Key blob: invalid salt");
        const derivedKey = deriveKey(password, fromHex(blob.salt));
        resolve(makeCipher(derivedKey).decrypt(fromHex(blob.encryptedKey)));
      } catch (e) {
        reject(e);
      }
    }, 20);
  });
}
function encryptNote(vaultKey, plaintext) {
  return toBase64(makeCipher(vaultKey).encrypt(new TextEncoder().encode(plaintext)));
}
function decryptNote(vaultKey, ciphertextB64) {
  return new TextDecoder().decode(makeCipher(vaultKey).decrypt(fromBase64(ciphertextB64)));
}
function toHex(bytes2) {
  return Array.from(bytes2).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++)
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return arr;
}
function toBase64(bytes2) {
  let binary = "";
  for (let i = 0; i < bytes2.length; i++)
    binary += String.fromCharCode(bytes2[i]);
  return btoa(binary);
}
function fromBase64(b64) {
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    arr[i] = binary.charCodeAt(i);
  return arr;
}

// src/main.js
init_modals();

// src/settings.js
var import_obsidian2 = require("obsidian");
init_modals();
var DEFAULT_SETTINGS = {
  enabled: false,
  keyBlobFile: ".vault-key",
  encryptedExtension: ".enc",
  excludedFolders: [],
  autoLockMinutes: 5
};
var VaultCipherSettingsTab = class extends import_obsidian2.PluginSettingTab {
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
      text: isEnabled ? isUnlocked ? "\u{1F513} Vault is unlocked for this session." : "\u{1F512} Vault is locked. Notes are encrypted." : "\u26A0\uFE0F Encryption is not enabled for this vault."
    });
    if (isEnabled && isUnlocked) {
      new import_obsidian2.Setting(containerEl).setName("Lock vault").setDesc("Clear the session key from memory.").addButton((btn) => {
        btn.setButtonText("Lock now").onClick(() => {
          this.plugin.lockVault();
          new import_obsidian2.Notice("Vault locked.");
          this.display();
        });
      });
    }
    new import_obsidian2.Setting(containerEl).setName("Auto-lock after inactivity").setDesc("Automatically lock the vault after N minutes (0 = disabled).").addText((text) => {
      var _a;
      text.setPlaceholder("0").setValue(String((_a = this.plugin.settings.autoLockMinutes) != null ? _a : 0)).onChange(async (val) => {
        const mins = parseInt(val, 10);
        this.plugin.settings.autoLockMinutes = isNaN(mins) || mins < 0 ? 0 : mins;
        await this.plugin.saveSettings();
        this.plugin.resetAutoLockTimer();
      });
      text.inputEl.type = "number";
      text.inputEl.min = "0";
    });
    new import_obsidian2.Setting(containerEl).setName("Excluded folders").setDesc("Comma-separated folder paths to exclude from encryption.").addText((text) => {
      text.setPlaceholder("Templates, Attachments").setValue(this.plugin.settings.excludedFolders.join(", ")).onChange(async (val) => {
        this.plugin.settings.excludedFolders = val.split(",").map((s) => s.trim()).filter(Boolean);
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("h3", { text: "Password & Key" });
    new import_obsidian2.Setting(containerEl).setName("Change vault password").setDesc("Re-wrap the vault key with a new password.").addButton((btn) => {
      btn.setButtonText("Change password").onClick(() => {
        new ChangePasswordModal(this.app, this.plugin).open();
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Export .vault-key").setDesc("Copy the .vault-key contents to clipboard for backup.").addButton((btn) => {
      btn.setButtonText("Copy key blob").onClick(async () => {
        try {
          const blob = await this.plugin.readKeyBlob();
          if ((navigator == null ? void 0 : navigator.clipboard) && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(blob);
            new import_obsidian2.Notice("\u2705 .vault-key copied to clipboard. Store it safely.");
          } else {
            window.prompt("Copy the .vault-key JSON (CTRL+C):", blob);
          }
        } catch (e) {
          new import_obsidian2.Notice("Failed to read .vault-key: " + e.message);
        }
      });
    });
    new import_obsidian2.Setting(containerEl).setName("Import .vault-key").setDesc("Paste a .vault-key JSON to overwrite current key (use with caution).").addButton((btn) => {
      btn.setButtonText("Import key").onClick(() => {
        new ImportKeyModal(this.app, this.plugin).open();
      });
    });
    containerEl.createEl("h3", { text: "Danger Zone" });
    if (isEnabled) {
      new import_obsidian2.Setting(containerEl).setName("Decrypt all notes and disable encryption").setDesc("Permanently decrypts all notes and removes the key blob.").addButton((btn) => {
        btn.setButtonText("Disable encryption").setClass("mod-warning").onClick(() => {
          if (!isUnlocked) {
            new import_obsidian2.Notice("Unlock the vault first.");
            return;
          }
          new ConfirmModal(this.app, {
            title: "Disable Vault Cipher?",
            message: "This will decrypt all your notes and delete the key blob. This cannot be undone.",
            confirmText: "Yes, decrypt everything",
            onConfirm: async () => {
              await this.plugin.disableEncryption();
              this.display();
            }
          }).open();
        });
      });
    }
    containerEl.createEl("h3", { text: "About" });
    containerEl.createEl("p", {
      text: "Vault Cipher encrypts your notes using Argon2id and ChaCha20-Poly1305. The vault key is stored in .vault-key at the vault root. Keep backups of that file.",
      cls: "vault-cipher-about"
    });
  }
};

// src/main.js
var KEY_BLOB_FILENAME = ".vault-key";
var CIPHER_MARKER = "vault-cipher:v1:";
var VaultCipherPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "sessionKey", null);
    __publicField(this, "_writingFiles", /* @__PURE__ */ new Set());
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new VaultCipherSettingsTab(this.app, this));
    this.registerEvent(this.app.vault.on("create", (file) => this.maybeHideFile(file)));
    this.app.workspace.onLayoutReady(async () => {
      this.hideKeyBlobFromExplorer();
      await this.promptUnlock();
    });
    this.registerEvent(this.app.workspace.on("file-open", async (file) => {
      if (!file || !this.settings.enabled)
        return;
      await this.decryptFileIntoEditor(file);
      this.resetAutoLockTimer();
    }));
    this.registerEvent(this.app.workspace.on("editor-change", () => {
      if (this.sessionKey)
        this.resetAutoLockTimer();
    }));
    this.patchVaultModify();
    this.addCommand({
      id: "lock-vault",
      name: "Lock vault",
      callback: () => {
        this.lockVault();
        new import_obsidian3.Notice("\u{1F512} Vault locked.");
      }
    });
    this.addCommand({
      id: "unlock-vault",
      name: "Unlock vault",
      callback: () => this.promptUnlock()
    });
    this.addCommand({
      id: "encrypt-all-notes",
      name: "Encrypt all existing notes",
      callback: () => this.encryptAllNotes()
    });
    this.addCommand({
      id: "decrypt-all-notes",
      name: "Decrypt all notes (keep encryption enabled)",
      callback: () => this.promptDecryptAll()
    });
    console.log("Vault Cipher loaded.");
  }
  onunload() {
    this.lockVault();
    this.clearAutoLockTimer();
    console.log("Vault Cipher unloaded \u2014 session key cleared.");
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  lockVault() {
    if (this.sessionKey)
      this.sessionKey.fill(0);
    this.sessionKey = null;
    this.clearAutoLockTimer();
  }
  resetAutoLockTimer() {
    if (!this.settings.autoLockMinutes || this.settings.autoLockMinutes <= 0)
      return;
    this.clearAutoLockTimer();
    this._autoLockTimer = setTimeout(() => {
      this.lockVault();
      new import_obsidian3.Notice("\u{1F512} Vault Cipher: auto-locked after inactivity.");
    }, this.settings.autoLockMinutes * 60 * 1e3);
  }
  clearAutoLockTimer() {
    if (this._autoLockTimer) {
      clearTimeout(this._autoLockTimer);
      this._autoLockTimer = null;
    }
  }
  async waitForRemoteKey(ms = 3e3, interval = 300) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      if (await this.keyBlobExists())
        return true;
      await new Promise((r) => setTimeout(r, interval));
    }
    return false;
  }
  async promptUnlock() {
    if (this.sessionKey)
      return;
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
    if (this.sessionKey) {
      const newBlob = await createKeyBlob(newPassword, this.sessionKey);
      await this.writeKeyBlob(newBlob);
      new import_obsidian3.Notice("\u2705 Password changed.");
      return true;
    }
    if (currentPasswordOrNull) {
      const ok = await this.unlockWithPassword(currentPasswordOrNull);
      if (!ok)
        return false;
      try {
        const newBlob = await createKeyBlob(newPassword, this.sessionKey);
        await this.writeKeyBlob(newBlob);
        new import_obsidian3.Notice("\u2705 Password changed.");
        return true;
      } finally {
      }
    }
    return false;
  }
  async keyBlobExists() {
    return this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME) instanceof import_obsidian3.TFile;
  }
  async readKeyBlob() {
    const file = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    if (!file)
      throw new Error("Key blob not found");
    return await this.app.vault.read(file);
  }
  async writeKeyBlob(content) {
    const existing = this.app.vault.getAbstractFileByPath(KEY_BLOB_FILENAME);
    try {
      if (existing instanceof import_obsidian3.TFile) {
        const writeFn = this._originalModify || this.app.vault.modify.bind(this.app.vault);
        await writeFn(existing, content);
      } else {
        await this.app.vault.create(KEY_BLOB_FILENAME, content);
      }
    } catch (e) {
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
    if (file.path === KEY_BLOB_FILENAME)
      this.hideKeyBlobFromExplorer();
  }
  isEncrypted(content) {
    return typeof content === "string" && content.startsWith(CIPHER_MARKER);
  }
  isExcluded(filePath) {
    if (filePath === KEY_BLOB_FILENAME)
      return true;
    return this.settings.excludedFolders.some(
      (folder) => filePath.startsWith(folder + "/") || filePath === folder
    );
  }
  async encrypt(plaintext) {
    if (!this.sessionKey)
      throw new Error("Vault is locked");
    const ciphertext = encryptNote(this.sessionKey, plaintext);
    return CIPHER_MARKER + ciphertext;
  }
  async decrypt(ciphertext) {
    if (!this.sessionKey)
      throw new Error("Vault is locked");
    const payload = ciphertext.slice(CIPHER_MARKER.length);
    return decryptNote(this.sessionKey, payload);
  }
  async decryptFileIntoEditor(file) {
    var _a;
    if (!(file instanceof import_obsidian3.TFile))
      return;
    if (file.extension !== "md")
      return;
    if (this.isExcluded(file.path))
      return;
    if (!this.sessionKey)
      return;
    const raw = await this.app.vault.read(file);
    if (!this.isEncrypted(raw)) {
      if (raw.trim().length > 0) {
        new import_obsidian3.Notice(
          `\u26A0\uFE0F Vault Cipher: "${file.name}" is not encrypted. Run "Encrypt all existing notes" to fix this.`,
          8e3
        );
      }
      return;
    }
    try {
      const plaintext = await this.decrypt(raw);
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile || activeFile.path !== file.path)
        return;
      const editor = (_a = this.app.workspace.activeEditor) == null ? void 0 : _a.editor;
      if (editor) {
        this._writingFiles.add(file.path);
        try {
          editor.setValue(plaintext);
        } finally {
          this._writingFiles.delete(file.path);
        }
      }
    } catch (e) {
      new import_obsidian3.Notice("Vault Cipher: failed to decrypt note \u2014 vault may be locked.");
      console.error("Vault Cipher decrypt error:", e);
    }
  }
  patchVaultModify() {
    const _originalModify = this.app.vault.modify.bind(this.app.vault);
    this._originalModify = _originalModify;
    this.app.vault.modify = async (file, data, options) => {
      if (this.settings.enabled && this.sessionKey && file instanceof import_obsidian3.TFile && file.extension === "md" && !this.isExcluded(file.path) && !this._writingFiles.has(file.path) && !this.isEncrypted(data)) {
        try {
          data = await this.encrypt(data);
        } catch (e) {
          console.error("Vault Cipher: failed to encrypt on save:", e);
          new import_obsidian3.Notice("\u26A0\uFE0F Vault Cipher: encryption failed \u2014 note NOT saved to prevent plaintext leak.");
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
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await this.app.vault.read(file);
      if (this.isEncrypted(content))
        continue;
      const encrypted = await this.encrypt(content);
      this._writingFiles.add(file.path);
      try {
        await this.app.vault.modify(file, encrypted);
      } finally {
        this._writingFiles.delete(file.path);
      }
      count++;
    }
    new import_obsidian3.Notice(`\u2705 Vault Cipher: encrypted ${count} notes.`);
  }
  async promptDecryptAll() {
    if (!this.sessionKey) {
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const { ConfirmModal: ConfirmModal2 } = await Promise.resolve().then(() => (init_modals(), modals_exports));
    new ConfirmModal2(this.app, {
      title: "Decrypt all notes?",
      message: "All encrypted notes will be written back to plaintext on disk. Encryption stays enabled \u2014 notes will re-encrypt on next save.",
      confirmText: "Decrypt all",
      onConfirm: () => this.decryptAllNotes()
    }).open();
  }
  async decryptAllNotes() {
    if (!this.sessionKey) {
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await this.app.vault.read(file);
      if (!this.isEncrypted(content))
        continue;
      try {
        const plaintext = await this.decrypt(content);
        this._writingFiles.add(file.path);
        try {
          await this.app.vault.modify(file, plaintext);
        } finally {
          this._writingFiles.delete(file.path);
        }
        count++;
      } catch (e) {
        console.error("Vault Cipher: failed to decrypt", file.path, e);
      }
    }
    new import_obsidian3.Notice(`\u2705 Decrypted ${count} note${count === 1 ? "" : "s"}. Notes will re-encrypt on next save.`);
  }
  async disableEncryption() {
    if (!this.sessionKey) {
      new import_obsidian3.Notice("Unlock the vault first.");
      return;
    }
    const files = this.app.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (this.isExcluded(file.path))
        continue;
      const content = await this.app.vault.read(file);
      if (!this.isEncrypted(content))
        continue;
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
    if (keyFile)
      await this.app.vault.delete(keyFile);
    this.lockVault();
    this.settings.enabled = false;
    await this.saveSettings();
    new import_obsidian3.Notice(`\u2705 Vault Cipher disabled. ${count} notes decrypted.`);
  }
};
/*! Bundled license information:

@noble/hashes/esm/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/esm/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/
