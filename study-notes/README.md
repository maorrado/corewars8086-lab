# Video review ledger

A video is marked complete only after all four checks are satisfied:

1. audio reviewed from beginning to end with timestamped transcript;
2. screen reviewed from beginning to end through a five-second timeline plus
   change-triggered keyframes;
3. code/simulator demonstrations reviewed at full resolution and, when the
   arena changes dynamically, with a denser local frame sequence;
4. technical claims reconciled against the simulator source and the supplied
   final-rule videos, treating the complete set as the 2025 competition rules.
   Conflicts remain explicitly open until reconciled.

| # | Video ID | Audio | Visual timeline | Full-resolution demos | Notes/reconciliation |
|---:|---|---|---|---|---|
| 1 | `1JRjU6K1nL3uqSBvLeYodU3M1HGjys2TI` | reviewed | reviewed | reviewed | reconciled |
| 2 | `1rgIRkfwNRWlUEWxRd58N4rGyu9L5_rgR` | reviewed | reviewed | reviewed | reconciled: debugger setup and binary/hex foundations |
| 3 | `1iphMnAEktAeGN82tPS48w37sFlcpneu2` | reviewed | reviewed | reviewed | reconciled |
| 4 | `1eIHC5Me5iQpvTu08uDrHtiV6Dg5kKDUk` | reviewed | reviewed | reviewed | reconciled |
| 5 | `1fXj_DXCb4NTDor1uSLKtKiHOs_HcAHsn` | reviewed | reviewed | reviewed | reconciled |
| 6 | `1LBkErqdmzOoWs5WCVV5xcs36fMi_vb-n` | reviewed | reviewed | reviewed | reconciled |
| 7 | `1xgB1C-Dss2onAJie0OAETlLZWpjTmWyT` | reviewed | reviewed | reviewed | reconciled: generated `AB90` versus `ABAB`; speed/attack-surface tradeoff |
| 8 | `1aePsSm6YGYJKoIbmZPw72ZPyELN3G2hc` | reviewed | reviewed | reviewed | reconciled |
| 9 | `1wC3bqyg6HmtgFPAIeC0F6EwuAu-raam8` | reviewed | reviewed | reviewed | reconciled |
| 10 | `1q0Xl0NbBwJthnFE09lI2MMWGoYUyolzW` | reviewed | reviewed | reviewed | reconciled: simulator event-effects preview |
| 11 | `1v8rwdvyMvCyIUfKiqozerqiHv2nvpOEi` | reviewed | reviewed | reviewed | reconciled: continuation of event-effects preview |
| 12 | `1MMHCQ74KkvWSTnLdcBh_-k_QNcZMqCsc` | reviewed | reviewed | reviewed | reconciled introduction; code continues in item 13 |
| 13 | `1suqb-3WmgKxMMh3mla6LFjgxwMZZhBU7` | reviewed | reviewed | reviewed | reconciled: address leak, timing, indirect jump, capture setup |
| 14 | `1hRrPaaKUTsQaS7B-MzcBt1icncWWNwXB` | complete | reviewed | reviewed | full audio/screen reconciliation complete |
| 15 | `1uUQ_fKFwafvbmew5nn8fn-31JLqNzriC` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 16 | `1MK8Ro-dygnanTt9RJJ05z37QpRQOetTH` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 17 | `1waEAQoBa8FlzUAddBbTOlS9qKsEu_QzK` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 18 | `1TQsSha_0badzPWr1nWP1U-sdCbficlTh` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 19 | `1_zgyGUlxX3cHzc0XAVamwnYQTwZR0GtS` | reviewed | reviewed | reviewed | reconciled; complete 5-second timeline plus source-resolution checks |
| 20 | `1QXt98lxpzWJJIOuRzN393_5pMpWEFvOF` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete; far-call propagation family |
| 21 | `1iM72YJmTTmk3bB1e4ngeIBFaH1EttVEJ` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete; `shooterC` and anti-far-call analysis |
| 22 | `1q0Gq6DKsCxaYynoVgb4yj6t8-4_XG0pT` | reviewed | reviewed | n/a | full audio/screen reconciliation complete; staff/course routing only |
| 23 | `1Bh0qjqYx4xuDyXzNYgtatlZ4kPhhsPmj` | reviewed | reviewed | n/a | reconciled: staff introduction only |
| 24 | `1NSYW3wmGmiZeQqhRKJCzNUgW9ku6GxYD` | reviewed | reviewed | reviewed | reconciled: first challenge, signatures, size limits, engine guidance |
| 25 | `1CAziHkLDiW17nDxKH0Vj_5mDAocfIcxS` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 26 | `1qHq1Xmy-l2ozo3m3raa5dR6pdpIzcy1L` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 27 | `1j-TzON7V19IW7-9we1y4U1OZhw7E6J7-` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete; local runner/debugger workflow |
| 28 | `14fvw5XOw1ItAYtz4IpY53Uh_0yyWSE-r` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete |
| 29 | `1M5A-QAv3Z4S1A8z0dsOApgKVnzI0s8Cw` | reviewed | reviewed | reviewed | full audio/screen reconciliation complete; v6 and stage-B rules |
| 30 | `1pMfixUICw2Pis1JCMtujyXhr3h4XaTvY` | reviewed | reviewed | reconciled | complete: full audio and full-resolution screen pass |
| 31 | `1hjbCQ-pAu1WNt7XlR78QdZByVwsYNEsM` | reviewed | reviewed | n/a | reconciled; gallery-only administrative wrap-up |

## Visual pass: item 1

- `00:00–00:20`: Zoom/browser setup; no competition content yet.
- `00:20–00:40`: official CodeGuru Xtreme site and registration/groups
  interface.
- `00:40–01:50`: simulator introduction, source/disassembly panes, arena,
  stack/shared-memory/register panels, stepping and run controls.
- `01:50–04:35`: Competition mode, repeated battles, score table/bar chart,
  and the visible survivor spans in the arena.
- `04:40–05:25`: hand-drawn spatial explanation of several colored survivor
  regions and movement/direction in the arena.
- `05:35–06:20`: return to live simulator/results.
- `06:30–10:05`: discussion view; no shared technical screen.
- `10:10–10:50`: final return to Competition results and arena.

Full-resolution checks add the following screen facts without treating the
presenter's sample as a recommended design:

- The Competition window is shown running 500 battles and reports both a team
  total and separate columns for warrior 1/2. A checked `Two Warriors` control
  associates two source panes with one team entry.
- One loaded historical/sample warrior (`bimp`) visibly begins with
  `PUSH DS; POP ES; XCHG DI,AX; ADD DI,0xC; MOV SI,DI; ADD SI,0xA; STD; DEC DI;
  DEC DI;` followed by repeated `MOVSW`. This is useful later as an example of
  a backward-copying strategy, but the introductory result chart is not a
  controlled benchmark and no strength claim is derived from it.
- The arena view shows distinct colored instruction spans and can be zoomed to
  individual bytes while Competition scores remain open.

### Audio/screen reconciliation for item 1

- The introductory 2025 format is four randomly selected teams in a battle,
  with two survivor programs per team: eight competing survivor processes,
  plus a number of Zombies chosen by the organizers. Both members of a pair
  are expected to contribute and may cooperate.
- Survivors and Zombies are loaded at randomized arena locations that change
  between battles. Opponent selection also changes, so one visible battle or
  one favorable placement is not meaningful evidence of strength.
- At the base scheduling level, the engine advances one opcode—not one source
  line—for each living process in turn. A shorter attack cycle can therefore
  produce writes more often, while a slower cycle can compensate with a larger
  effect per attack. The later NRG rules add possible extra opcodes and refine
  this introductory round-robin model.
- A Zombie takeover is described here only with the intuitive phrase “touch
  it and it becomes yours”: the captured process then spends its own turns
  executing work for the team. This is not accepted as the technical takeover
  condition; items 12–14 provide the actual code-level mechanism.
- The presenter stresses statistical evaluation over many runs: random luck can
  let a weak survivor win an occasional battle, but changing placements and
  opponents over hundreds or thousands of battles exposes systematic strength.
  The spoken `10,000` is an illustrative large-run count, not established here
  as the official submission battle count.
- “Last survivor wins” is the conceptual objective. The simulator source and
  later scoring discussion refine it: at termination, each living process gets
  `1 / number_of_living_processes`; a living Zombie participates in that
  denominator but receives no team score. This explains why merely staying
  alive beside many Zombies is not equivalent to eliminating or taking them
  over.

## Visual pass: item 2

- `00:25–01:50`: simulator debugger and memory display; options shown include
  memory-panel visibility, step size, register visibility, continuing forever,
  and stopping on segment/unsupported-instruction errors.
- `02:00–04:50`: byte sequence from a loaded survivor is enlarged in Paint and
  mapped to a binary representation. The presenter edits the bit string in
  groups, so the audio is needed to distinguish opcode, byte, and bit-order
  claims.
- `05:05–10:25`: powers-of-two model (`8,4,2,1`, then `16,32,64,128`) using
  filled/unfilled stars; repeated worked conversions between bits and values.
- `11:15–14:05`: binary/byte diagram is tied back to the visible arena bytes;
  additional hex digits (`D`, `E`, `F`) are drawn.
- `16:20–17:50`: return to the actual byte sequence and pointer/location in the
  arena; this needs full-resolution extraction and transcript alignment.
- `18:10–20:30`: simulator run resumes, followed by another `8,4,2,1` worked
  example and wrap-up.

No rule was inferred solely from the drawings; the completed audio pass and
later engine-source reconciliation are recorded below.

Full-resolution review confirms that the lesson uses the actual loaded `bimp`
byte row as its running example (`1E 07 89 C7 B8 CC CC AB 83 C7 0B EB FA`) and
then teaches the binary place values `128,64,32,16,8,4,2,1` and hexadecimal
digits `A–F`. The simulator settings shown include selectable memory-panel
width, opcode coloring, per-register address pointers (`CS:IP`, `DS:*`,
`ES:*`, `SS:*`), and debugger-only “Continue Forever”. These are UI/debugging
facilities, not extra opcodes or tournament scoring rules.

### Audio/screen reconciliation for item 2

- The three-pane working environment is deliberately configured so the source
  programs, arena/memory, register pointers and decoded opcodes can be followed
  together. Options such as alternate/opcode coloring and automatic scrolling
  are observation aids; they do not affect tournament execution.
- The lesson is foundational rather than a new engine-rule lesson: a byte is
  eight bits, each hexadecimal digit represents one four-bit nibble, and the
  digits `A` through `F` represent decimal values 10 through 15. Grouping the
  visible memory into hex bytes makes the encoded instructions readable without
  manually expanding every bit.
- The audio repeatedly maps `8,4,2,1` within each nibble and
  `128,64,32,16,8,4,2,1` within a byte. Some spoken examples and the automatic
  transcript are garbled; the full-resolution drawings and the standard bit
  positions resolve them. No instruction semantics are accepted from a
  mistranscribed digit.
- The running byte row belongs to the loaded sample survivor. The lesson's
  purpose is to teach how source becomes opcode bytes and how those bytes appear
  in arena memory; it does not claim the sample is competitive or that a visual
  byte grouping marks source-line boundaries at runtime.

## Visual pass: item 3

- `01:10–03:50`: debugger layout is related to a hand-drawn arena model; the
  path is drawn leaving one edge and re-entering elsewhere, indicating the
  wrap-around concept that must be confirmed against the audio/source.
- `04:05–06:20`: a first minimal program is entered and stepped. Its visible
  structure is a label plus a self-jump (`jmp <label>`); its encoded bytes and
  position are inspected in the arena.
- `06:40–10:00`: the program is extended with a byte write. Paint enlargements
  tie the source operand/value to the red machine byte visible in memory.
- `10:20–14:25`: the write target/value are changed and stepped repeatedly;
  the arena bytes, IP path, and survival behavior are compared.
- `15:10–22:05`: a second warrior is introduced. Both are stepped while the
  colored byte regions and instruction paths are watched; several invalid
  variants visibly produce assembler/runtime errors.
- `22:55–27:25`: an attacking loop is developed further. A long repeated
  pattern spreads across the top of the arena, followed by a Competition run
  comparing two warriors.
- `27:30–28:45`: Competition score chart and wrap-up.

Full-resolution review resolves the exact teaching progression:

- Minimal survivor: `yahli: jmp yahli`, assembled as `EB FE`.
- First absolute write: `yahli: mov byte [0],9; jmp yahli`, assembled as
  `C6 06 00 00 09 EB F9`. The debugger visibly changes arena offset zero; this
  is an absolute `DS:0000` write, not a position-relative attack.
- Word/counting variant: `yahli: mov word [0],bx; add bx,1; jmp yahli`, bytes
  `89 1E 00 00 83 C3 01 EB F7`. Since `BX` begins at zero in the demonstrated
  engine state, the word placed at arena offset zero changes as `BX` advances.
- Two-warrior attack variant: `jo: mov byte [bx],0xcc; add bx,2; jmp jo`, bytes
  `C6 07 CC 83 C3 02 EB F8`. It writes `CCh` through `DS:BX` at every other
  byte. A frame showing `add bs,2` is an intentional/accidental typo with an
  assembler “symbol undefined” error; the corrected register is `BX`.

The visible teaching examples explain addressing and interference, but none is
accepted as a competitive design. In particular, the absolute `[0]` variants
do not use the randomized load position and the byte-stride loop is slow and
predictable.

### Audio/screen reconciliation for item 3

- The recording begins after part of the CPU/RAM/segment introduction was
  accidentally omitted. Its stack explanation is conceptual: a call must save
  where execution should return. The “external board everyone can see” wording
  is only an analogy and is not accepted as a CodeGuru memory-visibility rule;
  later lessons and engine source distinguish the private stack and team-shared
  area precisely.
- `BYTE` means an eight-bit write and `WORD` a 16-bit/two-byte write. A
  four-hex-digit register such as `BX` therefore needs the word-sized form when
  its whole value is stored. Square brackets select the memory location whose
  offset is inside them.
- The screen and audio agree on little-endian words: the low byte is placed at
  the lower address and the high byte at the next address. The debugger's byte
  order must therefore be decoded before treating a visible pair as a word.
- Fixed simulator load addresses are used only to make the lesson observable.
  Numbers in the source must be written with the assembler's hexadecimal
  notation (the demonstrated suffix form); entering a visually similar decimal
  value attacks a different address.
- Merely changing an enemy byte does not necessarily kill it. A replacement may
  decode as a valid instruction and leave the process running with altered
  behavior. In this lesson `CCh` is used because the arena's untouched
  background is filled with it and execution into that unsupported/invalid
  byte kills the warrior in the demonstrated engine configuration. “Death” is
  tied to the currently executed instruction, not to any arbitrary corruption
  elsewhere in the program.
- The `DS:BX` search-and-destroy loop writes every second byte. A stride of two
  visits the arena faster but can skip a target's live instruction byte; a
  stride of one gives denser coverage at half the write-front speed. The loop
  can also reach and damage itself. The sample Competition result therefore
  demonstrates trade-offs and survival-to-timeout, not a reliable attacking
  strategy or benchmark.

## Reconciled pass: item 6 (`STOSW`)

- `00:35–04:45`: the lesson begins from a short program containing
  `push ds`, `pop es`, `mov di,ax`, a load into `AX`, and repeated `stosw`.
  The debugger highlights the private/shared areas and the segment-register
  diagram while stepping the code.
- `05:05–09:20`: failed and corrected variants are assembled. `push ds` /
  `pop es` are added explicitly and the segment diagram shows `ES` redirected
  to the arena segment before `stosw` executes.
- `09:40–14:40`: each `stosw` step is tied to the two changed arena bytes and
  the movement of `DI`; multiple repetitions make the two-byte stride visible.
- `14:50–18:55`: manual address arithmetic and an explicit word write are
  compared with `stosw`; a repeated `10 04` byte pattern visibly grows across
  the arena in one demonstration.
- `19:15–24:15`: a small `helen` loop (`nop` sequence plus `jmp helen`) is
  introduced and then modified while being stepped, showing how writes near
  live code change the decoded instructions.
- `24:25–28:15`: the earlier attacker and the `helen` loop are run together;
  the address paths and spreading byte regions are compared at increasing
  step counts.

Full-resolution review resolves the demonstrated variants:

- The opening source is `push ds; pop es; mov di,ax; add di,maya;
  mov ax,0xab90; stosw; maya:`. Its machine bytes include `B8 90 AB`, so the
  immediate word really is `AB90h`; the future execution order of the stored
  bytes is `90 AB` (`NOP; STOSW`). This fragment is a construction exercise,
  not yet a complete seeded loop.
- To isolate segment and pointer behavior, the lesson reduces the program to
  `push ds; pop es; mov di,0x505; stosw; stosw; stosw`. At fixed load `0410h`,
  `AX` still holds `0410h`, so the arena visibly receives `10 04` at offsets
  `0505h`, `0507h`, and `0509h`. `DI` advances by two after each store.
- The comparison victim is exactly `helen: nop; nop; db 04h; db 04h;
  jmp helen`, encoded `90 90 04 04 EB FA`. The raw `04 04` bytes become an
  instruction only when execution reaches them; they are not written data at
  that point.
- The later corrected position-aware writer is `push ds; pop es; mov di,ax;
  add di,helen; david: stosw; jmp david; helen:`. With load `0310h`, the label
  offset shown is `000Bh`, and the still-initial `AX=0310h` produces repeated
  `10 03` words. A preceding `add id,helen` screen is an assembler typo and is
  explicitly rejected by the UI before correction to `DI`.

Audio/screen reconciliation adds the following qualifications:

- The recording opens by explicitly correcting a participant: `STOSW` is a
  legal one-byte opcode (`ABh`), not the invalid instruction used to kill a
  survivor. Its compactness comes from combining a two-byte word store with
  the automatic two-byte `DI` update in one scheduled instruction.
- Before `ES` is redirected, the first demonstration writes the initial
  `AX=0410h` into team-shared memory because `ES=2000h`. The presenter's
  physical-address shorthand—arena `10000h..1FFFFh`, shared area beginning at
  `20000h`—corresponds to segment values `1000h` and `2000h`. The shared area
  is `0400h` bytes. It must not be confused with the survivor's separate
  private stack merely because `PUSH DS; POP ES` is used to transfer a segment
  value.
- The transfer through the stack is required because the demonstrated 8086
  subset does not accept a direct `MOV ES,DS`. After `PUSH DS; POP ES`, both
  `DS` and `ES` name the arena; `DI`, not `AX`, chooses the destination offset,
  and `AX` supplies the word written there.
- The speaker correctly refuses to claim that the emitted bytes `10 04` or
  `04 04` are inherently fatal. In the exact `helen` trace, bytes `04 04`
  decode as the legal instruction `ADD AL,04h`; the process continues until
  the altered stream eventually loses valid/control-flow behavior. A process
  is not killed simply because any historical byte was overwritten.
- The stated `200,000`-round classroom limit agrees with the Competition setup
  reviewed in item 8. A corrupted survivor can therefore remain scheduled but
  strategically inert for a long time; losing its attack loop is not itself
  an engine death condition.
- The final label arithmetic is positional: `AX` starts as the randomized load
  offset, while `helen` assembles to the eleven-byte offset `000Bh`. Thus
  `MOV DI,AX; ADD DI,helen` points exactly one byte beyond the seed program at
  load `0310h`. This is the same self-extension principle later developed into
  the `AB90h`, `ABABh`, and `AB50h` streams.
- The closing phrase “kill everyone as fast as possible/in the fewest turns”
  is motivational shorthand, not the scoring formula. Fast disruption is
  useful only insofar as it changes which processes survive; the engine awards
  points for living team processes and has no separate kill-speed bonus.

The full timestamped audio, five-second visual timeline, and all full-resolution
code states have now been reviewed from beginning to end.

## Visual pass: item 5 (`STOSW` introduction)

- `00:00–07:30`: begins from the earlier position-aware byte writer, then
  introduces the one-byte opcode `ABh` and the source mnemonic `STOSW` as a
  more compact/faster way to place a word. The debugger is used to contrast
  arena code, private stack, shared memory, and register/segment values.
- `07:40–14:35`: a large arena drawing explains the flat 64-KiB circular
  battlefield, loaded warriors near the top only as a display convention, and
  separate storage regions. The ownership details are reconciled against the
  full audio and v6 implementation below.
- `14:40–21:55`: live stepping focuses on `ES`, `DI`, `AX`, and the effects of
  `STOSW`. A deliberately incomplete program demonstrates why the destination
  segment and index must be initialized rather than assuming a normal memory
  write through `DS`.
- `27:15–31:35`: `PUSH CS`/`POP ES` is built one instruction at a time. The
  stack view shows the pushed segment word and the later pop into `ES`; the
  final `ES=1000h` matches the arena segment in this simulator run. Repeated
  pushes/pops are only a teaching aid, not a recommended hot-loop design.
- `35:25–37:35`: the complete teaching writer is visible at full resolution:
  `push cs; pop es; mov di,ax; add di,moshe; joime: stosw; jmp joime; moshe:`.
  With a fixed load address of `0303h`, the label offset makes `DI=030Eh` before
  the first store. `AX` still contains `0303h`, so the generated word is the
  little-endian byte pair `03 03`; the debugger shows the forward two-byte
  trail and the looping `IP` separately.
- `37:35–40:05`: the same writer is run at speed and in Competition, then its
  machine bytes are enlarged in Paint to connect the setup bytes, loop bytes,
  and generated `03 03` trail.

This video establishes the position-aware `STOSW` loop visually. Its use of
`CS` is valid in the demonstrated engine state (`CS=DS=1000h`); later examples
prefer `PUSH DS`/`POP ES`.

### Audio/screen reconciliation for item 5

- The spoken introduction loosely calls compact built-in instructions
  “interrupts”; the actual demonstrated primitive is the ordinary one-byte
  opcode `STOSW` (`ABh`), not a software interrupt. This terminology error is
  not carried forward as an engine rule.
- `STOSW` takes the word in `AX`, stores its low byte first and high byte second
  at `ES:DI`, and then advances `DI` by two. The audio explicitly discusses
  little-endian order and the screen shows `AX=F0F9h` producing `F9 F0`.
- The segment explanation matches the debugger: the arena uses segment
  `1000h`; the initially displayed extra/shared region uses `ES=2000h` and
  addresses `20000h+`. A segment value contributes a physical base of
  `segment*10h`, and an offset register selects within it. The lesson says the
  arena is the accessible execution space while private/team regions are
  separate; exact accessibility is ultimately governed by the simulator
  implementation, not by generic real-mode assumptions.
- The screen labels the shared-memory area from `20000h`, and the spoken “400
  bytes” is hexadecimal `400h` (1024 bytes), consistent with the engine rather
  than decimal 400.
- `PUSH CS; POP ES` copies the arena segment through the stack because direct
  immediate assignment to `ES` is not used/supported by this assembler path.
  Once `ES=1000h`, `STOSW` writes into the battlefield. Repeated push/pop lines
  in the lesson merely expose stack behavior.
- The completed writer sets `DI` from the randomized load offset in `AX`, adds
  the end-label offset, and loops on `STOSW; JMP`. The presenter stresses that
  only the short live loop remains repeatedly vulnerable after setup, and that
  increasing the stride costs an extra instruction/turn unless encoded by a
  different self-generating scheme.
- The teaching Competition run uses a 200,000-round limit. The presenter
  clarifies that a weak stationary victim can score by still being alive when
  the round limit expires; that is survival credit, not proof it killed the
  opponents. This is why result bars must be interpreted per-survivor rather
  than as simple win counts.

All item-5 claims are now reconciled among full audio, full-screen timeline,
source-resolution frames, and the simulator state visible in the recording.

## Reconciled pass: items 8–9 (`PUSH AX` and `AB50`)

- Opcode byte `50h` is `PUSH AX`. It decrements `SP` by two and stores the word
  in `AX` at `SS:SP`; repeated pushes therefore advance backward.
- `SS` is initially the private stack segment and `SP` begins at its upper end.
  `push ds` / `pop ss` redirects subsequent pushes to the shared arena, while
  `mov sp,ax` anchors the backward writer at the warrior's load position.
- `ABh` is `STOSW`. After `push ds` / `pop es`, it stores `AX` through `ES:DI`
  in the arena and advances `DI` by two when the direction flag is clear.
- The demonstrated self-generating word is `AX=AB50h`. Little-endian storage
  writes bytes `50 AB`: `PUSH AX` followed by `STOSW` when decoded as code.
  `STOSW` creates the next pair in front of execution, and `PUSH AX` lays the
  same pair backward. This is why the live instruction stream expands in both
  directions without an explicit loop branch.
- Full-resolution frames and the audio agree on the construction: set
  `DS→SS`, anchor `SP`; set `DS→ES`, anchor `DI` just beyond the setup; load
  `AB50h`; seed/enter the generated `50 AB` stream. Exact label offsets are a
  design choice, not an engine constant.
- The short item 9 mainly answers questions and reiterates the operand roles:
  `STOSW` uses `ES`, `DI`, `AX`; `PUSH AX` uses `SS`, `SP`, `AX`.

These facts were also checked against the simulator's little-endian 8086
execution and segment initialization, rather than accepted from transcription
alone. The automatic transcript occasionally mislabels `PUSH AX` as `STOSW`;
the screen and opcode bytes resolve the ambiguity.

## Visual pass: items 10–11 (historical arena-effects clip)

- These two short recordings are consecutive discussion/share fragments of a
  43-second clip opened from WhatsApp, not simulator coding lessons.
- The shared clip shows the legacy desktop “CodeGuru Extreme - Session Viewer”
  with many long horizontal bands, repeated vertical teeth, and diagonal
  traces. The participant list includes historical names such as
  `WHS_Lucas1/2`, `HLS_segment_*`, `HRZ_S3gm3nt*`, `OHS_Lagrange1/2`, and
  several `zom19*` entries.
- The changing geometric patterns demonstrate that real battles can contain
  simultaneous forward/backward writers, sparse stride attacks, and broad
  filled regions. The clip exposes no source code or exact opcode mapping, so
  visual appearance alone is not used to infer implementation.
- Items 10 and 11 overlap the same clip; both were reviewed from beginning to
  end, at source resolution, and against their complete audio.

### Audio/screen reconciliation for item 10

- The presenter explicitly frames this as a work-in-progress visualization
  feature for reviewing a battle: event effects will mark moments such as a
  Zombie takeover and damage to competitors so teams can inspect what happened
  and at which location.
- The visible burst is verbally identified as `zombie capture`. It is a UI
  annotation of an event detected by the simulator, not a new instruction,
  capture primitive, scoring bonus, or proof that a particular source line
  caused the event. The actual takeover mechanics remain those demonstrated in
  items 12–14 and reconciled with the engine.

### Audio/screen reconciliation for item 11

- Item 11 is the continuation/replay of the same work-in-progress visualization
  shown in item 10. The speaker describes real-time annotations for attack,
  defence and takeover events, intended to make otherwise opaque colored arena
  motion understandable after or during a battle.
- The visible `Zombie Capture` label is again explicitly identified as an
  event annotation. The presenter also says the feature and its colors still
  need refinement. Consequently it is treated only as debugger/UI evidence,
  not as a stable 2025 rule, opcode, scoring mechanism or capture trigger.

## Visual pass: item 12 (Zombies introduction)

- Nearly the entire six-minute recording is a Zoom gallery discussion with no
  shared technical material.
- At `05:45` there is one brief, fully checked source-resolution simulator
  frame during a screen-share transition. It shows the normal debugger layout,
  arena bytes, several colored instruction spans, and register pointers, but
  no source pane or readable new rule. The share immediately disappears.
- No opcode, zombie mechanism, or implementation claim is inferred from that
  fleeting frame. The complete audio pass is still required to capture the
  spoken introduction and to determine whether it belongs semantically with
  the following zombie lesson.

### Audio/screen reconciliation for item 12

- The recording is intentionally the conceptual preface. The presenter says
  that taking over a Zombie does not merely kill it: when the scheduler reaches
  that Zombie's slot, its instruction pointer now advances through code chosen
  by the capturing team. Thus the team has gained another independently
  scheduled execution stream—an extra “turn”—while the original Zombie logic
  no longer runs.
- The captured stream begins at the precise location to which the takeover
  redirects it, not necessarily at the first instruction of the survivor. The
  survivor's own stream and the captured stream can therefore be at different
  locations in the same code at the same time. The “two hands/two souls” analogy
  is a warning that the program must deliberately coordinate those streams;
  accidental overlap or incompatible roles can make them interfere.
- Capturing Zombies is an execution-power advantage, not a substitute for
  survival: the presenter explicitly says the team still needs a living
  survivor. This agrees with the engine's scoring implementation, where a
  process whose Zombie identity remains marked as a Zombie contributes no team
  points even if it has been redirected into that team's code.
- The screen share starts only as the presenter announces the transition from
  the oral model to a code example, then the clip ends. Accordingly the actual
  redirection sequence is taken from item 13 rather than guessed from this
  introduction.

## Visual pass: item 13 (Zombie/takeover foundations)

- The full `59:02` screen timeline and the source-resolution demonstrations
  were reviewed. The lesson first builds a small position-dependent writer,
  then introduces `LODSW`, direct and indirect jumps, and finally experiments
  with relative-jump operands. Audio remains necessary before assigning the
  presenter's intended Zombie/player roles to every sample.
- The early `ZOOMABE` example is exactly `NOP` three times, `ADD BX,1010h`,
  `MOV [BX],AX`, `JMP H`, compiled as
  `90 90 90 81 C3 10 10 89 07 EB F5`. With the debug load fixed at `1313h`,
  repeated executions advance `BX` by `1010h` and leave a diagonal sequence
  of words containing the program's load address in the arena. A later trial
  changes the increment to `0101h`, visibly changing that spatial pattern.
- The `LODSW` demonstration first uses `MOV SI,4444h; LODSW`
  (`BE 44 44 AD`). It then writes word `5050h` at `4444h` and repeats the
  load. The debugger shows `AX` receiving the word and `SI` advancing by two
  while the direction flag is clear. This is a visual machine-state result,
  not an assumption from generic 8086 documentation.
- A second sample begins with four `NOP`s and `MOV BX,AX`. The source first
  shows a near relative `JMP 0`, whose compiled bytes are `E9 00 00`; this is
  not a jump through address zero. A whiteboard transition explicitly writes
  `JMP [SI]`, after which the live source becomes `JMP [1010h]`, compiled as
  `FF 26 10 10`.
- In the fixed-address takeover demonstration, memory word `1010h` visibly
  contains `1313h`, the address deposited by the other program. Executing
  `JMP [1010h]` therefore transfers the second process into the first
  program's code. This establishes the demonstrated control-transfer
  mechanism; whether and how that maps to the official supplied Zombies will
  be reconciled with the complete audio and items 12/14.
- The source is also changed to `JMP AX` (`FF E0`) and later to experiments
  such as `JMP 4` (`E9 04 00`) while `MOV BX,AX` is replaced with
  `MOV BX,4` (`BB 04 00`). The debugger visibly follows the computed target,
  including landing in `CCh` filler in one trial. These late edits are treated
  as jump-semantics exercises, not as a recommended survivor design, until the
  audio pass supplies their explanation.

### Audio/screen reconciliation for item 13

- The presenter explicitly says that the organizers publish the Zombie
  sources and that takeover is a code-reading challenge: a survivor must find
  a property of that particular Zombie rather than assume a universal body or
  loop offset.  In this teaching target, the exploitable property is that the
  Zombie publishes its randomized starting `AX` value at the known arena word
  `1010h` during its first pass.
- The first write is timing-sensitive.  If Player B executes `LODSW` before
  the Zombie has reached `MOV [BX],AX`, it reads untouched `CCCCh`, not the
  Zombie address.  The lesson inserts several one-time `NOP`s until the trace
  is late enough.  The speaker correctly notes that fixed padding is only a
  timing choice for this trace: it consumes scheduled instructions once, and
  placing it in a repeated loop would impose a recurring cost.  A robust
  tournament design should prefer a verified/polled condition when possible.
- `LODSW` is reconciled from both narration and debugger state: it reads the
  word at `DS:SI` into `AX` and, with `DF=0`, increments `SI` by two.  One
  participant briefly says that a word is four bytes; the observed `SI += 2`
  and the 8086 engine settle the correction—a word here is two bytes.
- The discussion distinguishes the private initial stack from arena memory.
  An ordinary `PUSH AX` writes through the survivor's private `SS:SP`, so an
  opponent cannot infer the survivor's address from it.  That ceases to be
  true only if the survivor deliberately repoints `SS` into the arena, as the
  later `AB50` constructions do.
- The jump experiments establish three different operand meanings that must
  not be conflated: an immediate/label near jump is encoded relative to the
  current instruction stream; `JMP AX`/`JMP BX` loads `IP` from the register
  and therefore names an absolute arena offset within the current `CS`; and
  `JMP [1010h]` loads `IP` from the word stored at `DS:1010h`.  Brackets mean
  dereference.  Landing in the middle of a multi-byte instruction or in
  untouched `CCh` is fatal even if the jump assembled successfully.
- Player B's direct `JMP [1010h]` is only the proof that the leaked word can
  redirect an execution stream into the Zombie.  It does **not** capture the
  Zombie: it moves Player B's own `IP`.  Actual takeover requires modifying a
  repeatedly executed instruction in the Zombie so the Zombie's independently
  scheduled `IP` jumps into Player B.  The recording ends precisely at that
  next puzzle; item 14 supplies and verifies the four-byte `FF 26` patch.
- The full transcript is `59:02`, including the long student work intervals
  and all late relative-versus-register jump experiments.  It has now been
  read end to end and reconciled against the already completed five-second
  visual timeline and source-resolution frames.

## Visual pass: item 14 (constructing a takeover patch)

- The complete `22:17` visual timeline and all changing code demonstrations
  were checked at source resolution. This clip continues directly from item
  13 with `ZOOMABELA` fixed at `1313h` and `Player B` fixed at `0320h`.
- The target advertises its address through memory `1010h` and has a loop-ending
  short jump at offset `+9`. `Player B` evolves into the following teaching
  sequence: load the advertised word with `LODSW`, add `9`, use the result as
  `BX`, overwrite the target's jump with word `26FFh` (bytes `FF 26`), write a
  16-bit pointer address into `[BX+2]`, and then wait in `JMP $`.
- The source ordering is changed during the lesson. In the demonstrated
  successful trial, `DI` first preserves Player B's own randomized/fixed load
  address, `MOV [DI],AX` stores that address as a pointer word at the beginning
  of Player B, and only then does `LODSW` replace `AX` with the target address.
  The patch at the target becomes `FF 26 20 03`, i.e. `JMP WORD [0320h]`.
  Memory word `0320h` contains `0320h`, so the target stream is redirected to
  Player B's region and visibly reaches Player B's terminal `JMP $`.
- Intermediate edits deliberately/repeatedly rearrange `LODSW`, `MOV DI,AX`,
  and `MOV [DI],AX`. Their resulting pointer meanings differ, and some frames
  show the redirected process initially decoding the two pointer bytes as
  instructions before falling through. These are retained as experiments, not
  generalized into a safe random-location recipe without the audio explanation.
- The key robust concept established visually is the four-byte machine-code
  surgery: replace an existing control-transfer site with `FF 26` followed by
  an absolute 16-bit memory address whose word value is the desired new `IP`.
  The fixed-address classroom arrangement itself is not assumed to be a valid
  tournament-strength capture implementation.

### Audio/screen reconciliation for item 14

- The opening recap confirms that the duplicate instructions placed before the
  Zombie's live body are a defensive decoy: a forward `INT 87h` search changes
  the first matching four-byte occurrence, so a decoy can absorb a smart bomb.
  Reverse search is possible with `DF=1`, and a unique later signature can
  still expose the live code; this is a useful defense, not immunity.
- The single `NOP` inserted into Player B is a timing adjustment for this exact
  classroom trace. It spends one scheduled instruction so the overwrite lands
  while the Zombie is in its loop; it is not a general prerequisite for
  capture.
- The address protocol is explicit: the Zombie publishes `1313h` at
  `[1010h]`; Player B preserves its own start `0320h` in `DI` and stores word
  `0320h` at arena address `[0320h]`. `LODSW` then reads `DS:[SI]` into `AX`
  and advances `SI` by two because `DF=0`; here `SI=1010h`, so `AX=1313h`.
- Adding `9` selects the beginning of the Zombie's particular loop-ending
  instruction. This is an offset learned from the supplied target's exact
  source, not a universal Zombie offset. Because 8086 cannot use `AX` as an
  effective-address base, the code moves the computed address to `BX`.
- Writing word `26FFh` at `[BX]` produces bytes `FF 26`; writing `DI=0320h`
  at `[BX+2]` completes bytes `FF 26 20 03`, decoded as
  `JMP WORD [0320h]`. Executing it loads the word stored at arena address
  `0320h`—also `0320h`—into the Zombie process's `IP`, redirecting that
  independently scheduled execution stream into Player B.
- The lesson's intermediate reorderings sometimes point at or execute raw
  pointer bytes and are intentionally unsafe experiments. The demonstrated
  final ordering and exact instruction boundary are essential. After capture,
  both the original survivor process and the redirected Zombie process can
  traverse the same payload on their separate turns, so that payload must
  remain valid under concurrent entry; the abandoned Zombie bytes have no
  execution stream of their own.

## Visual pass: item 15 (opening workshop)

- The complete five-second/change-triggered timeline was inspected through the
  `2:36:49` end, with source-resolution checks for code and rule slides. The
  opening shared screen dissects a real Zombie and the historical `bimp`
  survivor rather than presenting only slides; the full audio reconciliation
  below fixes the verbal intent and all version-specific cautions.
- The Zombie at load `9F14h` executes `PUSH DS; POP ES; MOV DI,0067h;
  CALL $+3; POP AX; ADD AX,0Fh; SUB AX,0Ah; STOSW; ADD DI,0065h; JMP` back to
  the store. The `CALL`/`POP` pair obtains a position-derived value without
  relying on initial `AX`; the net arithmetic and `STOSW` publish word `9F21h`
  first at `0067h`, after which the loop creates the visible diagonal sequence
  of the same word at a regular stride.
- The later `bimp` source polls `MOV BX,[0067h]`, compares it with `CCCCh`, and
  waits while the advertisement slot is untouched. Once a value appears it
  stores its own computed address in `[0000h]`, increments `BX` four times, and
  writes word `17FFh` (machine bytes `FF 17`) at the derived Zombie location.
  The source then sets `ES=DS`, prepares `DI/BX` and `SI/AX`, and enters its
  copying/attack code. The precise intended takeover target and all safety
  assumptions remain open until the full audio and remaining screen timeline
  are reviewed.
- `bimp`'s visible propagation loop uses repeated backward adjustment of `DI`,
  six `MOVSW`s, two increments of `DI`, and `JMP DI`, producing separated
  diagonal copies. This is historical code evidence, not yet a claim that the
  same parameters are optimal under the 2025 final rules.
- `25:00–40:55`: the presenters load `bimp` together with historical
  `shooterA/B/C` examples and repeatedly step/run them at new seeds. The arena
  displays the very different geometries—broad horizontal fills, sparse
  diagonals and wrapped bands—while the source remains visible. These are
  qualitative mechanism demonstrations, not controlled score comparisons.
- A source-resolution frame gives the exact compact `bimp` propagation body:
  `PUSH DS; POP ES; XCHG DI,AX; ADD DI,0Ch; MOV SI,DI; ADD SI,0Ah; STD;`
  `DEC DI; DEC DI; MOVSW` ×6; `INC DI; INC DI; JMP DI`. With `DF=1`, each
  `MOVSW` copies backward; the final index adjustments and indirect jump enter
  the newly copied block. The constants describe this sample, not engine rules.
- `41:20–44:40`: the official smart-bomb slides state that every survivor gets
  one `INT 87h` use per round. Starting at `ES:DI`, the engine searches for the
  first four-byte pattern represented by `DX:AX`—byte order
  `AL, AH, DL, DH`—in the direction selected by `DF`, then overwrites it with
  the four bytes represented by `CX:BX`. `ES:DI` itself is not advanced by the
  interrupt. This agrees with the simulator source.
- `45:00–50:55`: a defensive layout is demonstrated: `JMP main`, an earlier
  decoy copy of the targetable `bimp` body, several `NOP`s, and then `main:`
  with the live body. A forward four-byte smart-bomb search can hit the decoy
  before the live copy. The jump and padding must still be considered part of
  the survivor's attack surface and signature-constrained final binary; the
  visual demo does not make the scheme universally safe.
- After about `51:00` the share returns briefly to gallery view before the
  later call/far-call lesson resumes.
- `57:45–61:20`: screen sharing resumes in the simulator with a small code
  sample, followed by the official CodeGuru assembly slide deck and a new
  section on near/far `CALL`. The visual explanation models a call stack and
  distinguishes return information that must preserve both offset and segment
  for a far transfer. This is a teaching transition; exact operand semantics
  remain pending audio reconciliation.
- `67:00–71:20`: the presenter experiments live with `CALL func`,
  `CALL [BX]`, `CALL FAR [BX]`, raw words such as `11 22 33 44`, and explicit
  offset/segment-looking operands. Several variants visibly produce assembler
  errors (`binary output format does not support segment base references`,
  `parser: instruction expected`) and are not recorded as valid syntax. The
  failed variants are useful evidence that simulator/NASM behavior must be
  tested rather than inferred from generic 8086 notation.
- `72:40–77:40`: a hand-drawn stack trace contrasts calls within `CS` with a
  far call. The diagram tracks the return offset and segment on the `SS:SP`
  stack and explicitly pairs the later return with a far-return form. The exact
  push/pop order will be fixed from the audio plus debugger state rather than
  guessed from the handwriting alone.
- `77:45–87:50`: the presenter returns to the simulator, edits a minimal
  `CALL`/return sample, and single-steps it. One later experiment visibly turns
  a large contiguous arena region red with a repeating byte pattern; this is
  recorded as an observed consequence of the constructed call/stack setup,
  not yet as a recommended attack.
- `88:25–91:45`: the stack diagram is revisited with `CS`, `SS:SP`, saved
  segment and saved offset annotations. The screen scan is complete through
  this point; audio is still needed to resolve the exact verbal convention and
  the intended exploit.
- `91:45–118:30`: the workshop alternates between the simulator, the assembly
  slides, and live searches for the 8086 instruction set. The simulator runs
  several deliberately small call/stack constructions and shows both short
  colored traces and large repeated fills. These are exploratory outcomes, not
  benchmark results and not evidence that every generic 8086 calling syntax is
  accepted by the competition assembler.
- At `119:40–120:20`, a source-resolution frame of the official slide titled
  “Far Call” gives the concrete sample: derive `AX=load_offset+call_far-start`,
  copy `ES` into `DS`, put `CS` at `[BX+2]`, put the derived offset at `[BX]`,
  move `CS` into `SS`, set `SP=AX`, and execute `call [dword bx]`. Thus the
  four-byte memory operand is visibly laid out as offset followed by segment.
  This is recorded as the demonstrated NASM/simulator construction; the audio
  pass must still establish why the stack is redirected and how the writers
  exploit the pushed far return address.
- The official v6 implementation removes the remaining ambiguity in the drawn
  stack trace: indirect `CALL FAR` reads offset then segment, pushes the old
  `CS` and then the return `IP`, and `RETF` pops `IP` then `CS`. This is a
  source-backed engine fact; the still-pending audio pass is needed only for
  the instructor's intended exploit explanation and cautions.
- `145:00–155:30`: later simulator experiments edit a compact word writer and
  inspect its effect at source resolution. One visible version is
  `STOSW; MOV CX,CCCCh; MOV BX,AX; ADD BX,stop-start; MOV [BX],CX; ADD BX,2;
  JMP write_word`, followed by a `stop:` area into which `NOP` and then `MOVSW`
  are inserted. Runs display two broad, adjacent colored horizontal bands and
  isolated traces; these are teaching experiments rather than measured claims
  of strength.
- `155:35–158:20`: the screen returns to the official CodeGuru pages and
  highlights the documented initialization and memory rules (register reset,
  randomized `AX/IP`, arena `CS/DS`, team-shared `ES`, private stack `SS/SP`).
  Those page statements agree with the engine facts already reconciled from
  earlier items.
- `2:02–2:06`: after the far-call section and a brief gallery interlude, the
  official slides introduce cooperation between the two survivors. A pair is
  identified by the same base name with suffix `1`/`2`, and the slide calls
  the `1024`-byte `ES` area a private segment because it is private to that
  *team*; it is nevertheless shared by the team's two survivors. The slide's
  simplified statement that one surviving partner receives half the score is
  not substituted for the engine's exact living-process denominator formula.
- At `2:08`, a Zombie-takeover slide explains the high-level tactic: write
  chosen instruction bytes into the Zombie's memory so its scheduled process
  performs work for the team. It explicitly notes that a Zombie is not counted
  in the team's final score, matching the engine reconciliation from items
  12–14.
- At `2:10`, the `cannon2.asm` slide shows concrete partner communication:
  `PUSH ES; POP SS; MOV BP,0; MOV DI,[BP]` reads through the BP-default `SS`
  segment after redirecting `SS` to team-shared memory. The slide states that
  `cannon1` stored its starting position at shared offset zero. `cannon2` then
  loads `CX=CCCCh`, sets `BX=DI`, decrements it, and repeatedly executes
  `MOV [BX],CX; SUB BX,2; JMP write_word`, attacking backward in the arena.
  This is an example protocol, not a reserved shared-memory address.
- `2:12–2:36`: the simulator returns to the historical `bimp` pair and to a
  compact second-survivor writer (`STOSW; MOV CX,CCCCh; MOV BX,AX; ADD BX,
  stop-start; MOV [BX],CX; ADD BX,2; JMP write_word`). Runs produce adjacent
  broad red/green bands and wraparound fills. Near the end, `NOP` and `MOVSW`
  are inserted after `stop:` as live exploratory edits. Two-minute
  source-resolution checks cover this whole tail.
- At `2:33:08–2:33:16`, the presenter briefly scrolls the official assembly
  deck.  A readable “competition structure” slide states the base scheduler as
  one assembly instruction per survivor per turn, circularly, with an invalid
  instruction killing that survivor; it separately flags the energy mechanism
  as the way to obtain more than one instruction in a turn.  This wording is
  compatible with, but less precise than, the engine's probabilistic NRG rule.
- The next readable slide defines the engine-only “heavy bomb” as `INT 86h`.
  It writes `256` bytes to the arena in one instruction and may be used only
  twice per battle by each survivor.  The slide suggests clearing the nearest
  `512` bytes quickly with the two heavy bombs and then continuing with normal
  writes.  The source implementation independently matches this: two initial
  bomb uses and 64 four-byte stores per `INT 86h`.  This is a capability and a
  teaching suggestion, not evidence that spending both bombs immediately is
  optimal.

### Audio/screen reconciliation for item 15

- The opening Zombie publishes a position-derived word at arena offset `0067h`:
  `CALL $+3; POP AX` obtains a live code address, the arithmetic adjusts it, and
  `STOSW` writes through `ES:DI`. The captor polls that slot and patches the
  supplied Zombie at the demonstrated offset. Those constants belong to this
  Zombie; they are not universal takeover addresses.
- The `bimp` walkthrough confirms backward copying with `STD` and six `MOVSW`
  operations. A copy is only bytes, not another scheduled process; the live
  process must jump into the new block. Copy speed, the vulnerable unfinished
  tail, source exposure and destination spacing are all explicit tradeoffs.
- `INT 87h` searches for bytes represented by `AX` then `DX` and writes `BX`
  then `CX`, beginning at `ES:DI` in the `DF` direction. A matching earlier
  duplicate can absorb the one charge; arbitrary `NOP` padding cannot. The
  visual slide and v6 source resolve noisy spoken register ordering.
- Near and far indirect calls are different engine actions. A far memory
  pointer is offset then segment; the call pushes old `CS` and return `IP`.
  Redirecting `SS:SP` into the arena turns those implicit four bytes into a
  backward writer. `DF` does not control stack direction, and execution outside
  the arena is invalid. Spoken placement estimates are superseded by v6's
  source-backed 1,024-byte minimum initial spacing.
- `MOVSW` copies two bytes from `DS:SI` to `ES:DI`; `MOVSB` copies one and can
  avoid a predictable `A5h` byte column. `REP MOVSW` still performs only one
  string iteration per scheduled opcode in this engine. The historical A5/
  call-far family became common enough to create a counter-meta that attacked
  its known column, illustrating why a strong historical pattern is not immune.
- `NRG` is two consecutive `WAIT` bytes, not one architectural `WAIT`. It raises
  energy and may grant a probabilistic second opcode; the exact decay and
  probability are taken from v6 rather than workshop shorthand. Energy setup
  competes with useful bombing, copying and movement instructions.
- Both team members receive the same private 1,024-byte `ES` segment and may
  exchange positions, offsets or commands there. Their turns are not guaranteed
  to be adjacent. In the `cannon` example, member 1 publishes `AX` at `ES:0`;
  member 2 maps `SS=ES`, uses BP-default stack addressing to read it and attacks
  backward from the shared position. The live pair is collision-prone and is
  shown as a protocol example, not a recommended final submission.
- `INT 86h` writes 256 bytes per charge and has two charges per survivor. The
  suggestion to spend both near the start is a teaching tactic, not an optimum.
  Likewise, all visible bimp/cannon/word-writer traces are mechanism studies,
  not controlled score evidence.
- The TOM_ATO genetic search was an external optimization program driving the
  local engine, not logic embedded in its submitted binary. It performed very
  well against the published first-stage field but opponents adapted before the
  final. This is direct evidence for using reproducible multi-opponent training
  plus unseen holdouts instead of optimizing solely against one historical pool.
- The active Zombie pack is included in every run for that stage, but organizers
  may publish a changed pack between stages. Only the current official pages,
  organizer announcements and released files control; older page values and
  second-hand descriptions are kept as provenance, not silently generalized.

The merged transcript contains all `2,936` emitted segments from `00:00` through
`02:36:49`; audio, continuous visual timeline and all full-resolution code/rule
demos are fully reconciled for item 15.

## Visual pass: item 22 (gallery introduction)

- The entire `03:17` recording remains in Zoom gallery view.  The formal
  five-second/change-triggered pass contains `40` sampled frames and `12`
  retained keyframes; no screen share, simulator, source code, slide,
  instruction trace, score table, or arena transition appears.
- Because there is no technical screen content, a separate source-resolution
  demo check is not applicable.

### Audio/screen reconciliation for item 22

- The full `03:17` audio is an introduction of the instructors and a routing
  announcement. It directs newcomers who want foundations to Ben's room,
  returning participants who want to continue the preceding material to the
  main room, and more advanced participants to Yonatan and Yotam.
- This confirms that the mentor recordings which follow are parallel course
  branches, not a single chronological lesson whose every clip must precede
  the next one. The ordering within each mentor's own sequence remains the
  relevant technical order.
- The instructors mention general interests in low-level computing, cyber,
  exploitation, development, and participant support, then ask each room to
  record its session. No register value, opcode, memory rule, interrupt,
  Zombie behavior, score rule, submission constraint, or benchmark result is
  stated.

The transcript ends at `03:15`; the remaining two seconds are the same Zoom
gallery closing already covered by the visual pass. Item 22 is fully
reconciled.

## Reconciled pass: item 23 (staff introduction)

- The complete `2:32` recording is an administrative interruption between
  lessons. Apart from a brief `00:35–00:40` glimpse of the already-known
  simulator with the `helen` example loaded, the screen remains in Zoom gallery
  view; no code is edited or executed and no new rule is displayed.
- The audio directs newly arriving participants to another breakout room and
  introduces mentor Shachaf Zohar, who says he competed roughly six years
  earlier and now returns to help mentor. It contains no opcode, scoring,
  memory-layout, submission, or Zombie claim.
- The fleeting simulator frame is therefore only continuity/provenance for the
  surrounding workshop. It is not treated as an additional technical lesson.

Audio, the continuous five-second visual timeline, and all changed frames have
been reviewed; there is no technical full-resolution demonstration to extract.

## Visual pass: item 24 (challenge-stage explanation)

- The complete `17:22` screen timeline is almost entirely Zoom gallery view.
  The only technical share is a short simulator window from approximately
  `06:30` to `08:10`; there are no later slides, documents, code edits, or
  arena demonstrations hidden in the remainder.
- Source-resolution frames show Player C fixed at load `0320h`. The visible
  teaching code is `ADD BX,1010h; MOV [BX],AX; ADD BX,1010h; MOV [BX],AX;`
  followed by `h: NOP; NOP; NOP; ADD BX,1010h; MOV [BX],AX; JMP h`.
  Its encoded bytes (`81 C3 10 10`, `89 07`, three `90`s, and `EB F5`) agree
  with the source pane.
- The arena already contains other colored fragments, including bytes that
  decode to the previously demonstrated indirect Zombie redirection pattern.
  The recording does not visibly step this Player C program or display a score,
  so the code is preserved as contextual challenge material rather than
  credited with a takeover or a measured result.

The complete audio pass resolves the purpose of this meeting and the brief
screen share:

- This is the launch briefing for the first challenge.  Staff will publish
  real Zombies and each team submits **two** survivors by Thursday at
  midnight.  The two binaries may initially be identical; inter-survivor
  communication is allowed but is not mandatory.  The challenge contributes
  only a small bonus relative to the later live competition, so failure to
  solve every Zombie does not eliminate a team.
- Senior entries are limited to `512` compiled bytes per survivor.  Every
  39th byte of a senior binary—one-based positions `39, 78, ...`—must equal
  `90h`.  The validator's check is byte-based: an incidental `90h` inside a
  multi-byte instruction satisfies the upload check.  That does **not** mean
  one can insert a new byte into the middle of an instruction without changing
  its decoding; explicit padding still belongs on an instruction boundary.
  A program shorter than the next checked
  position has no requirement beyond its end.  This is consistent with the
  official page shown in items 25–26 and resolves the transcript's muddled
  zero/one-based counting discussion.
- The parallel junior rule is a maximum of `128` bytes and `90h` at compiled
  byte 50 (when the program is long enough).  It is retained as contextual
  evidence only; our target is the senior/Xtreme track.
- Submitted survivors are published after the round so teams can study and
  reverse engineer one another.  Staff explicitly warn that later rounds can
  change the signature and introduce new Zombies, preventing an unchanged
  copy/paste from being assumed valid.  The Zombies released for this stage
  are expected to appear again at the final, so takeover work can carry
  forward even though the signature may not.
- A participant asks whether browser-simulator success guarantees the same
  result in the official engine; the answer is no.  Staff say a refreshed
  desktop/Java engine with debugger fixes will be released and recommend
  testing in both environments.  Therefore the browser remains useful for
  stepping and visualization, but final validity and scoring must be checked
  in the released competition engine.
- The `06:30–08:10` simulator share is used primarily to explain compiled-byte
  positions and the `90h` signature, not to claim a score or demonstrate that
  Player C is a finished challenge solution.  The rest is deadlines, groups,
  venue, and Q&A; no additional opcode or scoring formula is introduced.

Audio, the continuous timeline, and the source-resolution share are now
reconciled for item 24.

## Visual pass: item 26 (2025 setup/Q&A)

- `00:00–04:50` is participant gallery and discussion. From `04:55`, the share
  walks through extracting and launching the Windows desktop simulator package.
- The package shown is specifically `corewars8086-5.0.1`, whose GitHub release
  page labels it as the version used for the 2023 competition. Its visible
  changelog says the bundled preset scripts changed Zombie speed from `5x` to
  `2x` without changing the v5.0.0 codebase. That is version/preset evidence,
  not yet evidence that the 2025 server uses the same Zombie multiplier.
- A desktop Competition Viewer example runs `100` wars with `3` survivor groups
  per war and displays sample totals `shooterA=85`, `shooterB=39`,
  `shooterC=52`. This is a setup sanity check, not a controlled comparison and
  not a reusable performance result.
- `09:55–10:25` opens the official `CodeGuru Xtreme 2025` challenge page. The
  on-screen rules match item 25 exactly: two survivors, at most `512` bytes
  each, and one-based compiled positions `39, 78, ...` must contain `90h`.
- `10:35` shows a browser-simulator sample `MOV AX,0A100h; MOV DX,123Dh;
  INT 87h`. It is then replaced with repeated `INT 3h` lines; the simulator
  warns that this legal x86 operation is unsupported by CoreWars8086. This is
  valuable confirmation that ordinary 8086 legality is insufficient: only the
  engine-supported subset is accepted. The deliberately repeated warnings are
  not a viable survivor pattern.
- The share returns mostly to gallery after roughly `11:40`, apart from a brief
  empty label/code experiment around `16:30`. The remainder still needs the
  completed five-second scan and full audio reconciliation.
- `25:05–27:25` returns to a participant's browser simulator and exposes the
  exact sample `PUSH DS; POP ES; MOV DI,AX; MOV AX,CCCCh; again: STOSW;
  ADD DI,0Bh; JMP again` (bytes end in `AB 83 C7 0B EB FA`). It is a sparse
  destructive writer with a thirteen-byte net destination stride per loop
  (`STOSW` adds two, then `ADD DI,0Bh` adds eleven); no battle result is shown.
- Around `29:05` the official challenge page is reopened and repeats the same
  512-byte/two-survivor/signature rules. `32:25–33:05` briefly shows local
  survivor files and a desktop Competition Viewer set to two groups and 100
  wars; the scores are only a participant setup check.
- At `35:35`, another participant shares a collection of progressively more
  advanced far-call experiments. Visible files construct four-byte far
  pointers as offset then segment in memory and use forms such as
  `CALL WORD FAR [DI]`; several redirect `SS:SP` into the arena before the far
  call so that its pushed return state overwrites chosen arena locations. The
  variants include fixed offsets (`1DFFh`), segment adjustment in units of 16
  physical bytes, and stack-copy experiments. These are recorded as exploratory
  source; exact intent, validity of each variant, and safety assumptions await
  the remaining screen sequence and the full audio.
- `39:05–39:15` attempts to bulk-load a `youngZombies-4` folder. One visible
  Zombie begins `JMP SHORT 18h` and repeats `XOR AX,4AECh; XOR AX,F4BAh;
  MOV [1234h],AX; DB 0EBh,0FBh`. The simulator simultaneously reports
  `No code in Zombie_91 of player Zombie 9`, showing that the selected batch is
  incomplete/misnamed. This failed load is not evidence about legal Zombie
  code or scoring; only the displayed individual source is retained.
- `42:55–45:35` debugs the sparse `CCCCh` writer beside a loaded Zombie. A
  temporary raw `DB 30h` byte is appended in one run, and the arena view makes
  the distinct red survivor and yellow Zombie instruction streams visible.
  Later reloads alter the initial byte layout; these are troubleshooting steps,
  not evidence that the extra byte or duplicated-looking prefix improves the
  program.
- `45:35–50:40` continues simulator troubleshooting, then opens the public
  historical-survivor repository and loads `shooterC`. A source-resolution
  step at `50:15` reaches `CALL FAR [SI]` after the survivor has deliberately
  changed its segment and stack registers; the arena shows several long
  horizontal copy bands and sparse Zombie traces. This corroborates the
  far-call mechanism already isolated in item 21, but the run is neither a
  controlled score comparison nor evidence that the preceding sparse writer
  generated those bands.
- The top of the loaded `shooterC` source visibly contains repeated fragments
  `PUSH ES; POP DS; MOV [2],AX; MOV BX,[SI]; JMP BX`, separated by `NOP`s and
  an initial short jump. These are bytes from a historical survivor selected
  from disk, not code authored or validated during this Q&A.
- `50:40–54:05` is gallery discussion. `54:10–55:20` is only a participant
  being guided to the Notepad++ download page; the remaining visible portion
  through `55:50` returns to gallery. The continuous scan remains in gallery
  through the `01:13:44` end (apart from a participant briefly holding the
  Notepad++ page up to the camera around `57:30`). No engine rule, opcode
  behavior, or result is introduced in this interval.

### Audio/screen reconciliation for item 26

- The presenter explicitly distinguishes the two engines: development may use
  the browser simulator, but the organizer's judging run uses the local Java
  engine.  Final submissions therefore have to assemble and run correctly in
  the local engine as well; browser-only behavior is not sufficient evidence.
- The spoken submission constraints agree with the official 2025 page shown
  on screen: a team submits two files with the same base name and suffixes
  `1`/`2` (or one unsuffixed file when deliberately testing one survivor),
  each compiled survivor is at most `512` bytes, and the one-based byte
  positions `39, 78, 117, ...` must contain `NOP` (`90h`).  The signature is
  checked in the compiled bytes, not by counting source lines.
- The explanation of source obfuscation is exactly the screen demonstration:
  because the arena's code and data addressing refer to the same underlying
  memory, an instruction may be represented by its raw opcode bytes with
  `DB`.  The example replaces `PUSH DS` by `DB 1Eh` and obtains the same
  compiled byte/instruction.  This hides intent from a casual source reading;
  it does not encrypt the live arena memory or change execution semantics.
- Historical submissions are intentionally published for study.  The speaker
  demonstrates downloading the repository ZIP and loading both members of a
  previous pair into the simulator.  Copying a submitted survivor verbatim is
  still ruled out by the changing signature and by the competition's
  originality requirement; the repository is evidence and a benchmark set,
  not a ready submission.
- A competition run contains four teams at a time (eight survivors when each
  team supplies a pair).  The organizer says all possible team combinations
  are run multiple times so that one favorable group or placement does not
  determine the ranking.  For local evaluation, the presenter's practical
  starting recommendation is four repetitions per possible four-team
  combination using a large opponent pool and the faster Java engine.  This is
  testing advice, not a disclosed fixed count for the official judge.
- The challenge-specific Zombie pack is loaded into local tests and Zombies
  are strongly recommended during development.  Statements in this Q&A about
  the exact count belong to the current challenge package shown here; they are
  not generalized into an immutable final-event Zombie count without the
  later final rules.
- The `INT 3h`, far-call, redirected-stack, sparse-writer, and historical
  `shooterC` sequences visible during the Q&A are troubleshooting or
  participant experiments.  The audio supplies no controlled result that
  would promote any of them to a winning design.  Likewise, the displayed
  `100`-war score tables are installation checks only.
- The final roughly twenty minutes are general setup, editor, eligibility,
  scheduling, and participant questions.  They add no opcode, memory-layout,
  interrupt, or scoring rule.  The complete transcript ends at `01:13:46` and
  matches the gallery-only final portion of the visual timeline.

Audio, the continuous five-second timeline, and every source-resolution code
or debugger segment are now reconciled for item 26.

## Visual pass: item 16 (Ben meeting 1)

- `00:00–24:00` is a foundational lesson in a terminal/editor rather than a
  survivor-design session. The visible `roadmap.md` is headed
  `CodeGuruXtreme Meeting #1 (Juniors)` and dated `2025-12-06`. It builds a
  binary place-value table, maps four-bit groups to hexadecimal digits
  `0–F`, and later records `bit`, `nibble`, `byte`, `word`, and `dword` as
  progressively larger units. These are teaching notes, not extra arena data
  types supplied by the engine.
- `24:00–37:00` introduces the browser simulator and its source, assembled-byte
  and arena panes. The presenter alternates the editor and live simulator while
  relating source text to the byte row; no competition result is established
  in this interval.
- At `37:10`, the exact temporary program is
  `MOV AX,1; POP BP; STOSW; JMP $`, assembled as
  `B8 01 00 5D AB EB FE`. It is an instructional mixture of independent
  opcodes: the later audio pass must determine why `POP BP` is included, so it
  is not treated here as a recommended attack sequence.
- `43:35–48:35` isolates the two-byte self-loop `JMP $` (`EB FE`) and steps it
  at a fixed load address. The debugger shows `CS=DS=1000h`, `SS=2040h`,
  `ES=2000h`, `SP=0800h`, and the initialized `AX`/`IP` equal to the load
  offset. A separate one-byte source `WAIT` assembles as `9B` and is marked
  invalid by the debugger. This is consistent with the custom engine's later
  `NRG` form requiring the two-byte sequence `9B 9B`; a lone architectural
  `WAIT` is not accepted as an energy instruction.
- `49:40–51:15` contrasts an incomplete `JMP` (assembler error: invalid
  opcode/operand combination) with `JMP 456`, which assembles as a three-byte
  near relative jump `E9 C8 01`. The run visibly lands in untouched `CCh`, so
  assembling successfully does not imply survival: a branch target still has
  to contain valid executable material.
- `51:35–67:55` creates two teaching entries. `Survivor` is the stable
  `JMP $`; `Hunter` begins as `MOV BX,0` (`BB 00 00`) and is extended with
  `MOV WORD [BX],0CCCCh` (`C7 07 CC CC`). Variants set `BX` to `200` and the
  debugger shows the two-byte write at `DS:00C8h`, confirming that the decimal
  literal becomes hex `00C8h` and that ordinary `[BX]` addressing uses `DS`.
  Because the shown Hunter has no loop or safe continuation, it next reaches
  arena `CCh` and dies; the passive self-loop wins the visible Competition
  prefix (`61/1000` at `01:07:45`). That chart demonstrates the bug in this
  exact toy, not the general strength of passivity or weakness of memory
  writes.

- `01:09:15` adds the missing safe continuation to the first Hunter toy:
  `MOV BX,0; MOV WORD [BX],0CCCCh; JMP $`, bytes
  `BB 00 00 C7 07 CC CC EB FE`.  A Competition prefix at `68/1000` is tied
  `34–34`, showing only that both one-process toys remain alive and share the
  current score; it is not evidence that the writer is competitive.
- `01:20:20–01:30:20` develops the first looping bomber.  It starts from the
  randomized load offset in `AX`, adds the assembled `end` offset, writes a
  word at `[BX]`, advances `BX`, and loops.  The first exact version writes
  `CCCCh` every two bytes; changing the word to `1234h` makes the arena show
  little-endian bytes `34 12`.  Changing the stride from `2` to `4` and then
  `8` produces correspondingly sparser columns.  These frames directly tie
  source stride to visible arena geometry, but contain no controlled score
  comparison.
- At `01:35:55`, an intermediate relocation attempt computes `BX=AX+0200h`,
  writes word `FEEBh` there (memory bytes `EB FE`, a self-loop), and executes
  `JMP [BX]`. That form dereferences the planted word and jumps to offset
  `FEEBh`, so the run fails. At `01:36:20` the source is corrected to
  `MOV BX,AX; ADD BX,200h; MOV WORD [BX],0FEEBh; JMP BX`, which jumps to the
  address held in `BX` and enters the planted `EB FE` loop. This creates one
  valid landing pad 512 bytes away; it is not a full replicator because it
  copies no general payload.
- At `01:38:45`, the Hunter is a backward sparse byte bomber:
  `MOV BX,AX; MOV BYTE [BX],12h; ADD BX,-3; JMP main`, with the loop bytes
  `C6 07 12 83 C3 FD EB F8`.  The arena's diagonal spacing is the direct
  result of one byte per three-byte backward step.
- The roadmap shown around `01:40:35` is titled
  `CodeguruExtreme Assembly Roadmap 2025` and dated `2025-12-03`.  Its first
  chapter covers binary storage, opcodes, CPU/ALU, the code/data/extra and
  stack segments, setup, and the prey/hunter exercises.  The listed initial
  opcode set is `JMP`, `MOV`, `$`, and labels.
- The official advanced-techniques page at `01:42` states visually that a
  team has two survivors, their relative spacing is fixed while the team is
  placed as a randomized group, and their team-shared memory is `1024` bytes
  beginning at `ES:0000`.  This is retained as page evidence for the course;
  later 2025 rule material and engine tests still take precedence if they
  disagree.
- The official heavy-bomber slide at `01:46` gives the exact sample:
  `PUSH CS; POP ES; MOV DI,AX; ADD DI,offset exit; MOV DX,0CCCCh; MOV AX,DX;`
  `INT 86h; INT 86h;` followed by `MOV [DI],DX; ADD DI,3; JMP write_word`.
  Thus the example spends both engine bombs up front and then continues as a
  normal sparse word writer.  The subsequent simulator experiment changes
  the tail to `bomb: INT 86h; JMP bomb`; after the limited calls are consumed,
  that loop is only an experiment and is not treated as a useful infinite
  bombing strategy.
- The debugger view confirms the assembled heavy-bomber setup:
  `0E 07 89 C7 81 C7 11 00 BA CC CC 89 D0 CD 86 EB FC`, with `ES` changed
  from the team segment to `CS=1000h`, `DI` derived from the load address, and
  `AX=DX=CCCCh` before `INT 86h`.  The arena visibly gains a contiguous green
  block after the interrupt, distinguishing the engine bomb from the later
  sparse writer.
- At `02:00:35`, `CALL FAR CX` assembles as `FF D1` but emits the warning
  `register size specification ignored`; this is not a memory far pointer and
  is not accepted as the intended construction merely because bytes appear.
- The final Far Call slide supplies the valid demonstrated memory-pointer
  pattern: derive `AX=load_offset+call_far-start`, copy `ES` into `DS`, use
  `BX=50h`, store `CS` at `[BX+2]` and the derived offset at `[BX]`, redirect
  `SS` to `CS`, set `SP=AX`, and execute `CALL [DWORD BX]`.  The four bytes at
  `DS:BX` are therefore offset then segment.  The next title slide explicitly
  introduces advanced cooperation between the two survivors; the detailed
  continuation belongs to the following recording.

The complete five-second/change-triggered timeline was inspected through the
`02:03:45` final frame (`1,486` sampled frames, `26` contact sheets), and all
code/rule transitions above were checked at source resolution. The full audio
reconciliation follows.

### Audio/screen reconciliation for item 16

- The opening binary/hex and CPU material is prerequisite instruction, not an
  expanded engine contract. `JMP $` is `EB FE`; a lone `WAIT` byte `9Bh` is
  invalid here, despite the instructor's initial no-op guess. Only the later
  two-byte `9B 9B` sequence is engine `NRG`.
- A fixed-address Hunter is deliberately artificial. Real participants load at
  randomized offsets each battle, and the practical baseline is a moving broad
  writer rather than assuming a target at zero. `IP` advances by the complete
  variable-length instruction; a victim dies only when its live path fetches
  overwritten invalid bytes. Because `CS=DS`, ordinary data writes share the
  executable arena.
- A one-byte `CCh` can invalidate a future fetch, but a word store consumes the
  same scheduled opcode and damages two bytes. Labels emit no bytes. Keeping
  initialization outside the loop and using `AX+(end-start)` starts the writer
  just beyond its own compiled body; 16-bit offsets wrap around the arena.
- Stride is a coverage/latency tradeoff, not a monotonic speed improvement.
  Larger steps traverse offsets sooner but leave gaps that compact or moving
  survivors can occupy. A survivor can also watch a sentinel near its live code
  and relocate when an incoming writer changes it.
- The relocation experiment contains an instructive correction visible only on
  screen: word `FEEBh` creates bytes `EB FE` at `AX+0200h`; `JMP [BX]` wrongly
  dereferences that word and jumps to offset `FEEBh`, whereas the corrected
  `JMP BX` enters the planted self-loop at the address in `BX`. A copy/landing
  pad is not automatically a new process or a full replicator.
- `INT 86h` uses `ES:DI`, `AX`, `DX` and `DF` to perform the heavy write and has
  exactly two effective calls per survivor. Relocating the bytes cannot refresh
  those charges. The instructor later says both custom interrupts have two
  calls, but the official slide and v6 implementation override that slip:
  `INT 87h` has one charge.
- The far-call preview explains why a four-byte return state can bomb twice the
  bytes of an ordinary word store after redirecting `SS:SP` to the arena. Live
  syntax experiments include rejected or misleading forms; the stable official
  construction is a memory pointer laid out offset then segment and invoked as
  `CALL [DWORD BX]`. “Usually winning” is an anecdotal characterization, not a
  measured guarantee.
- Partial Competition charts, stationary toys, sparse diagonals and the stated
  alignment odds are teaching traces. None is entered as performance evidence.
  The public Java v6 source is the authority for custom interrupts, charges,
  opcode support and other points on which the workshop is uncertain.

The merged transcript contains all `2,814` emitted segments from `00:00` through
`02:03:45`; audio, continuous visual timeline and every source-resolution demo
are fully reconciled for item 16.

## Visual pass: item 17 (Ben meeting 2)

- The recording title in the presenter's notes is
  `CodeGuruExtreme Meeting #2 (Juniors)`, dated `2025-12-09 20:02`.  The
  opening is a computer-representation lesson rather than an arena or survivor
  demonstration.
- Through about `09:20`, the notes contrast persistent computer memory with
  human memory/forgetting and draw a bit sequence before naming RAM as
  “Random Access Memory.”  These are conceptual foundations, not special
  CodeGuru memory rules.
- `09:20–19:20` introduces RGB tuples, including black `(0,0,0)`, white
  `(255,255,255)`, and red `(255,0,0)`, followed by the idea of character
  encodings/Unicode.  The visual material explains that binary words can be
  interpreted as colors, letters, pictures, or other data; it does not yet
  alter the arena's byte semantics.
- At `19:20–24:20`, the notes begin the conversion of decimal numbers into
  zeros and ones using powers of two (`2^0=1`, `2^1=2`, ...).
- `24:20–30:40` extends the place-value table through `2^8=256`.  Around
  `30:40–32:05` the presenter briefly searches for photographs of physical RAM
  modules/chips; this is illustrative material and introduces no additional
  engine rule.
- `35:40–39:40` demonstrates the descending-powers conversion algorithm on
  decimal `45`: take `32` (remainder `13`), then `8` (remainder `5`), then `4`
  (remainder `1`), then `1`, yielding binary `101101` across the columns
  `[32][16][8][4][2][1]`.  This confirms the lesson is still establishing
  representation fundamentals at this point.
- `40:00–54:59` compares that method with repeated integer division by two,
  recording each remainder as the next low-order bit.  The visible examples
  include `45`, `38`, and `31`; the latter two are exercises, not arena
  constants or offsets.
- Around `56:25–60:15`, the lesson pivots from representation to a conceptual
  CPU model: a processor follows an instruction book/opcode language, with
  toy instructions such as “colour pixel 34,” “add one to 769,” and “write
  one.”  From `60:20–66:25`, the simulator demonstrates an ordinary
  control-flow exercise that increments `BX` until `10` and decrements it back
  to `0` using `CMP` and `JNE`; this is still general assembly instruction
  practice.
- At about `66:35` the notes introduce base 16 as a compact representation, beginning
  from the digit sets of bases 2 and 10.  The exact hexadecimal/opcode sequence
  later in the recording remains to be inspected from the completed timeline.
- `75:00–79:59` maps each four-bit nibble to hexadecimal digits `0–F` and shows
  grouping a long binary string into nibbles (for example `1010 1011 0101
  0100` → `AB54`).
- `80:00–94:59` returns to the simulator: it runs the earlier `INC/CMP/JNE`
  exercise, then replaces it with `JMP $` (`EB FE`) at a fixed `A000h` load.
  The arena path display is used to illustrate 16-bit address wraparound rather
  than a new scoring rule.  The sequence beginning around `81:15` also makes the
  syntax distinctions concrete: bare `JMP` is rejected, `JMP $` is the
  two-byte relative self-loop, and `JMP [0]` assembles as `FF 26 00 00`, i.e.
  an indirect near jump through the word stored at `DS:0000`, not a jump to
  literal offset zero.
- `95:00–114:59` introduces a second player with
  `MOV BX,0A000h; MOV WORD [BX],0CCCCh; JMP $` (bytes
  `BB 00 A0 C7 07 CC CC EB FE`).  The live debugger shows that the write lands
  on Player A's `EB FE` at `A000h`, which is the concrete demonstration that
  `[BX]` means the memory at `DS:BX` and that one warrior can replace another's
  instructions.  The accompanying notes distinguish `MOV BX,0CCCCh` (change
  the register value) from `MOV [BX],0CCCCh` (write to the addressed arena)
  and list bit/nibble/byte/word/dword sizes.
- A short Competition run at `87:40–87:45` is only a classroom sanity check:
  while it is still at battle `49/100`, both toy players display `24.50`.  It is
  neither a finished 100-battle result nor evidence that the writer is a strong
  competitive design, so it is not entered as a benchmark.
- At `90:55–91:35` the presenter briefly opens the official reference PDF.  The
  visible team-sharing page says that the two same-team survivors are named
  with suffixes `1` and `2` (example `Rocky1`/`Rocky2`) and receive a private
  shared block of `1024` bytes at `ES:0000`.  Adjacent pages preview Zombie
  takeover and far calls; they are reference material here, not a completed
  demonstration in this lesson.
- `115:00–129:59` varies the same fixed-address attack, including a loop named
  `tapuz` that repeatedly executes `MOV WORD [0101h],0CCCCh`.  Repetition does
  not spread here: the code continually rewrites the same word, an important
  contrast with a writer that changes its pointer.
- `130:00–141:20` develops a small injected byte sequence.  One visible stage
  starts with `MOV BX,AX`, writes word `070Eh` at `[BX]`, byte `ABh` at
  `[BX+4]`, and loops.  The final source uses
  `%define TARGET_LOCATION 01234h`, then writes word `070Eh` at `[BX]` and word
  `00ABh` at `[BX+2]`.  In little-endian arena order these four bytes are
  `0E 07 AB 00`, so the first three decode as `PUSH CS; POP ES; STOSW`; the
  debugger visibly begins executing those implanted instructions before the
  trailing/overwritten bytes decode differently.  The full audio pass is needed
  to recover the presenter's intended exploit and safety assumptions; the
  screen alone does not make it a complete takeover primitive.
- Screen sharing stops from about `125:20–129:05`; the interval is Zoom gallery
  discussion and contains no hidden code or slide transition.  When sharing
  resumes, the injection experiment is single-stepped, including intermediate
  assembler errors and reordered forms, before settling on the final source.
- The final stable form, visible continuously from roughly `136:05` through the
  `141:25` end, is
  `%define TARGET_LOCATION 01234h; uu: MOV BX,TARGET_LOCATION;`
  `MOV WORD [BX],070Eh; MOV WORD [BX+2],00ABh; JMP uu`, assembling as
  `BB 34 12 C7 07 0E 07 C7 47 02 AB 00 EB F2`.  The arena therefore shows the
  planted bytes `0E 07 AB 00` at `1234h`; the unused fourth byte is part of the
  encoded word write and must not be mistaken for a fourth intended opcode.

The complete five-second/change-triggered timeline was inspected through the
`02:21:25` final frame (`1,698` sampled frames, `405` retained keyframes and
`26` contact sheets). Source-resolution checks cover every code/rule transition
above, and the full audio is reconciled below.

### Audio/screen reconciliation for item 17

- The first hour is representation and CPU background, not a hidden engine
  extension: RAM, bits, binary/hex conversion and the idea that opcodes are
  numeric bytes. Only behavior visibly exercised in the simulator and accepted
  by v6 is carried into the 2025 rule set.
- `JMP $` is the two-byte relative loop `EB FE`; `JMP [0]` instead dereferences
  the word at `DS:0000`. `IP` advances by the full encoded instruction length,
  and labels are assembler symbols that emit no bytes.
- `MOV BX,imm` changes a register, whereas `MOV WORD [BX],imm` writes through
  `DS:BX` into the shared arena. A victim does not die at write time; it dies
  when its live process later fetches an invalid overwritten instruction.
  Operand size controls whether one or two bytes are written, and word values
  appear little-endian in memory.
- The fixed `A000h` victim and later fixed target are classroom scaffolding.
  Actual load locations are randomized once per battle, not on every scheduled
  instruction, and submitted code cannot be edited while a battle runs. A
  moving pointer can cover the arena; knowing one fixed address is not a general
  targeting strategy.
- The participant's code-writing-code exercise passes through several incorrect
  variants before the final layout. At a known target, word `070Eh` creates
  bytes `0E 07` (`PUSH CS; POP ES`) and word `00ABh` at `[BX+2]` creates
  `AB 00`, letting the live path reach `STOSW`. The unused fourth byte is merely
  the high byte of the word write; the trace is an injection demonstration, not
  a complete general takeover.
- Arbitrary opponents are usually cheaper to corrupt than to commandeer.
  Zombies are the important exception: locating a Zombie's live path and
  replacing it with a payload or redirection can make its independently
  scheduled process execute the team's code. The exact discovery and patch are
  Zombie-specific; items 12–14 provide the concrete `0067h` advertisement and
  `FF 26` indirect-jump takeover rather than leaving this at the conceptual
  description.
- The partial score displays, fixed placements and participant experiments in
  this lesson are instructional traces only. They provide no controlled
  benchmark or evidence that any shown toy is competitive.

The merged transcript contains all `3,290` emitted segments from `00:00` through
`02:21:25`; audio, continuous visual timeline and source-resolution demos are
fully reconciled for item 17.

## Visual pass: item 18 (Ben meeting 3)

- The recording title visible on screen is `CodeGuru Extreme Meeting #3`,
  dated `2025-12-11 19:55`.  The opening returns to the simulator and to the
  official site/repository before developing arena-writing programs; neither
  the title date nor the demonstration's fixed placement is treated as an
  engine rule.
- `17:00–22:30` develops a direct word writer using macros for a target address
  and attack value.  One stable source form assembles as
  `C7 06 00 A0 CC CC EB FE`: `MOV WORD [A000h],CCCCh; JMP $`.  It repeatedly
  corrupts one fixed word and does not scan the randomized arena.
- `22:35–44:30` turns that example into an addressing lesson.  The notes list
  the general registers and distinguish register/immediate moves from memory
  operands with an explicit size.  Word writes such as `1234h` and `5678h`
  appear in arena byte order as `34 12 78 56`, while byte writes can place
  `12 34 56 78` literally.  This is direct visual confirmation of little
  endian word storage, not a CodeGuru-specific reversal rule.
- The addressing discussion uses `BX`, `SI`, `DI`, and `BP` and introduces the
  valid 8086-style base/index combinations.  The completed audio and exact
  source-resolution frames are still required before the full list is accepted
  as supported by this particular engine build.
- At about `45:00`, a `Brute Force` loop becomes stable as
  `MOV WORD [BX],CCCCh; ADD BX,1; JMP attack_loop`, assembling as
  `C7 07 CC CC 83 C3 01 EB F7`.  Because the word destination advances by one
  byte, successive writes overlap and create a contiguous `CC` front.  Later
  variants initialize `BX` from the randomized load offset in `AX`, add a
  displacement (one visible edit uses decimal `200`), and compare strides of
  one and two.
- `53:00–64:00` reinforces labels and repeatedly resets the writer.  The arena
  alternates between contiguous fills, a surviving black band, and wrapped
  coverage.  Several intermediate edits produce assembler errors; those
  states are excluded rather than interpreted as working opcodes.
- `64:40–71:10` experiments with two writer loops and different increments.
  The resulting geometry changes from solid bands to regularly spaced vertical
  bands and then fine diagonal stripes.  These runs reveal how instruction
  length, stride, overlap, and wraparound interact, but the exact constants are
  being recovered from full-resolution frames before recording the source.
- `71:25–75:10` switches to browser/calendar/chat/WhatsApp administration.
  No source or arena behavior is visible in this interval.
- `75:15–81:55` returns to the simulator and then to the course notes.  The
  debugger deliberately tries invalid segment-register moves before explaining
  the supported transfer via the stack.  The notes identify `CS` as the code
  segment, `DS` as the normal data segment, `SS` as the private-stack segment,
  and `ES` as the extra segment.  These descriptions are retained only together
  with the engine-specific initial values already reconciled elsewhere.
- `82:00–90:25` draws the downward-growing word stack and single-steps
  `PUSH`/`POP` examples.  The visible examples show the last pushed word being
  the first popped word and demonstrate using `PUSH CS; POP ES` to redirect
  `ES` to the arena.  A failed attempt that tries to `POP` an unsupported
  operand is visibly rejected and is not counted as a usable form.
- The course notes at `99:00` call `INT 86h` the engine-only heavy bomb: one
  invocation writes a full `256`-byte arena row and each survivor may invoke it
  only twice.  The simulator experiments agree with the earlier official slide
  and engine-source reconciliation; later repeated `INT 86h` bytes in a test
  program do not create unlimited bombs after the two-use budget is exhausted.
- `100:00–117:55` combines stack transfers and repeated word patterns.  It
  first pushes/pops values such as `1234h`, `5678h`, and `ABCDh`, then writes
  those words into the arena and observes their little-endian byte order.  The
  exercise is useful for seeing how structured code/data bands are made, but
  it is not a strength benchmark.
- `118:00–137:30` builds a first “look for enemies” scanner.  One stable stage
  is `PUSH CS; POP ES; search: MOV CX,[BX]; ADD BX,2; CMP BX,AX; JE search;`
  `CMP CX,CCCCh; JE search; INT 86h; ADD BX,100h; JMP search`.  It scans words
  for non-background data, but mixes the scan pointer with the heavy-bomb
  interface and provides only a fragile one-address self check.  Subsequent
  edits deliberately expose those problems rather than establishing this as a
  finished survivor.
- `137:30–160:55` develops a larger `Stack Fighter` variant.  Its setup is
  `PUSH CS; POP ES; SUB DI,4; MOV SI,AX; MOV BP,AX; ADD BP,end;`
  `MOV AX,CCCCh; MOV DX,CCCCh`.  The search advances `DI` by four, compares it
  with the interval from `SI` through `BP`, jumps to `hop` while it would scan
  its own code, and otherwise loads an arena byte through `[DI]`.  The stable
  middle is `CMP DI,SI; JL proceed; CMP DI,BP; JG proceed; JMP hop`, while
  `hop: MOV DI,BP; JMP search` skips beyond the seed.
- In the same variant, `proceed` tests the loaded byte against `CCh`, returns
  to `search` for untouched arena, and executes `INT 86h` for a non-background
  candidate.  Later edits add a `LOOP search` budget and a resting `JMP $`, and
  move/reload the `CCCCh` values used by the bomb.  The lesson therefore
  captures the design principles—sparse scanning, self avoidance, limited
  bombs, and a safe post-bomb state—rather than one immutable final listing.
- `161:00–181:25` repeatedly changes the skip bounds, stride, conditionals,
  and loop termination.  The arena shows both successful self-skips and failed
  variants that overwrite or execute invalid bytes.  The notes explicitly
  introduce `CMP`, conditional branches (`JE`, `JNE`, greater/less forms), and
  `LOOP` decrementing `CX`; the screen also contains assembler errors while
  incomplete lines are being entered, all excluded from the accepted code.
- `181:30–186:35` briefly consults web references for procedures, then tests a
  small `foo`/`CALL foo` example.  Several incomplete `PUSH`/procedure forms
  fail to assemble.  The recording ends in gallery view from roughly `186:45`
  through `187:38`, with no further technical screen transition.
- Temporary Competition views in this portion are classroom sanity checks,
  not controlled benchmarks: no result is entered as evidence of strength
  without a completed run, recorded opponents, battle count, and seed policy.

The complete five-second/change-triggered timeline was inspected through the
`03:07:38` final frame (`2,252` sampled frames, `597` retained keyframes and
`38` contact sheets).  The direct writer, stack/segment examples, heavy-bomb
lesson, and scanner/self-skip transitions were also checked at source
resolution.

### Audio/screen reconciliation for item 18

- The first hour is a deliberate recap of representation, `MOV`, labels,
  randomized placement and the simple brute-force writer. It confirms that
  `AX` initially contains the load offset, labels assemble to byte offsets,
  and 16-bit offsets wrap from `FFFFh` to zero. A process is alive because its
  current/future execution path remains valid; corrupting bytes it will never
  execute does not kill it.
- The instructor's early `20,000`-turn limit and guesses about arena group
  sizes are explicitly uncertain and refer to the browser/classroom setup.
  They are superseded by the official v6 limit of `200,000` rounds and the
  2025 four-team battle configuration. The one-point division explanation is
  directionally correct, with the v6 qualification that Zombies are excluded
  and the engine can terminate a battle early under its documented conditions.
- The stack lesson correctly establishes last-in/first-out word behavior and
  the practical `PUSH segment; POP segment` transfer. The on-screen stack pane
  is described informally as continuing indefinitely; the engine contract is
  instead the private `2,048`-byte stack with initial `SP=0800h`. The compact
  `PUSH CS; POP ES` sequence is what redirects string/heavy-bomb writes from
  the team-shared segment into the arena.
- The full `INT 86h` explanation agrees with v6: two uses per *survivor*, each
  one writes `256` bytes in a single scheduled instruction from `ES:DI`, using
  the repeated little-endian bytes of `AX` followed by `DX`. Direction follows
  `DF`; `STD` makes it move backward and `CLD` forward. Further calls are
  harmless no-ops rather than deaths or additional bombs.
- The long “look for enemies” example is not a finished strong survivor. It
  scans with `DI`, looks for a non-`CCh` byte, skips its own interval, and uses
  a heavy bomb on a candidate. During the live construction it first scans a
  word one byte ahead and still hits itself, is changed to a byte test, and
  later receives a more complicated start/end interval check. The presenter
  explicitly says the program is slow, has false positives, and cannot win
  reliably.
- A lone non-`CCh` byte is a weak enemy classifier: arbitrary old writes or a
  deliberate decoy can consume one of the two bombs. Searching for a more
  characteristic byte sequence such as `CD 86` or a common branch opcode is
  suggested, but this introduces its own false positives and can be defended
  with decoys. It is a design direction to test, not an endorsed detector.
- The self-skip discussion is valuable but its signed `JL/JG` examples must be
  treated cautiously. The v6 source does not fully implement the architectural
  overflow flag used by signed comparisons, and a wrapped interval also needs
  explicit handling. Candidate scanners must be tested directly in v6 rather
  than inheriting the classroom pseudocode.
- `CMP`, conditional jumps and `LOOP` are introduced as control-flow tools.
  The accepted engine behavior is that `LOOP` decrements `CX` and jumps while
  it is nonzero; some live counting explanations are hesitant and do not
  override that source-confirmed semantic.
- The closing procedure experiment shows that near `CALL` plus `RET` can be
  assembled, but the speaker discourages conventional procedure structure in
  a size/turn-critical survivor. That is an optimization judgment, not a ban
  on calls. The complete audio ends in administrative discussion and adds no
  further engine rule.

The `03:07:38` audio, continuous visual timeline and every full-resolution
code/debugger transition are now reconciled. Temporary assembler errors,
uncertain tournament guesses, and the scanner's failed intermediate states are
explicitly excluded from the accepted rules and from benchmark evidence.

## Visual pass: item 20 (Michael, advanced meeting 1)

- The recording begins immediately in the simulator and compares several
  progressively edited far-call constructions named `super simple callfar`,
  `simple callfar`, `working callfar`, and `advanced callfar`. The first
  fifteen minutes contain continuous debugger/run experiments rather than an
  introductory slide or gallery section.
- The source-resolution `super simple callfar` seed is
  `PUSH CS; POP SS; MOV SP,AX; ADD AX,callfar; MOV [DI+2],CS; MOV [DI],AX;`
  `callfar: CALL WORD FAR [DI]`. It constructs a four-byte far pointer in the
  memory selected by the current `DS:DI`, redirects the stack to the arena,
  and calls through that pointer. This is a teaching seed; its large red fill
  is not by itself a performance measurement.
- `simple callfar` first adds `PUSH ES; POP DS`, so its pointer writes go to the
  team-shared segment, while `PUSH CS; POP SS` keeps call-stack pushes in the
  arena. The screen repeatedly resets/runs the variants and sometimes leaves
  a completely red arena from the preceding run; those frames must not be read
  as a clean initial state for the next source edit.
- The displayed `working callfar` fixes a target around `1DFFh`:
  `PUSH CS; POP SS; MOV SP,1DFFh-2; MOV WORD [1DFFh-2],1DFFh;`
  then obtains `ES`, redirects `DS` to it, writes `CS` at `[DI+2]` and
  `1DFFh-2` at `[DI]`, and executes `CALL WORD FAR [DI]`. Some lines are
  partially covered by participant thumbnails, so the exact register-transfer
  spelling will be reconciled from audio and later unobscured frames rather
  than guessed.
- The debugger zoom at `08:05–10:55` visibly shows a growing carpet of bytes
  `FF 1D 00 10`, the little-endian instruction/pointer material generated by
  the far-call/arena-stack construction. The process later reaches untouched
  `CCh` and the log can show no players left alive; the visual effect therefore
  does not establish a stable self-sustaining survivor.
- By `11:15–15:25`, the presenter alternates small `Player G`, `working
  callfar`, and the macro-heavy `advanced callfar`, single-steps them, and
  repeats the same carpet at different placements. Several edits and one
  visible assembler error occur. All are retained as experimental states until
  the completed timeline and audio identify which variant the presenter
  considers corrected.
- `17:15–18:55`: the minimal variants are run against each other and inspected
  at arena scale and under heavy zoom.  The experiments produce either a
  horizontal/vertical trace or regularly repeated diagonal bands; at least one
  run ends with the simulator reporting no enabled players.  These are useful
  geometry checks, not competition results.
- At `19:00`, an unobscured debugger frame shows the opening of the
  macro-controlled `advanced callfar`: it redirects `SS` to the arena, saves
  `AX` in `SI`, copies `stack_copy` with `REP MOVSW`, then begins a constructed
  far-call loop.  Visible instructions include `SUB AH,07h`, `ADD DI,40h`,
  `MOV BX,DI`, `MOV AL,0A1h`, `STOSW`, `MOV BP,AX`,
  `MOV AX,1000h+add_to_cs`, and another `STOSW`.  This explains why the
  advanced run produces many separated bands rather than the one fixed band
  of the smaller example; the remaining loop is still to be reconciled from
  the audio/uncovered frames.
- `20:05–25:30`: a small `Player E` is used to isolate segment arithmetic.
  Its source visibly defines `add_to_cs`, sets `SS=CS`, makes `SP` and a word
  write depend on `1DFFh-2 + add_to_cs*16`, copies `ES` into `AX`/`DS`, stores
  a far pointer through `DI`, and executes `CALL WORD FAR [DI]`.  Values
  `add_to_cs=20` and later `1` are tried.  With `1`, single stepping shows the
  call target execute at `CS=1001h, IP=1DFFh`; because a segment increment is
  16 physical bytes, the repeated bytes `FF 1D 01 10` overlap into a dense
  band.  The final zoom also shows the process eventually leaving that band
  and encountering unrelated/invalid bytes, so this remains a didactic
  construction rather than a finished survivor.
- A clean source frame at `30:00` resolves the small example more precisely.
  After `PUSH CS; POP SS`, it sets
  `SP=1DFFh-2+add_to_cs*16`, plants a word at that same arena offset, then
  performs `MOV AX,ES; MOV DS,AX; MOV BX,CS; ADD BX,add_to_cs;`
  `MOV [DI+2],BX; MOV WORD [DI],1DFFh-2; CALL WORD FAR [DI]`.
  Thus `[DI:DI+3]` in team-shared memory is explicitly the offset/segment far
  pointer, while the arena stack and planted destination make the called code
  continue the pattern.  The exact planted word's source literal is clipped
  at the right edge in this frame and remains flagged for the full timeline.
- `30:00–46:00` continues varying `add_to_cs` and single-stepping the small
  construction.  One temporary `Player H` edit has an on-screen NASM
  “expecting ]” parser error and is excluded.  With `add_to_cs=12`, the zoomed
  arena visibly repeats bytes `FF 1D 0C 10`, confirming that the pointer's
  segment word changes with the macro and that the observed carpet is made of
  executable far-call material, not an abstract visualization.
- The corrected `Player H` toy at `36:10` is only
  `MOV BYTE [1DFFh],0CCh; JMP start` (bytes
  `C6 06 FF 1D CC EB F9`).  It repeatedly corrupts one fixed byte and is used
  to probe whether the constructed far-call stream survives that location;
  the earlier malformed edit and a later arena-sized green fill are not
  evidence that this seven-byte probe is a competitive attacker.
- `49:30–65:30` returns to `advanced callfar` and exposes both halves of its
  source.  The top half saves the original private `SS` in `ES` while moving
  `CS` into `SS` (`PUSH CS; PUSH SS; POP ES; POP SS`), copies `stack_copy`
  with `REP MOVSW`, then constructs an `A1h`/segment far-pointer sequence with
  two `STOSW`s and changes `ES`, `DI`, `BP`, and `SP`.  The copied tail uses a
  second `REP MOVSW`, two `MOVSW`s, `XOR SI,SI`, stack/index adjustments, and
  two `CALL WORD FAR [BX]` sites separated by a `SUB SP,AX`.  The debugger at
  `60:00` shows one path eventually reaching untouched `CCh`; the surrounding
  runs show separated copied fragments rather than a proof of indefinite
  survival.  The final minute switches to speaker view and contains no further
  on-screen code.
- The completed source-resolution pass resolves the small example's previously
  clipped planted word. With `add_to_cs=1`, the assembled bytes
  `C7 06 0D 1E FF 1D` are
  `MOV WORD [1DFFh-2+add_to_cs*16],1DFFh`: the destination physical address is
  shifted by the same 16-byte segment increment used in the far pointer. The
  debugger then shows the call landing at `CS=1001h, IP=1DFFh`, rather than
  merely drawing a similar-looking band.
- The full-resolution debugger also confirms the initial segment split used by
  these constructions: `CS=DS=1000h`, private `SS=2040h` with `SP=0800h`, and
  team-shared `ES=2000h` in the displayed run. In the advanced opening,
  `PUSH CS; PUSH SS; POP ES; POP SS` deliberately preserves the old private
  stack segment in `ES` while changing `SS` to the arena; later stepping shows
  a copied instruction sequence in that private segment while execution has
  moved to `CS=1002h`. This makes the private stack an active code/pointer
  staging area, not just passive call storage.
- The final experiments vary `add_to_cs` (including `0` and `2`) and repeatedly
  reset the same source. Changing it alters both the far target segment and the
  spacing/overlap of the generated bands. Several runs eventually execute a
  `CALL FAR [BX]` from the copied tail and some reach untouched `CCh`; therefore
  the lesson demonstrates a family of propagation mechanisms and parameter
  sensitivities, not a measured claim that one displayed parameter is best.

The complete five-second timeline and all code/debugger states through the
speaker-only ending were reviewed before the audio reconciliation below.

### Audio/screen reconciliation for item 20

- The complete audio confirms that the lesson is an exploration of a
  **family** of far-call writers, not a presentation of one finished winning
  survivor. The large fills shown early are repeatedly followed by self-hits,
  invalid arena bytes, parameter changes, or a dead process. None is promoted
  to benchmark evidence without opponents, seeds, battle count, and final
  scores.
- The core primitive is source-confirmed: redirect `SS` to the arena and make
  an indirect far call through a four-byte pointer. The call pushes the old
  `CS` and the already-advanced return `IP`; with the pointer arranged so the
  return IP is `1DFFh`, the little-endian pushed word contributes bytes
  `FF 1D`, which themselves decode as an indirect far call. The fixed call
  site is therefore chosen at `1DFFh-2`, because the two-byte call has already
  advanced `IP` when the return address is pushed.
- Storing the far pointer in team-shared memory keeps that control data out of
  the arena and inaccessible to opposing teams. It is not private to a single
  survivor: the partner can access the same `ES` block. Ordinary `MOV [DI]`
  uses `DS`, whereas the string destination is implicitly `ES:DI`; the lesson
  explicitly pauses to distinguish these two cases.
- A static call-far carpet is vulnerable. Only a small set of register-based
  encodings is normally used, and a fixed physical location can be attacked
  directly. The historical “anti-callfar” idea described here waits for or
  recognizes the pushed address, escapes, and then attacks the inferred writer
  location. This is historical design context, not a guaranteed current
  counter.
- One mitigation is to adjust `SP` between calls, producing sparse four-byte
  writes and avoiding the seed rather than allowing the stack front to collide
  with it. This spends an extra scheduled instruction per write. The speaker's
  qualitative statement that sparse coverage performed better against the
  then-current survivor pool is not reproducible benchmark data and is not
  assumed to generalize to 2025.
- The segment-shift variant preserves the required logical `IP` while changing
  the far target `CS`. Incrementing a real-mode segment by one shifts the
  physical execution address by 16 bytes, so the same pushed `IP` bytes can be
  generated from a different arena location. The chosen segment delta remains
  visible in the submitted code unless it is derived at runtime; the class
  suggests deriving it from a randomized initial register as a possible
  hardening direction, but does not implement or benchmark that idea.
- The live Q&A corrects an earlier overstatement: `SP` cannot be chosen
  arbitrarily if the goal is for the generated write pattern to avoid or
  harmlessly overwrite the seed. Its initial residue relative to the stride
  and seed placement must be chosen deliberately.
- The final `advanced callfar` explanation resolves the purpose of the copied
  private-stack tail. The survivor arranges to overwrite its live path with
  opcode `A5h`/`F3 A5` (`MOVSW`/`REP MOVSW`), then copies prepared bytes from
  private stack memory into the arena immediately ahead. Those bytes rebuild a
  far-call/stack setup at a new location and transfer execution there. The
  instructor occasionally says `STOSW` while correcting himself; the screen
  and opcode are `MOVSW`. In v6, `REP MOVSW` still performs only one word per
  scheduled turn and rewinds `IP`, so the copied tail is interruptible.
- The jump spacing must not cause the relocation cycle to land back on the
  vulnerable seed before useful work is done. The verbal divisibility shortcut
  is only a design intuition; 16-bit wraparound and the exact physical segment
  arithmetic must be tested in v6 for any candidate constant.
- The memory-size discussion is initially hesitant, then converges on the
  correct values: the private stack allocation is `0800h` bytes and the
  team-shared block is `0400h` bytes. The arena itself is the shared 64 KiB
  execution region; it is not a conventional private segment.
- The speaker says an older version of the moving design was selected by
  running it against prior survivors, but supplies no opponent list, battle
  count, seed policy, score table, or preserved binaries for that comparison.
  It remains a useful hypothesis to benchmark, not an accepted performance
  result.
- The last minutes are file-sharing and scheduling discussion. They add no
  opcode or tournament rule. The full `01:07:19` transcript ends with a request
  for a follow-up advanced lesson, which is item 21.

The `01:07:19` audio, continuous visual timeline, and full-resolution code and
debugger states are now reconciled. Item 20 is complete.

## Visual pass: item 21 (Michael, advanced meeting 2)

- The reviewed opening section is a live dissection of the historical/sample
  survivor `shooterC`. It is not a blank-sheet construction and no strength
  conclusion is drawn from its visually impressive bands.
- The setup begins with `PUSH CS; PUSH SS; POP ES; POP SS`. In the displayed
  initial state this makes `ES` point at the private stack segment while `SS`
  points at the arena segment. `SI` is derived from the randomized load offset
  in `AX`, and `REP MOVSW` copies a labeled block of the survivor into that
  private stack area. Later `SP`, `DI`, and segment values are deliberately
  reassigned, so subsequent `CALL`/stack activity can also write structured
  data in the arena.
- The visible source constructs a far-call target with `STOSW`, adjusts segment
  values in units whose physical effect is sixteen bytes per segment unit, and
  repeatedly reaches `CALL FAR [BX]`. The copied block includes another
  `REP MOVSW`, pointer/stack arithmetic, two single `MOVSW`s, and additional
  far calls. Exact constants are macro-controlled (`major_copy_lng`,
  `minor_copy_lng`, `jmp_lng`, `stack_distance`, `sp_jmp_lng`, `add_to_cs`),
  rather than engine constants.
- Repeated debugger runs with different seeds and `add_to_cs` values visibly
  create multiple long, regularly spaced diagonal bands around the 64-KiB
  arena. Zoomed frames show the repeated copied tail bytes inside each band;
  the bands wrap at the arena boundary. At other parameter values, only a
  sparse dashed trace or a single line survives, demonstrating sensitivity to
  those source constants, alignment, and the constructed control flow rather
  than a deterministic engine-wide geometry.
- `30:55–33:35`: a separate minimal Player B `CALL`/return example is
  single-stepped while `CS:IP`, `SS:SP` and the private stack pane remain
  visible. It provides a simpler control for the more complex `shooterC`
  behavior and will be reconciled with the audio before fixing exact stack
  order.
- `33:45–39:45`: `shooterC` is reloaded and its dense diagonal bands are run
  repeatedly while the source is edited. A temporary “expression syntax
  error” appears during one edit; that variant is excluded rather than treated
  as valid source. Successful frames continue to show the repeated far-call
  and copy machinery producing arena-spanning bands.
- `40:05–40:55`: the share opens the official CodeGuru page and then the
  `codeguru-il/corewars8086-survivors` repository, visibly listing historical
  year directories and describing the repository as survivors submitted to
  various CodeGuru Xtreme competitions. No new engine rule is displayed in
  this detour; it establishes the provenance of the historical examples.
- `42:25–45:00` switches to participant troubleshooting on macOS.  The screen
  navigates the downloaded release and Java installation rather than showing
  survivor execution.  At `45:00`, GitHub's release page visibly identifies
  `CoreWars8086 v5.0.1` as the version used for the 2023 competition and notes
  that its preset Zombies run at `2x` speed instead of the preceding release's
  `5x`; that changelog is historical/version-specific, not silently promoted
  to a 2025 rule.
- `45:30–50:30` is a concrete macOS launch walkthrough.  Gatekeeper initially
  refuses to open the downloaded JAR, after which the participant opens a
  terminal in the release directory and launches
  `java -jar bin/corewars8086-5.0.1.jar --zombieSpeed 2`.  The Competition
  Viewer opens with `bimp`, `shooterA`, `shooterB`, and `shooterC` and controls
  for four groups, 100 wars per combination, and seed `guru`.  Those are the
  launcher's visible defaults/example values, not final-tournament constants.
- `50:30–53:05` closes the setup session and returns to speaker/gallery video;
  no source, opcode, arena run, or additional engine rule appears.
- A source-resolution debugger frame confirms the engine-specific starting
  segments used by this demonstration: `CS=DS=1000h`, a private
  `SS=2040h`, team-shared `ES=2000h`, and `SP=0800h`. The survivor immediately
  repurposes those registers; the sample must not be generalized as ordinary
  8086 process memory without those CodeGuru initial conditions.
- The full `00:00–42:20` technical section was checked in the formal timeline:
  it repeatedly alternates source/disassembly inspection, single-step runs, and
  parameter changes rather than hiding an unreviewed slide transition.  The
  macOS troubleshooting occupies `42:25–50:45`; the final `50:50–53:03` is
  gallery discussion with no shared source or arena.

The complete five-second/change-triggered index contains `637` sampled frames,
`269` retained keyframes, and `17` contact sheets through the `00:53:03` final
frame.  Source-resolution checks cover the `shooterC` opening, copied tail,
far-call construction, sample call/return sequence, and launcher setup.  Item
21's audio reconciliation follows.

### Audio/screen reconciliation for item 21

- The opening continues directly from item 20 and confirms that the displayed
  code is a compact historical `shooterC`-family survivor, not a newly measured
  2025 champion. The instructor repeatedly encourages understanding and
  parameter changes rather than blind copying; historical claims that a
  version or its descendants won lack the opponent pool, battle count, seeds,
  and score records required for our benchmark ledger.
- Long historical binaries may contain deliberate duplicate byte sequences or
  decoys. A known four-byte live signature can be found and replaced once by
  `INT 87h`; placing an earlier harmless occurrence in the search direction
  can absorb that charge. This consumes bytes and may still fail against a
  different direction, signature, or ordinary bombing, so it is a defense to
  test rather than a guarantee.
- Publication/locking changes the threat model. If one survivor is known in
  advance, an opponent can search for a characteristic far-call or copy
  sequence and target it. The class suggests changing equivalent register
  encodings, constants and decoy layout. Its uncertain recollection of which
  stage exposes which file is superseded by the official 2025 workflow in
  items 25 and 29–31.
- The anti-callfar explanation is consistent across the audio and debugger:
  redirected-stack far calls expose pushed `CS:IP` material in the arena. A
  watcher can detect a changed barrier, recover or infer the writer's location,
  and attack it. Sparse `SP` steps can skip one barrier, while frequent
  relocation aims to leave before the counterattack lands. Neither defeats all
  scanners, and both cost scheduled instructions or coverage.
- Keeping a logical `IP` value fixed while changing `CS` changes the physical
  arena address by 16 bytes per segment unit. This supports moving far-call
  variants, but excessive segment adjustment can move execution into the
  team-shared/private region; the v6 execution guard then kills the process.
  Parameters therefore need bounds, not merely randomization.
- The advanced self-copy uses `A5h`/`F3 A5` so an `A5h` overwrite can become a
  useful `MOVSW` rather than immediate death. The class also raises the broader
  possibility of planting code that redirects an opposing survivor into an
  attacker payload. These are strategy ideas; the v6-specific fact remains
  that `REP MOVSW` performs one word per scheduled turn and is interruptible.
- Two partners using the same stride and coordinated phase can be arranged so
  their regular write fronts do not intersect their seeds. That is a modular
  arithmetic design condition, not an absolute promise that partners can
  “never” harm one another after enemy writes, relocation, or Zombie activity.
- The simpler `CALL`/stack Q&A correctly establishes that `SP` selects where
  pushes land inside `SS`, pushes move toward lower offsets, and redirecting
  `SS` to the arena converts return-state saves into arena writes. `STD` does
  not reverse stack push direction; it controls string instructions only.
- The displayed historical binary is calculated as about `75h` (`117`) bytes
  before any stage-specific signature accommodation. Spoken references to a
  byte-50 signature are junior-track material and do not replace the senior
  qualification rule or the signature-free 256-byte final rule.
- A participant asks about `XLAT`; the response is explicitly uncertain and is
  not accepted as documentation. v6 source fixes it as
  `AL = byte [DS:(BX + unsigned(AL))]`.
  Likewise, sample `100`-war settings, seed `guru`, v5.0.1, and Zombie speed 2
  in the launcher walkthrough are historical setup values, not 2025 judge
  constants.
- The final `08:03` is entirely macOS terminal guidance, note taking, file
  transfer, scheduling and contact exchange. It adds no opcode, score rule, or
  benchmark. The complete transcript ends at `53:01`, matching the gallery
  close in the visual timeline.

The full `00:53:03` audio, continuous visual index, and all source-resolution
code/debugger states are reconciled. Item 21 is complete.

## Reconciled pass: item 19 (Ben meeting 4)

- `00:00–04:40` is Zoom gallery/discussion. At roughly `04:50` the presenter
  begins sharing the simulator, a terminal/editor, and source material used for
  the live experiments.
- `09:00–13:00` visually reinforces the role of `SI` and `DI` and the relevant
  segment registers (`DS`, `ES`, and `CS`). The following section contains
  several assembler/syntax experiments, including visible error messages;
  failed examples are not being promoted into the accepted instruction set.
- Around `23:00` the presenter opens an x86 instruction reference for the
  `STOS` family. The screen definition agrees with the reconciled rule below:
  `STOSW` stores the word in `AX` at `ES:DI`, then changes `DI` by two according
  to the direction flag.
- Around `28:00–34:20`, the simulator is used with `PUSH DS; POP ES; STOSW` and
  both fixed and randomized placements. Single-stepping visibly writes the
  initial `AX` word (one run shows `6633h`) into the arena at the destination
  selected by `DI`. This is direct screen confirmation of the operand and
  address semantics, not merely a verbal description.
- `40:25–41:50` shows the complete self-extending `ABABh` example:
  `PUSH DS; POP ES; MOV DI,AX; ADD DI,end; MOV AX,0ABABh; STOSW; end:`.
  The debugger displays the resulting broad `AB` stripe and the live `CS:IP`
  pointer travelling through it. The decisive detail is that `DI` is first
  positioned immediately after the seed code, so the newly written `AB` bytes
  become the next `STOSW` instructions rather than a remote carpet that will be
  reached only much later.
- `42:55–43:10` briefly exposes the bundled `bimp` survivor and the simulator's
  memory-pointer overlay options (`CS:IP`, `DS:*`, `ES:*`, `SS:BP`, `SS:SP`).
  This corroborates the backward `MOVSW` source already recorded under item 1;
  it is not a benchmark run.
- `45:50–50:20` demonstrates source-level constants and raw bytes. The valid
  form uses `%define PAYLOAD_CODE 0xABAB` followed by the same setup and
  `MOV AX,PAYLOAD_CODE; STOSW`. Several intermediate `DB`/`%define` attempts
  visibly produce assembler errors, so those malformed lines are retained only
  as failed teaching experiments. At `51:35`, a clean step view shows
  `AX=ABABh`, `ES=DS=1000h`, `DI` immediately beyond the live `STOSW`, and the
  two newly generated `AB` instructions directly in its future path.
- `52:55–57:25` leaves the same survivor paused with the three pointer overlays
  visible. At `57:30` the presenter switches to written notes for string
  instructions. The notes first contain tentative segment/address wording and
  are edited live; those intermediate states are not authoritative.
- `59:55–01:03:30` opens the Intel-style `MOVS/MOVSW` reference and then corrects
  the notes. The final screen state uses `DS:SI` as the source and `ES:DI` as
  the destination, with both indices changing by two for a word. It also leaves
  the corrected `LODSW` form as a load from `DS:SI` into `AX`. This visual edit
  is why the earlier verbal `ES:SI` slip is rejected in the reconciled rules.
- `01:03:35–01:04:55` returns to the live `ABAB` arena example; no new score or
  opcode rule is introduced in that interval.
- `01:07:55–01:19:00` repeatedly runs that same compact `ABAB` self-extender
  against the bundled `bimp`/`shooter` set at different placements. Zoomed
  frames show `CCCC` and other opponents' bytes puncturing large, previously
  painted `AB` regions before the live pointer reaches them. Other seeds let
  the writer form a broad intact band. These contrasting runs visually support
  the freshness/latency argument; isolated score snapshots and attractive
  arena coverage are not treated as a stable benchmark.
- The opening administrative answer says the archived event's preliminary
  rounds are normally run in small heats (the question names groups of four),
  while the final is generally run together. This is tournament-format context,
  not a simulator scheduling or scoring rule, and should be rechecked against
  the actual 2025 organizer instructions before relying on opponent count.

- `01:19:00–01:23:25` replaces the fast `ABABh` carpet with `AB90h`. The
  debugger confirms bytes `90 AB` in the future path and only a very short
  gap between the write front and live `CS:IP`. The presenter explicitly calls
  the observed Competition lead illustrative and points out that every `NOP`
  consumes one of the survivor's scheduled instructions.
- `01:23:25–01:28:45` builds the compact bidirectional form in source. The
  corrected final variant is `%define PAYLOAD_CODE 0xAB51`,
  `%define ATTACK_CODE 0xCCCC`, `PUSH DS; POP ES; PUSH DS; POP SS;`
  `MOV CX,ATTACK_CODE; MOV SP,AX; MOV DI,AX; ADD DI,LEN;`
  `MOV AX,PAYLOAD_CODE; STOSW; end:`. Earlier frames contain the temporary
  mistake `MOV BP,AX`; the presenter catches it and changes it to `MOV SP,AX`.
  Consequently each generated word contains bytes `51 AB`: `PUSH CX` writes
  `CCCCh` backward through `SS:SP`, while `STOSW` writes another `51 AB` word
  forward through `ES:DI`. The source-resolution arena trace visibly expands
  in both directions, so the discarded `BP` version is not treated as valid.
- The speaker says the generated stream is only one-byte instructions, but
  this means each *instruction* (`PUSH CX` and `STOSW`) is one byte; one cycle
  of the two-instruction pattern remains two scheduled turns. It does not mean
  the survivor performs both writes in one turn.
- `01:29:20–01:33:15` returns to Zombies. Capture is described as an opening
  taking perhaps four to ten turns for familiar targets, followed by a separate
  survival/attack strategy. The suggested safety idea—make a captured Zombie
  attack in a direction or region that is less likely to hit the team—is a
  design heuristic, not an engine guarantee. Redirecting its `CS:IP` into
  chosen code is again the operational definition of takeover.
- `01:33:15–01:35:00` contains a deliberately tiny `MOV AX,0FFFFh` calculator
  experiment and reiterates that the load address and initial `IP/AX` vary by
  round. The presenter's spoken arena-size guesses are corrected by the full
  16-bit offset range recorded below.
- `01:35:00–01:39:40` is mostly help loading the supplied Zombie ZIP through
  the simulator menu. The presenter warns that Zombie capture is useful only
  when integrated into a strong strategy; possession alone does not confer
  team score. `01:39:40` to the `01:47:00` end is site login/registration and
  file-transfer administration, with no hidden code, rule, or arena demo.

- This meeting revisits `STOSW`, `LODSW`, and `MOVSW` before introducing the
  key survival principle: code that has already been written into the arena but
  will only execute much later is a large vulnerable surface. The intended
  metric is the distance/latency between the write front (`ES:DI` in the
  examples) and the live instruction pointer, not merely the number of bytes
  painted per turn.
- With the engine's initial clear direction flag, `STOSW` writes the word in
  `AX` to `ES:DI` and advances `DI` by two. More generally, the direction flag
  controls whether the string indices advance or retreat. Redirecting `ES` to
  the arena with `PUSH DS; POP ES` is therefore a CodeGuru setup step, not part
  of `STOSW` itself.
- The recording verbally slips between segment names while explaining the
  other string operations. The reconciled 8086 semantics used for later work
  are: `LODSW` loads from `DS:SI` into `AX` and changes `SI` by two; `MOVSW`
  copies from `DS:SI` to `ES:DI` and changes both indices by two, with the signs
  reversed when `DF=1`. Claims of `LODSW` reading `ES:SI` are rejected rather
  than copied into the rule set.
- The `ABABh` generated word produces two one-byte `STOSW` opcodes and advances
  the write front twice as fast as execution. The demonstration shows why that
  can lose despite broad coverage: hundreds or thousands of turns can pass
  before the already-written far-ahead instructions execute, giving opponents
  ample time to corrupt them.
- `AB90h` produces bytes `90 AB` (`NOP; STOSW`). It keeps only a short amount
  of future code exposed but spends every other scheduled instruction doing no
  useful write. `AB50h` instead produces bytes `50 AB` (`PUSH AX; STOSW`): after
  placing `SS:SP` in the arena, `PUSH AX` writes the same word backward while
  `STOSW` writes it forward. This gives the compact bidirectional carpet covered
  in items 8–9. The speaker's favorable Competition screen is a teaching demo,
  not a reproducible benchmark.
- Corrupting any historical byte of a survivor does not kill it. Death occurs
  when its process executes an unsupported/invalid decoding; therefore the
  bytes at or ahead of the live `CS:IP` path matter. Arbitrary writes can still
  be effective because they may break a loop or form an invalid mixed
  instruction even when the written word is not itself `CCCCh`.
- The engine schedules one instruction per process in an ordering selected for
  a battle, and that ordering advantage is expected to average out over many
  battles. The exact randomization implementation still needs source-level
  confirmation; the speaker explicitly expresses uncertainty about some group
  sizes. His qualifying-round “groups of four” and possible `8–10`-team final
  are therefore contextual, superseded where the final-rule recordings are
  more precise.
- A label used as an immediate value is its assembled byte offset. Thus
  `MOV DI,AX; ADD DI,end_label` starts a generated stream just after the setup,
  while `$` represents the current assembly location. These are assembler
  calculations, not runtime discovery of an opponent.
- Writing raw bytes with `DB` can obscure source readability but is not
  encryption: the published compiled bytes can be disassembled. It also does
  not change what the CPU executes.
- Zombie capture is treated as an opening subroutine, not a complete strategy.
  The presenter's “usually within roughly ten turns” is an estimate for the
  shown families, not an engine guarantee. A captured Zombie must be directed
  to useful code that does not endanger the team; deliberately allowing it to
  die later can be preferable to letting it attack the survivor.
- Several spoken numeric statements are approximate or garbled. The arena is
  the full offset range `0000h..FFFFh`, i.e. 65,536 bytes, as confirmed by the
  simulator source—not 56,000 or the mistranscribed calculator result.

The full audio, complete five-second screen timeline, and source-resolution
checks of every edited code state have been reconciled. Temporary assembler
errors and the `BP` typo are explicitly excluded above, and no visible
Competition snapshot is promoted to a measured benchmark.

## Visual pass: item 29 (stage-B submission guidance)

- `00:00–04:15` and most intervening periods are gallery discussion. At about
  `04:20–05:35` an organizer briefly shares `war1.csv`, a table of team names
  with small integer results (`5`, then `4`). Without the pending audio these
  values are not interpreted as scores, ranks, or advancement thresholds.
- `15:15–20:00` shows an organizer's robustness experiment, not an engine
  transformation. A Python helper reads compiled binaries in 20-byte chunks,
  retains even-numbered chunks, and replaces every byte of alternate chunks
  with `CCh`; the result is reloaded as `DB` bytes in the web simulator. Red
  annotations count positions/chunks. This is evidence for testing how much
  live execution depends on old code, not a 2025 signature rule or automatic
  arena corruption pattern.
- At `20:45` the official GitHub release page explicitly identifies
  `CoreWars8086 v6.0.0` as “The version used in the cgx2025 competition.” Its
  visible changes include war-event visual effects, preset team colors and a
  CLI total-war-count option; fixes include signed-to-unsigned `int32`
  conversion and “Zombies no longer receive scores in games.” The notes warn
  that these fixes may make old-competition scores incomparable and call the
  effects feature experimental.
- `21:45–24:05` runs the desktop competition/session viewer with historical
  survivors including `TOM_ATO*`, several other teams and `zom19*`. The bottom
  controls visibly use `Survivor groups per war: 4` and
  `Wars per groups combination: 100`. Event overlays distinguish elimination,
  destruction/disruption and `ZOMBIE CAPTURED`; one frame explicitly reports
  `HRZ_SHRek2 controls zom19g`. These labels are observer output, while the
  release-note scoring fix determines that the controlled Zombie itself does
  not earn survivor points.
- From roughly `24:05` through the end at `38:11`, the recording remains in
  Zoom gallery view; the final 5-second timeline contains no further screen
  share, code, simulator, slide, or document. The visual and full-resolution
  passes are therefore complete.

### Audio/screen reconciliation for item 29

- The organizers say the first online result was run in the Java engine with
  all submitted pairs and the supplied Zombies. Teams were placed into score
  bands worth `5,4,3,2,1` stage points; submitting a valid entry earned at
  least one. Repeated clarification fixes this stage at `5%` of qualification,
  the Thursday morning/next-submission run at `25%`, and the physical event's
  later run at `70%`.
- Both Survivors are submitted again on Thursday with the same category
  signatures: senior `NOP` at compiled bytes `39,78,...`, junior `NOP` at byte
  `50`. The Thursday version of Survivor 2 is then locked for the physical
  event; only Survivor 1 may be changed during the on-site adaptation period.
  Keeping both members strong before the lock is therefore strategically
  essential.
- Before that Thursday submission, the organizers publish a deliberately
  damaged hint version of the current field: twenty original bytes, twenty
  bytes replaced by invalid `CCh`, then twenty original bytes, repeatedly.
  The replacement can cut a multi-byte instruction, so the following readable
  block may begin mid-instruction and require trying disassembly offsets. This
  is partial evidence for analysis, not executable opponent code and not an
  automatic corruption performed by the arena.
- After the Thursday submission, the complete unredacted binaries are exposed
  for the physical event. Teams then get roughly two to three hours, the fixed
  Survivor 2, and permission to adapt Survivor 1 against the published field
  and any event surprises. The lesson explicitly allows replacing either
  program completely before Thursday; the only persistent constraint is the
  required signature/size validation.
- The next submission uses the same provided Zombie set. The on-site event may
  add surprises/new Zombie conditions, so optimizing solely to the known pack
  would be brittle. The exact number of finalists (`8`, `10`, or `12` in some
  division) is still being discussed and is not treated as a stable engine
  rule.
- Item 29 is the definitive version transition: the official v6.0.0 release is
  introduced as the new engine used from this point and for the event. Its bug
  fixes can change old scores, so every candidate must be rerun on v6 rather
  than inheriting v5/browser results. The browser remains useful for editing,
  but organizers score with Java and warn of behavioral differences.
- The event overlays in v6 report deaths, attacks and Zombie capture and are
  explicitly experimental display aids. They do not alter CPU semantics or
  supply score to a captured Zombie. The official release/source confirms the
  material scoring fix: living Zombies are excluded from v6's denominator and
  never receive points.
- The physical-event `5%+25%+70%` total determines advancement. The later
  final starts every advancing team again at zero, so qualification points do
  not carry into the final. Approximate times, venue advice, connectivity and
  resume/logistics discussion add no opcode or memory rule.

The `38:11` audio, complete visual timeline and all source-resolution views are
now reconciled for item 29. Where the live Q&A briefly garbles percentages, the
multiple consistent statements and the stage sequence above control.

## Visual pass: item 31 (final-rules wrap-up, part B)

- The full `08:52` recording is a Zoom gallery discussion. There is no screen
  share, slide, rule sheet, source code, simulator view, or other visual
  technical content at any point.
- Consequently the full-resolution demonstration check is genuinely not
  applicable for this item, rather than merely skipped. Its importance is in
  the spoken final-rule discussion, so the item remains open until its complete
  audio transcript is reviewed and reconciled against part A and the earlier
  lessons.

### Audio/screen reconciliation for item 31

- This part is primarily logistics and tournament staging, not a change to the
  virtual machine. The presenter states that the final competition work starts
  from zero. Senior teams receive a separate “Zombie fractal” task on Tuesday,
  submit it before Thursday's event, and its score contributes a stated but
  not numerically specified percentage to the final result.
- On event day the teams receive the main task, work from about `16:15` until
  roughly `18:00–18:15`, and submit the first survivor. All first survivors
  from both age divisions are then published. Teams receive about another
  `40–60` minutes to analyze them and submit the second survivor. This confirms
  that the final intentionally includes a public-code adaptation phase; it
  does not imply that a solution should be narrowly countered to one opponent.
- A first run selects the top four in each age division. Those teams leave the
  general pool and continue working while invited talks take place. Later runs
  rank places `5–8` and then `1–4`; the senior fractal score is added at the
  relevant ranking stage. Exact weights and battle counts are not stated in
  this recording and remain for part A/official material.
- The closing technical advice is broad—practice the site, survivors,
  interrupts, Zombies, anti-Zombie techniques, strategy, and explicit division
  of roles within the team. No new opcode, memory-layout rule, interrupt
  behavior, signature byte, or scoring formula is introduced here.

## Visual pass: item 30 (2025 final briefing, part A)

- The complete `30:44` timeline is overwhelmingly a Zoom gallery discussion.
  A brief unrelated browser detour at about `15:00–16:00` shows fractal images
  and supplies no competition rule.
- At `19:55–20:15` and again at `23:50–24:30`, the presenter shares the
  official CGX site. Source-resolution frames explicitly read `CodeGuru Xtreme
  2025`, `Competition: CodeGuru Xtreme 2025 FINAL`, and show the group page.
  The home page also lists `SURVIVORS (Dec. 26, 2025)` with junior/senior
  downloads and `ZOMBIES (Dec. 26, 2025)`.
- This visual evidence corrects the provisional “2026” label in the study
  plan: the meeting happened after the downloads were posted, but the event
  being briefed is the 2025 final. No source code, simulator execution, opcode
  table, or readable rule sheet appears, so the technical content of this item
  is entirely in the audio pass.

### Audio/screen reconciliation for item 30

- The final is explicitly a clean slate: its Zombies and tasks are new, and
  all necessary material is supplied at the event. Existing techniques remain
  useful, but an unchanged pre-final survivor is not expected to solve the new
  field automatically.
- The first work phase ends with submission of Survivor 1. That binary is then
  published for every finalist in both age divisions, after which teams have
  until the next deadline to submit Survivor 2. The top four in each division
  receive a further challenge and may replace *both* survivors for the final
  ranking run. Item 31 supplies the complementary schedule and confirms this
  same staged process.
- The final-specific binary limit is stated as `256` bytes and there are no
  mandatory signature bytes. This supersedes the `512`-byte/every-39th-byte
  senior rule used in the preceding online stage; it is not a general change
  to the v6 engine's configurable validator. The organizers also rule out late
  manual/USB submissions, so a valid web submission before each deadline is
  operationally essential.
- Final battles still contain four teams at a time. The final Zombie set is
  one or two new, deliberately understandable Zombies, configured at speed
  `2`. The organizers stress that the Zombies are powerful, should be decoded
  in roughly half an hour, and are intended to be captured and turned into
  attackers. A prebuilt survivor that ignores the supplied Zombies is said to
  be at a severe disadvantage.
- `INT 87h` remains a central offensive threat. The briefing strongly warns
  against submitting recognizable unprotected byte sequences and recommends
  the previously taught duplication/decoy defenses. This is tactical advice,
  not a new interrupt semantic.
- Version 6 corrected a long-standing emulator bug in `DIV`; code that relied
  on the old behavior must be retested against the final engine. The organizers
  explicitly advise against introducing an instruction for the first time at
  the event without validating its actual 8086/v6 behavior.
- Senior finalists additionally receive a separate Zombie-fractal task before
  the event. Partial solutions receive partial credit, and the result is added
  to ranking scores for all senior finalists. The speakers discuss possible
  weights and code-length tie breaking only provisionally, so no exact number
  is treated as a settled rule from this recording.
- The screen contains no technical demonstration that contradicts the audio:
  it only verifies the `CodeGuru Xtreme 2025 FINAL` group context. Accordingly,
  the spoken `256`-byte/no-signature/speed-2 rules are final-event conditions,
  while the earlier `512`-byte/signature rules remain conditions of the online
  qualification stage.

## Reconciled pass: item 4 (position-aware loop survivor)

- The debugger and audio agree that the engine initializes `AX` to the
  warrior's randomized arena offset. This is an engine contract, not a general
  8086 property.
- The example copies `AX` to an index register, adds a label offset marking the
  end of its own setup/code, and begins its write loop there. A label's numeric
  value is the assembled byte offset from the start, not an instruction and not
  a reserved word.
- Starting at `load_offset + end_label` reduces immediate self-damage compared
  with starting from an unrelated constant. It does not make the warrior immune
  to itself: the 64-KiB arena wraps, so a long-running forward writer eventually
  reaches its own bytes from behind.
- The visible Competition comparison shows the position-aware version beating
  the deliberately simple victim in that teaching setup. It is not evidence of
  strength against the tournament field and will not be recorded as such.
- The engine source independently confirms the initial `AX` load offset and
  16-bit wrapping behavior.

## Audio pass: item 28 (submission engine, part B)

- Signature requirement stated in this recording: in the senior category,
  every 39th compiled byte (`39, 78, ...`, counting the first byte as 1) must
  be `90h` (`NOP`). In the junior category only compiled byte 50 must be
  `NOP`. This must still be checked visually against the displayed rules and
  final-rule videos before being treated as the definitive category rule.
- An explicitly inserted signature byte cannot split a multi-byte instruction
  without corrupting its decoding. Padding must therefore be inserted before
  the instruction so `NOP` itself lands at the required byte. (Item 24
  separately confirms that an incidental existing `90h` inside an immediate
  or displacement still satisfies the byte-oriented server validator.)
  If execution reaches that `NOP`, it consumes an instruction turn; therefore
  padding should be kept out of hot loops when possible. All relative jumps
  must be retested after padding.
- `INT 87h` is described as scanning for an exact four-byte pattern and
  replacing the first match found in its search direction. Common opcode
  sequences (`STOSW`, `MOVSW`, far-call-related sequences, or public code
  signatures) are therefore vulnerable.
- The demonstrated defense places copies/decoys of relevant code bytes before
  and after the live implementation, with an initial jump over the front
  decoy. Forward and backward smart-bomb searches then hit a decoy first. The
  decoy must not reuse duplicate labels, and copying bytes has a size cost.
- After an online run, competitors can inspect published code and target its
  signatures. This makes generic and code-specific decoys distinct defensive
  concerns.
- Submission constraints shown: two survivors are required and each compiled
  survivor is at most 512 bytes. The web form accepts both source and binary;
  malformed signatures are rejected.
- The supplied zombie archive is the exact practice opponent set for that
  stage. Capturing a zombie is described as gaining another executing “soldier”
  that can attack on the team's behalf, not merely neutralizing it.

The remaining submission-UI walkthrough is administratively useful but does
not change execution semantics. The full visual pass will verify the displayed
byte positions, exact decoy layout, and category wording.

### Partial visual pass for item 28

- The recording opens on the exact compact historical `bimp` body already
  captured from item 15: `PUSH DS; POP ES; MOV DI,AX; ADD DI,0Ch; MOV SI,DI;`
  `ADD SI,0Ah; STD; DEC DI; DEC DI; MOVSW` ×6; `INC DI; INC DI; JMP DI`.
  It is run among `shooterA/B/C` to inspect propagation rather than presented
  as a new 2025 engine rule.
- Around `05:00` the source is temporarily reduced to a small writer:
  `PUSH DS; POP ES; MOV DI,AX; MOV AX,CCCCh; again: STOSW;`
  `ADD WORD DI,0Bh; JMP again`. The resulting separated colored bands and
  debugger bytes are inspected. Later edits visibly alter jump bytes and can
  leave execution in `CCh` filler; the audio must determine which changes are
  demonstrations of signature insertion or accidental breakage.
- At `14:45` the official `CodeGuru Xtreme 2025` challenge page is fully
  readable. It requires two survivors, maximum `512` bytes each, and compiled
  bytes at positions `39, 78, ...` (one-based) to equal `90h`/`NOP`. This is
  direct visual confirmation of the senior rule stated in the audio, not an
  inference from the sample source.

- `17:50–19:00`: the same official page and both source/binary upload slots
  remain on screen. At `19:15` the presenter uses the simulator's
  `Load Zombies Zip` command with the archive linked by the challenge, directly
  confirming that these are the supplied opponents for this stage.
- `19:30–22:20`: the source panes inspect `zom20b` and `zom20a`. The former
  begins with a long jump over largely raw/obfuscated bytes; the latter shows a
  repeated arithmetic/store structure (`ADD WORD BX,10E1h; MUL WORD BX;`
  `MOV [1243h],DX; INC CX; XCHG BX,AX`) interleaved with raw two-byte branches.
  These are target-specific examples, not generic Zombie layouts. Three
  `NOP`s are inserted before a multi-byte instruction to move the following
  instruction intact and make compiled byte 39 itself a `NOP`.
- The audio explicitly matches the screen: a `NOP` may not be inserted inside
  a multi-byte instruction; padding must precede it, and every executed `NOP`
  still costs a turn. The recommended layout keeps signature padding outside
  a frequently repeated hot loop. The supplied Zombie zip is to be loaded as
  a zip rather than copied as displayed disassembly, and captured Zombies act
  as additional scheduled attackers for the team.
- `23:40–25:24` is Zoom gallery only. No further technical visual content is
  present, so the full visual and full-resolution passes are complete.

## Audio pass: item 25 (submission walkthrough)

- This short recording is almost entirely the official submission workflow.
  A team must submit two survivors, either two different cooperating designs
  or the same source twice. Only the group's owner/founder can submit, and the
  last successful submission before the deadline is the one retained.
- Each slot receives both the `.asm` source and the simulator-produced binary;
  a plain `.txt` source is rejected. The presenter recommends submitting an
  available version early and replacing it later so a last-minute technical
  failure does not leave the team without an entry.
- The spoken signature recap agrees with item 28: junior programs need `90h`
  at compiled byte 50, while senior programs need `90h` at every 39th compiled
  byte. The size limits stated here are junior `128` bytes and senior `512`
  bytes. A failed live validation example is explicitly acknowledged as a site
  problem to investigate, so its accidental acceptance is not evidence that
  signatures are optional.
- For a participant who cannot yet handle Zombies, the staff suggests
  submitting any otherwise valid survivor with the required signature bytes;
  this is fallback advice, not a change to Zombie behavior. No new opcode,
  interrupt, memory-layout, scheduling, or scoring rule is introduced.

The completed screen pass verifies the spoken walkthrough:

- `02:35–04:20` shows the actual challenge page and group-owner view. The page
  labels the event `CodeGuru Xtreme 2025`, exposes the Zombie download, and
  states two survivor programs, maximum `512` bytes each, with compiled bytes
  `39, 78, ...` counted from one required to be `90h` (`NOP`).
- The upload form has separate assembly-source and binary-file fields for
  Survivor 1 and Survivor 2. After upload it exposes download links for both
  stored artifacts, matching the advice to verify what the server retained.
- `03:30–06:10` repeatedly switches between the simulator, file chooser and
  official form while demonstrating correct and incorrect file selection. No
  battle or score is run, so the visible validation behavior is treated only
  as submission-site evidence.
- `06:25–09:35` revisits the same rules and then the official competition home
  page. Administrative dates visible in this archived rehearsal do not alter
  the task's stipulated 2025 ruleset interpretation.

Audio, the continuous timeline, and all form/rule views have now been checked
at the source `1920×1080` resolution; item 25 is fully reconciled.

## Visual pass: item 27 (desktop competition engine, part A)

- After a short gallery/opening, the presenter opens the official release page
  for `CoreWars8086 v5.0.1`, downloads the Windows archive, extracts it, and
  installs/launches the required Java runtime. These are environment setup
  steps, not virtual-machine semantics.
- By roughly `07:10` the desktop `CodeGuru Xtreme - Competition Viewer` is
  running. It is distinct from the browser debugger used for source editing.
  The first run loads multiple historical `shooter*` and `bimp*` entries and
  displays both the arena and a separate event-animation window.
- Around `10:15–10:40` the event window renders large team-colored names and
  survivor numbers (`1`, `2`) as processes interact. At `11:05–11:40` the
  presenter opens a spreadsheet of run results, then returns to the viewer and
  debugger for more executions. These visuals show the batch competition
  workflow but do not yet establish the scoring columns without audio.
- `12:00–13:40` repeats the competition at high speed while console output,
  the event window, arena bands and a small control/options dialog are visible.
  Exact run counts and option values require source-resolution frames and the
  pending audio pass; the scan continues beyond this point.
- A source-resolution desktop frame at `14:50` exposes the batch settings:
  `Survivor groups per war: 4`, `Wars per groups combination: 100`, and seed
  `3184563`. The session viewer is at round `3000` and its log records several
  deaths “due to CPU exception.” These are settings of this demonstration, not
  yet assumed to be immutable final-tournament constants.
- `20:55–21:20`: the browser simulator's own Competition dialog is run for
  exactly `100` battles. It reports separate columns for survivor `1` and `2`
  plus `Total`; the completed teaching run shows `bimp 1 (0+1)`,
  `shooterA 49 (27+22)`, `shooterB 21 (21+0)`, and
  `shooterC 18 (18+0)`. This is a measured example from the lesson, not a
  cross-opponent strength benchmark and not evidence that these historical
  scores generalize.
- `24:50–27:20`: the desktop viewer is relaunched several times and survivors
  are reloaded; the browser debugger is used alongside it to inspect the same
  programs. This confirms the intended workflow of quick inspection in the
  browser and repeatable batch execution in the Java viewer.
- `28:00–28:40`: the browser Options dialog exposes presentation/debug aids:
  memory-panel width, arena auto-scroll, register pointers to draw (including
  `CS:IP`), alternating opcode colors, and “Continue Forever (no max-round,
  only in debugger).” The last control is explicitly debugger-only and must
  not be mistaken for competition round behavior.
- `31:55–34:20` follows the `CGX10 Debugger` release instructions and installs
  the debugger files into the engine directory. `35:00–39:40` then runs the
  desktop viewer successfully, showing arena, event and score/control panes as
  the battle evolves. The last seconds return to browser/gallery; no additional
  opcode, memory, scoring or scheduling rule appears.

The full five-second timeline and source-resolution demonstrations are now
reviewed.

### Audio/screen reconciliation for item 27

- The local Java engine is the organizer's actual scoring engine; the browser
  engine is recommended for editing and interactive debugging because it is
  easier to use, but the submitted binary must be tested in both. The speaker
  explicitly warns that a browser-only success can still fail to score if it
  does not run in the local engine.
- This early session downloads v5.0.1 and calls it the current competition
  package. That is correct for the package shown at the time, but the later
  official 2025 release evidence in item 29 identifies v6.0.0 as the engine
  used for CGX 2025. v6.0.0 therefore controls final score semantics where it
  differs, especially the exclusion of Zombies from scores.
- The preset launched by `cgx.bat` uses Zombie speed `2`: each ordinary Zombie
  executes two opcodes per round for each normal Survivor's mandatory opcode.
  This agrees with the v5.0.1/v6 bundle preset and source default. It remains a
  runner parameter rather than an architectural property of an arbitrary
  engine invocation; the benchmark must record it.
- The speaker states that official battles use four survivor groups at a time,
  normally eight Survivor processes. The UI can change that value for local
  experiments, but a two-team or five-team run is not representative unless
  deliberately labeled as such.
- `Wars per groups combination = 100` is the local/default example. The lesson
  calls 100 a sound testing count and explains why repeats reduce placement
  luck; it does not disclose an immutable official total for every stage.
  Pressing Start again in the same open runner adds another batch to the
  accumulated scores rather than replacing the preceding batch.
- With an already fixed set of four teams, identical binaries, settings and
  seed reproduce the same within-war randomness. The v6 source adds a crucial
  limitation not mentioned in the lesson: when the pool contains more than
  four teams, `CompetitionIterator` selects the group through a separate,
  unseeded RNG. The displayed seed alone cannot then reproduce opponent
  selection. Strength evaluation must record explicit four-team cohorts and
  many war seeds rather than tune against one placement.
- The presenters describe repeated coverage of every possible combination,
  but v6 actually uses `C(n,4)*repetitions` only as the number of draws and
  samples a fresh four-team permutation each time, with replacement. Our
  benchmark harness must explicitly enumerate cohorts to guarantee coverage;
  raw Competition output is still useful for quick randomized screening.
- `scores.csv` persists both group totals and each member's separate score.
  The visible example is a teaching run over the bundled `bimp/shooter`
  programs; its values are not promoted to a historical ranking or a benchmark
  result.
- Local loading follows filenames. Two files with the same stem and suffixes
  `1` and `2` form one team; a single unsuffixed binary can be loaded as a
  one-Survivor group for testing. Compiled binaries can be downloaded from the
  browser editor and placed in the desktop runner's `survivors` directory;
  Zombies analogously go in `zombies`.
- The final spoken signature distinction is category-specific: the young
  category requires a `NOP` at compiled byte 50, while the senior category
  requires a `NOP` at every compiled byte `39, 78, ...`. The clip ends just as
  that explanation begins, so item 28 supplies the complete padding and
  validator demonstration. The server validates compiled bytes, not source
  lines or Zombies supplied by the organizers.
- The optional desktop debugger exposes disassembly, the CPU state, flags,
  segments/registers, remaining `INT 86h`/`INT 87h` charges, selectable memory
  addresses, pause/resume, and speed. Several installation/library problems
  occur during the demonstration; these are tooling issues, not CPU behavior.
- The discussion of the preliminary challenge says it supplies a relatively
  small part of the competition score and is primarily preparation. No exact
  weight is stated here, so the motivational comments are not converted into
  a numeric scoring rule.

Audio, the complete timeline, and the source-resolution runner/debugger views
are now reconciled for item 27.

## Visual pass: item 7 (continued `STOSW`)

- `00:20–03:05`: resumes with the earlier `STOSW` attacker and `helen` loop,
  stepping until the growing writer reaches and changes the other program.
- `03:25–08:40`: the word in `AX` and the generated instruction pair are
  changed repeatedly. The debugger highlights how a stored two-byte word is
  decoded as instructions when `IP` reaches it; one variant rapidly fills a
  large arena region.
- `09:00–14:25`: a second `STOSW` variant is built and compared. The displayed
  warnings show that oversized immediate data can overflow/truncate, so values
  visible in the source must be read from the compiled bytes rather than from a
  mistyped literal.
- `13:10–16:30`: another compact instruction pair expands until most of the
  arena is covered; Competition mode compares the teaching variants.
- `17:55–21:40`: the setup is rebuilt with a different `AX` word. The colored
  code path shows `IP` following the generated pattern while `DI` continues to
  lead the write front.
- `22:05–22:55`: the presenter begins transitioning from `STOSW` to opcode
  `50h`/`PUSH AX`, leading into item 8.

Full-resolution frames resolve the byte-order question from the compiled bytes
and live register state:

- In the first self-generating variant, the debugger shows `AX=90ABh` and the
  generated bytes are `AB 90`. Because the word is stored little-endian, the
  executing stream is `STOSW; NOP`; `DI` advances by two while `IP` follows the
  newly produced two-byte cells.
- In the denser variant, the debugger/source show `AX=ABABh`. Every generated
  byte is therefore opcode `ABh`, so both bytes decode as `STOSW`. Once seeded,
  this gives two forward word stores per generated word rather than alternating
  a store with a `NOP`.
- A mistyped oversized literal visible during the lesson is not used as
  evidence: the assembler warning, compiled bytes, and runtime `AX` value are
  the authoritative observations.

The full audio pass explains the intended comparison and agrees with the
compiled-byte evidence:

- The presenter first removes the explicit loop and lets execution fall into
  the bytes just written by `STOSW`.  With an arbitrary word the process gains
  at most a stray instruction and then reaches untouched `CCh`; choosing the
  stored word as valid opcodes turns the write front into executable code.
- For `AX=90ABh`, little endian storage produces `AB 90`: one `STOSW` writes
  the next two-byte cell and advances `DI` by two, then one `NOP` advances
  `IP` without extending the cell.  Over the two-instruction cycle the writer
  and instruction front advance together, so the live path remains only about
  two or three bytes beyond the current `IP`.
- For `AX=ABABh`, every executed byte is `STOSW`.  Each one advances `IP` by
  one byte but pushes the write frontier two bytes forward, so the generated
  executable trail grows progressively longer.  It attacks on every turn but
  exposes an ever-larger future path that an opponent can corrupt before
  execution reaches it.
- The lesson's key tradeoff is therefore not simply “two stores are always
  faster”: `ABAB` has higher write throughput, while `AB90` deliberately
  spends alternate turns on `NOP` to keep its vulnerable executable frontier
  short.  A Competition demonstration over hundreds of teaching battles has
  the shorter-front variant ahead of the particular examples loaded there;
  that is evidence for the mechanism, not a tournament-wide strength score.
- The presenter again stresses aggregate results over many battles and random
  placements rather than one lucky session.  In the final minute he proposes
  replacing the idle `90h` with byte `50h` (`PUSH AX`), which is the transition
  into item 8 and the later `AB50` construction, not an additional completed
  experiment in this clip.

Audio, the continuous screen timeline, and the source-resolution debugger
states are now reconciled for item 7.
