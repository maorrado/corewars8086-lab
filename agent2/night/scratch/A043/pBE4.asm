bits 16
%ifndef LANE
%define LANE 010A2h
%endif

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; A043 variant E4 (LANE 010A2h: B anchor = A band + 10h, i.e. both in A's band).
; A043 protocol: B reads A's load address from team-shared ES:[0] (written by A at
; A instr 1) and places its first anchor at hi(A anchor) + LANE (A anchor hi = A band + 2Ch),
; instead of its own band + 10h. ES is saved with push es (replaces push cs) and the arena ES
; comes from les di,[si+es_ptr] (replaces pop es), so [4A17h] stays instr 3 and INT 87h instr 12;
; band math is 16-bit DIV on A's address; phoenix_init on the rev0 turn. Zombie path unchanged.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    push es                 ; A043: save team-shared segment (was push cs)
    mov [5D13h], bx
    les di, [si + es_ptr - start] ; A043: ES = arena 1000h, DI = 0 (was pop es)
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    std
    int 087h
    cld
    pop ds                  ; A043: DS = team-shared
    mov ax, [0]             ; A043: A load address
    push cs
    pop ds
    xor dx, dx
    mov cx, 03C00h
    div cx
    mul cx                  ; A band * 100h (same as rev0 8-bit band math)
    add ax, LANE            ; A043: B anchor = A band + 2Ch + d, low byte A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0, 01000h

zombie_entry:
    xor di, di
    std
    mov bp, 3400h
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    jmp short zombie_search

zombie_fallback:
    mov ax, 070Eh
    mov dx, 170Eh
    mov bl, 0CCh

zombie_search:
    int 087h
    cld
    call get_ip

get_ip:
    pop si
    sub si, strict word get_ip - start
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ax, bp
    mov al, 0A2h
    add si, strict word worker - start

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    mov dx, [4A17h]
    push ss
    pop ds
    mov bx, 0280h
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
    add sp, 00600h
    mov cx, 8
    mov dx, 02400h
    mov bp, 02C00h
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
