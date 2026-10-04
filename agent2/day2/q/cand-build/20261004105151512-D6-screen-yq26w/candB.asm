; D6 FAST (day2 agent D6): LATE + startup trim. A: the two LATE nops removed (INT87 r9, phoenix_init r20 instead of
; r11/r22; [1243h] still read at r4). B: band math as A's 16-bit memory divisor (div/mul word [si+kq]; same AX =
; floor(si/3C00h)*3C00h + 10A2h incl. the wrap), 4 instructions fewer -> phoenix_init r21 instead of r25; hook-cell
; rounds and B INT87 (r12) unchanged.
; D6 LATE (day2 agent D6, base rev1 KPHL): turn-neutral reorder of B's hook-cell writes. The V6 family (V6, V4,
; V6Guard, V6nohunt, Good_Test V6) writes its zombie_entry to [4A17h] at B instr 3, the same round as rev1, so the
; zom20a captured by either team's INT87 (V6 A r10, our A r11; both patch to jmp [4A17h]) and the b/d tail patched by
; V6 B (r12) went to whichever team ran later in the round (50/50). Now [4A17h] is written at instr 8 (after every V6
; write, before any capture), [5D13h] at 7 (after V6 B r5 and m050 A r4, before their INT87s r9+), [9769h] at 6
; (moved here from A; after RW r3 and V6 A r5, before RW2 INT87 r8), [0CC13h] stays at 5 (after zchain/zrl03 A r3).
; les ax,[si+es_ptr] (AX=0EB0Fh, ES=arena; DI=0 at load) replaces les di + mov ax, so INT87 stays instr 12.
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
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    les ax, [si + es_ptr - start]   ; 3  D6: AX = 0EB0Fh, ES = 1000h (DI = 0 at load)
    mov dx, 0CCF9h                  ; 4
    mov [0CC13h], bx                ; 5  (rev1 round)
    mov [9769h], bx                 ; 6  D6: was A instr 6 (Registered_Winners hook cell)
    mov [5D13h], bx                 ; 7  D6: was instr 4
    mov [4A17h], bx                 ; 8  D6: was instr 3 (V6 family writes at 3)
    mov bx, 0FF0Fh                  ; 9
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, si                      ; D6 FAST: 16-bit band math, same AX as mov al,ah/../mov al,0A2h
    xor dx, dx
    div word [si + kq - start]
    mul word [si + kq - start]
    add ax, 010A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0EB0Fh, 01000h               ; D6: was dw 0000h, 01000h (les di)
kq:
    dw 03C00h                       ; D6 FAST: band divisor

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
    or dx, 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00600h
    mov cx, 8
    mov dx, 02400h
    mov bp, 02C00h
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
    db 0CCh, 0CCh
