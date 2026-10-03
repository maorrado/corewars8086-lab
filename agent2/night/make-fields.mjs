// Night research: fixed screen field S and the threat library (run once; outputs are frozen).
import fs from "node:fs";
import * as F from "../tools/fields.mjs";

const N = "agent2/night";
const FR = "agent2/frontier-20261003/arms";
const pick = (name) => F.field2025().find((t) => t.name === name);
// Threat library: counter types identified in the day research (to be verified, not assumed).
const threats = {
  // MOVSW-trigger far-call replicators (claimed to hit the anchor ModRM byte)
  movsw_Baltika9: pick("A_WAN_Baltika9"), movsw_TrojanByte: pick("A_OHS_TrojanByte"),
  movsw_cgx123123: pick("A_IND_cgx123123"), movsw_CodeKiller: F.field2025().find((t) => t.name === "Y_TOM_Code_Killer"),
  movsw_LowKey: pick("A_HRZ_LowKey_WBB"), movsw_BinaryBandits: pick("A_HRZ_BinaryBandits"),
  // Zombie competitors / mimics
  zomb_Grindo: pick("A_HRZ_Grindo_Holics"), zomb_callfart: pick("A_GSA_callfart"), zomb_AnotherBit: pick("A_AVI_AnotherBitInTheWall"),
  // Dense / early bombers
  bomb_IND_BRA: pick("A_IND_BRA"),
  // Strong leaders (same-family, cell hijackers, decoy planters, lattice variants)
  lead_V6: { name: "T_V6", warriors: [`${N}/refs/V6/A`, `${N}/refs/V6/B`] },
  lead_V4: { name: "T_V4", warriors: [`${N}/refs/V4/A`, `${N}/refs/V4/B`] },
  lead_V6Guard: { name: "T_V6Guard", warriors: [`${N}/refs/V6Guard/A`, `${N}/refs/V6Guard/B`] },
  lead_zchain4: { name: "T_zchain4", warriors: [`${N}/refs/zchain4/A`, `${N}/refs/zchain4/B`] },
  lead_zrl03: { name: "T_zrl03", warriors: [`${FR}/combo_zrl03/A`, `${FR}/combo_zrl03/B`] },
  lead_ah02: { name: "T_ah02", warriors: [`${FR}/combo_ah02/A`, `${FR}/combo_ah02/B`] },
};
for (const [k, v] of Object.entries(threats)) if (!v) throw new Error("missing threat " + k);
fs.writeFileSync(`${N}/threats/library.json`, JSON.stringify(threats, null, 1) + "\n");

// Screen field S: 2025 (1 partition), strong (1 partition), one cohort per threat, two multi-copy cohorts.
const salt = "agent2-night-S";
const cohorts = [];
F.partition(F.field2025(), 3, `${salt}/2025`).forEach((o, j) => cohorts.push({ id: `s2025-${j + 1}`, group: "2025", opponents: o }));
F.partition([...F.field2024final(), ...F.counters(), ...F.peers()], 3, `${salt}/strong`).forEach((o, j) => cohorts.push({ id: `sstrong-${j + 1}`, group: "strong", opponents: o }));
const r = F.rng(`${salt}/threat`);
const base = F.field2025();
for (const [k, t] of Object.entries(threats)) {
  const others = F.shuffle(base.filter((x) => x.name !== t.name), r).slice(0, 2);
  cohorts.push({ id: `sthreat-${k}`, group: "threat", threat: k, opponents: [t, ...others] });
}
const clone = (t, i) => ({ name: `${t.name}_c${i}`, warriors: t.warriors });
cohorts.push({ id: "smulti-V6x3", group: "multi", opponents: [clone(threats.lead_V6, 1), clone(threats.lead_V6, 2), clone(threats.lead_V6, 3)] });
cohorts.push({ id: "smulti-mix", group: "multi", opponents: [threats.lead_V4, threats.zomb_Grindo, threats.movsw_Baltika9] });
for (const c of cohorts) c.seeds = [F.seedFor(salt, c.id)];
fs.writeFileSync(`${N}/fields/S.json`, JSON.stringify({ salt, battles: 30, zombies: "z2025", cohorts }, null, 1) + "\n");
console.log(`S: ${cohorts.length} cohorts; threats: ${Object.keys(threats).length}`);
