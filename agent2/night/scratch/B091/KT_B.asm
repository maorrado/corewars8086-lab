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
    push cs
    mov [5D13h], bx
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
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

zombie_entry:
    xor di, di
    std
    mov bp, 3400h
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
    mov ax, 01FFFh
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
