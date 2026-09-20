bits 16

start:
    push ds
    pop ss
    mov sp, ax
    add sp, 5555h
    push ds
    pop es
    mov di, ax
    add di, generated - start
    mov ax, 0AB50h
seed:
    push ax
    stosw
generated:

