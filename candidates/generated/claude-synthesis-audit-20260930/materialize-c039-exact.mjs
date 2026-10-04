import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(here, 'BombPlainA.asm'), 'utf8');
const padding = '    times 2 db 0CCh\n';
if (source.split(padding).length !== 2) throw new Error('Expected one skipped padding region');
const output = path.join(here, 'BombPlainNoPadA.asm');
fs.writeFileSync(output, source.replace(padding, ''), { flag: 'wx' });
console.log(output);
