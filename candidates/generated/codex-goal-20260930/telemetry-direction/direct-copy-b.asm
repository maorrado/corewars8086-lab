bits 16

; Experimental anchor-free Phoenix B. Research only; not a promoted warrior.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h
%define WORKER_WORDS 8

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
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh
phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, WORKER_WORDS
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov bp, 04400h
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
