bits 16

; c039-int86-bomb v4: m050's A (BX-optimized redundant-DI-clear removal --
; verified as m050's own sole, real, positive edge over m049 per
; GROUNDING.md's "known-safe reference facts") as the base, PLUS
; candidate-5's independently-verified-positive INT86h detour (arena-
; 2026-09-29, full 2500-battle screen: 0.6720000048 vs m049's
; 0.6674000056, using ONE of A's two idle bomb1 charges at SI+0x600,
; grafted after the signature/band bootstrap and before the
; "jmp short phoenix_init" commit point).
;
; This candidate deliberately does NOT extend the detour to B and does NOT
; spend A's second charge -- both were tried on this exact repo tonight
; (see build_v2/build_v3 iteration notes) and measured as regressions on
; an 8-cohort subset (two-sided A+B: -3.4% vs baseline on that subset;
; single-charge A+B: -1.4%) relative to single-charge-A-only (+0.2% on
; the same subset, consistent with candidate-5's full-screen +0.69%).
; Adding cost to B's short, cheap bootstrap appears to cost B
; disproportionately relative to the value of the extra bomb coverage --
; consistent with GROUNDING.md bug class 4's warning that a safe
; (non-crashing) mechanism is not automatically a net-positive one.
;
; Register liveness at the graft point (after "add si, worker - start",
; before "jmp short phoenix_init"): AX = signature-write operand (read by
; phoenix_pointer_ready's "mov [bx],ax"), SI = own worker address (read
; later). BX/CX/DX/DI are dead (BX=026FFh from the INT87h call setup is
; never read again before phoenix_init/captured_init overwrite it fresh;
; DI is unconditionally zeroed at the top of both phoenix_init and
; captured_init). Both AX and SI are push/pop-bracketed around the detour
; so correctness does not depend on that liveness trace being perfect.
; Per bug class 1: nothing this detour writes is read by a LATER
; replication generation via call far [bx] -- AX/SI are restored via pop,
; BX/CX are untouched, DI is local and unconditionally re-zeroed
; downstream every generation regardless of this detour's DI value.
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

    ; --- INT86h detour: spend one of A's two idle bomb1 charges ---
    ; (candidate-5's proven arena-2026-09-29 mechanism, verbatim)
    push ax
    push si
    mov di, si
    add di, 0600h
    mov ax, 01FFFh
    mov dx, 01FFFh
    int 086h
    pop si
    pop ax
    ; --- end detour ---

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
