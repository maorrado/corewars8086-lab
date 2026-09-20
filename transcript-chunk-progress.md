# Full-audio chunk review progress

This ledger records chunks that were read in full while checkpointed
transcription continues. A chunk is marked only after every emitted segment in
its JSON file has been inspected. Final reconciliation still requires all
chunks for that item plus the already-completed visual/full-resolution pass.

| Item | Duration | Chunk size | Transcribed chunks | Fully read chunks | Final reconciliation |
|---:|---:|---:|---|---|---|
| 15 | 02:36:49 | 15 min | 0–10 | 0–10 | complete |
| 16 | 02:03:45 | 15 min | 0–8 | 0–8 | complete |
| 17 | 02:21:25 | 15 min | 0–9 | 0–9 | complete |
| 21 | 00:53:03 | 15 min | 0–3 | 0–3 | complete |

Chunk 0 observations retained for later reconciliation:

- Item 15 (`00:00–15:00`): advanced-room opening, exact Zombie `0067h`
  advertisement walkthrough, `CALL $+3`/`POP AX` position recovery, net
  arithmetic to the advertised address, `STOSW` destination/increment, and
  signed short backward jump explanation. No score claim.
- Item 17 (`00:00–15:00`): beginner-course foundations only—physical memory
  analogy, bits, RAM, numeric representations, RGB, and the high-level goal of
  keeping programs alive in shared memory. No engine-specific rule beyond the
  already-known shared-arena concept.
- Item 16 (`00:00–15:00`): first-session introduction and foundational binary
  representation lesson. It models stored bits as on/off states and converts
  decimal `45` by powers of two and repeated division. The brief statement
  that the competition language resembles 8086 is pedagogical context, not
  evidence that every architectural 8086 instruction is accepted by the
  custom engine. No arena, register, opcode, scoring, or submission rule is
  established in this chunk.
- Item 16 (`15:00–30:00`): completes the decimal/binary conversion lesson,
  introduces the generic CPU/opcode model and explains assembly mnemonics as
  human-readable names for machine encodings. At `24:00` it opens the browser
  CoreWars simulator and official guide, then builds the binary-to-hex nibble
  table. The presenter explicitly calls this introductory material; no battle
  score or CodeGuru-specific execution rule is established. Broad statements
  about all languages or CPUs are not substituted for the custom v6 subset.
- Item 16 (`30:00–45:00`): works through binary/hex conversion and defines
  bit, nibble, byte, word and dword, then discusses assembly/reversing at a
  general level. Only at the tail does it begin the first CodeGuru program:
  `JMP $`, bytes `EB FE`, in an arena initially filled with `CCh`. The spoken
  claim that the needed instructions are covered by course references is
  guidance, not proof that ordinary 8086 instructions outside v6's implemented
  subset are legal.
- Item 16 (`45:00–60:00`): steps `JMP $`, an attempted lone `WAIT` (`9Bh`), a
  near jump into untouched `CCh`, and a fixed-address Hunter that overwrites a
  passive survivor. The speaker first treats `WAIT` as a no-op and then admits
  the death may have another cause; the visual debugger and v6 source resolve
  this: lone `9Bh` itself is invalid, while only `9B 9B` is `NRG`. Likewise,
  the arena is exactly offsets `0000h..FFFFh`, not a garbled spoken range.
  `AX` initially equals the randomized load offset, opponents execute in a
  randomized order, and many battles are needed; the fixed placement and
  partial class runs are demonstrations, not performance evidence.
- Item 21 (`00:00–15:00`): why old code may contain decoys/duplicates;
  `INT 87h` signature exposure of a published/locked survivor; alternate
  far-call encodings; historical meta/anti-callfar; movement and sparse stack
  writes as mitigations; warning that segment shifting outside the arena makes
  execution illegal. Historical claims lack reproducible benchmarks.
- Item 15 (`15:00–30:00`): confirms the Zombie publishes its position and the
  captor polls `0067h`; screen evidence, rather than noisy ASR around `F0h`,
  fixes the exact later addresses. A dedicated captured-Zombie payload is
  recommended to reduce collisions with the live survivor. `MOVSW` is
  introduced as `DS:SI` to `ES:DI`, with both indices advancing according to
  `DF`, and as the basis of `bimp`-style moving copies.
- Item 15 (`30:00–45:00`): full `bimp` backward-copy walkthrough, including
  `STD`, the six `MOVSW` writes, final `DI` adjustment, and jump into the new
  copy. The instructor explicitly identifies slow copying and exposure of
  not-yet-executed copied bytes as its main risks. The tail introduces
  `INT 87h`; noisy/reversed register wording is not accepted over the visual
  slide and v6 source (`AX` then `DX` searched, `BX` then `CX` written,
  `ES:DI` plus `DF`).
- Item 15 (`45:00–60:00`): explains why an earlier duplicate of a critical
  four-byte sequence can serve as an `INT 87h` decoy, whereas arbitrary NOP
  padding cannot match that searched sequence. The instructors stress that
  every mobile/copying pattern has recognizable weaknesses and that no design
  defeats every opponent. A later mentor starts the far-call lesson: a far
  call pushes both return segment and offset, so redirecting `SS:SP` can turn
  those implicit pushes into arena writes. The final Q&A clarifies that a
  copied block is not a second scheduled process; only the currently executed
  next instruction determines whether the survivor remains alive, and
  attempts to escape execution outside the arena are rejected.
- Item 15 (`60:00–75:00`): develops near versus far calls. A near indirect
  call consumes the offset word at the addressed memory and pushes one return
  offset; a far indirect call consumes a four-byte pointer containing offset
  and segment and pushes both pieces of return state. The spoken byte-order
  examples are noisy, so the source-resolution slide and v6 implementation
  remain authoritative: pointer offset then segment, old `CS` pushed before
  return `IP`. The instructor identifies the four-byte implicit stack write
  as the bombing opportunity when `SS:SP` is redirected into the arena.
- Item 15 (`75:00–90:00`): constructs the self-calling far-call writer in
  detail. Runtime `AX + (call_far-start)` yields the call site's offset; the
  team-shared `ES` block is temporarily mapped through `DS` to hold the stable
  four-byte pointer (`[BX]=offset`, `[BX+2]=CS`), while `SS=CS` and `SP` choose
  the arena write head. Each self-call pushes four bytes, lowers `SP`, and
  returns control to the same call instruction, creating a backward four-byte
  stream. The pushed offset is the already-advanced return IP, not necessarily
  the exact call-site offset. A spoken minimum-distance estimate in this
  exploratory workshop is not accepted over v6's source-backed 1,024-byte
  initial placement rule.
- Item 15 (`90:00–105:00`): resolves two mechanics explicitly: ordinary word
  pushes decrease `SP` by two, a far call decreases it by four, and `DF` does
  not change stack direction; `DF` only controls index movement for string
  operations such as `MOVSW`. A Q&A correctly describes `LES r16,m16:16` as
  loading the first word into the register and the following word into `ES`.
  Discussion of Zombie speed `9`, Zombies always going first, and a
  participant's `REP MOVSW`/segment-shift mover is provisional workshop talk,
  not a demonstrated 2025 contract; v6 source fixes configured speed, process
  ordering, `REP`'s one-iteration-per-turn behavior, and execution bounds.
- Item 15 (`105:00–120:00`): discusses why byte-copy (`MOVSB`) movers can
  escape the visually common `A5h` columns targeted by a historical
  stride-256 counter, and re-demonstrates `MOVSW` as copying `DS:SI` to
  `ES:DI` with both indices changing by two according to `DF`. A participant's
  live `REP MOVSW` mover is exploratory and initially buggy; v6 still executes
  one repeated string iteration per scheduled opcode. The class confirms that
  two consecutive `WAIT` bytes form `NRG`, increasing an energy counter that
  probabilistically permits a second opcode in a turn. The exact decay and
  probability formula remain sourced from v6, while the instructors correctly
  frame NRG as a tradeoff versus productive bombing/setup rather than a free
  speed boost.
- Item 17 (`15:00–30:00`): continues Unicode/RGB/binary representation and
  course administration. It introduces powers of two but adds no engine rule.
- Item 17 (`30:00–45:00`): RAM imagery, powers-of-two decomposition, and the
  subtraction/division algorithms for decimal-to-binary conversion. No
  simulator, opcode, memory-layout, score, or submission claim appears.
- Item 17 (`45:00–60:00`): finishes worked binary-conversion exercises and
  then introduces a generic CPU as a component that fetches numeric opcodes
  from memory according to an instruction set. This is conceptual background;
  it does not yet establish any CodeGuru-specific opcode or engine behavior.
- Item 17 (`60:00–75:00`): moves into the browser simulator and uses a toy
  `INC BX`/`CMP`/`JNE` program that counts to ten and back to zero to connect
  assembly source, numeric opcodes, registers, and memory. The rest introduces
  hexadecimal and the four-bits-per-hex-digit mapping. The code is explicitly
  a teaching program, not a survivor or measured competition result; accepted
  engine behavior still comes from the v6 implementation rather than the
  generic statement that assembly translates directly to machine bytes.
- Item 17 (`75:00–90:00`): finishes hexadecimal/opcode representation, then
  demonstrates `JMP $` as bytes `EB FE` and explains `IP` as the pointer to
  the next executed arena instruction. A deliberately fixed-placement Player
  B writes `CCCCh` over Player A at `A000h`; A dies only when its live path
  fetches the newly invalid `CCh` bytes. The instructor explicitly says that
  knowing the target address this way is a classroom simplification. The
  partially displayed Competition result and anecdotal past win are not
  controlled benchmark evidence.
- Item 17 (`90:00–105:00`): repeats the fixed-address attack from the victim's
  view and then carefully distinguishes `MOV BX,imm` (change the register)
  from `MOV WORD [BX],imm` (write a word at `DS:BX`). It revisits operand sizes
  and hexadecimal notation before showing `CCCCh` written at the address held
  in `BX`. Relocating a live survivor is mentioned as an advanced later topic,
  not demonstrated here; this chunk adds no random-targeting method or score.
- Item 17 (`105:00–120:00`): continues the beginner recap: explicit operand
  size determines whether a memory write stores one byte or one word;
  brackets dereference an address held in a register; `IP` advances by each
  variable-length instruction unless control flow changes it; labels are
  assembler names and emit no bytes. The same fixed-address overwrite and
  `JMP $` loop are replayed. Scheduling/random placement is finally raised at
  the tail, but no randomized targeting solution is completed in this chunk.
- Item 16 (`60:00–75:00`): contrasts a fixed-address classroom hit with the
  practical default of bombing broadly when randomized placement hides the
  target. `IP` advances to the byte after the complete variable-length
  instruction, not merely one byte. A single `CCh` is enough to invalidate a
  future fetch, but a word store costs the same scheduled opcode and therefore
  usually damages two bytes. The victim dies only when its process later fetches
  the overwritten instruction. The lesson also makes the arena design explicit:
  `CS` and `DS` point at the same shared code/data memory, so ordinary writes can
  corrupt executable bytes; `ES` and `SS` are separate initial regions. A toy
  Hunter without a terminal loop dies after its one write, while adding `JMP $`
  leaves both toys alive until the limit. Spoken guesses about the exact limit
  do not override v6. Labels emit no bytes, and the first broad writer must keep
  pointer initialization outside the loop before adding two on each pass.
- Item 17 (`120:00–135:00`): answers the randomized-placement problem: load
  positions change between battles, not between scheduled instructions, and a
  submitted program cannot be edited live. A moving address register can cover
  the arena, while precise Zombie/smart-bomb work is deferred to later lessons.
  The participant then experiments with a survivor that writes instruction
  bytes into another location. The early forms mix `070Eh`/`0E07h`, `[BX+4]`
  versus `[BX+2]`, and temporary `PUSH CS`/`POP ES`; the instructor confirms the
  code-writing-code principle but repeatedly corrects the construction. The
  source-resolution screen, not noisy ASR spelling of hex bytes, remains the
  authority. This is an exploratory injection trace, not a stable takeover or
  benchmark.
- Item 15 (`120:00–135:00`): closes the moving-copy discussion with the
  recurring speed/survivability tradeoff: each `MOVSW` copies two bytes, several
  consecutive copies can move a compact payload, and spacing/movement logic
  costs additional opcodes while both the source and destination remain attack
  surfaces. The lesson then formalizes two-survivor cooperation. The pair may
  contain identical or different programs and uses the same base name with
  suffixes `1` and `2`; scheduling order is chosen by the engine, so partners
  cannot assume adjacent turns. Both receive the same team-private, 1,024-byte
  `ES` segment, inaccessible to opponents, and may exchange addresses or other
  messages there. In the concrete `cannon` example, survivor 1 stores its
  randomized start `AX` at `ES:0`; survivor 2 executes `PUSH ES; POP SS`, uses
  `BP=0` so `[BP]` defaults through `SS`, reads the published address, and bombs
  backward from it while the first cannon attacks forward/from its own simple
  origin. The live trace confirms the shared value and parallel bands, but the
  instructor explicitly calls the pair collision-prone and unsuitable as a
  finished competitive design. Spoken score fractions are only examples of the
  living-process denominator and do not replace the exact v6 formula.
- Item 17 (`135:00–141:25`): finishes the injected-code experiment. With a
  known target location, writing word `070Eh` produces arena bytes `0E 07`
  (`PUSH CS; POP ES`), and writing word `00ABh` at the next word produces
  `AB 00`, so the victim can fetch `STOSW` after the two segment opcodes. The
  earlier failure was byte order/placement, not a new instruction rule. The
  instructor stresses that arbitrary opponents are normally easier to kill
  with invalid bytes; deliberate redirection is most valuable for Zombies.
  General Zombie capture means discovering its current location or an
  exploitable live instruction, overwriting that path with a payload or an
  indirect jump to the survivor, and thereby making the independently scheduled
  Zombie process execute team work. Exact discovery/patch details are
  Zombie-specific puzzles, so this conceptual recap does not replace the
  concrete advertisement and `FF 26` construction in items 12–14.
- Item 16 (`75:00–90:00`): fixes the first broad bomber's self-destruction
  problem. Since 16-bit arena offsets wrap, starting at zero eventually reaches
  the writer itself. Initial `AX` supplies the randomized load offset, and
  `AX + (end-start)` lets a label-derived pointer begin just after the compiled
  body without manually counting bytes; advancing that pointer then circles the
  arena before reaching the survivor. Competition examples are still toy-versus-
  toy demonstrations, and the instructor explicitly notes that historical
  survivors attack faster and beat this design. The course uses browser NASM-
  style syntax and warns that assembler dialect details differ. Increasing a
  word writer's stride from two to four covers offsets faster but leaves gaps;
  the spoken roughly one-in-four alignment illustration applies only to that
  simplified stationary victim, not a general hit-rate theorem.
- Item 15 (`135:00–150:00`): expands partnership beyond the simple cannon:
  shared `ES` can exchange both load positions and derived offsets, coordinate
  collision/stride patterns, and make two attacks cover different regions. The
  workshop revisits historical `A5h`/`MOVSW` and call-far families and argues
  that row/column geometry must be chosen against moving targets, but explicitly
  warns that once a popular column is known opponents target it. A participant's
  claim that a hybrid mover/bomber beat either component is left unproven; the
  mentor asks for many battles and traces before explaining it. The TOM_ATO
  story is the clearest methodological lesson: its genetic search optimized
  strongly against the first-stage published pool, then opponents adapted and
  it did not win the final. The local engine can be scripted for automated
  evaluation; released stage-one survivors are published for study; every
  Zombie in the active stage pack is run, while the pack may change between
  stages with advance notice. Claims about a prior winner's exact `A5h` or
  mathematical attack mechanism are explicitly second-hand and are not promoted
  to engine facts or benchmark results.
- Item 15 (`150:00–156:49`): final Q&A adds no secret rule: only organizer
  channels, the current site and supplied Zombies/tasks are authoritative, and
  presenters warn against spending time on undisclosed-change speculation. The
  historical `A5h`/`MOVSW` replicator is restated as a once-popular pattern that
  created a predictable counter-meta of continuously attacking that column.
  Pages briefly showing older-year distance/size values are versioned material;
  the current stage's `512` bytes and the later final's `256` bytes remain
  separate contracts. TOM_ATO's genetic algorithm was an external optimizer
  that generated/evaluated survivor variants; it was not code embedded in the
  submitted 8086 binary. The speaker is uncertain whether prior Zombie solutions
  were published, so that is not treated as an official rule or available
  artifact.
- Item 16 (`90:00–105:00`): makes the coverage/survival tradeoff concrete.
  Larger strides traverse offsets faster but create gaps large enough for a
  compact or moving survivor; an opponent can also place a sentinel before its
  live code, detect a changed word, and relocate before a slow wave arrives.
  The relocation demo first writes word `FEEBh` (arena bytes `EB FE`) at
  `AX+0200h` but mistakenly uses `JMP [BX]`, which dereferences that word and
  jumps to offset `FEEBh`; after the failed run the source is corrected to
  `JMP BX`, which enters the planted self-loop at the address held in `BX`.
  Thus the screen resolves a meaningful bracket distinction that the spoken
  wording alone obscures. A later byte writer steps backward by three and
  produces a sparse diagonal; geometry is a consequence of byte/word width and
  stride, not a special attack primitive. A process remains alive despite its
  old body becoming garbage after relocation; it dies only when its current
  path fetches an invalid opcode. Older tutorials may use different syntax or
  rules, so current v6 evidence remains authoritative.
- Item 16 (`105:00–120:00`): advanced Q&A demonstrates the heavy bomb and
  previews the stack/far-call family. `PUSH CS; POP ES` redirects the bomb to
  the arena, `DI` is derived from `AX` plus a label offset, and `AX`/`DX` hold
  the repeated words before `INT 86h`. Only two heavy-bomb calls per survivor
  have effect; copying or relocating the code does not reset the process's
  charges. The speaker later generalizes that both custom interrupts have two
  uses, but this conflicts with the official slide and v6 source: `INT 87h` has
  one charge, so the source-backed rule prevails. The Java engine source is
  public and explicitly recommended for resolving such implementation details.
  A far call saves a four-byte segment:offset return address; mapping `SS` to
  the arena can turn that implicit push into a four-byte writer. The presenter's
  phrase “the winning strategy” for a moving stack bomber is an enthusiastic
  design heuristic, not measured universal dominance. Engine charges and life
  attach to the scheduled process/`CS:IP` state, not to every copy of its bytes.
- Item 16 (`120:00–123:45`): after several invalid/uncertain live syntax
  attempts, the presenter returns to the official far-call slide. The stable
  demonstrated form is the four-byte memory pointer used by
  `CALL [DWORD BX]`; redirecting the stack to the arena writes the far return
  state four bytes at a time. The claim that this “usually wins” is workshop
  experience rather than a controlled benchmark. The presenter explicitly says
  `STOSW` was not his own specialty and defers a deeper treatment, so no new
  `STOSW` optimization is inferred from this closing Q&A.
- Item 21 (`15:00–30:00`): expands on `A5h`-tolerant targets, historical
  survivor takeover, signature-byte motivation, coordinated equal-stride team
  movement, sparse `SP` stepping, and the cost of explicit self-skip checks.
  Claims that a historical version won are provenance, not reproducible
  benchmark evidence; exact 2025 disclosure/signature rules come from the
  official final briefings.
- Item 21 (`30:00–45:00`): completes the stack-pointer explanation and repeats
  the anti-callfar rationale; the shown historical survivor is about `75h`
  (`117`) bytes before stage-specific padding. The discussion then mixes
  junior byte-50 signatures, tentative deadlines, and an uncertain `XLAT`
  explanation; those are not accepted over the official 2025 rules or v6
  source. The tail begins the macOS/Java v5.0.1 setup walkthrough.
- Item 21 (`45:00–53:03`): macOS terminal/release setup, note taking, file
  transfer and scheduling only. No new technical rule or benchmark. Full item
  reconciliation is recorded in `study-notes/README.md`.
