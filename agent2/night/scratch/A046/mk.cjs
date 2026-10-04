// A046: build hybrid candidate sources from zchain4 / rev0 by exact line edits
const fs=require('fs');
function edit(src, out, header, reps){
  const lines=fs.readFileSync(src,'utf8').split(/\r?\n/);
  for(const [re,repl,nth] of reps){
    let n=0, done=false;
    for(let i=0;i<lines.length;i++){ if(re.test(lines[i])){ if(n===(nth||0)){lines[i]=repl;done=true;break;} n++; } }
    if(!done) throw new Error(out+': no match '+re);
  }
  lines.splice(1,0,...header);
  fs.writeFileSync(out,lines.join('\n'));
}
const Z='../../refs/zchain4/', R='../../revisions/rev0/';
// HZ: zchain4 A (phase 2Ch) + rev0 B routed to [0CC13h]
edit(Z+'A.asm','HZ_A.asm',['; A046 hybrid HZ: zchain4 A (agent2 Chimera/zrl03 lineage) paired with a Good_Test V6 (friend-provided) rev0 B.','; Only change vs zchain4 A: band phase 10h -> 2Ch (rev0 B also uses 10h; avoids identical first anchors).'],
 [[/^    add ah, 010h/,'    add ah, 02Ch']]);
edit(R+'B.asm','HZ_B.asm',['; A046 hybrid HZ: rev0 B with its startup b/d capture changed to zchain4 B\'s (0F EB F9 CC -> 0F FF 26 13 = jmp [0CC13h]),','; so the captured b/d enters zchain4 A\'s zombie chain; the search also skips HZ_A\'s EB F9 decoy at FFECh.'],
 [[/^    mov ax, 0F9EBh/,'    mov ax, 0EB0Fh'],[/^    mov dx, 0CCCCh/,'    mov dx, 0CCF9h'],[/^    mov bx, 026FFh/,'    mov bx, 0FF0Fh'],[/^    mov cx, 04A17h/,'    mov cx, 01326h']]);
// HAb: rev0 A with zchain4 A phoenix parameters (cell 200h, gap 1F0h, CX 8, step 3800h/3C00h), phase kept 2Ch
edit(R+'A.asm','HAb_A.asm',['; A046 hybrid HAb: Good_Test V6 (friend-provided) rev0 A startup/zom20a capture + zchain4 A replicator parameters.'],
 [[/^    mov bx, 002C0h/,'    mov bx, 00200h'],[/^    add sp, 00100h/,'    add sp, 001F0h'],[/^    mov cx, 9$/,'    mov cx, 8',1],[/^    mov dx, 04000h/,'    mov dx, 03800h'],[/^    mov bp, 04400h/,'    mov bp, 03C00h']]);
// HBb: rev0 B with zchain4 B replicator parameters (phase 70h, cell 240h, gap 270h, CX 9, step 4000h/4400h); zombies share phoenix_init
edit(R+'B.asm','HBb_B.asm',['; A046 hybrid HBb: Good_Test V6 (friend-provided) rev0 B zombie protocol + zchain4 B replicator parameters (shared by captured zombies).'],
 [[/^    add ah, 10h/,'    add ah, 70h'],[/^    mov bx, 0280h/,'    mov bx, 0240h'],[/^    add sp, 00600h/,'    add sp, 00270h'],[/^    mov cx, 8$/,'    mov cx, 9'],[/^    mov dx, 02400h/,'    mov dx, 04000h'],[/^    mov bp, 02C00h/,'    mov bp, 04400h']]);
