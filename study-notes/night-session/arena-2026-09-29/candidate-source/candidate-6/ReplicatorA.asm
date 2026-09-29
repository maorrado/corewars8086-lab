bits 16

; ReplicatorA — candidate-6: minimal-footprint pure replicator, no combat.
;
; Strategy: skip INT86h/INT87h entirely (no bombing, no searching, no
; zombie interaction). Spend every instruction purely on self-copying as
; fast/small as possible, racing to claim arena territory via sheer
; replication count rather than combat.
;
; Mechanism: a plain near-jump "imp" replicator. ES is fixed to the arena
; segment once at boot (cold-boot ES defaults to team shared memory, which
; is NOT execute-accessible, so this one-time fix is required before any
; MOVSW/STOSW can write an executable copy). SI/DI then track "my body's
; current live offset" / "next copy's target offset" purely in registers,
; carried forward across generations via a register-preserving near JMP
; (no re-derivation from AX after generation 0, no division/quantization,
; no shared-memory coordination cell, no far-call/segment-aliasing trick —
; execute access already covers the whole arena segment, so a same-segment
; near jump is sufficient and strictly simpler).
;
; loop: is the ONLY part copied each generation (the one-time start: init
; never needs to run again, since ES/SI/DI are already correct in the
; freshly-copied instance's registers when we jump into it).

STRIDE  equ 96     ; bytes between generations (> loop size; kept within
                    ; the 3-byte "add r16,imm8" encoding range on purpose
                    ; — see ReplicatorB's header note on why: a value
                    ; that forces the wider 4-byte immediate encoding
                    ; changes loop:'s byte length and silently breaks the
                    ; WORDS constant below, corrupting every copy's tail
                    ; instruction. Always re-verify WORDS against the
                    ; assembled .lst after touching STRIDE.)
WORDS   equ 7       ; exact word count of the loop: block below (verified
                    ; against the assembled listing, see manifest)

start:
    push cs
    pop es          ; ES = arena segment (one-time; execute access lives
                    ; only in the arena segment, and MOVSW/STOSW always
                    ; target ES:DI, so this must happen before first copy)
    mov si, ax      ; SI = my own load offset (free self-location from AX)
    add si, loop - start  ; SI = offset of loop: (the replicating unit,
                    ; NOT start: itself — start: never runs again)
    mov di, si
    add di, STRIDE  ; DI = target offset for the first copy

loop:
    mov cx, WORDS
    push di
    rep movsw       ; [ES:DI] <- [DS:SI] x WORDS words; SI,DI both += 2*WORDS
    pop si          ; SI = start of the copy just written (new "self")
    mov di, si
    add di, STRIDE  ; DI = target for the generation after next
    jmp si          ; hand off execution to the freshly written copy
