import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// UTF-8 NUL framing preserves spaces, backslashes and Unicode without shell
// escaping. Input JSON: {jobs:[{id:"unique-id",args:["--headless", ...]}]}.
export function encodeBatch(jobs) {
  if (!Array.isArray(jobs) || jobs.length < 1 || jobs.length > 10000) throw new Error('invalid batch job count');
  const fields = ['CW8086-SERIAL-BATCH-V1', String(jobs.length)];
  const ids = new Set();
  for (const job of jobs) {
    if (!/^[A-Za-z0-9_.-]+$/.test(job.id) || ids.has(job.id)) throw new Error('invalid or duplicate job id');
    ids.add(job.id);
    if (!Array.isArray(job.args) || job.args.length < 1 || job.args.length > 1000
      || job.args.some(arg => typeof arg !== 'string' || arg.includes('\0'))) throw new Error('invalid job arguments');
    fields.push(job.id, String(job.args.length), ...job.args);
  }
  return Buffer.from(`${fields.join('\0')}\0`, 'utf8');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw new Error('usage: node batch-format.mjs <jobs.json> <new-manifest.nul>');
  const source = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const bytes = encodeBatch(source.jobs);
  fs.writeFileSync(process.argv[3], bytes, { flag: 'wx' });
  console.log(JSON.stringify({ jobs: source.jobs.length, manifest: path.resolve(process.argv[3]), bytes: bytes.length }));
}
