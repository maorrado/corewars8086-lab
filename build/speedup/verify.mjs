// Correctness harness for engine speedups.
// Usage:
//   node build/speedup/verify.mjs reference            -> (re)generate reference outputs with the ORIGINAL engine, sequential mode
//   node build/speedup/verify.mjs check <jar> [args..] -> run <jar> with extra engine args on every case, byte-compare to reference
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const JAVA = path.join(ROOT, "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
// Batch mode only: JAVA_BIN overrides the java binary, JVM_OPTS adds JVM flags (space-separated).
const BATCH_JAVA = process.env.JAVA_BIN || JAVA;
const JVM_OPTS = (process.env.JVM_OPTS || "").split(" ").filter(Boolean);
const ORIGINAL_JAR = path.join(ROOT, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const CASES_DIR = path.join(ROOT, "build/speedup/cases");

// Varied real run directories: 4 different warrior pairs, heavy and light cohorts, several seeds.
const SOURCES = [
  ["bigcheck-m050", "all-v1-07__bigcheck-oct1-001"],
  ["bigcheck-m050", "all-v1-01__bigcheck-oct1-005"],
  ["bigcheck-m050", "all-v1-15__bigcheck-oct1-009"],
  ["bigcheck-m049", "all-v1-10__bigcheck-oct1-002"],
  ["bigcheck-m049", "all-v1-22__bigcheck-oct1-007"],
  ["bigcheck-c090alone", "all-v1-13__bigcheck-oct1-003"],
  ["bigcheck-c090alone", "all-v1-08__bigcheck-oct1-010"],
  ["bigcheck-synthesis", "all-v1-03__bigcheck-oct1-004"],
  ["bigcheck-synthesis", "all-v1-18__bigcheck-oct1-006"],
  ["bigcheck-synthesis", "all-v1-25__bigcheck-oct1-008"],
];

function setupCases() {
  const cases = [];
  for (const [exp, run] of SOURCES) {
    const src = path.join(ROOT, "build/official-runs", exp, run);
    const seed = JSON.parse(fs.readFileSync(path.join(src, "run.json"), "utf8")).seed;
    const dst = path.join(CASES_DIR, `${exp}__${run}`);
    if (!fs.existsSync(dst)) {
      fs.mkdirSync(dst, { recursive: true });
      fs.cpSync(path.join(src, "survivors"), path.join(dst, "survivors"), { recursive: true });
      fs.cpSync(path.join(src, "zombies"), path.join(dst, "zombies"), { recursive: true });
    }
    cases.push({ name: `${exp}__${run}`, dir: dst, seed });
  }
  return cases;
}

function runEngine(jar, c, outFile, extraArgs) {
  const args = ["-jar", jar, "--headless", "--comboSize", "4", "--battlesPerCombo", "50", "--seed", c.seed,
    "--warriorsDir", path.join(c.dir, "survivors"), "--zombiesDir", path.join(c.dir, "zombies"), "--outputFile", outFile, ...extraArgs];
  const t0 = process.hrtime.bigint();
  execFileSync(JAVA, args, { stdio: "ignore" });
  return Number(process.hrtime.bigint() - t0) / 1e9;
}

const mode = process.argv[2];
const cases = setupCases();
if (mode === "reference") {
  for (const c of cases) {
    const s = runEngine(ORIGINAL_JAR, c, path.join(c.dir, "reference.csv"), ["--parallel=false"]);
    console.log(`reference ${c.name} (${s.toFixed(2)}s)`);
  }
} else if (mode === "check") {
  const jar = path.resolve(process.argv[3]);
  const extra = process.argv.slice(4);
  let failures = 0, total = 0;
  for (const c of cases) {
    const out = path.join(c.dir, "check.csv");
    const s = runEngine(jar, c, out, extra);
    total += s;
    const same = fs.readFileSync(out).equals(fs.readFileSync(path.join(c.dir, "reference.csv")));
    if (!same) failures++;
    console.log(`${same ? "OK  " : "DIFF"} ${c.name} (${s.toFixed(2)}s)`);
  }
  console.log(`${failures === 0 ? "ALL IDENTICAL" : failures + " MISMATCHES"} across ${cases.length} cases, total ${total.toFixed(1)}s, args: ${extra.join(" ") || "(none)"}`);
  process.exit(failures === 0 ? 0 : 1);
} else if (mode === "batch") {
  // All cases as jobs of ONE BatchRunner JVM; each job's file is byte-compared to the reference.
  // Usage: verify.mjs batch <jar> <threads> [repeat]  (repeat>1 queues every case several times)
  const jar = path.resolve(process.argv[3]);
  const threads = process.argv[4] ?? "8";
  const repeat = Number(process.argv[5] ?? "1");
  const lines = [];
  const outs = [];
  for (let r = 0; r < repeat; r++) {
    for (const c of cases) {
      const out = path.join(c.dir, `batch-${r}.csv`);
      if (fs.existsSync(out)) fs.unlinkSync(out);
      outs.push([c, out]);
      lines.push(["--headless", "--comboSize", "4", "--battlesPerCombo", "50", "--seed", c.seed,
        "--warriorsDir", path.join(c.dir, "survivors"), "--zombiesDir", path.join(c.dir, "zombies"), "--outputFile", out].join("\t"));
    }
  }
  const jobsFile = path.join(CASES_DIR, "..", "batch-jobs.tsv");
  fs.writeFileSync(jobsFile, lines.join("\n") + "\n");
  const t0 = process.hrtime.bigint();
  execFileSync(BATCH_JAVA, [...JVM_OPTS, "-cp", jar, "il.co.codeguru.corewars8086.cli.BatchRunner", jobsFile, threads], { stdio: "ignore" });
  const s = Number(process.hrtime.bigint() - t0) / 1e9;
  let failures = 0;
  for (const [c, out] of outs) {
    const same = fs.existsSync(out) && fs.readFileSync(out).equals(fs.readFileSync(path.join(c.dir, "reference.csv")));
    if (!same) { failures++; console.log(`DIFF ${c.name} ${out}`); }
  }
  console.log(`${failures === 0 ? "ALL IDENTICAL" : failures + " MISMATCHES"} across ${outs.length} batch jobs, one JVM, ${threads} threads, total ${s.toFixed(1)}s ${JVM_OPTS.join(" ")}`);
  process.exit(failures === 0 ? 0 : 1);
} else {
  console.log("usage: verify.mjs reference | check <jar> [engine args...] | batch <jar> <threads> [repeat]");
}
