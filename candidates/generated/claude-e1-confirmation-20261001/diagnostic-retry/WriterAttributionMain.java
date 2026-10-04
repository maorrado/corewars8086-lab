import com.google.common.primitives.Longs;
import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.cpu.Cpu;
import il.co.codeguru.corewars8086.cpu.CpuState;
import il.co.codeguru.corewars8086.memory.MemoryEventListener;
import il.co.codeguru.corewars8086.memory.RealModeAddress;
import il.co.codeguru.corewars8086.memory.RealModeMemoryImpl;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.CompetitionEventListener;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/** Diagnostic listener only. No memory/register writes, opcode execution, or RNG calls. */
public final class WriterAttributionMain implements CompetitionEventListener, MemoryEventListener {
    static final String ENGINE = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
    static final String SEED = "claude-synthesis-duel-1-cfec1882f8ac1f4fc47a2263";
    static final int ARENA = 0x10000, HOOK = ARENA + 0x5d13;
    static final String CAPTURE_PREFIX = "31ffb8f3a5ba061fb3ccfdcd87fc";
    static final String[] ENTRY_NAMES = { "COD_A1", "COD_B1" };
    static final int[] ENTRY_OFFSETS = { 76, 56 };
    final Options options;
    final Competition competition;
    final PrintStream out;
    final Watch[] watched = new Watch[2];
    final int[] anchorBytes = new int[128];
    final String[] anchorLastChanges = new String[128];
    final int[] hookBytes = new int[2];
    final String[] hookLastChanges = new String[2];
    final int[] entries = new int[2];
    final Set<String> observedEntries = new HashSet<String>();
    final String[] previousZombieBoundary = new String[64];
    int round = -1, completedWars, expectedWars;
    long seed, writeSequence, hookWrites, activeAnchorChanges, latticeChanges;
    boolean ready;
    String observerFailure;

    static final class Watch {
        final Warrior warrior;
        final int cellLinear;
        int pointer = -1, anchor = -1, generation;
        Watch(Warrior warrior, int cell) {
            this.warrior = warrior;
            cellLinear = linear(u(warrior.getCpuState().getSS()), cell);
        }
    }

    public static void main(String[] args) throws Exception {
        requireOriginalEngine();
        OptionsParser parser = OptionsParser.newOptionsParser(Options.class);
        parser.parse(args);
        Options o = parser.getOptions(Options.class);
        require(o.headless && !o.parallel && o.threads == 1 && o.combinationSize == 2
                && o.battlesPerCombo == 125 && o.totalBattles == 0 && o.zombieSpeed == 2 && SEED.equals(o.seed)
                && o.telemetryFile.isEmpty(), "Unexpected replay settings");
        inputs(new File(o.warriorsDir), 4); inputs(new File(o.zombiesDir), 4);
        File target = new File(o.outputFile);
        require(!target.exists() && target.getAbsoluteFile().getParentFile().isDirectory(), "Score output must be new");
        PrintStream json = System.out;
        System.setOut(System.err);
        try {
            WriterAttributionMain tool = new WriterAttributionMain(o, json);
            tool.competition.runCompetition(125, 2, false);
            require(tool.completedWars == 125 && tool.expectedWars == 125, "Incomplete replay");
            require(tool.observerFailure == null, "Observer failed: " + tool.observerFailure);
            require(target.isFile(), "Score output missing");
            tool.emit("{\"event\":\"complete\",\"wars\":125,\"scoreFile\":" + q(o.outputFile) + "}");
            require(!json.checkError(), "Diagnostic output failed");
        } finally { System.setOut(json); }
    }

    WriterAttributionMain(Options o, PrintStream out) throws IOException {
        this.options = o; this.out = out;
        competition = new Competition(o);
        require(competition.getWarriorRepository().getNumberOfGroups() == 2, "Expected two survivor groups");
        competition.addCompetitionEventListener(this);
        // Public multicaster: do not replace or suppress existing listeners.
        competition.addMemoryEventLister(this);
        long initialSeed = Longs.tryParse(o.seed) == null ? o.seed.hashCode() : Long.parseLong(o.seed);
        competition.setSeed(initialSeed);
    }

    public void onCompetitionStart() {
        expectedWars = competition.getTotalNumberOfWars();
        emit("{\"event\":\"competitionStart\",\"wars\":" + expectedWars + ",\"initialSeed\":"
                + competition.getSeed() + ",\"seedText\":" + q(options.seed) + ",\"engineSha256\":" + q(ENGINE) + "}");
    }
    public void onCompetitionEnd() { }
    public void onWarStart(long seed) {
        this.seed = seed; round = -1; ready = false;
        writeSequence = hookWrites = activeAnchorChanges = latticeChanges = 0;
        Arrays.fill(watched, null); Arrays.fill(anchorLastChanges, null); Arrays.fill(hookLastChanges, null);
        Arrays.fill(previousZombieBoundary, null); observedEntries.clear();
    }
    public void onWarriorBirth(String name) {
        Warrior w = find(name);
        emit(base("birth") + ",\"name\":" + q(name) + ",\"group\":" + q(w.getGroupName())
                + ",\"type\":" + q(w.getType().toString()) + ",\"loadOffset\":" + u(w.getLoadOffset())
                + ",\"state\":" + state(w) + "}");
    }
    public void onRound(int round) {
        this.round = round;
        if (observerFailure != null) return;
        try {
            if (!ready) initializeAfterLoading();
            for (Watch watch : watched) refresh(watch, "round-boundary");
            observeZombieEntries();
        } catch (Exception e) { observerFailure = e.toString(); }
    }
    public void onEndRound() { }

    void initializeAfterLoading() {
        War war = war();
        require(war.getNumWarriors() == 8, "Expected four survivors and four Zombies");
        watched[0] = new Watch(find("COD_B1"), 0x200);
        watched[1] = new Watch(find("COD_B2"), 0x240);
        for (int i = 0; i < 128; i++) anchorBytes[i] = read(ARENA + (i / 2) * 0x400 + 0x62 + i % 2);
        for (int i = 0; i < 2; i++) {
            hookBytes[i] = read(HOOK + i);
            entries[i] = (u(find(ENTRY_NAMES[i]).getLoadOffset()) + ENTRY_OFFSETS[i]) & 0xffff;
        }
        ready = true;
        emit(base("observerReady") + ",\"watched\":[\"COD_B1\",\"COD_B2\"],\"latticeBytes\":128"
                + ",\"captureEntries\":[{\"name\":\"COD_A1\",\"offset\":" + entries[0]
                + "},{\"name\":\"COD_B1\",\"offset\":" + entries[1] + "}]}" );
    }

    public void onMemoryWrite(RealModeAddress address) {
        // Callback is after the actual byte write. Ignore loading/unrelated
        // addresses. All aliases are compared by physical linear address.
        if (!ready || observerFailure != null) return;
        int at = address.getLinearAddress();
        int offset = at - ARENA;
        int residue = offset & 0x3ff;
        boolean hook = at == HOOK || at == HOOK + 1;
        boolean lattice = offset >= 0 && offset < 65536 && (residue == 0x62 || residue == 0x63);
        boolean pointerCommit = false;
        for (Watch watch : watched) if (at == watch.cellLinear + 1 || at == watch.cellLinear + 3) pointerCommit = true;
        if (!hook && !lattice && !pointerCommit) return;
        try {
            ++writeSequence;
            if (pointerCommit) for (Watch watch : watched) {
                // Original writeWord writes low, then high. Read after the high
                // byte only, avoiding an intermediate half-written pointer.
                if (at == watch.cellLinear + 1 || at == watch.cellLinear + 3) refresh(watch, "private-pointer-word-commit");
            }
            if (!hook && !lattice) return;
            String writer = writer();
            int after = read(at);
            if (hook) {
                int index = at - HOOK, before = hookBytes[index]; hookBytes[index] = after; ++hookWrites;
                String change = change(at, before, after, writer);
                if (before != after) hookLastChanges[index] = change;
                emit(base("hookWrite") + ",\"change\":" + change + ",\"wordAfterByte\":" + word(HOOK)
                        + ",\"wordMayBePartiallyWritten\":" + (index == 0) + "}");
            }
            if (lattice) {
                int index = (offset / 0x400) * 2 + residue - 0x62;
                int before = anchorBytes[index]; anchorBytes[index] = after;
                if (before == after) return;
                ++latticeChanges;
                String change = change(at, before, after, writer); anchorLastChanges[index] = change;
                for (Watch watch : watched) if (watch.warrior.isAlive() && (at == watch.anchor || at == watch.anchor + 1)) {
                    ++activeAnchorChanges;
                    emit(base("anchorWrite") + ",\"watch\":" + q(watch.warrior.getName())
                            + ",\"change\":" + change + ",\"anchor\":" + anchor(watch)
                            + ",\"watchState\":" + state(watch.warrior) + "}");
                }
            }
        } catch (Exception e) {
            // Never turn an observer exception into a warrior death. Finish the
            // original game, then refuse acceptance of this diagnostic replay.
            observerFailure = e.toString();
        }
    }

    void refresh(Watch watch, String reason) {
        if (!watch.warrior.isAlive()) return;
        int segment = word(watch.cellLinear + 2);
        int pointer = word(watch.cellLinear);
        int next = segment == 0xffc ? linear(segment, pointer) : -1;
        if (next == watch.anchor && pointer == watch.pointer) return;
        // Ignore pre-initialization bytes; record loss of an initialized pointer.
        if (next == -1 && watch.anchor == -1) return;
        watch.pointer = pointer; watch.anchor = next; watch.generation++;
        emit(base("anchorActivate") + ",\"watch\":" + q(watch.warrior.getName())
                + ",\"reason\":" + q(reason) + ",\"pointerSegment\":" + segment
                + ",\"anchor\":" + anchor(watch) + ",\"watchState\":" + state(watch.warrior) + "}");
    }

    void observeZombieEntries() {
        War war = war();
        for (int i = 0; i < war.getNumWarriors(); i++) {
            Warrior zombie = war.getWarrior(i);
            if (!zombie.isZombie() || !zombie.isAlive()) continue;
            CpuState s = zombie.getCpuState();
            for (int j = 0; j < entries.length; j++) {
                int distance = (u(s.getIP()) - entries[j]) & 0xffff;
                String key = zombie.getName() + ":" + ENTRY_NAMES[j];
                if (u(s.getCS()) == 0x1000 && distance < CAPTURE_PREFIX.length() / 2 && observedEntries.add(key)) {
                    String actual = bytes(ARENA + entries[j], CAPTURE_PREFIX.length() / 2);
                    emit(base("captureEntryObserved") + ",\"name\":" + q(zombie.getName())
                            + ",\"entryProgram\":" + q(ENTRY_NAMES[j]) + ",\"entryOffset\":" + entries[j]
                            + ",\"prefixStillMatches\":" + actual.equals(CAPTURE_PREFIX) + ",\"currentPrefix\":" + q(actual)
                            + ",\"observation\":\"first round-boundary IP in frozen entry-prefix range, not exact jump time\""
                            + ",\"previousBoundary\":" + previousZombieBoundary[i] + ",\"state\":" + state(zombie)
                            + ",\"hookWord\":" + word(HOOK) + ",\"hookLastChanges\":" + pair(hookLastChanges[0], hookLastChanges[1]) + "}");
                }
            }
            previousZombieBoundary[i] = "{\"round\":" + round + ",\"cs\":" + u(s.getCS()) + ",\"ip\":" + u(s.getIP()) + "}";
        }
    }

    public void onWarriorDeath(String name, String reason) {
        Warrior w = find(name);
        String anchors = "null";
        for (Watch watch : watched) if (watch != null && watch.warrior == w) anchors = anchor(watch);
        emit(base("death") + ",\"name\":" + q(name) + ",\"type\":" + q(w.getType().toString())
                + ",\"reason\":" + q(reason) + ",\"state\":" + state(w) + ",\"anchor\":" + anchors
                + ",\"observation\":\"callback before kill; IP may have advanced past faulting bytes\"}");
    }
    public void onWarEnd(int reason, String winners) {
        emit(base("warEnd") + ",\"reason\":" + reason + ",\"winners\":" + q(winners)
                + ",\"hookWrites\":" + hookWrites + ",\"activeAnchorChanges\":" + activeAnchorChanges
                + ",\"latticeChanges\":" + latticeChanges + ",\"observerFailure\":" + q(observerFailure) + "}");
        ready = false; ++completedWars;
    }

    String anchor(Watch watch) {
        int at = watch.anchor, index = -1;
        if (at >= ARENA && at < ARENA + 65535 && ((at - ARENA) & 0x3ff) == 0x62) index = ((at - ARENA) / 0x400) * 2;
        return "{\"generation\":" + watch.generation + ",\"pointer\":" + watch.pointer + ",\"linear\":" + at
                + ",\"onExpectedLattice\":" + (index >= 0) + ",\"hex6\":" + (at < 0 ? "null" : q(bytes(at, 6)))
                + ",\"lastChanges\":" + (index < 0 ? "null" : pair(anchorLastChanges[index], anchorLastChanges[index + 1])) + "}";
    }
    String writer() {
        int index = war().getCurrentWarrior();
        require(index >= 0 && index < war().getNumWarriors(), "Missing current writer");
        Warrior w = war().getWarrior(index);
        CpuState s = w.getCpuState();
        return "{\"index\":" + index + ",\"name\":" + q(w.getName()) + ",\"group\":" + q(w.getGroupName())
                + ",\"type\":" + q(w.getType().toString()) + ",\"state\":" + state(w)
                + ",\"ipMeaning\":\"register value during post-byte-write callback; not opcode-start address\""
                + ",\"nearIpHex\":" + q(window(u(s.getCS()), (u(s.getIP()) - 8) & 65535, 16)) + "}";
    }
    String change(int at, int before, int after, String writer) {
        return "{\"war\":" + completedWars + ",\"round\":" + round + ",\"sequence\":" + writeSequence
                + ",\"linear\":" + at + ",\"before\":" + before + ",\"after\":" + after + ",\"writer\":" + writer + "}";
    }
    String state(Warrior w) {
        CpuState s = w.getCpuState();
        return "{\"ax\":" + u(s.getAX()) + ",\"bx\":" + u(s.getBX()) + ",\"cx\":" + u(s.getCX())
                + ",\"dx\":" + u(s.getDX()) + ",\"si\":" + u(s.getSI()) + ",\"di\":" + u(s.getDI())
                + ",\"bp\":" + u(s.getBP()) + ",\"sp\":" + u(s.getSP()) + ",\"cs\":" + u(s.getCS())
                + ",\"ip\":" + u(s.getIP()) + ",\"ss\":" + u(s.getSS()) + ",\"ds\":" + u(s.getDS())
                + ",\"es\":" + u(s.getES()) + ",\"flags\":" + u(s.getFlags()) + ",\"energy\":" + u(s.getEnergy())
                + ",\"bomb86\":" + (s.getBomb1Count() & 255) + ",\"bomb87\":" + (s.getBomb2Count() & 255) + "}";
    }
    War war() { return competition.getCurrentWar(); }
    Warrior find(String name) {
        for (int i = 0; i < war().getNumWarriors(); i++) if (name.equals(war().getWarrior(i).getName())) return war().getWarrior(i);
        throw new IllegalStateException("Warrior not found: " + name);
    }
    int read(int at) { return war().getMemory().readByte(new RealModeAddress((short)(at >>> 4), (short)(at & 15))) & 255; }
    int word(int at) { return read(at) | (read((at + 1) & 0xfffff) << 8); }
    String bytes(int at, int count) { StringBuilder b = new StringBuilder(); for (int i = 0; i < count; i++) b.append(String.format("%02x", read((at + i) & 0xfffff))); return b.toString(); }
    String window(int segment, int offset, int count) { StringBuilder b = new StringBuilder(); for (int i = 0; i < count; i++) b.append(String.format("%02x", read(linear(segment, (offset + i) & 65535)))); return b.toString(); }
    String base(String event) { return "{\"event\":" + q(event) + ",\"war\":" + completedWars + ",\"seed\":" + seed + ",\"round\":" + round; }
    void emit(String json) { out.println(json); }
    static String pair(String a, String b) { return "[" + a + "," + b + "]"; }
    static int linear(int segment, int offset) { return ((segment << 4) + offset) & 0xfffff; }
    static int u(short value) { return value & 65535; }
    static void require(boolean ok, String message) { if (!ok) throw new IllegalStateException(message); }
    static void inputs(File directory, int expected) {
        File[] files = directory.listFiles(); require(files != null && files.length == expected, "Input count mismatch");
        for (File file : files) require(file.isFile() && !file.getName().contains("."), "Input must be a dot-free binary");
    }
    static void requireOriginalEngine() throws Exception {
        File jar = new File(Competition.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getCanonicalFile();
        require(jar.isFile(), "Engine must load from original JAR");
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(jar.toPath()));
        StringBuilder hex = new StringBuilder(); for (byte value : digest) hex.append(String.format("%02x", value & 255));
        require(ENGINE.equals(hex.toString()), "Unexpected engine hash");
        for (Class<?> type : new Class<?>[]{War.class, Warrior.class, Cpu.class, CpuState.class, RealModeMemoryImpl.class, RealModeAddress.class})
            require(jar.equals(new File(type.getProtectionDomain().getCodeSource().getLocation().toURI()).getCanonicalFile()), "No engine overlays allowed");
    }
    static String q(String value) {
        if (value == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) { char c = value.charAt(i);
            if (c == '\\' || c == '"') b.append('\\').append(c);
            else if (c < 32) b.append(String.format("\\u%04x", (int)c)); else b.append(c);
        }
        return b.append('"').toString();
    }
}
