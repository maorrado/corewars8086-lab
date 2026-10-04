bits 16

; Good_Test V6 warrior 1 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; agent2 variant: removed the [7A00h] redirect patch (ablation)
; B083 bc2 (night wave 7, domain 3 defense): the zom20a hook cell moves into A's own body
; (cellA holds B's zombie_entry, read from [4A17h] at instr 4 as in rev0), so a later write
; to the fixed cell [4A17h] can no longer redirect A's captured zom20a.
; Timing-neutral vs rev0: push cs/pop es -> one les di,[si+arenaptr] (ES=1000h, DI=0 as before);
; the freed slot holds lea cx,[si+cellA]. [4A17h] read still instr 4, [9769h] write still instr 5,
; INT 87h still instr 10, phoenix_init still turn 22.

start:
    mov si, ax
    les di, [word si + arenaptr - start] ; B083: ES=1000h (arena), DI=0 (was push cs/pop es)
    lea cx, [word si + cellA - start]    ; B083: hook cell inside own body
    mov ax, [4A17h]
    mov [9769h], ax
    mov [word si + cellA - start], ax    ; B083: cellA = B's zombie_entry
    mov ax, 0F2E2h
    mov dx, 0C381h
    mov bx, 026FFh
    int 087h                             ; zom20a loop end -> jmp [cellA]
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 02Ch
    mov al, 0A2h
    add si, strict word worker - start
    jmp short phoenix_init

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    mov dx, [4A17h]
    push ss
    pop ds
    mov bx, 002C0h
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
    add sp, 00100h
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

zombie_entry:
    mov bx, ax
    mov dx, 0CCCCh

zombie_scan:
    add bx, 00100h
    cmp word [bx], 0CCCCh
    je short zombie_scan

    mov cl, 4

candidate_check:
    mov al, [bx + 1]
    sub al, 0Fh
    cmp al, 10h
    ja short next_candidate
    mov si, [bx]
    cmp si, 0FFCh
    je short next_candidate
    cmp si, [bx + 4]
    je short found_candidate

next_candidate:
    inc bx
    loop candidate_check
    jmp short zombie_scan

found_candidate:
    mov di, [bx - 2]
    sub si, 01000h
    add si, si
    add si, si
    add si, si
    add si, si
    sub di, 2
    add di, si
    mov [di], dx
    jmp short zombie_scan

arenaptr:
    dw 00000h, 01000h
cellA:
    dw 0CCCCh
