# CoreWars8086 v6.0.0 facts for the 2025 study

Authority checked: official `codeguru-il/corewars8086` tag
`corewars8086-6.0.0`, commit `63ffbe3ef3e12e80744e829fd92176b458ab4d5b`.
The official release labels this as the engine used in CGX 2025.  These facts
override behavior inferred only from the older browser port when they differ.

## Browser simulator versus the 2025 judge

- The checked-in browser port's `Cpu.java` is byte-identical to official v6's
  `Cpu.java`, so its single-opcode stepping is useful for inspecting the CPU
  subset and virtual interrupts.
- Its `War.java` is materially older. It has no v6 Zombie type/speed branch,
  runs the ordinary energy path for every process, ends only when fewer than
  two total processes remain, and divides score by all living warriors,
  including Zombies. Official v6 separately counts living non-Zombie
  survivors, gives Zombies configured consecutive opcodes, applies NRG only to
  non-Zombies, terminates on the surviving-team conditions below, and excludes
  Zombies from score.
- Consequently the browser is appropriate for editing, fixed-placement
  stepping and arena visualization, but its full-battle duration, Zombie
  timing and score are not 2025 judge evidence. This source diff independently
  confirms the organizers' repeated instruction to rerun submissions in the
  released Java v6 engine.

## Initial state and memory

- Arena segment: `CS=DS=1000h`; arena size: 65,536 bytes; initial arena byte:
  `CCh`.
- `AX=IP=random load offset`. `BX=CX=DX=SI=DI=BP=0`, flags are zero.
- Every survivor has a private 2,048-byte stack; `SS` points at it and
  `SP=0800h` initially.
- Both survivors in one team receive the same private 1,024-byte shared block
  through `ES`; different teams receive different blocks.
- Read/write access is restricted to the complete arena, that survivor's stack
  and its team's shared block. Instruction fetch is permitted only at linear
  addresses inside the arena. Changing `CS` is useful only when the resulting
  real-mode linear address still aliases the arena; trying to execute private
  stack/shared memory raises a memory exception and kills the process.
- Source audit exposes a potential one-byte stack-boundary bug. The allocator
  reserves 2,048 bytes, but the allowed stack region is constructed from
  `SS:0000` through initial `SS:0800` with an inclusive end check. A byte access
  at offset `0800h` therefore appears permitted and physically aliases the
  first byte after the allocation. This must be tested empirically before any
  candidate relies on it; a word crossing farther past that boundary should
  still raise a memory exception.
- Initial load placement leaves at least 1,024 bytes around arena boundaries
  and between loaded programs.  This is only an initial separation; all
  16-bit offsets subsequently wrap in the usual arena segment.
- Maximum accepted survivor size is 512 compiled bytes.  The 39-byte signature
  rule is a submission validator rule shown in the 2025 material, not a CPU
  semantic implemented by the arena executor.
- The official submission site's validator enumerates compiled bytes with a
  zero-based index `i` and rejects a file when
  `i % signature_gap == signature_offset` but that byte is not the configured
  signature value. Gap, offset, byte value, enable/disable and maximum length
  are per-competition database fields. Thus the 2025 requirement at one-based
  positions `39,78,...` corresponds to gap `39`, offset `38`, value `90h`;
  it must not be implemented as “index modulo 39 equals zero.”
- The 2025 training explicitly distinguishes categories: senior submissions
  use every `39`th compiled byte (`39,78,...`), while junior submissions use a
  `NOP` at compiled byte `50`. The survivor pair being developed for the
  senior/CoreWars8086 track must use the former unless the target category is
  explicitly changed.
- Those limits belong to the online qualification stage. The 2025 final
  briefing explicitly changes the final-event contract to at most `256`
  compiled bytes and disables signature-byte requirements. The CPU still has
  no built-in notion of either rule; the web competition configuration enforces
  the applicable stage contract.

## CPU subset and important 8086 deviations

- v6 is an emulator of a selected 8086 subset, not a promise that every real
  8086 opcode or every architectural edge case works. An invalid, unsupported,
  or unimplemented opcode kills that survivor when execution reaches it.
- Implemented core families include `MOV`, `XCHG`, `LEA`, `ADD`, `ADC`, `SUB`,
  `SBB`, `AND`, `OR`, `XOR`, `CMP`, `TEST`, register/memory `INC` and `DEC`,
  `PUSH`/`POP`, near/far `CALL`, `RET`/`RETF`, near/far/short `JMP`, the short
  conditional jumps, `LOOP*`/`JCXZ`, `CBW`, `CWD`, `LES`, `LDS`, unsigned
  `MUL`/`DIV`, rotates/shifts, `XLAT`, and the byte/word string operations.
  The exact ModR/M form still matters; a mnemonic being present does not make
  every impossible register/memory encoding valid.
- For an indirect far call (`FF /3`), the four-byte memory operand is read as
  **offset word followed by segment word**. The engine pushes the old `CS`
  first and then the already-advanced return `IP`; `RETF` correspondingly pops
  `IP` first and `CS` second. This confirms the stack order drawn in the item 15
  workshop and matters when a redirected `SS:SP` deliberately turns the call's
  saved return state into arena writes.
- The common segment-override prefixes (`26h`, `2Eh`, `36h`, `3Eh`) are marked
  unimplemented. `PUSHA`/`POPA` and the whole `60h..6Fh` range are invalid;
  `ENTER`/`LEAVE`, `AAM`/`AAD`, `IMUL`/`IDIV`, x87, `IN`/`OUT`, `LOCK`, and
  `HLT` are invalid, unsupported, or unimplemented. `INT 3`, `INTO`, and every
  software interrupt other than `INT 86h`/`INT 87h` kill the survivor.
- A single `9Bh` (`WAIT`) is invalid in this engine; only the consecutive pair
  `9B 9B` is the virtual `NRG` instruction. Likewise `CCh` is decoded as
  `INT 3` and kills a process, which is why the untouched arena is lethal.
- `XLAT`/`XLATB` (`D7h`) is implemented exactly as a byte table lookup:
  `AL = byte [DS:(BX + unsigned(AL))]`. The hesitant verbal explanation in
  item 21 is therefore not used as evidence; the source fixes both the default
  segment and the unsigned eight-bit index.
- `REP`/`REPZ`/`REPNZ` deliberately perform only one string iteration in one
  scheduled opcode and then rewind `IP` to the prefix while more iterations
  remain. Therefore `REP MOVSW` is interruptible across turns and is not an
  atomic full copy. This materially changes the exposure/timing analysis of
  replicators and copied far-call tails.
- Arithmetic flag behavior is incomplete. The source never updates the
  overflow or auxiliary-carry flags in the generic arithmetic helpers; logical
  operations can consequently leave an older overflow value rather than
  reproducing all real-8086 flag clearing. Strategies must not assume exact
  architectural `JO/JNO` or auxiliary-carry behavior without a v6-specific
  test. Zero, sign, parity and the implemented carry/borrow behavior are the
  safer tested branch inputs.
- The source itself flags a possible indirect `JMP SP` bug. Such edge forms,
  and any opcode not used in the lessons, require a direct v6 conformance test
  before inclusion in a candidate.

## Scheduling and energy

- A normal living survivor executes one opcode in each round.
- `War.nextRound` walks the loaded warrior array in order. A Zombie executes
  its configured opcode count consecutively inside its own turn (and a
  `ZOMBIE_H` twice that count), rather than having those opcodes interleaved
  one-by-one with survivor turns. A survivor's probabilistic NRG bonus opcode
  is likewise executed immediately after its mandatory opcode.
- Engine-only `NRG` is exactly two consecutive bytes `9B 9B`. A lone `9B`
  is unsupported. Executing `NRG` increments the 16-bit energy register by one
  up to `FFFFh`.
- Every fifth round, positive energy decreases by one. After the mandatory
  opcode, the survivor may execute at most one extra opcode. The probability
  is `min(16, 1+floor(log2(energy))) / 16`; at energy zero it is zero.
- Zombies do not use NRG scheduling. Their opcode count per round is the
  command-line `zombieSpeed`; a name classified as `ZOMBIE_H` runs at twice
  that rate. The v6 default/preset shown in the bundle uses speed `2`, but a
  tournament can change this command-line parameter.

## Virtual interrupts

- Every survivor starts with two `INT 86h` charges and one `INT 87h` charge.
- `INT 86h` consumes a charge and performs 64 virtual `STOSD` operations:
  256 bytes total, writing the dword represented by `DX:AX` from `ES:DI` in
  the current direction and moving `DI` as those stores do. With no charge
  left, the interrupt performs no write.
- `INT 87h` consumes its one charge and searches the full 16-bit offset space
  beginning at `ES:DI`, forward when `DF=0` and backward when `DF=1`. It finds
  the first four bytes whose first word equals `AX` and second word equals
  `DX`, then replaces those words with `BX` and `CX`. It leaves `DI` unchanged.
  With no charge left it performs no search/write.

## Battle termination and scoring

- The v6 competition cap is 200,000 rounds.
- A battle ends early when at most one process remains, when only one
  non-Zombie survivor remains, or when the only two surviving non-Zombies are
  the two members of the same team.
- At scoring time, let `L` be the number of living non-Zombie survivors. Every
  living non-Zombie receives `1/L`; dead survivors receive zero. Team score is
  the sum of its two survivor scores. Therefore both partners alive in a
  winning pair contribute `1/2 + 1/2 = 1`, while one surviving partner alone
  contributes `1`.
- Zombies never receive score in v6. This is an explicit v6 correction and is
  a material difference from older releases/browser-derived assumptions.

## Evaluation parameters versus immutable rules

- The v6 CLI defaults are four survivor groups per combination, 100 battles
  per combination, Zombie speed 2, and a selectable seed. These are runner
  defaults and match several lesson demonstrations; they are not proof that
  every official stage uses exactly those counts.
- Official ranking claims must therefore record engine tag, opponent pool,
  Zombie pack and speed, group-combination size, repetitions/total battles,
  and seeds. A score without those fields is not reproducible evidence.
- Source audit exposes an important v6 runner limitation. The displayed/CLI
  seed is passed to each `War` and controls placement, team load order and NRG
  extra-turn randomness inside that war. `CompetitionIterator`, however, uses
  a separate `RandomDataGenerator` with no call that applies the UI/CLI seed.
  With more teams in the pool than `comboSize`, the seed alone therefore does
  not reproduce which opponents were selected.
- Even when the pool contains exactly four teams, `nextPermutation(4,4)`
  supplies them to `War` in an unseeded random order; the seeded loader then
  operates on that permuted list. This is behaviorally relevant because it can
  change scheduling/load order. An empirical check ran the bundled four teams
  twice for 50 battles with identical `--seed=repro`, serial mode and all
  other parameters unchanged. The two CSVs differed (for example `bimp`
  scored `0` in one and `3` in the other), confirming that the stock runner's
  seed is not a complete run identifier.
- Despite the comment saying “every possible combination,” v6 computes the
  total run count as `C(number_of_teams, comboSize) * battlesPerCombo` but each
  iteration calls `nextPermutation` afresh. It samples team combinations with
  replacement rather than enumerating each combination exactly; some can
  repeat and others can be absent. Reproducible all-combination evaluation
  must therefore orchestrate explicit four-team directories/runs outside this
  iterator (or patch a separate test-only runner), while keeping the official
  CPU/War implementation unchanged.

## Deterministic evaluation build

- A separate checkout at `repos/corewars8086-6.0.0-deterministic` remains based
  on the exact official v6 commit. It changes only two runner concerns:
  `CompetitionIterator` is seeded from the competition seed, and serial mode
  honors the configured output filename instead of hard-coding `scores.csv`.
  CPU, memory, `War`, scheduling, interrupts, scoring, loading distances and
  termination rules are untouched.
- The modified source builds successfully with Maven/JDK 8 into
  `target/corewars8086-6.0.0-jar-with-dependencies.jar`.
- Repeating the same bundled four-team, 50-battle serial run twice with
  `--seed=repro` produced byte-identical CSV files, both SHA-256
  `E2A0502A55060A6B0D01D69F249DCF89655801392BE4D405CEEA35F7FD9BE83F`.
  This validates the minimal runner fix before using it for optimization.
- Explicit cohort enumeration still belongs in the external benchmark
  harness. Seeding the iterator makes its sampling repeatable; it does not
  transform random-with-replacement sampling into exhaustive combinations.
