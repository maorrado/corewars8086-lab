bits 16

; Phoenix A: copy a compact worker into the private stack, then use a
; controlled far-call cascade to turn an arena site into MOVSB/MOVSW code.
; A and B use separated target bands and pointer cells so both contribute.
%define FAR_SEG  0FF8h
%define PTR_CELL 00200h

start:
    mov si, ax
    mov al, 0A2h
    add ah, 04Dh
    add si, worker - start

    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw

    push ss
    pop ds
    push cs
    pop ss

    mov bx, PTR_CELL
    mov [bx], ax
    mov word [bx + 2], FAR_SEG

    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, 00500h
    mov cx, 9
    mov dx, 03600h
    mov bp, 03C00h
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
