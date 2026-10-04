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
    ; A027 DIAGNOSTIC xyK (Y is killed, not captured) (agent2 edit of Good_Test V6 / V6nohunt, friend-provided base):
    ; location-based b/d chain. A captured zom20b/d has BX = its load address + 3
    ; (its "mov bx,ax; add bx,3" survives the stosw loop) and CX = 0. It publishes
    ; (base+100h) XOR 0CCCCh in arena cell [4A19h] and searches downward from
    ; base+100h, i.e. below its own four EB F9 tails, so its INT 87h reaches the
    ; next b/d zombie (Y) instead of its own dead copies. A captured zom20a
    ; (CX != 0) reads the cell as late as possible: unset cell (CC CC fill) gives
    ; DI = 0 = rev0 behaviour (top-down two-step: B startup killed the top dead
    ; tail, this search takes the live one); a set cell makes zom20a search below
    ; X too, so X and zom20a together do the two-step (dead Y+165h, live Y+14Ch).
    jcxz zombie_bd
    std
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    mov bp, 2000h
    mov di, [4A19h]          ; read late (10th instr) so a captured b/d has published
    xor di, 0CCCCh
    jz zk_go                 ; DIAGNOSTIC: cell unset -> capture as rev0
    xor bx, bx               ; DIAGNOSTIC: cell set -> kill Y (00 00 00 00) instead of capturing it
    xor cx, cx
zk_go:
    int 087h
    jmp short zombie_common

zombie_bd:
    lea dx, [bx + 0FDh]
    xor dx, 0CCCCh
    mov [4A19h], dx
    lea di, [bx + 0FDh]
    std
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
    mov bp, 3400h

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
