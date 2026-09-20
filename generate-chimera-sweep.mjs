import fs from "node:fs";
import path from "node:path";

const variants = [
  { id: "x001", band: 0x34, phases: [0x18, 0x00, 0x28], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x002", band: 0x34, phases: [0x08, 0x20, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x003", band: 0x34, phases: [0x10, 0x24, 0x2c], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x004", band: 0x30, phases: [0x10, 0x00, 0x20], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x005", band: 0x38, phases: [0x18, 0x00, 0x28], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x006", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x007", band: 0x40, phases: [0x20, 0x00, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x008", band: 0x2c, phases: [0x0c, 0x1c, 0x24], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x009", band: 0x34, phases: [0x18, 0x00, 0x28], gap: 0x500, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "x010", band: 0x34, phases: [0x18, 0x00, 0x28, 0x10], gap: 0x300, margin: 0x400, direction: "backward", hooks: "split" },
  { id: "x011", band: 0x38, phases: [0x08, 0x20, 0x30, 0x18], gap: 0x300, margin: 0x400, direction: "backward", hooks: "split" },
  { id: "x012", band: 0x34, phases: [0x18, 0x00, 0x28], gap: 0x300, margin: 0x400, direction: "forward", hooks: "shared" },
  { id: "y001", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y002", band: 0x3c, phases: [0x0c, 0x20, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y003", band: 0x3c, phases: [0x10, 0x20, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y004", band: 0x3c, phases: [0x18, 0x00, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y005", band: 0x3c, phases: [0x08, 0x20, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y006", band: 0x3c, phases: [0x1c, 0x08, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y007", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y008", band: 0x3c, phases: [0x20, 0x08, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y009", band: 0x3a, phases: [0x1a, 0x00, 0x2c], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y010", band: 0x3e, phases: [0x1e, 0x00, 0x2e], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y011", band: 0x36, phases: [0x18, 0x00, 0x2a], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y012", band: 0x42, phases: [0x20, 0x00, 0x32], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y013", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y014", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x400, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "y015", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x300, margin: 0x200, direction: "backward", hooks: "shared" },
  { id: "y016", band: 0x3c, phases: [0x1c, 0x00, 0x2c], gap: 0x300, margin: 0x600, direction: "backward", hooks: "shared" },
  { id: "z001", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z002", band: 0x3c, phases: [0x0c, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z003", band: 0x3c, phases: [0x14, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z004", band: 0x3c, phases: [0x10, 0x24, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z005", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z006", band: 0x3c, phases: [0x10, 0x28, 0x30], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z007", band: 0x3c, phases: [0x10, 0x28, 0x38], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z008", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x400, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z009", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z010", band: 0x3a, phases: [0x10, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z011", band: 0x40, phases: [0x10, 0x28, 0x34], gap: 0x300, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "z012", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x300, margin: 0x600, direction: "backward", hooks: "shared" },
  { id: "w001", band: 0x3c, phases: [0x10, 0x28, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "w002", band: 0x3c, phases: [0x10, 0x24, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "w003", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "w004", band: 0x3c, phases: [0x10, 0x28, 0x30], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "w005", band: 0x3c, phases: [0x14, 0x28, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "w006", band: 0x3c, phases: [0x0c, 0x24, 0x30], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v001", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v002", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x100, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v003", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x180, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v004", band: 0x3c, phases: [0x10, 0x2c, 0x34], gap: 0x280, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v005", band: 0x3c, phases: [0x10, 0x2a, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v006", band: 0x3c, phases: [0x10, 0x2e, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v007", band: 0x3c, phases: [0x0e, 0x2c, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v008", band: 0x3c, phases: [0x12, 0x2c, 0x34], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v009", band: 0x3c, phases: [0x10, 0x2c, 0x32], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
  { id: "v010", band: 0x3c, phases: [0x10, 0x2c, 0x36], gap: 0x200, margin: 0x400, direction: "backward", hooks: "shared" },
];

const directory = path.resolve("candidates/generated/chimera");
fs.mkdirSync(directory, { recursive: true });
const hex = (value, width = 2) => `0${(value & ((1 << Math.min(width * 4, 16)) - 1)).toString(16).toUpperCase().padStart(width, "0")}h`;

function quantize(band, phase) {
  return `    mov al, ah
    xor ah, ah
    mov ch, ${hex(band)}
    div ch
    mul ch
    mov ah, al
${phase ? `    add ah, ${hex(phase)}\n` : ""}    mov al, 0A2h
`;
}

function hijack(hookCell, direction) {
  return `    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, ${hex(hookCell, 4)}
${direction === "backward" ? "    std\n" : ""}    int 087h
${direction === "backward" ? "    cld\n" : ""}`;
}

function source(variant, index) {
  const isA = index === 0;
  const ownHook = variant.hooks === "split" || isA;
  const hookCell = isA ? 0x5d13 : 0xb73d;
  const activeHook = variant.hooks === "shared" ? 0x5d13 : hookCell;
  const phase = variant.phases[index];
  const zombiePhase = variant.phases[index + 2] ?? variant.phases[2];
  const pointerCell = isA ? 0x200 : 0x240;
  const step = variant.band << 8;
  const stackShift = (step - variant.margin) & 0xffff;
  const zombieBlock = ownHook ? `
zombie_entry:
    call .get_ip
.get_ip:
    pop si
    sub si, .get_ip - start
    mov ax, si
${quantize(variant.band, zombiePhase)}    add si, worker - start
` : "";
  const setHook = ownHook ? `    mov di, ax
    add di, zombie_entry - start
    mov [${hex(hookCell, 4)}], di
` : "";
  return `bits 16

; ${variant.id} ${isA ? "A" : "B"}: protected Phoenix plus deterministic Zombie-B/D tail capture.
%define FAR_SEG  0FFCh
%define PTR_CELL ${hex(pointerCell, 4)}

start:
    mov si, ax
${setHook}${hijack(activeHook, variant.direction)}    mov ax, si
${quantize(variant.band, phase)}    add si, worker - start
    jmp short phoenix_init
${zombieBlock}
phoenix_init:
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
    add sp, ${hex(variant.gap, 4)}
    mov cx, 9
    mov dx, ${hex(stackShift, 4)}
    mov bp, ${hex(step, 4)}
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
  const files = [0, 1].map((index) => {
    const file = path.join(directory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant, index), "utf8");
    return file;
  });
  manifest.push({ ...variant, files });
}
fs.writeFileSync(path.join(directory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
