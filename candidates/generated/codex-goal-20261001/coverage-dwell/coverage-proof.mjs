// Finite arithmetic check only; no game, entropy, or performance claim.
// Each completed far-call burst paints a contiguous steady trail immediately
// above its anchor. All indices here are arena offsets modulo 65536.
const gcd=(a,b)=>b?gcd(b,a%b):a;
const specs=[['m050-A',0x3c00,1024],['m050-B',0x4400,1024],
 ['short512-A',0x3c00,512],['short256-B',0x4400,256],
 ['lower-A',0x3b00,256],['lower-B',0x4300,256],
 ['upper-A',0x3d00,256],['upper-B',0x4500,256]];
for(const [name,bp,width] of specs){
 const offsets=new Uint16Array(65536),anchors=65536/gcd(bp,65536);
 let p=0x10a2;
 for(let cycle=0;cycle<anchors;cycle++){
  p=(p-bp)&65535;
  for(let i=0;i<width;i++)offsets[(p-0x40+i)&65535]++;
 }
 if(p!==0x10a2)throw Error('Anchor period');
 const painted=offsets.reduce((n,v)=>n+(v>0),0),maximum=Math.max(...offsets);
 if((name.startsWith('lower')||name.startsWith('upper'))&&(painted!==65536||maximum!==1))throw Error('Full coverage conjecture failed');
 console.log(JSON.stringify({name,stride:bp,width,anchorsPerPeriod:anchors,paintedBytes:painted,maximumWritesPerByte:maximum,
  caveat:'Undisturbed completed-burst arithmetic only. Does not include interrupted bursts, startup, speed, hostile writes or team score.'}));
}
