import fs from "node:fs";
import path from "node:path";

const variants = [
  { id: "m001", gap: 0x0500, bp: 0x3a00, dx: 0x3400 },
  { id: "m002", gap: 0x0400, bp: 0x3a00, dx: 0x3400 },
  { id: "m003", gap: 0x0600, bp: 0x3a00, dx: 0x3400 },
  { id: "m004", gap: 0x0800, bp: 0x3a00, dx: 0x3400 },
  { id: "m005", gap: 0x0500, bp: 0x3800, dx: 0x3200 },
  { id: "m006", gap: 0x0500, bp: 0x3c00, dx: 0x3600 },
  { id: "m007", gap: 0x0300, bp: 0x3a00, dx: 0x3600 },
  { id: "m008", gap: 0x0700, bp: 0x3a00, dx: 0x3200 }
];
const adds = [0x4d, 0x8d];
const directory = path.resolve("candidates/generated/phoenix-motion");
fs.mkdirSync(directory, { recursive: true });
const h = (value) => `0${value.toString(16).toUpperCase().padStart(4, "0")}h`;
function source(variant, add, pointerCell) {
  return `bits 16
%define FAR_SEG 0FF8h
%define PTR_CELL ${h(pointerCell)}
start:
    mov si, ax
    mov al, 0A2h
    add ah, 0${add.toString(16).toUpperCase()}h
    add si, worker - start
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    push cs
    pop ss
    mov bx, PTR_CELL
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, ${h(variant.gap)}
    mov cx, 9
    mov dx, ${h(variant.dx)}
    mov bp, ${h(variant.bp)}
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]
worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
`;
}
const manifest = [];
for (const variant of variants) {
  const files = adds.map((add, index) => {
    const file = path.join(directory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant, add, 0x200 + index * 0x40), "utf8");
    return file;
  });
  manifest.push({ ...variant, adds, files });
}
fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
