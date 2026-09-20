bits 16

start:
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov di, bx
    add di, 0C947h
    mov bp, di
    mov ax, 09B9Bh
    mov dx, ax
    int 86h
    mov ax, 0AB50h
    stosw
    mov sp, di
    add sp, 769Dh
    jmp bp

