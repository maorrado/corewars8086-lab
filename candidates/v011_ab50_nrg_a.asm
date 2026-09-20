bits 16

start:
    times 32 db 09Bh, 09Bh
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov sp, bx
    add sp, 4003h
    mov di, sp
    mov ax, 0AB50h
    push ax
    jmp sp

