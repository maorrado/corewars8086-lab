bits 16

; Synthesis A v5 (arena Phase E continuation, midpoint stride test).
;
; v3 tried delta=0x0800 (alternate stride 87% the size of primary) --
; crashed 100% deterministically, diagnosed as a byte-length/copy-count
; coupling bug (fixed) followed by a suspected denser-band-packing
; collision effect (not fully resolved, abandoned). Candidate-1's
; original delta=0x3800 gives an alternate stride only 7% the size of
; primary -- a huge mismatch, but it WORKS (no crash), just costs -13.8%
; on the screen (diagnostically isolated to ~66% behavioral, ~22%
; timing).
;
; v5 tests a genuine MIDPOINT: delta=0x1000, alternate stride 0x2C00 =
; 73% of primary 0x3C00 -- meaningfully closer than candidate-1's 7% (so
; the magnitude-mismatch behavioral cost should shrink), but with more
; separation than v3's crashed 87% (so the suspected dense-packing
; collision risk should be reduced, not eliminated). This is an
; empirical bisection, not a theory -- if this also crashes, the safe
; zone is narrower than 73%-87% and closer to candidate-1's original 7%;
; if it works and improves the screen score, the safe zone is between
; 7% and 73%, and a further bisection could refine it more.
;
; Same correctness fixes as v3, re-applied: DX's bootstrap value stays
; unchanged (stack-gap purpose only); worker: explicitly reloads DX to
; the new delta after "sub sp,dx" consumes the original value and before
; "xor bp,dx" needs the new one; the copy-count (mov cx/cl) bumped to
; match worker:'s new length in all three coupled places.
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
    mov cx, 12
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
    mov cx, 12
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
    mov dx, 1000h
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 12
    xor si, si
    stosw
    dec di
    call far [bx]
