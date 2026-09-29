bits 16

; Synthesis A v6 (arena Phase E, root-cause fix for the v3/v5 crash).
;
; ROOT CAUSE (confirmed via systematic-debugging, not guessed): v3 and v5
; both inserted "mov dx, <delta>" inside worker: to give the xor-toggle a
; delta DIFFERENT from candidate-1's stack-gap constant (dx=0x3800, reused
; for both "sub sp,dx" and "xor bp,dx"). But "call far [bx]" does NOT
; re-run the bootstrap between generations -- it transfers control with
; whatever register state existed at the jump. So from worker: pass 2
; onward, DX holds the LEFTOVER delta value, not the original 0x3800
; stack-gap constant, corrupting every subsequent "sub sp,dx". This
; explains why v3 (delta=0x0800) and v5 (delta=0x1000) crashed at the
; IDENTICAL round (226/255) with the IDENTICAL corrupted-anchor byte
; signature despite using different delta magnitudes: the bug was never
; about magnitude, it was about DX itself being clobbered and inherited.
;
; FIX: use an immediate operand ("xor bp, 02000h", 4 bytes) instead of a
; register ("xor bp, dx", 2 bytes) for the toggle. This costs +2 bytes
; over candidate-1 but means DX is NEVER written inside worker: -- it
; stays permanently at its one-time bootstrap value (0x3800) for "sub
; sp,dx" on every single generation, forever. No register is clobbered
; across the call far [bx] boundary, so there is nothing to inherit
; incorrectly.
;
; Delta choice: 0x2000 (zero low byte, preserving candidate-1's documented
; AL-sweep-safety invariant -- see RotAnchorA.asm's comment on why a
; nonzero low byte previously caused a catastrophic 0.06-vs-0.78
; regression). Alt stride = 0x3C00 xor 0x2000 = 0x1C00, a ratio of 46.7%
; to the primary -- a genuine midpoint between candidate-1's extreme 6.7%
; (diagnostically isolated as costing ~66% of its -13.8% screen
; regression via magnitude mismatch) and a 1:1 ratio.
;
; Byte-length coupling: worker: grows from candidate-1's 19 bytes to 21
; bytes (the imm16 xor costs 2 bytes more than the register form). Copy
; count bumped cx=10/cl=10 -> cx=11/cl=11 (22-byte budget, 1 spare byte,
; preserving the same margin convention candidate-1 used) in all three
; coupled sites: phoenix_init, captured_init, and worker:'s own cl reload.
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
    mov cx, 11
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
    mov cx, 11
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
    xor bp, 02000h
    sub [bx], bp
    mov di, [bx]
    mov cl, 11
    xor si, si
    stosw
    dec di
    call far [bx]
