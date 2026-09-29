bits 16

; Chimera A scout-v1: m049's ChimeraA (byte-for-byte Phoenix bootstrap and
; worker: loop, UNCHANGED) with a bounded one-shot scan+publish block
; inserted at the very top of start:, before "push cs; pop es" repoints ES
; away from the shared-memory segment. This is the only window where ES
; still equals the group-shared segment (cold-boot default), so the
; scan+publish must happen here or not at all without extra segment
; juggling. Publish uses STOSW (implicit ES:DI; the 0x26 ES: prefix is
; unimplemented in this engine -- see ProtoA/B-v1.asm). AX (=loadOffset) is
; preserved across the scan since m049's bootstrap needs it immediately
; after. Bounded to a small fixed number of stride steps (not a full-arena
; sweep) to keep one-time bootstrap cost low; m049's own replication logic
; is not touched at all beyond this insert.
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h
%define SHARED_TARGET 0300h
%define SHARED_MARKER 0302h
%define SCAN_STEPS 6
%define STRIDE 0400h
%define FILLER 0CCh

start:
    mov bp, ax              ; BP = own loadOffset (preserved across scan)
    mov bh, ah                ; BH = own loadOffset high byte, for self-exclusion
    mov si, ax                 ; SI = scan cursor, start near own position
    mov cx, SCAN_STEPS

scan_loop:
    add si, STRIDE
    mov ax, si
    cmp ah, bh
    je scan_next               ; same band as self -> skip
    mov di, si
    mov al, [di]
    cmp al, FILLER
    je scan_next
    inc di
    mov al, [di]
    cmp al, FILLER
    je scan_next

    mov di, SHARED_TARGET
    mov ax, si
    stosw                       ; [ES:0300] = candidate offset
    mov ax, 1
    stosw                       ; [ES:0302] = marker = 1 (written last)

scan_next:
    loop scan_loop

    mov ax, bp                  ; restore AX = own loadOffset for m049 bootstrap
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
