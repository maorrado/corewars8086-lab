import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const files = process.argv.slice(2);
if (files.length === 0) throw new Error("usage: node disassemble.mjs <binary> [...]");

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage();
await page.goto("http://127.0.0.1:8123/page.html", { waitUntil: "load" });
await page.waitForFunction(() => typeof window.j_loadBinary === "function");
await page.evaluate(() => {
  window.removeAllPlayers();
  const label = window.addPlayerPanel_as("disassembly", false);
  window.j_srcSelectionChanged(label, 1);
});

for (const file of files) {
  const bytes = [...fs.readFileSync(file)];
  const asm = await page.evaluate((data) => {
    window.doLoadBinary(Uint8Array.from(data).buffer);
    return window.asm_edit.value;
  }, bytes);
  process.stdout.write(`; ===== ${path.resolve(file)} (${bytes.length} bytes) =====\n${asm}\n`);
}
await browser.close();
