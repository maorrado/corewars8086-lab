// Run A2Trace over staged job dirs of an agent2 bench result. usage: node trace-runs.mjs <result.json> <arm> <outdir>
import fs from "node:fs"; import path from "node:path"; import { spawn } from "node:child_process";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const [resPath, arm, outDir] = process.argv.slice(2);
const res = JSON.parse(fs.readFileSync(resPath, "utf8"));
const java = path.join(root, "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const cp = `${path.join(root, "agent2/tools/java/classes")};${path.join(root, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar")}`;
fs.mkdirSync(outDir, { recursive: true });
const runRoot = path.join(root, `agent2/runs/${res.planId}-${res.engine}`);
const jobs = res.runs.filter(r => r.arm === arm).map(r => {
  const id = `${r.arm}__${r.cohort}__${r.seed}`.replace(/[^A-Za-z0-9_-]/g, "_");
  const d = path.join(runRoot, id);
  const n = fs.readdirSync(path.join(d, "survivors")).length;
  const groups = new Set(fs.readdirSync(path.join(d, "survivors")).map(f => f.replace(/[12]$/, ""))).size;
  return { id, args: ["-cp", cp, "A2Trace", path.join(outDir, `${r.cohort}.jsonl`), "--headless", "--parallel=false", "--threads", "1",
    "--comboSize", String(groups), "--battlesPerCombo", String(r.battles), "--seed", r.seed,
    "--warriorsDir", path.join(d, "survivors"), "--zombiesDir", path.join(d, "zombies"), "--outputFile", path.join(outDir, `${r.cohort}.scores.csv`)] };
});
let active = 0; const q = [...jobs];
await new Promise((res2) => { const next = () => { if (!q.length && !active) return res2(); while (active < 8 && q.length) { const j = q.shift(); active++; const p = spawn(java, j.args, { stdio: "inherit" }); p.on("exit", (c) => { active--; if (c) console.error("fail", j.id, c); next(); }); } }; next(); });
// verify identical scores to bench run
let same = 0;
for (const r of res.runs.filter(r => r.arm === arm)) {
  const id = `${r.arm}__${r.cohort}__${r.seed}`.replace(/[^A-Za-z0-9_-]/g, "_");
  const a = fs.readFileSync(path.join(runRoot, id, "scores.csv"), "utf8"), b = fs.readFileSync(path.join(outDir, `${r.cohort}.scores.csv`), "utf8");
  if (a === b) same++;
}
console.log(`traced ${jobs.length} jobs; scores identical to bench: ${same}/${jobs.length}`);
