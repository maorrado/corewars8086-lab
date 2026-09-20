bits 16

start:
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov sp, bx
    add sp, 0DDAFh
    mov di, sp
    mov ax, 0AB50h
    push ax
    jmp sp
