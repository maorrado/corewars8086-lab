bits 16

start:
    push ds
    pop ss
    mov sp, ax
    add sp, 01111h
    push ds
    pop es
    mov di, ax
    add di, generated - start
    mov ax, 0AB50h
    push ax
    stosw
generated:
