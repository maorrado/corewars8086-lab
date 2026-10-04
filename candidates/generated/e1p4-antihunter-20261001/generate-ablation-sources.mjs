import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const output = path.join(repo, 'candidates/generated/e1p4-ablation-20261002');
if (fs.existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
fs.mkdirSync(output, { recursive: true });

const inputs = {
  A: path.join(repo, 'candidates/generated/claude-e1p3-check-20261001/e1p3-A.asm'),
  B: path.join(repo, 'candidates/generated/claude-e1p3-check-20261001/e1p3-B.asm'),
};
const replacements = {
  callcam: ['call far [bx]', 'call far [bx + si]', 2],
  payloadcam: ['mov ax, 01FFFh', 'mov ax, 018FFh', 1],
};
const manifest = { baseline: 'e1p3 exact source', variants: {} };

for (const [variant, [before, after, expectedCount]] of Object.entries(replacements)) {
  manifest.variants[variant] = {};
  for (const warrior of ['A', 'B']) {
    const source = fs.readFileSync(inputs[warrior], 'utf8');
    const count = source.split(before).length - 1;
    if (count !== expectedCount) throw new Error(`${warrior}/${variant}: expected ${expectedCount} replacements, got ${count}`);
    const result = source.replaceAll(before, after);
    const filename = `e1p3-${variant}-${warrior}.asm`;
    const destination = path.join(output, filename);
    fs.writeFileSync(destination, result, { flag: 'wx' });
    manifest.variants[variant][warrior] = {
      source: path.relative(repo, destination).replaceAll('\\', '/'),
      sourceSha256: crypto.createHash('sha256').update(result).digest('hex'),
      replacement: `${before} => ${after}`,
      occurrences: count,
    };
  }
}

fs.writeFileSync(path.join(output, 'source-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(manifest, null, 2));
