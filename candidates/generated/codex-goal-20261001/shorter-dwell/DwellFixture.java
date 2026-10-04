import java.nio.file.*;
import java.util.*;

/** Reuses the frozen original-engine inert recurrence harness, not overlays. */
public final class DwellFixture {
    static void check(boolean ok,String text){if(!ok)throw new AssertionError(text);}
    static int paired=0,healthy=0,oldUnhealthy=0;
    static void compare(byte[] baseline,byte[] variant,boolean a,boolean captured,int offset,int margin)throws Exception{
        WorkerRecurrenceFixture.Run old=WorkerRecurrenceFixture.execute(baseline,false,a,captured,offset);
        WorkerRecurrenceFixture.Run next=WorkerRecurrenceFixture.execute(variant,false,a,captured,offset);
        paired++;
        if(old.fault!=null){
            check(next.fault!=null,"baseline unhealthy path unexpectedly changed; inspect separately");
            check(old.fault.split(":",2)[0].equals(next.fault.split(":",2)[0]),"baseline fault category changed");
            oldUnhealthy++;return;
        }
        check(next.fault==null,"new unhealthy path: load="+offset+" A="+a+" captured="+captured+" margin="+margin+" "+next.fault);
        check(old.events.size()==5&&next.events.size()==5,"five generations");
        for(int i=0;i<5;i++){
            WorkerRecurrenceFixture.Event x=old.events.get(i),y=next.events.get(i);
            check(x.pointer==y.pointer,"unchanged anchor sequence");
            for(int r:new int[]{0,1,2,4,5,6,8,9,10,11,12})check(x.registers[r]==y.registers[r],"preserved register "+r);
            check(y.registers[3]==((a?0x3c00:0x4400)-margin),"candidate DX");
            check(y.registers[7]==((x.registers[7]+(i==0?0:margin-1024))&65535),"intended stack-trail shift");
            check(x.steps-y.steps==(i<=1?0:(i-1)*(1024-margin)/4),"far-call dwell saving");
        }
        healthy++;
    }
    public static void main(String[]args)throws Exception{
        check(args.length==6,"m050A m050B A512 B512 A256 B256");
        byte[][] code=new byte[6][];for(int i=0;i<6;i++)code[i]=Files.readAllBytes(Paths.get(args[i]));
        Set<Integer> offsets=new TreeSet<Integer>();
        for(int p=1024;p<=65536-1024-189;p+=1024)offsets.add(p);
        for(int q=0;q<=4;q++)for(int phase:new int[]{0x10,0x34,0x54})for(int d:new int[]{-1,0,1,127,255}){
            int p=((((q*60+phase)&255)<<8)+d)&65535;if(p>=1024&&p<=65536-1024-189)offsets.add(p);
        }
        offsets.add(0x3400);offsets.add(65536-1024-189);
        for(int p:offsets)for(int j=0;j<2;j++){
            int margin=j==0?512:256;
            compare(code[0],code[2+j*2],true,false,p,margin);
            compare(code[1],code[3+j*2],false,false,p,margin);
            compare(code[0],code[2+j*2],true,true,p,margin);
        }
        System.out.println("Dwell PASS offsets="+offsets.size()+" paired="+paired+" healthy="+healthy+" baselineUnhealthy="+oldUnhealthy+" newFailures=0");
    }
}
