import com.google.common.primitives.Longs;
import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.cpu.CpuState;
import il.co.codeguru.corewars8086.memory.MemoryEventListener;
import il.co.codeguru.corewars8086.memory.RealModeAddress;
import il.co.codeguru.corewars8086.memory.RealModeMemoryImpl;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.CompetitionEventListener;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import il.co.codeguru.corewars8086.war.WarriorType;

import java.io.PrintWriter;

/**
 * agent2 observer-only death attribution over the unmodified v6 engine.
 * Runs one serial Competition exactly like the headless runner (same seed handling) and, for every
 * death, logs the bytes at CS:IP and the warrior that last wrote each of them (with round).
 * usage: A2Trace <outJsonl> <engine options...>   (pass --headless --parallel=false etc.)
 */
public final class A2Trace implements CompetitionEventListener, MemoryEventListener {
    private final Competition competition;
    private final PrintWriter out;
    private final int[] lastWriter = new int[65536];
    private final int[] lastRound = new int[65536];
    private final int[] writes = new int[64];
    private int round;
    private int warIndex = -1;
    private long warSeed;
    private boolean loading;
    private static final int RING = 24;
    private final java.util.Map<String, long[][]> rings = new java.util.HashMap<>();
    private final java.util.Map<String, Integer> ringPos = new java.util.HashMap<>();
    private final String team = System.getProperty("a2.team", "CAND");

    A2Trace(Options options, PrintWriter out) throws Exception {
        this.out = out;
        competition = new Competition(options);
        competition.addCompetitionEventListener(this);
        competition.addMemoryEventLister(this);
        long seed = Longs.tryParse(options.seed) != null ? Long.parseLong(options.seed) : options.seed.hashCode();
        competition.setSeed(seed);
    }

    public static void main(String[] args) throws Exception {
        String[] engineArgs = java.util.Arrays.copyOfRange(args, 1, args.length);
        OptionsParser parser = OptionsParser.newOptionsParser(Options.class);
        parser.parse(engineArgs);
        Options options = parser.getOptions(Options.class);
        try (PrintWriter out = new PrintWriter(args[0], "UTF-8")) {
            A2Trace t = new A2Trace(options, out);
            java.io.PrintStream real = System.out;
            System.setOut(new java.io.PrintStream(new java.io.OutputStream() { public void write(int b) {} }));
            t.competition.runCompetition(options.battlesPerCombo, options.combinationSize, false);
            System.setOut(real);
        }
    }

    public void onMemoryWrite(RealModeAddress address) {
        int linear = address.getLinearAddress();
        if (linear < 0x10000 || linear >= 0x20000) return;
        War war = competition.getCurrentWar();
        int w = (war == null || loading) ? -1 : war.getCurrentWarrior();
        lastWriter[linear - 0x10000] = w;
        lastRound[linear - 0x10000] = round;
        if (w >= 0 && w < writes.length) writes[w]++;
    }

    public void onWarStart(long seed) {
        warIndex++;
        warSeed = seed;
        round = 0;
        java.util.Arrays.fill(lastWriter, -2);
        java.util.Arrays.fill(lastRound, -1);
        java.util.Arrays.fill(writes, 0);
        loading = true;
        rings.clear(); ringPos.clear();
    }
    public void onRound(int r) {
        round = r; loading = false;
        War war = competition.getCurrentWar();
        if (war == null) return;
        RealModeMemoryImpl mem = war.getMemory();
        for (int i = 0; i < war.getNumWarriors(); i++) {
            Warrior w = war.getWarrior(i);
            if (!w.isAlive() || !w.getGroupName().equals(team)) continue;
            CpuState s = w.getCpuState();
            int lin = (s.getCS() & 0xffff) * 16 + (s.getIP() & 0xffff);
            long code = 0;
            for (int k = 0; k < 4; k++) {
                int off = lin + k - 0x10000;
                int v = (off >= 0 && off < 0x10000) ? mem.readByte(new RealModeAddress((short) 0x1000, (short) off)) & 0xff : 0x100;
                code = (code << 9) | v;
            }
            long[][] ring = rings.computeIfAbsent(w.getName(), k -> new long[RING][]);
            int p = ringPos.getOrDefault(w.getName(), 0);
            ring[p % RING] = new long[] { r, s.getCS() & 0xffff, s.getIP() & 0xffff, s.getSP() & 0xffff, s.getDI() & 0xffff, s.getSI() & 0xffff, s.getCX() & 0xffff, s.getDX() & 0xffff, code };
            ringPos.put(w.getName(), p + 1);
        }
    }
    public void onWarriorBirth(String name) { }
    public void onEndRound() { }
    public void onCompetitionStart() { }
    public void onCompetitionEnd() { }

    private String desc(War war, int idx) {
        if (idx == -2) return "init";
        if (idx == -1) return "load";
        Warrior w = war.getWarrior(idx);
        return w.getName();
    }

    public void onWarriorDeath(String name, String reason) {
        War war = competition.getCurrentWar();
        Warrior dead = null;
        int deadIdx = -1;
        for (int i = 0; i < war.getNumWarriors(); i++) if (war.getWarrior(i).getName().equals(name)) { dead = war.getWarrior(i); deadIdx = i; }
        CpuState s = dead.getCpuState();
        int cs = s.getCS() & 0xffff, ip = s.getIP() & 0xffff;
        RealModeMemoryImpl mem = war.getMemory();
        StringBuilder sb = new StringBuilder();
        sb.append("{\"war\":").append(warIndex).append(",\"seed\":").append(warSeed).append(",\"round\":").append(round)
          .append(",\"name\":\"").append(name).append("\",\"group\":\"").append(dead.getGroupName())
          .append("\",\"type\":\"").append(dead.getType()).append("\",\"reason\":\"").append(reason)
          .append("\",\"load\":").append(dead.getLoadOffset() & 0xffff)
          .append(",\"cs\":").append(cs).append(",\"ip\":").append(ip)
          .append(",\"ss\":").append(s.getSS() & 0xffff).append(",\"sp\":").append(s.getSP() & 0xffff)
          .append(",\"ds\":").append(s.getDS() & 0xffff).append(",\"es\":").append(s.getES() & 0xffff)
          .append(",\"di\":").append(s.getDI() & 0xffff).append(",\"si\":").append(s.getSI() & 0xffff)
          .append(",\"bx\":").append(s.getBX() & 0xffff).append(",\"ax\":").append(s.getAX() & 0xffff)
          .append(",\"bytes\":[");
        int lin = cs * 16 + ip;
        for (int k = -4; k < 6; k++) {
            int a = lin + k;
            int off = a - 0x10000;
            if (k > -4) sb.append(',');
            if (off < 0 || off >= 0x10000) { sb.append("{\"oob\":true}"); continue; }
            int v = mem.readByte(new RealModeAddress((short) 0x1000, (short) off)) & 0xff;
            sb.append("{\"v\":").append(v).append(",\"by\":\"").append(desc(war, lastWriter[off])).append("\",\"r\":").append(lastRound[off]).append('}');
        }
        sb.append("],\"hist\":[");
        long[][] ring = rings.get(name);
        if (ring != null) {
            int p = ringPos.get(name);
            boolean f2 = true;
            for (int k = Math.max(0, p - RING); k < p; k++) {
                long[] e = ring[k % RING];
                if (!f2) sb.append(',');
                f2 = false;
                StringBuilder code = new StringBuilder();
                for (int b = 3; b >= 0; b--) { long v = (e[8] >> (9 * b)) & 0x1ff; code.append(v == 0x100 ? "--" : String.format("%02x", v)); }
                sb.append(String.format("\"r%d %04x:%04x sp=%04x di=%04x si=%04x cx=%04x dx=%04x %s\"", e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], code));
            }
        }
        sb.append("],\"alive\":[");
        boolean first = true;
        for (int i = 0; i < war.getNumWarriors(); i++) {
            Warrior w = war.getWarrior(i);
            if (!w.isAlive() || i == deadIdx) continue;
            if (!first) sb.append(',');
            first = false;
            int zl = (w.getCpuState().getCS() & 0xffff) * 16 + (w.getCpuState().getIP() & 0xffff) - 0x10000;
            String at = (zl >= 0 && zl < 0x10000) ? desc(war, lastWriter[zl]) : "oob";
            sb.append("{\"n\":\"").append(w.getName()).append("\",\"z\":").append(w.getType() == WarriorType.ZOMBIE || w.getType() == WarriorType.ZOMBIE_H)
              .append(",\"ipBy\":\"").append(at).append("\"}");
        }
        sb.append("]}");
        out.println(sb);
    }

    public void onWarEnd(int reason, String winners) {
        War war = competition.getCurrentWar();
        StringBuilder sb = new StringBuilder();
        sb.append("{\"warEnd\":").append(warIndex).append(",\"round\":").append(round).append(",\"winners\":\"").append(winners).append("\",\"writes\":{");
        for (int i = 0; i < war.getNumWarriors(); i++) {
            if (i > 0) sb.append(',');
            Warrior w = war.getWarrior(i);
            int zl = (w.getCpuState().getCS() & 0xffff) * 16 + (w.getCpuState().getIP() & 0xffff) - 0x10000;
            String at = (zl >= 0 && zl < 0x10000) ? desc(war, lastWriter[zl]) : "oob";
            sb.append('"').append(w.getName()).append("\":[").append(writes[i]).append(',').append(w.isAlive()).append(",\"").append(at).append("\"]");
        }
        sb.append("},\"a45\":{");
        // alignment histogram of A4/A5 bytes by last writer group (opponent trails)
        java.util.Map<String, int[]> h = new java.util.TreeMap<>();
        RealModeMemoryImpl mem = war.getMemory();
        for (int off = 0; off < 0x10000; off++) {
            int v = mem.readByte(new RealModeAddress((short) 0x1000, (short) off)) & 0xff;
            if (v != 0xa4 && v != 0xa5) continue;
            int wi = lastWriter[off];
            if (wi < 0) continue;
            String g = war.getWarrior(wi).getGroupName();
            int[] c = h.computeIfAbsent(g + (v == 0xa4 ? ":A4" : ":A5"), k -> new int[4]);
            c[off & 3]++;
        }
        boolean f3 = true;
        for (java.util.Map.Entry<String, int[]> e : h.entrySet()) {
            if (!f3) sb.append(',');
            f3 = false;
            int[] c = e.getValue();
            sb.append('"').append(e.getKey()).append("\":[").append(c[0]).append(',').append(c[1]).append(',').append(c[2]).append(',').append(c[3]).append(']');
        }
        sb.append("}}");
        out.println(sb);
    }
}
