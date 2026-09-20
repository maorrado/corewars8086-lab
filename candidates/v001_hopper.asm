bits 16

start:
    push ds
    pop es

    ; Spend both wide bombs in opposite regions before relocating.
    mov di, ax
    add di, 4000h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

clone:
    ; NRG is the engine's two-byte virtual opcode (two WAIT bytes).
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

