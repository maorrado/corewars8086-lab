import fs from "node:fs";
import path from "node:path";

const here = path.resolve(import.meta.dirname);
const originalDir = path.join(here, "zombie_bomb_antipodal");
const targetDir = path.join(here, "zombie_bomb_survey8");
const a = fs.readFileSync(path.join(originalDir, "A.asm"), "utf8").replace(/\r\n/g, "\n");
const b = fs.readFileSync(path.join(originalDir, "B.asm"), "utf8").replace(/\r\n/g, "\n");
const old = `    mov di, si
    add di, 04000h
    push cs
    pop es
    mov ax, 0CCCCh
    mov dx, ax
    cld
    int 086h
    add di, 07F00h
    int 086h
`;
const replacement = `    mov di, si
    add di, 04000h
    push cs
    pop es
    push cs
    pop ds
    mov ax, 0CCCCh
    mov dx, ax
    int 086h
    mov di, si
    sub di, 04000h
    mov cx, 8
.survey:
    cmp byte [di], 0CCh
    jne .occupied
    add di, 0080h
    loop .survey
    mov di, si
    sub di, 04000h
    jmp short .second_bomb
.occupied:
    sub di, 0080h
.second_bomb:
    int 086h
`;
if (!a.includes(old)) throw new Error("antipodal source changed; inspect before rewriting");
const newA = a.replace(old, replacement);
fs.mkdirSync(targetDir, {recursive:true});
fs.writeFileSync(path.join(targetDir, "A.asm"), newA);
fs.writeFileSync(path.join(targetDir, "B.asm"), b);
console.log(JSON.stringify({source:path.join(targetDir,"A.asm"),bytes:newA.length,firstBomb:"base+4000h",secondBomb:"8 capped 128-byte occupancy probes near base+C000h; fallback C000h"},null,2));
