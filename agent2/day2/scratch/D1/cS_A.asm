; D1 (agent2 day2 role D1, base rev1 KPHL) variant cS: coupled phoenix with a V6-compatible template.
; Good_Test V6 is friend-provided code (warrior 1/2 reconstructed in study-notes/good-test-v6/source/);
; V6nohunt and all night edits are agent2 roles (see agent2/night/FINDINGS.md); this edit is agent2 day2 D1.
; Mechanism (trace dayTR-1e9efbcb54-dd73fad407, emulator agent2/day2/scratch/D1/absim.mjs reproduces the traced
;   self-kill rounds 32598/52953/65875/69725/109868/114282): the worker's sub sp,dx carries the SP excess of an EARLY
;   trigger into the next generation (d_new = d_trig + trail), so B and the captured zombies run decoupled ('free')
;   fronts that trail A's front by 4-80 bytes when A self-triggers and overwrite A's worker during its rebuild.
; Change: after V6's unchanged worker prefix (sub sp,dx .. dec di, byte-identical so co-anchored V6-family and
;   own rebuilds still write the same bytes at P+4..P+15), one lea re-derives SP from the new anchor every
;   generation: SP = BX + DI (+d8) with DI = new IP + 1 and the private cell BX placed so that SP = anchor + trail.
;   A, B and captured zombies share one byte-identical template (only the private cell offset differs).
; COMBINE (night combination coordinator, 2026-10-04, base rev0): KPHL = KP + h34 (B099 KPH_B) + locpatA (B092 KL_A). A = KL_A unchanged; B = B099 KPH_B.
; Good_Test V6 is friend-provided code; V6nohunt and all night edits by agent2 roles (see FINDINGS.md).
bits 16

; B092 KL (warrior A): A031 K (E1 INT86 decoy block + A022 SD template edits) combined with the
; domain-2 defense A038 locpatA (B082 location start DI = 15*[1243h] + A038 window F2 81 C3 E1 -> FF 26 17 4A).
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch); E1/SD/locA2/locpatA are
; agent2 night edits (A031, A022, B082, A038); this merge = agent2 night role B092.
; Turn budget: locpatA startup (INT87 at instr 11) + E1 block (4 instr) + band math with a memory divisor
; (div/mul word [kq] instead of mov cx,3C00h; div cx; mul cx: same AX, one instruction fewer) + add si;
; phoenix_init still starts at turn 22 (as in rev0, K and locpatA). Data moved to the end (no jmp needed).
; B = A031 K_B (A026 Z1 + SD) unchanged.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov ax, [1243h]                 ; 4  zom20a's v1 = hi(L*10E1h)
    mov dx, [4A17h]                 ; 5
    mov [9769h], dx                 ; 6  Registered_Winners hook cell
    mul word [si + k15 - start]     ; 7  ax = 15*v1
    xchg ax, di                     ; 8
    les ax, [si + z20a_data - start]; 9  ax = 81F2h, es = 1000h (arena)
    mov dx, 0E1C3h                  ; 10
    int 087h                        ; 11 F2 81 C3 E1 -> FF 26 17 4A, forward from DI
    mov di, 0FF80h                  ; 12 E1: 64 x FF 1F CC CC at 0FF80h..007Fh
    mov ax, 01FFFh                  ; 13
    mov dx, 0CCCCh                  ; 14
    int 086h                        ; 15
    mov ax, si                      ; 16 band math: floor(si/3C00h)*3C00h + 2CA2h
    xor dx, dx                      ; 17
    div word [si + kq - start]      ; 18
    mul word [si + kq - start]      ; 19
    add ax, 02CA2h                  ; 20
    add si, strict word worker - start ; 21

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 11              ; D1: template copy 22 bytes (worker grew)
    rep movsw
    push ss
    pop ds
    mov bx, 003ACh             ; D1: cell offset sets A's trail (400h) via lea
    push cs
    pop ss
    mov [bx], ax
    and dx, 0
    or dx, 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    mov sp, di
    add sp, 00100h
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
    mov ax, 01FFFh
    stosw
    dec di
    call far [bx]
worker:
    movsw
    rep movsw
    sub sp, dx
    sub [bx], bp
    mov di, [bx]
    mov cl, 9
    xor si, si
    stosw
    dec di
    lea sp, [bx + di + 3]   ; D1: SP = cell(BX) + new IP + 1 + 3 = anchor + trail (coupled)
    call far [bx]
    db 0CCh, 0CCh

zombie_entry:
    mov bx, ax
    mov dx, 0CCCCh

zombie_scan:
    add bx, 00100h
    cmp word [bx], 0CCCCh
    je short zombie_scan

    mov cl, 4

candidate_check:
    mov al, [bx + 1]
    sub al, 0Fh
    cmp al, 10h
    ja short next_candidate
    mov si, [bx]
    cmp si, 0FFCh
    je short next_candidate
    cmp si, [bx + 4]
    je short found_candidate

next_candidate:
    inc bx
    loop candidate_check
    jmp short zombie_scan

found_candidate:
    mov di, [bx - 2]
    sub si, 01000h
    add si, si
    add si, si
    add si, si
    add si, si
    sub di, 2
    add di, si
    mov [di], dx
    jmp short zombie_scan

z20a_data:
    dw 081F2h, 01000h
k15:
    dw 15
kq:
    dw 03C00h
