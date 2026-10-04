// Field of the 16 teams that reached the 2025 final (list from the user, 2026-10-04), using their
// published ONLINE-stage survivors (their final-event code and the final's new Zombies are not available).
import fs from "node:fs";
import * as F from "../tools/fields.mjs";
const names = ["GSA_callfart", "BZV_SKYENT", "WAN_Baltika9", "HRZ_LowKey_WBB", "HRZ_L", "HRZ_Registered_Winners", "HRZ_ADDvanced",
  "AVI_AnotherBitInTheWall", "HRZ_BinaryBandits", "IND_stuxnet", "GSA_GhostBytes_0x", "GSA_GoonSquad", "WHS_K0F1M_AL_T1L1M",
  "OHS_TrojanByte", "HRZ_The_almogooners", "TOM_2B2Team"];
const pool = names.map((n) => F.field2025().find((t) => t.name === `A_${n}`));
const salt = "agent2-day2-finalists16-1", N = "agent2/night", SC = "strong-codes";
const arms = [["CC3", "01_CC3"], ["DET2", "02_DET2"], ["rev1", "05_rev1_KPHL"], ["V6nohunt", "07_V6nohunt_rev0"], ["zchain4", "08_zchain4"], ["V6", "11_V6_original"]]
  .map(([id, d]) => ({ id, warriors: [`${SC}/${d}/A`, `${SC}/${d}/B`] }));
const mk = (id, z, K) => { const cohorts = [];
  for (let k = 0; k < K; k++) F.partition(pool, 3, `${salt}/${id}/${k}`).forEach((o, j) => { const cid = `p${k}-${j}`; cohorts.push({ id: cid, seeds: [F.seedFor(`${salt}/${id}`, cid)], opponents: o }); });
  fs.writeFileSync(`agent2/day2/${id}.json`, JSON.stringify({ id, salt, battles: 40, zombiesPack: z, zombies: F.zombies[z], arms, cohorts }, null, 1) + "\n");
  console.log(id, cohorts.length, "cohorts x", arms.length, "arms"); };
mk("fin16", "z2025", 30);
mk("fin16-nz", "none", 10);
