# Original-engine writer attribution (retry, authoring only)

This isolated retry preserves the earlier diagnostic/ failure unchanged. The
only Java change corrects the option guard to the actual default totalBattles=0
and explicitly requires zombieSpeed=2. No game or observation behavior changes.

Root must read and review every source here before compiling or executing.
Nothing in this directory has been compiled or replayed by the author.

The fixture is the first archived synthesis-first vs m050 duel seed in protocol
order, all 125 battles, not a selected losing battle. Its exact eight copied
binaries, original JAR, runtime, compiler, configuration, result metadata and
116-byte score CSV are pinned in frozen-inputs.json. Existing survivor and
Zombie directories are read in place; their membership and file hashes are
checked, and their files are not copied, sorted on disk, renamed or changed.
This preserves the original directory enumeration and full RNG sequence.

After root review:

1. Run node on diagnostic/prepare-replay.mjs. It compiles the observer against
   the original JAR only, into a new classes/ directory, hashes all source/class
   files, and writes prepared-plan.json. It does not execute a battle. Repeated
   preparation refuses existing output directories.
2. Root inspects the prepared plan.
3. Run node on diagnostic/run-replay.mjs. It runs the original engine, preserves
   game parameters, emits JSONL in new replay/, and requires exactly 125 completed
   wars, 1,000 birth events, consistent writer/anchor references, unchanged inputs
   and byte-identical original score CSV. Created artifacts remain on failure.

## Observations and limits

- Public memory-listener registration preserves existing listeners. Original
  engine classes are loaded from the pinned JAR; no overlays are accepted.
- No game memory/register write, opcode execution, RNG call, turn insertion,
  memory-access bypass for a warrior, or scoring change is performed.
  Physical core reads are observations, not actions available to a warrior.
- Memory events during loading are ignored. At the first round boundary after
  all eight births, the observer initializes a last-change cache for only 128
  physical bytes: the two bytes of the 64 original FF 1F anchors. Every write
  to these bytes refreshes the cache, regardless of segment alias. Changed
  bytes are emitted only for currently active watched m050 anchors; activation
  and death snapshots include earlier cached writers. Unchanged writes do not
  replace the last change cause. This is diagnostic cache state, never engine
  execution state. If an anchor leaves the known lattice, the JSON explicitly
  reports it and does not claim complete writer history there.
- All writes to hook bytes 1000:5D13/5D14 are emitted. Each event is
  post-byte-write: the two-byte word can be partially updated. Do not interpret
  a single low-byte event as an atomic completed hook assignment.
- Writer identity comes from War.getCurrentWarrior() during the write.
  Recorded IP is the CPU's actual post-fetch/current IP, not an instruction
  start. The adjacent byte window helps interpretation but is not a decoded
  execution trace. Within-opcode register state can be partially updated.
- Private pointer updates are observed after their high-byte writes; a fresh
  read at every round boundary also detects changes. No cached opponent code
  affects any instruction execution.
- The engine lacks a per-opcode callback. A capture event means the first
  observed round-boundary Zombie CS:IP in one of the frozen A capture-prefix
  ranges, with current prefix bytes, hook history and prior observed position.
  It is not an exact jump timestamp, and a missed short-lived entry is not
  evidence of no capture. It identifies the program address, not a transfer
  of team ownership; Zombies never score.
- This original fixture did not request telemetry. The acceptance gate checks
  exact raw scores, ordered battle seeds and diagnostic consistency; it must
  not claim byte-identical original telemetry that does not exist.
- A PASS does not make this one protocol representative of all opponents, does
  not establish competitive improvement, and does not demonstrate immunity.
