bits 16
; B083 poisonE counter-code (local simulator only): B073 poisoner with the [4A17h] write moved to
; instr 3 AND 4, so it also wins the 1-round A channel (B writes [4A17h] round 3, A reads round 4)
; whatever the round order. Targets residual exposure of bodycell fixes. Base text follows.
; B073 counter-code (local simulator only), derived from B051 cMovsw = rev0 (Good_Test V6 friend-provided,
; V6nohunt edit) in the MOVSW family. poison = ctl + B steals [4A17h] instead of writing [5D13h]. ctl: own hook cell moved 4A17h -> 7B2Dh (no sharing with rev0).
; the MOVSW family: target IP xxA3 so the pushed IP word low byte A5 (MOVSW) lands on the anchor (in-page 53h).

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.

start:
    mov si, ax
    lea bx, [word si + zombie_entry - start]
    mov [4A17h], bx   ; POISON-E: round 3 (after or level with the target B write)
    mov [4A17h], bx   ; POISON-E: round 4 (before the target A read if this team runs first)
    les di, [word si + arenaptr - start] ; ES=1000h, DI=0 (was push cs/pop es), keeps INT87 at instr 12
    mov [7B2Dh], bx
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 07B2Dh
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
    mov al, 0A3h
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
    mov cx, 07B2Dh
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
    mov al, 0A3h
    add si, strict word worker - start

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    mov dx, [7B2Dh]
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
