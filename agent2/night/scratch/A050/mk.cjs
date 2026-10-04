const fs=require('fs');
const src=fs.readFileSync('agent2/night/revisions/rev0/B.asm','utf8');
function make(name,npass){
const hdr=`; A050 (wave 10) candidate ${name}: captured zombies become page-lattice snipers.
; Base: rev0 = V6nohunt (Good_Test V6, friend-provided code; [7A00h] patch removed by agent2).
; Change (agent2/A050): every captured zombie, after its INT 87h and get_ip, runs ${npass} passes
; of a page-lattice CC bomber over all pages except the two pages holding B's body, writing
; CCCCh at in-page offsets A3h (cgx123123, TOM_Code_Killer), 03h (TrojanByte1, Baltika91),
; C1h (TOMEX/BatteringRAM/B33/3Plate/Chargers/K0F1M), E3h (TrojanByte2), 32h (zrl03/ah02),
; then falls into the unchanged phoenix (replicator) path. Our own lattice (52h..65h) is never hit.
`;
const old=`    pop si
    sub si, strict word get_ip - start
`;
const nw=old+`sniper:
    push cs
    pop ds
    mov bx, si
    mov bl, 80h
    add bh, 2
    mov ax, 0CCCCh
    mov dx, ${npass}
sn_pass:
    mov cx, 254
sn_page:
    mov [bx + 23h], ax
    mov [bx + 41h], ax
    mov [bx + 63h], ax
    mov [bx - 7Dh], ax
    mov [bx - 4Eh], ax
    inc bh
    loop sn_page
    add bh, 2
    dec dx
    jnz sn_pass
`;
if(!src.includes(old)) throw 1;
fs.writeFileSync(`agent2/night/scratch/A050/${name}.asm`, src.replace('bits 16\n','bits 16\n'+hdr).replace(old,nw));
}
make('SN_B',6);
make('SN1_B',1);
// control: identical layout/timing, the 5 bomb writes become harmless reads (mov ax,[bx+d8]), 1 pass
{
  const s=fs.readFileSync('agent2/night/scratch/A050/SN1_B.asm','utf8');
  let c=s.replace(/    mov \[bx ([+-]) ([0-9A-F]+h)\], ax\n/g,'    mov ax, [bx $1 $2]\n')
         .replace('candidate SN1_B: captured zombies become page-lattice snipers.','control SN1ctl_B: SN1_B layout and timing, bomb writes replaced by reads (no bombs).');
  if((c.match(/mov ax, \[bx/g)||[]).length!==5) throw 2;
  fs.writeFileSync('agent2/night/scratch/A050/SN1ctl_B.asm',c);
}
