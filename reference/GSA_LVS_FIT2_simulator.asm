bits 16

; Byte-exact simulator-ready reconstruction of the official 2025 Young binary.

    add ax, 04Ch
    mov si, ax
    mov cx, 011h
    rep movsw
    db 0EBh, 002h
    call far [bx]
    push es
    push ds
    pop es
    pop ds
    mov bx, 032h
    mov [bx], ax
    nop
    mov word [bx + 2], 010A5h
    push cs
    pop ss
    mov sp, ax
    mov bp, 0F596h
    add sp, 0A52h
    add word [bx], 01904h
    add sp, 01D04h
    nop
    nop
    cmp [bx], bp
    db 077h, 0EBh
    mov di, [bx]
    add di, 0A50h
    mov cx, 011h
    mov si, 0
    movsw
    mov cx, 011h
    sub di, 1
    call far [bx]
    nop
    call far [bx]
    rep movsw
    add word [bx], 01904h
    add sp, 01D04h
    cmp [bx], bp
    db 077h, 0F4h
    mov di, [bx]
    add di, 0A50h
    mov cx, 011h
    mov si, 0
    movsw
    sub di, 1
    call far [bx]
    nop
