import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const catalog = JSON.parse(fs.readFileSync(path.join(here, 'catalog.json')));
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const seen = new Set();
let bytes = 0;
for (const record of catalog.records) {
  const absolute = path.resolve(root, record.path);
  assert.ok(absolute.startsWith(root + path.sep), 'Path escapes repository');
  assert.ok(!seen.has(record.path), 'Duplicate path: ' + record.path);
  seen.add(record.path);
  const data = fs.readFileSync(absolute);
  assert.equal(data.length, record.bytes, 'Size drift: ' + record.path);
  assert.equal(sha(data), record.sha256, 'Content drift: ' + record.path);
  bytes += data.length;
}
assert.equal(catalog.files, seen.size);
assert.equal(catalog.bytes, bytes);
execFileSync(process.execPath, ['tools/check-strong-codes.mjs'], {cwd: root, stdio: 'inherit'});
const decision = JSON.parse(fs.readFileSync(path.join(root, '.arena/kphl-defense-20261004/adaptive-counter/report.json'))).decision;
assert.equal(decision, 'NOT_ROBUST_AGAINST_ADAPTED_SIGNATURE_HUNTER');
const result = {schemaVersion:1, verifiedAt: new Date().toISOString(), researchArtifacts:seen.size,
  researchBytes:bytes, rawArchiveHashesVerified:true, catalogPairsVerified:18,
  catalogSourceRebuildCommand:'node tools/check-strong-codes.mjs --rebuild',
  sourceRebuildsPerformedForPublication:18, canonicalFinal:'zchain3',
  historicalReferences:['m049','m050','combo_zrl03','b01d','combo_ah02','e1p3','e1p4'],
  rejectedDefense:decision, newPerformanceBenchmarksRun:0,
  note:'Archives existing evidence; identity verification is not a fresh performance confirmation or a universal ranking.'};
fs.writeFileSync(path.join(here, 'publication-verification.json'), JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
