import com.google.common.primitives.Longs;
import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.CompetitionEventListener;
import il.co.codeguru.corewars8086.war.ScoreEventListener;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import il.co.codeguru.corewars8086.war.WarriorRepository;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/** agent2: adapted from tools/engine-acceleration-20261001/runtime/SerialBatchMain.java (other agent). Unmodified engine classes; independent jobs run concurrently, each job is one serial Competition. */
public final class A2Batch {
    private static final class Job {
        final String id;
        final String[] args;
        Job(String id, String[] args) { this.id = id; this.args = args; }
    }

    public static void main(String[] args) throws Exception {
        if (args.length != 2) throw new IllegalArgumentException("usage: A2Batch <nul-framed-manifest> <threads>");
        Job[] jobs = readJobs(args[0]);
        int threads = Integer.parseInt(args[1]);
        java.util.concurrent.ExecutorService pool = java.util.concurrent.Executors.newFixedThreadPool(threads);
        java.util.List<java.util.concurrent.Future<?>> futures = new java.util.ArrayList<>();
        final java.io.PrintStream realOut = System.out;
        System.setOut(new java.io.PrintStream(new java.io.OutputStream() { public void write(int b) {} }));
        for (Job job : jobs) {
            futures.add(pool.submit(() -> {
                long started = System.nanoTime();
                OptionsParser parser = OptionsParser.newOptionsParser(Options.class);
                parser.parse(job.args);
                Options options = parser.getOptions(Options.class);
                validateOptions(options);
                Runner runner = new Runner(options);
                runner.run();
                synchronized (realOut) {
                    realOut.printf("BATCH_V1_DONE %s %d %d%n", job.id, runner.completedWars, System.nanoTime() - started);
                    realOut.flush();
                }
                return null;
            }));
        }
        pool.shutdown();
        int failed = 0;
        for (java.util.concurrent.Future<?> f : futures) {
            try { f.get(); } catch (java.util.concurrent.ExecutionException e) { failed++; e.getCause().printStackTrace(); }
        }
        if (failed > 0) { System.err.println("FAILED JOBS: " + failed); System.exit(2); }
    }

    private static Job[] readJobs(String file) throws IOException {
        String[] fields = new String(Files.readAllBytes(Paths.get(file)), StandardCharsets.UTF_8).split("\\x00", -1);
        if (fields.length < 4 || !fields[0].equals("CW8086-SERIAL-BATCH-V1") || !fields[fields.length - 1].isEmpty()) {
            throw new IllegalArgumentException("invalid NUL-framed batch manifest");
        }
        int count = Integer.parseInt(fields[1]);
        if (count < 1 || count > 10000) throw new IllegalArgumentException("invalid job count");
        Job[] jobs = new Job[count];
        Set<String> ids = new HashSet<>();
        int position = 2;
        for (int index = 0; index < count; index++) {
            if (position + 2 > fields.length - 1) throw new IllegalArgumentException("truncated job header");
            String id = fields[position++];
            if (!id.matches("[A-Za-z0-9_.-]+") || !ids.add(id)) throw new IllegalArgumentException("invalid/duplicate job id");
            int arguments = Integer.parseInt(fields[position++]);
            if (arguments < 1 || arguments > 1000 || position + arguments > fields.length - 1) {
                throw new IllegalArgumentException("invalid argument count");
            }
            jobs[index] = new Job(id, Arrays.copyOfRange(fields, position, position + arguments));
            position += arguments;
        }
        if (position != fields.length - 1) throw new IllegalArgumentException("unexpected trailing fields");
        return jobs;
    }

    private static void validateOptions(Options options) throws IOException {
        if (options == null || !options.headless || options.parallel || options.threads != 1
            || options.battlesPerCombo < 1 || options.totalBattles < 0 || options.combinationSize < 1) {
            throw new IllegalArgumentException("each job requires headless, parallel=false, threads=1 and positive battle settings");
        }
        File warriors = new File(options.warriorsDir);
        File[] files = warriors.listFiles();
        if (files == null || files.length == 0) throw new IOException("missing/empty staged warriors directory");
        // WarriorRepository.fixFiles deletes dotted names. Refuse them before
        // constructing a repository; dedicated staging is required for this tool.
        for (File file : files) {
            if (!file.isFile() || file.getName().contains(".")) {
                throw new IOException("warriors directory must contain only staged dot-free binary filenames");
            }
        }
        File zombies = new File(options.zombiesDir);
        if (!zombies.isDirectory()) throw new IOException("missing staged Zombies directory");
        requireNewOutput(options.outputFile);
        if (!options.telemetryFile.isEmpty()) requireNewOutput(options.telemetryFile);
        if (!options.telemetryFile.isEmpty()
            && new File(options.outputFile).getCanonicalFile().equals(new File(options.telemetryFile).getCanonicalFile())) {
            throw new IOException("score and telemetry outputs must differ");
        }
    }

    private static void requireNewOutput(String file) throws IOException {
        File output = new File(file);
        if (output.exists()) throw new IOException("refusing to overwrite " + output);
        File parent = output.getAbsoluteFile().getParentFile();
        if (parent == null || !parent.isDirectory()) throw new IOException("output parent must already exist: " + output);
    }

    /** Original headless observer semantics, minus the progress-bar UI. */
    private static final class Runner implements CompetitionEventListener, ScoreEventListener {
        private final Options options;
        private final Competition competition;
        private final Map<String, Integer> deathRounds = new HashMap<>();
        private final Map<String, String> deathReasons = new HashMap<>();
        private PrintWriter telemetry;
        private int currentRound;
        private long currentWarSeed;
        private int expectedWars;
        private int completedWars;

        Runner(Options options) throws IOException {
            this.options = options;
            System.out.println("CoreWars8086 - headless mode\n");
            competition = new Competition(options);
            competition.addCompetitionEventListener(this);
            WarriorRepository repository = competition.getWarriorRepository();
            if (repository.getNumberOfGroups() < options.combinationSize) {
                throw new IllegalArgumentException("insufficient warrior groups");
            }
            System.out.printf("Loaded warriors: %s%n", Arrays.toString(repository.getGroupNames()));
            repository.addScoreEventListener(this);
            if (!options.telemetryFile.isEmpty()) {
                // Same PrintWriter encoding/newline behavior and CSV header as
                // the original HeadlessCompetitionRunner on this host/JDK.
                telemetry = new PrintWriter(new File(options.telemetryFile));
                telemetry.println("war,seed,endRound,endReason,winners,name,group,type,loadOffset,alive,deathRound,deathReason,cs,ip,ss,sp,ds,es,energy,bomb86,bomb87");
            }
            long seed = Longs.tryParse(options.seed) != null ? Long.parseLong(options.seed) : options.seed.hashCode();
            competition.setSeed(seed);
        }

        void run() throws Exception {
            try {
                competition.runCompetition(options.battlesPerCombo, options.combinationSize, false);
                if (completedWars != expectedWars || expectedWars < 1) throw new IOException("incomplete battle count");
                if (!new File(options.outputFile).isFile()) throw new IOException("missing scores after synchronous completion");
            } finally {
                if (telemetry != null) {
                    telemetry.close();
                    telemetry = null;
                }
            }
        }

        public void onCompetitionStart() {
            completedWars = 0;
            expectedWars = competition.getTotalNumberOfWars();
            competition.setAbort(false);
            System.out.printf("Starting competition (%d wars).%n", expectedWars);
        }
        public void onCompetitionEnd() {
            System.out.printf("Competition is over. Ran %d wars%n", completedWars);
            if (telemetry != null) {
                boolean error = telemetry.checkError();
                telemetry.close();
                telemetry = null;
                if (error) throw new IllegalStateException("telemetry write failed");
            }
        }
        public void onWarStart(long seed) {
            currentWarSeed = seed;
            currentRound = 0;
            deathRounds.clear();
            deathReasons.clear();
        }
        public void onWarEnd(int reason, String winners) {
            writeTelemetry(reason, winners);
            completedWars++;
        }
        public void onRound(int round) { currentRound = round; }
        public void onWarriorBirth(String name) { }
        public void onWarriorDeath(String name, String reason) {
            deathRounds.put(name, currentRound);
            deathReasons.put(name, reason);
        }
        public void onEndRound() { }
        public void scoreChanged(String name, float addedValue, int groupIndex, int subIndex) { }

        private void writeTelemetry(int reason, String winners) {
            if (telemetry == null) return;
            War war = competition.getCurrentWar();
            if (war == null) return;
            for (int index = 0; index < war.getNumWarriors(); index++) {
                Warrior warrior = war.getWarrior(index);
                Integer deathRound = deathRounds.get(warrior.getName());
                String deathReason = deathReasons.get(warrior.getName());
                telemetry.printf("%d,%d,%d,%d,%s,%s,%s,%s,%d,%s,%s,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",
                    completedWars, currentWarSeed, currentRound, reason, csv(winners),
                    csv(warrior.getName()), csv(warrior.getGroupName()), warrior.getType(),
                    unsigned(warrior.getLoadOffset()), warrior.isAlive(),
                    deathRound == null ? "" : deathRound.toString(), csv(deathReason == null ? "" : deathReason),
                    unsigned(warrior.getCpuState().getCS()), unsigned(warrior.getCpuState().getIP()),
                    unsigned(warrior.getCpuState().getSS()), unsigned(warrior.getCpuState().getSP()),
                    unsigned(warrior.getCpuState().getDS()), unsigned(warrior.getCpuState().getES()),
                    unsigned(warrior.getCpuState().getEnergy()), warrior.getCpuState().getBomb1Count() & 0xff,
                    warrior.getCpuState().getBomb2Count() & 0xff);
            }
            telemetry.flush();
        }
        private static int unsigned(short value) { return value & 0xffff; }
        private static String csv(String value) { return '"' + value.replace("\"", "\"\"") + '"'; }
    }
}
