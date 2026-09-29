bits 16

; Synthesis A v1 (arena Phase E, graft 1 of N): base = candidate-1
; RotAnchor (multi-anchor rotation, chosen as base per cross-judge +
; round-robin tournament evidence: 9-0 head-to-head record vs every other
; team including m049/m050, despite a -13.8% deficit on the isolated
; all-2025 field screen -- the tournament result is trusted more for base
; selection since it was not something candidate-1's own design was
; tuned against). Graft: candidate-5's deferred heavy-bomb (INT86h)
; detour, ported verbatim from EnergyA.asm at the equivalent point in the
; bootstrap (after band-quantization completes, before the jump into
; phoenix_init). Register liveness at the graft point (AX/SI live,
; BX/CX/DX/DI dead) was independently re-verified against THIS base
; (not assumed to carry over from candidate-5's champion-based analysis)
; since candidate-1's own change lives entirely inside worker:, which
; executes only after this point -- confirmed the graft point's register
; state is identical to the champion's, so candidate-5's original
; safety reasoning (push ax/push si bracket) transfers exactly.
;
; RotAnchor's own worker: change (xor bp,dx multi-anchor toggle) and its
; associated copy-count bumps (9->10 in three places) are preserved
; unmodified from candidate-1's RotAnchorA.asm.
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

    ; --- graft: candidate-5's deferred heavy-bomb detour (verbatim) ---
    push ax
    push si
    mov di, si
    add di, 0600h
    mov ax, 01FFFh
    mov dx, 01FFFh
    db 09Bh, 09Bh
    int 086h
    pop si
    pop ax
    ; --- end graft ---

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
