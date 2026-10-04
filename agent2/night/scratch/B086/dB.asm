bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; B086 night variant dB: 54-byte decoy copy of the late phoenix_init/worker bytes behind the startup jmp.

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

b_decoy:   ; B086: dead decoy copy of B bytes 8Fh..0C4h (never executed)
    db 0x0e, 0x17, 0x89, 0x07, 0x83, 0xe2, 0x00, 0x81, 0xca, 0xfb, 0x0f, 0x89, 0x57, 0x02, 0x31, 0xf6
    db 0x89, 0xc7, 0x8e, 0xc2, 0x89, 0xfc, 0x81, 0xc4, 0x00, 0x06, 0xb9, 0x08, 0x00, 0xba, 0x00, 0x24
    db 0xbd, 0x00, 0x2c, 0xb8, 0xff, 0x1f, 0xab, 0x4f, 0xff, 0x1f, 0xa5, 0xf3, 0xa5, 0x29, 0xd4, 0x29
    db 0x2f, 0x8b, 0x3f, 0xb1, 0x09, 0x31

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
