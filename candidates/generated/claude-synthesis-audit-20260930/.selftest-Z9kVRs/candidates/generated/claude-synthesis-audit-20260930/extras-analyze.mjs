import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { here, assert } from './protocol.mjs';

assert(process.argv.length === 2, 'usage: node extras-analyze.mjs');
// Reuse the exact same validation and statistics implementation. The extras mode
// requires both manifests and hashes all original/extra inputs before comparison.
const output = execFileSync(process.execPath, [path.join(here, 'analyze.mjs'), 'extras'], {
  encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'],
});
process.stdout.write(output);
