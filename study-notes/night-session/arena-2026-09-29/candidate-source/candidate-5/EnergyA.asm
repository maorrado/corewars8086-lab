bits 16

; Energy A (candidate-5): Phoenix replication core (proven, unmodified)
; + a one-time, deferred heavy-bomb (INT86h) detour inserted between the
; existing signature-write bootstrap and the jump into phoenix_init.
;
; Direction: "energy-aware adaptive bombing". Verified from source
; (War.java: updateWarriorEnergy / shouldRunExtraOpcode / calculateWarriorSpeed,
; Cpu.java: int86()/int87()) that Energy affects ONLY the probability of one
; bonus opcode per round (speed=min(16,1+log2(E)), rolled vs rand(16)) and
; has ZERO effect on bomb size/power/search — int86()/int87() never read
; Energy. Energy also does NOT accumulate passively; it only rises by
; spending a full round on the virtual "9B 9B" (WAIT WAIT) NRG opcode, at
; 1 round per +1 energy, decaying 1 point per 5 rounds automatically.
; Farming meaningful energy (tens of points, for a still-small ~1/16..5/16
; chance of ONE bonus opcode) costs far more rounds than the timing-cost
; data in GROUNDING.md shows this engine tolerates for "smart" additions.
; So this build does NOT farm energy. It spends exactly one real,
; one-shot 9B 9B (2 bytes, paid once, not in the hot replication loop)
; immediately before firing the previously-unused INT86h heavy bomb, as
; an honest (not oversold) use of the mechanic: a small, real, one-time
; chance at a bonus opcode on the very round the bomb fires. The real
; strategic change is behavioral, not energy-based: the champion (verified
; by reading final/ChimeraA.asm + final/ChimeraB.asm) never calls INT86h
; at all, leaving both bomb1Count=2 charges completely idle all game. This
; build spends one of them, deliberately sequenced AFTER the existing
; signature-write/band-compute bootstrap completes (not interleaved with
; it, not at instruction 1) rather than never or blindly-immediately.
;
; Safety approach: the detour is bracketed with push/pop around the two
; live registers (AX, SI) that the unmodified tail (phoenix_init onward)
; depends on, so the proven replication pipeline's register contract is
; provably undisturbed regardless of what the detour does internally.
; Everything before and after the detour is byte-for-byte identical to
; final/ChimeraA.asm.

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

    ; --- deferred heavy-bomb detour (one-time, not in hot loop) ---
    push ax
    push si
    mov di, si                 ; DI = own worker address (band-consistent target base)
    add di, 0600h               ; aim one band-ish step outward, away from self
    mov ax, 01FFFh               ; blind pattern: FF 1F FF 1F ... (the far-call anchor
    mov dx, 01FFFh               ; opcode itself) -- if it lands in a rival's anchor
                                  ; cell, a subsequent call far [bx] there decodes to
                                  ; the same "call far [bx]" opcode, so a partial/edge
                                  ; hit is inert-to-neutral rather than guaranteed-fatal
                                  ; to whoever owns that memory, unlike an arbitrary
                                  ; byte pattern; a full 256-byte hit still trashes code.
    db 09Bh, 09Bh                ; one-shot NRG (energy+1); honest, not farmed
    int 086h                     ; spend one of the two idle bomb1Count charges
    pop si
    pop ax
    ; --- end detour; tail below is byte-identical to final/ChimeraA.asm ---

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
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
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
