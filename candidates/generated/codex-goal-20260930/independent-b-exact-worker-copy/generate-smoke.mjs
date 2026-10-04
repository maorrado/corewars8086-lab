import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../../../");
const screen = JSON.parse(fs.readFileSync(path.join(here, "screen-control.json"), "utf8"));
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const known = {
  oldA: "0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44",
  oldB: "06b5a1ff7bac4b146620de6d1de512dfedf3f28366d6435bf61d49869d971782",
  newA: "f6e812ec070fa025c73244f14c52832d492d6ffc6c77d732b1ef6e77381bff01",
  newB: "fa5ae469cc1217d97fcb7d33a77626fa27483ef3f57ce2c7560e16ae6ca8575e",
};
const oldA = screen.candidate.warriors[0];
const oldB = screen.candidate.warriors[1];
const newA = path.join(repo, "build", "codex-goal-20260930", "independent-a-worker-cl8", "A");
const newB = path.join(repo, "build", "codex-goal-20260930", "independent-b-exact-worker-copy", "B");
for (const [file, hash] of [[oldA, known.oldA], [oldB, known.oldB], [newA, known.newA], [newB, known.newB]]) {
  if (sha256(file) !== hash) throw new Error(`smoke input hash mismatch: ${file}`);
}
const opponentsByName = new Map(screen.cohorts.flatMap((c) => c.opponents).map((team) => [team.name, team]));
const opponentNames = ["A_HRZ_Registered_Winners", "A_HRZ_Code_Jokers4Life", "A_TOM_2B2Team"];
const opponents = opponentNames.map((name) => {
  const team = opponentsByName.get(name);
  if (!team?.warriors?.every(fs.existsSync)) throw new Error(`missing published 2025 opponent: ${name}`);
  return team;
});
const seed = "codex-goal-independent-worker-copy-smoke-20260930-9173";
for (const [arm, a, b, directory] of [
  ["control", oldA, oldB, here],
  ["b-cl8", oldA, newB, here],
  ["a-cl8", newA, oldB, path.join(repo, "candidates", "generated", "codex-goal-20260930", "independent-a-worker-cl8")],
]) {
  const config = {
    ...screen,
    experimentId: `codex-goal-independent-worker-copy-${arm}-smoke-20260930`,
    outputPath: path.join(repo, "experiments", "codex-goal-20260930", "independent-worker-copy-smoke", `${arm}.json`),
    runDirectory: path.join(repo, "build", "official-runs", "codex-goal-20260930", "independent-worker-copy-smoke", arm),
    battles: 20,
    threads: 1,
    seeds: [seed],
    candidate: { ...screen.candidate, name: "COD_pair", warriors: [a, b] },
    cohorts: [{ id: "three-published-2025-smoke", opponents }],
  };
  const configPath = path.join(directory, `smoke-${arm}.json`);
  if (fs.existsSync(configPath) || fs.existsSync(config.outputPath) || fs.existsSync(config.runDirectory)) {
    throw new Error(`refusing to overwrite ${arm} smoke artifacts`);
  }
  fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
  console.log(`${arm}: ${configPath}`);
}
