bits 16

start:
    ; ES initially names the 1 KiB group-shared segment. Publish our load
    ; address before either teammate leaves that segment.
    xor dx, dx
    stosw

core_loop:
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
    ; Each CPU spends its two wide bombs in complementary regions.
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

clone:
    call get_ip
get_ip:
    pop si
    sub si, get_ip - clone
    mov di, si
    add di, bp
    mov bx, di
    mov cx, 0020h
    rep movsw

    ; Attack away from the landing zone without damaging the new copy.
    mov di, bx
    add di, 1111h
    mov ax, 0CCCCh
    mov cx, 0020h
    rep stosw
    db 09Bh, 09Bh
    jmp bx
clone_end:
