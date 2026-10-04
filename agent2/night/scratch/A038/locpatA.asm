; A038 locpatA (warrior A only; B = rev0): B082 locA2 (location-based zom20a search start from [1243h])
; plus the A038 window change E2 F2 81 C3 -> F2 81 C3 E1 (replacement FF 26 17 4A at zom20a+2Ch; loop E2 F2 -> E2 FF
; jumps into the patch). Location start answers Grindo copies; the window answers callfart mimics (which also
; poison [1243h]). Timing identical to locA2.
bits 16

; B082 locA2 (warrior A only; B stays rev0): rev0 (V6nohunt) warrior A with a LOCATION-BASED
; zom20a capture. Second version: keeps the [4A17h] -> [9769h] copy early (instr 5-6) after
; screen 62gpp showed the late copy of locA (instr 11-12) losing s2025-9 (Registered_Winners
; captures with INT 87h at its instr 9/11 and calls [9769h]).
; Provenance: Good_Test V6 warrior 1 is friend-provided code (reconstructed source in
; study-notes/good-test-v6/source/); V6nohunt = agent2 edit (removed [7A00h] patch);
; this file = agent2 night role B082 edit of agent2/night/revisions/rev0/A.asm.
;
; Weakness (domain 2): A's single INT 87h searched E2 F2 81 C3 forward from 1000:0000, so any
; copy below zom20a (HRZ_Grindo_Holics / GSA_callfart dead-code mimics, INT 86h planters)
; absorbed the capture and the b/d chain behind it.
; Fix: zom20a stores v1 = hi(L*10E1h) to [1243h] (L = its load offset) at its 5th instruction
; = round 3 (Zombie speed 2) and overwrites it only in round 6. A reads it at instruction 4
; (valid for either execution order) and starts the forward search at DI = 15*v1 (MUL never
; faults): L-DI is in [12, 723] for every legal L, less than the 1024-byte load gap, so no other
; warrior's initial code lies between DI and zom20a's window at L+2Bh. Garbage / poisoned
; [1243h] (TrojanByte2 writes 2934h in round 3; CCCCh without zom20a) only moves the start.
; INT 87h moves from instruction 10 to 11. Band math in 16-bit DIV form (A024 C2, same AX);
; phoenix_init still starts at turn 22.

start:
    mov si, ax                      ; 1
    mov bx, 026FFh                  ; 2
    mov cx, 04A17h                  ; 3
    mov ax, [1243h]                 ; 4  zom20a's v1 = hi(L*10E1h)
    mov dx, [4A17h]                 ; 5
    mov [9769h], dx                 ; 6  Registered_Winners hook cell (rev0: instr 5)
    mul word [si + k15 - start]     ; 7  ax = 15*v1 (L-723 .. L-12)
    xchg ax, di                     ; 8
    les ax, [si + z20a_data - start]; 9  ax = 81F2h, es = 1000h (arena)
    mov dx, 0E1C3h                  ; 10
    int 087h                        ; 11 F2 81 C3 E1 -> FF 26 17 4A, forward from DI
    mov ax, si                      ; 12
    xor dx, dx                      ; 13
    mov cx, 03C00h                  ; 14
    div cx                          ; 15
    mul cx                          ; 16
    add ax, 02CA2h                  ; 17
    add si, strict word worker - start ; 18
    nop                             ; 19
    nop                             ; 20
    jmp short phoenix_init          ; 21

z20a_data:
    dw 081F2h, 01000h
k15:
    dw 15

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
