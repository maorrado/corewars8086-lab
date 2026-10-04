; Based on Good_Test V6 (friend-provided code); agent2 edits rev1 (KPHL) + day2 DET2 adaptive lattice
bits 16
start:
    mov si, ax
    lea bp, [word si + zombie_entry - start]
    les di, [si + es_ptr - start]
    mov [5D13h], bp
    mov [0CC13h], bp
    cmp word [4A17h], 0CCCCh
    je short .lat52
    dec byte [si + phx_far - start + 2]
.lat52:
    mov [4A17h], bp
    mov [9769h], bp
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, si
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx
    add ax, 010A2h
    add si, strict word worker - start
    jmp short phoenix_init
es_ptr:
    dw 0000h, 01000h
zombie_entry:
    xor di, di
    std
    mov bp, 7000h
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    int 087h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    jmp short zombie_common
zombie_fallback:
    mov di, bx
    and di, 0FC00h
    add di, 0164h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    int 086h
zombie_common:
    cld
    call get_ip
get_ip:
    pop si
    sub si, strict word get_ip - start
    mov ax, si
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx
    add ax, bp
    mov al, 0A2h
    add si, strict word worker - start
phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 0280h
    push cs
    pop ss
    mov [bx], ax
    and dx, 0
phx_far:
    or dx, strict word 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00600h
    mov cx, 8
    mov dx, 02400h
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
    db 0CCh, 0CCh
