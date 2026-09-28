import fs from "node:fs";
import path from "node:path";

// Broad, cheap sweep targeting the night-session finding: the dominant
// death cluster is corruption of the 2-byte "call far [bx]" anchor (FF 1F,
// from STOSW with AX=0x1FFF) written at each band's start offset. This
// tests small, byte-count-neutral perturbations of the anchor construction
// and surrounding gap/margin/stack constants that were not covered by prior
// phoenix-parameters / chimera-focused / chimera-adaptive sweeps, which all
// varied phase/segment/step but kept the anchor mechanism itself fixed.
const base = {
  addSp: 0x0200,
  mainCx: 8,
  mainDx: 0x3800,
  bp: 0x3c00,
};

const variants = [
  { label: "control" },
  // Vary the private-stack gap (add sp, X) -- changes where the pushed
  // CS:IP return-address trail lands relative to the band, without
  // touching worker:'s byte length.
  ...[0x0100, 0x0180, 0x0280, 0x0300, 0x0400].map((addSp) => ({ label: `gap-${addSp.toString(16)}`, addSp })),
  // Vary mainCx/mainDx together (first-copy stack relocation amount) --
  // cheap, byte-count neutral (both are already 2-byte immediates).
  ...[0x3400, 0x3600, 0x3a00, 0x3e00, 0x4000].map((dx) => ({ label: `dx-${dx.toString(16)}`, mainDx: dx })),
];

const outputDirectory = path.resolve("candidates/generated/chimera-anchor-sweep");
fs.mkdirSync(outputDirectory, { recursive: true });
const hex = (value) => `0${(value & 0xffff).toString(16).toUpperCase().padStart(4, "0")}h`;

function buildA(v) {
  const addSp = v.addSp ?? base.addSp;
  const mainCx = v.mainCx ?? base.mainCx;
  const mainDx = v.mainDx ?? base.mainDx;
  const bp = v.bp ?? base.bp;
  return `bits 16

; Chimera A anchor-sweep variant "${v.label}".
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h

start:
    mov si, ax
    mov di, ax
    add di, zombie_entry - start
    mov [05D13h], di
    push cs
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
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

zombie_entry:
    xor di, di
    mov ax, 0A5F3h
    mov dx, 01F06h
    mov bl, 0CCh
    std
    int 087h
    cld
    call .get_ip
.get_ip:
    pop si
    sub si, .get_ip - start
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 054h
    mov al, 0A2h
    add si, worker - start

captured_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    push cs
    pop ss
    jmp short phoenix_pointer_ready

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
phoenix_pointer_ready:
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, ${hex(addSp)}
    mov cx, ${mainCx}
    mov dx, ${hex(mainDx)}
    mov bp, ${hex(bp)}
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

const summary = [];
for (const variant of variants) {
  const srcPath = path.join(outputDirectory, `${variant.label}.asm`);
  fs.writeFileSync(srcPath, buildA(variant));
  summary.push({ label: variant.label, ...variant, srcPath });
}
fs.writeFileSync(path.join(outputDirectory, "manifest-sources.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`wrote ${summary.length} source variants to ${outputDirectory}`);
