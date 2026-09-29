bits 16

; Chimera A scout-v3: scan moved to AFTER int87h (mirrors B-scout-v1's
; placement), based on the finding that B's similarly-sized insert (~15
; instructions, placed after its own int87h) cost near-zero (-0.0117, CI
; crosses zero) while A-v2's insert (~9 instructions, placed BEFORE its
; own int87h) cost -0.0243 -- a significant regression despite being
; smaller. This tests whether position (not just size) explains the
; difference: does moving the scan after int87h make it as cheap as B's
; insert was?
;
; The shared-memory segment value (= ES at cold boot) is captured into BP
; at the very top of start:, mirroring the technique proven for
; ChimeraB-scout-v1 (BP is free across int87h -- ChimeraA's own bootstrap
; does not touch BP until deep inside phoenix_pointer_ready, well after
; this block completes; verified against m049 ChimeraA's full
; register-usage trace before writing this).
%define FAR_SEG  0FFCh
%define PTR_CELL 00200h
%define SHARED_TARGET 0300h
%define SHARED_MARKER 0302h
%define PEEK_OFFSET 0400h
%define FILLER 0CCh

start:
    mov bp, es              ; BP = shared-memory segment (cold-boot ES)
    mov si, ax
    mov di, ax
    add di, zombie_entry - start
    mov [05D13h], di
    push cs
    pop es
    xor di, di
    mov ax, 0F9EBh
    mov cx, 05D13h
    mov bx, 026FFh
    std
    push bp                  ; save shared segment (SS unchanged since
                              ; cold boot at this point, safe to use the
                              ; original private stack)
    mov dx, 0CCCCh
    int 087h
    pop bp                   ; restore BP = shared-memory segment
    cld

    ; --- one-shot scout scan+publish, now AFTER int87h (mirrors B) ---
    ; STOSW's implicit destination is ES:DI (not DS:DI), so ES (currently
    ; the arena segment, per "push cs; pop es" above) must be briefly
    ; repointed to the shared segment for the publish, then restored.
    ; SI still holds the original loadOffset from line 26 (untouched by
    ; int87h, which only clobbers AX/BX/CX/DX/DI). AX/DI/CX/DX/BX are all
    ; dead at this point (int87h's search operands, no longer needed;
    ; m049's own next instruction "mov ax,si" overwrites AX regardless),
    ; so no save/restore of them is needed -- only ES needs restoring,
    ; since m049's subsequent code assumes ES = arena segment.
    mov cx, si
    add cx, PEEK_OFFSET          ; CX = candidate offset (scratch, spared)
    mov di, cx
    mov al, [di]
    cmp al, FILLER
    je scan_done
    mov es, bp                  ; ES = shared-memory segment
    mov di, SHARED_TARGET
    mov ax, cx
    stosw                        ; [ES:0300] = candidate offset
    mov ax, 1
    stosw                        ; [ES:0302] = marker (written last)
    push cs
    pop es                       ; restore ES = arena segment
scan_done:

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
