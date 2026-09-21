bits 16

; Byte-exact NASM reconstruction of the official 2025 finals binary.
; The original source was not published in the downloaded finalists archive.

    mov si, ax
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov cx, 09769h
    mov bx, 026FFh
    std
    int 087h
    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 034h
    div ch
    mul ch
    mov ah, al
    mov al, 0A2h
    times 3 nop
    mov bx, 00200h
    mov cx, 9
    db 081h, 0C6h, 062h, 000h       ; add si, 0062h (forced imm16 encoding)
    push ss
    pop es
    rep movsw
    push ss
    pop ds
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], 00FFCh
    xor si, si
    mov di, ax
    mov ax, 00FFCh
    mov es, ax
    mov sp, di
    times 3 nop
    mov cx, 9
    add sp, 00300h
    mov dx, 03000h
    mov bp, 03400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

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
