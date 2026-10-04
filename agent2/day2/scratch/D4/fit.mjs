import { sim } from "./absim.mjs";
const obs = [[0,0,1545],[0,3,40300],[1,0,38108],[3,1,10296],[0,1,36450],[2,3,36450],[0,2,38375],[3,0,34276],[0,4,30133]];
for (const bFirst of [false, true]) for (const sa of [55,56,57]) for (const sb of [58,59,60,61]) {
  const cfg = { A: { dx: 0x4000, bp: 0x4400, gap: 0x100, cx: 9, start: sa, seg: 0xffb }, B: { dx: 0x2400, bp: 0x2c00, gap: 0x600, cx: 8, start: sb, seg: 0xffb } };
  const res = obs.map(([a,b,r]) => { const e = sim(a,b,{rounds:120000,cfg,bFirst,stopOnA:true}); return `${a}${b}:${e.A?e.A.r+'/'+e.A.why:'-'}(${r})`; });
  console.log(bFirst?'Bfirst':'Afirst', sa, sb, res.join(' '));
}
