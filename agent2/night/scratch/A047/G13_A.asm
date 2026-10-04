; A047 (night wave 10): G13 A = rev0 A (Good_Test V6 warrior 1, friend-provided; V6nohunt = [7A00h] patch removed by agent2)
; with zchain4's zombie-chain ordering grafted in:
;   A no longer captures zom20a (that is now done by the captured zom20b/d via 41 93 E2 F2, see G13_B.asm).
;   A's INT 87h instead joins B on the b/d tails: decoy-immune window 0F EB F9 CC (backward from DI=0),
;   replacement 0F FF 26 13 -> patched tail runs jmp [0CC13h] (cell written by B at its instr 5).
;   A (instr 10) and B (instr 12) together convert the top two tails (dead copy + live loop tail) of the
;   higher b/d, so the live b/d is captured at round ~12 without needing zom20a.
; Turn-neutral: push cs/pop es -> les di (-1), std (+1), no-op jmp short -> cld (0). INT87 stays instr 10,
; phoenix_init on rev0's turn. rev0's dead zombie_entry/zombie_scan tail kept (layout control).
bits 16

start:
    mov si, ax
    les di, [si + es_ptr - start]
    mov ax, [4A17h]
    mov [9769h], ax
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 02Ch
    mov al, 0A2h
    add si, strict word worker - start
    cld

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

es_ptr:
    dw 0000h, 01000h

; rev0 dead code kept unchanged (layout control; nothing reaches it)
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
