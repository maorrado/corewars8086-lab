bits 16
; B052 static zombie-mimic test team (CONTROL: one byte changed, E2 F2 81 C2 does not match). Carries a verbatim copy of zom20a's live-loop
; bytes 41 93 E2 F2 81 C3 E1 10 (as HRZ_Grindo_Holics1 @0x31 / Grindo2 @0x43 do) in dead code,
; then idles. Used only to measure rev0 A's INT 87h zom20a capture (pattern E2 F2 81 C3).
start:
    jmp short idle
decoy:
    db 41h, 93h, 0E2h, 0F2h, 81h, 0C2h, 0E1h, 10h
idle:
    jmp short idle
