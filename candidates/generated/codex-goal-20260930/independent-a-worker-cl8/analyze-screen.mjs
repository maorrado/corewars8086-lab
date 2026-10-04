import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const control = read(path.join(repo, "experiments", "codex-goal-20260930", "independent-b-exact-worker-copy", "control-screen.json"));
const variant = read(path.join(repo, "experiments", "codex-goal-20260930", "independent-a-worker-cl8", "variant-screen.json"));
const must = (ok, message) => { if (!ok) throw new Error(message); };
const engine = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
const controlHashes = ["0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44", "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782"];
const variantHashes = ["f6e812ec070fa025c73244f14c52832d492d6ffc6c77d732b1ef6e77381bff01", controlHashes[1]];
const key = (run) => `${run.cohortId}\0${run.seed}`;
const opponents = (run) => Object.entries(run.inputs).filter(([name]) => name !== "COD_pair").map(([name, files]) => [name, files.map((f) => f.sha256)]);
const zombies = (run) => run.zombies.map((z) => [z.name, z.sha256]);
const base = new Map();
for (const [arm, result, hashes] of [["control", control, controlHashes], ["variant", variant, variantHashes]]) {
  must(result.engineJar?.sha256 === engine && result.runs?.length === 25 && result.aggregate?.battles === 500, `${arm}: incomplete or wrong engine`);
  const seen = new Set();
  for (const run of result.runs) {
    must(!seen.has(key(run)) && run.battles === 20 && Object.keys(run.inputs).length === 4, `${arm}: duplicate or invalid run`);
    seen.add(key(run));
    must(run.inputs.COD_pair?.map((f) => f.sha256).join("/") === hashes.join("/"), `${arm}: candidate hashes differ`);
    if (arm === "control") base.set(key(run), run);
    else {
      const c = base.get(key(run));
      must(c && JSON.stringify(opponents(c)) === JSON.stringify(opponents(run)) && JSON.stringify(zombies(c)) === JSON.stringify(zombies(run)), `unmatched opponent/Zombie block: ${key(run)}`);
    }
  }
}
const differences = variant.runs.map((run) => run.candidate.teamPerBattle - base.get(key(run)).candidate.teamPerBattle);
const mean = differences.reduce((a, b) => a + b, 0) / 25;
const variance = differences.reduce((a, x) => a + (x - mean) ** 2, 0) / 24;
const margin = 2.064 * Math.sqrt(variance / 25);
console.log(`control=${control.aggregate.teamPerBattle.toFixed(6)} A_CL8=${variant.aggregate.teamPerBattle.toFixed(6)} delta=${mean.toFixed(6)}`);
console.log(`approximate 25-cohort CI [${(mean - margin).toFixed(6)}, ${(mean + margin).toFixed(6)}]; positive/negative/tied=${differences.filter((x) => x > 0).length}/${differences.filter((x) => x < 0).length}/${differences.filter((x) => x === 0).length}`);
console.log("Screen only: fresh holdout required before any promotion.");
