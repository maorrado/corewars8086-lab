bits 16
; B067 counter-code (domain 7): generic far-call trail hunter, standalone.
; The scan/bomb loop is the zombie_scan routine of Good_Test V6 warrior 1
; (friend-provided; agent2 label form in agent2/night/revisions/rev0/A.asm),
; run directly from startup instead of through V6's [7A00h] redirect.
; Detects two equal words W at x and x+4 with high byte 0Fh..1Fh (a pushed CS
; word of a call-far trail), takes the IP word at x-2 and bombs the anchor
; linear(W:IP-2) with CCCCh.
start:
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
