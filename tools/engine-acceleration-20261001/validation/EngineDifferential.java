import com.google.common.primitives.Longs;
import il.co.codeguru.corewars8086.cpu.Cpu;
import il.co.codeguru.corewars8086.cpu.CpuState;
import il.co.codeguru.corewars8086.cpu.OpcodeFetcher;
import il.co.codeguru.corewars8086.memory.*;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

/** Deterministic semantic fixtures, not a throughput benchmark. No file writes. */
public final class EngineDifferential {
    private static RealModeAddress a(int segment, int offset) {
        return new RealModeAddress((short) segment, (short) offset);
    }
    private static int u(short value) { return value & 65535; }
    private static void check(boolean ok, String reason) {
        if (!ok) throw new AssertionError(reason);
    }
    private static void eq(int actual, int expected, String reason) {
        check(actual == expected, reason + ": " + actual + " != " + expected);
    }
    private interface Action { void run() throws Exception; }
    private static String fault(Action action) throws Exception {
        try { action.run(); } catch (MemoryException ex) { return ex.getClass().getName(); }
        throw new AssertionError("Expected MemoryException");
    }
    private static void emit(String name, String values) {
        System.out.println(name + "\t" + values);
    }
    private static String hex(byte[] bytes) {
        StringBuilder out = new StringBuilder();
        for (byte value : bytes) out.append(String.format("%02x", value & 255));
        return out.toString();
    }
    private static String memoryHash(RealModeMemoryImpl memory) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        for (int linear = 0; linear < 0x100000; linear++)
            digest.update(memory.readByte(new RealModeAddress(linear)));
        return hex(digest.digest());
    }
    private static RealModeMemoryRegion region(int low, int high) {
        return new RealModeMemoryRegion(new RealModeAddress(low), new RealModeAddress(high));
    }
    private static RealModeMemoryRegion[] all() {
        return new RealModeMemoryRegion[] { region(0, 0xfffff) };
    }
    private static CpuState state() {
        CpuState s = new CpuState();
        s.setCS((short) 0x1000); s.setES((short) 0x2000); s.setDS((short) 0x1000);
        s.setAX((short) 0x1122); s.setDX((short) 0x3344);
        s.setBX((short) 0x5566); s.setCX((short) 0x7788); s.setBomb2Count((byte) 1);
        return s;
    }
    private static String stateText(CpuState s) {
        return "ax=" + u(s.getAX()) + ",bx=" + u(s.getBX()) + ",cx=" + u(s.getCX())
            + ",dx=" + u(s.getDX()) + ",si=" + u(s.getSI()) + ",di=" + u(s.getDI())
            + ",cs=" + u(s.getCS()) + ",ip=" + u(s.getIP()) + ",ds=" + u(s.getDS())
            + ",es=" + u(s.getES()) + ",ss=" + u(s.getSS()) + ",sp=" + u(s.getSP())
            + ",bp=" + u(s.getBP()) + ",flags=" + u(s.getFlags())
            + ",energy=" + u(s.getEnergy()) + ",bomb1=" + (s.getBomb1Count() & 255)
            + ",bomb2=" + (s.getBomb2Count() & 255);
    }
    private static void code87(RealModeMemoryImpl memory) {
        memory.writeByte(a(0x1000, 0), (byte) 0xcd);
        memory.writeByte(a(0x1000, 1), (byte) 0x87);
    }
    private static void pattern(RealModeMemory memory, int segment, int offset) throws Exception {
        memory.writeWord(a(segment, offset), (short) 0x1122);
        memory.writeWord(a(segment, offset + 2), (short) 0x3344);
    }

    /** Generic-interface path: records byte and word access order without retaining a huge trace. */
    private static final class TraceMemory extends AbstractRealModeMemory {
        final RealModeMemoryImpl core = new RealModeMemoryImpl();
        final MessageDigest trace;
        final List<Integer> wordHead = new ArrayList<Integer>();
        int reads, words, writes, failWord = -1;
        TraceMemory() throws Exception { trace = MessageDigest.getInstance("SHA-256"); }
        private void event(char kind, RealModeAddress address, int value) {
            int seg = u(address.getSegment()), off = u(address.getOffset());
            trace.update((byte) kind); trace.update((byte) seg); trace.update((byte) (seg >>> 8));
            trace.update((byte) off); trace.update((byte) (off >>> 8));
            trace.update((byte) value); trace.update((byte) (value >>> 8));
        }
        public byte readByte(RealModeAddress address) {
            byte value = core.readByte(address); reads++; event('R', address, value & 255); return value;
        }
        public short readWord(RealModeAddress address) throws MemoryException {
            int off = u(address.getOffset()); words++;
            if (wordHead.size() < 8) wordHead.add(off);
            event('Q', address, 0);
            if (off == failWord) { event('F', address, 0); throw new MemoryException(); }
            return super.readWord(address);
        }
        public void writeByte(RealModeAddress address, byte value) {
            core.writeByte(address, value); writes++; event('W', address, value & 255);
        }
        public byte readExecuteByte(RealModeAddress address) {
            byte value = core.readExecuteByte(address); event('X', address, value & 255); return value;
        }
        String summary() throws Exception {
            return "reads=" + reads + ",words=" + words + ",writes=" + writes
                + ",wordHead=" + wordHead + ",trace=" + hex(trace.digest()) + ",memory=" + memoryHash(core);
        }
    }

    private static void memoryEdges() throws Exception {
        final RealModeMemoryImpl m = new RealModeMemoryImpl();
        m.writeByte(a(0x1234, 0xffff), (byte) 0x34);
        m.writeByte(a(0x1234, 0), (byte) 0x12);
        m.writeByte(new RealModeAddress(0x22340), (byte) 0x99);
        eq(u(m.readWord(a(0x1234, 0xffff))), 0x1234, "same-segment word wrap");
        final List<String> events = new ArrayList<String>();
        m.setListener(address -> events.add(u(address.getSegment()) + ":" + u(address.getOffset())
            + "=" + (m.readByte(address) & 255)));
        m.writeWord(a(0x1234, 0xffff), (short) 0xbeef);
        eq(m.readByte(a(0x1234, 0)) & 255, 0xbe, "wrapped high byte");
        eq(m.readByte(new RealModeAddress(0x22340)) & 255, 0x99, "not linear carry");
        check(events.toString().equals("[4660:65535=239, 4660:0=190]"), "listener segment/order/visibility");
        emit("offset-wrap-write-listener", events.toString());
        m.setListener(null);
        m.writeWord(a(0xffff, 0x000f), (short) 0x7654);
        eq(a(0xffff, 0x10).getLinearAddress(), 0, "20-bit alias");
        eq(m.readByte(new RealModeAddress(0)) & 255, 0x76, "20-bit high byte");
        eq(u(m.readWord(a(0xffff, 0x000f))), 0x7654, "20-bit wrapped word");
        eq(new RealModeAddress(0x100000).getLinearAddress(), 0, "linear constructor wrap");
        check(region(0x100, 0x101).isInRegion(new RealModeAddress(0x101)), "inclusive region end");
        check(!region(0xfffff, 0).isInRegion(new RealModeAddress(0)), "reversed region remains empty");
        emit("physical-wrap-region", "word=" + u(m.readWord(a(0xffff, 0x000f))));

        final RestrictedAccessRealModeMemory limited = new RestrictedAccessRealModeMemory(m, all(),
            new RealModeMemoryRegion[] { region(0x20100, 0x20100) }, all());
        m.writeByte(a(0x2000, 0x101), (byte) 0x77);
        String exception = fault(() -> limited.writeWord(a(0x2000, 0x100), (short) 0xaabb));
        eq(m.readByte(a(0x2000, 0x100)) & 255, 0xbb, "partial low-byte commit");
        eq(m.readByte(a(0x2000, 0x101)) & 255, 0x77, "denied high-byte unchanged");
        emit("partial-word-write", exception + ",bytes=187,119");

        CpuState s = state(); s.setIP((short) 0xffff);
        m.writeByte(a(0x1000, 0xffff), (byte) 0x78); m.writeByte(a(0x1000, 0), (byte) 0x56);
        OpcodeFetcher fetch = new OpcodeFetcher(s, m);
        eq(u(fetch.nextWord()), 0x5678, "fetch offset wrap"); eq(u(s.getIP()), 1, "fetch word IP wrap");
        emit("fetch-wrap", "value=22136,ip=1");
        s.setIP((short) 0x100);
        final RestrictedAccessRealModeMemory execute = new RestrictedAccessRealModeMemory(m, all(), all(),
            new RealModeMemoryRegion[] { region(0x10100, 0x10100) });
        execute.readWord(a(0x1000, 0x100)); // Data permission is independent of execute permission.
        final OpcodeFetcher denied = new OpcodeFetcher(s, execute);
        exception = fault(() -> denied.nextWord());
        eq(u(s.getIP()), 0x102, "IP advances before execute high-byte fault");
        emit("execute-word-fault", exception + ",ip=" + u(s.getIP()));
        s.setIP((short) 0x101); exception = fault(() -> denied.nextByte());
        eq(u(s.getIP()), 0x102, "IP advances before execute low-byte fault");
        emit("execute-byte-fault", exception + ",ip=" + u(s.getIP()));
    }

    private static void selfModifiedCode() throws Exception {
        RealModeMemoryImpl m = new RealModeMemoryImpl(); CpuState s = state();
        s.setAX((short) 7);
        int[] bytes = {0xc6, 0x06, 0x05, 0x00, 0x40, 0x48}; // MOV byte [0005],40h; initially DEC AX.
        for (int i = 0; i < bytes.length; i++) m.writeByte(a(0x1000, i), (byte) bytes[i]);
        Cpu cpu = new Cpu(s, m); cpu.nextOpcode(); cpu.nextOpcode();
        eq(u(s.getAX()), 8, "self-modified next opcode immediately fetched");
        eq(u(s.getIP()), 6, "self-modified instruction length");
        emit("self-modified-opcode", stateText(s));
        m.writeByte(a(0x1000, 0), (byte) 0xb8); m.writeWord(a(0x1000, 1), (short) 0x1234);
        s.setIP((short) 0); cpu.nextOpcode(); eq(u(s.getAX()), 0x1234, "first immediate");
        m.writeWord(a(0x1000, 1), (short) 0x5678); s.setIP((short) 0); cpu.nextOpcode();
        eq(u(s.getAX()), 0x5678, "mutated immediate on same Cpu");
        emit("self-modified-immediate", stateText(s));
    }

    private static void scan(boolean backwards, int start, int match, int later, String name) throws Exception {
        TraceMemory m = new TraceMemory(); code87(m.core); CpuState s = state();
        s.setDI((short) start); s.setDirectionFlag(backwards);
        if (match >= 0) pattern(m.core, 0x2000, match);
        if (later >= 0) pattern(m.core, 0x2000, later);
        new Cpu(s, m).nextOpcode();
        eq(s.getBomb2Count() & 255, 0, "INT87 consumes one charge");
        eq(u(s.getDI()), start, "INT87 retains DI"); eq(u(s.getIP()), 2, "INT87 IP");
        if (match < 0) { eq(m.words, 65536, "full scan count"); eq(m.reads, 131072, "short-circuit no-match bytes"); eq(m.writes, 0, "no-match no writes"); }
        else {
            eq(u(m.core.readWord(a(0x2000, match))), 0x5566, "first matched word replaced");
            eq(u(m.core.readWord(a(0x2000, match + 2))), 0x7788, "second matched word replaced");
            eq(m.writes, 4, "exactly first four bytes replaced");
            if (later >= 0) eq(u(m.core.readWord(a(0x2000, later))), 0x1122, "later match unchanged");
        }
        emit(name, stateText(s) + "," + m.summary());
    }
    private static void scanFault(boolean firstWordMatches) throws Exception {
        TraceMemory m = new TraceMemory(); code87(m.core); CpuState s = state(); s.setDI((short) 0x100);
        if (firstWordMatches) m.core.writeWord(a(0x2000, 0x100), (short) 0x1122);
        m.failWord = firstWordMatches ? 0x102 : 0x101;
        final Cpu partialCpu = new Cpu(s, m);
        String exception = fault(() -> partialCpu.nextOpcode());
        eq(m.words, 2, "word calls before read exception"); eq(m.writes, 0, "no writes after read fault");
        eq(s.getBomb2Count() & 255, 0, "charge consumed before exception");
        check(m.wordHead.toString().equals(firstWordMatches ? "[256, 258]" : "[256, 257]"), "short-circuit read order");
        emit(firstWordMatches ? "int87-second-word-fault" : "int87-short-circuit-fault", exception + "," + stateText(s) + "," + m.summary());
    }
    private static void nativeInt87() throws Exception {
        final RealModeMemoryImpl core = new RealModeMemoryImpl(); code87(core); pattern(core, 0x2000, 0x100);
        CpuState s = state(); s.setDI((short) 0x100);
        final List<Integer> writes = new ArrayList<Integer>();
        core.setListener(address -> writes.add(u(address.getOffset())));
        RestrictedAccessRealModeMemory m = new RestrictedAccessRealModeMemory(core, all(),
            new RealModeMemoryRegion[] { region(0x20100, 0x20102) }, all());
        final Cpu nativePartialCpu = new Cpu(s, m);
        String exception = fault(() -> nativePartialCpu.nextOpcode());
        check(writes.toString().equals("[256, 257, 258]"), "partial INT87 write order");
        eq(u(core.readWord(a(0x2000, 0x100))), 0x5566, "first replacement word committed");
        eq(u(core.readWord(a(0x2000, 0x102))), 0x3388, "partial second replacement");
        eq(s.getBomb2Count() & 255, 0, "charge on write fault");
        emit("int87-partial-write-fault", exception + ",writes=" + writes + "," + stateText(s) + ",memory=" + memoryHash(core));
        core.setListener(null); code87(core); pattern(core, 0xffff, 0xffff); s = state();
        s.setES((short) 0xffff); s.setDI((short) 0xfffe);
        new Cpu(s, new RestrictedAccessRealModeMemory(core, all(), all(), all())).nextOpcode();
        eq(u(core.readWord(a(0xffff, 0xffff))), 0x5566, "native restricted wrap match");
        eq(u(core.readWord(a(0xffff, 1))), 0x7788, "native restricted wrap second word");
        emit("int87-native-wrap", stateText(s) + ",memory=" + memoryHash(core));
        TraceMemory trace = new TraceMemory(); code87(trace.core); s = state(); s.setBomb2Count((byte) 0);
        new Cpu(s, trace).nextOpcode(); eq(trace.words, 0, "no-charge must not scan");
        emit("int87-no-charge", stateText(s) + "," + trace.summary());
    }
    /** Exact concrete memory/region classes: exercises the proposed optimized path. */
    private static void nativeScan(boolean backwards, int start, int match, int later, int segment, String name) throws Exception {
        final RealModeMemoryImpl core = new RealModeMemoryImpl();
        core.writeByte(a(0x4000, 0), (byte) 0xcd); core.writeByte(a(0x4000, 1), (byte) 0x87);
        CpuState s = state(); s.setCS((short) 0x4000); s.setES((short) segment);
        s.setDI((short) start); s.setDirectionFlag(backwards); s.setBomb1Count((byte) 2); s.setBomb2Count((byte) 2);
        if (match >= 0) pattern(core, segment, match);
        if (later >= 0) pattern(core, segment, later);
        final List<String> events = new ArrayList<String>();
        core.setListener(address -> events.add(u(address.getSegment()) + ":" + u(address.getOffset())
            + "=" + (core.readByte(address) & 255)));
        int base = segment << 4;
        RealModeMemoryRegion[] arena = { region(base, base + 65535) };
        new Cpu(s, new RestrictedAccessRealModeMemory(core, arena, all(), all())).nextOpcode();
        eq(s.getBomb2Count() & 255, 1, "native consumes exactly one charge");
        eq(s.getBomb1Count() & 255, 2, "native leaves other bomb count");
        eq(u(s.getDI()), start, "native retains scan origin"); eq(u(s.getIP()), 2, "native advances past INT87");
        eq(events.size(), match < 0 ? 0 : 4, "native exact write event count");
        if (match >= 0) {
            eq(u(core.readWord(a(segment, match))), 0x5566, "native first match replacement");
            eq(u(core.readWord(a(segment, match + 2))), 0x7788, "native second replacement word");
        }
        if (later >= 0) eq(u(core.readWord(a(segment, later))), 0x1122, "native later match untouched");
        emit(name, stateText(s) + ",writes=" + events + ",memory=" + memoryHash(core));
    }
    private static void nativeReadFault(boolean secondWord) throws Exception {
        final RealModeMemoryImpl core = new RealModeMemoryImpl(); code87(core);
        final CpuState s = state(); s.setES((short) 0x1000); s.setDI((short) 0x100);
        if (secondWord) pattern(core, 0x1000, 0x100);
        final List<Integer> events = new ArrayList<Integer>(); core.setListener(address -> events.add(u(address.getOffset())));
        RealModeMemoryRegion[] readable = { region(0x10000, secondWord ? 0x10102 : 0x10100) };
        final Cpu cpu = new Cpu(s, new RestrictedAccessRealModeMemory(core, readable, all(), all()));
        String exception = fault(() -> cpu.nextOpcode());
        eq(events.size(), 0, "partial read permission must fault before writes");
        eq(s.getBomb2Count() & 255, 0, "partial read fault consumes bomb");
        emit(secondWord ? "int87-native-second-read-fault" : "int87-native-first-read-fault",
            exception + "," + stateText(s) + ",memory=" + memoryHash(core));
    }
    private static void nativeOverwrite() throws Exception {
        final RealModeMemoryImpl core = new RealModeMemoryImpl();
        core.writeByte(a(0x4000, 0), (byte) 0xcd); core.writeByte(a(0x4000, 1), (byte) 0x87);
        CpuState s = state(); s.setCS((short) 0x4000); s.setES((short) 0x1000); s.setDI((short) 0x100);
        RealModeMemoryRegion[] arena = { region(0x10000, 0x1ffff) };
        Cpu cpu = new Cpu(s, new RestrictedAccessRealModeMemory(core, arena, all(), all()));
        pattern(core, 0x1000, 0x100); pattern(core, 0x1000, 0x200); cpu.nextOpcode();
        eq(u(core.readWord(a(0x1000, 0x100))), 0x5566, "first invocation match");
        // Same Cpu and memory object; former match no longer matches and a new earlier match appears.
        pattern(core, 0x1000, 0x180); s.setIP((short) 0); s.setBomb2Count((byte) 1);
        final List<Integer> events = new ArrayList<Integer>(); core.setListener(address -> events.add(u(address.getOffset())));
        cpu.nextOpcode();
        eq(u(core.readWord(a(0x1000, 0x180))), 0x5566, "fresh scan sees overwritten memory");
        eq(u(core.readWord(a(0x1000, 0x200))), 0x1122, "old later match remains untouched");
        check(events.toString().equals("[384, 385, 386, 387]"), "fresh scan write order");
        emit("int87-native-overwrite", stateText(s) + ",writes=" + events + ",memory=" + memoryHash(core));
    }
    private static void seeds() throws Exception {
        String[] values = {"all-001", "all-002", "001", "-1", "2147483648", "9223372036854775807", "9223372036854775808", "\u05d0\ud83d\ude0a"};
        for (int i = 0; i < values.length; i++) {
            String value = values[i]; Long parsed = Longs.tryParse(value);
            long seed = parsed == null ? value.hashCode() : parsed.longValue();
            emit("seed-" + i, "hash=" + value.hashCode() + ",first=" + seed + ",next=" + (seed + 1L));
        }
    }
    public static void main(String[] args) throws Exception {
        memoryEdges(); selfModifiedCode();
        scan(false, 0xffff, -1, -1, "int87-forward-full-wrap");
        scan(true, 0, -1, -1, "int87-backward-full-wrap");
        scan(false, 0xffff, 1, 8, "int87-forward-first-match");
        scan(true, 2, 0, 0xfff8, "int87-backward-first-match");
        scan(false, 0xfffe, 0xffff, -1, "int87-pattern-wrap");
        scanFault(false); scanFault(true); nativeInt87();
        nativeScan(false, 0xffff, -1, -1, 0x1000, "int87-arena-forward-miss");
        nativeScan(true, 0, -1, -1, 0x1000, "int87-arena-backward-miss");
        nativeScan(false, 0xfffc, 0xfffd, 0x20, 0x1000, "int87-arena-forward-fffd");
        nativeScan(false, 0xfffd, 0xfffe, 0x20, 0x1000, "int87-arena-forward-fffe");
        nativeScan(false, 0xfffe, 0xffff, 0x20, 0x1000, "int87-arena-forward-ffff");
        nativeScan(true, 0, 0xfffd, 0xffe0, 0x1000, "int87-arena-backward-fffd");
        nativeScan(true, 1, 0xfffe, 0xffe0, 0x1000, "int87-arena-backward-fffe");
        nativeScan(true, 2, 0xffff, 0xffe0, 0x1000, "int87-arena-backward-ffff");
        nativeScan(false, 0x100, 0x103, 0x110, 0x3000, "int87-nonarena-segment");
        nativeReadFault(false); nativeReadFault(true); nativeOverwrite(); seeds();
        emit("COMPLETE", "all semantic assertions passed");
    }
}
