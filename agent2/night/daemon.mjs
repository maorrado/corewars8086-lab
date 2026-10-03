// Night research evaluation daemon: the ONLY process that runs battles. Agents submit jobs to
// agent2/night/queue/pending/*.json (via submit.mjs) and read agent2/night/queue/done/<id>.json.
// Jobs are processed one at a time (FIFO) with the validated persistent driver (unmodified v6 JAR).
// kinds: screen | threat | trace | confirm.  Stop: create agent2/night/STOP.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import * as F from "../tools/fields.mjs";

const N = "agent2/night";
const THREADS = process.env.NIGHT_THREADS ?? "8";
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const shaStr = (s) => crypto.createHash("sha256").update(s).digest("hex");
const now = () => new Date().toISOString();
const readJ = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const writeJ = (f, o) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + ".tmp", JSON.stringify(o, null, 1) + "\n"); fs.renameSync(f + ".tmp", f); };
const ledger = (o) => fs.appendFileSync(`${N}/ledger.jsonl`, JSON.stringify({ t: now(), ...o }) + "\n");
const S = readJ(`${N}/fields/S.json`);
const LIB = readJ(`${N}/threats/library.json`);

function currentBase() {
  const sb = readJ(`${N}/shared-best.json`);
  const dir = `${N}/revisions/rev${sb.revision}`;
  return { rev: sb.revision, A: `${dir}/A`, B: `${dir}/B` };
}

function assemble(job) {
  const out = `${N}/cand-build/${job.id}`;
  fs.mkdirSync(out, { recursive: true });
  let A = job.binA, B = job.binB;
  if (job.asmA || job.asmB) {
    const files = [];
    if (job.asmA) { fs.copyFileSync(job.asmA, `${out}/candA.asm`); files.push(`${out}/candA.asm`); }
    if (job.asmB) { fs.copyFileSync(job.asmB, `${out}/candB.asm`); files.push(`${out}/candB.asm`); }
    const r = spawnSync("node", ["agent2/tools/nasm-node.cjs", out, ...files], { encoding: "utf8" });
    if (r.status !== 0) throw new Error("assembly failed: " + (r.stderr || r.stdout).slice(-1500));
    if (job.asmA) A = `${out}/candA`;
    if (job.asmB) B = `${out}/candB`;
  }
  const base = currentBase();
  A = A ?? base.A; B = B ?? base.B;
  for (const f of [A, B]) {
    const n = fs.statSync(f).size;
    if (n > 256) throw new Error(`${f} is ${n} bytes > 256`);
  }
  return { A, B, sizeA: fs.statSync(A).size, sizeB: fs.statSync(B).size, shaA: sha(A), shaB: sha(B) };
}

function runPlan(planId, arms, cohorts, battles, zombies, telemetry = false) {
  const plan = { id: planId, battles, telemetry, zombies: F.zombies[zombies], arms, cohorts: cohorts.map((c) => ({ id: c.id, seeds: c.seeds, opponents: c.opponents })) };
  const pf = `${N}/plans/${planId}.json`;
  if (!fs.existsSync(pf)) writeJ(pf, plan);
  const r = spawnSync("node", ["agent2/tools/bench.mjs", pf, "--threads", THREADS], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error("bench failed: " + (r.stderr || r.stdout).slice(-1500));
  const src = `agent2/results/${planId}-persistent.json`;
  const dst = `${N}/results/${planId}.json`;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.renameSync(src, dst);
  return readJ(dst);
}
// per-battle team score keyed by cohort|seed for one arm
const scores = (res, arm) => Object.fromEntries(res.runs.filter((r) => r.arm === arm).map((r) => [`${r.cohort}|${r.seed}`, { v: r.team / r.battles, w1: r.w1 / r.battles, w2: r.w2 / r.battles, opp: r.opponents }]));
function stat(d, z = 1.96) {
  const n = d.length; if (!n) return null;
  const m = d.reduce((s, x) => s + x, 0) / n;
  const sd = n > 1 ? Math.sqrt(d.reduce((s, x) => s + (x - m) ** 2, 0) / (n - 1)) : 0;
  const h = z * sd / Math.sqrt(n);
  return { n, diff: +m.toFixed(5), lo: +(m - h).toFixed(5), hi: +(m + h).toFixed(5), wins: d.filter((x) => x > 1e-9).length, losses: d.filter((x) => x < -1e-9).length };
}
function compare(cand, base, cohorts, z) {
  const groups = {}; const per = [];
  for (const c of cohorts) {
    const k = `${c.id}|${c.seeds[0]}`;
    if (!(k in cand) || !(k in base)) continue;
    const d = cand[k].v - base[k].v;
    per.push({ cohort: c.id, group: c.group, threat: c.threat, cand: +cand[k].v.toFixed(4), base: +base[k].v.toFixed(4), diff: +d.toFixed(4) });
    (groups[c.group] ??= []).push(d);
  }
  const out = { all: stat(per.map((p) => p.diff), z), groups: Object.fromEntries(Object.entries(groups).map(([g, d]) => [g, stat(d, z)])), perCohort: per };
  return out;
}

function screen(job, cand) {
  const base = currentBase();
  const basePlan = `nightS-base-rev${base.rev}`;
  const baseRes = fs.existsSync(`${N}/results/${basePlan}.json`) ? readJ(`${N}/results/${basePlan}.json`) : runPlan(basePlan, [{ id: "base", warriors: [base.A, base.B] }], S.cohorts, S.battles, S.zombies);
  const candPlan = `nightS-${cand.shaA.slice(0, 10)}-${cand.shaB.slice(0, 10)}`;
  const candRes = fs.existsSync(`${N}/results/${candPlan}.json`) ? readJ(`${N}/results/${candPlan}.json`) : runPlan(candPlan, [{ id: "cand", warriors: [cand.A, cand.B] }], S.cohorts, S.battles, S.zombies);
  const c = compare(scores(candRes, "cand"), scores(baseRes, "base"), S.cohorts);
  const meanOf = (res, arm) => { const s = Object.values(scores(res, arm)); return +(s.reduce((a, x) => a + x.v, 0) / s.length).toFixed(4); };
  return { baseRevision: base.rev, battlesPerArm: S.cohorts.length * S.battles, candMean: meanOf(candRes, "cand"), baseMean: meanOf(baseRes, "base"), ...c };
}

function threatSpec(job) {
  // job.threats: [{key} from library | {name, asmA?, asmB?, binA?, binB?}], copies (1..3), cohortsPerThreat
  const out = [];
  for (const t of job.threats) {
    if (t.key) { if (!LIB[t.key]) throw new Error("unknown threat key " + t.key); out.push({ label: t.key, team: LIB[t.key] }); continue; }
    const dir = `${N}/cand-build/${job.id}/threat-${out.length}`;
    fs.mkdirSync(dir, { recursive: true });
    const files = [];
    let A = t.binA, B = t.binB;
    if (t.asmA) { fs.copyFileSync(t.asmA, `${dir}/tA.asm`); files.push(`${dir}/tA.asm`); }
    if (t.asmB) { fs.copyFileSync(t.asmB, `${dir}/tB.asm`); files.push(`${dir}/tB.asm`); }
    if (files.length) {
      const r = spawnSync("node", ["agent2/tools/nasm-node.cjs", dir, ...files], { encoding: "utf8" });
      if (r.status !== 0) throw new Error("threat assembly failed: " + (r.stderr || r.stdout).slice(-1500));
      if (t.asmA) A = `${dir}/tA`; if (t.asmB) B = `${dir}/tB`;
    }
    const ws = [A, B].filter(Boolean);
    if (!ws.length) throw new Error("threat needs warriors");
    out.push({ label: t.name, team: { name: `X_${t.name.replace(/[^A-Za-z0-9_]/g, "_")}`, warriors: ws }, hashes: ws.map(sha) });
  }
  return out;
}
function threatCohorts(job, spec) {
  const copies = Math.min(3, Math.max(1, job.copies ?? 1));
  const per = Math.min(12, Math.max(2, job.cohortsPerThreat ?? 6));
  const key = shaStr(JSON.stringify({ spec: spec.map((s) => [s.label, s.hashes ?? s.team.warriors]), copies, per, mix: !!job.mixAll })).slice(0, 12);
  const salt = `agent2-night-threat-${key}`;
  const r = F.rng(salt); const base = F.field2025();
  const cohorts = [];
  const mk = (id, teams) => { const fill = F.shuffle(base.filter((x) => !teams.some((t) => t.name === x.name || t.warriors[0] === x.warriors[0])), r).slice(0, Math.max(0, 3 - teams.length)); cohorts.push({ id, group: "threat", threat: id.split("#")[0], opponents: [...teams, ...fill].slice(0, 3), seeds: [F.seedFor(salt, id)] }); };
  if (job.mixAll) { for (let i = 0; i < per; i++) mk(`mix#${i}`, spec.slice(0, 3).map((s, j) => ({ ...s.team, name: `${s.team.name}_m${'ABC'[j]}` }))); }
  else for (const s of spec) for (let i = 0; i < per; i++) mk(`${s.label}#${i}`, Array.from({ length: copies }, (_, j) => ({ ...s.team, name: copies > 1 ? `${s.team.name}_c${'ABC'[j]}` : s.team.name })));
  return { key, cohorts };
}
function threat(job, cand) {
  const base = currentBase();
  const spec = threatSpec(job);
  const { key, cohorts } = threatCohorts(job, spec);
  const bp = `nightT-${key}-base-rev${base.rev}`;
  const baseRes = fs.existsSync(`${N}/results/${bp}.json`) ? readJ(`${N}/results/${bp}.json`) : runPlan(bp, [{ id: "base", warriors: [base.A, base.B] }], cohorts, 30, "z2025");
  const cp = `nightT-${key}-${cand.shaA.slice(0, 10)}-${cand.shaB.slice(0, 10)}`;
  const candRes = fs.existsSync(`${N}/results/${cp}.json`) ? readJ(`${N}/results/${cp}.json`) : runPlan(cp, [{ id: "cand", warriors: [cand.A, cand.B] }], cohorts, 30, "z2025");
  const cs = scores(candRes, "cand"), bs = scores(baseRes, "base");
  const byThreat = {};
  for (const c of cohorts) { const k = `${c.id}|${c.seeds[0]}`; (byThreat[c.threat] ??= []).push(cs[k].v - bs[k].v); }
  const threatScore = (sc) => { const o = {}; for (const c of cohorts) { const k = `${c.id}|${c.seeds[0]}`; const tn = c.opponents[0].name; (o[c.threat] ??= []).push(sc[k].opp[tn] / 30); } return Object.fromEntries(Object.entries(o).map(([t, a]) => [t, +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(4)])); };
  return { baseRevision: base.rev, specKey: key, battlesPerArm: cohorts.length * 30,
    candMean: +(Object.values(cs).reduce((a, x) => a + x.v, 0) / cohorts.length).toFixed(4), baseMean: +(Object.values(bs).reduce((a, x) => a + x.v, 0) / cohorts.length).toFixed(4),
    all: stat(cohorts.map((c) => cs[`${c.id}|${c.seeds[0]}`].v - bs[`${c.id}|${c.seeds[0]}`].v)),
    byThreat: Object.fromEntries(Object.entries(byThreat).map(([t, d]) => [t, stat(d)])),
    threatFirstTeamScore: { vsCand: threatScore(cs), vsBase: threatScore(bs) },
    threatHashes: spec.map((s) => ({ label: s.label, warriors: s.team.warriors, hashes: s.hashes })) };
}

function trace(job, cand) {
  const cohorts = S.cohorts.filter((c) => c.group === "2025").slice(0, 4).concat(S.cohorts.filter((c) => c.group === "threat").slice(0, 4));
  const pid = `nightTR-${cand.shaA.slice(0, 10)}-${cand.shaB.slice(0, 10)}`;
  const res = fs.existsSync(`${N}/results/${pid}.json`) ? readJ(`${N}/results/${pid}.json`) : runPlan(pid, [{ id: "cand", warriors: [cand.A, cand.B] }], cohorts, 20, "z2025", true);
  // bench wrote telemetry under agent2/runs/<pid>-persistent; trace-runs expects the result path
  const tmp = `agent2/results/${pid}-persistent.json`; fs.copyFileSync(`${N}/results/${pid}.json`, tmp);
  const outDir = `${N}/scratch/_trace/${pid}`;
  if (!fs.existsSync(outDir)) spawnSync("node", ["agent2/tools/trace-runs.mjs", tmp, "cand", outDir], { encoding: "utf8" });
  fs.rmSync(tmp, { force: true });
  const sum = spawnSync("node", ["agent2/tools/sum-trace2.mjs", outDir], { encoding: "utf8" }).stdout;
  return { traceDir: outDir, battles: cohorts.length * 20, summary: sum.slice(0, 6000), note: "phase 'wild-cs' = any CS other than 0FFC/1000 (V6 family uses FAR_SEG 0FFB); examples.json not produced by sum-trace2; raw jsonl in traceDir" };
}

function confirm(job, cand) {
  if (!job.salt || !/^agent2-night-confirm-/.test(job.salt)) throw new Error("confirm needs a fresh salt agent2-night-confirm-*");
  const used = fs.existsSync(`${N}/confirm/salts.json`) ? readJ(`${N}/confirm/salts.json`) : [];
  if (used.includes(job.salt)) throw new Error("salt already used: " + job.salt);
  used.push(job.salt); writeJ(`${N}/confirm/salts.json`, used);
  const base = currentBase();
  const arms = [{ id: "cand", warriors: [cand.A, cand.B] }, { id: "base", warriors: [base.A, base.B] }];
  if (base.rev !== 0) arms.push({ id: "rev0", warriors: [`${N}/revisions/rev0/A`, `${N}/revisions/rev0/B`] });
  arms.push({ id: "V6Guard", warriors: [`${N}/refs/V6Guard/A`, `${N}/refs/V6Guard/B`] }, { id: "zchain4", warriors: [`${N}/refs/zchain4/A`, `${N}/refs/zchain4/B`] }, { id: "V6", warriors: [`${N}/refs/V6/A`, `${N}/refs/V6/B`] });
  const s = job.salt; const cohorts = [];
  const part = (teams, tag, K, group) => { for (let k = 0; k < K; k++) F.partition(teams, 3, `${s}/${tag}/${k}`).forEach((o, j) => cohorts.push({ id: `${tag}-${k}-${j}`, group, opponents: o, seeds: [F.seedFor(s, `${tag}-${k}-${j}`)] })); };
  part(F.field2025(), "f2025", 3, "2025"); part([...F.field2024final(), ...F.counters(), ...F.peers()], "strong", 3, "strong"); part([...F.field2024live(), ...F.counters()], "l24", 1, "2024live");
  const r = F.rng(`${s}/threat`); const base25 = F.field2025();
  for (const [k, t] of Object.entries(LIB)) for (let i = 0; i < 3; i++) { const id = `t-${k}-${i}`; cohorts.push({ id, group: "threat", threat: k, opponents: [t, ...F.shuffle(base25.filter((x) => x.name !== t.name), r).slice(0, 2)], seeds: [F.seedFor(s, id)] }); }
  for (let i = 0; i < 4; i++) { const id = `multiV6-${i}`; cohorts.push({ id, group: "multi", opponents: [0, 1, 2].map((j) => ({ ...LIB.lead_V6, name: `T_V6_c${'ABC'[j]}` })), seeds: [F.seedFor(s, id)] }); }
  for (let i = 0; i < 4; i++) { const id = `multiMix-${i}`; const ks = F.shuffle(Object.keys(LIB), r).slice(0, 3); cohorts.push({ id, group: "multi", opponents: ks.map((k) => LIB[k]), seeds: [F.seedFor(s, id)] }); }
  const pid = `nightC-${s.replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const res = runPlan(pid, arms, cohorts, 40, "z2025");
  const nzCoh = []; F.partition(F.field2025(), 3, `${s}/nz`).forEach((o, j) => nzCoh.push({ id: `nz-${j}`, group: "nozombie", opponents: o, seeds: [F.seedFor(s, `nz-${j}`)] }));
  const resNZ = runPlan(pid + "-nz", arms, nzCoh, 40, "none");
  const all = [...cohorts, ...nzCoh];
  const sc = {}; for (const a of arms) sc[a.id] = { ...scores(res, a.id), ...scores(resNZ, a.id) };
  const cmp = {};
  for (const a of arms) if (a.id !== "cand") {
    const pooledCoh = all.filter((c) => ["2025", "strong", "2024live"].includes(c.group));
    const c = compare(sc.cand, sc[a.id], all);
    cmp[a.id] = { pooled_2025_strong_2024live_z2_5: stat(pooledCoh.map((x) => sc.cand[`${x.id}|${x.seeds[0]}`].v - sc[a.id][`${x.id}|${x.seeds[0]}`].v), 2.5), groups: c.groups,
      byThreat: Object.fromEntries(Object.keys(LIB).map((k) => [k, stat(all.filter((x) => x.threat === k).map((x) => sc.cand[`${x.id}|${x.seeds[0]}`].v - sc[a.id][`${x.id}|${x.seeds[0]}`].v))])) };
  }
  const means = {}; for (const a of arms) { means[a.id] = {}; for (const g of ["2025", "strong", "2024live", "threat", "multi", "nozombie"]) { const xs = all.filter((c) => c.group === g).map((c) => sc[a.id][`${c.id}|${c.seeds[0]}`].v); means[a.id][g] = +(xs.reduce((x, y) => x + y, 0) / xs.length).toFixed(4); } }
  return { baseRevision: base.rev, salt: s, battlesPerArm: all.length * 40, arms: arms.map((a) => ({ id: a.id, hashes: a.warriors.map(sha) })), means, compare: cmp };
}

const cache = fs.existsSync(`${N}/cache.json`) ? readJ(`${N}/cache.json`) : {};
console.log(`[${now()}] night daemon started, threads=${THREADS}`);
for (;;) {
  if (fs.existsSync(`${N}/STOP`)) { console.log("STOP file found"); break; }
  const pend = fs.readdirSync(`${N}/queue/pending`).filter((f) => f.endsWith(".json")).sort();
  if (!pend.length) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); continue; }
  const f = pend[0];
  const job = readJ(`${N}/queue/pending/${f}`);
  fs.renameSync(`${N}/queue/pending/${f}`, `${N}/queue/taken/${f}`);
  const t0 = Date.now();
  let result;
  try {
    const cand = assemble(job);
    const base = currentBase();
    const key = shaStr(JSON.stringify([job.kind, cand.shaA, cand.shaB, base.rev, job.threats ?? null, job.copies ?? null, job.cohortsPerThreat ?? null, job.mixAll ?? null, job.salt ?? null]));
    if (cache[key] && job.kind !== "confirm") {
      result = { ...readJ(`${N}/queue/done/${cache[key]}.json`).result, duplicateOf: cache[key] };
    } else {
      const fn = { screen, threat, trace, confirm }[job.kind];
      if (!fn) throw new Error("unknown kind " + job.kind);
      result = { candidate: cand, ...fn(job, cand) };
      cache[key] = job.id; writeJ(`${N}/cache.json`, cache);
    }
    writeJ(`${N}/queue/done/${job.id}.json`, { job, ok: true, finishedAt: now(), seconds: (Date.now() - t0) / 1000, result });
    ledger({ id: job.id, agent: job.agent, kind: job.kind, rev: result.baseRevision, shaA: cand.shaA.slice(0, 12), shaB: cand.shaB.slice(0, 12), diff: result.all?.diff ?? null, lo: result.all?.lo ?? null, hi: result.all?.hi ?? null, dup: result.duplicateOf ?? null, sec: (Date.now() - t0) / 1000 });
  } catch (e) {
    writeJ(`${N}/queue/done/${job.id}.json`, { job, ok: false, finishedAt: now(), error: String(e.message ?? e) });
    ledger({ id: job.id, agent: job.agent, kind: job.kind, error: String(e.message ?? e).slice(0, 300) });
  }
  console.log(`[${now()}] done ${job.id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
