import fs from "node:fs";

const variants = [
  ["a", "1113", "888B"],
  ["b", "2347", "BEF1"],
  ["c", "4003", "C003"],
  ["d", "5557", "AAA9"],
  ["e", "7F03", "DDAF"],
];
const survivor = (offset) => `bits 16

start:
    mov bx, ax
    push ds
    pop ss
    push ds
    pop es
    mov sp, bx
    add sp, 0${offset}h
    mov di, sp
    mov ax, 0AB50h
    push ax
    jmp sp
`;

for (const [name, first, second] of variants) {
  const one = `candidates/generated/v010_${name}_1_${first}.asm`;
  const two = `candidates/generated/v010_${name}_2_${second}.asm`;
  fs.writeFileSync(one, survivor(first));
  fs.writeFileSync(two, survivor(second));
  const config = {
    battles: 40,
    seed: `v010-sweep-${name}`,
    outputPath: `experiments/v010-sweep-${name}.json`,
    quiet: true,
    teams: [
      { name: `candidate_v010_${name}`, asmWarriors: [one, two] },
      { name: "GSA_callfart", warriors: ["official-2025/survivors-online/GSA_callfart1", "official-2025/survivors-online/GSA_callfart2"] },
      { name: "HRZ_Grindo_Holics", warriors: ["official-2025/survivors-online/HRZ_Grindo_Holics1", "official-2025/survivors-online/HRZ_Grindo_Holics2"] },
      { name: "HRZ_Registered_Winners", warriors: ["official-2025/survivors-online/HRZ_Registered_Winners1", "official-2025/survivors-online/HRZ_Registered_Winners2"] },
      { name: "2024_TOM_ATO", warriors: ["repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO1", "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO2"] },
    ],
    zombieDirectories: [{ path: "official-2025/zombies-live" }],
  };
  fs.writeFileSync(`config-v010-sweep-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}

for (const [name, one, two] of [
  ["f", "candidates/generated/v010_c_1_4003.asm", "candidates/generated/v010_c_1_4003.asm"],
  ["g", "candidates/generated/v010_d_1_5557.asm", "candidates/generated/v010_c_2_C003.asm"],
  ["h", "candidates/generated/v010_c_1_4003.asm", "candidates/generated/v010_d_2_AAA9.asm"],
]) {
  const config = {
    battles: 60,
    seed: `v010-sweep-${name}`,
    outputPath: `experiments/v010-sweep-${name}.json`,
    quiet: true,
    teams: [
      { name: `candidate_v010_${name}`, asmWarriors: [one, two] },
      { name: "GSA_callfart", warriors: ["official-2025/survivors-online/GSA_callfart1", "official-2025/survivors-online/GSA_callfart2"] },
      { name: "HRZ_Grindo_Holics", warriors: ["official-2025/survivors-online/HRZ_Grindo_Holics1", "official-2025/survivors-online/HRZ_Grindo_Holics2"] },
      { name: "HRZ_Registered_Winners", warriors: ["official-2025/survivors-online/HRZ_Registered_Winners1", "official-2025/survivors-online/HRZ_Registered_Winners2"] },
      { name: "2024_TOM_ATO", warriors: ["repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO1", "repos/corewars8086-survivors/cgx2024/05-final2/TOM_ATO2"] },
    ],
    zombieDirectories: [{ path: "official-2025/zombies-live" }],
  };
  fs.writeFileSync(`config-v010-sweep-${name}.json`, `${JSON.stringify(config, null, 2)}\n`);
}
