bits 16

start:
    mov bp, ax
    push es
    pop dx
    push ds
    pop es
    mov di, bp
    add di, 0C947h
    mov ax, 01FFFh
    stosw
    stosw
    stosw
    sub di, 4
    push dx
    pop ds
    mov bx, 02C0h
    mov [bx], di
    mov [bx + 2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 09E37h
    call far [bx]

