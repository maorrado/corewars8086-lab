bits 16

start:
    push ds
    pop ss
    mov sp, ax
    add sp, 0AAABh
    push ds
    pop es
    mov di, ax
    add di, runway - start
    mov ax, 0AB50h
    mov dx, ax
    int 86h
    int 86h
runway:

