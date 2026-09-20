bits 16

start:
    ; A relocated NRG runway trades early attack speed for a large energy
    ; reserve, then enters an AB50 seed at the runway tail.
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov di, bx
    add di, 31B7h
    mov bp, di
    mov ax, 09B9Bh
    mov dx, ax
    int 86h
    mov ax, 0AB50h
    stosw
    mov sp, di
    add sp, 5A5Bh
    jmp bp

