bits 16
; combo_ah02 / B = combo_zrl03 + first-anchor guard bytes from anchorharden_x02

%define FAR_SEG  0FF9h
%define PTR_CELL 00240h

start:
    mov si, ax
    mov word [0FFE8h], 0F9EBh
    les dx, [si + srch_data - start]
    mov ax, 0EB0Fh
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    nop
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 070h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

srch_data:
    dw 0CCF9h, 01000h

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    lea sp, [di + 0274h - 16*(0FFCh - FAR_SEG)]
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 0FF18h
    dec di
    stosw
    stosw
    mov ax, 018FFh
    sub di, 2
    call far [bx + si]

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
    call far [bx + si]

