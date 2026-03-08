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
};

if (prod) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  esbuild.build(config).then(() => {
    console.log(`\n✅ Built to ${outDir}/`);
  }).catch(() => process.exit(1));
} else {
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log("Watching for changes… (output → main.js in root)");
  }).catch(() => process.exit(1));
}