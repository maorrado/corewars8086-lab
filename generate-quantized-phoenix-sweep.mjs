import fs from "node:fs";
import path from "node:path";

const variants = [
  { id: "r001", band: 0x2b, phases: [0x00, 0x16] },
  { id: "r002", band: 0x34, phases: [0x08, 0x20] },
  { id: "r003", band: 0x3d, phases: [0x00, 0x18] },
  { id: "r004", band: 0x40, phases: [0x08, 0x28] },
  { id: "r005", band: 0x55, phases: [0x00, 0x20] },
  { id: "r006", band: 0x25, phases: [0x0c, 0x24] }
];

const directory = path.resolve("candidates/generated/quantized-phoenix");
fs.mkdirSync(directory, { recursive: true });
const h = (value, width = 2) => `0${value.toString(16).toUpperCase().padStart(width, "0")}h`;
function source(band, phase, pointerCell) {
  const step = band << 8;
  const stackShift = (step - 0x400) & 0xffff;
  return `bits 16
%define FAR_SEG 0FFCh
%define PTR_CELL ${h(pointerCell, 4)}
start:
    mov si, ax
    mov al, ah
    xor ah, ah
    mov ch, ${h(band)}
    div ch
    mul ch
    mov ah, al
${phase === 0 ? "" : `    add ah, ${h(phase)}\n`}    mov al, 0A2h
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
    add sp, 0300h
    mov cx, 9
    mov dx, ${h(stackShift, 4)}
    mov bp, ${h(step, 4)}
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
  const files = variant.phases.map((phase, index) => {
    const file = path.join(directory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant.band, phase, 0x200 + index * 0x40), "utf8");
    return file;
  });
  manifest.push({ ...variant, files });
}
fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
