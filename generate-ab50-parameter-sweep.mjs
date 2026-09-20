import fs from "node:fs";
import path from "node:path";

const variants = [
  ["p001", 0x0000, 0x1111],
  ["p002", 0x0000, 0x3333],
  ["p003", 0x0000, 0x4001],
  ["p004", 0x0000, 0x6d3b],
  ["p005", 0x0000, 0x7ffd],
  ["p006", 0x0000, 0x8001],
  ["p007", 0x0000, 0x9e37],
  ["p008", 0x0000, 0xb6db],
  ["p009", 0x0000, 0xd555],
  ["p010", 0x0000, 0xeca9],
  ["p011", 0x1f3d, 0xb6db],
  ["p012", 0x3333, 0xaaab],
  ["p013", 0x4001, 0xc001],
  ["p014", 0x6d3b, 0x9e37]
];

const directory = path.resolve("candidates/generated/ab50-parameters");
fs.mkdirSync(directory, { recursive: true });
const hex = (value) => `0${value.toString(16).toUpperCase().padStart(4, "0")}h`;
const source = (offset) => `bits 16

start:
    push ds
    pop ss
    mov sp, ax
${offset === 0 ? "" : `    add sp, ${hex(offset)}\n`}    push ds
    pop es
    mov di, ax
    add di, generated - start
    mov ax, 0AB50h
    push ax
    stosw
generated:
`;

const manifest = [];
for (const [id, offsetA, offsetB] of variants) {
  const fileA = path.join(directory, `${id}_a.asm`);
  const fileB = path.join(directory, `${id}_b.asm`);
  fs.writeFileSync(fileA, source(offsetA), "utf8");
  fs.writeFileSync(fileB, source(offsetB), "utf8");
  manifest.push({ id, offsetA, offsetB, files: [fileA, fileB] });
}
fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
