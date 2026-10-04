import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const resultPath = (arm) => path.join(repo, "experiments", "codex-goal-20260930", "independent-b-exact-worker-copy", `${arm}-screen.json`);
const control = JSON.parse(fs.readFileSync(resultPath("control"), "utf8"));
const variant = JSON.parse(fs.readFileSync(resultPath("variant"), "utf8"));
const jarHash = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const expectedA = "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44";
const expectedB = {
  control: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
  variant: "fa5ae469cc1217d97fcb7d33a77626fa27483ef3f57ce2c7560e16ae6ca8575e",
};
const must = (test, message) => { if (!test) throw new Error(message); };
const competitorSignatures = (run) => Object.entries(run.inputs)
  .filter(([name]) => name !== "COD_pair")
  .map(([name, files]) => [name, files.map((file) => file.sha256)]);
const zombieSignatures = (run) => run.zombies.map((z) => [z.name, z.sha256]);
const byKey = new Map();
for (const [arm, result] of [["control", control], ["variant", variant]]) {
  must(result.schemaVersion === 1 && result.engineJar?.sha256 === jarHash, `${arm}: wrong engine or schema`);
  must(result.runs?.length === 25 && result.aggregate?.battles === 500, `${arm}: incomplete 25×20 screen`);
  const seen = new Set();
  for (const run of result.runs) {
    const key = `${run.cohortId}\0${run.seed}`;
    must(!seen.has(key), `${arm}: duplicate cohort/seed`);
    seen.add(key);
    must(run.battles === 20 && Object.keys(run.inputs).length === 4, `${arm}: expected 20 four-team battles`);
    must(run.command.args.includes("--comboSize") && run.command.args[run.command.args.indexOf("--comboSize") + 1] === "4", `${arm}: not a four-team run`);
    const pair = run.inputs.COD_pair;
    must(pair?.length === 2 && pair[0].sha256 === expectedA && pair[1].sha256 === expectedB[arm], `${arm}: candidate binary hash mismatch`);
    must(Math.abs(run.candidate.teamPerBattle - run.candidate.teamRaw / 20) < 1e-9, `${arm}: candidate score mismatch`);
    if (arm === "control") byKey.set(key, run);
    else {
      const base = byKey.get(key);
      must(base, `variant has unmatched cohort/seed: ${key}`);
      must(JSON.stringify(competitorSignatures(run)) === JSON.stringify(competitorSignatures(base)), `opponents differ: ${key}`);
      must(JSON.stringify(zombieSignatures(run)) === JSON.stringify(zombieSignatures(base)), `Zombies differ: ${key}`);
      must(base.inputs.COD_pair[0].sha256 === pair[0].sha256 && run.seed === base.seed, `name/seed/A mismatch: ${key}`);
    }
  }
}
const deltas = variant.runs.map((run) => run.candidate.teamPerBattle - byKey.get(`${run.cohortId}\0${run.seed}`).candidate.teamPerBattle);
const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
const variance = deltas.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (deltas.length - 1);
const margin = 2.064 * Math.sqrt(variance / deltas.length); // t(24), approximate 95% CI
console.log(`control=${control.aggregate.teamPerBattle.toFixed(6)} variant=${variant.aggregate.teamPerBattle.toFixed(6)} delta=${mean.toFixed(6)}`);
console.log(`25-cohort approximate 95% CI [${(mean - margin).toFixed(6)}, ${(mean + margin).toFixed(6)}]; positive/negative/tied=${deltas.filter((x) => x > 0).length}/${deltas.filter((x) => x < 0).length}/${deltas.filter((x) => x === 0).length}`);
console.log("Screen only: a fresh holdout and wider opponent transfer are required before promotion.");
