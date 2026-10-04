; B088 (wave 8, domain 8 R4-fix): per-battle mixed anchor lattice.
; Base: rev0 = V6nohunt (Good_Test V6, friend-provided; [7A00h] patch removed by agent2).
; Change: phoenix_init "and dx,0 / or dx,0FFBh" -> "and dx,3 / or dx,0FF8h". DX was already
; loaded from [4A17h] (= our B zombie_entry address, random per battle, shared by A, B and
; captured zombies), so FAR_SEG = 0FF8h..0FFBh and the anchor lattice = 22h/32h/42h/52h,
; same choice for the whole team. Zero bytes, zero turns. Defense vs a page-lattice CC bomber
; tuned to in-page 52h (B058 pg52): any single-offset bomber now hits 1/4 of battles.
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
    and dx, 3
    or dx, 0FF8h
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
