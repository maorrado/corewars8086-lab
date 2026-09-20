# CodeGuru Xtreme 2025 consolidated rules

Status: complete evidence-backed consolidation of all 31 supplied unique
recordings, their full visual timelines and source-resolution demonstrations,
reconciled against the official v6 engine source and the final 2025 briefings.

## Three layers that must not be mixed

1. **v6 execution engine:** CPU subset, memory, scheduling, interrupts,
   placement, battle termination and score calculation.
2. **qualification-stage validator and workflow:** file size, signatures,
   deadlines, public/damaged opponent releases, which survivor is locked and
   the `5% + 25% + 70%` advancement score.
3. **2025 final-event contract:** a clean-slate event with new Zombies/tasks,
   `256`-byte survivors, no signatures, staged Survivor 1 then Survivor 2
   publication/submission, and a later top-four phase.

An earlier stage's `512`-byte/signature rule is not an engine opcode rule, and
the final's `256`-byte/no-signature rule does not retroactively describe the
qualification submissions.

## v6 battle contract

- The shared arena is 65,536 bytes, initially `CCh`, at `CS=DS=1000h`.
- Each survivor starts at a randomized load offset with `AX=IP=offset`.
  `BX=CX=DX=SI=DI=BP=0`; flags and energy start at zero.
- Each survivor has a private 2,048-byte stack at `SS`, `SP=0800h`. Both
  teammates share a private-to-team 1,024-byte segment at `ES`; opponents and
  Zombies have different shared segments.
- Loaded programs begin at least 1,024 bytes apart. There is no protection
  after loading: 16-bit offsets wrap and every arena byte is writable.
- A normal process executes one emulator opcode per round. A surviving team
  member is an execution stream (`CS:IP` plus state), not every byte it has
  ever painted. Old corrupt bytes matter only if a live path later executes
  them.
- Within a round, the engine walks the loaded process array. A Zombie's
  speed-2 opcodes run consecutively in its turn rather than alternating with
  survivor opcodes; an NRG-earned bonus opcode also immediately follows that
  survivor's mandatory opcode. Turn order is therefore tactically relevant
  within one battle even though many randomized battles should average it.
- The round cap is 200,000. The engine can stop earlier when only one relevant
  survivor/team outcome remains.
- At scoring, if `L` non-Zombie survivors remain, each gets `1/L`; the two
  survivor scores are added for the team. A surviving Zombie never earns
  score in v6, even after capture.

## Engine-only operations

- `NRG` is exactly `9B 9B`. It adds one energy (up to `FFFFh`). Every fifth
  round one positive energy is lost. A survivor can gain at most one extra
  opcode after its normal opcode, with probability
  `min(16,1+floor(log2(E)))/16`.
- `INT 86h` has two charges per survivor. Each call performs 64 virtual dword
  stores—256 bytes total—from `ES:DI`, repeatedly writing word `AX` then word
  `DX`. `DF` selects forward/backward direction; `DI` moves by four per dword.
  Calls after the two charges do nothing.
- `INT 87h` has one charge per survivor. Starting at `ES:DI` and following
  `DF`, it searches the full 16-bit offset space for four bytes `AX` then `DX`
  and replaces the first match with `BX` then `CX`. It leaves `DI` unchanged.
- A lone `9Bh`, ordinary interrupts, `INT 3`/`CCh`, unsupported instructions
  or invalid mixed bytes kill the process. See `engine-v6-opcodes.md` for the
  accepted subset and nonstandard `REP`/flag behavior.

## Core technique lessons

- `STOSW` writes `AX` to `ES:DI`; `DF=0` adds two and `DF=1` subtracts two.
  `MOVSW` copies `DS:SI` to `ES:DI`; `LODSW` loads `DS:SI` into `AX`.
- Generated words such as `ABABh`, `AB90h` and `AB50h` are executable byte
  streams, not magic opcodes. `AB50h` becomes bytes `50 AB`
  (`PUSH AX; STOSW`), enabling a compact two-direction writer after placing
  both `SS:SP` and `ES:DI` in the arena.
- Broad painted coverage is not sufficient. The decisive risk is the latency
  and distance between the live `CS:IP` and future bytes already written into
  the arena; those bytes can be corrupted before execution reaches them.
- Replication/far-call designs deliberately redirect stacks and construct
  offset-then-segment pointers. Their correctness depends on the exact v6
  stack push order, one-iteration-per-turn `REP`, instruction alignment and
  the copied tail remaining concurrently executable.
- Far-call writers expose pushed `CS:IP` material in the arena. A watcher can
  use a changed barrier to infer the writer and counterattack; sparse stack
  steps and relocation reduce that window but spend instructions and do not
  defeat every detector. Segment-shift relocation must also remain inside the
  arena's executable region.
- `INT 87h` decoys can place a harmless occurrence of a known four-byte
  signature before the live occurrence in the expected search direction.
  This is charge absorption, not immunity: it costs bytes and is sensitive to
  direction, signature choice and ordinary writes.
- A generic scanner that bombs the first non-`CCh` byte is easily fooled by
  old writes or decoys. Exact byte-pattern attacks are more selective but are
  exposed to `INT 87h`-style decoy defenses and field adaptation.
- Zombie takeover means altering a supplied Zombie's future control flow so
  its independently scheduled process enters chosen attacker code. Merely
  overwriting or killing it is not capture, and the Zombie itself never adds
  direct score.

## Qualification workflow

- Senior submissions contain two survivors, at most 512 compiled bytes each.
  Compiled byte positions `39, 78, 117, ...` (one-based) must be `90h`. Junior
  material uses 128 bytes and byte 50; our target is the senior track.
- The validator is byte-oriented. A `90h` occurring inside another
  instruction's immediate/displacement satisfies the server check, but adding
  a new byte inside an instruction corrupts its decoding.
- The first online stage contributes 5%, the next Thursday submission 25%, and
  the physical qualification event 70%. Both survivors are submitted on
  Thursday; Survivor 2 is then locked while Survivor 1 may be adapted on site.
- Before Thursday, the field is published in damaged hints: 20 original bytes
  followed by 20 `CCh` bytes repeatedly. A readable block can begin in the
  middle of an instruction. After Thursday, full binaries are published for
  the adaptation period.
- v6.0.0 is the definitive 2025 judge from this stage onward. Browser results
  are useful for stepping/visualization but are not scoring evidence.
- Qualification points decide advancement but do not carry into the final;
  finalists start again at zero.

## 2025 final workflow

- The final is a clean slate. It supplies one or two new, intentionally
  analyzable but powerful Zombies at speed 2 and new tasks. Reusing a generic
  survivor without adapting its Zombie interaction is expected to be weak.
- Final survivors are limited to 256 compiled bytes and require no signature
  bytes. Web deadlines are strict; no late manual/USB fallback is promised.
- Teams first submit Survivor 1. Those first survivors are then published for
  both divisions, and teams receive a short analysis window before submitting
  Survivor 2.
- A run selects the top four in each division. Places 5–8 are ranked after
  removing the top four from that pool. Top-four teams receive an additional
  work period and may replace both survivors before the final 1–4 ranking run.
- Senior teams also receive a separate Zombie-fractal task before the event.
  Partial completion earns partial credit, but the reviewed briefings do not
  settle a reliable exact percentage or code-length tie-break rule.

## Evaluation consequence

The stock v6 competition runner does not fully honor its seed for team cohort
selection/order and samples combinations with replacement. Reproducible
research must enumerate explicit four-team cohorts externally and use the
minimal deterministic test-only runner described in `engine-v6-facts.md`,
while leaving CPU, War, placement, scoring and Zombies identical to official
v6. No performance claim will be accepted without exact binaries, hashes,
opponents, Zombies, seeds, battle counts, team and per-survivor scores.
