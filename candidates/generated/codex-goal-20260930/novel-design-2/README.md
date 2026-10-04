# Novel design 2: private-template near hoppers

Status: **rejected as a general replacement**. The original v1 pair scored
only `0.05` versus `0.45` for m050 on the same 20-battle smoke. The current
source has a one-byte backup-`RET` experiment that delayed one observed B
death but still lost that one-battle replay. No field holdout or promotion.

The pair preserves m050's demonstrated backward `INT 87h` capture of the live
2025 B/D Zombie tail. A also preserves the captured process's second `INT 87h`
search for `F3 A5 06 1F`. The replication mechanism is otherwise different.
Each survivor copies a 16-byte body into its *own private stack* at `SS:0000`,
sets `DS=SS` and `ES=CS` (arena), and repeatedly executes the following body:

```asm
mov di, bx
xor si, si
mov cx, 8
rep movsw
push bx
add bx, HOP_STRIDE
ret
```

The `RET` pops the previous `BX` from the **private** stack, entering the
newly copied arena body. `BX` already points at the following target. No arena
far-pointer cell, `CALL FAR`, `FF 1F` anchor, or arena return-address trail is
used. A and B have distinct odd strides (`3D01h` and `4273h`) and first copy
offsets (`0200h` and `0300h`). An odd stride has a full-period orbit modulo
65,536, rather than revisiting the same coarse bands every few hops. Their
first copies fall within the nominal 1,024-byte load-separation clearance.

The v6 source implements the exact forms used here: `REP MOVSW` copies one
word per scheduled opcode, near `RET` pops an IP word from the current `SS`,
and the arena is writable through `ES=CS`. The byte listings verify that the
15-byte body plus one final byte is copied as eight words, and that the new
body retains the private `DS/SS` and arena `ES/CS` established in startup.
After each `PUSH BX; ADD BX,stride; RET`, stack depth returns to its previous
value. Unlike the earlier probe/interdict architecture, this pair neither
paints its own future code with `INT 86h` nor executes from an unprotected
single relocated hunter. Still, an opponent can corrupt an in-flight copy or
the next body after it is written, and copying eight words takes multiple
turns. It remains entirely unproven whether the shorter exposure outweighs
the loss of Phoenix's existing favorable spatial pattern.

| Version | Warrior | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| v1 (`A-v1.asm`, `B-v1.asm`) | A | 102 | `3223e5e2cb1db1dd70758ed8465890ac846492203f512090bb3ca5904e5e5b53` |
| v1 | B | 61 | `969fc813eb9e21f17d9cc1dd68b4ab7d67b47d1d3ba12eb99bd9eb23b94e240e` |
| current backup-`RET` | A | 102 | `b40f5e039b821081dc3ce769ecc61e4a73a3d704f5d56e489912017f3ec7af0d` |
| current backup-`RET` | B | 61 | `f277f3266c9aa25d5a1121ed51cd50ed6f47239ddcf4abe9f26494fa617aec84` |

Rebuild with `PLAYWRIGHT_MODULE` set to the available bundled Playwright
package and a browser assembler server on `127.0.0.1:8123`:

```powershell
node assemble.mjs build/codex-goal-20260930/novel-design-2-retpad candidates/generated/codex-goal-20260930/novel-design-2/A.asm candidates/generated/codex-goal-20260930/novel-design-2/B.asm
```

The original v1 binaries and manifest remain in `build/codex-goal-20260930/novel-design-2/`;
the archived v1 source files have exact SHA-256 matches to that manifest. The
current binaries have a separate manifest in `novel-design-2-retpad/`.
`smoke-candidate.json` still points to v1 and `smoke-control.json` to the exact
m050 binaries. Both were run on the same seed/cohort for 20 battles: v1 team
score `0.05` (A `0`, B `0.05`) against m050 `0.45`.

## One-battle death diagnosis

The same-seed v1 serial telemetry (`diagnostic-one-battle.json`) recorded A
dying at round 419 with a CPU exception and B at round 3,588 with a CPU
exception. Both had reached private `DS/SS` and arena `ES`, so startup and
template copying succeeded. A separate one-battle control against a
two-warrior `EB FE` inert team with no Zombies left **both** v1 members alive
until the inert opponents died in rounds 22,080 and 25,101 (`diagnostic-inert-one-battle.json`).
That one control does not prove universal safety, but rules out an immediate
intrinsic template/`RET` incompatibility.

B's observed death is more precise. It loaded at `17268`; its first target was
`18036`, and after 235 hops of `4273h` the target was `17925`. The intended
`RET` of that 15-byte body was at `17939`. Telemetry instead recorded the CPU
exception at IP `17942` (= target + 17) while `SP=07FEh`, meaning the preceding
`PUSH BX` had not been matched by the intended `RET`. The process fell past
the body tail into the arena's lethal `CCh` fill. B's next own copy target was
elsewhere, and A was already dead. This is consistent with an external write
neutralizing B's current `RET` byte; telemetry does not identify the writer.

The original 16th byte was a `NOP`. The current source changes **only that
byte** to a backup `RET`, offering one narrow escape if a one-byte overwrite
turns the primary `RET` into a valid one-byte instruction. In the exact
same-seed one-battle replay (`diagnostic-one-battle-retpad.json`), load offsets
were unchanged and B's death moved from round 3,588 to round 8,913. A still
died at round 419 and the team still scored zero. The backup is a measured
mechanical hardening of one path, **not** a demonstrated general improvement;
wide paint or an invalid-byte overwrite can still kill it. No broader
benchmark of the backup version was run.
