bits 16

; COD_arena4 B: Chimera m049's Phoenix replication PLUS an independent
; second opportunistic zombie/filler-capture entry point.
;
; Zombie-priority-replication direction (candidate-4).
;
; Rationale (see RATIONALE.md for the full writeup): INT87h can only
; detect-and-patch a KNOWN 4-byte signature and never reports back a
; match location (confirmed against Cpu.java:int87() — the found address
; is never written to a register, only the memory *at* the match is
; patched). The real zom20a-d zombie roster has no shared signature in
; its opening bytes (independently hex-verified), so a compile-time
; INT87h search cannot target "zombies in general" as a class, and the
; champion's own EB F9 CC CC self-search already fully commits to a
; different purpose (recognizing other Chimera-family copies, not the
; original zombie files). A true location-targeted per-zombie exploit
; was investigated and rejected as too fragile (per-file constants,
; unrecoverable position data - see RATIONALE.md).
;
; What IS real and buildable: in the shipped champion, A's start: AND
; B's start: both search for EB F9 CC CC (other champion-kin), but BOTH
; matches route their capture to the SAME destination - A's
; zombie_entry:. B never gets its own independent capture-and-convert
; path. This file gives B its own zombie_entry:-equivalent, published to
; its own fixed cell (05D17h, distinct from A's 05D13h) and reached via
; B's own existing search (redirected by changing one constant, mov
; cx,05D13h -> mov cx,05D17h). This doesn't add any new int87h calls or
; touch worker: (the hot loop) at all - it reuses the exact search B
; already performs every battle, just points its result somewhere new.
; Net effect: the team's two independent capture-search events (one from
; A, one from B) now drive two independent single-CC-byte opportunistic
; sub-searches from two different origins instead of both funneling into
; one, increasing effective opportunistic-capture coverage without adding
; any new INT87h charge usage or touching the hot replication loop.
;
; The 3-instruction publish insert is placed AFTER start:'s own int87h/
; cld (not before), matching the scout-executor research's own finding
; that this exact position is near-zero-cost (+0.0033, CI crossing zero)
; versus meaningfully negative when placed before int87h (-0.024).
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D17h
    std
    int 087h
    cld
    mov di, si
    add di, zombie_entry - start
    mov [05D17h], di
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
    add ah, 074h
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
    mov bx, 002C0h
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
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    call far [bx]
