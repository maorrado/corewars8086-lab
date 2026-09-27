import fs from "node:fs";
import path from "node:path";

const variants = [{
  modeA: "fixed", modeB: "fixed", maskA: 0, maskB: 0,
  band: 0x3c, phases: [0x10, 0x2c, 0x34],
}];

for (const mode of ["add", "xor"]) {
  for (const band of [0x30, 0x38, 0x3c, 0x40, 0x48]) {
    for (const mask of [0x04, 0x0c, 0x18, 0x1c]) {
      variants.push({
        modeA: mode,
        modeB: mode,
        maskA: mask,
        maskB: mask,
        band,
        phases: mode === "add" ? [0x08, 0x24, 0x34] : [0x10, 0x2c, 0x34],
      });
    }
  }
}

for (const asymmetric of [
  ["add", 0x0c, "xor", 0x18],
  ["add", 0x18, "xor", 0x0c],
  ["xor", 0x0c, "add", 0x18],
  ["xor", 0x18, "add", 0x0c],
  ["add", 0x04, "add", 0x1c],
  ["add", 0x1c, "add", 0x04],
  ["xor", 0x04, "xor", 0x1c],
  ["xor", 0x1c, "xor", 0x04],
]) {
  variants.push({
    modeA: asymmetric[0], maskA: asymmetric[1],
    modeB: asymmetric[2], maskB: asymmetric[3],
    band: 0x3c, phases: [0x08, 0x24, 0x34],
  });
}

const outputDirectory = path.resolve("candidates/generated/chimera-adaptive");
fs.mkdirSync(outputDirectory, { recursive: true });
const hex = (value, width = 4) => `0${(value & 0xffff).toString(16).toUpperCase().padStart(width, "0")}h`;

function jitter(mode, mask) {
  if (mode === "fixed") return "";
  return `    and bl, ${hex(mask, 2)}\n    ${mode} ah, bl\n`;
}

function quantize(band, phase, mode, mask) {
  const save = mode === "fixed" ? "" : "    mov bl, ah\n";
  return `${save}    mov al, ah
    xor ah, ah
    mov ch, ${hex(band, 2)}
    div ch
    mul ch
    mov ah, al
    add ah, ${hex(phase, 2)}
${jitter(mode, mask)}    mov al, 0A2h
`;
}

function source(variant, index) {
  const isA = index === 0;
  const mode = isA ? variant.modeA : variant.modeB;
  const mask = isA ? variant.maskA : variant.maskB;
  const phase = variant.phases[index];
  const id = variant.id;
  const pointerCell = isA ? 0x0200 : 0x0240;
  const step = isA ? 0x3c00 : 0x4400;
  const stackMotion = isA ? 0x3800 : 0x4000;
  const gap = isA ? 0x0200 : 0x0280;
  const firstCopy = isA ? 8 : 9;
  const setHook = isA ? `    mov di, ax
    add di, zombie_entry - start
    mov [05D13h], di
` : "";
  const zombieBlock = isA ? `
zombie_entry:
    call .get_ip
.get_ip:
    pop si
    sub si, .get_ip - start
    mov ax, si
${quantize(variant.band, variant.phases[2], mode, mask)}    add si, worker - start
` : "";
  return `bits 16

; ${id}${isA ? "A" : "B"}: load-adaptive phase dispersion (${mode}, mask ${hex(mask, 2)}).
%define FAR_SEG  0FFCh
%define PTR_CELL ${hex(pointerCell)}

start:
    mov si, ax
${setHook}    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
    mov ax, si
${quantize(variant.band, phase, mode, mask)}    add si, worker - start
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
    add sp, ${hex(gap)}
    mov cx, ${firstCopy}
    mov dx, ${hex(stackMotion)}
    mov bp, ${hex(step)}
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

const manifest = variants.map((variant, index) => {
  const id = `n${String(index + 1).padStart(3, "0")}`;
  const complete = { id, ...variant };
  const files = [0, 1].map((warriorIndex) => {
    const file = path.join(outputDirectory, `${id}_${warriorIndex === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(complete, warriorIndex), "utf8");
    return path.relative(process.cwd(), file).replaceAll("\\", "/");
  });
  return { ...complete, files };
});

fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${manifest.length} variants to ${outputDirectory}`);
