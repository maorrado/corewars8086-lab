bits 16

; SplitAttackerB — independent, immediate, aggressive attacker.
;
; Strategy (assigned direction: split-team specialization, NO shared-memory
; communication with A): B never reads anything A wrote and never waits on
; A. It fires its weapon charges as early as possible, then falls into its
; own private copy of a minimal self-replication loop for survival
; redundancy for the remainder of the battle. If A dies, B is unaffected
; (B never touches A's memory or state); if B dies, A is unaffected.
;
; Score model (confirmed by reading War.java's updateScores): score is
; 1/numSurvivorsAlive, awarded ONCE at battle end to every living
; non-Zombie warrior. This means (a) B does not need to replicate to
; score -- merely surviving to the end is enough -- but (b) a single
; static instance is a single point of failure for the whole battle
; duration, so B still replicates cheaply after attacking, for
; redundancy. Most importantly: killing opponents shrinks the survivor
; denominator for EVERYONE still alive, so aggression is directly
; score-positive, not just defensively neutral.
;
; ES starts as the TEAM shared-memory segment (per GROUNDING.md), but
; that is a register-init fact, not something this warrior depends on:
; before each ES-relative instruction we explicitly repoint ES ourselves
; (arena segment for the bomb payload target, or arena segment again for
; our own replication copy). We never read the shared segment's contents,
; so there is no dependency on anything A (or anyone) published there.
;
; Weapon 1 -- INT86h x2 ("heavy bomb", 2 charges, engine-fixed count):
; blind write of a fixed 256-byte pattern (AX repeated) to ES:DI onward.
; No search, so no way to confirm a hit -- pure area denial/carpet fire.
; Aim points are derived from OUR OWN load offset (AX) via the same
; class of band-quantization technique the champion uses for ITS target
; selection (divide/rescale AX to get a pseudo-random-looking spread
; band) -- reusing the general technique, not the champion's specific
; tuned constants (those were already exhaustively swept and rejected
; per GROUNDING.md; only the *technique* -- derive a spread offset from
; your own position -- is reused here, with independent constants).
;
; Weapon 2 -- INT87h x1 ("smart bomb", 1 charge): searches outward from
; ES:DI for a specific 4-byte pattern (AX:DX) and patches the FIRST
; match to BX:CX. We target EB F9 CC CC -- VERIFIED (via direct hex
; dump of official-2025/zombies-live/zom20b and zom20d) to be a real,
; repeating substring inside two of the four live 2025 zombie files, not
; a guess. We do not attempt the champion's fixed-cell zombie-capture
; redirect (that requires writing an absolute rendezvous address ahead
; of time and costs several extra bootstrap instructions for a payoff
; that, per GROUNDING.md, does not add to score directly since zombies
; never score even when captured). Instead we patch those 4 bytes to a
; simple destructive constant -- pure area denial, denying that capture
; opportunity to OTHER opponents' chains, at zero extra instruction cost
; beyond the call itself.
;
; After both weapons are spent, B replicates using the exact same
; register-indirect-jump mechanism as A (own STEP/band, own registers,
; no shared memory, no anchor byte to protect) for redundancy.

%define STEP 01C0h      ; B's own forward spacing (independent of A's band)

start:
    push cs
    pop es                   ; ES = arena segment (bomb targets + our copy)
    mov si, ax                ; SI = own load offset, preserved untouched
                                ; across every weapon call below (AX/BX/CX/DX
                                ; are all freely clobbered as scratch; SI is
                                ; the only register that must survive to the
                                ; replication section at the end).

    ; --- INT86h shot 1: blind bomb at SI + fixed offset band ---
    mov di, si
    add di, 2000h             ; band 1: well clear of our own load site
    mov ax, 0CCCCh             ; payload pattern written 256x to ES:DI..
    int 086h

    ; --- INT86h shot 2: blind bomb at a second, disjoint band ---
    mov di, si
    add di, 0A000h              ; band 2: far arena quadrant, disjoint spread
    int 086h

    ; --- INT87h shot: search+patch verified zombie signature ---
    mov di, si
    mov ax, 0F9EBh                ; AX:DX = EB F9 CC CC in memory order
    mov dx, 0CCCCh                  ; (verified present in zom20b/zom20d)
    mov bx, 0CCCCh                    ; BX:CX = CC CC CC CC replacement --
    mov cx, 0CCCCh                     ; erases the EB F9 short-jump head
    std
    int 087h
    cld

    ; --- fall into own private replication loop (redundancy, no comms) ---
    add si, worker - start

worker:
    mov di, si
    add di, STEP
    mov bx, di               ; SAVE destination start -- movsw auto-advances
                               ; SI/DI by 2 per word copied (Cpu.java movsw()
                               ; does SI+=diff;DI+=diff every iteration), so
                               ; post-copy DI is WLEN*2 bytes past the start;
                               ; BX is untouched by movsw and survives intact.
    mov cx, WLEN
    rep movsw
    mov si, bx                 ; SI = the SAVED start, not the advanced DI
    jmp si
end_worker:
pad:
    times (end_worker - worker) & 1 db 90h
WLEN equ (($ - worker) / 2)
