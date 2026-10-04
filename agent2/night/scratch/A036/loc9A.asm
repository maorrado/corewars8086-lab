bits 16

; A036 loc9 warrior A (B = loc9B.asm). Edit of agent2/night/revisions/rev0/A.asm (V6nohunt).
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch);
; location-based start = idea of night role B082 (locA2); this file = night role A036.
;
; Goal: zom20a capture at a fixed, earlier round AND a decoy-proof start point.
; zom20a (2 opcodes/round) executes its live `loop` (E2 F2) in rounds 4,7,10,13,...
; rev0 patches in round 10 -> capture in round 10 (A before zom20a) or 13 (zombies first).
; Here INT 87h is instr 9 -> capture in round 10 for both execution orders.
; zom20a stores v1 = hi(L*10E1h) to [1243h] in round 3 (valid in rounds 4-5); DI = 15*v1 lies
; 12..723 bytes below zom20a (B082), so lower decoys (Grindo/callfart/INT86 planters) are skipped.
; The [4A17h] -> [9769h] copy (Registered_Winners hook) moved to warrior B (instr 4, round 4).
; Band math unchanged (rev0 8-bit form); one nop keeps phoenix_init at turn 22 as in rev0.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov ax, [1243h]                 ; 4  v1 = hi(L*10E1h) (zom20a, round 3)
    mul word [si + k15 - start]     ; 5  ax = 15*v1, dx = 0
    xchg ax, di                     ; 6
    les ax, [si + z20a_data - start]; 7  ax = F2E2h, es = 1000h (arena)
    mov dx, 0C381h                  ; 8
    int 087h                        ; 9  E2 F2 81 C3 -> FF 26 17 4A (jmp [4A17h]), forward from DI
    mov ax, si                      ; 10
    mov al, ah                      ; 11
    xor ah, ah                      ; 12
    mov ch, 03Ch                    ; 13
    div ch                          ; 14
    mul ch                          ; 15
    mov ah, al                      ; 16
    add ah, 02Ch                    ; 17
    mov al, 0A2h                    ; 18
    add si, strict word worker - start ; 19
    nop                             ; 20
    jmp short phoenix_init          ; 21

z20a_data:
    dw 0F2E2h, 01000h
k15:
    dw 15

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    mov dx, [4A17h]
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
