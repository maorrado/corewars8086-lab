bits 16

; RotAnchor B (arena candidate-1, direction: multi-anchor rotation).
; Pairs with RotAnchorA.asm. Same worker:-loop change as A (see A's header
; comment for the full rationale, including why DX=0x4000 and not
; AX=0x1FFF is used as the XOR delta -- AX's low byte 0xFF caused a
; catastrophic regression by drifting the chain's fixed low-byte pattern;
; DX's low byte 0x00 avoids that entirely): xor bp,dx toggles the band
; step between two values each replication cycle using the already-stable
; DX constant, self-inverting (no DI arithmetic, no drift). worker:
; grows 17->19 bytes, so the internal mov cl,9->10 is bumped to match, and
; the earlier template-save copy (mov cx,9->10) is bumped too. B's
; first-entry bootstrap copy already used mov cx,9 in the champion (1
; movsw + 9 rep = 10 words = 20 bytes), which already covers the new
; 19-byte worker: with the same 1-byte spare margin as before -- verified
; by hand, so that constant is intentionally left unchanged here.
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
