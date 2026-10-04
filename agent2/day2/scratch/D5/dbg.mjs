import { battle, KINDS, mkA, mkB, TPL } from "./fsim.mjs";
const parse = (k) => KINDS[k] || eval(k);
const [ours="rev1", opp="V6", qs="0,1,2,3", ord="0"] = process.argv.slice(2);
const q = qs.split(",").map(Number);
const res = battle([{ name: "C", streams: parse(ours), size: [214, 222] }, { name: "T", streams: parse(opp), size: [221, 202] }], 1, { rounds: 200000, qs: [[q[0], q[1]], [q[2], q[3]]], order: ord === "0" ? [0, 1] : [1, 0], log: true });
for (const p of res.procs) console.log(p.name, "T", p.T.toString(16), "P", ((p.T - 0x50) & 0xffff).toString(16), "idx", (((p.T - 0x52 - 0x50) & 0xffff) >> 10) );
for (const d of res.deaths) console.log("death", res.procs[d.p].name, "r", d.r, d.why, "by", d.by >= 0 ? res.procs[d.by].name : "-", "at", d.at.toString(16));
console.log("score", res.score, "end", res.end);
