import fs from "node:fs";
import path from "node:path";

const candidateFiles = fs.readdirSync("candidates/generated")
  .filter((name) => name.endsWith(".asm"))
  .sort();

const opponents = [
  ["GSA_callfart", "official-2025/survivors-online/GSA_callfart1", "official-2025/survivors-online/GSA_callfart2"],
  ["HRZ_Grindo_Holics", "official-2025/survivors-online/HRZ_Grindo_Holics1", "official-2025/survivors-online/HRZ_Grindo_Holics2"],
  ["HRZ_Registered_Winners", "official-2025/survivors-online/HRZ_Registered_Winners1", "official-2025/survivors-online/HRZ_Registered_Winners2"],
  ["2024_HLS_segment_fault", "repos/corewars8086-survivors/cgx2024/05-final2/HLS_segment_fault1", "repos/corewars8086-survivors/cgx2024/05-final2/HLS_segment_fault2"],
  ["2024_TOM_ATO", "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO1", "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO2"],
].map(([name, one, two]) => ({ name, warriors: [one, two] }));

const groups = [];
for (let index = 0; index < candidateFiles.length; index += 4) {
  groups.push(candidateFiles.slice(index, index + 4));
}
fs.mkdirSync("candidate-sweep-configs", { recursive: true });
groups.forEach((files, index) => {
  const id = String(index + 1).padStart(2, "0");
  const candidates = files.map((file) => ({
    name: `candidate_${path.basename(file, ".asm")}`,
    asmWarriors: [`../candidates/generated/${file}`, `../candidates/generated/${file}`],
  }));
  const config = {
    battles: 30,
    seed: `candidate-sweep-${id}-v1`,
    quiet: true,
    outputPath: `../experiments/candidate-sweep-${id}.json`,
    teams: [
      ...candidates,
      ...opponents.map((team) => ({
        ...team,
        warriors: team.warriors.map((warrior) => `../${warrior}`),
      })),
    ],
    zombieDirectories: [{ path: "../official-2025/zombies-live" }],
  };
  fs.writeFileSync(
    `candidate-sweep-configs/sweep-${id}.json`,
    `${JSON.stringify(config, null, 2)}\n`,
  );
});
console.log(`generated ${groups.length} sweep configurations`);
