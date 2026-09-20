bits 16

start:
    ; Both write heads point into the arena. Each generated word is 50 AB:
    ; PUSH AX followed by STOSW. STOSW writes the next instruction pair just
    ; before IP reaches it, while PUSH grows a second carpet backwards.
    push ds
    pop ss
    mov sp, ax
    push ds
    pop es
    mov di, ax
    add di, generated - start
    mov ax, 0AB50h
seed:
    push ax
    stosw
generated:

