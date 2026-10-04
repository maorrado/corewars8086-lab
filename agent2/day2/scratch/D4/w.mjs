import { sim } from "./absim.mjs";
const [qa, qb, r0, r1, st] = process.argv.slice(2).map(Number);
const e = sim(qa, qb, { rounds: r1, watch: [r0, r1, st || 1] }); console.log(JSON.stringify(e));
