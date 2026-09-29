bits 16

; RotAnchor A (arena candidate-1, direction: multi-anchor rotation).
; Based on m049 Chimera A. The champion's replication anchor is a single
; 2-byte FF1F (call far [bx]) written at a perfectly predictable fixed
; stride (chain[i] = chain[0] - i*0x3C00). This variant alternates the
; band step between two values each cycle (XOR-toggle against the stable
; DX=0x3800 constant, which is self-inverting: bp^=dx; bp^=dx returns to
; the original value), so consecutive anchors are NOT a single fixed-offset
; arithmetic progression. This is the cheapest possible per-cycle
; instrument: ONE 2-byte instruction (xor bp,dx), no new registers, no DI
; arithmetic (the exact failure class that crashed the earlier "decoy"
; attempt via a sub di,8 / add di,6 mismatch that drifted DI by -2/cycle).
; DX (not AX) is used deliberately: DX's low byte is 0x00, so the toggle
; only ever perturbs BP's HIGH byte, never its low byte. An earlier version
; of this file used AX=0x1FFF (low byte 0xFF) as the delta and that
; regressed catastrophically (0.06 vs champion's 0.78 on an identical
; 4-cohort smoke test) because it drifted [bx]'s low byte away from the
; fixed 0xA2 pattern the champion's whole quantization/self-recognition
; scheme depends on -- the same fragile invariant documented in
; GROUNDING.md's "AL-value sweep... ALL variants crashed" rejection. DX's
; zero low byte avoids that failure mode entirely, at the cost of a smaller
; second stride than originally intended (0x3C00 xor 0x3800 = 0x0400,
; alternating with the original 0x3C00) -- kept deliberately conservative
; after the AX regression rather than risking a second untested delta.
; worker: grows 17->19 bytes from the new instruction, so every
; worker:-length-dependent copy count is bumped +1 word (9->10) in lockstep,
; preserving the original 1-spare-byte margin exactly (verified by hand,
; not assumed) rather than repeating the DEC-DI ablation's silent
; length/copy-count mismatch bug.
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
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
