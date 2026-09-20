bits 16

%define HOOK_CELL 06D3Bh

start:
    mov bp, ax
    mov si, ax
    add si, stolen_entry - start
    mov [HOOK_CELL], si

    ; In the 2025 live pack, both long Zombies contain repeated
    ; EB F9 CC CC tails.  Redirect the first still-unclaimed occurrence to a
    ; fixed arena cell that contains this instance's dynamic entry address.
    push ds
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, HOOK_CELL
    int 87h
    jmp fallback

stolen_entry:
    push ds
    pop es
    mov di, 1357h
    mov ax, 0CCCCh
stolen_loop:
    stosw
    add di, 1FFBh
    jmp stolen_loop

fallback:
    push ds
    pop ss
    mov sp, bp
    add sp, 3333h
    push ds
    pop es
    mov di, bp
    add di, generated - start
    mov ax, 0AB50h
    push ax
    stosw
generated:

