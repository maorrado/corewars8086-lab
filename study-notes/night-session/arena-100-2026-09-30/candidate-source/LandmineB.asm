bits 16

; c090-landmine-avoidance / B
; Same single verified-safe change as LandmineA.asm (see the header comment
; there for the full bug-class-by-bug-class safety argument): the one-time
; phoenix_init: "mov sp, di" + "add sp, imm" pair is fused into a single
; "lea sp, [di + imm]". Nothing else differs from the verified-working m050
; baseline. B keeps full active-defense parity with A (same replication
; loop, same worker: body, same copy-count constants) -- per GROUNDING.md's
; scoring note, B surviving is worth exactly as much as A surviving, so B is
; not a stripped-down or passive variant.

%define FAR_SEG  0FFCh
%define PTR_CELL 00240h

start:
    mov si, ax
    push cs
    pop es
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
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
    add ah, 034h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

    times 2 db 0CCh

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, PTR_CELL
    push cs
    pop ss
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    lea sp, [di + 00280h]
    mov cx, 9
    mov dx, 04000h
    mov bp, 04400h
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
