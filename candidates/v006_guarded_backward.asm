bits 16

%macro guarded_body 0
    mov bp, ax
    push ds
    pop es

    ; Search the same generic signature in the opposite direction so the two
    ; team members normally hit different victims.
    xor di, di
    mov ax, 071Eh
    mov dx, 0C389h
    mov bx, 0CCCCh
    mov cx, 0CCCCh
    std
    int 87h
    cld

    mov di, bp
    add di, 51E7h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    mov di, bp
    add di, 6B2Dh
%%scan:
    stosw
    add di, 1FF9h
    jmp %%scan
%endmacro

    jmp active
front_decoy:
    guarded_body
active:
    guarded_body
back_decoy:
    guarded_body

