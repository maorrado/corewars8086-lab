bits 16

; Scout/executor communication prototype v0 (proof of channel only).
; B busy-polls the shared marker cell; once nonzero, reads the target offset
; A published and writes a distinctive proof byte (0x99) at that arena
; offset (own CS segment = arena segment at cold boot), to verify the value
; A wrote was actually received and used, not just present at end of battle.
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define PROOF_BYTE 099h

start:
poll:
    mov bx, SHARED_MARKER
    cmp word [es:bx], 0
    je poll

    mov bx, SHARED_TARGET
    mov di, [es:bx]                ; DI = target offset A published
    ; own CS = arena segment at cold boot; write proof byte via default DS
    ; (DS = own code segment = arena segment too, per engine init)
    mov byte [di], PROOF_BYTE

hold:
    jmp short hold
