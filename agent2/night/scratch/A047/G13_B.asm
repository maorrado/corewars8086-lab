; A047 (night wave 10): G13 B = B084 p0f13 B (rev0 B = Good_Test V6 warrior 2, friend-provided; p0f/p0f13 window
; and [0CC13h] cell by B064/B084) with zchain4's zombie chain grafted in:
;   captured b/d (CX=0 path) spends its INT 87h on zom20a's unique live-loop bytes 41 93 E2 F2 -> FF 26 17 4A
;   (jmp [4A17h], before inc cx, so zom20a arrives with CX=1 -> CX!=0 path);
;   captured zom20a (CX!=0 path) takes over the old 0E070E17 -> CC counter-bomb (was on the b/d path).
;   Lattice phases unchanged: b/d bp 3400h, zom20a bp 2000h.
bits 16

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx
    les di, [si + es_ptr - start]
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
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
    add ah, 10h
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init

es_ptr:
    dw 0000h, 01000h

zombie_entry:
    xor di, di
    push cs
    pop es
    mov bp, 2000h
    jcxz zombie_chain
    std
    mov ax, 070Eh
    mov dx, 170Eh
    mov bl, 0CCh
    jmp short zombie_search

zombie_chain:
    mov bp, 3400h
    mov ax, 09341h
    mov dx, 0F2E2h
    mov bx, 026FFh
    mov cx, 04A17h

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
