bits 16

; Good_Test V6 warrior 1 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form: hard-coded internal
; offsets replaced by label arithmetic with the original operand widths.
; agent2 variant: removed the [7A00h] redirect patch (ablation)
; A044 (night wave 9): self-harm guard on the [9769h] hook write. The write is
; skipped when the word at 9767h is not CCCCh (our own pending code, the
; partner's code, or B's zombie_entry lies there). INT 87h stays at r10 and
; phoenix_init at r22, so the anchor timing equals rev0.

start:
    mov si, ax                          ; r1
    cmp word [9767h], 0CCCCh            ; r2  guard: word below the hook cell still arena fill?
    les ax, [si + z20a_data - start]    ; r3  AX=0F2E2h, ES=1000h (arena)
    mov dx, 0C381h                      ; r4
    mov bx, 026FFh                      ; r5
    jne short skip_hook                 ; r6  code (ours, partner's, anyone's) at 9767h -> skip
    mov bp, [4A17h]                     ; r7  B's zombie_entry (B writes it at r6 now)
    mov [9769h], bp                     ; r8  (rev0: r5); still before RW's INT87 (r9/r10)
skip_hook:
    mov cx, 04A17h                      ; r9
    int 087h                            ; r10 (same round as rev0)
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

z20a_data:
    dw 0F2E2h, 1000h

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
