import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const baseA = path.join(here, 'e1p3-A.asm');
const baseB = path.join(here, 'e1p3-B.asm');
const configSource = path.join(repo, 'experiments/claude-e1p3-screen-20261001/configs/panel-01-e1p3.json');
const sourceRoot = path.join(here, 'relay-sources');
const configRoot = path.join(repo, 'experiments/claude-e1p3-relay-screen-20261001/configs');
if (!fs.existsSync(configSource)) throw new Error('e1p3 screen configs are missing');
if (fs.existsSync(sourceRoot) || fs.existsSync(configRoot)) throw new Error('refusing to overwrite relay sources/configs');

function replaceExact(source, from, to, expected, label) {
  const count = source.split(from).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected} occurrences, got ${count}`);
  return source.split(from).join(to);
}
function relay(source, esCount, dsCount, label) {
  source = replaceExact(source, '    push ss\n    pop es', '    mov bx, ss\n    mov es, bx', esCount, `${label} SS-to-ES`);
  return replaceExact(source, '    push ss\n    pop ds', '    mov ds, bx', dsCount, `${label} BX-to-DS relay`);
}
const originalA = fs.readFileSync(baseA, 'utf8');
const originalB = fs.readFileSync(baseB, 'utf8');
const variants = [
  { id: 'relay-a', relayA: true, relayB: false },
  { id: 'relay-b', relayA: false, relayB: true },
  { id: 'relay-ab', relayA: true, relayB: true },
];
fs.mkdirSync(sourceRoot, { recursive: true });
for (const variant of variants) {
  const folder = path.join(sourceRoot, variant.id);
  fs.mkdirSync(folder, { recursive: true });
  const a = variant.relayA ? relay(originalA, 2, 2, `${variant.id} A`) : originalA;
  const b = variant.relayB ? relay(originalB, 1, 1, `${variant.id} B`) : originalB;
  fs.writeFileSync(path.join(folder, 'e1p3-A.asm'), a, { flag: 'wx' });
  fs.writeFileSync(path.join(folder, 'e1p3-B.asm'), b, { flag: 'wx' });
  variant.sources = [a, b].map((text, index) => ({ file: `e1p3-${index ? 'B' : 'A'}.asm`,
    bytes: Buffer.byteLength(text), sha256: crypto.createHash('sha256').update(text).digest('hex') }));
}
fs.mkdirSync(configRoot, { recursive: true });
const result = [];
for (const variant of variants) for (let panel = 1; panel <= 8; panel++) {
  const id = String(panel).padStart(2, '0');
  const config = JSON.parse(fs.readFileSync(path.join(repo, `experiments/claude-e1p3-screen-20261001/configs/panel-${id}-e1p3.json`), 'utf8'));
  const binaries = path.join(here, 'relay-builds', variant.id);
  config.candidate.warriors = [path.join(binaries, 'e1p3A'), path.join(binaries, 'e1p3B')];
  config.outputPath = path.join(repo, `experiments/claude-e1p3-relay-screen-20261001/results/${variant.id}/panel-${id}.json`);
  config.runDirectory = path.join(repo, `experiments/claude-e1p3-relay-screen-20261001/runs/${variant.id}/panel-${id}`);
  const target = path.join(configRoot, `${variant.id}-panel-${id}.json`);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx' });
  result.push({ variant: variant.id, panel: id, config: target,
    physicalWars: config.seeds.length * config.cohorts.length * config.battles });
}
fs.writeFileSync(path.join(here, 'relay-screen-manifest.json'), `${JSON.stringify({
  protocol: 'three mechanism-isolation arms screened on the exact already-used e1p3 panels/seeds; exploratory only',
  baseSourceSha256: [baseA, baseB].map(file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')),
  engineOpcodeSupport: 'local engine Cpu.java implements MOV r/m16,Sreg (8C) and MOV Sreg,r/m16 (8E); full original-source screen still required',
  variants, configs: result,
}, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ variants: variants.map(({id}) => id), configs: result.length,
  physicalWars: result.reduce((sum, item) => sum + item.physicalWars, 0), configRoot }, null, 2));
