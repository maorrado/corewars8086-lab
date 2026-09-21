import fs from "node:fs";
import path from "node:path";

const signatures = {
  bd: { ax: 0xf9eb, dx: 0xcccc, label: "Zombie B/D tail" },
  za: { ax: 0x9341, dx: 0xd6e2, label: "Zombie A terminal loop" },
  zc: { ax: 0xd889, dx: 0xf5eb, label: "Zombie C loop tail" },
  o1: { ax: 0x1fff, dx: 0xa5f3, label: "common CALL FAR / REP MOVSW loop" },
  o2: { ax: 0x1fff, dx: 0x9090, label: "common CALL FAR / NOP loop" },
  o3: { ax: 0xa5f3, dx: 0x2f29, label: "common REP MOVSW / pointer-step loop" },
  init: { ax: 0xc689, dx: 0xc681, label: "common MOV SI,AX / ADD SI startup" },
};

const base = {
  band: 0x3c,
  phases: [0x10, 0x2c, 0x34],
  gap: 0x200,
  margin: 0x400,
  step: 0x3c00,
  farSegments: [0x0ffc, 0x0ffc],
  lows: [0xa2, 0xa2],
  signatures: ["bd", "bd"],
  bombs: [false, false],
  bombOffsets: [0x1555, 0x9555],
};

const variants = [
  { id: "k001" },
  { id: "k002", signatures: ["bd", "zc"] },
  { id: "k003", signatures: ["zc", "bd"] },
  { id: "k004", signatures: ["bd", "za"] },
  { id: "k005", signatures: ["za", "bd"] },
  { id: "k006", signatures: ["zc", "za"] },
  { id: "k007", signatures: ["o1", "bd"] },
  { id: "k008", signatures: ["bd", "o1"] },
  { id: "k009", signatures: ["o2", "bd"] },
  { id: "k010", signatures: ["bd", "o2"] },
  { id: "k011", signatures: ["o3", "bd"] },
  { id: "k012", signatures: ["bd", "o3"] },
  { id: "k013", signatures: ["o1", "o2"] },
  { id: "k014", signatures: ["bd", "init"] },
  { id: "k015", bombs: [true, false] },
  { id: "k016", bombs: [false, true] },
  { id: "k017", bombs: [true, true] },
  { id: "k018", signatures: ["bd", "zc"], bombs: [true, false] },
  { id: "k019", signatures: ["bd", "zc"], bombs: [false, true] },
  { id: "k020", lows: [0xa3, 0xa2] },
  { id: "k021", lows: [0xa2, 0xa3] },
  { id: "k022", lows: [0xa3, 0xa3] },
  { id: "k023", farSegments: [0x0ff8, 0x0ff8] },
  { id: "k024", farSegments: [0x1000, 0x1000] },
  { id: "k025", farSegments: [0x0ffc, 0x0ff8] },
  { id: "k026", farSegments: [0x0ff8, 0x0ffc] },
  { id: "k027", step: 0x3400 },
  { id: "k028", step: 0x3800 },
  { id: "k029", step: 0x4000 },
  { id: "k030", step: 0x4400 },
  { id: "k031", band: 0x38, step: 0x3c00, phases: [0x10, 0x2c, 0x34] },
  { id: "k032", band: 0x40, step: 0x3c00, phases: [0x10, 0x2c, 0x34] },
  { id: "k033", gap: 0x0080 },
  { id: "k034", gap: 0x0400 },
  { id: "k035", gap: 0x0600 },
  { id: "k036", bombs: [true, false], bombOffsets: [0x2222, 0x6666] },
  { id: "k037", bombs: [false, true], bombOffsets: [0x2222, 0x6666] },
].map((variant) => ({ ...base, ...variant }));

const outputDirectory = path.resolve("candidates/generated/chimera-extensions");
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

function bombBlock(offsets) {
  return `    push cs
    pop es
    mov di, si
    add di, ${hex(offsets[0])}
    mov ax, 0CCCCh
    mov dx, ax
    int 086h
    mov di, si
    add di, ${hex(offsets[1])}
    int 086h
`;
}

function hijack(signatureKey) {
  const signature = signatures[signatureKey];
  return `    push cs
    pop es
    xor di, di
    mov ax, ${hex(signature.ax)}
    mov dx, ${hex(signature.dx)}
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
`;
}

function source(variant, index) {
  const isA = index === 0;
  const phase = variant.phases[index];
  const low = variant.lows[index];
  const pointerCell = isA ? 0x0200 : 0x0240;
  const stackShift = (variant.step - variant.margin) & 0xffff;
  const signatureKey = variant.signatures[index];
  const signature = signatures[signatureKey];
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

; ${variant.id}${isA ? "A" : "B"}: ${signature.label}; experimental Chimera extension.
%define FAR_SEG  ${hex(variant.farSegments[index])}
%define PTR_CELL ${hex(pointerCell)}

start:
    mov si, ax
${setHook}${variant.bombs[index] ? bombBlock(variant.bombOffsets) : ""}${hijack(signatureKey)}    mov ax, si
${quantize(variant.band, phase, low)}    add si, worker - start
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
    add sp, ${hex(variant.gap)}
    mov cx, 9
    mov dx, ${hex(stackShift)}
    mov bp, ${hex(variant.step)}
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
    const file = path.join(outputDirectory, `${variant.id}_${index === 0 ? "a" : "b"}.asm`);
    fs.writeFileSync(file, source(variant, index), "utf8");
    return path.relative(process.cwd(), file).replaceAll("\\", "/");
  });
  manifest.push({
    ...variant,
    signatureLabels: variant.signatures.map((key) => signatures[key].label),
    files,
  });
}
fs.writeFileSync(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`wrote ${manifest.length} variants to ${outputDirectory}`);
