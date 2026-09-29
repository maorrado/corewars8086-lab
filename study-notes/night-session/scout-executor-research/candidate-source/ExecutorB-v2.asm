bits 16

; Executor B v2: reads scout-published target (marker-gated, ES->DS relay
; per ProtoB-v1.asm's proven protocol); if valid, performs a short STOSB
; burst writing the fatal arena-filler byte (0xCC = INT3, immediately
; fatal if the opponent's IP ever lands there) across a few bytes at the
; target, then falls back to an independent survival loop. If no valid
; target is ever published (A dead, communication never succeeds), B does
; not wait forever -- after a bounded number of poll attempts it gives up
; and goes straight to fallback, so a communication failure cannot strand
; B in an infinite unproductive loop.
;
; Fallback here is deliberately minimal for this prototype stage: a tight
; self-referential loop that does not crash and does not depend on any
; shared state. A real fallback (replication/decoy/pressure) is the next
; increment once burst-attack correctness is confirmed.
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define BURST_LEN 8
%define FILLER 0CCh
%define MAX_POLLS 2000

start:
    mov ax, es
    push ax
    pop ds                  ; DS = shared segment

    xor cx, cx               ; CX = poll counter

poll:
    mov si, SHARED_MARKER
    lodsw
    cmp ax, 0
    jne got_target
    inc cx
    cmp cx, MAX_POLLS
    jb poll
    jmp short fallback       ; gave up waiting for a target

got_target:
    mov si, SHARED_TARGET
    lodsw                    ; AX = target offset

    push cs
    pop ds                   ; DS = own arena segment (default addressing)
    mov di, ax
    mov al, FILLER
    mov cx, BURST_LEN
    rep stosb                ; write BURST_LEN fatal bytes at the target

fallback:
hold:
    jmp short hold
