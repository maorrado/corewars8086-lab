// Summarize per-battle telemetry for the candidate team in an agent2 bench result.
// usage: node analyze-tele.mjs <result.json> [teamName]
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const res = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const team = process.argv[3] ?? res.teamName;

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/); const head = lines.shift().split(",");
  return lines.map((l) => {
    const cells = []; let cur = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { cells.push(cur); cur = ""; } else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}

const byArm = {};
for (const run of res.runs) {
  const rows = parseCsv(fs.readFileSync(path.join(root, run.telemetry), "utf8"));
  const wars = new Map();
  for (const r of rows) { if (!wars.has(r.war)) wars.set(r.war, []); wars.get(r.war).push(r); }
  const A = (byArm[run.arm] ??= { battles: 0, score: 0, cat: {}, lostTo: {}, deathReason: {}, deathRoundHist: {}, endRound: [], firstDeathMember: {}, captured: 0, partnerDeathsWhenScoreLoss: 0, timeouts: 0, rows: [] });
  for (const [w, rs] of wars) {
    const surv = rs.filter((r) => !r.type.startsWith("ZOMBIE"));
    const alive = surv.filter((r) => r.alive === "true");
    const mine = surv.filter((r) => r.group === team);
    const mineAlive = mine.filter((r) => r.alive === "true");
    const sc = alive.length ? mineAlive.length / alive.length : 0;
    A.battles++; A.score += sc;
    const endRound = Number(rs[0].endRound);
    const timeout = endRound >= 200000;
    if (timeout) A.timeouts++;
    let cat;
    if (mineAlive.length === 0) cat = "dead";
    else if (alive.length === mineAlive.length) cat = mineAlive.length === 2 ? "win-both" : "win-one";
    else cat = timeout ? "timeout-shared" : "shared-other";
    A.cat[cat] = (A.cat[cat] ?? 0) + 1;
    if (sc < 1) {
      const others = [...new Set(alive.filter((r) => r.group !== team).map((r) => r.group))];
      for (const g of others) A.lostTo[g] = (A.lostTo[g] ?? 0) + (1 - sc) / others.length;
      if (!others.length) A.lostTo["<none-alive>"] = (A.lostTo["<none-alive>"] ?? 0) + (1 - sc);
    }
    for (const m of mine) if (m.alive !== "true") {
      const k = `${m.type}:${m.deathReason}`; A.deathReason[k] = (A.deathReason[k] ?? 0) + 1;
      const b = Number(m.deathRound) < 1000 ? "<1k" : Number(m.deathRound) < 10000 ? "1k-10k" : Number(m.deathRound) < 50000 ? "10k-50k" : ">=50k";
      A.deathRoundHist[b] = (A.deathRoundHist[b] ?? 0) + 1;
    }
    A.endRound.push(endRound);
    A.rows.push({ cohort: run.cohort, war: w, sc, cat, endRound });
  }
}
for (const [arm, A] of Object.entries(byArm)) {
  const er = A.endRound.sort((x, y) => x - y);
  console.log(`== ${arm}: battles=${A.battles} score/battle=${(A.score / A.battles).toFixed(4)} timeouts=${A.timeouts}`);
  console.log("  outcome:", Object.entries(A.cat).map(([k, v]) => `${k}=${v}`).join(" "));
  console.log("  deaths:", Object.entries(A.deathReason).map(([k, v]) => `${k}=${v}`).join(" "), "| death round:", JSON.stringify(A.deathRoundHist));
  console.log(`  endRound median=${er[er.length >> 1]} p90=${er[Math.floor(er.length * 0.9)]}`);
  const lt = Object.entries(A.lostTo).sort((x, y) => y[1] - x[1]).slice(0, 15);
  console.log("  points lost to (top):", lt.map(([k, v]) => `${k}=${v.toFixed(1)}`).join(" "));
}
