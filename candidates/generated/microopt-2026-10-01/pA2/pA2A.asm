bits 16

; microopt-2026-10-01 timing scan pA2 / A: A main loop 2 rounds later
; Base: c090. Only the start time of one warrior's main loop changes.

%define FAR_SEG  0FFCh
%define PTR_CELL 00200h

start:
    mov si, ax
    mov bx, ax
    add bx, zombie_entry - start
    mov [05D13h], bx
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
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh

zombie_entry:
    xor di, di
    mov ax, 0A5F3h
    mov dx, 01F06h
    mov bl, 0CCh
    std
    int 087h
    cld
    call .get_ip

.get_ip:
    pop si
    sub si, .get_ip - start
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 054h
    mov al, 0A2h
    add si, worker - start

captured_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    push cs
    pop ss
    jmp short phoenix_pointer_ready

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
    nop
    nop

phoenix_pointer_ready:
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    lea sp, [di + 00200h]
    mov cx, 8
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
