package il.co.codeguru.corewars8086.war;

import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.memory.MemoryEventListener;
import il.co.codeguru.corewars8086.memory.MemoryEventMulticaster;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;


public class Competition {

    /** Maximum number of rounds in a single war. */
    public final static int MAX_ROUND = 200000;
    private static final String SCORE_FILENAME= "scores.csv";

    private CompetitionIterator competitionIterator;

    private final CompetitionEventMulticaster competitionEventCaster = new CompetitionEventMulticaster();
    private final MemoryEventMulticaster memoryEventCaster = new MemoryEventMulticaster();
    private final CompetitionEventListener competitionEventListener = competitionEventCaster;
    private final MemoryEventListener memoryEventListener = memoryEventCaster;
    // Headless runs never register memory listeners (only the GUI does). Disabling
    // memory events there removes a per-write call that can never do anything, and
    // lets the JIT eliminate the address objects it would otherwise force to escape.
    private boolean memoryEventsEnabled = true;

    public void setMemoryEventsEnabled(boolean enabled) {
        this.memoryEventsEnabled = enabled;
    }

    private MemoryEventListener memoryListenerForWar() {
        return memoryEventsEnabled ? memoryEventListener : null;
    }

    private final WarriorRepository warriorRepository;
    
    private ExecutorService executorService;

    private War currentWar;

    private int warsPerCombination= 20;

    private int speed;
    public static final int MAXIMUM_SPEED = -1;
    private static final long DELAY_UNIT = 200;
    
    private long seed = 0;

    private boolean abort;
    
    private final Options options;

    public Competition(Options options) throws IOException {
        this(true, options);
    }

    public Competition(boolean shouldReadWarriorsFile, Options options) throws IOException {
        warriorRepository = new WarriorRepository(shouldReadWarriorsFile, options);

        speed = MAXIMUM_SPEED;
        abort = false;
        
        this.options = options;
    }

    public void runCompetition (int warsPerCombination, int warriorsPerGroup, boolean startPaused) throws Exception {
        this.warsPerCombination = warsPerCombination;
        competitionIterator = new CompetitionIterator(
            warriorRepository.getNumberOfGroups(), warriorsPerGroup, seed);

        // run on every possible combination of warrior groups
        competitionEventListener.onCompetitionStart();
        for (int warCount = 0; warCount < getTotalNumberOfWars(); warCount++) {
            runWar(warriorRepository.createGroupList(competitionIterator.next()), startPaused);
            seed ++;
            if (abort) {
				        break;
			      }
        }
        competitionEventListener.onCompetitionEnd();
        warriorRepository.saveScoresToFile(options.outputFile);
    }
    
    public void runCompetitionInParallel(int warsPerCombination, int warriorsPerGroup, int threads) throws InterruptedException {
      this.warsPerCombination = warsPerCombination;
      competitionIterator = new CompetitionIterator(
          warriorRepository.getNumberOfGroups(), warriorsPerGroup, seed);
      competitionEventListener.onCompetitionStart();
  
      executorService = Executors.newFixedThreadPool(threads);

      // Each war's seed is fixed before submission, so war outcomes never depended on
      // scheduling -- but the float score additions happened in completion order, making
      // the last digits vary with thread count. Record each war's awards and apply them
      // in war-id order afterwards: the exact addition sequence of sequential mode.
      final int totalWars = getTotalNumberOfWars();
      final String[][] scoringNames = new String[totalWars][];
      final float[] scoreValues = new float[totalWars];
      final List<Future<?>> futures = new ArrayList<>(totalWars);

      for (int warCount = 0; warCount < totalWars; warCount++) {
        WarriorGroup[] groups = warriorRepository.createGroupList(competitionIterator.next());
        int id = warCount;
        long warSeed = seed++;
        futures.add(executorService.submit(() -> {
          try {
            War war = runWarInParallel(groups, warSeed, id);
            scoringNames[id] = war.getScoringWarriorNames();
            scoreValues[id] = war.getScorePerSurvivor();
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        }));
      }

      executorService.shutdown();
      boolean finished = executorService.awaitTermination(1, TimeUnit.HOURS);

      if (!finished) {
        System.err.println("Note: Competition has timed out after 1h - results may be incorrect.");
      }

      executorService = null;

      // Apply the recorded awards in war-id order. Future.get() makes each war's awards
      // visible here and rethrows a war's failure instead of silently dropping that war.
      // Wars that never ran (GUI abort via shutdownNow, or the 1h timeout above) are not
      // done and contribute nothing, as before -- waiting on them would never return.
      for (int id = 0; id < totalWars; id++) {
        Future<?> future = futures.get(id);
        if (!future.isDone()) {
          continue;
        }
        try {
          future.get();
        } catch (CancellationException e) {
          continue;
        } catch (ExecutionException e) {
          throw new IllegalStateException("A war failed; refusing to write partial scores", e.getCause());
        }
        for (String name : scoringNames[id]) {
          warriorRepository.addScore(name, scoreValues[id]);
        }
      }

      competitionEventListener.onCompetitionEnd();
      warriorRepository.saveScoresToFile(options.outputFile);
    }

    /** One war of a planned competition: the groups and seed runCompetition would give it. */
    public static final class PlannedWar {
        public final WarriorGroup[] groups;
        public final long seed;

        PlannedWar(WarriorGroup[] groups, long seed) {
            this.groups = groups;
            this.seed = seed;
        }
    }

    /**
     * Returns the wars runCompetition would run, in order, without running them.
     * Uses the same iterator, seed sequence and group lists as runCompetition, so
     * running each planned war with runWarInParallel and applying the awards in
     * war-id order reproduces runCompetition's scores exactly.
     */
    public List<PlannedWar> planCompetition(int warsPerCombination, int warriorsPerGroup) {
        this.warsPerCombination = warsPerCombination;
        competitionIterator = new CompetitionIterator(
            warriorRepository.getNumberOfGroups(), warriorsPerGroup, seed);
        final int totalWars = getTotalNumberOfWars();
        List<PlannedWar> wars = new ArrayList<>(totalWars);
        for (int warCount = 0; warCount < totalWars; warCount++) {
            wars.add(new PlannedWar(warriorRepository.createGroupList(competitionIterator.next()), seed++));
        }
        return wars;
    }

    public int getTotalNumberOfWars() {
        if (options.totalBattles > 0) {
            return options.totalBattles;
        }

        return (int) competitionIterator.getNumberOfItems() * warsPerCombination;
    }

    public void runWar(WarriorGroup[] warriorGroups,boolean startPaused) throws Exception {
        currentWar = new War(memoryListenerForWar(), competitionEventListener, startPaused, options);
        currentWar.setSeed(this.seed);
        competitionEventListener.onWarStart(seed);
        currentWar.loadWarriorGroups(warriorGroups);

        // go go go!
        int round = 0;
        while (round < MAX_ROUND) {
            competitionEventListener.onRound(round);

            competitionEventListener.onEndRound();

            // apply speed limits
            if (speed != MAXIMUM_SPEED) {
                // note: if speed is 1 (meaning game is paused), this will
                // always happen
                if (round % speed == 0) {
                    Thread.sleep(DELAY_UNIT);
                }

                if (speed == 1) { // paused
                    continue;
                }
            }

            //pause
            while (currentWar.isPaused()) Thread.sleep(DELAY_UNIT);

            //Single step run - stop next time
            if (currentWar.isSingleRound())
                currentWar.pause();

            if (currentWar.isOver()) {
                break;
            }

            currentWar.nextRound(round);

            ++round;
        }
        competitionEventListener.onRound(round);

        int numAlive = currentWar.getNumRemainingSurvivors();
        String names = currentWar.getRemainingWarriorNames();

        if (numAlive == 1) { // we have a single winner!
            competitionEventListener.onWarEnd(CompetitionEventListener.SINGLE_WINNER, names);
        } else if (round == MAX_ROUND) { // maximum round reached
            competitionEventListener.onWarEnd(CompetitionEventListener.MAX_ROUND_REACHED, names);
        } else { // user abort
            competitionEventListener.onWarEnd(CompetitionEventListener.ABORTED, names);
        }
        currentWar.updateScores(warriorRepository);
        currentWar = null;
    }
  
  public War runWarInParallel(WarriorGroup[] warriorGroups, long seed, int id) throws Exception {
    War war = new War(memoryListenerForWar(), competitionEventListener, false, options);
    war.setSeed(seed);
    boolean selectedAsCurrent = false;
    
    // Set current war as a
    synchronized (this) {
      if (this.currentWar == null) {
        this.currentWar = war;
        selectedAsCurrent = true;
      }
    }
  
    competitionEventListener.onWarStart(seed);
    war.loadWarriorGroups(warriorGroups);
    
    int round = 0;
    while (round < MAX_ROUND) {
      competitionEventListener.onRound(round);
      competitionEventListener.onEndRound();
      
     if (selectedAsCurrent && speed != MAXIMUM_SPEED) {
       if (round % speed == 0) {
         Thread.sleep(DELAY_UNIT);
       }
     }
      
      if (war.isOver()) {
        break;
      }
      
      war.nextRound(round);
      ++round;
    }
    
    competitionEventListener.onRound(round);
    
    int numAlive = war.getNumRemainingSurvivors();
    String names = war.getRemainingWarriorNames();
    
    if (numAlive == 1) { // we have a single winner!
      competitionEventListener.onWarEnd(CompetitionEventListener.SINGLE_WINNER, names);
    } else if (round == MAX_ROUND) { // maximum round reached
      competitionEventListener.onWarEnd(CompetitionEventListener.MAX_ROUND_REACHED, names);
    } else { // user abort
      competitionEventListener.onWarEnd(CompetitionEventListener.ABORTED, names);
    }
    
    if (selectedAsCurrent) {
      synchronized (this) {
        this.currentWar = null;
      }
    }

    // scores are applied by runCompetitionInParallel, in war-id order
    return war;
  }
  
  public int getCurrentWarrior() {
        if (currentWar != null) {
            return currentWar.getCurrentWarrior();
        } else {
            return -1;
        }
    }

    public void addCompetitionEventListener(CompetitionEventListener lis) {
        competitionEventCaster.add(lis);
    }
        public void removeCompetitionEventListener(CompetitionEventListener lis) {
    	competitionEventCaster.remove(lis);
    }
    
    public void addMemoryEventLister(MemoryEventListener lis) {
        memoryEventCaster.add(lis);
    }

    public void removeMemoryEventLister(MemoryEventListener lis) {
    	memoryEventCaster.remove(lis);
    }
    
    public WarriorRepository getWarriorRepository() {
        return warriorRepository;
    }

    /**
     * Set the speed of the competition, wither MAX_SPEED or a positive integer 
     * when 1 is the slowest speed
     * @param speed
     */
    public void setSpeed(int speed) {
        this.speed = speed;
    }

    public int getSpeed() {
        return speed;
    }

    public void setAbort(boolean abort) {
        this.abort = abort;
        
        if (abort && executorService != null) {
            executorService.shutdownNow();
            executorService = null;
        }
    }
    
    
    public War getCurrentWar(){
    	return currentWar;
    }
    
    public void setSeed(long seed){
    	this.seed = seed;
    }

    public long getSeed(){
        return seed;
    }
    
}
