// Builds the preregistered all-560-triples confirmation (PROTOCOL-top16.md).
import fs from "node:fs";
import * as F from "../tools/fields.mjs";
const base = JSON.parse(fs.readFileSync("agent2/day2/fin16.json", "utf8"));
const names = ["GSA_callfart", "BZV_SKYENT", "WAN_Baltika9", "HRZ_LowKey_WBB", "HRZ_L", "HRZ_Registered_Winners", "HRZ_ADDvanced",
  "AVI_AnotherBitInTheWall", "HRZ_BinaryBandits", "IND_stuxnet", "GSA_GhostBytes_0x", "GSA_GoonSquad", "WHS_K0F1M_AL_T1L1M",
  "OHS_TrojanByte", "HRZ_The_almogooners", "TOM_2B2Team"];
const pool = names.map((n) => F.field2025().find((t) => t.name === `A_${n}`));
const salt = "agent2-day2-top16-confirm-1";
const triples = [];
for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) for (let k = j + 1; k < 16; k++) triples.push([i, j, k]);
for (const [id, z, battles] of [["top16C", "z2025", 20], ["top16C-nz", "none", 10]]) {
  const cohorts = triples.map((t) => { const cid = `t${t.join("-")}`; return { id: cid, seeds: [F.seedFor(`${salt}/${id}`, cid)], opponents: t.map((x) => pool[x]) }; });
  fs.writeFileSync(`agent2/day2/${id}.json`, JSON.stringify({ id, salt, battles, zombiesPack: z, zombies: F.zombies[z], arms: base.arms, cohorts }, null, 1) + "\n");
  console.log(id, cohorts.length, "triples x", battles, "battles x", base.arms.length, "arms");
}
