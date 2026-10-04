import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;
import il.co.codeguru.corewars8086.war.*;
import java.nio.file.*;
import java.util.*;

/** Original-engine isolated recurrence, not a competition score. */
public final class CoverageFixture {
    static void check(boolean ok,String why) { if(!ok) throw new AssertionError(why); }
    static int u(short value) { return value&65535; }
    static RealModeAddress at(int segment,int offset) { return new RealModeAddress((short)segment,(short)offset); }
    static final int GENERATIONS=258;
    static final byte[] TEMPLATE=WorkerRecurrenceFixture.hex("a5f3a529d4292f8b3fb10931f6ab4fff1f");
    static WorkerRecurrenceFixture.Run execute(byte[] code,boolean isA,boolean captured,int offset,int bp,int dx) throws Exception {
        RealModeMemoryImpl memory=new RealModeMemoryImpl();
        for(int i=0;i<65536;i++) memory.writeByte(at(0x1000,i),(byte)0xcc);
        for(int i=0;i<code.length;i++) memory.writeByte(at(0x1000,offset+i),code[i]);
        Warrior w=new Warrior("test","COD_pair",code.length,memory,at(0x1000,offset),
            at(0x2000,0x800),at(0x3000,0),(short)1024,captured?WarriorType.ZOMBIE:WarriorType.SURVIVOR);
        CpuState s=w.getCpuState();
        if(captured) {
            int entry=WorkerRecurrenceFixture.locate(code,WorkerRecurrenceFixture.hex("31ffb8f3a5ba061f"));
            s.setIP((short)(offset+entry));s.setES((short)0x1000);
        }
        int cell=captured?0x280:isA?0x200:0x240;
        int first=((((offset>>>8)/60*60+(captured?0x54:isA?0x10:0x34))&255)<<8)|0xa2;
        WorkerRecurrenceFixture.Run run=new WorkerRecurrenceFixture.Run(); int last=-1;
        for(int step=1;step<=100000&&run.events.size()<GENERATIONS;step++) {
            try { w.nextOpcode(); }
            catch(CpuException|MemoryException e) { run.fault=e.getClass().getSimpleName()+":"+u(s.getCS())+":"+u(s.getIP());break; }
            if(u(s.getCS())==0xffc&&u(s.getBX())==cell&&u(s.getDS())==0x2000) {
                int p=u(memory.readWord(at(0x2000,cell)));
                if(p!=last&&u(s.getIP())==p) {
                    try {
                        int n=run.events.size();
                        check(p==((first-n*bp)&65535),"predicted anchor orbit");
                        check(!s.getDirectionFlag()&&u(s.getSI())==0&&u(s.getDI())==((p+1)&65535),"copy cursors");
                        check(u(s.getCX())==(n==0&&isA?8:9),"copy count");
                        check(u(s.getAX())==0x1fff&&u(s.getES())==0xffc&&u(s.getSS())==0x1000,"fixed segments and payload");
                        check(u(s.getBP())==bp&&u(s.getDX())==dx,"stride registers");
                        int expectedSP=n==0?p+(isA?0x200:0x280)-4:p-0x40+(bp-dx)-4;
                        check(u(s.getSP())==(expectedSP&65535),"predicted stack cursor");
                        for(int i=0;i<TEMPLATE.length;i++)check(memory.readByte(at(0x2000,i))==TEMPLATE[i],"private template "+i);
                        run.events.add(new WorkerRecurrenceFixture.Event(step,p,s));last=p;
                    } catch(AssertionError e) {run.fault="FixtureInvariant:"+e.getMessage();break;}
                }
            }
        }
        if(run.fault==null)check(run.events.size()==GENERATIONS,"complete orbit timeout");
        return run;
    }
    public static void main(String[] args) throws Exception {
        check(args.length==6,"m050A m050B A-lower B-lower A-upper B-upper");
        byte[][] code=new byte[6][];for(int i=0;i<6;i++)code[i]=Files.readAllBytes(Paths.get(args[i]));
        Set<Integer> offsets=new TreeSet<Integer>();
        for(int p=1024;p<=65536-1024-189;p+=1024)offsets.add(p);
        for(int q=0;q<=4;q++)for(int phase:new int[]{0x10,0x34,0x54})for(int d:new int[]{-1,0,1,127,255}) {
            int p=((((q*60+phase)&255)<<8)+d)&65535;if(p>=1024&&p<=65536-1024-189)offsets.add(p);
        }
        offsets.add(0x3400);offsets.add(65536-1024-189);
        int paired=0,healthy=0,oldUnhealthy=0;
        for(int offset:offsets)for(int kind=0;kind<3;kind++) {
            boolean a=kind!=1,captured=kind==2;int side=a?0:1,oldBP=a?0x3c00:0x4400;
            WorkerRecurrenceFixture.Run old=execute(code[side],a,captured,offset,oldBP,oldBP-1024);
            for(int arm=0;arm<2;arm++) {
                int bp=oldBP+(arm==0?-256:256),dx=bp-256;
                WorkerRecurrenceFixture.Run next=execute(code[2+2*arm+side],a,captured,offset,bp,dx);paired++;
                String context=" load="+offset+" kind="+kind+" arm="+arm;
                if(old.fault!=null) {
                    check(kind==1&&Arrays.asList(13311,13313,28671,28673,44031,44033,59391,59393).contains(offset),"unexpected baseline fault"+context+" "+old.fault);
                    check(Objects.equals(old.fault,next.fault),"baseline fault changed"+context+" old="+old.fault+" new="+next.fault);
                    oldUnhealthy++;continue;
                }
                check(next.fault==null,"new fault"+context+" "+next.fault);
                Set<Integer> anchors=new HashSet<Integer>();
                for(int n=0;n<GENERATIONS;n++) {
                    WorkerRecurrenceFixture.Event x=old.events.get(n),y=next.events.get(n);
                    check(x.steps-y.steps==(n<=1?0:(n-1)*192),"predicted timing"+context+" n="+n);
                    if(n<256)check(anchors.add(y.pointer),"early anchor repeat"+context);
                    if(n==256)check(y.pointer==next.events.get(0).pointer,"orbit closure"+context);
                }
                check(anchors.size()==256,"256 anchors");healthy++;
            }
        }
        System.out.println("Coverage PASS offsets="+offsets.size()+" paired="+paired+" healthy="+healthy+" baselineUnhealthy="+oldUnhealthy+" generations="+GENERATIONS+" newFailures=0");
    }
}
