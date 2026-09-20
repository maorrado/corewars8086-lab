bits 16

start:
    mov bp, ax
    push ds
    pop es

    ; Same mechanism for zom20d; its fourth entry byte distinguishes it.
    mov si, bp
    add si, stolen_entry - start
    mov bx, si
    mov bh, bl
    mov bl, 68h
    mov cx, si
    mov cl, ch
    mov ch, 0C3h
    mov ax, 36E9h
    mov dx, 4701h
    xor di, di
    int 87h

    mov di, bp
    add di, 51E7h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h
    jmp original_loop

stolen_entry:
    push ds
    pop es
    mov bp, ax
    mov di, ax
    add di, 35CFh
    mov ax, 0CCCCh
stolen_loop:
    stosw
    add di, 1FFBh
    jmp stolen_loop

original_loop:
    mov di, bp
    add di, 6B2Dh
    mov ax, 0CCCCh
attack:
    stosw
    add di, 2FF9h
    db 09Bh, 09Bh
    jmp attack
