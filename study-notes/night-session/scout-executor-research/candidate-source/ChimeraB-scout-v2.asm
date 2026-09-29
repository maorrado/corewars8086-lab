bits 16

; Chimera B scout-v2: same design as B-scout-v1 (one-shot marker+burst
; check between "mov bx,PTR_CELL" and "push cs; pop ss"), rewritten to
; minimize instruction count -- single DS swap into the shared segment
; (reads marker AND target back-to-back) instead of v1's swap/restore/
; swap-again dance, and BURST_LEN reduced from 4 to 2 (half the write
; cost; a 2-byte hit is still enough to corrupt a 2-byte FF1F anchor,
; which is the documented dominant death mechanism for this whole code
; family). Goal: test whether shrinking B's insert (isolated cost was
; -0.0117, CI crossing zero but centered negative) moves it closer to
; A-v3's near-zero isolated cost (+0.0033).
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h
%define SHARED_TARGET 0300h
%define SHARED_MARKER 0302h
%define BURST_LEN 2
%define FILLER 0CCh

start:
    mov dx, es                ; DX = shared-memory segment (cold-boot ES)
    mov si, ax
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov cx, 05D13h
    mov bx, 026FFh
    std
    push dx
    mov dx, 0CCCCh
    int 087h
    pop dx
    cld
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

    ; --- one-shot scout-target check, minimized ---
    push ax
    push ds
    mov ds, dx                 ; DS = shared-memory segment
    mov si, SHARED_MARKER
    lodsw                      ; AX = marker
    xchg ax, di                ; DI = marker (frees AX); avoids a second
                                ; save/restore pair vs v1's approach
    mov si, SHARED_TARGET
    lodsw                      ; AX = target offset (SI now past both cells)
    pop ds                     ; restore DS = private-stack segment (single
                                ; swap, unlike v1's swap/restore/swap-again)
    or di, di
    jz no_target
    mov di, ax                 ; DI = target offset
    push cs
    pop ds                     ; DS = arena/code segment
    mov al, FILLER
    mov cx, BURST_LEN
    rep stosb
no_target:
    pop ax

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
