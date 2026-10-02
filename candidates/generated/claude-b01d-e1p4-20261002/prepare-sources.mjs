import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const outDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(outDir, 'sources');
if (fs.existsSync(sourceDir)) throw new Error(`refusing to overwrite ${sourceDir}`);
fs.mkdirSync(sourceDir, { recursive: true });

const e1p3Dir = path.join(repo, 'candidates/generated/claude-e1p3-check-20261001');
const e1p3A = fs.readFileSync(path.join(e1p3Dir, 'e1p3-A.asm'), 'utf8');
const e1p3B = fs.readFileSync(path.join(e1p3Dir, 'e1p3-B.asm'), 'utf8');

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected one occurrence, found ${count}`);
  return source.replace(before, after);
}
function makeE1p4(source, label) {
  const payload = replaceOnce(source, 'mov ax, 01FFFh', 'mov ax, 018FFh', `${label} payload`);
  const calls = payload.split('call far [bx]').length - 1;
  if (calls !== 2) throw new Error(`${label}: expected two call far [bx], found ${calls}`);
  return payload.replaceAll('call far [bx]', 'call far [bx + si]');
}

const e1p4A = makeE1p4(e1p3A, 'A');
const e1p4B = makeE1p4(e1p3B, 'B');
const decoyStore = '    cld\n    mov word [0FF90h], 018FFh\n    mov ax, si';
let decoyA = replaceOnce(e1p4A, '    cld\n    mov ax, si', decoyStore, 'A decoy insertion');
decoyA = replaceOnce(
  decoyA,
  '    mov bx, PTR_CELL\n    push cs\n    pop ss\n    nop\n    nop\n    nop\n\nphoenix_pointer_ready:',
  '    mov bx, PTR_CELL\n    push cs\n    pop ss\n    nop\n    nop\n\nphoenix_pointer_ready:',
  'A decoy timing compensation',
);
const bandShiftB = replaceOnce(e1p4B, 'add ah, 034h', 'add ah, 070h', 'B band shift');

const variants = {
  control: [e1p4A, e1p4B],
  a_decoy: [decoyA, e1p4B],
  b_band_shift: [e1p4A, bandShiftB],
  b01d: [decoyA, bandShiftB],
};
for (const [variant, sources] of Object.entries(variants)) {
  for (let i = 0; i < sources.length; i++) {
    const file = path.join(sourceDir, `${variant}-${i === 0 ? 'A' : 'B'}.asm`);
    fs.writeFileSync(file, sources[i], { flag: 'wx' });
  }
}
const sourceManifest = {
  generatedAt: new Date().toISOString(),
  sourceOfTruth: {
    e1p3A: path.join(e1p3Dir, 'e1p3-A.asm'),
    e1p3B: path.join(e1p3Dir, 'e1p3-B.asm'),
    e1p4BinarySha256: [
      '99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93',
      'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354',
    ],
  },
  variants: Object.fromEntries(Object.entries(variants).map(([name, sources]) => [name, sources.map((source, i) => ({
    path: path.join(sourceDir, `${name}-${i === 0 ? 'A' : 'B'}.asm`),
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
    bytesUtf8: Buffer.byteLength(source),
  }))])),
  transformations: {
    e1p4: 'e1p3 payload 01FFFh -> 018FFh, and both far call anchors [bx] -> [bx+si].',
    a_decoy: 'Insert mov word [0FF90h],018FFh after startup cld and remove one main-entry NOP to balance one opcode turn.',
    b_band_shift: 'In B main entry only, change add ah,034h -> add ah,070h.',
    combined: 'Apply both candidate changes; all other source instructions derive from the checked e1p4 source transformations.',
  },
};
const manifestPath = path.join(outDir, 'source-manifest.json');
fs.writeFileSync(manifestPath, `${JSON.stringify(sourceManifest, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ sourceDir, manifestPath, variants: Object.keys(variants) }, null, 2));
