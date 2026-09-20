bits 16

start:
    mov bp, ax
    push ds
    pop es

    ; Two seed-relative 256-byte strikes before entering the tight scanner.
    mov di, bp
    add di, 2D13h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    mov di, bp
    add di, 1357h
scan:
    stosw
    add di, 0FFDh
    db 09Bh, 09Bh
    jmp scan

