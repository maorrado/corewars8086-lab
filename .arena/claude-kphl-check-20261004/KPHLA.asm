bits 16
; User-pasted Claude KPHL, separated from the interleaved B block.
; Friend-provided V6 base, Claude research edits. No strategy changes here.
start:
    mov si, ax
    mov bx, 026FFh
    mov cx, 04A17h
    mov ax, [1243h]
    mov dx, [4A17h]
    mov [9769h], dx
    mul word [si + k15 - start]
    xchg ax, di
    les ax, [si + z20a_data - start]
    mov dx, 0E1C3h
    int 087h
    mov di, 0FF80h
    mov ax, 01FFFh
    mov dx, 0CCCCh
    int 086h
    mov ax, si
    xor dx, dx
    div word [si + kq - start]
    mul word [si + kq - start]
    add ax, 02CA2h
    add si, strict word worker - start
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
