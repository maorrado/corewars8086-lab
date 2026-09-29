bits 16

; PhoenixSeg B (candidate-7): Segment-diversified Phoenix.
; See PhoenixSegA.asm header and RATIONALE.md for the full derivation.
; Same substitution as A: FAR_SEG computed once at boot from 3 bits of this
; warrior's own loadOffset instead of being a fixed 0FFCh constant.

%define PTR_CELL 00240h
%define SEG_BASE 00FF9h

start:
    mov bp, ax          ; capture loadOffset copy before AX is clobbered
    and bp, 7            ; isolate 3 low bits -> 0..7
    add bp, SEG_BASE      ; bp = randomized-but-safe far segment, 0FF9h..01000h

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
    jmp short phoenix_init

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
    mov [bx + 2], bp
    xor si, si
    mov di, ax
    mov ax, bp
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
