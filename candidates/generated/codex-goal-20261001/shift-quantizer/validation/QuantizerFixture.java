import il.co.codeguru.corewars8086.cpu.*;
import il.co.codeguru.corewars8086.memory.*;
import il.co.codeguru.corewars8086.war.*;
import java.nio.file.*;
import java.util.*;

/** Executes the unchanged original JAR. No results/engine/file mutations. */
public final class QuantizerFixture {
    static RealModeAddress at(int segment, int offset) {
        return new RealModeAddress((short)segment, (short)offset);
    }
    static void check(boolean value, String reason) {
        if (!value) throw new AssertionError(reason);
    }
    static int u(short value) { return value & 65535; }
    static void load(RealModeMemoryImpl memory, int offset, byte[] code) {
        for (int i=0; i<code.length; i++) memory.writeByte(at(0x1000, offset+i), code[i]);
    }
    static String state(CpuState s) {
        return Arrays.toString(new short[]{s.getAX(),s.getBX(),s.getCX(),s.getDX(),
            s.getSI(),s.getDI(),s.getBP(),s.getSP(),s.getDS(),s.getES(),s.getSS(),
            s.getCS(),s.getIP(),s.getFlags(),s.getEnergy(),
            (short)s.getBomb1Count(),(short)s.getBomb2Count()});
    }
    static void arithmetic(byte[] old, byte[] candidate) throws Exception {
        RealModeMemoryImpl a = new RealModeMemoryImpl(), b = new RealModeMemoryImpl();
        // Exact assembled instructions from after MOV AX,SI through MOV AL,A2h.
        load(a,0,Arrays.copyOfRange(old,0x16,0x27));
        load(b,0,Arrays.copyOfRange(candidate,0x16,0x26));
        CpuState sa = new CpuState(), sb = new CpuState();
        sa.setCS((short)0x1000); sb.setCS((short)0x1000);
        Cpu ca = new Cpu(sa,a), cb = new Cpu(sb,b);
        for (int value=0;value<65536;value++) {
            sa.setAX((short)value); sb.setAX((short)value);
            sa.setCX((short)0x5d13); sb.setCX((short)0x5d13);
            sa.setIP((short)0); sb.setIP((short)0);
            sa.setFlags((short)0); sb.setFlags((short)0);
            for (int i=0;i<8;i++) ca.nextOpcode();
            for (int i=0;i<7;i++) cb.nextOpcode();
            int target = (((((value>>>8)/60)*60+0x34)&255)<<8)|0xa2;
            check(u(sa.getAX())==target && sa.getAX()==sb.getAX(),"AX at load "+value);
            check(sa.getFlags()==sb.getFlags(),"flags at load "+value);
            check(u(sa.getCX())==0x3c13 && u(sb.getCX())==0x3c08,"expected transient CX");
            check(u(sa.getIP())==17 && u(sb.getIP())==16,"exact opcode boundaries");
        }
        System.out.println("original-Cpu exhaustive quantizer: 65536 inputs, AX/flags match, 8 versus 7 opcodes");
    }
    static final class Boot {
        final RealModeMemoryImpl memory = new RealModeMemoryImpl();
        final Warrior warrior;
        int steps;
        Boot(byte[] code,int offset) throws Exception {
            for (int i=0;i<65536;i++) memory.writeByte(at(0x1000,i),(byte)0xcc);
            load(memory,offset,code);
            warrior = new Warrior("B","COD_pair",code.length,memory,at(0x1000,offset),
                at(0x2000,0x800),at(0x3000,0),(short)1024,WarriorType.SURVIVOR);
            while (u(warrior.getCpuState().getCS())==0x1000 && steps<100) {
                warrior.nextOpcode(); steps++;
            }
            check(u(warrior.getCpuState().getCS())==0xffc,"first far call reached: "+offset);
        }
    }
    static void boots(byte[] old,byte[] candidate) throws Exception {
        Set<Integer> offsets = new TreeSet<Integer>();
        for (int offset=1024;offset<=65536-1024-old.length;offset+=1024) offsets.add(offset);
        for (int band=0;band<=4;band++) for (int d:new int[]{-1,0,1,127,255}) {
            int offset=band*60*256+d;
            if (offset>=1024 && offset<=65536-1024-old.length) offsets.add(offset);
        }
        offsets.add(65536-1024-old.length);
        for (int offset:offsets) {
            Boot a = new Boot(old,offset), b = new Boot(candidate,offset);
            check(a.steps==b.steps+1,"one opcode saved at "+offset);
            check(state(a.warrior.getCpuState()).equals(state(b.warrior.getCpuState())),"full initialized CPU state "+offset);
            // All accessible arena/private/shared bytes identical, except the
            // intentionally different initial bootstrap bytes themselves.
            for (int linear=0x10000;linear<=0x303ff;linear++) {
                int within=linear-(0x10000+offset);
                if (within>=0 && within<old.length && old[within]!=candidate[within]) continue;
                check(a.memory.readByte(new RealModeAddress(linear))==b.memory.readByte(new RealModeAddress(linear)),"memory at "+offset+":"+linear);
            }
        }
        System.out.println("original-Warrior inert bootstrap: "+offsets.size()+" legal offsets, identical initialized state/memory, one opcode saved, no fault");
    }
    public static void main(String[] args) throws Exception {
        check(args.length==2,"arguments: original B, candidate B");
        byte[] old=Files.readAllBytes(Paths.get(args[0])), candidate=Files.readAllBytes(Paths.get(args[1]));
        check(old.length==117 && candidate.length==117,"exact binary sizes");
        check(Arrays.equals(Arrays.copyOfRange(old,0x2e,117),Arrays.copyOfRange(candidate,0x2e,117)),"identical initializer and worker suffix");
        arithmetic(old,candidate);
        boots(old,candidate);
    }
}
