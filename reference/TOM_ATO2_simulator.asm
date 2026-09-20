bits 16

; Byte-exact simulator-ready reconstruction of the published TOM_ATO2 binary.

    push ax
    push es
    push ds
    pop es
    mov ax, 0D889h
    mov dx, 0E3FFh
    int 087h
    pop es
    pop ax
    push sp
    push ax
    mov word [0E6E0h], 0
    push ds
    push di
    push si
    push es
    pop ds
    mov di, 0120h
    mov ax, 0F6h
    stosw
    mov ax, 01005h
    stosw
    pop si
    pop di
    pop ds
    pop ax
    pop sp
    add ax, 0A3h
    stosw
    sub ax, 02Ah
    mov [0CCDCh], bx
    mov [0BCDCh], bx
    push ss
    pop es
    xchg si, ax
    mov cx, 015h
    xor di, di
    rep movsw
    mov cl, 00Ah
    mov bp, 0FCh
    push es
    pop ds
    push cs
    pop ss
    mov dx, 05100h
    mov sp, 053CBh
    mov bx, 050h
    mov word [bx], 0A5C8h
    mov word [bx + 2], 0AF0h
    push cs
    pop es
    mov di, 054C8h
    mov si, 040h
    mov word [si], 0EC29h
    movsw
    mov word [si], 018FFh
    movsw
    sub di, 003h
    xor si, si
    call far [bx + si]
    nop
    rep movsw
    cmp word [bx], 0A503h
    db 07Fh, 004h
    add word [bx], 0100h
    sub word [bx], 007h
    mov cl, 00Ah
    rep movsw
    mov si, 040h
    mov di, [bx]
    sub sp, 0103h
    sub di, dx
    movsw
    movsw
    sub di, 003h
    mov cl, 00Ah
    xor si, si
    call far [bx + si]
