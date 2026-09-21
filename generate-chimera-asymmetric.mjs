import fs from "node:fs";
import path from "node:path";

const base = {
  band: 0x3c,
  phases: [0x10, 0x2c, 0x34],
  gaps: [0x0200, 0x0200],
  margins: [0x0400, 0x0400],
  steps: [0x3c00, 0x3c00],
  farSegments: [0x0ffc, 0x0ffc],
  lows: [0xa2, 0xa2],
  templateWords: [9, 9],
  firstWords: [9, 9],
  repeatWords: [9, 9],
};

const variants = [
  { id: "l001" },
  { id: "l002", steps: [0x3c00, 0x4000] },
  { id: "l003", steps: [0x3c00, 0x4200] },
  { id: "l004", steps: [0x3c00, 0x4400] },
  { id: "l005", steps: [0x3c00, 0x4600] },
  { id: "l006", steps: [0x3c00, 0x4800] },
  { id: "l007", steps: [0x4000, 0x3c00] },
  { id: "l008", steps: [0x4200, 0x3c00] },
  { id: "l009", steps: [0x4400, 0x3c00] },
  { id: "l010", steps: [0x4600, 0x3c00] },
  { id: "l011", steps: [0x4800, 0x3c00] },
  { id: "l012", steps: [0x3a00, 0x3c00] },
  { id: "l013", steps: [0x3b00, 0x3c00] },
  { id: "l014", steps: [0x3d00, 0x3c00] },
  { id: "l015", steps: [0x3e00, 0x3c00] },
  { id: "l016", steps: [0x3c00, 0x3a00] },
  { id: "l017", steps: [0x3c00, 0x3b00] },
  { id: "l018", steps: [0x3c00, 0x3d00] },
  { id: "l019", steps: [0x3c00, 0x3e00] },
  { id: "l020", steps: [0x3c00, 0x4400], gaps: [0x0200, 0x0100] },
  { id: "l021", steps: [0x3c00, 0x4400], gaps: [0x0200, 0x0180] },
  { id: "l022", steps: [0x3c00, 0x4400], gaps: [0x0200, 0x0280] },
  { id: "l023", steps: [0x3c00, 0x4400], margins: [0x0400, 0x0200] },
  { id: "l024", steps: [0x3c00, 0x4400], margins: [0x0400, 0x0600] },
  { id: "l025", steps: [0x3c00, 0x4400], lows: [0xa2, 0xa3] },
  { id: "l026", steps: [0x3c00, 0x4400], farSegments: [0x0ffc, 0x0ff8] },
  { id: "l027", steps: [0x3c00, 0x4400], farSegments: [0x0ff8, 0x0ff8] },
  { id: "l028", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34] },
  { id: "l029", steps: [0x3c00, 0x4400], phases: [0x10, 0x2e, 0x34] },
  { id: "l030", steps: [0x3c00, 0x4400], phases: [0x10, 0x2c, 0x32] },
  { id: "l031", steps: [0x3c00, 0x4400], phases: [0x10, 0x2c, 0x36] },
  { id: "l032", firstWords: [8, 9], repeatWords: [8, 9] },
  { id: "l033", firstWords: [9, 8], repeatWords: [9, 8] },
  { id: "l034", firstWords: [8, 8], repeatWords: [8, 8] },
  { id: "l035", firstWords: [10, 9], repeatWords: [10, 9] },
  { id: "l036", firstWords: [9, 10], repeatWords: [9, 10] },
  { id: "l037", firstWords: [10, 10], repeatWords: [10, 10] },
  { id: "l038", firstWords: [11, 9], repeatWords: [11, 9] },
  { id: "l039", firstWords: [9, 11], repeatWords: [9, 11] },
  { id: "l040", firstWords: [11, 11], repeatWords: [11, 11] },
  { id: "l041", firstWords: [8, 9] },
  { id: "l042", firstWords: [9, 8] },
  { id: "l043", firstWords: [8, 8] },
  { id: "l044", firstWords: [10, 9] },
  { id: "l045", firstWords: [9, 10] },
  { id: "l046", firstWords: [10, 10] },
  { id: "l047", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], firstWords: [8, 9] },
  { id: "l048", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], firstWords: [9, 8] },
  { id: "l049", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], firstWords: [8, 8] },
  { id: "l050", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], firstWords: [8, 9], repeatWords: [8, 9] },
  { id: "l051", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], firstWords: [8, 8], repeatWords: [8, 8] },
  { id: "l052", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], gaps: [0x0200, 0x0280] },
  { id: "l053", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], gaps: [0x0200, 0x0180] },
  { id: "l054", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], farSegments: [0x0ff8, 0x0ff8] },
  { id: "l055", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], gaps: [0x0200, 0x0280], farSegments: [0x0ff8, 0x0ff8] },
  { id: "l056", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], gaps: [0x0200, 0x0280], firstWords: [8, 9] },
  { id: "l057", steps: [0x3c00, 0x4400], phases: [0x10, 0x2a, 0x34], farSegments: [0x0ff8, 0x0ff8], firstWords: [8, 9] },
].map((variant) => ({ ...base, ...variant }));

const outputDirectory = path.resolve("candidates/generated/chimera-asymmetric");
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

; ${variant.id}${isA ? "A" : "B"}: asymmetric Chimera motion experiment.
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
for (const variant of variants) {
  const files = [0, 1].map((index) => {
    const file = path.join(outputDirectory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant, index), "utf8");
    return path.relative(process.cwd(), file).replaceAll("\\", "/");
  });
  manifest.push({ ...variant, files });
}
fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${manifest.length} variants to ${outputDirectory}`);
