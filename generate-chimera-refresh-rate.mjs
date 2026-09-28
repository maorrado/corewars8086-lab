import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Tests the coverage-vs-refresh-rate tradeoff for Chimera A's band step (BP).
// Motivated by night-session telemetry finding: 93% of Chimera deaths occur
// inside the Phoenix segment, and the dominant CPU-exception cluster (~60%)
// is corruption of the 2-byte "call far [bx]" anchor at each band's start.
// A smaller step revisits (refreshes) each band's anchor more often; a
// larger step spreads thinner but covers more distinct arena territory.
// Existing prior sweeps only tried +/-0x0100..0x0400 deltas around 0x3C00;
// this tests much larger multiples to see if refresh-rate dominates coverage.
const variants = [
  { label: "step-control-3c00", bp: 0x3c00 },
  { label: "step-half-1e00", bp: 0x1e00 },
  { label: "step-double-7800", bp: 0x7800 },
  { label: "step-1000", bp: 0x1000 },
  { label: "step-2000", bp: 0x2000 },
  { label: "step-6000", bp: 0x6000 },
];

const outputDirectory = path.resolve("candidates/generated/chimera-refresh-rate");
fs.mkdirSync(outputDirectory, { recursive: true });
const hex = (value) => `0${(value & 0xffff).toString(16).toUpperCase().padStart(4, "0")}h`;

function buildA(bp) {
  return `bits 16

; Chimera A refresh-rate variant: only BP (band step) changed from m049.
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
    add sp, 00200h
    mov cx, 8
    mov dx, 03800h
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
  fs.writeFileSync(srcPath, buildA(variant.bp));
  summary.push({ label: variant.label, bp: variant.bp, srcPath });
}
fs.writeFileSync(path.join(outputDirectory, "manifest-sources.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(`wrote ${summary.length} source variants to ${outputDirectory}`);
