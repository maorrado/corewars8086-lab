export const meta = {
  name: 'arena-100',
  description: 'Fan out ~105 candidates across 15 directions to beat m049/m050 on the CoreWars screen, fast-filter, then full-screen the survivors',
  phases: [
    { title: 'Design and fast-filter' },
    { title: 'Full-screen verification' },
  ],
}

const DIRECTIONS = [
  { key: 'redundant-hunt', desc: 'Refine v9 itself: search for MORE genuinely-dead instructions or micro-timing savings in the existing champion-lineage bootstrap, beyond what was already found tonight (m050\'s one fix, one more that netted zero). Be rigorous about verifying deadness via register-write-then-read tracing before removing anything. Start from candidates/generated/arena-2026-09-29/synthesis/SynthA-v9.asm and SynthB-v9.asm as your base if you take this direction.' },
  { key: 'toggle-schedule', desc: 'Explore a DIFFERENT stride-toggle ratio or toggle SCHEDULE than what was tested tonight (e.g. not a strict 50/50 alternation every generation, but an asymmetric schedule -- mostly primary stride, occasionally alt -- if you can find a safe way to encode this without a persistent register, per bug class 1 in the grounding doc).' },
  { key: 'no-far-call-anchor', desc: 'A completely different replication anchor mechanism that does not use call far [bx] at all (e.g. a register-indirect near jump, or something else entirely) -- architecturally eliminating the single-point-of-failure the FF1F anchor represents, while still being fast and simple.' },
  { key: 'self-healing-anchor', desc: 'A self-healing/verify-before-jump anchor: use SCASW or a similar implicit-segment verify step before trusting the anchor, to recover from corruption -- but be very careful about the added per-cycle cost (previously measured at a real, nontrivial screen-score cost when tried) and try to make the check cheaper or less frequent than the prior attempt.' },
  { key: 'active-b-defense', desc: 'A design that gives B (the second, usually-smaller warrior) genuinely equal active defense/survival investment as A, directly exploiting the per-individual-warrior scoring fact -- not a bigger B necessarily, but B actively defending its own position rather than being a bootstrap-then-idle helper.' },
  { key: 'int86-bomb', desc: 'A design using INT86h (the blind 256-byte-write heavy bomb) as a primary or secondary offensive mechanism, timed/positioned using everything learned about MIN_GAP=1024 and load-order randomization.' },
  { key: 'minimal-replicator', desc: 'A pure, minimal, from-scratch fast replicator with almost no combat logic at all -- betting that raw replication speed and survival (not offense) wins on the scoring formula, informed by how the engine actually computes survivors.' },
  { key: 'novel-int87-use', desc: 'A design that uses INT87h in a genuinely NEW way not yet tried -- explicitly NOT the hijack-real-opponent-anchor idea documented as regressing twice tonight in the grounding doc (bug class 4) -- but something else entirely (e.g. self-repair on a DIFFERENT pattern, or multiple distinct INT87h calls for different purposes).' },
  { key: 'zombie-recruitment', desc: 'A zombie-recruitment-focused design: actively try to get captured warriors under your control (using the mechanics already established for zombie_entry:/captured_init:) as a primary strategy, not just incidental to replication.' },
  { key: 'multi-anchor', desc: 'A design that deliberately spreads multiple anchor copies across the arena (not just one anchor position) to increase resilience against any single corruption event, informed by the byte-length-coupling and filler-safety lessons in the grounding doc.' },
  { key: 'from-scratch', desc: 'A completely from-scratch design NOT derived from or inspired by the champion lineage at all -- if you believe an entirely different competitive strategy (e.g. one that prioritizes early offense over replication, or an unusual defensive posture) could beat 0.6723 on the general field, build it from first principles.' },
  { key: 'turn-order-robust', desc: 'A design focused on performing well regardless of the randomized load-order and turn-order mechanics -- something robust to either going first or later in turn order relative to opponents each battle (since this cannot be controlled), rather than implicitly assuming a favorable ordering.' },
  { key: 'landmine-avoidance', desc: 'A design that treats avoiding every documented engine landmine (execute-blind-spot, 16-bit-boundary writes, flag-inconsistency traps) as a first-class design constraint from the start, seeing if maximal carefulness yields a robustness edge other designs might accidentally lose from.' },
  { key: 'energy-aware', desc: 'An energy/NRG-aware design that deliberately manages the virtual speed-bonus roll (the per-round extra-opcode mechanic) to its own advantage, if a safe way to interact with it can be found.' },
  { key: 'arena-position-tuning', desc: 'A design exploring different %define PTR_CELL / arena-position constants than the champion lineage uses, informed by the MIN_GAP=1024 and load-randomization facts, to see if a different default arena position is systematically more favorable against the real 2025 field.' },
]

const AGENTS_PER_DIRECTION = 7

const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    candidateId: { type: 'string' },
    direction: { type: 'string' },
    crashed: { type: 'boolean' },
    builtSuccessfully: { type: 'boolean' },
    fastScreenScore: { type: 'number', description: 'aggregate.teamPerBattle from a partial (few-cohort) fast screen test, or -1 if crashed/not measured' },
    byteSizeA: { type: 'number' },
    byteSizeB: { type: 'number' },
    outputDir: { type: 'string', description: 'the candidate output directory path' },
    rationale: { type: 'string', description: 'design rationale and what was tried, under 300 words' },
    problemsEncountered: { type: 'string', description: 'any crashes, bugs, or dead ends hit and how they were resolved or not' },
  },
  required: ['candidateId', 'direction', 'crashed', 'builtSuccessfully', 'fastScreenScore', 'outputDir', 'rationale'],
}

function candidatePrompt(candidateId, direction) {
  return `You are candidate ${candidateId} in a large parallel design competition for the CodeGuru Xtreme (corewars8086) game, running in the repository at C:\\Users\\ronyr\\codeguru-work\\corewars8086-lab.

FIRST: read C:\\Users\\ronyr\\codeguru-work\\corewars8086-lab\\candidates\\generated\\arena-100-2026-09-30\\GROUNDING.md IN FULL before writing any code. It contains the exact goal, every verified engine fact, and four distinct bug classes that were found and paid for tonight through real wasted effort -- do not repeat them.

YOUR ASSIGNED DIRECTION: ${direction}

YOUR OUTPUT DIRECTORY (create it, work only inside it to avoid colliding with ~104 other agents working in parallel in this same repo): C:\\Users\\ronyr\\codeguru-work\\corewars8086-lab\\candidates\\generated\\arena-100-2026-09-30\\${candidateId}\\

Your task:
1. Read the grounding doc completely.
2. Design a warrior pair (A and B, .asm files) pursuing your assigned direction. You have real freedom in HOW you pursue it -- the direction is a starting point, not a rigid spec.
3. Assemble via: node assemble.mjs <youroutputdir>/build <youroutputdir>/YourA.asm <youroutputdir>/YourB.asm (run from the repo root). Check the .lst listing for exact byte offsets if your design touches byte-length-coupled code.
4. Crash-check with a SMALL battle count first (50-100 battles, a handful of real opponent cohorts) before trusting any score. A config JSON schema example exists at config-synth-v9-all2025.json in the repo root -- copy its structure (experimentId/outputPath/runDirectory/battles/threads/seeds/candidate/cohorts/zombies) but slice to just 2-3 of its 25 cohorts for a fast check, use your own unique experimentId/outputPath/runDirectory, and point candidate.warriors at your own assembled binaries. Run via: node official-benchmark.mjs <your-smoke-config.json>
5. If crash-free, run a FAST PARTIAL screen (use maybe 6-8 of the 25 cohorts from config-synth-v9-all2025.json, not all 25 -- this keeps your iteration loop fast) to get a directional signal. Iterate on your design if the result is poor and you have a genuine idea for improvement -- don't just report the first thing that compiles.
6. When you have your best result, report back using the required structured fields. Your fastScreenScore should be the aggregate.teamPerBattle from your fast partial-screen run. Be honest -- if your design crashed or scored poorly, report that plainly rather than inflating results. A well-reasoned negative result is more valuable than a fabricated positive one.

Reference numbers for context (these are FULL 2500-battle screen scores, your fast partial screen will have more noise/variance than these, but should be in a comparable ballpark if your design is genuinely strong): m049 = 0.6674, m050 = 0.6723, the current best synthesized design (v9) = 0.6547 (beats m049/m050 in direct combat, close-but-not-quite on the general screen).

Do not modify anything under final/. Do not commit or push. Work only inside your own candidate output directory.`
}

let counter = 0
const tasks = []
for (const dir of DIRECTIONS) {
  for (let i = 0; i < AGENTS_PER_DIRECTION; i++) {
    counter++
    const candidateId = `c${String(counter).padStart(3, '0')}-${dir.key}`
    tasks.push({ candidateId, direction: dir.desc, directionKey: dir.key })
  }
}

log(`Fanning out ${tasks.length} candidates across ${DIRECTIONS.length} directions (${AGENTS_PER_DIRECTION} agents each)`)

phase('Design and fast-filter')
const results = await pipeline(
  tasks,
  (task) => agent(candidatePrompt(task.candidateId, task.direction), {
    label: task.candidateId,
    phase: 'Design and fast-filter',
    schema: RESULT_SCHEMA,
    effort: 'high',
  }).then((r) => ({ ...task, result: r })).catch((e) => ({ ...task, result: null, error: String(e) }))
)

const valid = results.filter((r) => r.result && r.result.builtSuccessfully && !r.result.crashed && r.result.fastScreenScore > 0)
const failed = results.length - valid.length
log(`${valid.length}/${results.length} candidates built and ran crash-free (${failed} failed, crashed, or errored)`)

valid.sort((a, b) => b.result.fastScreenScore - a.result.fastScreenScore)

// Take the strongest candidate per direction, plus overall top performers, for full-screen verification.
const bestPerDirection = new Map()
for (const r of valid) {
  const key = r.directionKey
  if (!bestPerDirection.has(key) || bestPerDirection.get(key).result.fastScreenScore < r.result.fastScreenScore) {
    bestPerDirection.set(key, r)
  }
}
const perDirectionWinners = [...bestPerDirection.values()]
const topOverallIds = new Set(perDirectionWinners.map((r) => r.candidateId))
const additionalTop = valid.filter((r) => !topOverallIds.has(r.candidateId)).slice(0, 10)
const shortlist = [...perDirectionWinners, ...additionalTop]

log(`Shortlist for full-screen verification: ${shortlist.length} candidates (best per direction + top overall runners-up)`)

const FULL_SCREEN_SCHEMA = {
  type: 'object',
  properties: {
    candidateId: { type: 'string' },
    fullScreenScore: { type: 'number', description: 'aggregate.teamPerBattle from the FULL 2500-battle screen, or -1 if it crashed at this scale' },
    beatsM049: { type: 'boolean' },
    beatsM050: { type: 'boolean' },
    notes: { type: 'string' },
  },
  required: ['candidateId', 'fullScreenScore', 'beatsM049', 'beatsM050'],
}

function fullScreenPrompt(entry) {
  return `Run the FULL 2500-battle official screen test for the warrior pair already built at C:\\Users\\ronyr\\codeguru-work\\corewars8086-lab\\candidates\\generated\\arena-100-2026-09-30\\${entry.candidateId}\\build\\ (or wherever that candidate's own report said its build output is -- their stated output directory was: ${entry.result.outputDir}).

Copy config-synth-v9-all2025.json from the repo root as a template (it has the full 25-cohort/2-seed/50-battle structure, 2500 battles total). Set a unique experimentId/outputPath/runDirectory (something like "arena100-fullscreen-${entry.candidateId}"), and point candidate.warriors at this candidate's two assembled binary files (find them in its build output directory -- check for .asm files there too if you need to re-assemble; the candidate's own report said: byte size A=${entry.result.byteSizeA || 'unknown'}, byte size B=${entry.result.byteSizeB || 'unknown'}).

Run: node official-benchmark.mjs <your-config.json>

Report the aggregate.teamPerBattle value as fullScreenScore. Reference: m049=0.6674000056, m050=0.6722666728 -- set beatsM049/beatsM050 accordingly (strictly greater than). If the binaries don't exist or the candidate's build failed, report fullScreenScore=-1 and explain in notes.`
}

phase('Full-screen verification')
const fullScreenResults = await pipeline(
  shortlist,
  (entry) => agent(fullScreenPrompt(entry), {
    label: `full-${entry.candidateId}`,
    phase: 'Full-screen verification',
    schema: FULL_SCREEN_SCHEMA,
  }).then((r) => ({ ...entry, fullScreen: r })).catch((e) => ({ ...entry, fullScreen: null, error: String(e) }))
)

const verified = fullScreenResults.filter((r) => r.fullScreen && r.fullScreen.fullScreenScore > 0)
verified.sort((a, b) => b.fullScreen.fullScreenScore - a.fullScreen.fullScreenScore)

const beatBoth = verified.filter((r) => r.fullScreen.beatsM049 && r.fullScreen.beatsM050)
log(`${verified.length} candidates verified on full screen. ${beatBoth.length} beat BOTH m049 and m050.`)

return {
  totalCandidates: tasks.length,
  builtCleanCount: valid.length,
  shortlistSize: shortlist.length,
  fullScreenResults: verified.map((r) => ({
    candidateId: r.candidateId,
    direction: r.directionKey,
    fastScreenScore: r.result.fastScreenScore,
    fullScreenScore: r.fullScreen.fullScreenScore,
    beatsM049: r.fullScreen.beatsM049,
    beatsM050: r.fullScreen.beatsM050,
    outputDir: r.result.outputDir,
    rationale: r.result.rationale,
    notes: r.fullScreen.notes,
  })),
  beatBothCount: beatBoth.length,
  allCandidateSummaries: results.map((r) => ({
    candidateId: r.candidateId,
    direction: r.directionKey,
    builtSuccessfully: r.result ? r.result.builtSuccessfully : false,
    crashed: r.result ? r.result.crashed : true,
    fastScreenScore: r.result ? r.result.fastScreenScore : -1,
    error: r.error || null,
  })),
}
