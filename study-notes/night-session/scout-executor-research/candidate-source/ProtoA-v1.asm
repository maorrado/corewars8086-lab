bits 16

; Scout/executor communication prototype v1 (proof of channel, corrected).
; CRITICAL ENGINE CONSTRAINT DISCOVERED: opcode 0x26 (the 'ES:' segment
; override prefix) is UNIMPLEMENTED in this engine (Cpu.java case 0x26 ->
; throws UnimplementedOpcodeException unconditionally). This means explicit
; "mov [es:bx], ax"-style operands are NEVER usable -- the only legal way to
; address the shared segment is through instructions with an IMPLICIT ES
; operand: STOSB/STOSW/MOVSB/MOVSW (dest = ES:DI) and INT 87h (ES:DI-based
; search). ES is set to the group-shared-memory segment automatically at
; cold boot (Warrior.java:initializeCpuState), so A can write immediately
; via STOSW with no setup. Version marker written LAST (separate STOSW)
; so B never observes a half-written target (REP/STOSW only performs one
; word per engine round, so a would-be multi-word "atomic" write is not
; atomic across turns regardless).
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define TEST_TARGET_OFFSET 0500h

start:
    ; ES = shared segment already (cold boot). DI = shared cell offset.
    mov di, SHARED_TARGET
    mov ax, TEST_TARGET_OFFSET
    stosw                           ; [ES:0300] = target, DI -> 0302
    mov ax, 1
    stosw                           ; [ES:0302] = marker (written last)

hold:
    jmp short hold
