bits 16

start:
    mov bp, ax
    push ds
    pop es

    mov di, bp
    add di, 51E7h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    ; Redirect PUSH to the arena. PUSH decrements SP by two before writing;
    ; the odd net step gives a full 64 KiB traversal instead of one parity.
    push ds
    pop ss
    mov sp, bp
    add sp, 6B2Dh
push_scan:
    push ax
    add sp, 1F3Eh
    db 09Bh, 09Bh
    jmp push_scan

