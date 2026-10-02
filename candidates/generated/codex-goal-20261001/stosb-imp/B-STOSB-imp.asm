bits 16

; Research only: pair with the exact m050 A binary, unchanged.
; Preserve m050 B's opener through CLD, including its INT87 timing.
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

    ; CS=ES remains the arena segment; SI still holds B's load offset.
    ; Launch 512 bytes ahead, beyond this <=256-byte source image.
    ; STOSB seeds AA at BX and leaves DI=BX+1 before JMP BX.
    lea bx, [si + 0200h]
    mov di, bx
    mov al, 0AAh
    stosb
    jmp bx

    ; Each executed AA writes the next AA one byte ahead of execution.
    ; CLD makes DI advance by one, matching the one-byte IP advance.
    ; Both offsets wrap within the same arena segment at FFFF -> 0000.
    ; No immunity is implied: an enemy may overwrite the next byte before
    ; it executes; this linear trail may overwrite our A/captured Zombie.
    ; After a full lap it also overwrites its own old source/trail.
    ; The process neither checks damage nor restores corrupted registers.

    ; Size is verified after assembly by generate-screen.mjs: exactly 31 bytes,
    ; within the 256-byte limit. The bundled NASM rejects the relational TIMES
    ; guard, so no size-assertion expression or padding is emitted here.
