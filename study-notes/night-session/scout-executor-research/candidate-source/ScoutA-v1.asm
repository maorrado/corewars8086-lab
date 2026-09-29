bits 16

; Scout A v1: cheap stride scanner. Publishes the first candidate region it
; finds (2 consecutive non-0xCC bytes, coarsely far enough from its own
; load offset to avoid trivially self-targeting) to the shared cell, then
; keeps scanning and republishes on every find ("last found wins" -- no
; confidence/versioning beyond the valid/invalid marker itself yet).
;
; Engine constraints applied (see ProtoA/B-v1.asm for the underlying
; discovery): no [es:xxx] operand exists (0x26 prefix is unimplemented in
; this engine), so publishing uses STOSW (implicit ES:DI, ES=shared segment
; at cold boot). Arena reads use LODSB/direct [di] (implicit/default DS:SI
; or DS:DI); DS=arena segment for every warrior at cold boot (same segment
; for everyone, since ARENA_SEGMENT is fixed), so no segment setup is
; needed to scan the arena at all.
;
; Self-exclusion: compares the candidate offset's high byte (AH after
; mov ax,si) against own loadOffset's high byte; skip if equal (same
; 0x100-byte "band"). Cheap (single byte compare, no divide), coarse by
; design -- matches "general characteristics, not an exact per-opponent
; signature" from the brief.
%define SHARED_TARGET  0300h
%define SHARED_MARKER  0302h
%define STRIDE 0040h
%define FILLER 0CCh

start:
    mov bp, ax           ; BP = own loadOffset (persist; AX gets reused)
    mov bh, ah            ; BH = own loadOffset high byte (for self-exclusion)
    xor si, si             ; SI = scan cursor

scan_loop:
    add si, STRIDE
    jnc check_self
    xor si, si              ; wrapped past 0xFFFF -> restart from 0

check_self:
    mov ax, si
    cmp ah, bh
    je scan_loop           ; same band as self -> skip this candidate

check_candidate:
    mov di, si
    mov al, [di]
    cmp al, FILLER
    je scan_loop
    inc di
    mov al, [di]
    cmp al, FILLER
    je scan_loop

publish:
    mov di, SHARED_TARGET
    mov ax, si
    stosw                   ; [ES:0300] = target offset, DI -> 0302
    mov ax, 1
    stosw                   ; [ES:0302] = marker = 1 (valid), written last
    jmp short scan_loop     ; keep scanning; republish on next find
