bits 16

; Byte-exact simulator-ready reconstruction of the official 2025 Young binary.

    nop
    push es
    push ax
    push cs
    pop es
    mov ax, 0789h
    mov dx, 04F8Ch
    mov cx, 0CCCCh
    mov bx, cx
    mov di, 0
    int 087h
    pop ax
    pop es
    mov dx, 0
    mov cx, 0
    mov bx, 0
    push es
    push ds
    pop es
    pop ds
    mov bx, 036h
    mov [bx], ax
    nop
    mov word [bx + 2], 010A5h
    push cs
    pop ss
    nop
    mov sp, ax
    mov bp, 0F596h
    add sp, 0A52h
    add word [bx], 01904h
    add sp, 01D04h
    cmp [bx], bp
    db 077h, 0EDh
    mov di, [bx]
    add di, 0A50h
    mov cx, 01Eh
    mov si, 0
    movsw
    mov cx, 011h
    sub di, 1
    call far [bx]
