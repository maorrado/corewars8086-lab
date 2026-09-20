bits 16

start:
    mov bp, ax
    push ds
    pop es

    ; INT 87h: replace zom20b's unique four-byte entry with
    ; PUSH stolen_entry / RET, preserving the zombie CPU as an extra bomber.
    mov si, bp
    add si, stolen_entry - start
    mov bx, si
    mov bh, bl
    mov bl, 68h
    mov cx, si
    mov cl, ch
    mov ch, 0C3h
    mov ax, 36E9h
    mov dx, 2901h
    xor di, di
    int 87h

    mov di, bp
    add di, 2D13h
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
    add di, 6A31h
    mov ax, 0CCCCh
stolen_loop:
    stosw
    add di, 0FFDh
    jmp stolen_loop

original_loop:
    mov di, bp
    add di, 1357h
    mov ax, 0CCCCh
attack:
    stosw
    add di, 17FBh
    db 09Bh, 09Bh
    jmp attack
