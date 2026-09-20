bits 16
start:
    mov bp, ax
    push ds
    pop es
    mov di, bp
    add di, 2A04h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

clone:
    db 09Bh, 09Bh
    call get_ip
get_ip:
    pop si
    sub si, get_ip - clone
    mov di, si
    add di, 0F31h
    mov bx, di
    mov cx, (clone_end - clone + 1) / 2
    rep movsw
    jmp bx
clone_end:
