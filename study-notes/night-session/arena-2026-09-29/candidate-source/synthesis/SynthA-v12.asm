bits 16

; Synthesis A v12 (v9 base + retargeting a previously-wasted offensive
; search, a genuinely NEW mechanism, not a timing/parameter tweak).
;
; start:'s FIRST int87h call (before phoenix_init: even runs) searches
; the shared arena segment (confirmed ES=CS=ARENA_SEGMENT=0x1000 at this
; point, per War.java:21) for a 4-byte pattern and patches any match to
; "jmp [0x5D13]" -- 0x5D13 is the SAME fixed cell this warrior's own
; "mov [05D13h],bx" (line 70 above) just wrote its zombie_entry: address
; into, so any hijacked warrior gets redirected into THIS team's own
; zombie-capture logic. This is a genuine offensive/recruitment
; primitive, distinct from worker:'s own self-anchor-maintenance
; mechanism (which has no int87h call at all).
;
; PROBLEM FOUND: the original search pattern (AX=0F9EBh, DX=0CCCCh ->
; memory bytes EB F9 CC CC, a short backward jump sitting in still-
; blank arena filler) was verified (byte-scanned every file in
; official-2025/survivors-online + survivors-online-young, 150 files
; total) to match ZERO real 2025 opponents. This call was running every
; single battle for free (INT87h is round-cost-free regardless of hit,
; per Cpu.java:2153-2177) but never actually finding anything -- pure
; wasted potential, not a bug, just an unexploited opportunity.
;
; RETARGETED to a pattern that DOES appear in the real field: byte-
; scanned for what commonly follows this lineage's own "FF 1F" anchor
; byte pattern (call far [bx], the SAME replication mechanism this
; whole codebase uses) across the real field, and found 83/150 files
; (55%!) contain "FF 1F" somewhere, with "FF 1F 90 90" (anchor followed
; by two NOP bytes) being the single most common exact 4-byte variant
; (24/150 files). New pattern: AX=01FFFh, DX=09090h (memory bytes
; FF 1F 90 90). Replacement (BX=026FFh, CX=05D13h) is UNCHANGED --
; still hijacks into this warrior's own zombie_entry:.
;
; SAFETY VERIFICATION (critical given int87h has no self-exclusion --
; confirmed from Cpu.java source, it blindly matches wherever found):
; scanned this warrior's OWN compiled bytes (both A and B) for every
; "FF 1F" occurrence and what follows each one -- found "ab4f", "a5f3",
; or end-of-file, NEVER "9090". Also verified via timing: this search
; runs BEFORE phoenix_init:'s first "stosw" (the very first byte this
; warrior ever writes into the arena), so at the moment of the search,
; nothing of THIS warrior's own anchor exists in the arena yet -- only
; its own static CS-resident bytes are scannable (since ES=CS here),
; and those were already confirmed pattern-free. No self-hijack risk.
;
; Cost: ZERO extra bytes, ZERO extra rounds -- this call already ran
; every battle regardless; only its 2 immediate operand values changed.
;
; Synthesis A v9 (v6 base + m050's one-instruction bootstrap timing fix).
;
; m050 (a Codex research variant) was found tonight to score HIGHER than
; m049 on the solo-vs-field screen (0.6723 vs 0.6674, +0.73%) despite
; losing convincingly when tested crowded together with m049+v6 in the
; same arena -- the crowded test measures something different (3-strong-
; competitor collision survival), not raw solo quality. Diffing m050
; against m049 (byte-identical file sizes, 189/117, both unchanged)
; revealed the ENTIRE functional difference is: one redundant "xor di,di"
; removed from start: (m049 sets DI via "mov di,ax"/"add di,..." then
; immediately re-zeroes it 2 instructions later before DI is ever read --
; a genuine dead no-op), with a register swap (DI->BX for the zombie-
; entry-offset computation, which does not affect any later logic since
; BX gets overwritten by the int87h search's own "mov bx,026FFh" before
; zombie_entry: ever runs) and 2 inert "times 2 db 0CCh" filler bytes to
; preserve every downstream label's byte offset exactly. This removes
; exactly one opcode from the one-time bootstrap (never repeated -- it's
; not in worker:), saving exactly one engine round per the established
; turn-timing model (one opcode = one round, no variable-cost model).
;
; This v9 applies the IDENTICAL fix on top of v6's already-fixed worker:
; (the DX-persistence bug fix, unchanged from v6 below), to test whether
; m050's timing edge and v6's tournament-combat edge are independent and
; additive.
;
; ROOT CAUSE of the SEPARATE v3/v5 crash bug this file also fixes
; (confirmed via systematic-debugging, not guessed): v3 and v5
; both inserted "mov dx, <delta>" inside worker: to give the xor-toggle a
; delta DIFFERENT from candidate-1's stack-gap constant (dx=0x3800, reused
; for both "sub sp,dx" and "xor bp,dx"). But "call far [bx]" does NOT
; re-run the bootstrap between generations -- it transfers control with
; whatever register state existed at the jump. So from worker: pass 2
; onward, DX holds the LEFTOVER delta value, not the original 0x3800
; stack-gap constant, corrupting every subsequent "sub sp,dx". This
; explains why v3 (delta=0x0800) and v5 (delta=0x1000) crashed at the
; IDENTICAL round (226/255) with the IDENTICAL corrupted-anchor byte
; signature despite using different delta magnitudes: the bug was never
; about magnitude, it was about DX itself being clobbered and inherited.
;
; FIX: use an immediate operand ("xor bp, 02000h", 4 bytes) instead of a
; register ("xor bp, dx", 2 bytes) for the toggle. This costs +2 bytes
; over candidate-1 but means DX is NEVER written inside worker: -- it
; stays permanently at its one-time bootstrap value (0x3800) for "sub
; sp,dx" on every single generation, forever. No register is clobbered
; across the call far [bx] boundary, so there is nothing to inherit
; incorrectly.
;
; Delta choice: 0x2000 (zero low byte, preserving candidate-1's documented
; AL-sweep-safety invariant -- see RotAnchorA.asm's comment on why a
; nonzero low byte previously caused a catastrophic 0.06-vs-0.78
; regression). Alt stride = 0x3C00 xor 0x2000 = 0x1C00, a ratio of 46.7%
; to the primary -- a genuine midpoint between candidate-1's extreme 6.7%
; (diagnostically isolated as costing ~66% of its -13.8% screen
; regression via magnitude mismatch) and a 1:1 ratio.
;
; Byte-length coupling: worker: grows from candidate-1's 19 bytes to 21
; bytes (the imm16 xor costs 2 bytes more than the register form). Copy
; count bumped cx=10/cl=10 -> cx=11/cl=11 (22-byte budget, 1 spare byte,
; preserving the same margin convention candidate-1 used) in all three
; coupled sites: phoenix_init, captured_init, and worker:'s own cl reload.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h

start:
    mov si, ax
    mov bx, ax
    add bx, zombie_entry - start
    mov [05D13h], bx
    push cs
    pop es
    mov ax, 01FFFh
    mov dx, 09090h
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh

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
    add ah, 054h
    mov al, 0A2h
    add si, worker - start

captured_init:
    push ss
    pop es
    xor di, di
    mov cx, 11
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    push cs
    pop ss
    jmp short phoenix_pointer_ready

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 11
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
    add sp, 00200h
    mov cx, 9
    mov dx, 03800h
    mov bp, 03C00h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]

worker:
    movsw
    rep movsw
    sub sp, dx
    xor bp, 02000h
    sub [bx], bp
    mov di, [bx]
    mov cl, 11
    xor si, si
    stosw
    dec di
    call far [bx]
