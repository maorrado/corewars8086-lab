import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;
import il.co.codeguru.corewars8086.war.*;
import java.nio.file.*;
import java.util.*;

/** Isolated original-engine mechanism test, not a score or full-war simulation. */
public final class WorkerRecurrenceFixture {
    static RealModeAddress at(int segment,int offset) { return new RealModeAddress((short)segment,(short)offset); }
    static int u(short value) { return value&65535; }
    static void check(boolean ok,String why) { if(!ok) throw new AssertionError(why); }
    static byte[] hex(String text) {
        byte[] out=new byte[text.length()/2];
        for(int i=0;i<out.length;i++) out[i]=(byte)Integer.parseInt(text.substring(2*i,2*i+2),16);
        return out;
    }
    static int locate(byte[] code,byte[] pattern) {
        int found=-1;
        for(int i=0;i<=code.length-pattern.length;i++) {
            boolean same=true;
            for(int j=0;j<pattern.length;j++) if(code[i+j]!=pattern[j]) same=false;
            if(same) { check(found==-1,"ambiguous instruction sequence"); found=i; }
        }
        check(found>=0,"missing instruction sequence"); return found;
    }
    static int[] regs(CpuState s) {
        return new int[]{u(s.getAX()),u(s.getBX()),u(s.getCX()),u(s.getDX()),u(s.getSI()),
            u(s.getDI()),u(s.getBP()),u(s.getSP()),u(s.getDS()),u(s.getES()),u(s.getSS()),
            u(s.getCS()),u(s.getIP())};
    }
    static final class Event {
        final int steps,pointer;
        final int[] registers;
        Event(int n,int p,CpuState s) { steps=n;pointer=p;registers=regs(s); }
    }
    static final class Run {
        final List<Event> events=new ArrayList<Event>();
        String fault;
    }
    static Run execute(byte[] code,boolean word,boolean isA,boolean captured,int offset) throws Exception {
        RealModeMemoryImpl memory=new RealModeMemoryImpl();
        for(int i=0;i<65536;i++) memory.writeByte(at(0x1000,i),(byte)0xcc);
        for(int i=0;i<code.length;i++) memory.writeByte(at(0x1000,offset+i),code[i]);
        Warrior w=new Warrior("test","COD_pair",code.length,memory,at(0x1000,offset),
            at(0x2000,0x800),at(0x3000,0),(short)1024,captured?WarriorType.ZOMBIE:WarriorType.SURVIVOR);
        CpuState s=w.getCpuState();
        if(captured) {
            int entry=locate(code,hex("31ffb8f3a5ba061f"));
            s.setIP((short)(offset+entry)); s.setES((short)0x1000);
        }
        int cell=captured?0x280:isA?0x200:0x240;
        byte[] template=word?hex("f3a529d4292f8b3fb10731f6ab4fff1f"):hex("a5f3a529d4292f8b3fb10931f6ab4fff1f");
        Run run=new Run(); int last=-1;
        for(int steps=1;steps<=5000 && run.events.size()<5;steps++) {
            try { w.nextOpcode(); }
            catch(CpuException|MemoryException e) { run.fault=e.getClass().getSimpleName()+":"+u(s.getCS())+":"+u(s.getIP()); break; }
            if(u(s.getCS())==0xffc && u(s.getBX())==cell && u(s.getDS())==0x2000) {
                int p=u(memory.readWord(at(0x2000,cell)));
                if(p!=last && u(s.getIP())==p) {
                    try {
                    check((p&255)==(word?0xa3:0xa2),"anchor low byte");
                    check(!s.getDirectionFlag(),"forward copy");
                    check(u(s.getSI())==0 && u(s.getDI())==((p+1)&65535),"copy cursors at anchor word="+word+" A="+isA+" captured="+captured+" load="+offset+" event="+run.events.size()+" step="+steps+" p="+p+" regs="+Arrays.toString(regs(s)));
                    int cx=word?7:run.events.size()==0 && isA?8:9;
                    check(u(s.getCX())==cx,"copy count at anchor");
                    check(u(s.getAX())==0x1fff && u(s.getES())==0xffc && u(s.getSS())==0x1000,"fixed anchor registers");
                    for(int i=0;i<template.length;i++) check(memory.readByte(at(0x2000,i))==template[i],"private template byte "+i);
                    run.events.add(new Event(steps,p,s));last=p;
                    } catch(AssertionError deviation) {
                        run.fault="FixtureInvariant: "+deviation.getMessage(); break;
                    }
                }
            }
        }
        if(run.fault==null) check(run.events.size()==5,"five generations reached");
        return run;
    }
    static void compare(byte[] old,byte[] word,boolean isA,boolean captured,int offset,int[] totals) throws Exception {
        Run a=execute(old,false,isA,captured,offset),b=execute(word,true,isA,captured,offset);
        totals[0]++;
        if(a.fault!=null) {
            totals[1]++; if(b.fault==null) totals[2]++;
            System.out.println("BASELINE_DEVIATION load="+offset+" A="+isA+" captured="+captured+" old="+a.fault+" word="+b.fault);
            return;
        }
        check(b.fault==null,"NEW FAULT load="+offset+" isA="+isA+" captured="+captured+" "+b.fault);
        check(a.events.size()==b.events.size(),"generation count");
        for(int i=0;i<a.events.size();i++) {
            Event x=a.events.get(i),y=b.events.get(i);
            check(y.pointer==((x.pointer+1)&65535),"same quantized band plus one byte");
            check(y.registers[7]==((x.registers[7]+1)&65535),"same stack phase plus one byte");
            for(int reg:new int[]{0,1,3,4,6,8,9,10,11}) check(x.registers[reg]==y.registers[reg],"preserved register "+reg);
            if(i==0) check(x.steps-y.steps==1,"one fewer private-template copy invocation");
            if(i==1) check((x.steps-a.events.get(i-1).steps)-(y.steps-b.events.get(i-1).steps)==(isA?2:3),"first wake copy saving");
            if(i>1) check((x.steps-a.events.get(i-1).steps)-(y.steps-b.events.get(i-1).steps)==3,"steady three-opcode saving");
        }
        totals[3]++;
    }
    public static void main(String[] args) throws Exception {
        check(args.length==4,"arguments: m050A m050B wordA wordB");
        byte[][] bytes=new byte[4][];
        for(int i=0;i<4;i++) bytes[i]=Files.readAllBytes(Paths.get(args[i]));
        check(bytes[0].length==189 && bytes[2].length==189 && bytes[1].length==117 && bytes[3].length==117,"unchanged file lengths");
        Set<Integer> offsets=new TreeSet<Integer>();
        for(int offset=1024;offset<=65536-1024-189;offset+=1024) offsets.add(offset);
        for(int q=0;q<=4;q++) for(int phase:new int[]{0x10,0x34,0x54}) for(int d:new int[]{-1,0,1,127,255}) {
            int offset=((((q*60+phase)&255)<<8)+d)&65535;
            if(offset>=1024 && offset<=65536-1024-189) offsets.add(offset);
        }
        offsets.add(0x3400); offsets.add(65536-1024-189);
        int[] totals=new int[4];
        for(int offset:offsets) {
            compare(bytes[0],bytes[2],true,false,offset,totals);
            compare(bytes[1],bytes[3],false,false,offset,totals);
            compare(bytes[0],bytes[2],true,true,offset,totals);
        }
        System.out.println("Original engine recurrence PASS: offsets="+offsets.size()+", paths="+totals[0]+", baselineUnhealthyPaths="+totals[1]+", baselineDeviationsAvoided="+totals[2]+", pairedHealthyFiveGenerationPaths="+totals[3]+", newFaultsOrInvariantFailures=0, steadyOpcodesSaved=3");
    }
}
