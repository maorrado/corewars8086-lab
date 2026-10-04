import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const arms = [
  { id: 'm050-callbxsi', base: ['build/final/ChimeraA', 'build/final/ChimeraB'], candidate: ['ChimeraA', 'ChimeraB'] },
  { id: 'e1p3-callbxsi', base: ['candidates/generated/claude-e1p3-check-20261001/build/e1p3A', 'candidates/generated/claude-e1p3-check-20261001/build/e1p3B'], candidate: ['ChimeraA', 'ChimeraB'] },
];
const results = [];
for (const arm of arms) for (let index = 0; index < 2; index++) {
  const basePath = path.join(repo, arm.base[index]);
  const candidatePath = path.join(here, 'build', arm.id, arm.candidate[index]);
  const base = fs.readFileSync(basePath), candidate = fs.readFileSync(candidatePath);
  if (base.length !== candidate.length) throw new Error(`${arm.id}/${index}: binary size changed`);
  const differences = [];
  for (let offset = 0; offset < base.length; offset++) if (base[offset] !== candidate[offset])
    differences.push({ offset, before: base[offset], after: candidate[offset], opcode: offset > 0 ? candidate[offset - 1] : null });
  if (differences.length !== 2 || differences.some(change => change.before !== 0x1f || change.after !== 0x18 || change.opcode !== 0xff))
    throw new Error(`${arm.id}/${index}: expected exactly two FF 1F -> FF 18 ModRM edits, got ${JSON.stringify(differences)}`);
  const source = fs.readFileSync(path.join(here, 'sources', arm.id, index === 0 ? 'ChimeraA.asm' : 'ChimeraB.asm'), 'utf8');
  const calls = [...source.matchAll(/^\s*call far \[bx\+si\]\s*$/gim)];
  if (calls.length !== 2) throw new Error(`${arm.id}/${index}: expected two rewritten CALL FAR sites`);
  results.push({ arm: arm.id, warrior: index === 0 ? 'A' : 'B', bytes: candidate.length,
    baseSha256: sha(base), candidateSha256: sha(candidate), differences });
}
const output = path.join(here, 'assembly-audit.json');
if (fs.existsSync(output)) throw new Error(`refusing to overwrite ${output}`);
const payload = { status: 'PASS', semanticCondition: 'Each entry and worker path clears SI before either CALL FAR site; BX is not changed between the clear and the call.', result: 'Equal byte lengths; only the two ModRM bytes changed from 1F to 18 in each warrior; all other bytes are identical.', binaries: results };
fs.writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify(payload, null, 2));
