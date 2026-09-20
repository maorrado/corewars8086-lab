bits 16

start:
    ; Three identical call heads absorb a small amount of targeted damage;
    ; execution begins at the middle copy.
    mov bp, ax
    push es
    pop dx
    push ds
    pop es
    mov di, bp
    add di, 31B7h
    mov ax, 01FFFh
    stosw
    stosw
    stosw
    sub di, 4
    push dx
    pop ds
    mov bx, 0280h
    mov [bx], di
    mov [bx + 2], cs
    push cs
    pop ss
    mov sp, bp
    add sp, 4C83h
    call far [bx]

