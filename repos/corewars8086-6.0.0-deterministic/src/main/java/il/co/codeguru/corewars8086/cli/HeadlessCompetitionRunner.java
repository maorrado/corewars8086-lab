package il.co.codeguru.corewars8086.cli;

import com.google.common.primitives.Longs;
import il.co.codeguru.corewars8086.war.Competition;
import il.co.codeguru.corewars8086.war.CompetitionEventListener;
import il.co.codeguru.corewars8086.war.ScoreEventListener;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import il.co.codeguru.corewars8086.war.WarriorRepository;
import me.tongfei.progressbar.ProgressBar;
import me.tongfei.progressbar.ProgressBarBuilder;
import me.tongfei.progressbar.ProgressBarStyle;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * @author RM
 */
public class HeadlessCompetitionRunner implements ScoreEventListener, CompetitionEventListener {
  private final Options options;
  
  private int warCounter;
  private int totalWars;
  
  private final Competition competition;
  private long seed;
  
  private Thread warThread;
  
  private ProgressBar progressBar;

  private PrintWriter telemetryWriter;
  private int currentRound;
  private long currentWarSeed;
  private final Map<String, Integer> deathRounds = new HashMap<>();
  private final Map<String, String> deathReasons = new HashMap<>();
  
  public HeadlessCompetitionRunner(Options options) throws IOException {
    this.options = options;
    System.out.println("CoreWars8086 - headless mode\n");
    
    this.competition = new Competition(options);
    this.competition.addCompetitionEventListener(this);
    WarriorRepository repository = competition.getWarriorRepository();
    System.out.printf("Loaded warriors: %s%n", Arrays.toString(repository.getGroupNames()));
    repository.addScoreEventListener(this);

    if (!options.telemetryFile.isEmpty()) {
      if (options.parallel) {
        throw new IllegalArgumentException("--telemetryFile requires --parallel=false");
      }
      File telemetryFile = new File(options.telemetryFile);
      File parent = telemetryFile.getParentFile();
      if (parent != null) parent.mkdirs();
      try {
        telemetryWriter = new PrintWriter(telemetryFile);
      } catch (FileNotFoundException e) {
        throw new IOException("Unable to open telemetry file: " + telemetryFile, e);
      }
      telemetryWriter.println("war,seed,endRound,endReason,winners,name,group,type,loadOffset,alive,deathRound,deathReason,cs,ip,ss,sp,ds,es,energy,bomb86,bomb87");
    }
  
    if (Longs.tryParse(options.seed) != null) this.seed = Long.parseLong(options.seed);
    else this.seed = options.seed.hashCode();
    
    this.warCounter = 0;
    this.totalWars = 0;
    this.runWar();
  }
  
  public boolean runWar() {
    try {
      competition.setSeed(this.seed);
      if (competition.getWarriorRepository().getNumberOfGroups() < options.combinationSize) {
        System.err.printf("Not enough survivors (got %d but %d are needed)%n", competition.getWarriorRepository().getNumberOfGroups(), options.combinationSize);
        return false;
      }
      
      warThread = new Thread("CompetitionThread") {
        @Override
        public void run() {
          try {
            if (options.parallel) {
              competition.runCompetitionInParallel(options.battlesPerCombo, options.combinationSize, options.threads);
            } else {
              competition.runCompetition(options.battlesPerCombo, options.combinationSize, false);
            }
          } catch (Exception e) {
            e.printStackTrace();
          }
        }
      };
      
      warThread.start();
      return true;
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
  }
  
  @Override
  public void onWarStart(long seed) {
    currentWarSeed = seed;
    currentRound = 0;
    deathRounds.clear();
    deathReasons.clear();
  }
  
  @Override
  public void onWarEnd(int reason, String winners) {
    writeTelemetry(reason, winners);
    warCounter++;
    progressBar.stepTo(warCounter);
  }
  
  @Override
  public void onRound(int round) {
    currentRound = round;
  }
  
  @Override
  public void onWarriorBirth(String warriorName) {
  
  }
  
  @Override
  public void onWarriorDeath(String warriorName, String reason) {
    deathRounds.put(warriorName, currentRound);
    deathReasons.put(warriorName, reason);
  }
  
  @Override
  public void onCompetitionStart() {
    warCounter = 0;
    totalWars = competition.getTotalNumberOfWars();
    competition.setAbort(false);
    System.out.printf("Starting competition (%d wars)%s.%n", totalWars, options.parallel ? " in parallel" : "");
    progressBar = new ProgressBarBuilder()
        .setTaskName("Running wars")
        .setStyle(ProgressBarStyle.ASCII)
        .setInitialMax(totalWars)
        .showSpeed()
        .build();
  }
  
  @Override
  public void onCompetitionEnd() {
    progressBar.close();
    System.out.printf("Competition is over. Ran %d wars%n", warCounter);
    if (telemetryWriter != null) {
      telemetryWriter.close();
      telemetryWriter = null;
    }
    warThread = null;
  }
  
  @Override
  public void onEndRound() {
  
  }
  
  @Override
  public void scoreChanged(String name, float addedValue, int groupIndex, int subIndex) {
  }

  private void writeTelemetry(int reason, String winners) {
    if (telemetryWriter == null) return;
    War war = competition.getCurrentWar();
    if (war == null) return;
    for (int i = 0; i < war.getNumWarriors(); i++) {
      Warrior warrior = war.getWarrior(i);
      Integer deathRound = deathRounds.get(warrior.getName());
      String deathReason = deathReasons.get(warrior.getName());
      telemetryWriter.printf(
          "%d,%d,%d,%d,%s,%s,%s,%s,%d,%s,%s,%s,%d,%d,%d,%d,%d,%d,%d,%d,%d%n",
          warCounter,
          currentWarSeed,
          currentRound,
          reason,
          csv(winners),
          csv(warrior.getName()),
          csv(warrior.getGroupName()),
          warrior.getType(),
          unsigned(warrior.getLoadOffset()),
          warrior.isAlive(),
          deathRound == null ? "" : deathRound.toString(),
          csv(deathReason == null ? "" : deathReason),
          unsigned(warrior.getCpuState().getCS()),
          unsigned(warrior.getCpuState().getIP()),
          unsigned(warrior.getCpuState().getSS()),
          unsigned(warrior.getCpuState().getSP()),
          unsigned(warrior.getCpuState().getDS()),
          unsigned(warrior.getCpuState().getES()),
          unsigned(warrior.getCpuState().getEnergy()),
          warrior.getCpuState().getBomb1Count() & 0xff,
          warrior.getCpuState().getBomb2Count() & 0xff);
    }
    telemetryWriter.flush();
  }

  private static int unsigned(short value) {
    return value & 0xffff;
  }

  private static String csv(String value) {
    return '"' + value.replace("\"", "\"\"") + '"';
  }
}
