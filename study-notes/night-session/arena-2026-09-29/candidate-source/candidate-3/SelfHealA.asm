bits 16

; SelfHealA (candidate-3): Chimera/Phoenix replication with a self-healing
; 2-byte call-far anchor. Bootstrap (band-quantized addressing, INT87h
; self/zombie recognition, phoenix pointer-cell setup) is unchanged from
; the champion (m049) -- that machinery is proven and not this candidate's
; assigned focus. The only structural change is in worker:'s anchor
; write step: instead of blindly writing FF,1F (call far [bx]) and
; immediately jumping through it, we write it, then verify the exact
; bytes just written are still intact (using SCASW: AX vs ES:[DI], a
; single implicit-segment instruction, no 0x26 prefix needed) before the
; call. AX already holds the correct anchor word (0x1FFF) persistently
; from bootstrap onward, so verification costs no extra register setup.
; On the healthy path (no corruption from an interleaved opponent turn
; between our STOSW and our CALL FAR [BX]) this costs exactly 3 extra
; rounds/iteration (a re-fetch of the target offset, the SCASW compare,
; and a conditional skip) vs. the champion's unchecked version. On the
; rare corrupted path, we re-write the correct bytes (2 more rounds)
; before proceeding -- converting what would otherwise be an instant
; fatal jump into garbage (UnimplementedOpcodeException / wild jump) into
; a same-cycle repair-and-continue.

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
    mov cx, 13
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
    mov cx, 13
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
    mov cx, 12
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
    mov cl, 13
    xor si, si
    stosw
    mov di, [bx]
    scasw
    je anchor_ok
    mov di, [bx]
    stosw
anchor_ok:
    dec di
    call far [bx]
