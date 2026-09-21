import fs from "node:fs";
import path from "node:path";

// Focused search around l022/l056.  Keep every candidate reproducible instead
// of editing assembly by hand between runs.
const base = {
  band: 0x3c,
  phases: [0x10, 0x2c, 0x34],
  gaps: [0x0200, 0x0280],
  margins: [0x0400, 0x0400],
  steps: [0x3c00, 0x4400],
  farSegments: [0x0ffc, 0x0ffc],
  lows: [0xa2, 0xa2],
  templateWords: [9, 9],
  firstWords: [9, 9],
  repeatWords: [9, 9],
};

const changes = [
  { label: "l022-control" },
  { label: "l056-control", phases: [0x10, 0x2a, 0x34], firstWords: [8, 9] },

  ...[0x4200, 0x4300, 0x4500, 0x4600].map((step) => ({ label: `b-step-${step.toString(16)}`, steps: [0x3c00, step] })),
  ...[0x0200, 0x0220, 0x0240, 0x0260, 0x02a0, 0x02c0, 0x0300].map((gap) => ({ label: `b-gap-${gap.toString(16)}`, gaps: [0x0200, gap] })),
  ...[0x26, 0x28, 0x29, 0x2a, 0x2b, 0x2d, 0x2e, 0x30].map((phase) => ({ label: `b-phase-${phase.toString(16)}`, phases: [0x10, phase, 0x34] })),
  ...[0x0c, 0x0e, 0x12, 0x14].map((phase) => ({ label: `a-phase-${phase.toString(16)}`, phases: [phase, 0x2c, 0x34] })),
  ...[0x30, 0x32, 0x36, 0x38].map((phase) => ({ label: `z-phase-${phase.toString(16)}`, phases: [0x10, 0x2c, phase] })),
  ...[7, 8, 10, 11].map((words) => ({ label: `a-first-${words}`, firstWords: [words, 9] })),
  ...[7, 8, 10, 11].map((words) => ({ label: `b-first-${words}`, firstWords: [9, words] })),
  ...[0x0300, 0x0500, 0x0600].map((margin) => ({ label: `b-margin-${margin.toString(16)}`, margins: [0x0400, margin] })),
  ...[0x3b00, 0x3d00].map((step) => ({ label: `a-step-${step.toString(16)}`, steps: [step, 0x4400] })),

  { label: "phase-2a-a8", phases: [0x10, 0x2a, 0x34], firstWords: [8, 9] },
  { label: "phase-2b-a8", phases: [0x10, 0x2b, 0x34], firstWords: [8, 9] },
  { label: "phase-2c-a8", phases: [0x10, 0x2c, 0x34], firstWords: [8, 9] },
  { label: "phase-2d-a8", phases: [0x10, 0x2d, 0x34], firstWords: [8, 9] },
  { label: "phase-2a-a10", phases: [0x10, 0x2a, 0x34], firstWords: [10, 9] },
  { label: "phase-2b-a10", phases: [0x10, 0x2b, 0x34], firstWords: [10, 9] },
  { label: "gap-240-phase-2a", gaps: [0x0200, 0x0240], phases: [0x10, 0x2a, 0x34] },
  { label: "gap-2c0-phase-2a", gaps: [0x0200, 0x02c0], phases: [0x10, 0x2a, 0x34] },
  { label: "step-4300-gap-280", steps: [0x3c00, 0x4300] },
  { label: "step-4500-gap-280", steps: [0x3c00, 0x4500] },
  { label: "step-4300-phase-2a", steps: [0x3c00, 0x4300], phases: [0x10, 0x2a, 0x34] },
  { label: "step-4500-phase-2a", steps: [0x3c00, 0x4500], phases: [0x10, 0x2a, 0x34] },
].map((change, index) => ({ ...base, ...change, id: `m${String(index + 1).padStart(3, "0")}` }));

const outputDirectory = path.resolve("candidates/generated/chimera-focused");
fs.mkdirSync(outputDirectory, { recursive: true });

const hex = (value, width = 4) => `0${(value & 0xffff).toString(16).toUpperCase().padStart(width, "0")}h`;

function quantize(band, phase, low) {
  return `    mov al, ah
    xor ah, ah
    mov ch, ${hex(band, 2)}
    div ch
    mul ch
    mov ah, al
${phase ? `    add ah, ${hex(phase, 2)}\n` : ""}    mov al, ${hex(low, 2)}
`;
}

function hijack() {
  return `    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
`;
}

function source(variant, index) {
  const isA = index === 0;
  const pointerCell = isA ? 0x0200 : 0x0240;
  const step = variant.steps[index];
  const stackShift = (step - variant.margins[index]) & 0xffff;
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
${quantize(variant.band, variant.phases[2], variant.lows[0])}    add si, worker - start
` : "";
  return `bits 16

; ${variant.id}${isA ? "A" : "B"}: ${variant.label} focused Chimera experiment.
%define FAR_SEG  ${hex(variant.farSegments[index])}
%define PTR_CELL ${hex(pointerCell)}

start:
    mov si, ax
${setHook}${hijack()}    mov ax, si
${quantize(variant.band, variant.phases[index], variant.lows[index])}    add si, worker - start
    jmp short phoenix_init
${zombieBlock}
phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, ${variant.templateWords[index]}
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
    add sp, ${hex(variant.gaps[index])}
    mov cx, ${variant.firstWords[index]}
    mov dx, ${hex(stackShift)}
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
    mov cl, ${variant.repeatWords[index]}
    xor si, si
    stosw
    dec di
    call far [bx]
`;
}

const manifest = [];
for (const variant of changes) {
  const files = [0, 1].map((index) => {
    const file = path.join(outputDirectory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant, index), "utf8");
    return path.relative(process.cwd(), file).replaceAll("\\", "/");
  });
  manifest.push({ ...variant, files });
}
fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${manifest.length} variants to ${outputDirectory}`);
