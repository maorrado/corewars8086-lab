bits 16

; Byte-exact NASM reconstruction of the official 2025 finals binary.
; The original source was not published in the downloaded finalists archive.

    mov si, ax
    add ax, 086h
    mov [09769h], ax
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
    nop
    mov ah, al
    add ah, 018h
    mov al, 0A2h
    mov cx, 9
    db 081h, 0C6h, 075h, 000h       ; add si, 0075h (forced imm16 encoding)
    push ss
    pop es
    rep movsw
    push ss
    pop ds
    push cs
    pop ss
    mov bx, 00200h
    mov [bx], ax
    mov word [bx + 2], 00FFCh
    xor si, si
    mov di, ax
    times 3 nop
    mov ax, 00FFCh
    mov es, ax
    mov sp, di
    add sp, 00300h
    mov cx, 9
    mov ax, 01FFFh
    stosw
    dec di
    mov dx, 03000h
    mov bp, 03400h
    call far [bx]

    times 12 nop

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

    db 0E8h, 000h, 000h             ; call next instruction
    pop ax
    mov si, ax
    mov al, ah
    xor ah, ah
    mov ch, 034h
    div ch
    mul ch
    mov ah, al
    add ah, 028h
    nop
    mov al, 0A2h
    db 083h, 0EEh, 014h             ; sub si, 14h (forced imm8 encoding)
    xor di, di
    push ss
    pop es
    mov cx, 9
    rep movsw
    push ss
    pop ds
    push cs
    pop ss
    mov bx, 00200h
    mov [bx], ax
    mov word [bx + 2], 00FFCh
    xor si, si
    mov di, ax
    mov ax, 00FFCh
    mov es, ax
    times 2 nop
    mov sp, di
    add sp, 00300h
    mov cx, 9
    mov ax, 01FFFh
    stosw
    dec di
    mov dx, 03000h
    mov bp, 03400h
    call far [bx]
