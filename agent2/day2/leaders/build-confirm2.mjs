// Builds the preregistered confirmation plans (PROTOCOL-leaders.md). usage: node build-confirm.mjs name=A,B [name=A,B ...]
import fs from "node:fs";
import * as F from "../../tools/fields.mjs";
const s = "agent2-day2-confirm-2", N = "agent2/night";
const L = JSON.parse(fs.readFileSync("agent2/day2/leaders/L.json", "utf8")).leaders;
const arms = process.argv.slice(2).map((x) => { const [id, w] = x.split("="); return { id, warriors: w.split(",") }; });
arms.push({ id: "DET2", warriors: ["strong-codes/01_DET2/A", "strong-codes/01_DET2/B"] }, { id: "rev1", warriors: [`${N}/revisions/rev1/A`, `${N}/revisions/rev1/B`] }, { id: "V6", warriors: [`${N}/refs/V6/A`, `${N}/refs/V6/B`] });
const coh = [], nz = [];
const part = (teams, tag, K, out = coh) => { for (let k = 0; k < K; k++) F.partition(teams, 3, `${s}/${tag}/${k}`).forEach((o, j) => out.push({ id: `${tag}-${k}-${j}`, opponents: o })); };
part(F.field2025(), "f2025", 4); part([...F.field2024final(), ...F.counters(), ...F.peers()], "strong", 3); part([...F.field2024live(), ...F.counters()], "l24", 1);
const r = F.rng(`${s}/leaders`), base = F.field2025(), keys = Object.keys(L);
for (const k of keys) for (let i = 0; i < 6; i++) coh.push({ id: `L1-${k}-${i}`, opponents: [L[k], ...F.shuffle(base, r).slice(0, 2)] });
for (let i = 0; i < 12; i++) { const [a, b] = F.shuffle(keys, r); coh.push({ id: `L2-${a}-${b}-${i}`, opponents: [L[a], L[b], F.shuffle(base, r)[0]] }); }
for (let i = 0; i < 6; i++) { const ks = F.shuffle(keys, r).slice(0, 3); coh.push({ id: `L3-${ks.join("-")}-${i}`, opponents: ks.map((k) => L[k]) }); }
part(F.field2025(), "nz", 1, nz);
for (const c of [...coh, ...nz]) c.seeds = [F.seedFor(s, c.id)];
for (const [id, cs, z] of [["day2C2", coh, "z2025"], ["day2C2-nz", nz, "none"]]) {
  fs.writeFileSync(`agent2/day2/leaders/${id}.json`, JSON.stringify({ id, salt: s, battles: 40, zombiesPack: z, zombies: F.zombies[z], arms, cohorts: cs }, null, 1) + "\n");
  console.log(id, arms.length, "arms x", cs.length, "cohorts");
}
