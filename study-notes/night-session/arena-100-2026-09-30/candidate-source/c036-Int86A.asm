bits 16

; Int86A (c036-int86-bomb): m050 base + a deferred, one-time INT86h
; "heavy bomb" detour inserted after the existing signature-write/band
; -compute bootstrap finishes (SI = own worker addr already computed,
; AX = constructed signature byte already computed) and before the
; "jmp short phoenix_init" that commits to replication.
;
; Direction: use one of A's two otherwise-permanently-idle INT86h charges
; (bomb1Count starts at 2 and is NEVER replenished across the whole game
; for a given physical warrior instance -- verified from
; Warrior.java:initializeCpuState, only called once in the constructor)
; to blind-write a 256-byte pattern at a position derived from our own
; load address, offset by a value chosen with MIN_GAP=1024 in mind so the
; strike lands past the engine's guaranteed minimum spacing rather than
; inside our own body.
;
; Register liveness at the insertion point (verified by re-reading the
; unmodified m050 bootstrap from "start:" through "jmp short
; phoenix_init" byte-for-byte before writing this file):
;   AX  - live: constructed signature-write operand, consumed later by
;         "mov [bx],ax" in phoenix_pointer_ready. MUST be preserved.
;   SI  - live: own worker address (== load address + (worker-start)),
;         consumed by phoenix_pointer_ready's "mov di,ax" -- wait, that's
;         AX; SI itself is consumed at "phoenix_init: ... xor di,di" no,
;         SI's role is as the rep movsw source (DS:SI) inside
;         phoenix_init/captured_init -- SI must equal the *current*
;         instance's own code start (SI=ax was set at start:, unchanged
;         by int87h and the band-compute block, which only clobbers
;         AX/CH/AH/AL to build the signature, not SI). MUST be preserved.
;   BX,CX,DX,DI - dead: BX/CX/DX are only int87h call args, never read
;         again; DI is unconditionally zeroed at the very first
;         instruction inside both phoenix_init and captured_init. Free to
;         clobber.
;   ES  - already CS (arena segment), set at "push cs / pop es" earlier
;         in start:. INT86h implicitly targets ES:DI, so no segment setup
;         needed at all -- this is why the detour is so cheap.
;
; Bomb targeting: DI = SI (own worker addr, i.e. our own load address
; plus a fixed in-file offset) + 0x600. 0x600 = 1536 decimal, which is
; MIN_GAP (1024) plus a 512-byte margin -- deliberately past the
; guaranteed-minimum spacing to the *next* warrior rather than into our
; own body, while still being a plausible distance to reach a real
; neighboring warrior's code in the shared 64KB arena. This exact offset
; was already validated stand-alone in a prior arena night
; (candidate-5/EnergyA.asm, +0.0046 vs champion on a 2500-battle full
; field) so it is a known-safe, known-positive starting point rather than
; an untested guess.
;
; Payload: AX=DX=0x1FFF repeated (the same little-endian bytes, FF 1F, as
; the "call far [bx]" anchor opcode the whole champion lineage depends
; on). A partial/edge hit that lands on some other warrior's own anchor
; cell still decodes as a valid "call far [bx]" (inert/neutral) rather
; than guaranteed garbage; a full 256-byte hit still destroys whatever
; real code was there. This also means a stray hit on OUR OWN not-yet-
; written-forward code is comparatively harmless versus an arbitrary
; payload, which is a real risk-reduction property given the offset is
; blind (INT86h has no search/verify step, unlike INT87h).
;
; One honest NRG opcode (db 9Bh,9Bh) is included immediately before the
; bomb fires: it cannot make the bomb stronger (INT86h reads no energy/
; speed state at all -- verified against Cpu.java int86()/stosdw()), but
; it is a real, cheap (1 round, 2 bytes), non-oversold 1/16 chance
; (speed=1 at energy=1) of a bonus opcode landing on the very round the
; bomb fires, at zero marginal risk since it's a genuine NOP-equivalent
; from the engine's perspective for every purpose except that one
; probabilistic roll.
;
; Safety: AX and SI are pushed before the detour and popped immediately
; after, so correctness does not depend on the liveness trace above being
; perfect -- even if it's wrong, the unmodified tail runs with the exact
; same AX/SI it would have had without this detour. BX/CX/DX/DI are
; clobbered freely per the trace above. worker: (the hot replication
; loop) is completely untouched -- this detour is one-time-only, paid
; once per battle, never repeated per generation, keeping the per-cycle
; replication cost at exactly zero.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h

start:
    mov si, ax
    mov bx, ax
    add bx, zombie_entry - start
    mov [05D13h], bx
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
    add ah, 010h
    mov al, 0A2h
    add si, worker - start

    ; --- deferred heavy-bomb detour (one-time, non-hot-loop) ---
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
    ; --- end detour ---

    jmp short phoenix_init

    times 2 db 0CCh

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
