STOSB imp B: isolated alternate-family hypothesis, not an improvement claim

Status: source authored; the first assembly attempt failed during preflight
because the bundled NASM rejected the relational TIMES size assertion with
"expecting ')'". That guard was removed without changing any gameplay
instruction. Size remains checked after assembly by generate-screen.mjs.
Reassembly is pending; no configs, seed draw or battles have been run.
Pair B-STOSB-imp.asm with exact m050 A, unchanged:
SHA-256 0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44.
Do not replace final/ on this hypothesis.

The B opener is identical to final/ChimeraB.asm from MOV SI,AX through CLD.
It retains the Zombie redirect attempt at the same instruction timing.
Everything after CLD is replaced with five instructions: LEA BX,[SI+0200h],
MOV DI,BX, MOV AL,AAh, STOSB, JMP BX. The initial STOSB plants opcode AA
and leaves DI one byte beyond it. Each later AA writes the immediately next
instruction, then DI and IP both advance one byte. CS=ES remains 1000h;
16-bit offset wrap therefore stays inside the executable/writable arena.
The +512 displacement is outside the <=256-byte own source, even modulo
65536. It does not guarantee separation from opponents or our partner.

Mechanism: keep m050 A's offense/capture while replacing B's Phoenix role
with a one-byte advancing write-and-execute frontier. There is no multiword
copy, FF 1F anchor, return-address trail, private executable memory, resource
consumption in the running imp, enemy signature test or adaptive behavior.
Official Cpu.java implements AA as STOSB: write AL to ES:DI, advance DI by
one when DF is clear. A changed next opcode/register can still derail it.

This is distinct from the failed private-template near hopper (15-byte
body plus padding copied over multiple turns) and direct-copy Phoenix
(16-byte copied body). Their recorded poor smokes are in
study-notes/codex-goal-20260930-progress.md. It also avoids the relocated
probe/interdict hunter's scan, own-body checks and heavy-bomb decisions.
No STOSB implementation was found in the local candidate ASM search.

Risks: losing B's established attack coverage; hostile writes during the
one-byte exposure window; friendly fire against A or captured processes;
linear-path interactions and corruption of registers by changed opcodes.
A painted AA byte is not necessarily lethal to another process. This is
a simple different survivor family, not a smart counter or proven gain.
Main review and assembly precede any structural smoke or field comparison.

Prepared generator (not invoked during authoring)

Main reviewed the source with no actionable correctness finding. The generator
does not assemble, launch Chrome, Java, or any other process. Root controls the
resource queue. After timing jobs finish, assemble this one source into this
directory's build/ using the existing root assemble.mjs (no installation):

node assemble.mjs candidates/generated/codex-goal-20261001/stosb-imp/build candidates/generated/codex-goal-20261001/stosb-imp/B-STOSB-imp.asm

Only after inspecting the assembly manifest/listing, freeze with:
node candidates/generated/codex-goal-20261001/stosb-imp/generate-screen.mjs

Preflight requires the reviewed source hash, one-source assembly manifest,
matching source/binary hashes, the expected 31-byte binary, exact 20-byte m050
B opener and exact five-instruction launcher bytes. It also pins the original
engine/runtime/runner, exact m050 A/B and previous frozen protocol artifacts.

Screen: exact m050 A + imp B versus exact m050 A/B, both named COD_pair.
Reuse frozen confirmation panel 2 without outcome selection: 25 senior trios,
62 unique teams in 75 slots (13 teams repeated), one seed, 20 battles/trio,
500 battles/arm, 1,000 total. This grouping differs from bootstrap panel 1.
One Java thread, parallel=false, no telemetry; root runs the two arms serially.

There is exactly one crypto.randomBytes(12) call, made only after successful
assembly and input preflight. Its 20-war Java-hash range must not overlap
frozen LEA, bootstrap or camper ranges (their recorded older exclusions are
also retained). The draw is recorded before collision validation. A collision
or interruption leaves the attempted screen visible; the generator refuses an
existing screen/ and never automatically redraws or overwrites it.

Everything generated stays under screen/: randomness, immutable control/imp
binary copies, two configs, manifest/checksum; future result/run locations are
separate there. The manifest freezes source, build proof, engine, runtime,
runner, generator, documentation, opponent/Zombie inputs and configs before
any Java execution. Run the read-only check before launching either arm:
node candidates/generated/codex-goal-20261001/stosb-imp/generate-screen.mjs --verify

Later root may invoke official-benchmark.mjs with screen/control.json and
screen/imp.json one at a time. Do not analyze incomplete arms: require exactly
25 matched cohort runs and 500 battles per arm, no missing/duplicate blocks,
identical names/seeds/rosters and verified hashes. Report paired mean delta,
25 cohort deltas and descriptive cohort sensitivity, not a binomial win-rate
interval. A positive screen is only a lead; it does not establish superiority
over m050 or m049 and needs independent validation against both controls.
