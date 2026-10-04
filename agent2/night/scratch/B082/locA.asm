bits 16

; B082 locA: rev0 (V6nohunt) warrior A with a LOCATION-BASED zom20a capture.
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch);
; this file = agent2 night role B082 edit of agent2/night/revisions/rev0/A.asm.
;
; Weakness addressed (domain 2): A's single INT 87h searched E2 F2 81 C3 forward from 1000:0000,
; so any copy below zom20a (HRZ_Grindo_Holics / GSA_callfart dead-code mimics, INT 86h planters)
; absorbed the capture and the b/d chain behind it.
; Fix: zom20a's first loop iteration stores hi(L*10E1h) to [1243h] (L = its load offset) at its
; 5th instruction = round 3 (Zombie speed 2) and overwrites it only in round 6. A reads it at its
; instruction 4 (round 4, valid for either execution order) and starts the forward search at
; DI = (v1*65536 + junk)/10E1h, which lies in [L-16, L+15]; zom20a's window is at L+2Bh, so the
; first match is zom20a itself. 'and dh,0Fh' keeps DIV from faulting on CCCCh / poisoned values
; (v1 >= 1000h, i.e. L >= ~F2B0h, falls back to a low start, about like rev0).
; INT 87h stays at instruction 10. [4A17h] -> [9769h] copy moves after it (A003 C1 / B072 order).
; Band math in 16-bit DIV form (A024 C2, same AX); phoenix_init still starts at turn 22.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov dx, [1243h]                 ; 4  zom20a's v1 = hi(L*10E1h)
    and dh, 0Fh                     ; 5  no DIV overflow
    div word [si + k10E1 - start]   ; 6  ax = ~L
    xchg ax, di                     ; 7
    les ax, [si + z20a_data - start]; 8  ax = F2E2h, es = 1000h (arena)
    mov dx, 0C381h                  ; 9
    int 087h                        ; 10 E2 F2 81 C3 -> FF 26 17 4A, forward from ~L
    mov ax, [4A17h]                 ; 11
    mov [9769h], ax                 ; 12
    mov ax, si                      ; 13
    xor dx, dx                      ; 14
    mov cx, 03C00h                  ; 15
    div cx                          ; 16
    mul cx                          ; 17
    add ax, 02CA2h                  ; 18
    add si, strict word worker - start ; 19
    nop                             ; 20
    jmp short phoenix_init          ; 21

z20a_data:
    dw 0F2E2h, 01000h
k10E1:
    dw 010E1h

phoenix_init:                       ; 22
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
