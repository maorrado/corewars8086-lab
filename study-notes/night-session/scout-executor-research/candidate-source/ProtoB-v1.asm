bits 16

; Scout/executor communication prototype v1 (proof of channel, corrected).
; B must read the shared segment via DS:SI (LODSW uses DS:SI, not ES) since
; there is no ES:-prefixed general read instruction (0x26 unimplemented --
; see ProtoA-v1.asm). ES = shared segment already at cold boot, so B moves
; ES's value into DS via a general register (mov ax,es / push ax / pop ds)
; before it can LODSW the shared cell. Busy-polls the marker; once nonzero,
; reads the target and writes a proof byte at that arena offset via DS:DI
; after restoring DS to the arena/code segment (own DS at cold boot).
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define PROOF_BYTE 099h

start:
    mov ax, es                      ; AX = shared segment (from cold-boot ES)
    push ax
    pop ds                          ; DS = shared segment now

poll:
    mov si, SHARED_MARKER
    lodsw                           ; AX = [DS:0302], SI -> 0304
    cmp ax, 0
    je poll

    mov si, SHARED_TARGET
    lodsw                           ; AX = [DS:0300] = target offset

    push cs
    pop ds                          ; restore DS = own code/arena segment
    mov di, ax
    mov byte [di], PROOF_BYTE

hold:
    jmp short hold
