import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const outputDirectory = path.resolve(process.argv[2] ?? '');
const inputFiles = process.argv.slice(3).map(file => path.resolve(file));
if (!process.argv[2] || inputFiles.length === 0) {
  throw new Error('usage: node assemble-via-cdp.mjs <output-directory> <input.asm> [...]');
}
const endpoint = process.env.CHROME_CDP_ENDPOINT ?? 'http://127.0.0.1:9222';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let targets;
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    targets = await (await fetch(`${endpoint}/json/list`)).json();
    break;
  } catch {
    await sleep(250);
  }
}
if (!targets) throw new Error(`no Chrome DevTools endpoint at ${endpoint}`);
const target = targets.find(item => item.type === 'page' && item.url.includes('127.0.0.1:8123/page.html'));
if (!target) throw new Error('Chrome has no page open at the local assembler URL');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});
let nextId = 1;
const pending = new Map();
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});
function cdp(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

const ready = await cdp('Runtime.evaluate', {
  expression: 'typeof window.run_nasm === "function" && !!window.FS',
  returnByValue: true,
});
if (ready.result?.value !== true) throw new Error('local web assembler is not ready');
fs.mkdirSync(outputDirectory, { recursive: true });
const compiled = [];
for (const inputFile of inputFiles) {
  const source = fs.readFileSync(inputFile, 'utf8');
  const expression = `(() => {\n` +
    `const asm = ${JSON.stringify(source)};\n` +
    `const inputPath = '/codex-b01d-input.asm'; const listingPath = '/codex-b01d-output.lst'; const binaryPath = '/codex-b01d-input';\n` +
    `for (const p of [inputPath, listingPath, binaryPath]) { try { FS.unlink(p); } catch {} }\n` +
    `FS.writeFile(inputPath, asm, {encoding:'utf8'}); window.g_outputText = '';\n` +
    `const exitCode = window.run_nasm(inputPath, listingPath);\n` +
    `let binary = []; if (exitCode === 0) binary = Array.from(FS.readFile(binaryPath, {encoding:'binary'}));\n` +
    `let listing = ''; try { listing = FS.readFile(listingPath, {encoding:'utf8'}); } catch {}\n` +
    `return {exitCode, diagnostics:window.g_outputText, binary, listing}; })()`;
  const response = await cdp('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(`browser exception for ${inputFile}: ${response.exceptionDetails.text}`);
  const result = response.result?.value;
  if (!result || result.exitCode !== 0 || result.binary.length === 0) {
    throw new Error(`assembly failed for ${inputFile}: ${result?.diagnostics ?? 'no result'}`);
  }
  const bytes = Buffer.from(result.binary);
  const base = path.basename(inputFile, path.extname(inputFile));
  const binaryPath = path.join(outputDirectory, base);
  const listingPath = `${binaryPath}.lst`;
  for (const file of [binaryPath, listingPath]) {
    if (fs.existsSync(file)) throw new Error(`refusing to overwrite ${file}`);
  }
  fs.writeFileSync(binaryPath, bytes, { flag: 'wx' });
  fs.writeFileSync(listingPath, result.listing, { flag: 'wx' });
  compiled.push({
    source: inputFile,
    binary: binaryPath,
    bytes: bytes.length,
    sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
    binarySha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  });
  console.log(`${path.basename(binaryPath)}: ${bytes.length} bytes ${compiled.at(-1).binarySha256}`);
}
const manifestPath = path.join(outputDirectory, 'manifest.json');
if (fs.existsSync(manifestPath)) throw new Error(`refusing to overwrite ${manifestPath}`);
fs.writeFileSync(manifestPath, `${JSON.stringify({ compiledAt: new Date().toISOString(), compiled }, null, 2)}\n`, { flag: 'wx' });
socket.close();
console.log(`wrote ${manifestPath}`);
