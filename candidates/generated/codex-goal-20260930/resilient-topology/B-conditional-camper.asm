bits 16

; Research only. Pair with the exact m050 Warrior A.
; B keeps m050's useful INT 87h Zombie redirect, then parks at a tiny
; conditional self-loop instead of building a stack-driven FF 1F chain.
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

    ; Quantize the load address as in m050, but keep the small resident loop
    ; at least 0x3900 bytes ahead of the source at every legal load offset.
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 074h
    mov al, 0A2h

    ; The private stack is writable but not executable. Use it only for the
    ; stable far pointer; the two-byte loop itself lives in the arena.
    push ss
    pop ds
    mov bx, PTR_CELL
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax

    ; STOSW, MOV and the indirect far JMP leave ZF unchanged. Therefore
    ; 74 FE is JZ -2 forever, with no stack write or moving worker body.
    xor cx, cx
    mov ax, 0FE74h
    stosw
    jmp far [bx]
