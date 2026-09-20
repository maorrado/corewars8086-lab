bits 16

start:
    mov bp, ax
    push es
    pop dx
    push ds
    pop es
    mov di, bp
    add di, 0B6E9h
    mov ax, 01FFFh
    stosw
    sub di, 2
    push dx
    pop ds
    mov bx, 0240h
    mov [bx], di
    mov [bx + 2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 0D5F7h
    call far [bx]

