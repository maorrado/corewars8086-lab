package il.co.codeguru.corewars8086.cli;

import com.google.common.primitives.Longs;
import com.google.devtools.common.options.OptionsParser;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.WarriorRepository;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Runs many independent headless competitions ("jobs") in one JVM, on one shared
 * thread pool.
 *
 * Each job is one ordinary headless invocation, given by its usual command-line
 * arguments (one job per line of the jobs file, arguments separated by tabs). A job
 * reproduces that invocation's --parallel=false result exactly: the same option
 * parsing and warrior loading, the same combination iterator and war seeds
 * (Competition.planCompetition), and the same score additions in war-id order. Only
 * the assignment of wars to threads differs, and no war depends on it: every war owns
 * its memory, CPU state and seeded Random.
 *
 * What this saves over one process per job: JVM start-up and JIT warm-up per job, and
 * idle cores at the end of every job (the pool always has work from the next job).
 *
 * Usage: java -cp engine.jar il.co.codeguru.corewars8086.cli.BatchRunner jobsFile [threads]
 */
public final class BatchRunner {

    private static final class Job {
        final int index;
        final String[] args;
        final Options options;
        final Competition competition;
        final List<Competition.PlannedWar> wars;
        final String[][] scoringNames;
        final float[] scoreValues;
        final AtomicInteger remaining;
        volatile Throwable failure;

        Job(int index, String[] args, Options options, Competition competition, List<Competition.PlannedWar> wars) {
            this.index = index;
            this.args = args;
            this.options = options;
            this.competition = competition;
            this.wars = wars;
            this.scoringNames = new String[wars.size()][];
            this.scoreValues = new float[wars.size()];
            this.remaining = new AtomicInteger(wars.size());
        }
    }

    public static void main(String[] args) throws Exception {
        if (args.length < 1 || args.length > 2) {
            System.err.println("usage: BatchRunner <jobsFile> [threads]");
            System.exit(2);
        }
        final int threads = args.length > 1 ? Integer.parseInt(args[1]) : Runtime.getRuntime().availableProcessors();
        final List<Job> jobs = loadJobs(args[0]);
        int totalWars = 0;
        for (Job job : jobs) totalWars += job.wars.size();
        System.out.printf("BatchRunner: %d jobs, %d wars, %d threads%n", jobs.size(), totalWars, threads);

        final long started = System.nanoTime();
        final AtomicInteger jobsDone = new AtomicInteger();
        final AtomicInteger jobsFailed = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        for (Job job : jobs) {
            for (int id = 0; id < job.wars.size(); id++) {
                final int warId = id;
                pool.execute(() -> runWar(job, warId, jobs.size(), jobsDone, jobsFailed, started));
            }
        }
        pool.shutdown();
        while (!pool.awaitTermination(1, TimeUnit.MINUTES)) {
            // keep waiting; progress is printed per finished job
        }
        double seconds = (System.nanoTime() - started) / 1e9;
        System.out.printf("BatchRunner: finished %d jobs (%d failed) in %.2fs%n", jobsDone.get(), jobsFailed.get(), seconds);
        if (jobsFailed.get() > 0 || jobsDone.get() != jobs.size()) {
            System.exit(1);
        }
    }

    private static List<Job> loadJobs(String jobsFile) throws IOException {
        List<Job> jobs = new ArrayList<>();
        for (String line : Files.readAllLines(Paths.get(jobsFile), StandardCharsets.UTF_8)) {
            if (line.trim().isEmpty()) continue;
            String[] jobArgs = line.split("\t");
            OptionsParser parser = OptionsParser.newOptionsParser(Options.class);
            try {
                parser.parse(jobArgs);
            } catch (Exception e) {
                throw new IllegalArgumentException("job " + jobs.size() + ": bad arguments " + Arrays.toString(jobArgs), e);
            }
            Options options = parser.getOptions(Options.class);
            if (!options.telemetryFile.isEmpty()) {
                throw new IllegalArgumentException("job " + jobs.size() + ": --telemetryFile is not supported in batch mode");
            }
            Competition competition = new Competition(options);
            competition.setMemoryEventsEnabled(false);
            // same seed interpretation as HeadlessCompetitionRunner
            long seed = Longs.tryParse(options.seed) != null ? Long.parseLong(options.seed) : options.seed.hashCode();
            competition.setSeed(seed);
            WarriorRepository repository = competition.getWarriorRepository();
            if (repository.getNumberOfGroups() < options.combinationSize) {
                throw new IllegalArgumentException(String.format("job %d: not enough survivors (got %d but %d are needed)",
                    jobs.size(), repository.getNumberOfGroups(), options.combinationSize));
            }
            List<Competition.PlannedWar> wars = competition.planCompetition(options.battlesPerCombo, options.combinationSize);
            jobs.add(new Job(jobs.size(), jobArgs, options, competition, wars));
        }
        return jobs;
    }

    private static void runWar(Job job, int warId, int totalJobs, AtomicInteger jobsDone, AtomicInteger jobsFailed, long started) {
        try {
            if (job.failure == null) {
                Competition.PlannedWar planned = job.wars.get(warId);
                War war = job.competition.runWarInParallel(planned.groups, planned.seed, warId);
                job.scoringNames[warId] = war.getScoringWarriorNames();
                job.scoreValues[warId] = war.getScorePerSurvivor();
            }
        } catch (Throwable t) {
            job.failure = t;
        }
        // The decrement publishes this war's awards; whoever brings the count to zero
        // sees every war's awards and writes the job's scores.
        if (job.remaining.decrementAndGet() == 0) {
            finishJob(job, totalJobs, jobsDone, jobsFailed, started);
        }
    }

    private static void finishJob(Job job, int totalJobs, AtomicInteger jobsDone, AtomicInteger jobsFailed, long started) {
        if (job.failure != null) {
            jobsFailed.incrementAndGet();
            System.err.printf("job %d FAILED (%s): %s%n", job.index, job.options.outputFile, job.failure);
            job.failure.printStackTrace();
            return;
        }
        WarriorRepository repository = job.competition.getWarriorRepository();
        for (int id = 0; id < job.wars.size(); id++) {
            for (String name : job.scoringNames[id]) {
                repository.addScore(name, job.scoreValues[id]);
            }
        }
        synchronized (BatchRunner.class) { // keep job lines whole on stdout
            repository.saveScoresToFile(job.options.outputFile);
            System.out.printf("job %d done (%d/%d) %.1fs%n", job.index, jobsDone.incrementAndGet(), totalJobs,
                (System.nanoTime() - started) / 1e9);
        }
    }
}
