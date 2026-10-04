import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mechanical phase-only revision; v1 sources/binaries/results stay untouched.
const here = path.dirname(fileURLToPath(import.meta.url));
for (const [member, oldPhase, newPhase] of [
  ['a', '010h', '040h'],
  ['b', '034h', '064h'],
]) {
  const source = fs.readFileSync(path.join(here, `direct-copy-${member}.asm`), 'utf8');
  const needle = `add ah, ${oldPhase}`;
  if (source.split(needle).length !== 2) throw new Error(`Expected one ${needle} in ${member}`);
  const revised = source.replace(needle, `add ah, ${newPhase}`)
    .replace('Experimental anchor-free Phoenix', 'Experimental v2 anchor-free Phoenix');
  fs.writeFileSync(path.join(here, `direct-copy-v2-${member}.asm`), revised);
}
