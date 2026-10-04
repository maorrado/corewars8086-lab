; E6 c18E (day2 round 2, agent E6, base DET2 rev2): live anchors FF 18 = call far [bx+si] (SI = 0 during dwell)
; instead of FF 1F; the E1 decoy block becomes 64 x FF 18 CC CC at 0FF80h..007Fh (absorbs the FF18CCCC backward
; searches from 0FFFFh of EmoMutants2 / segment_fault). Worker template, B/zombie FF 1F CC CC decoys unchanged, so
; FF1FCCCC searchers (2B2Team, OpcodeHunter1, ADDvanced, PastRAMa, ATO1, JMP2HELL2) only find dead decoys.
; Idea from night A015/c18 (screen 12ks2) and the zchain4 lineage (FF 18 anchors + FF 18 decoy at 0FF90h).
; D4 DET2: DET with B's [5D13h]/[0CC13h] writes back at instr 4/5 (rev1 rounds). DET's instr-3 [0CC13h]
; write tied with the zchain/zrl03/ah02 A write (instr 3) and lost the p0f13 hook half the time (screen n6sgd).
; D4 DET (day2, base rev1 KPHL): adaptive whole-team lattice. If a V6-family team is present (its B writes
; [4A17h] at instr 3; no other team in our fields writes that cell), every stream of ours (A, B, captured zombies)
; uses FAR_SEG 0FFAh = lattice 42h (10h below the V6-family 52h lattice, measured +0.28/+0.24 on leader2/3 cohorts
; in D4 W42 screen 0b3hc); otherwise FAR_SEG 0FFBh = 52h as in rev1 (W42's plain 2025/strong cost avoided).
; Detection: our B now writes [4A17h] late (instr 7), so at A's instr 5 and B's instr 5 the cell is still CCCCh
; unless a V6-family B wrote it at instr 3. A keeps the bit in BP; B patches the low byte of its own phoenix
; 'or dx,0FFBh' immediate (dec -> 0FAh) before any captured zombie can reach phoenix_init.
; Good_Test V6 is friend-provided code (see the provenance comments below); DET edits by agent2 day2 role D4.
; COMBINE (night combination coordinator, 2026-10-04, base rev0): KPHL = KP + h34 (B099 KPH_B) + locpatA (B092 KL_A). A = KL_A unchanged; B = B099 KPH_B.
; Good_Test V6 is friend-provided code; V6nohunt and all night edits by agent2 roles (see FINDINGS.md).
bits 16

; B092 KL (warrior A): A031 K (E1 INT86 decoy block + A022 SD template edits) combined with the
; domain-2 defense A038 locpatA (B082 location start DI = 15*[1243h] + A038 window F2 81 C3 E1 -> FF 26 17 4A).
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch); E1/SD/locA2/locpatA are
; agent2 night edits (A031, A022, B082, A038); this merge = agent2 night role B092.
; Turn budget: locpatA startup (INT87 at instr 11) + E1 block (4 instr) + band math with a memory divisor
; (div/mul word [kq] instead of mov cx,3C00h; div cx; mul cx: same AX, one instruction fewer) + add si;
; phoenix_init still starts at turn 22 (as in rev0, K and locpatA). Data moved to the end (no jmp needed).
; B = A031 K_B (A026 Z1 + SD) unchanged.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov ax, [1243h]                 ; 4  zom20a's v1 = hi(L*10E1h)
    mov bp, [4A17h]                 ; 5  D4 DET: CCCCh unless a V6-family B wrote it (instr 3)
    xor bp, 0CCCCh                  ; 6  D4 DET: bp = 0 iff no V6-family team ([9769h] write moved to B)
    mul word [si + k15 - start]     ; 7  ax = 15*v1
    xchg ax, di                     ; 8
    les ax, [si + z20a_data - start]; 9  ax = 81F2h, es = 1000h (arena)
    mov dx, 0E1C3h                  ; 10
    int 087h                        ; 11 F2 81 C3 E1 -> FF 26 17 4A, forward from DI
    mov di, 0FF80h                  ; 12 E1: 64 x FF 1F CC CC at 0FF80h..007Fh
    mov ax, 018FFh                  ; 13 E6 c18E: E1 decoys FF 18 CC CC (was 1FFFh)
    mov dx, 0CCCCh                  ; 14
    int 086h                        ; 15
    mov ax, si                      ; 16 band math: floor(si/3C00h)*3C00h + 2CA2h
    xor dx, dx                      ; 17
    div word [si + kq - start]      ; 18
    mul word [si + kq - start]      ; 19
    add ax, 02CA2h                  ; 20
    add si, strict word worker - start ; 21

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 002C0h
    push cs
    pop ss
    mov [bx], ax
    cmp bp, 1                       ; D4 DET: CF = 1 iff no V6-family team (dx = 0 here)
    adc dx, 0FFAh                   ; D4 DET: FAR_SEG 0FFBh (52h) or 0FFAh (42h)
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00100h
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 018FFh                  ; E6 c18E: live anchor FF 18 = call far [bx+si] (was 1FFFh)
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
    db 0CCh, 0CCh

zombie_entry:
    mov bx, ax
    mov dx, 0CCCCh

zombie_scan:
    add bx, 00100h
    cmp word [bx], 0CCCCh
    je short zombie_scan

    mov cl, 4

candidate_check:
    mov al, [bx + 1]
    sub al, 0Fh
    cmp al, 10h
    ja short next_candidate
    mov si, [bx]
    cmp si, 0FFCh
    je short next_candidate
    cmp si, [bx + 4]
    je short found_candidate

next_candidate:
    inc bx
    loop candidate_check
    jmp short zombie_scan

found_candidate:
    mov di, [bx - 2]
    sub si, 01000h
    add si, si
    add si, si
    add si, si
    add si, si
    sub di, 2
    add di, si
    mov [di], dx
    jmp short zombie_scan

z20a_data:
    dw 081F2h, 01000h
k15:
    dw 15
kq:
    dw 03C00h
