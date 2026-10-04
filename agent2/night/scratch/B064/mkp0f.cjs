const fs=require('fs');let s=fs.readFileSync('agent2/night/revisions/rev0/B.asm','utf8').replace(/\r/g,'');
const hdr='; B064 (night wave 3, domain 4): rev0 B (Good_Test V6 warrior 2, friend-provided; V6nohunt base by agent2)\n; change p0f: both b/d searches use the decoy-immune window 0F EB F9 CC (the byte before every\n; zom20b/d tail is 0Fh = high byte of add di,0FFEh; planted/static field decoys are preceded by CC/A5/0B/F9),\n; replacement 0F FF 26 17 -> tail becomes jmp [0CC17h] (tail+3 stays CCh); zombie_entry also written to [0CC17h].\n; push cs/pop es replaced by les di,[si+es_ptr] (dw 0,1000h) so the startup INT 87h stays the 12th instruction.\n';
s=hdr+s;
const r=(a,b)=>{if(!s.includes(a))throw new Error('missing '+a);s=s.split(a).join(b)};
r('    push cs\n    mov [5D13h], bx\n    pop es\n','    mov [5D13h], bx\n    mov [0CC17h], bx        ; B064: hook cell for the 0F EB F9 CC capture\n    les di, [si + es_ptr - start] ; B064: ES=1000h (arena), DI=0 (as before)\n');
r('    mov ax, 0F9EBh\n    mov dx, 0CCCCh\n    mov bx, 026FFh\n    mov cx, 04A17h\n','    mov ax, 0EB0Fh\n    mov dx, 0CCF9h\n    mov bx, 0FF0Fh\n    mov cx, 01726h\n');
r('    jmp short phoenix_init\n\nzombie_entry:','    jmp short phoenix_init\n\nes_ptr:\n    dw 0000h, 01000h\n\nzombie_entry:');
fs.writeFileSync(process.argv[2],s);
