bits 16

; Chimera B scout-v1: m049's ChimeraB with a ONE-TIME check of A's
; scout-published target, inserted between phoenix_init's PTR_CELL setup
; ("mov bx,PTR_CELL") and "push cs; pop ss" (which permanently switches SS
; away from the private stack segment -- the value pushed at start: lives
; on that original stack and is not reachable after that point).
;
; The shared-memory segment value (= ES at cold boot) is captured into DX
; at the very top of start: (DX is otherwise unused until deep inside
; phoenix_init's anchor sequence -- "mov dx,4000h" -- so it is a free
; carry register for this whole span; verified against the full
; register-usage trace of unmodified m049 ChimeraB before writing this).
;
; IMPORTANT CORRECTNESS NOTE (found during self-review, fixed before
; testing): there is no ES:-addressable [mem] operand in this engine (see
; ProtoA/B-v1.asm) -- the default segment for [imm16]/[reg] addressing is
; always DS (or SS if BP is the base), never ES. So the marker/target read
; must go through DS, not ES: DS is briefly repointed to the shared
; segment (saving/restoring its current value, which at this point is the
; private-stack segment per step 3's "push ss; pop ds"), read via LODSW,
; then DS is restored before continuing into the unmodified rest of
; phoenix_init and the byte-for-byte-identical worker: loop.
%define FAR_SEG  0FFCh
%define PTR_CELL 00240h
%define SHARED_TARGET 0300h
%define SHARED_MARKER 0302h
%define BURST_LEN 4
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
    push dx                    ; DX about to be clobbered by the int87h search
                                ; word; save the shared segment (SS is still
                                ; the original private stack here)
    mov dx, 0CCCCh
    int 087h
    pop dx                     ; restore DX = shared-memory segment
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

    ; --- one-shot scout-target check (SS is still the original private
    ; stack here; DX still holds the shared segment captured at start:) ---
    ; AX holds m049's phoenix target offset at this point and MUST survive
    ; this entire block (LODSW clobbers AX, so it is saved/restored around
    ; all of it, not just the burst).
    push ax
    push ds                    ; save DS = private-stack segment (step 3's result)
    mov ds, dx                 ; DS = shared-memory segment
    mov si, SHARED_MARKER
    lodsw                      ; AX = [DS:0302] (marker)
    cmp ax, 0
    je no_target
    mov si, SHARED_TARGET
    lodsw                      ; AX = [DS:0300] (target offset)
    mov di, ax                 ; DI = candidate target offset (survives DS restore)
    pop ds                     ; restore DS = private-stack segment
    push ds
    push cs
    pop ds                     ; DS = arena/code segment (burst destination)
    mov al, FILLER
    push cx                    ; CX currently 9 (reused later); save/restore
    mov cx, BURST_LEN
    rep stosb                  ; write BURST_LEN fatal bytes at [DS:DI]
                                ; (destination now = arena segment, correct)
    pop cx
no_target:
    pop ds                     ; restore DS = private-stack segment (step 3's
                                ; result), exactly as m049 has it at this point
    pop ax                     ; restore AX = m049 phoenix target offset

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
