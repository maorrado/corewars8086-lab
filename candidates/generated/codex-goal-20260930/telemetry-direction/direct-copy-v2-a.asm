bits 16

; Experimental v2 anchor-free Phoenix A. Research only; not a promoted warrior.
; Copies a complete worker to each FAR_SEG band before calling it directly.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h
%define WORKER_WORDS 8

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
    add ah, 040h
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
    mov cx, WORKER_WORDS
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    jmp short pointer_ready

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, WORKER_WORDS
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
pointer_ready:
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov bp, 03C00h
    mov ax, FAR_SEG
    mov es, ax
    mov cx, WORKER_WORDS
    rep movsw
    mov sp, 007F0h
    call far [bx]

worker:
    sub [bx], bp
    mov di, [bx]
    xor si, si
    mov cx, WORKER_WORDS
    rep movsw
    mov sp, 007F0h
    call far [bx]

%if worker + WORKER_WORDS*2 - $ != 0
    %error "worker must be exactly WORKER_WORDS words"
%endif
