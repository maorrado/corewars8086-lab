bits 16

; Synthesis B v4 (arena Phase E, graft attempt 3 -- built fresh on the
; clean candidate-1 base, not stacked on the abandoned v3 stride-fix).
; Base = candidate-1 RotAnchorB (worker: stride-toggle preserved
; unmodified). Graft = candidate-4's independent B-side zombie-capture
; entry point, ported verbatim. Unlike v1/v2's grafts and v3's own fix,
; this graft does NOT touch worker: (the hot loop) or the anchor
; mechanism at all -- it operates purely in the one-time bootstrap/
; capture-routing logic, adding a new captured_init:/zombie_entry:-style
; block B did not have in the pristine champion, redirecting B's own
; existing search (already performed every battle) to its own fixed
; cell (05D17h, distinct from A's 05D13h) instead of funneling into A's.
;
; Correctness check performed before assembly: the new captured_init:
; block does its own "rep movsw" copy of worker:'s template, same as the
; existing phoenix_init: block -- BOTH need the copy-count bumped to
; match candidate-1's now-19-byte worker: (mov cx,9 -> 10 in BOTH
; places), not just the original phoenix_init: site. This is the exact
; kind of coupling that a naive graft could silently miss.
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
    mov cx, 10
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
    xor bp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 10
    xor si, si
    stosw
    dec di
    call far [bx]
