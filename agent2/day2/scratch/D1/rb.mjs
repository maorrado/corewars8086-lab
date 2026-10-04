// Rebuild-phase deaths of A/B: was the rebuild self-triggered (SP == anchor) or early (foreign A4)?
// Killer class and killer trail-word geometry relative to the victim.
import fs from "node:fs"; import path from "node:path";
const dir = process.argv[2]; const ours = new Set(["CAND1", "CAND2"]);
const t = {}; const add = (k) => t[k] = (t[k] ?? 0) + 1;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, f), "utf8").trim().split("\n")) {
    const d = JSON.parse(line);
    if (d.warEnd !== undefined || d.group !== "CAND" || !d.hist?.length) continue;
    const H = d.hist.map(h => { const m = h.match(/^r(\d+) (\w+):(\w+) sp=(\w+) di=(\w+) si=(\w+) cx=(\w+) dx=(\w+) (\S+)$/); return m && { r: +m[1], cs: m[2], ip: parseInt(m[3], 16), sp: parseInt(m[4], 16), code: m[9] }; }).filter(Boolean);
    // find the trigger: first entry executing A4 at an anchor ip (ip ends with a2) after ff1f entries
    let trig = -1; for (let i = H.length - 1; i >= 0; i--) if (H[i].cs === "0ffb" && (H[i].ip & 0xff) === 0xa2 && H[i].code.startsWith("a4")) { trig = i; break; }
    if (trig < 0) continue;
    const anc = (H[trig].ip - 0x50) & 0xffff; const self = H[trig].sp === anc;
    const captured = new Set(d.alive.filter(a => a.z && ours.has(a.ipBy)).map(a => a.n));
    const win = d.bytes.slice(0, 8).filter(b => !b.oob);
    const cand = win.filter(b => b.by !== d.name && b.r >= 0 && b.by !== "init" && b.by !== "load").sort((a, b) => b.r - a.r);
    const kb = cand[0]?.by ?? "none";
    const kc = ours.has(kb) ? "partner" : kb.startsWith("zom") ? (captured.has(kb) ? "ourZ" : "zom") : kb === "none" ? "none" : "opp";
    const dt = d.round - H[trig].r;
    add(`${d.name} ${self ? "self-trig " : "early-trig"} killer=${kc}`);
  }
}
for (const [k, v] of Object.entries(t).sort()) console.log(String(v).padStart(4), k);
