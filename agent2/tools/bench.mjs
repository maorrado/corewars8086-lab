// agent2 benchmark orchestrator.
// usage: node bench.mjs <plan.json> [--threads N] [--engine original|persistent]
//
// Plan schema:
// { id, battles, zombies:[{name,path}], seeds:[str], telemetry:bool,
//   arms:[{id, warriors:[a,b]}],         // every arm is staged under the SAME team name (plan.teamName, default "CAND")
//   cohorts:[{id, opponents:[{name, warriors:[a,b]}]}] }
// Each (arm, cohort, seed) is one job = one serial v6 Competition with comboSize = 1 + opponents.
// Paths in a plan are relative to the repository root.
// Engines: "persistent" = agent2/tools/java/A2Batch over the unmodified deterministic JAR (many jobs per JVM);
//          "original"   = one cold `java -jar <deterministic JAR> --headless --parallel=false` per job.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const args = process.argv.slice(2);
const planPath = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const threads = Number(opt("--threads", "7"));
const engine = opt("--engine", "persistent");
const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
const R = (p) => path.resolve(root, p);
const java = R("tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const jar = R("repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const JAR_SHA = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const shaCache = new Map();
const sha = (f) => { if (!shaCache.has(f)) shaCache.set(f, crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex")); return shaCache.get(f); };
if (sha(jar) !== JAR_SHA) throw new Error("engine JAR hash mismatch");
const safe = (v) => String(v).replace(/[^A-Za-z0-9_-]/g, "_");
const teamName = plan.teamName ?? "CAND";
const runRoot = R(`agent2/runs/${safe(plan.id)}-${engine}`);
const resultPath = R(`agent2/results/${safe(plan.id)}-${engine}.json`);
fs.mkdirSync(path.dirname(resultPath), { recursive: true });

function parseScores(text) {
  const out = { groups: {}, warriors: {} }; let sec = null;
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (l === "Groups:") { sec = "groups"; continue; }
    if (l === "Warriors:") { sec = "warriors"; continue; }
    if (!l || !sec) continue;
    const i = l.lastIndexOf(","); out[sec][l.slice(0, i)] = Number(l.slice(i + 1));
  }
  return out;
}

const jobs = [];
for (const arm of plan.arms) for (const cohort of plan.cohorts) for (const seed of (cohort.seeds ?? plan.seeds)) {
  const id = `${safe(arm.id)}__${safe(cohort.id)}__${safe(seed)}`;
  const dir = path.join(runRoot, id);
  const scores = path.join(dir, "scores.csv");
  const tele = plan.telemetry ? path.join(dir, "telemetry.csv") : "";
  jobs.push({ id, arm, cohort, seed, dir, scores, tele });
}
const todo = jobs.filter((j) => !fs.existsSync(j.scores));
for (const j of todo) {
  fs.rmSync(j.dir, { recursive: true, force: true });
  const sv = path.join(j.dir, "survivors"), zd = path.join(j.dir, "zombies");
  fs.mkdirSync(sv, { recursive: true }); fs.mkdirSync(zd, { recursive: true });
  const teams = [{ name: teamName, warriors: j.arm.warriors }, ...j.cohort.opponents];
  const names = new Set();
  for (const t of teams) {
    if (names.has(t.name)) throw new Error(`duplicate team name ${t.name} in ${j.id}`);
    names.add(t.name);
    if (t.warriors.length === 1) {
      if (/[12]$/.test(safe(t.name))) throw new Error(`single-member team name must not end in 1/2: ${t.name}`);
      fs.copyFileSync(R(t.warriors[0]), path.join(sv, safe(t.name)));
    } else if (t.warriors.length === 2) {
      t.warriors.forEach((w, k) => fs.copyFileSync(R(w), path.join(sv, `${safe(t.name)}${k + 1}`)));
    } else throw new Error(`team ${t.name} must have 1 or 2 warriors`);
  }
  for (const z of plan.zombies) fs.copyFileSync(R(z.path), path.join(zd, safe(z.name)));
}
const jobArgs = (j) => ["--headless", "--parallel=false", "--threads", "1",
  "--comboSize", String(1 + j.cohort.opponents.length), "--battlesPerCombo", String(plan.battles),
  "--seed", j.seed, "--warriorsDir", path.join(j.dir, "survivors"), "--zombiesDir", path.join(j.dir, "zombies"),
  "--outputFile", j.scores, ...(j.tele ? ["--telemetryFile", j.tele] : [])];

const t0 = Date.now();
if (todo.length) {
  if (engine === "persistent") {
    const fields = ["CW8086-SERIAL-BATCH-V1", String(todo.length)];
    for (const j of todo) { const a = jobArgs(j); fields.push(j.id, String(a.length), ...a); }
    fields.push("");
    const manifest = path.join(runRoot, `jobs-${Date.now()}.nul`);
    fs.writeFileSync(manifest, fields.join("\u0000"));
    const cp = `${R("agent2/tools/java/classes")};${jar}`;
    const r = spawnSync(java, ["-cp", cp, "A2Batch", manifest, String(threads)], { stdio: ["ignore", "inherit", "inherit"] });
    if (r.status !== 0) throw new Error(`A2Batch exit ${r.status}`);
  } else {
    // one cold JVM per job, `threads` jobs at a time
    const queue = [...todo]; let active = 0;
    const { spawn } = await import("node:child_process");
    await new Promise((resolve, reject) => {
      const next = () => {
        if (!queue.length && !active) return resolve();
        while (active < threads && queue.length) {
          const j = queue.shift(); active++;
          const p = spawn(java, ["-jar", jar, ...jobArgs(j)], { stdio: "ignore" });
          p.on("exit", (code) => { active--; if (code !== 0) return reject(new Error(`${j.id} exit ${code}`)); console.log(`done ${j.id}`); next(); });
        }
      };
      next();
    });
  }
}
const elapsed = (Date.now() - t0) / 1000;

const runs = jobs.map((j) => {
  const text = fs.readFileSync(j.scores, "utf8");
  const s = parseScores(text);
  return {
    arm: j.arm.id, cohort: j.cohort.id, seed: j.seed, battles: plan.battles,
    team: s.groups[safe(teamName)], w1: s.warriors[`${safe(teamName)}1`], w2: s.warriors[`${safe(teamName)}2`],
    opponents: Object.fromEntries(j.cohort.opponents.map((o) => [o.name, s.groups[safe(o.name)]])),
    scoresSha256: crypto.createHash("sha256").update(text).digest("hex"),
    telemetry: j.tele ? path.relative(root, j.tele) : null,
  };
});
const armHashes = Object.fromEntries(plan.arms.map((a) => [a.id, a.warriors.map((w) => ({ path: w, bytes: fs.statSync(R(w)).size, sha256: sha(R(w)) }))]));
const oppFiles = new Map();
for (const c of plan.cohorts) for (const o of c.opponents) for (const w of o.warriors) oppFiles.set(w, sha(R(w)));
const zombieHashes = plan.zombies.map((z) => ({ ...z, sha256: sha(R(z.path)) }));
const summary = {};
for (const a of plan.arms) {
  const rs = runs.filter((r) => r.arm === a.id);
  const b = rs.reduce((s, r) => s + r.battles, 0);
  summary[a.id] = { battles: b, team: rs.reduce((s, r) => s + r.team, 0) / b, w1: rs.reduce((s, r) => s + r.w1, 0) / b, w2: rs.reduce((s, r) => s + r.w2, 0) / b };
}
const result = {
  schema: "agent2-bench-v1", planId: plan.id, engine, generatedAt: new Date().toISOString(), elapsedSeconds: elapsed,
  planSha256: sha(planPath), planPath: path.relative(root, planPath), engineJarSha256: JAR_SHA,
  driver: engine === "persistent" ? { class: "A2Batch", sourceSha256: sha(R("agent2/tools/java/A2Batch.java")) } : { class: "jar-main" },
  teamName, armHashes, opponentHashes: Object.fromEntries(oppFiles), zombieHashes, summary, runs,
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 1) + "\n");
for (const [k, v] of Object.entries(summary)) console.log(`${k.padEnd(18)} team=${v.team.toFixed(6)} w1=${v.w1.toFixed(6)} w2=${v.w2.toFixed(6)} battles=${v.battles}`);
console.log(`wrote ${path.relative(root, resultPath)} (${elapsed.toFixed(1)}s for ${todo.length} new jobs)`);
