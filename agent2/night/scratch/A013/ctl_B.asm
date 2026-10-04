bits 16
; A013 variant ctl: captured zombies (speed 2) use DX 02400h, BP 02C00h; B main path keeps DX 2400h / BP 2C00h.
; Base: rev0 V6nohunt B (Good_Test V6 friend-provided, small agent2 edits).

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    push cs
    mov [5D13h], bx
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
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
    mov dx, 02400h
    mov bp, 02C00h
    jmp short phoenix_init

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
    mov dx, 02400h
    mov bp, 02C00h

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    mov cx, [4A17h]
    push ss
    pop ds
    mov bx, 0280h
    push cs
    pop ss
    mov [bx], ax
    and cx, 0
    or cx, 0FFBh
    mov [bx + 2], cx
    xor si, si
    mov di, ax
    mov es, cx
    mov sp, di
    add sp, 00600h
    mov cx, 8
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
