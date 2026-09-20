bits 16

%macro body 0
    mov bp, ax
    push ds
    pop es
    mov di, bp
    add di, 2D13h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    push ds
    pop ss
    mov sp, bp
    push ds
    pop es
    mov di, bp
    add di, active_generated - program_start
    mov ax, 0AB50h
    push ax
    stosw
%endmacro

program_start:
    jmp active
front_decoy:
    body
active:
    body
active_generated:
back_decoy:
    body

