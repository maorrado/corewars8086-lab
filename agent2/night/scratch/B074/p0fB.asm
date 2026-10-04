; B064 (night wave 3, domain 4): rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2)
; change p0f: both b/d searches use the decoy-immune window 0F EB F9 CC (the byte before every
; zom20b/d tail is 0Fh = high byte of add di,0FFEh; planted/static field decoys are preceded by CC/A5/0B/F9),
; replacement 0F FF 26 17 -> tail becomes jmp [0CC17h] (tail+3 stays CCh); zombie_entry also written to [0CC17h].
; push cs/pop es replaced by les di,[si+es_ptr] (dw 0,1000h) so the startup INT 87h stays the 12th instruction.
bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC17h], bx        ; B064: hook cell for the 0F EB F9 CC capture
    les di, [si + es_ptr - start] ; B064: ES=1000h (arena), DI=0 (as before)
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01726h
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
    std
    mov bp, 3400h
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01726h
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
