import com.google.common.primitives.Longs;
import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.cpu.Cpu;
import il.co.codeguru.corewars8086.cpu.CpuState;
import il.co.codeguru.corewars8086.memory.RealModeAddress;
import il.co.codeguru.corewars8086.memory.RealModeMemoryImpl;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.CompetitionEventListener;
import il.co.codeguru.corewars8086.war.ScoreEventListener;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import il.co.codeguru.corewars8086.war.WarriorRepository;

import java.io.File;
import java.io.IOException;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

/** Original-engine observer only: does not mutate Cpu, memory, scheduling, or RNG state. */
public final class DeathDiagnosticMain implements CompetitionEventListener, ScoreEventListener {
    private static final String ENGINE_SHA256 = "31639072397eaf69d99e90b10d8fa594a7446951f1137b7ebd298378f5ec318d";
    private final Options options;
    private final Competition competition;
    private final PrintStream diagnostics;
    private final Set<String> watched;
    private final int radius;
    private final Map<String, String> loadStates = new HashMap<String, String>();
    private final Map<String, Integer> deathRounds = new HashMap<String, Integer>();
    private final Map<String, String> deathReasons = new HashMap<String, String>();
    private PrintWriter telemetry;
    private int currentRound;
    private long currentWarSeed;
    private int expectedWars;
    private int completedWars;

    public static void main(String[] args) throws Exception {
        requireOriginalEngine();
        OptionsParser parser = OptionsParser.newOptionsParser(Options.class);
        parser.parse(args);
        Options options = parser.getOptions(Options.class);
        validateOptions(options);
        Set<String> watched = new LinkedHashSet<String>();
        for (String name : System.getProperty("diagnostic.names", "COD_pair1,COD_pair2").split(",", -1)) {
            if (name.trim().isEmpty()) throw new IllegalArgumentException("diagnostic.names contains an empty name");
            watched.add(name.trim());
        }
        int radius = Integer.parseInt(System.getProperty("diagnostic.radius", "16"));
        if (radius < 1 || radius > 64) throw new IllegalArgumentException("diagnostic.radius must be 1..64");
        PrintStream jsonOutput = System.out;
        // Keep JSONL clean. The original repository's score-file status message
        // goes to stderr; saveScoresToFile and the score CSV itself are unchanged.
        System.setOut(System.err);
        try {
            new DeathDiagnosticMain(options, jsonOutput, watched, radius).run();
            if (jsonOutput.checkError()) throw new IOException("diagnostic stdout write failed");
        } finally {
            System.setOut(jsonOutput);
        }
    }

    private static void requireOriginalEngine() throws Exception {
        File engine = new File(Competition.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getCanonicalFile();
        if (!engine.isFile()) throw new IOException("Competition must load from the original engine JAR");
        String actual = hex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(engine.toPath())));
        if (!ENGINE_SHA256.equals(actual)) throw new IOException("Unexpected original engine hash: " + actual);
        for (Class<?> type : new Class<?>[] {War.class, Warrior.class, Cpu.class, RealModeMemoryImpl.class}) {
            File location = new File(type.getProtectionDomain().getCodeSource().getLocation().toURI()).getCanonicalFile();
            if (!engine.equals(location)) throw new IOException("Refusing engine overlay: " + type.getName());
        }
    }

    private static void validateOptions(Options options) throws IOException {
        if (options == null || !options.headless || options.parallel || options.threads != 1
                || options.battlesPerCombo < 1 || options.totalBattles < 0 || options.combinationSize < 1) {
            throw new IllegalArgumentException("requires --headless --parallel=false --threads 1 and positive battle settings");
        }
        validateInputs(new File(options.warriorsDir), "warriors");
        validateInputs(new File(options.zombiesDir), "Zombies");
        requireNewOutput(options.outputFile);
        if (!options.telemetryFile.isEmpty()) {
            requireNewOutput(options.telemetryFile);
            if (new File(options.outputFile).getCanonicalFile().equals(new File(options.telemetryFile).getCanonicalFile())) {
                throw new IOException("score and telemetry output paths must differ");
            }
        }
    }

    private static void validateInputs(File directory, String kind) throws IOException {
        File[] files = directory.listFiles();
        if (files == null || files.length == 0) throw new IOException("missing/empty " + kind + " directory");
        // The repository's fixFiles method deletes/renames dotted survivor names.
        // Reject every such entry before constructing Competition; do not stage,
        // sort, rename, or recreate files, preserving the original Zombie order.
        for (File file : files) {
            if (!file.isFile() || file.getName().contains(".")) {
                throw new IOException("inputs must contain only dot-free binary files: " + file);
            }
        }
    }

    private static void requireNewOutput(String path) throws IOException {
        File file = new File(path);
        if (file.exists()) throw new IOException("refusing to overwrite " + file);
        File parent = file.getAbsoluteFile().getParentFile();
        if (parent == null || !parent.isDirectory()) throw new IOException("output parent must already exist: " + file);
    }

    private DeathDiagnosticMain(Options options, PrintStream diagnostics, Set<String> watched, int radius) throws IOException {
        this.options = options;
        this.diagnostics = diagnostics;
        this.watched = watched;
        this.radius = radius;
        competition = new Competition(options);
        competition.addCompetitionEventListener(this);
        WarriorRepository repository = competition.getWarriorRepository();
        if (repository.getNumberOfGroups() < options.combinationSize) throw new IllegalArgumentException("insufficient groups");
        repository.addScoreEventListener(this);
        if (!options.telemetryFile.isEmpty()) {
            telemetry = new PrintWriter(new File(options.telemetryFile));
            telemetry.println("war,seed,endRound,endReason,winners,name,group,type,loadOffset,alive,deathRound,deathReason,cs,ip,ss,sp,ds,es,energy,bomb86,bomb87");
        }
        long seed = Longs.tryParse(options.seed) != null ? Long.parseLong(options.seed) : options.seed.hashCode();
        competition.setSeed(seed);
    }

    private void run() throws Exception {
        try {
            competition.runCompetition(options.battlesPerCombo, options.combinationSize, false);
            if (completedWars != expectedWars || expectedWars < 1) throw new IOException("incomplete war count");
            if (!new File(options.outputFile).isFile()) throw new IOException("missing original score output");
            emit("{\"event\":\"complete\",\"wars\":" + completedWars + ",\"scoreFile\":" + quote(options.outputFile) + "}");
        } finally {
            if (telemetry != null) { telemetry.close(); telemetry = null; }
        }
    }

    public void onCompetitionStart() {
        completedWars = 0;
        expectedWars = competition.getTotalNumberOfWars();
        competition.setAbort(false);
        emit("{\"event\":\"competitionStart\",\"wars\":" + expectedWars + ",\"seedText\":" + quote(options.seed)
                + ",\"initialSeed\":" + competition.getSeed() + ",\"engineSha256\":" + quote(ENGINE_SHA256) + "}");
    }
    public void onCompetitionEnd() {
        if (telemetry != null) {
            boolean failed = telemetry.checkError();
            telemetry.close(); telemetry = null;
            if (failed) throw new IllegalStateException("telemetry write failed");
        }
    }
    public void onWarStart(long seed) {
        currentWarSeed = seed;
        currentRound = 0;
        loadStates.clear(); deathRounds.clear(); deathReasons.clear();
    }
    public void onRound(int round) { currentRound = round; }
    public void onEndRound() { }
    public void scoreChanged(String name, float value, int groupIndex, int subIndex) { }

    public void onWarriorBirth(String name) {
        if (!watched.contains(name)) return;
        Warrior warrior = findWarrior(name);
        String state = snapshot(warrior);
        loadStates.put(name, state);
        emit(event("birth", warrior) + ",\"state\":" + state + "}");
    }

    public void onWarriorDeath(String name, String reason) {
        deathRounds.put(name, currentRound);
        deathReasons.put(name, reason);
        if (!watched.contains(name)) return;
        Warrior warrior = findWarrior(name);
        emit(event("death", warrior) + ",\"reason\":" + quote(reason)
                + ",\"observation\":\"callback-before-kill; IP may already be advanced past the faulting instruction\""
                + ",\"loadState\":" + loadStates.get(name) + ",\"state\":" + snapshot(warrior) + "}");
    }

    public void onWarEnd(int reason, String winners) {
        writeTelemetry(reason, winners);
        emit("{\"event\":\"warEnd\",\"war\":" + completedWars + ",\"seed\":" + currentWarSeed
                + ",\"round\":" + currentRound + ",\"reason\":" + reason + ",\"winners\":" + quote(winners) + "}");
        ++completedWars;
    }

    private Warrior findWarrior(String name) {
        War war = competition.getCurrentWar();
        if (war != null) {
            for (int i = 0; i < war.getNumWarriors(); ++i) {
                Warrior warrior = war.getWarrior(i);
                if (warrior.getName().equals(name)) return warrior;
            }
        }
        throw new IllegalStateException("callback warrior missing: " + name);
    }

    private String event(String event, Warrior warrior) {
        return "{\"event\":" + quote(event) + ",\"war\":" + completedWars + ",\"seed\":" + currentWarSeed
                + ",\"round\":" + currentRound + ",\"currentWarriorIndex\":" + competition.getCurrentWarrior()
                + ",\"name\":" + quote(warrior.getName()) + ",\"group\":" + quote(warrior.getGroupName())
                + ",\"type\":" + quote(warrior.getType().toString()) + ",\"loadOffset\":" + unsigned(warrior.getLoadOffset());
    }

    private String snapshot(Warrior warrior) {
        CpuState s = warrior.getCpuState();
        RealModeMemoryImpl core = competition.getCurrentWar().getMemory();
        return "{\"aliveAtCallback\":" + warrior.isAlive()
                + ",\"ax\":" + unsigned(s.getAX()) + ",\"bx\":" + unsigned(s.getBX())
                + ",\"cx\":" + unsigned(s.getCX()) + ",\"dx\":" + unsigned(s.getDX())
                + ",\"si\":" + unsigned(s.getSI()) + ",\"di\":" + unsigned(s.getDI())
                + ",\"bp\":" + unsigned(s.getBP()) + ",\"sp\":" + unsigned(s.getSP())
                + ",\"cs\":" + unsigned(s.getCS()) + ",\"ip\":" + unsigned(s.getIP()) + ",\"ss\":" + unsigned(s.getSS())
                + ",\"ds\":" + unsigned(s.getDS()) + ",\"es\":" + unsigned(s.getES())
                + ",\"flags\":" + unsigned(s.getFlags()) + ",\"df\":" + s.getDirectionFlag()
                + ",\"energy\":" + unsigned(s.getEnergy()) + ",\"bomb86\":" + (s.getBomb1Count() & 0xFF)
                + ",\"bomb87\":" + (s.getBomb2Count() & 0xFF)
                + ",\"dsBxWord\":" + word(core, s.getDS(), s.getBX())
                + ",\"dsBxPlus2Word\":" + word(core, s.getDS(), (short)(s.getBX() + 2))
                + ",\"dsSiWord\":" + word(core, s.getDS(), s.getSI())
                + ",\"esDiWord\":" + word(core, s.getES(), s.getDI())
                + ",\"ssSpWord\":" + word(core, s.getSS(), s.getSP())
                + ",\"codeWindow\":" + window(core, s.getCS(), (short)(s.getIP() - radius), radius * 2 + 1)
                + ",\"codeWindowIpIndex\":" + radius
                + ",\"dsZeroWindow\":" + window(core, s.getDS(), (short)0, 32) + "}";
    }

    // Diagnostic reads deliberately use the unrestricted physical core. They
    // neither execute bytes nor call the warrior's permission-checked memory.
    // Values outside that warrior's permissions are observations, not proof that
    // the warrior could access them. Segment-offset wrapping matches the engine.
    private static String word(RealModeMemoryImpl core, short segment, short offset) {
        try { return Integer.toString(unsigned(core.readWord(new RealModeAddress(segment, offset)))); }
        catch (Exception e) { return "{\"readError\":" + quote(e.toString()) + "}"; }
    }

    private static String window(RealModeMemoryImpl core, short segment, short offset, int count) {
        try {
            byte[] bytes = new byte[count];
            for (int i = 0; i < count; ++i) bytes[i] = core.readByte(new RealModeAddress(segment, (short)(offset + i)));
            return "{\"segment\":" + unsigned(segment) + ",\"offset\":" + unsigned(offset)
                    + ",\"linear\":" + new RealModeAddress(segment, offset).getLinearAddress() + ",\"hex\":" + quote(hex(bytes)) + "}";
        } catch (Exception e) { return "{\"readError\":" + quote(e.toString()) + "}"; }
    }

    private void writeTelemetry(int reason, String winners) {
        if (telemetry == null) return;
        War war = competition.getCurrentWar();
        if (war == null) return;
        for (int i = 0; i < war.getNumWarriors(); ++i) {
            Warrior warrior = war.getWarrior(i);
            Integer deathRound = deathRounds.get(warrior.getName());
            String deathReason = deathReasons.get(warrior.getName());
            CpuState s = warrior.getCpuState();
            telemetry.printf("%d,%d,%d,%d,%s,%s,%s,%s,%d,%s,%s,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",
                    completedWars, currentWarSeed, currentRound, reason, csv(winners), csv(warrior.getName()),
                    csv(warrior.getGroupName()), warrior.getType(), unsigned(warrior.getLoadOffset()), warrior.isAlive(),
                    deathRound == null ? "" : deathRound.toString(), csv(deathReason == null ? "" : deathReason),
                    unsigned(s.getCS()), unsigned(s.getIP()), unsigned(s.getSS()), unsigned(s.getSP()),
                    unsigned(s.getDS()), unsigned(s.getES()), unsigned(s.getEnergy()),
                    s.getBomb1Count() & 0xFF, s.getBomb2Count() & 0xFF);
        }
        telemetry.flush();
    }

    private void emit(String json) { diagnostics.println(json); diagnostics.flush(); }
    private static int unsigned(short value) { return value & 0xFFFF; }
    private static String csv(String value) { return '"' + value.replace("\"", "\"\"") + '"'; }
    private static String hex(byte[] bytes) {
        char[] digits = "0123456789abcdef".toCharArray();
        char[] result = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; ++i) {
            int value = bytes[i] & 0xFF;
            result[i * 2] = digits[value >>> 4]; result[i * 2 + 1] = digits[value & 15];
        }
        return new String(result);
    }
    private static String quote(String value) {
        if (value == null) return "null";
        StringBuilder result = new StringBuilder("\"");
        for (int i = 0; i < value.length(); ++i) {
            char c = value.charAt(i);
            if (c == '\\' || c == '"') result.append('\\').append(c);
            else if (c < 0x20) result.append(String.format("\\u%04x", (int)c));
            else result.append(c);
        }
        return result.append('"').toString();
    }
}
