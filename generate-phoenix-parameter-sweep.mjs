import fs from "node:fs";
import path from "node:path";

const variants = [
  { id: "q001", segment: 0x0ff8, adds: [0x0d, 0x2d] },
  { id: "q002", segment: 0x0ff8, adds: [0x2d, 0x6d] },
  { id: "q003", segment: 0x0ff8, adds: [0x4d, 0x8d] },
  { id: "q004", segment: 0x0ff8, adds: [0x6d, 0xad] },
  { id: "q005", segment: 0x0ff8, adds: [0x8d, 0xcd] },
  { id: "q006", segment: 0x0ff8, adds: [0xad, 0xed] },
  { id: "q007", segment: 0x0ffc, adds: [0x4d, 0x8d] },
  { id: "q008", segment: 0x0ff4, adds: [0x4d, 0x8d] }
];

const directory = path.resolve("candidates/generated/phoenix-parameters");
fs.mkdirSync(directory, { recursive: true });
const h = (value) => `0${value.toString(16).toUpperCase()}h`;
function source(segment, add, pointerCell) {
  return `bits 16
%define FAR_SEG ${h(segment)}
%define PTR_CELL ${h(pointerCell)}
start:
    mov si, ax
    mov al, 0A2h
    add ah, ${h(add)}
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
    add sp, 0500h
    mov cx, 9
    mov dx, 03400h
    mov bp, 03A00h
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
  const files = variant.adds.map((add, index) => {
    const file = path.join(directory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant.segment, add, 0x200 + index * 0x40), "utf8");
    return file;
  });
  manifest.push({ ...variant, files });
}
fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
