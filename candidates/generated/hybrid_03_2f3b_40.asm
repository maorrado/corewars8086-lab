bits 16
start:
    mov bp, ax
    push ds
    pop es
    mov di, bp
    add di, 34A6h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

clone:
    call get_ip
get_ip:
    pop si
    sub si, get_ip - clone
    mov di, si
    add di, 2F3Bh
    mov bx, di
    mov cx, (clone_end - clone + 1) / 2
    rep movsw
    mov di, bx
    add di, 1800h
    mov ax, 0CCCCh
    mov cx, 0040h
    rep stosw
    db 09Bh, 09Bh
    jmp bx
clone_end:
