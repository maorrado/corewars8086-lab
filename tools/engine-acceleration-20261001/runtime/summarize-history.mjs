import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only timing evidence from explicitly completed historical suites.
// Never enumerates active confirmation results or launches a subprocess/JVM.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const sources = [
  ...['screen-submitted', 'screen-m049', 'screen-m050', 'fresh-submitted', 'fresh-m049', 'fresh-m050',
    'fresh-bomb-nrg', 'fresh-lea-only', 'fresh-bomb-no-nrg-no-pad', 'fresh-bomb-no-nrg',
    'duel-m049-submitted-first', 'duel-m049-submitted-second', 'duel-m050-submitted-first', 'duel-m050-submitted-second']
    .map(name => `experiments/claude-synthesis-audit-20260930/${name}.json`),
  ...[1, 2, 3].map(orientation => `experiments/claude-synthesis-joint-20260930/orientation-${orientation}.json`),
];
const sum = values => values.reduce((total, value) => total + value, 0);
const round = value => Number(value.toFixed(6));
function quantile(values, proportion) {
  const sorted = [...values].sort((a, b) => a - b);
  const point = proportion * (sorted.length - 1);
  const index = Math.floor(point);
  return sorted[index] + (sorted[Math.min(index + 1, sorted.length - 1)] - sorted[index]) * (point - index);
}
function distribution(values) {
  return { min: round(Math.min(...values)), p10: round(quantile(values, 0.1)), median: round(quantile(values, 0.5)),
    p90: round(quantile(values, 0.9)), max: round(Math.max(...values)), mean: round(sum(values) / values.length) };
}
const allRuns = [];
const summaries = [];
for (const source of sources) {
  const file = path.resolve(root, source);
  const before = fs.statSync(file);
  const bytes = fs.readFileSync(file);
  const after = fs.statSync(file);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error(`file changed while reading ${source}`);
  const result = JSON.parse(bytes);
  const runs = result.runs;
  if (!Array.isArray(runs) || !runs.length || !runs.every(run => Number.isFinite(run.elapsedSeconds) && run.elapsedSeconds > 0)) throw new Error(`invalid completed timing data ${source}`);
  const battles = sum(runs.map(run => run.battles));
  if (battles !== result.aggregate.battles) throw new Error(`incomplete aggregate ${source}`);
  const processSeconds = sum(runs.map(run => run.elapsedSeconds));
  const wallSpan = (Date.parse(runs.at(-1).startedAt) - Date.parse(runs[0].startedAt)) / 1000 + runs.at(-1).elapsedSeconds;
  const gaps = runs.slice(1).map((run, index) => (Date.parse(run.startedAt) - Date.parse(runs[index].startedAt)) / 1000 - runs[index].elapsedSeconds);
  const commands = [...new Set(runs.map(run => {
    const index = run.command.args.indexOf('--threads');
    return `threads=${run.command.args[index + 1]},parallelFalse=${run.command.args.includes('--parallel=false')}`;
  }))];
  const descriptor = { source, resultSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    engineSha256: result.engineJar.sha256, generatedAt: result.generatedAt,
    blocks: runs.length, battles, commands, processElapsedSecondsSum: round(processSeconds),
    suiteWallSpanSeconds: round(wallSpan), interProcessGapSecondsSum: round(sum(gaps)),
    interProcessGapFractionOfSpan: round(sum(gaps) / wallSpan),
    blockProcessSeconds: distribution(runs.map(run => run.elapsedSeconds)),
    interProcessGapSeconds: distribution(gaps),
  };
  summaries.push(descriptor);
  allRuns.push(...runs.map(run => ({ source, battles: run.battles, teams: Object.keys(run.inputs).length, elapsedSeconds: run.elapsedSeconds })));
}
const groups = new Map();
for (const run of allRuns) {
  const key = `${run.battles} battles, ${run.teams} teams`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(run);
}
console.log(JSON.stringify({
  methodology: 'Reads only named completed result JSONs. elapsedSeconds wraps execFileSync and includes process/JVM startup, class loading/JIT, game execution and shutdown. Gaps include parent staging/hashing/JSON writes and scheduling; wall/monotonic clock quantization can produce small negative gaps.',
  limits: 'No startup-only measurement exists in these artifacts. The fastest full-process duration is only an upper bound on startup for that particular block. Different seeds, opposition and concurrent machine loads prevent an unbiased startup regression from these suites. Summed child elapsed time is not calendar duration when suites overlap.',
  files: summaries,
  byBlockShape: [...groups].map(([shape, runs]) => ({ shape, blocks: runs.length, battles: sum(runs.map(run => run.battles)), processSeconds: distribution(runs.map(run => run.elapsedSeconds)) })),
  all: { files: summaries.length, processLaunches: allRuns.length, battles: sum(allRuns.map(run => run.battles)),
    processElapsedSecondsSum: round(sum(allRuns.map(run => run.elapsedSeconds))),
    interProcessGapSecondsSum: round(sum(summaries.map(summary => summary.interProcessGapSecondsSum))) },
  hypotheticalNewConfirmationSavings: [0.1, 0.25, 0.5, 1].map(assumedAvoidableSeconds => ({
    assumedAvoidableSecondsPerLaunch: assumedAvoidableSeconds, avoidedLaunches: 297,
    savedSummedProcessSeconds: 297 * assumedAvoidableSeconds,
    caveat: 'Illustration only: 300 blocks replaced by three persistent lane JVMs; not measured startup or calendar savings.',
  })),
}, null, 2));
