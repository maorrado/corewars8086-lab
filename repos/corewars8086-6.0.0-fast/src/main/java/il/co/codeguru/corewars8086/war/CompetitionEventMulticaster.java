package il.co.codeguru.corewars8086.war;

import java.util.Arrays;

/**
 * Direct (non-reflective) broadcaster for competition events. Replaces the
 * reflection-proxy EventMulticaster on the per-round hot path. Broadcasts
 * iterate an immutable snapshot, so a listener added or removed during a
 * broadcast does not affect the in-flight event -- the same guarantee the
 * proxy version gave via its waiting list. Insertion order is kept and
 * duplicates are ignored, as with the proxy version's LinkedHashSet.
 */
final class CompetitionEventMulticaster implements CompetitionEventListener {
    private volatile CompetitionEventListener[] listeners = new CompetitionEventListener[0];

    synchronized void add(CompetitionEventListener listener) {
        for (CompetitionEventListener l : listeners) {
            if (l.equals(listener)) return;
        }
        CompetitionEventListener[] next = Arrays.copyOf(listeners, listeners.length + 1);
        next[listeners.length] = listener;
        listeners = next;
    }

    synchronized void remove(CompetitionEventListener listener) {
        for (int i = 0; i < listeners.length; i++) {
            if (listeners[i].equals(listener)) {
                CompetitionEventListener[] next = new CompetitionEventListener[listeners.length - 1];
                System.arraycopy(listeners, 0, next, 0, i);
                System.arraycopy(listeners, i + 1, next, i, listeners.length - i - 1);
                listeners = next;
                return;
            }
        }
    }

    @Override public void onWarStart(long seed) { for (CompetitionEventListener l : listeners) l.onWarStart(seed); }
    @Override public void onWarEnd(int reason, String winners) { for (CompetitionEventListener l : listeners) l.onWarEnd(reason, winners); }
    @Override public void onRound(int round) { for (CompetitionEventListener l : listeners) l.onRound(round); }
    @Override public void onWarriorBirth(String warriorName) { for (CompetitionEventListener l : listeners) l.onWarriorBirth(warriorName); }
    @Override public void onWarriorDeath(String warriorName, String reason) { for (CompetitionEventListener l : listeners) l.onWarriorDeath(warriorName, reason); }
    @Override public void onCompetitionStart() { for (CompetitionEventListener l : listeners) l.onCompetitionStart(); }
    @Override public void onCompetitionEnd() { for (CompetitionEventListener l : listeners) l.onCompetitionEnd(); }
    @Override public void onEndRound() { for (CompetitionEventListener l : listeners) l.onEndRound(); }
}
