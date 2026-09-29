bits 16
; Purely inert placeholder for isolation testing -- infinite no-op self-loop,
; never writes to memory, never attacks, never moves. Not part of the
; submitted candidate; diagnostic-only.
start:
    jmp short start
