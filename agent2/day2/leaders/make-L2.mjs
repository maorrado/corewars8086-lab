// Round-2 screen field L2: more plain-2025 weight than L. Frozen once written.
import fs from "node:fs";
import * as F from "../../tools/fields.mjs";
const salt = "agent2-day2-L2";
const LEAD = JSON.parse(fs.readFileSync("agent2/day2/leaders/L.json", "utf8")).leaders;
const r = F.rng(`${salt}/fill`), base = F.field2025(), fill = (n) => F.shuffle(base, r).slice(0, n);
const cohorts = [];
for (let k = 0; k < 2; k++) F.partition(base, 3, `${salt}/2025/${k}`).slice(0, 15).forEach((o, j) => cohorts.push({ id: `p2025-${k}-${j}`, group: "2025", opponents: o }));
F.partition([...F.field2024final(), ...F.counters(), ...F.peers()], 3, `${salt}/strong`).forEach((o, j) => cohorts.push({ id: `strong-${j}`, group: "strong", opponents: o }));
F.partition([...F.field2024live(), ...F.counters()], 3, `${salt}/l24`).slice(0, 6).forEach((o, j) => cohorts.push({ id: `l24-${j}`, group: "2024live", opponents: o }));
for (const [k, t] of Object.entries(LEAD)) for (let i = 0; i < 2; i++) cohorts.push({ id: `L1-${k}-${i}`, group: "leader1", leader: k, opponents: [t, ...fill(2)] });
const keys = Object.keys(LEAD);
for (let i = 0; i < 6; i++) { const [a, b] = F.shuffle(keys, r); cohorts.push({ id: `L2-${a}-${b}-${i}`, group: "leader2", opponents: [LEAD[a], LEAD[b], ...fill(1)] }); }
for (let i = 0; i < 3; i++) { const ks = F.shuffle(keys, r).slice(0, 3); cohorts.push({ id: `L3-${ks.join("-")}-${i}`, group: "leader3", opponents: ks.map((k) => LEAD[k]) }); }
for (const c of cohorts) c.seeds = [F.seedFor(salt, c.id)];
fs.writeFileSync("agent2/day2/leaders/L2.json", JSON.stringify({ salt, battles: 30, zombies: "z2025", cohorts, leaders: LEAD }, null, 1) + "\n");
const g = {}; for (const c of cohorts) g[c.group] = (g[c.group] || 0) + 1; console.log(cohorts.length, g);
