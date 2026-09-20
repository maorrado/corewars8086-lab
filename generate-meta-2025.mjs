import fs from "node:fs";

const selected = [];
for (let index = 1; index <= 8; index += 1) {
  const id = String(index).padStart(2, "0");
  const payload = JSON.parse(fs.readFileSync(`experiments/2025-pool-${id}.json`, "utf8"));
  const scores = new Map(
    payload.result.table.trim().split("\n").slice(1).map((line) => {
      const cells = line.split(",").map((cell) => cell.trim());
      return [cells[0], Number(cells[1])];
    }),
  );
  selected.push(
    ...payload.resolvedTeams
      .map((team) => ({
        ...team,
        warriors: team.warriors.map((warrior) => warrior.replace(/^\.\.[\\/]/, "")),
      }))
      .sort((a, b) => (scores.get(b.name) ?? -1) - (scores.get(a.name) ?? -1))
      .slice(0, 1),
  );
}

selected.push(
  {
    name: "2024_TOM_ATO",
    warriors: [
      "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO1",
      "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO2",
    ],
  },
  {
    name: "2024_HLS_segment_fault",
    warriors: [
      "repos/corewars8086-survivors/cgx2024/05-final2/HLS_segment_fault1",
      "repos/corewars8086-survivors/cgx2024/05-final2/HLS_segment_fault2",
    ],
  },
  {
    name: "2024_HRZ_JMP2HELL",
    warriors: [
      "repos/corewars8086-survivors/cgx2024/05-final2/HRZ_JMP2HELL1",
      "repos/corewars8086-survivors/cgx2024/05-final2/HRZ_JMP2HELL2",
    ],
  },
);

const config = {
  battles: 300,
  seed: "meta-2025-top8-plus-2024-v1",
  quiet: true,
  outputPath: "experiments/2025-meta-top8-plus-2024.json",
  teams: selected,
  zombieDirectories: [{ path: "official-2025/zombies-live" }],
};
fs.writeFileSync("config-2025-meta.json", `${JSON.stringify(config, null, 2)}\n`);
console.log(selected.map((team) => team.name).join("\n"));
