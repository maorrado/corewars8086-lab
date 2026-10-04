// D4: build DET (adaptive lattice) from rev1 sources.
import fs from "node:fs";
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing: " + a); return s.replace(a, b); };
const hdr = `; D4 DET (day2, base rev1 KPHL): adaptive whole-team lattice. If a V6-family team is present (its B writes
; [4A17h] at instr 3; no other team in our fields writes that cell), every stream of ours (A, B, captured zombies)
; uses FAR_SEG 0FFAh = lattice 42h (10h below the V6-family 52h lattice, measured +0.28/+0.24 on leader2/3 cohorts
; in D4 W42 screen 0b3hc); otherwise FAR_SEG 0FFBh = 52h as in rev1 (W42's plain 2025/strong cost avoided).
; Detection: our B now writes [4A17h] late (instr 7), so at A's instr 5 and B's instr 5 the cell is still CCCCh
; unless a V6-family B wrote it at instr 3. A keeps the bit in BP; B patches the low byte of its own phoenix
; 'or dx,0FFBh' immediate (dec -> 0FAh) before any captured zombie can reach phoenix_init.
; Good_Test V6 is friend-provided code (see the provenance comments below); DET edits by agent2 day2 role D4.
`;
let A = fs.readFileSync("rev1/A.asm", "utf8"), B = fs.readFileSync("rev1/B.asm", "utf8");
A = hdr + A;
A = rep(A, "    mov dx, [4A17h]                 ; 5\n", "    mov bp, [4A17h]                 ; 5  D4 DET: CCCCh unless a V6-family B wrote it (instr 3)\n");
A = rep(A, "    mov [9769h], dx                 ; 6  Registered_Winners hook cell\n", "    xor bp, 0CCCCh                  ; 6  D4 DET: bp = 0 iff no V6-family team ([9769h] write moved to B)\n");
A = rep(A, "    and dx, 0\n    or dx, 0FFBh\n", "    cmp bp, 1                       ; D4 DET: CF = 1 iff no V6-family team (dx = 0 here)\n    adc dx, 0FFAh                   ; D4 DET: FAR_SEG 0FFBh (52h) or 0FFAh (42h)\n");
B = hdr + B;
B = rep(B, `    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx
    les di, [si + es_ptr - start]
`, `    mov si, ax                                      ; 1
    lea bp, [word si + zombie_entry - start]        ; 2  D4 DET: entry kept in BP (BX is the INT87 replacement)
    mov [0CC13h], bp                                ; 3
    mov [5D13h], bp                                 ; 4
    cmp word [4A17h], 0CCCCh                        ; 5  D4 DET: V6-family B wrote [4A17h] at instr 3?
    je short .lat52                                 ; 6
    dec byte [si + phx_far - start + 2]             ; 7  D4 DET: patch own phoenix 'or dx,0FFBh' -> 0FFAh (B + zombies)
.lat52:
    mov [4A17h], bp                                 ; 7/8 D4 DET: late write (after A's instr-5 read, before A's INT87 at instr 11)
    mov [9769h], bp                                 ; 8/9 D4 DET: Registered_Winners hook cell (moved from A; after V6 A's instr-6 write)
    les di, [si + es_ptr - start]
`);
B = rep(B, `    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 10h
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init
`, `    cld
    mov ax, si                      ; D4 DET: 16-bit band math (same AX = floor(si/3C00h)*3C00h + 10A2h,
    xor dx, dx                      ;   3 instructions fewer; pays for the detection so phoenix_init still
    mov cx, 03C00h                  ;   starts at instr 25 when no V6-family team is present)
    div cx
    mul cx
    add ax, 010A2h
    add si, strict word worker - start
    jmp short phoenix_init
`);
B = rep(B, "    and dx, 0\n    or dx, 0FFBh\n", "    and dx, 0\nphx_far:\n    or dx, strict word 0FFBh        ; D4 DET: low byte patched to 0FAh by B's startup when a V6-family team is present\n");
fs.writeFileSync("DET_A.asm", A); fs.writeFileSync("DET_B.asm", B);
