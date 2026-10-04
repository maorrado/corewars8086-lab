; B094 (wave 9, domain 4 R5-cost): KPf (variant: zom20a-path INT86 kept, +1 instr) of KP = A031 K (E1+SD+Z1) + B084 p0f13 B edits ported onto K_B (Z1+SD).
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
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx
    les di, [si + es_ptr - start]
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
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
    add ah, 10h
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0000h, 01000h

zombie_entry:
    xor di, di
    std
    mov bp, 3400h
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
    mov dx, 0CCCCh          ; B094 KPf: +1 instruction so the zom20a-path INT86 block stays FF 1F CC CC
    int 086h
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
