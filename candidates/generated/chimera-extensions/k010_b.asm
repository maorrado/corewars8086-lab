bits 16

; k010B: common CALL FAR / NOP loop; experimental Chimera extension.
%define FAR_SEG  00FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    xor di, di
    mov ax, 01FFFh
    mov dx, 09090h
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 02Ch
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

phoenix_init:
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
    add sp, 00200h
    mov cx, 9
    mov dx, 03800h
    mov bp, 03C00h
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
