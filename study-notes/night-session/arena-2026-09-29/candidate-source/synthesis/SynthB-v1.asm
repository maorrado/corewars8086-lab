bits 16

; Synthesis B v1 (arena Phase E). Base = candidate-1 RotAnchorB. Graft:
; extends candidate-5's deferred heavy-bomb detour to B as well (B was
; left untouched in candidate-5's own submission by explicit scoping
; choice, not because it was known unsafe -- its own rationale names
; "using both A's and B's idle INT86h charges" as a deferred, reasonable
; next step). Verified B has the identical idle-charge opportunity (no
; INT86h call anywhere in the real champion's ChimeraB, confirmed by
; direct binary scan) and the identical register-liveness picture at the
; graft point (AX/SI live, BX/CX/DX/DI dead) as A, so the same
; push-ax/push-si safety bracket applies directly. B's own target offset
; (0x0700, distinct from A's 0x0600) is chosen so the two warriors' blind
; bombs aim at different band-relative offsets rather than overlapping --
; a deliberate, conservative choice, not swept/tuned.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
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
    add ah, 034h
    mov al, 0A2h
    add si, worker - start

    ; --- graft: deferred heavy-bomb detour, B variant ---
    push ax
    push si
    mov di, si
    add di, 0700h
    mov ax, 01FFFh
    mov dx, 01FFFh
    db 09Bh, 09Bh
    int 086h
    pop si
    pop ax
    ; --- end graft ---

    jmp short phoenix_init

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, 00280h
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

worker:
    movsw
    rep movsw
    sub sp, dx
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
