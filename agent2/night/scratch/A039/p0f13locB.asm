; B084 (night wave 7, domain 4 R4-fix): p0f13 = B064 p0f with the hook cell moved 0CC17h -> 0CC13h.
; Base: rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2); p0f change by B064.
; Effect: (1) both b/d searches use the planted-decoy-immune window 0F EB F9 CC (static/planted EB F9 CC CC
; copies are not preceded by 0Fh); (2) replacement 0F FF 26 13 makes the patched tail jmp [0CC13h], the same cell
; combo_zrl03 / combo_ah02 / zchain4 write once at their instr 3 for their own captured zombies; our write at
; instr 5 (the slot p0f used for [0CC17h]) therefore also steals their captures (B054 fix2steal idea) at zero
; extra instructions. Startup INT 87h stays the 12th instruction.
; A039 (wave 8) adds locB: both b/d searches start at B's own location (startup DI = load address,
; zombie_entry DI = [4A17h]) instead of DI=0; les bp (dummy) keeps ES=1000h without touching DI.
bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.

start:
    mov di, ax
    lea bx, [word di + zombie_entry - start]
    mov [4A17h], bx
    mov [5D13h], bx
    mov [0CC13h], bx        ; B084: hook cell shared with zrl03/ah02/zchain4 (steal), was 0CC17h in p0f
    les bp, [di + es_ptr - start] ; ES=1000h (arena); BP is a dummy, DI keeps the load address (A039)
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
    std
    int 087h
    cld
    mov ax, di
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 10h
    mov al, 0A2h
    lea si, [word di + worker - start]
    jmp short phoenix_init

es_ptr:
    dw 0000h, 01000h

zombie_entry:
    mov di, [4A17h]
    std
    mov bp, 3400h
    jcxz zombie_fallback
    mov bp, 2000h
    push cs
    pop es
    mov ax, 0EB0Fh
    mov dx, 0CCF9h
    mov bx, 0FF0Fh
    mov cx, 01326h
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
