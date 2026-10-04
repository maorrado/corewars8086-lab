// Day-2 leader screen field L: plain 2025 / strong cohorts plus cohorts that contain the strong
// far-call leaders (V6 family, zchain4, zrl03, ah02). Frozen once written.
import fs from "node:fs";
import * as F from "../../tools/fields.mjs";
const salt = "agent2-day2-L", N = "agent2/night", FR = "agent2/frontier-20261003/arms";
const T = (name, dir) => ({ name, warriors: [`${dir}/A`, `${dir}/B`] });
const LEAD = { V6: T("T_V6", `${N}/refs/V6`), V4: T("T_V4", `${N}/refs/V4`), V6Guard: T("T_V6Guard", `${N}/refs/V6Guard`),
  V6nohunt: T("T_V6nohunt", `${N}/revisions/rev0`), zchain4: T("T_zchain4", `${N}/refs/zchain4`), zchain3: T("T_zchain3", `${FR}/zchain3`),
  zrl03: T("T_zrl03", `${FR}/combo_zrl03`), ah02: T("T_ah02", `${FR}/combo_ah02`) };
const r = F.rng(`${salt}/fill`), base = F.field2025();
const fill = (n) => F.shuffle(base, r).slice(0, n);
const cohorts = [];
F.partition(base, 3, `${salt}/2025`).slice(0, 15).forEach((o, j) => cohorts.push({ id: `p2025-${j}`, group: "2025", opponents: o }));
F.partition([...F.field2024final(), ...F.counters(), ...F.peers()], 3, `${salt}/strong`).forEach((o, j) => cohorts.push({ id: `strong-${j}`, group: "strong", opponents: o }));
for (const [k, t] of Object.entries(LEAD)) for (let i = 0; i < 3; i++) cohorts.push({ id: `L1-${k}-${i}`, group: "leader1", leader: k, opponents: [t, ...fill(2)] });
const pairs = [["V6", "zchain4"], ["V4", "zchain4"], ["V6Guard", "zchain3"], ["V6", "zrl03"], ["zchain4", "ah02"], ["V6nohunt", "zchain4"], ["V4", "V6Guard"], ["zchain4", "zrl03"]];
pairs.forEach(([a, b], i) => cohorts.push({ id: `L2-${a}-${b}`, group: "leader2", opponents: [LEAD[a], LEAD[b], ...fill(1)] }));
const cl = (t, s) => ({ ...t, name: `${t.name}_${s}` });
cohorts.push({ id: "L3-V6x2-z4", group: "leader3", opponents: [cl(LEAD.V6, "a"), cl(LEAD.V6, "b"), LEAD.zchain4] });
cohorts.push({ id: "L3-z4x2-V6", group: "leader3", opponents: [cl(LEAD.zchain4, "a"), cl(LEAD.zchain4, "b"), LEAD.V6] });
cohorts.push({ id: "L3-V4-V6G-z4", group: "leader3", opponents: [LEAD.V4, LEAD.V6Guard, LEAD.zchain4] });
cohorts.push({ id: "L3-V6-zrl-ah", group: "leader3", opponents: [LEAD.V6, LEAD.zrl03, LEAD.ah02] });
for (const c of cohorts) c.seeds = [F.seedFor(salt, c.id)];
fs.writeFileSync("agent2/day2/leaders/L.json", JSON.stringify({ salt, battles: 30, zombies: "z2025", cohorts, leaders: LEAD }, null, 1) + "\n");
const g = {}; for (const c of cohorts) g[c.group] = (g[c.group] || 0) + 1; console.log(cohorts.length, g);
