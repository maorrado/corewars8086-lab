bits 16
start:
    mov bp, ax
    push ds
    pop es
    mov di, bp
    add di, 1C23h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    mov di, bp
    add di, 11F1h
    mov ax, 0CCCCh
bomb_loop:
    mov cx, 0040h
    rep stosw
    add di, 11F1h
    db 09Bh, 09Bh
    jmp bomb_loop
