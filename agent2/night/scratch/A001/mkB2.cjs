const fs=require("fs");let s=fs.readFileSync("agent2/night/revisions/rev0/B.asm","utf8").replace(/\r/g,"");
const rep=(a,b)=>{if(!s.includes(a))throw new Error("missing "+a);s=s.replace(a,b);};
rep("operand widths.\n","operand widths.\n; A001 (night 2026-10-03): startup trimmed, same targets: 16-bit band math on the\n; main path, dead mov dx,[4A17h]/and/or -> mov dx,0FFBh, mov sp,di/add sp -> lea.\n");
rep("    cld\n    mov ax, si\n    mov al, ah\n    xor ah, ah\n    mov ch, 03Ch\n    div ch\n    mul ch\n    mov ah, al\n    add ah, 10h\n    mov al, 0A2h\n","    cld\n    xor dx, dx\n    mov ax, si\n    mov cx, 03C00h\n    div cx\n    lea ax, [si + 10A2h]\n    sub ax, dx\n");
rep("    mov dx, [4A17h]\n","");
rep("    and dx, 0\n    or dx, 0FFBh\n","    mov dx, 0FFBh\n");
rep("    mov sp, di\n    add sp, 00600h\n","    lea sp, [di + 0600h]\n");
fs.writeFileSync("agent2/night/scratch/A001/B2.asm",s);
