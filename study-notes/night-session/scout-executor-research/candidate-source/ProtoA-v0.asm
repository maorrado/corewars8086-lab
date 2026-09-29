bits 16

; Scout/executor communication prototype v0 (proof of channel only).
; A writes a fixed test target offset to the shared cell, then a nonzero
; version marker (written LAST, single STOSW, so B never sees a half-written
; target: REP MOVSW/STOSW only do one word per engine turn, so multi-word
; payloads are not atomic across turns -- the marker-last protocol is the
; fix). No scanning logic yet: this only proves A->B communication is
; deterministic and reliable before adding any target-finding logic.
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define TEST_TARGET_OFFSET 0500h   ; arbitrary in-arena offset A "found"

start:
    ; ES already = group shared memory segment at cold boot (engine-set).
    mov bx, SHARED_TARGET
    mov word [es:bx], TEST_TARGET_OFFSET
    mov word [es:bx+2], 1          ; marker = 1 (valid)

hold:
    jmp short hold                 ; A does nothing else in this prototype
