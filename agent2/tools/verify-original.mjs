// Re-run a deterministic sample of jobs from an agent2 persistent-driver result with the original
// cold `java -jar <deterministic JAR> --headless --parallel=false` and compare scores.csv byte-for-byte.
// usage: node verify-original.mjs <result.json> <nJobs|all> <salt> [threads=8]
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto"; import { spawn } from "node:child_process";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const [resPath, nArg, salt, thr = "8"] = process.argv.slice(2);
const res = JSON.parse(fs.readFileSync(resPath, "utf8"));
const java = path.join(root, "tools/temurin8-jre/jdk8u504-b01-jre/bin/java.exe");
const jar = path.join(root, "repos/corewars8086-6.0.0-deterministic/target/corewars8086-6.0.0-jar-with-dependencies.jar");
const runRoot = path.join(root, `agent2/runs/${res.planId}-${res.engine}`);
const safe = (v) => String(v).replace(/[^A-Za-z0-9_-]/g, "_");
let runs = res.runs.map((r) => ({ ...r, id: `${safe(r.arm)}__${safe(r.cohort)}__${safe(r.seed)}` }));
const key = (r) => crypto.createHash("sha256").update(`${salt}/${r.id}`).digest("hex");
runs.sort((a, b) => (key(a) < key(b) ? -1 : 1));
if (nArg !== "all") runs = runs.slice(0, Number(nArg));
const outDir = path.join(root, `agent2/runs/verify-${res.planId}-${safe(salt)}`);
fs.mkdirSync(outDir, { recursive: true });
const q = [...runs]; let active = 0; const results = [];
await new Promise((done, fail) => {
  const next = () => {
    if (!q.length && !active) return done();
    while (active < Number(thr) && q.length) {
      const r = q.shift(); active++;
      const d = path.join(runRoot, r.id);
      const groups = new Set(fs.readdirSync(path.join(d, "survivors")).map((f) => f.replace(/[12]$/, ""))).size;
      const out = path.join(outDir, `${r.id}.csv`);
      fs.rmSync(out, { force: true });
      const args = ["-jar", jar, "--headless", "--parallel=false", "--threads", "1", "--comboSize", String(groups),
        "--battlesPerCombo", String(r.battles), "--seed", r.seed, "--warriorsDir", path.join(d, "survivors"),
        "--zombiesDir", path.join(d, "zombies"), "--outputFile", out];
      const p = spawn(java, args, { stdio: "ignore" });
      p.on("exit", (c) => {
        active--;
        if (c !== 0) return fail(new Error(`${r.id} exit ${c}`));
        const a = fs.readFileSync(path.join(d, "scores.csv")), b = fs.readFileSync(out);
        results.push({ id: r.id, identical: a.equals(b), sha256: crypto.createHash("sha256").update(b).digest("hex") });
        next();
      });
    }
  };
  next();
});
const ok = results.filter((x) => x.identical).length;
const report = { schema: "agent2-verify-original-v1", result: path.relative(root, resPath), salt, engineJarSha256: crypto.createHash("sha256").update(fs.readFileSync(jar)).digest("hex"), jobs: results.length, identical: ok, results };
fs.writeFileSync(path.join(root, `agent2/results/verify-${res.planId}-${safe(salt)}.json`), JSON.stringify(report, null, 1) + "\n");
console.log(`original cold-JVM re-run: ${ok}/${results.length} scores.csv byte-identical`);
