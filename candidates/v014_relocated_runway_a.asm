bits 16

start:
    ; Plant the runway far from the visible original and jump into it.  The
    ; two team members use unrelated spacings so one attack pattern is less
    ; likely to remove both.
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov di, bx
    add di, 2D13h
    mov sp, di
    add sp, 399Dh
    mov ax, 0AB50h
    mov dx, ax
    int 86h
    int 86h
    sub di, 0200h
    jmp di

