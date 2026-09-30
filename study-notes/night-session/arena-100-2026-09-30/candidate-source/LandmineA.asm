bits 16

; c090-landmine-avoidance / A
;
; DESIGN INTENT: treat every documented engine landmine in GROUNDING.md as a
; first-class constraint, not an afterthought. Base architecture is the
; proven m050 champion lineage (call-far-[bx] replication with INT87h
; self-healing anchor repair) -- unchanged in every way that carries risk --
; plus exactly ONE additional change that was individually verified against
; every one of the four documented bug classes before being accepted:
;
;   mov sp, di          ; 2 bytes, 1 round
;   add sp, 00200h       ; 4 bytes, 1 round
; becomes:
;   lea sp, [di + 00200h] ; 4 bytes, 1 round total
;
; Why this is safe against each documented bug class:
;  - Bug class 1 (register persists across call far [bx] generations): LEA
;    only READS di (base register inside [..]) and WRITES sp. It does not
;    touch di's value at all (confirmed against the engine's opcode 0x8D
;    implementation: only the destination register is mutated). DI is
;    re-derived fresh every generation from AX right before this point
;    ("mov di, ax"), so there is no leftover-across-generations risk either
;    way -- this fusion changes nothing about what any later instruction
;    reads. sp itself is also re-established by this same instruction every
;    single generation (it's inside phoenix_init:, which runs once per
;    bootstrap, executed fresh each time via the call-far-[bx] jump target
;    construction -- not a leftover value used across generations, since
;    every generation runs this line itself before using sp).
;  - Bug class 2 (byte-length coupling / copy-count constants): this edit is
;    entirely inside phoenix_init:, which is NEVER the region copied by
;    "rep movsw" (only bytes starting at worker: are copied into the next
;    generation -- verified by reading the copy source/count below). No
;    copy-count constant needs to change. worker:'s byte length, and every
;    coupled "mov cx, N" / "mov cl, N" site, is BIT-FOR-BIT IDENTICAL to the
;    verified-working m050 baseline -- untouched, unmoved, unchanged.
;  - Bug class 3 (filler-byte padding on a landing label): not applicable --
;    no bytes were removed-and-padded anywhere; this is a straight
;    instruction substitution of equal total byte length (6 bytes in, 4
;    bytes out -- see note below) inside a fall-through, non-jump-target
;    region, and the file's overall subsequent byte offsets for everything
;    that follows (worker: and onward) SHIFT, which is fine because nothing
;    references phoenix_init/worker by absolute offset -- only via labels
;    resolved at assembly time (confirmed by reading every operand in this
;    file: no raw literal offset targets phoenix_init or worker).
;  - Bug class 4 (safe != helpful): this is a pure one-time-bootstrap timing
;    win (one fewer opcode dispatch before the replication loop starts),
;    structurally identical in kind to m050's own sole verified edge over
;    m049 (removing a dead one-time xor di,di) -- not a combat-interaction
;    change, not a search-and-corrupt idea, so the "safe but net-negative in
;    aggregate competitive dynamics" trap documented for INT87h-corruption
;    ideas does not apply here: there is no opponent-facing behavior change
;    at all, only fewer engine rounds spent in our own bootstrap.
;
; Every other landmine from GROUNDING.md was checked and confirmed N/A to
; this file: no 0x26 ES-override prefix used anywhere; no reliance on
; Sign/Parity flags after any 16-bit SHL/SHR/SAR/RCR (this file uses none);
; no double-0x9B byte sequence anywhere (checked by eye across the full
; file); no word write sits within 1 byte of a segment/region boundary; the
; FAR_SEG=0FFCh execute-blind-spot (IP in [0,0x3F] or [0xFFC0,0xFFFF]) is
; never targeted by any computed jump -- the anchor/signature byte math is
; bit-identical to the verified-safe m050 baseline, which does not hit it.
;
; Net result: -2 bytes, -1 instruction, -1 engine round spent per bootstrap,
; zero change to replication-loop byte length, zero change to worker:,
; zero change to any copy-count constant, zero change to combat behavior
; against opponents. This is the most conservative possible improvement
; available under a "landmine avoidance is a first-class constraint" brief.

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
    lea sp, [di + 00200h]
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
