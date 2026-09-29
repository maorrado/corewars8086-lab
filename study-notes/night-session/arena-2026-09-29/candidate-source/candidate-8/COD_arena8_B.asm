bits 16

; COD_arena8 B: "Bastion" — build-then-fight Phoenix variant.
; Same one-time filler-spray addition as COD_arena8_A, applied to B's
; simpler (no zombie-capture) bootstrap. Worker loop and phoenix_init
; are byte-for-byte identical to the champion (ChimeraB/m049) from the
; jmp onward.
%define FAR_SEG   0FFCh
%define PTR_CELL  00240h
%define FILLSTRIDE 0300h    ; band spacing for filler spray
%define FILLBASE   0900h    ; first filler band, offset from own load pos

start:
    mov si, ax
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
    add ah, 034h
    mov al, 0A2h
    add si, worker - start
    jmp short phoenix_init

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
    mov sp, di
    add sp, 00280h
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
