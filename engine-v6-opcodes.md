# CoreWars8086 v6 opcode map

Source of truth: `Cpu.java` in official tag `corewars8086-6.0.0`, commit
`63ffbe3ef3e12e80744e829fd92176b458ab4d5b`. This is an emulator acceptance
map, not a generic 8086 reference. Reaching an invalid, unsupported, or
unimplemented form kills the executing survivor.

## Accepted top-level families

| Bytes/family | Implemented operations |
|---|---|
| `00h..25h`, `28h..3Dh` | Byte/word forms of `ADD`, `OR`, `ADC`, `SBB`, `AND`, `SUB`, `XOR`, `CMP`; immediate accumulator forms; `PUSH`/`POP` for `ES`, `SS`, `DS`; `PUSH CS` |
| `40h..4Fh` | `INC`/`DEC` every 16-bit general register |
| `50h..5Fh` | `PUSH`/`POP` every 16-bit general register |
| `70h..7Fh` | All 16 short conditional-jump encodings (`JO/JNO`, carry/unsigned, zero, sign, parity, signed relational aliases) |
| `80h/81h/82h/83h` | Immediate group: `ADD`, `OR`, `ADC`, `SBB`, `AND`, `SUB`, `XOR`, `CMP` on byte/word r/m operands; `83h` sign-extends its byte |
| `84h..8Fh` | `TEST`, `XCHG`, `MOV` r/m/register, segment-register moves, `LEA`, `POP r/m16` |
| `90h..9Fh` | `NOP`/`XCHG AX,reg`, `CBW`, `CWD`, immediate far `CALL`, virtual `NRG` (`9B 9B` only), `PUSHF`, `POPF`, `SAHF`, `LAHF` |
| `A0h..AFh` | Accumulator/direct-memory `MOV`; `MOVSB/W`, `CMPSB/W`, `TEST AL/AX,imm`, `STOSB/W`, `LODSB/W`, `SCASB/W` |
| `B0h..BFh` | `MOV` immediate to every byte/word general register |
| `C2h..C7h`, `CAh..CBh`, `CFh` | Near `RET`, `LES`, `LDS`, immediate-to-r/m `MOV`, far `RET`, `IRET` |
| `CD 86`, `CD 87` | The two CoreWars virtual interrupts; no other `INT imm8` is accepted |
| `D0h..D3h` | `ROL`, `ROR`, `RCL`, `RCR`, `SHL`, `SHR`, `SAR` by one or `CL`; group sub-opcode 6 is invalid |
| `D7h` | `XLAT`/`XLATB` |
| `E0h..E3h` | `LOOPNZ`, `LOOPZ`, `LOOP`, `JCXZ` |
| `E8h..EBh` | Near `CALL`, near/far/short `JMP` |
| `F2h/F3h` | Only the listed string-repeat combinations described below |
| `F5h`, `F6h/F7h`, `F8h..FDh`, `FEh/FFh` | `CMC`; group `TEST`, `NOT`, `NEG`, unsigned `MUL`/`DIV`; flag controls; r/m `INC`/`DEC`; indirect near/far `CALL`/`JMP`; `PUSH r/m16` |

## Fatal or absent families

- `0Fh` is invalid; there is no two-byte modern x86 opcode map.
- Segment override prefixes `26h`, `2Eh`, `36h`, `3Eh` are unimplemented.
- `DAA`, `DAS`, `AAA`, `AAS`, `AAM`, `AAD` are unimplemented.
- The complete `60h..6Fh` range is invalid. This includes later-x86
  `PUSHA`/`POPA`, immediate `PUSH` and three-operand `IMUL` encodings.
- `C0h`, `C1h`, `C8h`, `C9h` are invalid; `ENTER`/`LEAVE` are unavailable.
- `CCh` (`INT 3`) and `CEh` (`INTO`) throw an interrupt exception. `CDh`
  accepts only `86h` and `87h`.
- `D4h`, `D5h` are unimplemented; `D6h` is invalid; `D8h..DFh` x87 forms are
  unsupported.
- All `IN`/`OUT` forms (`E4h..E7h`, `ECh..EFh`), `LOCK` (`F0h`) and `HLT`
  (`F4h`) are unsupported. `F1h` is invalid.
- Group-3 signed `IMUL`/`IDIV` sub-opcodes are unimplemented. Unsigned
  `MUL`/`DIV` work; divide-by-zero or quotient overflow kills the survivor.

## Engine-specific semantics that affect strategy

- `REP MOVS/STOS/LODS` and `REPZ/REPNZ CMPS/SCAS` execute **one element per
  scheduled opcode**. If another iteration is due, v6 rewinds `IP` by two to
  the prefix. A long `REP MOVSW` copy is therefore exposed to opponents and
  consumes many turns; it is not one atomic instruction.
- `F2h` accepts only `CMPSB/W` and `SCASB/W`. `F3h` accepts `MOVSB/W`,
  `CMPSB/W`, `STOSB/W`, `LODSB/W`, and `SCASB/W`. Other prefix/opcode pairs
  are invalid.
- `9Bh` must be followed immediately by another `9Bh`; the pair increments
  energy by one. A lone architectural `WAIT` kills the survivor.
- `CCh` is lethal because the emulator implements it as fatal `INT 3`; this
  explains both the untouched arena filler and the damaged-code publication
  used before the 2025 stage-B submission.
- Arithmetic helpers update carry/borrow, zero, sign and parity, but not the
  architectural overflow or auxiliary-carry flags. Signed relational jumps
  consult overflow anyway, so they require direct v6 tests and careful flag
  provenance. `JO/JNO` must not be assumed to match real 8086 arithmetic.
- `INT 86h` and `INT 87h` are fully specified in `engine-v6-facts.md`; their
  limits and effects are not those of a real 8086 BIOS/DOS interrupt table.
- Indirect `FF /4 JMP r/m16` is implemented, but the source carries a specific
  `JMP SP` FIXME. Avoid relying on that edge form without a conformance test.

This map will be turned into assembler-level smoke tests before any candidate
depends on a less-common form. NASM accepting source is necessary but not
sufficient: the v6 emulator must also accept and execute the resulting bytes.
