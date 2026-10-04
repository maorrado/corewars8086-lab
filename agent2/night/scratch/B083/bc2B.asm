bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; B083 bc2 (night wave 7, domain 3 defense): the b/d hook cell moves into B's own body
; (cellB = zombie_entry); zombie_entry's mov cx,04A17h immediate is self-patched to cellB right
; after the startup INT 87h, so captured zom20a also hooks b/d tails through cellB.
; [4A17h] is still written at instr 3 (channel to A, and theft vs the V6 family); [5D13h] still instr 5.
; Timing-neutral vs rev0: push cs/pop es -> les di,[si+arenaptr] (ES=1000h, DI=0); band math
; 9 -> 8 instr (xchg al,ah; add ax,10A2h gives the same AX incl. the F000h wrap);
; INT 87h still instr 12, phoenix_init still turn 25. Zombie paths unchanged.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx
    les di, [word si + arenaptr - start] ; B083: ES=1000h (arena), DI=0 (was push cs/pop es)
    mov [5D13h], bx
    mov [word si + cellB - start], bx    ; B083: cellB = zombie_entry
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    lea cx, [word si + cellB - start]    ; B083: b/d tail -> jmp [cellB]
    std
    int 087h
    cld
    mov [word si + zcx - start + 1], cx  ; B083: zombie path hooks via cellB too
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    xchg al, ah                          ; B083: AX = q*3C00h
    add ax, 010A2h                       ; B083: same AX as rev0 mov ah,al / add ah,10h / mov al,0A2h
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
zcx:
    mov cx, 04A17h                       ; B083: immediate patched to cellB at startup
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

arenaptr:
    dw 00000h, 01000h
cellB:
    dw 0CCCCh
