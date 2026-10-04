// B065: infer opponents' call-far trail words (IP,CS) from fatal-byte records in existing traces.
// anchor in-page offset = (CS*16 + IP - 2) & 0xFF (2-byte self-call), relative to rev0 lattice 52h.
import fs from "node:fs"; import path from "node:path";
const dirs = fs.readdirSync("agent2/night/scratch/_trace").map((d) => "agent2/night/scratch/_trace/" + d);
const tally = {};
for (const dir of dirs) for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line); if (!d.bytes) continue;
    const b = d.bytes;
    for (let i = 0; i + 3 < b.length; i++) {
      const w = b.slice(i, i + 4); if (new Set(w.map((x) => x.by)).size !== 1) continue;
      const by = w[0].by; const ip = w[0].v | (w[1].v << 8), cs = w[2].v | (w[3].v << 8);
      if (cs < 0x0f00 || cs > 0x10ff || cs === 0x1000 && ip === 0x1000) continue;
      const lat = ((cs * 16 + ip - 2) & 0xff);
      const k = `${by}\tCS=${cs.toString(16)}\tIPlo=${(ip & 0xff).toString(16)}\tlat=${lat.toString(16)}`;
      tally[k] = (tally[k] ?? 0) + 1;
    }
  }
}
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) if (n >= 2) console.log(String(n).padStart(4), k);
