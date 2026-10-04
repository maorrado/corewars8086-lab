bits 16

; Good_Test V6 warrior 2 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; A044 (night wave 9): self-harm guard on the [4A17h]/[5D13h] hook writes.
; Both writes are skipped when the word at 4A15h or 5D11h is not CCCCh
; (code of ours or anyone lies on a cell). INT 87h stays at r12.

start:
    mov si, ax                          ; r1
    lea bx, [word si + zombie_entry - start]  ; r2
    mov dx, [4A15h]                     ; r3  word below hook cell 4A17h
    cmp dx, [5D11h]                     ; r4  equal (both CCCCh) when no code lies at either cell
    jne short skip_hooks                ; r5
    mov [4A17h], bx                     ; r6  (rev0: r3; A now reads it at r7)
    mov [5D13h], bx                     ; r7  (rev0: r5)
hooks_done:
    les ax, [si + bd_data - start]      ; r8  AX=0F9EBh, ES=1000h; DX is already CCCCh
    mov bx, 026FFh                      ; r9
    mov cx, 04A17h                      ; r10
    std                                 ; r11
    int 087h                            ; r12 (same round as rev0)
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

skip_hooks:
    mov dx, 0CCCCh                      ; r6 (skip path keeps INT 87h at r12)
    jmp short hooks_done                ; r7

bd_data:
    dw 0F9EBh, 1000h

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
