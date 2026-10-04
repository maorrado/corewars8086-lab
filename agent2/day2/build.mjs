// Builds the preregistered day-2 field plans (see PROTOCOL.md).
import fs from "node:fs";
import * as F from "../tools/fields.mjs";
const s = "agent2-day2-field-1", N = "agent2/night";
const arms = [
  { id: "KPH", warriors: ["agent2/day2/build/KPH_A", `${N}/revisions/rev1/B`] },
  { id: "rev1", warriors: [`${N}/revisions/rev1/A`, `${N}/revisions/rev1/B`] },
  { id: "rev0", warriors: [`${N}/revisions/rev0/A`, `${N}/revisions/rev0/B`] },
  { id: "V6", warriors: [`${N}/refs/V6/A`, `${N}/refs/V6/B`] },
  { id: "zchain4", warriors: [`${N}/refs/zchain4/A`, `${N}/refs/zchain4/B`] },
];
const mk = (cohortSpecs, zombies, id) => {
  const cohorts = [];
  for (const [teams, tag, K] of cohortSpecs) for (let k = 0; k < K; k++)
    F.partition(teams, 3, `${s}/${tag}/${k}`).forEach((o, j) => { const cid = `${tag}-${k}-${j}`; cohorts.push({ id: cid, opponents: o, seeds: [F.seedFor(s, cid)] }); });
  const plan = { id, salt: s, battles: 40, zombiesPack: zombies, zombies: F.zombies[zombies], arms, cohorts };
  fs.writeFileSync(`agent2/day2/${id}.json`, JSON.stringify(plan, null, 1) + "\n");
  console.log(id, cohorts.length, "cohorts");
};
mk([[F.field2025(), "f2025", 10], [[...F.field2024final(), ...F.counters(), ...F.peers()], "strong", 6], [[...F.field2024live(), ...F.counters()], "l24", 4]], "z2025", "day2-field");
mk([[F.field2025(), "nz", 3]], "none", "day2-field-nz");
