bits 16

; Diagnostic timing-control (arena Phase E side-investigation, not a
; synthesis candidate). Tests candidate-1's own named-but-unresolved
; hypothesis: does its -13.8% screen regression come from pure per-cycle
; TIMING cost (one extra instruction in worker:, every cycle), or from
; the stride-ALTERNATION itself disrupting positional regularity the
; champion's self-recognition/zombie-capture logic depends on?
;
; This is byte-for-byte identical to the champion except worker: has one
; extra instruction, "or bp,bp" (2 bytes: 09 ED -- confirmed exactly 2
; bytes via assembled manifest, unlike an initial "xor bp,0" attempt
; which NASM encoded as 3 bytes (83 F5 00, immediate form) and would have
; been an invalid, non-size-matched control), which costs exactly the
; same one round as candidate-1's "xor bp,dx" (31 D5, also 2 bytes) but
; has ZERO effect on bp's value or the anchor address sequence, and
; (unlike xor bp,dx) never touches DX at all -- a clean, size-matched,
; pure timing-cost control with no behavioral change. If this regresses
; by roughly the same -13.8% as candidate-1, the cost is pure timing. If
; it stays near the champion's own baseline, candidate-1's regression is
; specifically caused by the stride alternation, not the extra
; instruction's mere presence.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h

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
    or bp, bp
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
