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
    ; A033 (agent2 edit of Good_Test V6 / V6nohunt, friend-provided base; builds on
    ; A027 xyB). Charge budget per battle: A, B, captured zom20a, each captured b/d =
    ; one INT 87h each. With no earlier tail consumer (k=0) the upper zombie X costs
    ; two charges (B: dead X+165h, zom20a: live X+14Ch) and the lower zombie Y would
    ; need two more, so Y is only reachable when an opponent consumed X+165h (k=1):
    ; B takes X+14Ch, X publishes its base and searches below itself, zom20a searches
    ; from the published base; together they hit Y+165h and Y+14Ch.
    ; A033 change vs xyB: the published cell doubles as an order flag (xchg reads the
    ; old value in the same instruction slot as xyB's mov). The SECOND captured b/d (Y)
    ; does not repeat the b/d search; it spends its charge on rev0's 0E070E17 -> CC
    ; counter-bomb and runs its phoenix on its own lattice offset (bp 9400h) so X and Y
    ; never share an anchor (A027 collision hypothesis).
    jcxz zombie_bd
    std
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    mov bp, 2000h
    mov di, [4A1Bh]          ; CONTROL yC: never-written cell -> DI=0 (rev0 top-down), Y never captured
    xor di, 0CCCCh
    int 087h
    jmp short zombie_common

zombie_bd:
    lea bp, [bx + 0FDh]
    xor bp, 0CCCCh
    xchg [4A19h], bp         ; publish (same slot as xyB), bp = previous cell value
    cmp bp, 0CCCCh
    jne zombie_second
    lea di, [bx + 0FDh]
    std
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
    mov bp, 3400h
    jmp short zombie_common

zombie_second:
    xor di, di
    std
    mov ax, 070Eh
    mov dx, 170Eh
    mov bl, 0CCh
    int 087h
    mov bp, 9400h

zombie_common:
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
