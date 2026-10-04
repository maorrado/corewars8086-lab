// A035 lane model: B (trail 800h) and 1:1-locked captured zombies (trail 1048h), all step 2C00h, on the 400h lattice.
// Offsets in lattice slots (400h). Lethal B-zombie offsets dZ = Z-P: B trail covers zombie anchor (dZ=+1), merge (0),
// zombie trail covers B anchor (dZ=-1..-4). Zombie-zombie: both trails 1048h -> |dz|<=4.
const mod = (x) => ((x % 64) + 64) % 64;
const lethB = new Set([60, 61, 62, 63, 0, 1]);
const lethZ = new Set([60, 61, 62, 63, 0, 1, 2, 3, 4]);
function rangeOK(d, leth, lo = -6, hi = 6) { // largest symmetric-ish window of lag n around {0,1} that stays safe
  let a = 0, b = 0;
  if (leth.has(mod(d)) || leth.has(mod(d - 11))) return [null, null];
  while (a > lo && !leth.has(mod(d - 11 * (a - 1)))) a--;
  while (b < hi && !leth.has(mod(d - 11 * (b + 1)))) b++;
  return [a, b];
}
const res = [];
for (let da = 0; da < 64; da++) for (let db = 0; db < 64; db++) {
  const pa = mod(da + 4), pb = mod(db + 4); // phase slots (phase = D + 1000h)
  // first anchor must avoid B code pages [band, band+3Eh] -> slots 0..15 of the phase
  if (pa < 16 || pb < 16) continue;
  const [a1, b1] = rangeOK(da, lethB), [a2, b2] = rangeOK(db, lethB);
  if (a1 === null || a2 === null) continue;
  // zombie-zombie lag m in -2..2 must be safe
  let zz = 0; for (const m of [-1, 0, 1]) if (lethZ.has(mod(da - db - 11 * m))) zz++;
  let zz2 = 0; for (const m of [-2, 2]) if (lethZ.has(mod(da - db - 11 * m))) zz2++;
  if (zz) continue;
  const score = Math.min(-a1, b1) + Math.min(-a2, b2) - zz2;
  res.push({ score, pa: (pa * 0x400).toString(16), pb: (pb * 0x400).toString(16), A: [a1, b1], B: [a2, b2], zz2 });
}
res.sort((x, y) => y.score - x.score);
console.log(res.slice(0, 15).map(r => JSON.stringify(r)).join('\n'));
// rev0 phases and z1000 phases for reference
for (const [pa, pb] of [[0x2000, 0x3400]]) {
  const da = mod(pa / 0x400 - 4), db = mod(pb / 0x400 - 4);
  console.log('z1000-phases', 'zom20a lag0/1 offsets', mod(da), mod(da - 11), lethB.has(mod(da)) || lethB.has(mod(da - 11)), 'b/d', mod(db), mod(db - 11), lethB.has(mod(db)) || lethB.has(mod(db - 11)));
}
