bits 16

; SplitReplicatorA — pure, minimal, fast self-replicator.
;
; Strategy (assigned direction: split-team specialization, NO shared-memory
; communication between A and B): A does exactly one job — copy itself
; forward through the arena, over and over, as cheaply as possible. No
; INT87h self-search, no ES-based coordination, no far-call/pointer-cell
; trampoline (that machinery is what gives the champion's Phoenix lineage
; its single point of failure: a 2-byte anchor written to memory and then
; executed through indirectly, which dies instantly if clobbered between
; the write and the call). This design never writes an executable pointer
; to memory and then trusts it — it jumps through a REGISTER, which no
; opponent write can ever touch.
;
; Register facts relied on (verified in GROUNDING.md):
;   AX = own load offset at boot (free self-position info, no IP-discovery
;        trick needed). DS=CS=arena segment. Flags=0 (DF=0, no CLD needed).
;   MOVSW's destination segment is hardwired to ES, not DS, so ES must be
;   pointed at the arena segment (push cs/pop es) before the first copy —
;   this is a structural requirement of the only bulk-write mechanism
;   available, not communication with B (ES starts as the *team* shared
;   segment; we simply repoint it to the arena for our own private use).
;
; Mechanism: `start:` runs once, seeds SI to point at this copy's `worker:`
; label. `worker:` computes DI = SI + STEP, SAVES that destination start in
; BX (critical: `rep movsw` auto-advances BOTH SI and DI by 2 bytes per
; word copied -- Cpu.java's movsw() does `SI+=diff; DI+=diff` on every
; single iteration -- so after the copy, DI no longer points at the start
; of the fresh copy, it points WLEN*2 bytes past it; jumping through the
; post-copy DI/SI lands in unwritten memory and crashes 100% of the time.
; BX is never touched by movsw, so saving the destination start there
; before the copy, and jumping through BX afterward, is what actually
; lands on the fresh copy's first byte). Each new instance repeats
; identically, forever, spreading fresh executable copies across the
; arena. Total cost: 4 one-time instructions + a 7-instruction loop body
; that IS the replication (no separate "overhead" phase -- every
; instruction here is load-bearing for spreading).

%define STEP 0180h      ; bytes of forward spacing between generations

start:
    push cs
    pop es                  ; ES = arena segment (required: movsw dest=ES)
    mov si, ax
    add si, worker - start  ; SI -> this copy's `worker:` label

worker:
    mov di, si
    add di, STEP             ; DI = STEP bytes ahead of current position
    mov bx, di                ; BX = SAVE destination start (movsw never
                                ; touches BX, unlike SI/DI which it advances)
    mov cx, WLEN
    rep movsw                 ; copy WLEN words [si..) -> [di..) (arena) --
                                ; SI and DI both end up WLEN*2 bytes advanced
    mov si, bx                 ; SI = the SAVED start, not the advanced DI
    jmp si                      ; enter the fresh copy at its `worker:`
end_worker:
pad:
    times (end_worker - worker) & 1 db 90h   ; even out to a whole word count
WLEN equ (($ - worker) / 2)
