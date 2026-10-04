bits 16

; Good_Test V6 warrior 1 (friend-provided; reconstructed source in
; study-notes/good-test-v6/source/). agent2 label form.
; agent2 variant: removed the [7A00h] redirect patch (ablation) = rev0 V6nohunt.
; A001 (night 2026-10-03): startup trimmed, same targets and capture semantics:
;  - band math done in 16 bit: floor(load/3C00h)*3C00h + 2CA2h == old AH/AL result
;  - dead `mov dx,[4A17h] / and dx,0 / or dx,0FFBh` -> mov dx,0FFBh
;  - jmp-to-next-line removed, mov sp,di/add sp -> lea
;  - dead zombie_entry/zombie_scan removed; 18th template byte (89h) kept

start:
    mov si, ax
    push cs
    pop es
    mov ax, [4A17h]
    mov [9769h], ax
    mov ax, 0F2E2h
    mov dx, 0C381h
    mov bx, 026FFh
    mov cx, 04A17h
    int 087h
    xor dx, dx
    mov ax, si
    mov cx, 03C00h
    div cx
    lea ax, [si + 2CA2h]
    sub ax, dx
    add si, strict word worker - start

phoenix_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, 002C0h
    push cs
    pop ss
    mov [bx], ax
    mov dx, 0FFBh
    mov [bx + 2], dx
    xor si, si
    mov di, ax
    mov es, dx
    lea sp, [di + 0100h]
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
template_pad:
    db 089h
