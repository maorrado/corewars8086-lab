bits 16

; ReplicatorB — candidate-6: minimal-footprint pure replicator, no combat.
; Identical mechanism to ReplicatorA (see its header comment for full
; rationale) — same plain near-jump self-copy "imp" loop, no INT86h/
; INT87h, no searching, no zombie interaction. Only STRIDE differs, so A
; and B (loaded at different, code-dependent arena offsets by the engine)
; don't walk into lockstep with each other as they both replicate forward
; through the shared 64KB arena.

STRIDE  equ 112    ; different phase/spacing from ReplicatorA's 96, so the
                    ; two teammates' replication chains don't stay
                    ; permanently offset by a fixed, collidable amount.
                    ; CAUTION: keep STRIDE within the 3-byte "add r16,imm8"
                    ; range (0..127) — see ReplicatorA's header note. A
                    ; value needing the 4-byte immediate form silently
                    ; changes loop:'s length and breaks WORDS below.
WORDS   equ 7       ; exact word count of the loop: block below (verified
                    ; against the assembled listing, see manifest)

start:
    push cs
    pop es          ; ES = arena segment (one-time; see ReplicatorA)
    mov si, ax      ; SI = my own load offset
    add si, loop - start  ; SI = offset of loop: (the replicating unit,
                    ; NOT start: itself — start: never runs again)
    mov di, si
    add di, STRIDE  ; DI = target offset for the first copy

loop:
    mov cx, WORDS
    push di
    rep movsw       ; [ES:DI] <- [DS:SI] x WORDS words
    pop si          ; SI = start of the copy just written (new "self")
    mov di, si
    add di, STRIDE  ; DI = target for the generation after next
    jmp si          ; hand off execution to the freshly written copy
