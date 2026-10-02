// agent2 opponent fields, zombie packs, and deterministic cohort generation.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const rel = (p) => path.relative(root, p).split(path.sep).join("/");

function pairsFromDir(dir, prefix) {
  const abs = path.join(root, dir);
  const names = fs.readdirSync(abs).filter((f) => fs.statSync(path.join(abs, f)).isFile());
  const bases = new Map();
  for (const n of names) {
    const m = n.match(/^(.*)([12])$/);
    if (!m) continue;
    if (!bases.has(m[1])) bases.set(m[1], {});
    bases.get(m[1])[m[2]] = rel(path.join(abs, n));
  }
  const teams = [];
  for (const [b, w] of [...bases].sort()) {
    const ws = [w["1"], w["2"]].filter(Boolean);
    teams.push({ name: `${prefix}${b}`.replace(/[12]$/, (d) => d + "_"), warriors: ws });
  }
  return teams;
}

export const field2025 = () => [...pairsFromDir("official-2025/survivors-online", "A_"), ...pairsFromDir("official-2025/survivors-online-young", "Y_")];
export const field2025senior = () => pairsFromDir("official-2025/survivors-online", "A_");
export const field2024live = () => pairsFromDir("repos/corewars8086-survivors/cgx2024/03-live", "L24_");
export const field2024final = () => pairsFromDir("repos/corewars8086-survivors/cgx2024/05-final2", "F24_");
export const field2023final = () => pairsFromDir("repos/corewars8086-survivors/cgx2023/phase3", "F23_");

export const counters = () => [
  { name: "K_GoodTestV6", warriors: ["study-notes/good-test-v6/original-binaries/Good_Test_V6_1", "study-notes/good-test-v6/original-binaries/Good_Test_V6_2"] },
  { name: "K_FixedToggle", warriors: ["agent2/build/counter/FTA", "agent2/build/counter/FTB"] },
  { name: "K_Synthesis", warriors: ["agent2/build/counter/SYA", "agent2/build/counter/SYB"] },
];
export const peers = () => [
  { name: "P_m050", warriors: ["agent2/build/ref/ChimeraA", "agent2/build/ref/ChimeraB"] },
  { name: "P_b01d", warriors: ["agent2/build/ref/b01dA", "agent2/build/ref/b01dB"] },
  { name: "P_e1p4", warriors: ["agent2/build/ref/e1p4A", "agent2/build/ref/e1p4B"] },
  { name: "P_zrl03", warriors: ["agent2/build/ref/zrl03A", "agent2/build/ref/zrl03B"] },
];

const zdir = (d, names) => names.map((n) => ({ name: n, path: `${d}/${n}` }));
export const zombies = {
  z2025: zdir("official-2025/zombies-live", ["zom20a", "zom20b", "zom20c", "zom20d"]),
  z2024: zdir("repos/corewars8086-survivors/cgx2024/zombies/final", ["zom19a", "zom19b", "zom19c", "zom19d", "zom19g", "zom19h"]),
  z2023: zdir("repos/corewars8086-survivors/cgx2023/zombies", ["zom18a", "zom18b", "zom18c", "zom18d", "zom18e", "zom18f", "zom18g", "zom18h"]),
  none: [],
};

// deterministic PRNG from a salt string
export function rng(salt) {
  let h = crypto.createHash("sha256").update(salt).digest();
  let i = 0;
  return () => {
    if (i + 4 > h.length) { h = crypto.createHash("sha256").update(h).digest(); i = 0; }
    const v = h.readUInt32LE(i); i += 4; return v / 2 ** 32;
  };
}
export function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Partition `teams` into cohorts of `size` opponents; leftovers are filled from the start of a second shuffle.
export function partition(teams, size, salt) {
  const r = rng(salt);
  const a = shuffle(teams, r);
  const out = [];
  for (let i = 0; i < a.length; i += size) {
    const c = a.slice(i, i + size);
    if (c.length < size) {
      const extra = shuffle(teams.filter((t) => !c.includes(t)), r);
      while (c.length < size) c.push(extra.shift());
    }
    out.push(c);
  }
  return out;
}
export const seedFor = (salt, k) => `a2-${crypto.createHash("sha256").update(`${salt}/${k}`).digest("hex").slice(0, 16)}`;
