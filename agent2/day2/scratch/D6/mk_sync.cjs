const fs=require("fs");
let a=fs.readFileSync("A_late.asm","utf8");
const hdr="; D6 SYNC (day2 agent D6): LATE + A's phoenix_init delayed from r22 to r29 by 7 nops after the E1 INT86 block, so A\n; reaches its replicator on the same round as Good_Test V6 / V4 warrior A (r29; V6Guard r25 when [7A00h]=CCCCh,\n; V6nohunt r22). Test of the D6 screens' finding that de-synchronising B from the V6-family B (FAST) costs ~0.1\n; per V6-family cohort. INT87 (r11), [1243h] read (r4), E1 block and B are unchanged from LATE.\n";
const old="    int 086h                        ; 15\n";
if(!a.includes(old)) throw "A";
a=hdr+a.replace(old,old+"    times 7 nop                     ; D6 SYNC: 16-22, phoenix_init r29 (= V6/V4 A)\n");
fs.writeFileSync("A_sync.asm",a);
