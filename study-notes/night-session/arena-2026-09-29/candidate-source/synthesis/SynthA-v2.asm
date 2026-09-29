bits 16

; Synthesis A v2 (arena Phase E, graft attempt 2 -- built fresh on the
; clean candidate-1 base, NOT stacked on v1's bomb graft, to isolate this
; graft's own effect after v1's screen result was a net negative -0.0135
; vs candidate-1 alone). Base = candidate-1 RotAnchor. Graft = candidate-8's
; inert FF1Fh filler spray, ported verbatim, inserted at ITS original
; position (before band-quantization math begins, right after cld) --
; independently re-verified this is a genuinely different, earlier
; insertion point than v1's bomb graft (which ran after band-quant), and
; that it does not touch SI (pristine loadOffset, needed downstream) or
; interact with candidate-1's own worker: change (runs much later,
; independent code path).
%define FAR_SEG   0FFCh
%define PTR_CELL  00200h
%define FILLSTRIDE 0300h
%define FILLBASE   0900h

start:
    mov si, ax
    mov di, ax
    add di, zombie_entry - start
    mov [05D13h], di
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
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

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
    mov cx, 10
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
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
phoenix_pointer_ready:
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
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
