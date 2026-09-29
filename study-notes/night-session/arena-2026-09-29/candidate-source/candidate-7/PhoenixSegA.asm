bits 16

; PhoenixSeg A (candidate-7): Segment-diversified Phoenix.
;
; Derived from Chimera/m049. The only structural change vs. the champion:
; FAR_SEG is no longer a fixed compile-time constant (0FFCh). Instead it is
; computed once at boot from 3 bits of this warrior's own loadOffset (AX at
; cold boot, randomized per-battle by the engine), landing on one of 8
; segment values in [0FF9h, 01000h]. Every value in that band was verified
; (via linear-address math against the engine's fixed execute window
; [10000h,1FFFFh]) to have a blind spot no larger than the champion's own
; 0FFCh choice, and all sit far below the worker entry IP's low byte (0A2h),
; so replication safety is preserved. See RATIONALE.md for the full
; derivation and safety argument.
;
; PTR_CELL/worker mechanics, band-quantized addressing, and the INT87h
; self/zombie-recognition call are unchanged from the champion -- this is a
; targeted substitution of one derivation, not a new replication mechanism.

%define PTR_CELL 00200h
%define SEG_BASE 00FF9h

start:
    mov bp, ax          ; capture loadOffset copy before AX is clobbered
    and bp, 7            ; isolate 3 low bits -> 0..7
    add bp, SEG_BASE      ; bp = randomized-but-safe far segment, 0FF9h..01000h

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
phoenix_pointer_ready:
    mov [bx], ax
    mov [bx + 2], bp
    xor si, si
    mov di, ax
    mov ax, bp
    mov es, ax
    mov sp, di
    add sp, 00200h
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
