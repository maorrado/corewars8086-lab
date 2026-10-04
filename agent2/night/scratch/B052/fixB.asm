bits 16

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
    jmp short phoenix_init

zombie_entry:
    ; B052 fix: a captured zom20b/d (CX=0) no longer plants the 0E 07 0E 17 -> CC counter-bomb;
    ; it repeats the zom20a capture (backward: highest remaining E2 F2 81 C3 -> FF 26 17 4A)
    ; so that a zom20a mimic decoy (HRZ_Grindo_Holics, GSA_callfart) that absorbed A's single
    ; INT 87h no longer costs the zom20a capture. CX!=0 (captured zom20a) path unchanged.
    xor di, di
    std
    push cs
    pop es
    mov bx, 026FFh
    mov bp, 3400h
    mov ax, 0F2E2h
    mov dx, 0C381h
    jcxz zombie_search
    mov bp, 2000h
    mov ax, 0F9EBh
    mov dx, 0CCCCh

zombie_search:
    mov cx, 04A17h
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
