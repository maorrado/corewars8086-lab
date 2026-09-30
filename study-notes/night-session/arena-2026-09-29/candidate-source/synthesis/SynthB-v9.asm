bits 16

; Synthesis B v9, pairs with SynthA-v9.asm. Adds m050's one-instruction
; bootstrap timing fix (redundant "xor di,di" removed from start:, padded
; with 2 inert filler bytes to preserve every downstream offset -- see
; SynthA-v9.asm's header for the full diagnosis of why this helps) on top
; of v6's DX-persistence fix (see SynthA-v6.asm's header for that
; diagnosis): the
; xor-toggle delta is baked as an immediate ("xor bp, 02000h", 4 bytes)
; instead of routed through DX ("xor bp, dx", 2 bytes), so DX is never
; written inside worker: and stays at its one-time bootstrap value
; (0x4000) for "sub sp,dx" on every generation, forever.
;
; Delta = 0x2000 (zero low byte, same invariant as A). B's primary stride
; is bp=0x4400; alt stride = 0x4400 xor 0x2000 = 0x6400, ratio 147.1% (B's
; primary/alt relationship is inherently different in shape from A's,
; consistent with how candidate-1's original B differs from A).
;
; Byte-length coupling: worker: grows from candidate-1's 19 bytes to 21
; bytes. B has a single bootstrap copy site (phoenix_init:, mov cx,10,
; already covering 20 bytes with the champion's original 1-word margin
; convention) -- bumped to cx=11 (22 bytes) to cover the new 21-byte
; worker:, matching worker:'s own internal cl reload (10 -> 11).
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
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 11
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
    xor bp, 02000h
    sub [bx], bp
    mov di, [bx]
    mov cl, 11
    xor si, si
    stosw
    dec di
    call far [bx]
