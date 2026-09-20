bits 16

%define FAR_SEG  0FFCh
%define PTR_CELL 0200h
%define HOOK_CELL 06D3Bh

start:
    mov si, ax
    mov di, ax
    add di, stolen_entry - start
    mov [HOOK_CELL], di
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, HOOK_CELL
    int 87h

    mov ax, si
    mov al, 0A2h
    add ah, 25h
    add si, worker - start
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    push cs
    pop ss
    mov bx, PTR_CELL
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, 0300h
    mov cx, 9
    mov dx, 02800h
    mov bp, 02C00h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]
worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
stolen_entry:
    push ds
    pop ss
    mov sp, 0A37Dh
    push ds
    pop es
    mov di, 05B17h
    mov bx, di
    mov ax, 0AB50h
    push ax
    stosw
    jmp bx

