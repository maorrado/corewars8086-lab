bits 16

%macro guarded_body 0
    mov bp, ax
    push ds
    pop es

    ; Generic smart bomb against the common arena-setup sequence
    ; PUSH DS / POP ES / MOV BX,AX. Search forward and replace it by INT3s.
    xor di, di
    mov ax, 071Eh
    mov dx, 0C389h
    mov bx, 0CCCCh
    mov cx, 0CCCCh
    cld
    int 87h

    mov di, bp
    add di, 2D13h
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

    mov di, bp
    add di, 1357h
%%scan:
    stosw
    add di, 0FFDh
    jmp %%scan
%endmacro

    ; INT 87h changes only the first matching four bytes. Identical decoys on
    ; both sides absorb forward and backward signature attacks.
    jmp active
front_decoy:
    guarded_body
active:
    guarded_body
back_decoy:
    guarded_body

