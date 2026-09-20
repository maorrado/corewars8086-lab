bits 16
%define FAR_SEG 0FFCh
%define PTR_CELL 00200h
start:
    mov si, ax
    mov al, ah
    xor ah, ah
    mov ch, 055h
    div ch
    mul ch
    mov ah, al
    mov al, 0A2h
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
    mov dx, 05100h
    mov bp, 05500h
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
