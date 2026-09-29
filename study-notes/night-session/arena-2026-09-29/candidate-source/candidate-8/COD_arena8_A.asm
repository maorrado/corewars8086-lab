bits 16

; COD_arena8 A: "Bastion" — build-then-fight Phoenix variant.
; Derived from the champion's proven Phoenix far-call replication
; (ChimeraA/m049), with one addition: before committing to the real
; replication chain, spray a small number of FF1Fh (call-far anchor)
; filler words across several widely-spaced bands near our own
; territory. This is a ONE-TIME bootstrap cost (not in the hot worker
; loop) intended to deny/mine nearby space cheaply before speed-racing
; the champion's own replication mechanism, which is left byte-for-byte
; unchanged from this point on.
%define FAR_SEG   0FFCh
%define PTR_CELL  00200h
%define FILLSTRIDE 0300h    ; band spacing for filler spray
%define FILLBASE   0900h    ; first filler band, offset from own load pos

start:
    mov si, ax
    mov di, ax
    add di, zombie_entry - start
    mov [05D13h], di
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov dx, 0CCCCh
    mov bx, 026FFh
    mov cx, 05D13h
    std
    int 087h
    cld

    ; --- build phase: spray FF1Fh anchors across 4 bands, one-time.
    ; Runs BEFORE the quantized replication AX is computed, so it only
    ; needs ax/cl/di as scratch and never touches si (which still holds
    ; the pristine load offset, required intact below).
    mov di, si
    add di, FILLBASE
    mov ax, 01FFFh
    mov cl, 4
.fill:
    stosw
    add di, FILLSTRIDE
    dec cl
    jnz .fill
    ; --- end build phase ---

    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 010h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

zombie_entry:
    xor di, di
    mov ax, 0A5F3h
    mov dx, 01F06h
    mov bl, 0CCh
    std
    int 087h
    cld
    call .get_ip
.get_ip:
    pop si
    sub si, .get_ip - start
    mov ax, si
    mov al, ah
    xor ah, ah
    mov ch, 03Ch
    div ch
    mul ch
    mov ah, al
    add ah, 054h
    mov al, 0A2h
    add si, worker - start

captured_init:
    push ss
    pop es
    xor di, di
    mov cx, 9
    rep movsw
    push ss
    pop ds
    mov bx, 00280h
    push cs
    pop ss
    jmp short phoenix_pointer_ready

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
phoenix_pointer_ready:
    mov [bx], ax
    mov word [bx + 2], FAR_SEG
    xor si, si
    mov di, ax
    mov ax, FAR_SEG
    mov es, ax
    mov sp, di
    add sp, 00200h
    mov cx, 8
    mov dx, 03800h
    mov bp, 03C00h
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
