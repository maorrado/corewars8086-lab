const fs=require("fs");
let a=fs.readFileSync("A_rev1.asm","utf8");
const hdrA="; D6 LATE (day2 agent D6, base rev1 KPHL): A no longer copies [4A17h] -> [9769h] (B now writes [9769h] itself at\n; its instr 6, the same round as rev1 A did); the two freed A turns are nops so every other A instruction keeps its\n; rev1 round (mov ax,[1243h] r4, INT87 r11, phoenix_init r22). Good_Test V6 is friend-provided code (see below).\n";
const oldA="    mov dx, [4A17h]                 ; 5\n    mov [9769h], dx                 ; 6  Registered_Winners hook cell\n";
if(!a.includes(oldA)) throw "A pattern";
a=hdrA+a.replace(oldA,"    nop                             ; 5  D6 LATE: [9769h] now written by B (instr 6)\n    nop                             ; 6\n");
fs.writeFileSync("A_late.asm",a);
let b=fs.readFileSync("B_rev1.asm","utf8");
const hdrB=`; D6 LATE (day2 agent D6, base rev1 KPHL): turn-neutral reorder of B's hook-cell writes. The V6 family (V6, V4,
; V6Guard, V6nohunt, Good_Test V6) writes its zombie_entry to [4A17h] at B instr 3, the same round as rev1, so the
; zom20a captured by either team's INT87 (V6 A r10, our A r11; both patch to jmp [4A17h]) and the b/d tail patched by
; V6 B (r12) went to whichever team ran later in the round (50/50). Now [4A17h] is written at instr 8 (after every V6
; write, before any capture), [5D13h] at 7 (after V6 B r5 and m050 A r4, before their INT87s r9+), [9769h] at 6
; (moved here from A; after RW r3 and V6 A r5, before RW2 INT87 r8), [0CC13h] stays at 5 (after zchain/zrl03 A r3).
; les ax,[si+es_ptr] (AX=0EB0Fh, ES=arena; DI=0 at load) replaces les di + mov ax, so INT87 stays instr 12.
`;
const oldB=`    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx
    les di, [si + es_ptr - start]
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh`;
if(!b.includes(oldB)) throw "B pattern";
b=hdrB+b.replace(oldB,`    lea bx, [word si + zombie_entry - start]
    les ax, [si + es_ptr - start]   ; 3  D6: AX = 0EB0Fh, ES = 1000h (DI = 0 at load)
    mov dx, 0CCF9h                  ; 4
    mov [0CC13h], bx                ; 5  (rev1 round)
    mov [9769h], bx                 ; 6  D6: was A instr 6 (Registered_Winners hook cell)
    mov [5D13h], bx                 ; 7  D6: was instr 4
    mov [4A17h], bx                 ; 8  D6: was instr 3 (V6 family writes at 3)
    mov bx, 0FF0Fh                  ; 9`);
const oldD="es_ptr:\n    dw 0000h, 01000h";
if(!b.includes(oldD)) throw "D pattern";
b=b.replace(oldD,"es_ptr:\n    dw 0EB0Fh, 01000h               ; D6: was dw 0000h, 01000h (les di)");
fs.writeFileSync("B_late.asm",b);
