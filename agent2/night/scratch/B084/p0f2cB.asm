; B084 (night wave 7, domain 4 R4-fix): p0f2c = B064 p0f (private hook cell 0CC17h for our own b/d captures)
; + B054 steal write [0CC13h] (zrl03/ah02/zchain4 cell). UNTESTED (job budget used); proposed answer to the
; shared-cell race of p0f13 (a team that writes [0CC13h] after our instr 5 would receive p0f13's own captures).
; les di,[si+es_ptr] + mov dx,0CCF9h -> les dx,[si+dx_es] (DX=0CCF9h, ES=1000h; DI is still 0 from warrior init),
; which frees the instruction for mov [0CC13h],bx: startup INT 87h stays the 12th instruction. B 212 B.
; Base: rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2); p0f change by B064.
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
    mov [0CC13h], bx        ; B084: steal zrl03/ah02/zchain4 captured zombies
    les dx, [si + dx_es - start] ; B084: DX=0CCF9h, ES=1000h (arena); DI=0 from init
    mov ax, 0EB0Fh
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

dx_es:
    dw 0CCF9h, 01000h

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
