bits 16

%define HOOK_CELL 0A37Dh

start:
    mov bp, ax
    mov si, ax
    add si, stolen_entry - start
    mov [HOOK_CELL], si
    push ds
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, HOOK_CELL
    int 87h
    jmp fallback

stolen_entry:
    push ds
    pop es
    mov di, 0ECA9h
    mov ax, 0CCCCh
stolen_loop:
    stosw
    add di, 2FF9h
    jmp stolen_loop

fallback:
    push ds
    pop ss
    mov sp, bp
    add sp, 0AAABh
    push ds
    pop es
    mov di, bp
    add di, generated - start
    mov ax, 0AB50h
    push ax
    stosw
generated:

