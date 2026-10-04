# Bootstrap instruction reductions — 2026-10-01

Research candidates only; no benchmark has been run and no promotion is implied.
The main agent must review the exact source and binaries before any test.

## Three concrete pairs

| Pair ID | A source | B source | Hypothesis |
| --- | --- | --- | --- |
| entry_lea | EntryLeaA.asm | BaseB.asm | Publish A's captured-Zombie entry one instruction earlier by fusing MOV BX,AX plus ADD BX,offset into LEA BX,[SI+offset]. |
| b_fallthrough | BaseA.asm | FallthroughB.asm | Enter B's Phoenix initialization one instruction earlier by removing its jump to the next block and the two skipped CC bytes. |
| both | EntryLeaA.asm | FallthroughB.asm | Combine the two separate startup reductions; this is an interaction check, not a fourth mechanism. |

BaseA/BaseB are frozen copies of the audited c090 LEA pair. Their only added text
is comments and a zero-byte assertion. Source origins are
`candidates/generated/claude-synthesis-audit-20260930/LeaA.asm` and
`LeaB.asm`. Expected control binary hashes:

- A: `e5a2681fe8a7d6a3af8cb5cedbe528f8629c39cb35fd12576b1d884612aa7a07` (187 bytes).
- B: `99055d82958f813de2067a17dde8ea361c749bd4dc916095a4dad1ad8e13ce2b` (115 bytes).

## Structural reasoning for the main review

EntryLeaA keeps `MOV SI,AX` first. SI therefore equals the initial load offset
when LEA computes BX. `SI + zombie_entry - start` gives exactly the relocated
entry address that the previous MOV/ADD computed, for every legal load offset.
The write to `[05D13h]` remains in the same segment with the same target value.
The fusion leaves arithmetic flags unchanged instead of setting them with ADD;
the intervening instructions do not consume those flags, INT87 uses DF only,
and STD explicitly sets DF. Subsequent XOR/divide/quantization instructions
establish the later arithmetic state. The captured path itself is unchanged;
its label-based get-IP subtraction and worker offset relocate automatically.

FallthroughB removes only the short jump and the two bytes that jump skipped.
No Zombie entry or other label targets those bytes in B. It falls into the same
PUSH SS/POP ES initialization, with the same registers and flags. The worker
source offset in `ADD SI,worker-start` tracks the new layout. A's necessary
jump over its captured-Zombie code is retained.

All four files retain the exact 17-byte worker, the A startup count 8, the B
startup count 9, both private template copy counts 9, and the worker count 9.
The two opposite TIMES expressions require worker length to equal 17 and emit
no bytes on success. No new segment override, interrupt, stack operation,
resource consumption, or addressing-phase constant is introduced. Bytes after
the file's worker remain outside the file, as in the audited base.

Official engine compatibility was checked in
`repos/corewars8086-6.0.0-deterministic/src/main/java/il/co/codeguru/corewars8086/cpu/Cpu.java`:
case 0x8D implements LEA by taking the effective-address offset; INT87's
implementation reads DF but not arithmetic flags. Existing base uses of LEA
are retained.

This is functional reasoning, not a claim that earlier startup improves score.
Changing instruction timing and file length can change exposure to opponents,
relocation timing, and loading interactions. Earlier Zombie-entry publication
could also change the timing of enemy capture. Broad matched testing is needed.

## Previous work consulted; no duplicate benchmark planned

Read `study-notes/codex-goal-20260930-progress.md` and the historical
m050-search LEA/mask/lean generators and representative results before choosing
these edits. Prior LES compression, worker-copy shortening, phase XOR, stack XOR,
and mask quantizers are not repeated here. The historical LEA pair screen
(`m050-lea-lea_ab_raw-tune-screen-r1`) scored 0.666667 versus its control
0.691667; B-only validation scored 0.683167 versus 0.683833. The c090 pair is
therefore a fixed research base here, not an assumed proven champion.

Search of saved non-arena candidate ASM/README sources found no prior
`LEA BX,[SI+zombie_entry-start]` fusion or documented B fallthrough candidate.
This is not proof that nobody ever tried an equivalent program; the exact
proposed pair combinations are unbenchmarked in this task.

## Assembly status

All four sources assembled successfully with the existing browser-NASM setup;
no Java or benchmark was run. The control hashes above reproduced exactly.
The manifest and listings are under this directory's `build/` subdirectory.
No dependency or global runtime configuration was changed.

| Binary | Bytes | SHA256 |
| --- | --- | --- |
| EntryLeaA | 185 | `2b7c71677831d5a78458519b20b2dbaddbb304b477ca828a90d2ff34c3adf052` |
| FallthroughB | 111 | `74dcd3e0fb5a10089c58d66e6c7883f286367085ec1142d456961abbb9badb1a` |

All four compiled workers have identical bytes:
`A5 F3 A5 29 D4 29 2F 8B 3F B1 09 31 F6 AB 4F FF 1F`.
EntryLeaA's new instruction is `8D 5C 36` (SI plus displacement 36h),
which the engine's mode-1 SI addressing decoder supports. EntryLeaA is two
bytes shorter than BaseA; FallthroughB is four bytes shorter than BaseB.
Each individual edit removes one executed startup instruction.

