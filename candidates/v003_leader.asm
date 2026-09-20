bits 16

start:
    ; Publish the leader load address to the 1 KiB team segment.
    xor dx, dx
    stosw

team_entry:
    push ds
    pop es
    cmp dx, 1
    je follower_parameters

    mov bp, 1F3Dh
    mov cx, 2B17h
    jmp parameters_ready

follower_parameters:
    mov bp, 0E2B3h
    mov cx, 53E9h

parameters_ready:
    ; Spend the two INT 86h bombs once, then stay in a compact mobile core.
    call locate_once
locate_once:
    pop si
    mov di, si
    add di, cx
    mov ax, 0CCCCh
    mov dx, 0CCCCh
    int 86h
    add di, 8000h
    int 86h

hop:
    call current_ip
current_ip:
    pop si
    sub si, current_ip - hop
    mov di, si
    add di, bp
    mov bx, di
    mov cx, (hop_end - hop + 1) / 2
    rep movsw
    db 09Bh, 09Bh
    jmp bx
hop_end:
    nop

