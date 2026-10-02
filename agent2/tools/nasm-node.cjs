// Run the simulator's own Emscripten NASM build (repos/corewars8086_js/war/asm_js_main.js)
// directly in Node, avoiding the shared 127.0.0.1:8123 server and Playwright.
// Usage: node nasm-node.cjs <outdir> <file.asm> [...]
// Writes <outdir>/<stem> (binary), <stem>.lst and manifest.json (sizes + SHA-256).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const root = path.resolve(__dirname, "..", "..");
const jsPath = path.join(root, "repos", "corewars8086_js", "war", "asm_js_main.js");
let out = "";
globalThis.Module = {
  noInitialRun: true,
  print: (l) => { out += l + "\n"; },
  printErr: (l) => { out += l + "\n"; },
};
globalThis.require = require; globalThis.__dirname = path.dirname(jsPath); globalThis.__filename = jsPath;
require("vm").runInThisContext(fs.readFileSync(jsPath, "utf8"), { filename: jsPath });
const M = globalThis.Module;
function ready() {
  return new Promise((res) => {
    if (M.calledRun || M.asm && M.FS) return res();
    M.onRuntimeInitialized = res;
  });
}
(async () => {
  await ready();
  const FS = M.FS || globalThis.FS;
  const runNasm = M.cwrap("run_nasm", "number", ["string", "string"]);
  const [outDir, ...inputs] = process.argv.slice(2);
  if (!outDir || !inputs.length) throw new Error("usage: node nasm-node.cjs <outdir> <in.asm>...");
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = [];
  for (const input of inputs) {
    const src = fs.readFileSync(input, "utf8");
    for (const p of ["/a2-input.asm", "/a2-output.lst", "/a2-input"]) { try { FS.unlink(p); } catch {} }
    FS.writeFile("/a2-input.asm", src, { encoding: "utf8" });
    out = "";
    const code = runNasm("/a2-input.asm", "/a2-output.lst");
    let bin;
    try { bin = Buffer.from(FS.readFile("/a2-input", { encoding: "binary" })); } catch { bin = Buffer.alloc(0); }
    if (code !== 0 || bin.length === 0) { console.error(out); throw new Error(`assembly failed: ${input} (exit ${code})`); }
    if (bin.length > 256 && process.env.ALLOW_OVERSIZE !== "1") throw new Error(`${input}: ${bin.length} bytes > 256`);
    const stem = path.basename(input, path.extname(input));
    const o = path.resolve(outDir, stem);
    fs.writeFileSync(o, bin);
    let lst = ""; try { lst = FS.readFile("/a2-output.lst", { encoding: "utf8" }); } catch {}
    fs.writeFileSync(o + ".lst", lst);
    if (out.trim()) console.error(`[${stem}] ${out.trim()}`);
    manifest.push({ input: path.resolve(input), output: o, size: bin.length,
      sourceSha256: crypto.createHash("sha256").update(src).digest("hex"),
      binarySha256: crypto.createHash("sha256").update(bin).digest("hex") });
  }
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  for (const m of manifest) console.log(`${path.basename(m.output)}\t${m.size}\t${m.binarySha256}`);
})().catch((e) => { console.error(e); process.exit(1); });
