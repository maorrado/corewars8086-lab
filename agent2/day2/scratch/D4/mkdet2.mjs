// D4: DET2 = DET with B's hook-cell order restored for [5D13h] (instr 4) and [0CC13h] (instr 5) as in rev1.
// DET wrote [0CC13h] at instr 3, the same round as the zchain/zrl03/ah02 A write (instr 3), so it lost the
// p0f13 [0CC13h] hook in about half of those battles (screen n6sgd: zchain/zrl03/ah02 cohorts about -0.08).
import fs from "node:fs";
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error("missing: " + a); return s.replace(a, b); };
let A = fs.readFileSync("DET_A.asm", "utf8"), B = fs.readFileSync("DET_B.asm", "utf8");
const note = `; D4 DET2: DET with B's [5D13h]/[0CC13h] writes back at instr 4/5 (rev1 rounds). DET's instr-3 [0CC13h]
; write tied with the zchain/zrl03/ah02 A write (instr 3) and lost the p0f13 hook half the time (screen n6sgd).
`;
A = note + A; B = note + B;
B = rep(B, `    mov si, ax                                      ; 1
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
`, `    mov si, ax                                      ; 1
    lea bp, [word si + zombie_entry - start]        ; 2  D4 DET: entry kept in BP (BX is the INT87 replacement)
    les di, [si + es_ptr - start]                   ; 3  (moved up; ES:DI for the INT87 below)
    mov [5D13h], bp                                 ; 4  as rev1
    mov [0CC13h], bp                                ; 5  as rev1 (after the zchain/zrl03/ah02 instr-3 write)
    cmp word [4A17h], 0CCCCh                        ; 6  D4 DET: V6-family B wrote [4A17h] at instr 3?
    je short .lat52                                 ; 7
    dec byte [si + phx_far - start + 2]             ; 8  D4 DET: patch own phoenix 'or dx,0FFBh' -> 0FFAh (B + zombies)
.lat52:
    mov [4A17h], bp                                 ; 8/9 D4 DET: late write (after A's instr-5 read, before A's INT87 at instr 11)
    mov [9769h], bp                                 ; 9/10 D4 DET: Registered_Winners hook cell (moved from A; after V6 A's [9769h] write)
`);
fs.writeFileSync("DET2_A.asm", A); fs.writeFileSync("DET2_B.asm", B);
