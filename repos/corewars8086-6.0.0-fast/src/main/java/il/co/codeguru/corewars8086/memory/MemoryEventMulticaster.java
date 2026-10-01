package il.co.codeguru.corewars8086.memory;

import java.util.Arrays;

/**
 * Direct (non-reflective) broadcaster for memory-write events. Called on
 * every arena write, so it must be cheap: with no listeners (headless runs)
 * a broadcast is a single array-length check. Same snapshot, ordering and
 * de-duplication semantics as the reflection-proxy EventMulticaster it
 * replaces.
 */
public final class MemoryEventMulticaster implements MemoryEventListener {
    private volatile MemoryEventListener[] listeners = new MemoryEventListener[0];

    public synchronized void add(MemoryEventListener listener) {
        for (MemoryEventListener l : listeners) {
            if (l.equals(listener)) return;
        }
        MemoryEventListener[] next = Arrays.copyOf(listeners, listeners.length + 1);
        next[listeners.length] = listener;
        listeners = next;
    }

    public synchronized void remove(MemoryEventListener listener) {
        for (int i = 0; i < listeners.length; i++) {
            if (listeners[i].equals(listener)) {
                MemoryEventListener[] next = new MemoryEventListener[listeners.length - 1];
                System.arraycopy(listeners, 0, next, 0, i);
                System.arraycopy(listeners, i + 1, next, i, listeners.length - i - 1);
                listeners = next;
                return;
            }
        }
    }

    @Override
    public void onMemoryWrite(RealModeAddress address) {
        for (MemoryEventListener l : listeners) l.onMemoryWrite(address);
    }
}
