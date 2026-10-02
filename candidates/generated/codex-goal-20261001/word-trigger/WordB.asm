bits 16

; Word-trigger research variant of exact m050 B. Not a final replacement.
; The copied worker is 16 bytes. One extra skipped CC shifts it by one byte,
; matching the A2 -> A3 destination change without increasing image length.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
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
    add ah, 034h
    mov al, 0A3h
    add si, worker - start
    jmp short phoenix_init

    times 3 db 0CCh
phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 8
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
    mov sp, di
    add sp, 00280h
    mov cx, 7
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

worker:
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 7
    xor si, si
    stosw
    dec di
    call far [bx]
worker_end:
