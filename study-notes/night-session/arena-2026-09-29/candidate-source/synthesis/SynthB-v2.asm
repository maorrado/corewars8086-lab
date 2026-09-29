bits 16

; Synthesis B v2 (arena Phase E, graft attempt 2). Base = candidate-1
; RotAnchorB. Graft = candidate-8's inert filler spray, verbatim, same
; position and register-safety reasoning as A v2.
%define FAR_SEG   0FFCh
%define PTR_CELL  00240h
%define FILLSTRIDE 0300h
%define FILLBASE   0900h

start:
    mov si, ax
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld

    ; --- graft: candidate-8's inert filler spray (verbatim) ---
    mov di, si
    add di, FILLBASE
    mov ax, 01FFFh
    mov cl, 4
.fill:
    stosw
    add di, FILLSTRIDE
    dec cl
    jnz .fill
    ; --- end graft ---

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

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
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
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

worker:
    movsw
    rep movsw
    sub sp, dx
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
