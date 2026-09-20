bits 16

start:
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov di, bx
    add di, 0B6E9h
    mov sp, di
    add sp, 6553h
    mov ax, 0AB50h
    mov dx, ax
    int 86h
    int 86h
    sub di, 0200h
    jmp di

