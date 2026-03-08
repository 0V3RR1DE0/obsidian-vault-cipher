const esbuild = require("esbuild");
const builtins = require("builtin-modules");
const fs       = require("fs");
const path     = require("path");

const prod    = process.argv[2] === "production";
const outDir  = prod ? "dist" : ".";
const outFile = path.join(outDir, "main.js");

const config = {
  entryPoints: ["src/main.js"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: outFile,
  // argon2-browser ships a WASM binary — bundle it as a file asset.
  // assetNames keeps the filename predictable (argon2 looks for it by name).
  loader: { ".wasm": "file" },
  assetNames: "[name]",
  publicPath: "",
};

if (prod) {
  // Ensure dist/ exists
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  esbuild.build(config).then(() => {
    // Copy the other files Obsidian needs alongside main.js
    for (const file of ["manifest.json", "styles.css"]) {
      fs.copyFileSync(file, path.join(outDir, file));
    }
    console.log(`\n✅ Built to ${outDir}/`);
    console.log(`   Copy the contents of ${outDir}/ to .obsidian/plugins/vault-cipher/`);
  }).catch(() => process.exit(1));
} else {
  // Dev: output main.js to root (where Obsidian symlink expects it)
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log("Watching for changes… (output → main.js in root)");
  }).catch(() => process.exit(1));
}