import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Same local NASM page used by assemble.mjs, driven through Chrome's built-in
// CDP WebSocket because this checkout has no resolvable Playwright package.
const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(process.argv[2] ?? path.join(here, 'build'));
const requestedInputs = process.argv.slice(3).map(file => path.resolve(file));
const inputs = requestedInputs.length ? requestedInputs : [path.join(here, 'e1p3-A.asm'), path.join(here, 'e1p3-B.asm')];
if (inputs.length !== 2) throw new Error('expected exactly two source files (A and B)');
if (fs.existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
for (const input of inputs) if (!fs.existsSync(input)) throw new Error(`missing source: ${input}`);

const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
if (!fs.existsSync(chromePath)) throw new Error(`Chrome not found: ${chromePath}`);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-e1p3-cdp-'));
const chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--no-first-run',
  '--disable-background-networking', '--disable-gpu', `--user-data-dir=${profile}`, 'about:blank'],
{ stdio: 'ignore', windowsHide: true });
let ws;
try {
  const activeFile = path.join(profile, 'DevToolsActivePort');
  let port;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (chrome.exitCode !== null) throw new Error(`Chrome exited early with ${chrome.exitCode}`);
    if (fs.existsSync(activeFile)) { port = fs.readFileSync(activeFile, 'utf8').split(/\r?\n/)[0]; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!port) throw new Error('Chrome remote-debugging endpoint did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const target = targets.find(item => item.type === 'page');
  if (!target) throw new Error('Chrome has no page target');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  let nextId = 0;
  const pending = new Map();
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message);
    }
  });
  const cdp = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Page.navigate', { url: 'http://127.0.0.1:8123/page.html' });
  let ready = false;
  for (let attempt = 0; attempt < 200; attempt++) {
    const response = await cdp('Runtime.evaluate', { expression: 'typeof window.run_nasm === "function" && !!window.FS', returnByValue: true });
    if (response.result?.result?.value === true) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('local assembler page did not expose run_nasm and FS');
  fs.mkdirSync(output, { recursive: true });
  const manifest = [];
  for (const input of inputs) {
    const source = fs.readFileSync(input, 'utf8');
    const expression = `(() => {
      const source = ${JSON.stringify(source)};
      const inputPath = '/codex-e1p3.asm', listingPath = '/codex-e1p3.lst', binaryPath = '/codex-e1p3';
      for (const file of [inputPath, listingPath, binaryPath]) { try { window.FS.unlink(file); } catch {} }
      window.FS.writeFile(inputPath, source, { encoding: 'utf8' });
      window.g_outputText = '';
      const exitCode = window.run_nasm(inputPath, listingPath);
      const binary = exitCode === 0 ? Array.from(window.FS.readFile(binaryPath, { encoding: 'binary' })) : [];
      let listing = ''; try { listing = window.FS.readFile(listingPath, { encoding: 'utf8' }); } catch {}
      return { exitCode, diagnostics: window.g_outputText, binary, listing };
    })()`;
    const response = await cdp('Runtime.evaluate', { expression, returnByValue: true });
    const result = response.result?.result?.value;
    if (!result || result.exitCode !== 0 || !result.binary?.length) throw new Error(`assembly failed for ${input}: ${result?.diagnostics ?? JSON.stringify(response)}`);
    if (result.binary.length > 256) throw new Error(`${input} assembled to ${result.binary.length} bytes (>256)`);
    const bytes = Buffer.from(result.binary);
    const name = path.basename(input, '.asm').replace('-', '');
    const binaryPath = path.join(output, name);
    fs.writeFileSync(binaryPath, bytes, { flag: 'wx' });
    fs.writeFileSync(`${binaryPath}.lst`, result.listing, { flag: 'wx' });
    manifest.push({ source: input, sourceSha256: crypto.createHash('sha256').update(source).digest('hex'),
      binary: binaryPath, bytes: bytes.length, binarySha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  }
  fs.writeFileSync(path.join(output, 'manifest.json'), `${JSON.stringify({ source: 'local 8086 NASM page at 127.0.0.1:8123/page.html', files: manifest }, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify(manifest, null, 2));
} finally {
  try { ws?.close(); } catch {}
  if (chrome.exitCode === null && chrome.pid) {
    try { execFileSync('taskkill.exe', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); } catch {}
    if (chrome.exitCode === null) await Promise.race([
      new Promise(resolve => chrome.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  }
  const tempRoot = path.resolve(os.tmpdir());
  const profilePath = path.resolve(profile);
  if (chrome.exitCode !== null && profilePath.startsWith(`${tempRoot}${path.sep}`)
      && path.basename(profilePath).startsWith('codex-e1p3-cdp-'))
    fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
