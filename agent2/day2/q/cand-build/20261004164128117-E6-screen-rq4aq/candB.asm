; E6 c18E (day2 round 2, agent E6, base DET2 rev2): phoenix anchor word 1FFFh -> 18FFh (FF 18 = call far [bx+si],
; SI = 0 during dwell) for B and the captured zombies. Zombie-path FF 1F CC CC decoy blocks unchanged.
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
; B099 (wave 10, domain 9 R5-cost): KPH = B094 KP + B089 h34 (CX=0 zombie path mov bp,3400h -> 7000h, 1 byte).
; Good_Test V6 is friend-provided; V6nohunt by agent2; K by A031 (E1+SD+Z1 by A031/A022/A026); p0f13 by B064/B084; KP by B094; h34 by B089.
; B094 (wave 9, domain 4 R5-cost): KP = A031 K (E1+SD+Z1) + B084 p0f13 B edits ported onto K_B (Z1+SD).
; Good_Test V6 is friend-provided; V6nohunt by agent2; Z1 by A026, SD by A022, E1/K by A031; p0f by B064, p0f13 by B084.
; p0f13 edits: startup push cs/pop es -> mov [0CC13h],bx + les di,[si+es_ptr] (INT87 stays instr 12); both b/d searches
;   (startup and zom20a path) use window 0F EB F9 CC -> 0F FF 26 13 (patched tail = jmp [0CC13h]).
; Port note: in the zom20a path DX is now 0CCF9h after INT87, so Z1's int 86h there would write FF 1F F9 CC junk
;   over E1's A block (0FF80h..007Fh). It is replaced by mov dx,0CCCCh (same instruction count, no INT86 there);
;   E1's A block already covers 0FF80h..007Fh. The b/d (CX=0) path INT86 block is unchanged.
bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; agent2 night A026 variant Z1 (base rev0 = V6nohunt B): captured zombies spend
; their own INT 86h charge (2 per zombie, unused before) on FF 1F CC CC decoy
; blocks for the FF1FCCCC INT87 searchers.
;  - zom20a path (CX!=0): after its b/d INT87, mov ax,1FFFh; int 86h with
;    DI=0, DF=1, DX=CCCCh -> block 0FF04h..0003h (no code is ever loaded below
;    400h or above FC00h; page FFh and 00h:00-03 hold no anchor of our 400h
;    lattice at 52h).
;  - b/d path (CX=0): the worthless 0E070E17 CC counter-bomb INT87 is replaced
;    by a block next to the zombie's own body (BX = own load address + 3):
;    [X+68h, X+168h), X = (BX and FC00h). Inside the zombie's MIN_GAP zone
;    and on pages 4k / 4k+1 outside in-page 52h-67h of pages 4k, so it can
;    hit neither loaded code nor any anchor/worker of our lattice.
;  - zombie band math uses 16-bit DIV (same AX, 2 instructions fewer), so both
;    zombie paths reach phoenix_init on the same turn as in rev0.
; B's own startup is unchanged.

; A031 K = A026 Z1 (zombie INT86 blocks) + A022 SD (phoenix_init mov cx,10; dead mov dx,[4A17h] dropped; db 0CCh,0CCh after the worker). B startup unchanged.

start:
    mov si, ax                                      ; 1
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
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, si                      ; D4 DET: 16-bit band math (same AX = floor(si/3C00h)*3C00h + 10A2h,
    xor dx, dx                      ;   3 instructions fewer; pays for the detection so phoenix_init still
    mov cx, 03C00h                  ;   starts at instr 25 when no V6-family team is present)
    div cx
    mul cx
    add ax, 010A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0000h, 01000h

zombie_entry:
    xor di, di
    std
    mov bp, 7000h            ; B099: B089 h34 (CX=0 captured-b/d phase 34h -> 70h)
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    int 087h
    mov ax, 01FFFh
    mov dx, 0CCCCh          ; B094: was int 086h (DX would be 0CCF9h); keeps the instruction count
    jmp short zombie_common

zombie_fallback:
    mov di, bx
    and di, 0FC00h
    add di, 0164h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    int 086h

zombie_common:
    cld
    call get_ip

get_ip:
    pop si
    sub si, strict word get_ip - start
    mov ax, si
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx
    add ax, bp
    mov al, 0A2h
    add si, strict word worker - start

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 0280h
    push cs
    pop ss
    mov [bx], ax
    and dx, 0
phx_far:
    or dx, strict word 0FFBh        ; D4 DET: low byte patched to 0FAh by B's startup when a V6-family team is present
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00600h
    mov cx, 8
    mov dx, 02400h
    mov bp, 02C00h
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
