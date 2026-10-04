import java.nio.file.*;
import java.util.*;
public final class BootstrapFixture {
    static void check(boolean v,String m){if(!v)throw new AssertionError(m);}
    public static void main(String[]args)throws Exception{
        check(args.length==6,"m050A m050B c090A c090B e1A e1B");
        byte[][] code=new byte[6][];for(int i=0;i<6;i++)code[i]=Files.readAllBytes(Paths.get(args[i]));
        Set<Integer> offsets=new TreeSet<Integer>();
        for(int p=1024;p<=65536-1024-189;p+=1024)offsets.add(p);
        for(int q=0;q<=4;q++)for(int phase:new int[]{0x10,0x34,0x54})for(int d:new int[]{-1,0,1,127,255}){
            int p=((((q*60+phase)&255)<<8)+d)&65535;if(p>=1024&&p<=65536-1024-189)offsets.add(p);
        }
        offsets.add(0x3400);offsets.add(65536-1024-189);
        int paired=0,healthy=0,baselineUnhealthy=0,avoided=0;
        for(int offset:offsets)for(int kind=0;kind<3;kind++){
            boolean a=kind!=1,captured=kind==2;int side=a?0:1;
            WorkerRecurrenceFixture.Run old=WorkerRecurrenceFixture.execute(code[side],false,a,captured,offset);
            for(int variant=0;variant<2;variant++){
                WorkerRecurrenceFixture.Run next=WorkerRecurrenceFixture.execute(code[2+variant*2+side],false,a,captured,offset);paired++;
                String context=" offset="+offset+" kind="+kind+" variant="+variant;
                if(old.fault!=null){baselineUnhealthy++;if(next.fault==null)avoided++;continue;}
                check(next.fault==null,"new failure"+context+" "+next.fault);
                check(old.events.size()==5&&next.events.size()==5,"five generations");
                for(int i=0;i<5;i++){
                    WorkerRecurrenceFixture.Event x=old.events.get(i),y=next.events.get(i);
                    check(x.pointer==y.pointer&&Arrays.equals(x.registers,y.registers),"same anchor registers"+context);
                    check(x.steps-y.steps==(variant==1&&kind==0?2:1),"expected startup saving"+context);
                }
                healthy++;
            }
        }
        System.out.println("{\"status\":\"PASS\",\"offsets\":"+offsets.size()+",\"pairedPaths\":"+paired+",\"healthyPaths\":"+healthy+",\"baselineUnhealthyPaths\":"+baselineUnhealthy+",\"baselineDeviationsAvoided\":"+avoided+",\"newFailures\":0}");
    }
}
