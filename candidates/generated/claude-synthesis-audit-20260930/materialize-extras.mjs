import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const a = fs.readFileSync(path.join(here, 'SubmittedA.asm'), 'utf8');
const b = fs.readFileSync(path.join(here, 'SubmittedB.asm'), 'utf8');
function once(text, from, to) {
  if (text.split(from).length !== 2) throw new Error(`Expected one occurrence: ${from}`);
  return text.replace(from, to);
}
const detour = [
  '    push ax', '    push si', '    mov di, si', '    add di, 0600h',
  '    mov ax, 01FFFh', '    mov dx, 01FFFh', '    db 09Bh, 09Bh',
  '    int 086h', '    pop si', '    pop ax', '',
].join('\n');
const bombNrg = once(a, '    lea sp, [di + 00200h]', '    mov sp, di\n    add sp, 00200h');
const outputs = {
  'BombNrgA.asm': bombNrg,
  'BombPlainA.asm': once(bombNrg, '    db 09Bh, 09Bh\n', ''),
  'LeaA.asm': once(a, detour, ''),
  'LeaB.asm': b,
};
for (const name of Object.keys(outputs)) {
  if (fs.existsSync(path.join(here, name))) throw new Error(`Refusing overwrite: ${name}`);
}
for (const [name, source] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(here, name), source, { flag: 'wx' });
  console.log(name);
}
