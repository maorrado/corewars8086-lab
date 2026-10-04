; D5 (day2, 2026-10-04): A8C = rev1 A with the band phase 2Ch -> 8Ch (one immediate, 0 bytes, 0 turns).
; Reason: D5 family simulator with our captured zom20a stream (speed 2, start jitter): A deaths from own B/zombie
; trails drop strongly vs 2Ch. Screen ruhbb (phase 34h) showed zombie kills dominate. Good_Test V6 attribution below kept.
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
    mov ax, si                      ; 16 band math: floor(si/3C00h)*3C00h + 8CA2h (D5)
    xor dx, dx                      ; 17
    div word [si + kq - start]      ; 18
    mul word [si + kq - start]      ; 19
    add ax, 08CA2h                  ; 20 D5: A band phase 2Ch -> 8Ch (own-pair + own-zombie crossfire)
    add si, strict word worker - start ; 21

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 10
    rep movsw
    push ss
    pop ds
    mov bx, 002C0h
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
