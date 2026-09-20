import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const outputDirectory = process.argv[2];
const inputFiles = process.argv.slice(3);
if (!outputDirectory || inputFiles.length === 0) {
  throw new Error("usage: node assemble.mjs <output-directory> <input.asm> [...]");
}
const allowOversize = process.env.ALLOW_OVERSIZE === "1";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8123/page.html", { waitUntil: "load" });
await page.waitForFunction(() => typeof window.run_nasm === "function" && window.FS);

fs.mkdirSync(outputDirectory, { recursive: true });
const manifest = [];
for (const inputFile of inputFiles) {
  const source = fs.readFileSync(inputFile, "utf8");
  const result = await page.evaluate((asm) => {
    const inputPath = "/codex-input.asm";
    const listingPath = "/codex-output.lst";
    const binaryPath = "/codex-input";
    for (const candidate of [inputPath, listingPath, binaryPath]) {
      try { window.FS.unlink(candidate); } catch {}
    }
    window.FS.writeFile(inputPath, asm, { encoding: "utf8" });
    window.g_outputText = "";
    const exitCode = window.run_nasm(inputPath, listingPath);
    let binary = [];
    if (exitCode === 0) {
      binary = Array.from(window.FS.readFile(binaryPath, { encoding: "binary" }));
    }
    let listing = "";
    try { listing = window.FS.readFile(listingPath, { encoding: "utf8" }); } catch {}
    return { exitCode, diagnostics: window.g_outputText, binary, listing };
  }, source);

  if (result.exitCode !== 0 || result.binary.length === 0) {
    throw new Error(`assembly failed for ${inputFile}:\n${result.diagnostics}`);
  }
  if (result.binary.length > 256 && !allowOversize) {
    throw new Error(`${inputFile} assembled to ${result.binary.length} bytes; 2025 final limit is 256`);
  }
  const outputName = path.basename(inputFile, path.extname(inputFile));
  const outputPath = path.resolve(outputDirectory, outputName);
  const bytes = Buffer.from(result.binary);
  fs.writeFileSync(outputPath, bytes);
  fs.writeFileSync(`${outputPath}.lst`, result.listing, "utf8");
  manifest.push({
    input: path.resolve(inputFile),
    output: outputPath,
    size: bytes.length,
    sourceSha256: crypto.createHash("sha256").update(source).digest("hex"),
    binarySha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  });
}

const manifestPath = path.resolve(outputDirectory, "manifest.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ manifestPath, files: manifest }, null, 2));
await browser.close();
