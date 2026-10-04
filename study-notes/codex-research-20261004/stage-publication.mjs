import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const catalog = JSON.parse(fs.readFileSync(path.join(here, 'catalog.json')));
const paths = catalog.records.map(r => r.path);
if (new Set(paths).size !== paths.length) throw new Error('Duplicate publication paths');
for (const item of paths) {
  if (!path.resolve(root, item).startsWith(root + path.sep)) throw new Error('Path outside repository');
}
// Literal update-index paths avoid treating tens of thousands of paths as a
// quadratic pathspec search. This stages only the explicitly reviewed catalog.
execFileSync('git', ['-c','core.longpaths=true','-c','core.autocrlf=false','update-index','--add','-z','--stdin'],
  {cwd:root, input:Buffer.from(paths.join('\0')+'\0'), maxBuffer:1000000});
console.log(`Staged ${paths.length} reviewed research files. No commit or push performed by this helper.`);
