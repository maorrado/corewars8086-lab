bits 16

start:
    push ds
    pop es

    ; Two broad, seed-relative strikes.
    mov di, ax
    add di, 2D13h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    ; Turn both ES and SS into arena pointers. STOSW grows upward while
    ; PUSH grows downward, laying the AB 50 instruction pair both ways.
    push ds
    pop ss
    mov di, ax
    add di, 0100h
    mov sp, ax
    sub sp, 0100h
    mov ax, 50ABh

spread:
    db 09Bh, 09Bh
    stosw
    push ax
    jmp spread

