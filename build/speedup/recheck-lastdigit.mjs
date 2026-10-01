// For every run where the fast result differs textually from the OFFICIAL result (which was
// produced by the original engine in its default parallel mode), re-run the ORIGINAL engine in
// strict sequential mode (--parallel=false) on the same inputs and byte-compare with the fast file.
// Usage: node build/speedup/recheck-lastdigit.mjs official.json fast.json [concurrency]
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const JAVA = path.join(ROOT, "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const ORIGINAL_JAR = path.join(ROOT, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const [officialPath, fastPath, concurrencyText] = process.argv.slice(2);
const official = JSON.parse(fs.readFileSync(officialPath, "utf8"));
const fast = JSON.parse(fs.readFileSync(fastPath, "utf8"));
const key = (r) => `${r.cohortId}|${r.seed}`;
const fastRuns = new Map(fast.runs.map((r) => [key(r), r]));
const todo = official.runs.filter((r) => r.rawScoreText !== fastRuns.get(key(r)).rawScoreText).map((r) => fastRuns.get(key(r)));
console.log(`${todo.length} runs differ textually from the official file; re-running them with the original engine, --parallel=false`);
let identical = 0, differ = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const r = queue.shift();
    const args = r.command.jobArgs.slice();
    const out = path.join(path.dirname(args[args.length - 1]), "recheck-original-seq.csv");
    args[args.length - 1] = out;
    await run(JAVA, ["-jar", ORIGINAL_JAR, ...args, "--parallel=false"], { maxBuffer: 64 * 1024 * 1024 });
    const same = fs.readFileSync(out, "utf8") === r.rawScoreText;
    fs.unlinkSync(out);
    if (same) identical++; else { differ++; console.log(`DIFF ${key(r)}`); }
  }
}
await Promise.all(Array.from({ length: Number(concurrencyText ?? 4) }, worker));
console.log(`original engine (sequential) vs fast: ${identical} identical, ${differ} different`);
process.exit(differ === 0 ? 0 : 1);
