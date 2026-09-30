bits 16

; c039-int86-bomb v4: B is m050's B, unmodified. Adding the analogous
; INT86h detour to B was tested (build_v2 iteration, this same candidate
; directory) and measured as a regression vs A-only on an 8-cohort subset
; (0.6393 with detour on both A+B vs 0.6498 with detour on A only, vs
; 0.6483 baseline m049 on the identical subset) -- B's shorter/cheaper
; bootstrap appears to pay proportionally more for the same fixed
; per-detour instruction-count cost than A's does, so B is left as
; m050's proven, unmodified, already-slightly-better-than-m049 B.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
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
    jmp short phoenix_init

    times 2 db 0CCh

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
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
