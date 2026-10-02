import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// A predeclared, fresh senior-only 2025 field: every published senior team
// appears once per panel, with thirteen randomly selected repeats to fill
// twenty-five four-team cohorts. Neither outcomes nor candidate code affect
// cohort selection. Both candidates receive exactly the same field and seed.
const root = path.resolve(import.meta.dirname);
const opponentDirectory = path.join(root, "official-2025", "survivors-online");
const binaryNames = fs.readdirSync(opponentDirectory).filter((name) => /[12]$/.test(name));
const teamNames = [...new Set(binaryNames.map((name) => name.slice(0, -1)))].sort();
for (const teamName of teamNames) {
  for (const suffix of ["1", "2"]) {
    if (!fs.statSync(path.join(opponentDirectory, `${teamName}${suffix}`)).isFile()) {
      throw new Error(`Missing senior warrior: ${teamName}${suffix}`);
    }
  }
}
if (teamNames.length !== 62) throw new Error(`Expected 62 senior teams; found ${teamNames.length}`);

function randomSource(label) {
  let state = crypto.createHash("sha256").update(label).digest().readUInt32LE(0) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

function shuffled(values, label) {
  const result = [...values];
  const random = randomSource(label);
  for (let index = result.length - 1; index > 0; index--) {
    const other = random() % (index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

const cohorts = [];
for (const panel of [1, 2]) {
  const teams = shuffled(teamNames, `m049-m050-realistic-20260930-senior-panel-${panel}`);
  const slots = [...teams, ...teams.slice(0, 13)];
  for (let index = 0; index < 25; index++) {
    const chosen = slots.slice(index * 3, index * 3 + 3);
    if (new Set(chosen).size !== 3) throw new Error("Duplicate team within a cohort");
    cohorts.push({
      id: `senior-panel-${panel}-${String(index + 1).padStart(2, "0")}`,
      opponents: chosen.map((teamName) => ({
        name: `A_${teamName}`,
        warriors: [1, 2].map((suffix) => `official-2025/survivors-online/${teamName}${suffix}`),
      })),
    });
  }
}

const common = {
  battles: 100,
  threads: 2,
  seeds: ["realistic-senior-fresh-20260930-9137"],
  cohorts,
  zombies: ["a", "b", "c", "d"].map((suffix) => ({
    name: `zom20${suffix}`,
    path: `official-2025/zombies-live/zom20${suffix}`,
  })),
};

const candidates = [
  {
    id: "m049",
    warriors: ["build/chimera-zero-di-elision/b_pad_a", "build/chimera-zero-di-elision/a_pad_b"],
  },
  {
    id: "m050",
    warriors: ["build/final/ChimeraA", "build/final/ChimeraB"],
  },
];
for (const candidate of candidates) {
  const config = {
    experimentId: `m049-m050-realistic-20260930-${candidate.id}`,
    outputPath: `experiments/m049-m050-realistic-20260930/${candidate.id}.json`,
    runDirectory: `build/official-runs/m049-m050-realistic-20260930/${candidate.id}`,
    candidate: { name: "COD_same_slot", warriors: candidate.warriors },
    ...common,
  };
  const target = path.join(root, `m049-m050-realistic-20260930-${candidate.id}.json`);
  fs.writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`${target}: ${cohorts.length} cohorts x ${common.battles} battles`);
}
