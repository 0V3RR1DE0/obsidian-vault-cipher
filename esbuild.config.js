const esbuild = require("esbuild");
const builtins = require("builtin-modules");

const prod = process.argv[2] === "production";

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
  outfile: "main.js",
};

if (prod) {
  esbuild.build(config).catch(() => process.exit(1));
} else {
  // watch mode uses context() in esbuild >= 0.17
  esbuild.context(config).then(ctx => {
    ctx.watch();
    console.log("Watching for changes...");
  }).catch(() => process.exit(1));
}