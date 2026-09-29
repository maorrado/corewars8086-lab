bits 16

; Chimera A scout-v2: same design as scout-v1 (one-shot scan+publish before
; "push cs; pop es"), but reduced to a SINGLE candidate check (no loop, no
; SCAN_STEPS) after v1's full 6-step scan caused a large regression
; (-0.1115 vs m049, CI entirely negative) attributed to bootstrap-path
; delay cost (v1's scan block was ~24 instructions; this is ~9). Tests
; whether any net-positive effect survives at near-minimal insertion size,
; before concluding the scout-as-bootstrap-insert approach is not viable
; at any useful scan coverage.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h
%define SHARED_TARGET 0300h
%define SHARED_MARKER 0302h
%define PEEK_OFFSET 0400h
%define FILLER 0CCh

start:
    mov bp, ax           ; BP = own loadOffset, preserved across the whole
                          ; block (AX gets clobbered by STOSW below on the
                          ; publish path -- found and fixed during
                          ; self-review before testing: v2's first draft
                          ; used "mov si,ax" at no_target: which reads AX
                          ; AFTER it had been overwritten to the marker
                          ; value 1 by the second STOSW, corrupting SI for
                          ; the rest of the bootstrap on every battle where
                          ; the scan found a target -- explains the
                          ; near-universal warrior1 death observed in the
                          ; first all-2025 run of this file, -0.37 vs m049)
    mov si, ax
    add si, PEEK_OFFSET
    mov di, si
    mov al, [di]
    cmp al, FILLER
    je no_target
    mov di, SHARED_TARGET
    mov ax, si
    stosw
    mov ax, 1
    stosw
no_target:
    mov ax, bp            ; restore AX = own loadOffset before m049's
                           ; unmodified flow (which needs SI=AX=loadOffset)
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
