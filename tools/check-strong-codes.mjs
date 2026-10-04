import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

// Identity verification only: rebuilding a pair does not validate its score.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = path.join(root, 'strong-codes');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const read = p => fs.readFileSync(path.join(root, p));
const sourceHash = p => hash(Buffer.from(read(p).toString('utf8').replaceAll('\r\n', '\n')));
const writeJSON = (p, data) => fs.writeFileSync(path.join(root, p), JSON.stringify(data, null, 2) + '\n');
const historical = {
  '13_combo_zrl03_historical': ['605880ba552c3d43c5cd175693b1942cf401c60c2135f62ab76a97dc20d1b051', '011720f6ae95c4b225ee92acfcbe4e373e6c56d78fadde3b11268a162529f334'],
  '14_b01d_historical': ['775080226ca8f9e9a5aac584094c9066bd2c55365ee8cea1e18db26440d9315e', '884b4d52e4ef1e57db85c88083d0a8667a6bd252a25728da7f5fdedefa6f33c7'],
  '15_combo_ah02_historical': ['dea095d386ae54616a34074fc3762996bcb8a3f3059495af96751e93fe8f143f', 'd46efcc1b182b71cd57d110cf6484c29f699e8dd3969795b599f4b9a156a956a'],
  '16_e1p3_historical': ['caced989dd55b98a749d5dc3a2d20d533e14013affb08b84572c9f76f1a05117', '99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b'],
  '17_e1p4_historical': ['99192c673e5af394ed8194932b52b4f18f092804384f38d1bb2828b189c76b93', 'd307b92097ac68ce6073adc1e34917b2f51c0c396235c918dfc913cee7393354'],
  'research/KPHLGuard': ['cf684e08a51798a732620c6196d82b3de1a7b57deb545ce2741fda2cce757afd', 'd023af0f36fbeba8a012001db969247efcc0420f51c80da72aa0be129b85e51a']
};
const dirs = fs.readdirSync(catalog).filter(d => /^\d\d_/.test(d)).sort();
dirs.push('research/KPHLGuard');
const rebuilding = process.argv.includes('--rebuild');
const entries = [];
for (const dir of dirs) {
  const prefix = 'strong-codes/' + dir;
  const documentation = read(prefix + '/README.md').toString();
  const expected = historical[dir] ?? [...documentation.matchAll(/\b[0-9a-f]{64}\b/g)].slice(0, 2).map(m => m[0]);
  if (expected.length !== 2) throw new Error('Missing expected binary hashes: ' + dir);
  const scratch = 'build/strong-codes-verification-20261004/' + dir;
  if (rebuilding) {
    execFileSync(process.execPath, ['agent2/tools/nasm-node.cjs', scratch, prefix + '/A.asm', prefix + '/B.asm'], {cwd: root, stdio: 'pipe'});
  }
  const pair = ['A', 'B'].map((name, i) => {
    const binaryPath = prefix + '/' + name;
    const sourcePath = binaryPath + '.asm';
    const bytes = read(binaryPath);
    const binarySha256 = hash(bytes);
    if (binarySha256 !== expected[i] || bytes.length > 256) throw new Error('Catalog identity/size mismatch: ' + binaryPath);
    if (rebuilding && !read(scratch + '/' + name).equals(bytes)) throw new Error('Source rebuild mismatch: ' + binaryPath);
    return { source: sourcePath, binary: binaryPath, bytes: bytes.length, binarySha256, sourceSha256LF: sourceHash(sourcePath) };
  });
  const status = dir === '08_zchain3_final' ? 'active-final-reference'
    : dir.startsWith('research/') ? 'rejected-robust-defense-claim'
    : dir.endsWith('_historical') ? 'historical-reference' : 'measured-candidate-not-universal-champion';
  entries.push({dir, status, documentation: prefix + '/README.md', pair});
  console.log(`${dir}: ${pair[0].bytes}/${pair[1].bytes} bytes; identities verified${rebuilding ? ', source rebuild matched' : ''}`);
}
const finalEntry = entries.find(e => e.status === 'active-final-reference');
const finalManifest = JSON.parse(read('build/final/manifest.json'));
for (const [i, name] of ['ChimeraA', 'ChimeraB'].entries()) {
  const expected = finalEntry.pair[i];
  if (hash(read('build/final/' + name)) !== expected.binarySha256) throw new Error('Stale final binary: ' + name);
  if (sourceHash('final/' + name + '.asm') !== expected.sourceSha256LF) throw new Error('Final source differs from catalog: ' + name);
  if (finalManifest[i].binarySha256 !== expected.binarySha256 || finalManifest[i].sourceSha256 !== expected.sourceSha256LF) throw new Error('Final manifest identity mismatch: ' + name);
}
const existingIndex = JSON.parse(read('strong-codes/index.json'));
const index = entries.filter(e => !e.dir.startsWith('research/')).map(e => {
  const prior = existingIndex.find(p => p.dir === e.dir) ?? {};
  return {...prior, dir: e.dir, title: e.dir === '01_DET2' ? 'DET2 - leads the measured mixed confirmation field' : prior.title ?? e.dir.replace(/^\d\d_/, '').replaceAll('_', ' '), status: e.status,
    sa: e.pair[0].bytes, sb: e.pair[1].bytes, ha: e.pair[0].binarySha256.slice(0,8), hb: e.pair[1].binarySha256.slice(0,8)};
});
const manifest = {schemaVersion: 1, canonicalFinal: '08_zchain3_final', note: 'Folder numbers are navigation IDs, not a universal ranking. Hashes establish identity, not performance.', entries};
// --rebuild regenerates committed metadata only after every identity check passes.
if (rebuilding) {
  writeJSON('strong-codes/manifest.json', manifest);
  writeJSON('strong-codes/index.json', index);
  for (const entry of entries) {
    writeJSON('strong-codes/' + entry.dir + '/manifest.json', entry.pair.map(p => ({
      input:p.source, output:p.binary, size:p.bytes,
      sourceSha256:p.sourceSha256LF, sourceHashNormalization:'CRLF to LF', binarySha256:p.binarySha256
    })));
  }
  writeJSON('strong-codes/research/KPHLGuard/package.json', {
    ...entries.find(e => e.dir === 'research/KPHLGuard'),
    originalPackage: 'candidates/generated/kphl-guard-20261004/evidence.json',
    adaptedHunter: '.arena/kphl-defense-20261004/adaptive-counter/report.json',
    decision: 'NOT_ROBUST_AGAINST_ADAPTED_SIGNATURE_HUNTER'
  });
} else {
  const recorded = JSON.parse(read('strong-codes/manifest.json'));
  if (JSON.stringify(recorded) !== JSON.stringify(manifest)) throw new Error('Manifest drift; investigate before regenerating metadata');
}
console.log(`${entries.length} pairs verified; canonical final is zchain3. No new performance tests were run.`);
