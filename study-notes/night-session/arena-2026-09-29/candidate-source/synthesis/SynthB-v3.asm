bits 16

; Synthesis B v3. Base = candidate-1 RotAnchorB, same fix as A v3: DX's
; bootstrap value stays unchanged (0x4000, B's own stack-gap value), and
; worker: explicitly reloads DX to the new delta (0x0800) after
; "sub sp,dx" consumes the original value and before "xor bp,dx" needs
; the new one. B's primary stride is bp=0x4400 (not dx's 0x4000
; stack-gap value): 0x4400 XOR 0x0800 = 0x4C00 (12% difference from
; primary, not the ~11x mismatch candidate-1's original 0x4000-delta had).
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

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
    mov cx, 12
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
    mov dx, 0800h
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 12
    xor si, si
    stosw
    dec di
    call far [bx]
