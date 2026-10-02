import il.co.codeguru.corewars8086.cli.Options;
import il.co.codeguru.corewars8086.memory.RealModeAddress;
import il.co.codeguru.corewars8086.war.War;
import il.co.codeguru.corewars8086.war.Warrior;
import il.co.codeguru.corewars8086.war.WarriorType;

import java.io.File;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

/** Bounded method-level checks only: never calls nextRound or nextOpcode. */
public final class WarEdgeFixture {
    private final War war = new War(null, null, false, new Options());
    private final Method speed = method("calculateWarriorSpeed", int.class);
    private final Method groupCount = method("countAliveSurvivorGroups");
    private final Method extraOpcode = method("shouldRunExtraOpcode", Warrior.class);
    private int groupCases;
    private int rngCases;
    private int nextWarriorId;

    private static Method method(String name, Class<?>... parameterTypes) {
        try {
            Method method = War.class.getDeclaredMethod(name, parameterTypes);
            method.setAccessible(true);
            return method;
        } catch (ReflectiveOperationException e) {
            throw new AssertionError(e);
        }
    }

    private static Field field(String name) throws ReflectiveOperationException {
        Field field = War.class.getDeclaredField(name);
        field.setAccessible(true);
        return field;
    }

    private static void require(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }

    private static long number(Object value) {
        require(value instanceof Number, "Expected numeric reflection result, got " + value);
        return ((Number)value).longValue();
    }

    private static int originalSpeed(int energy) {
        return energy == 0 ? 0 : Math.min(16, 1 + (int)(Math.log(energy) / Math.log(2)));
    }

    private Warrior warrior(String group, WarriorType type, boolean alive) {
        Warrior warrior = new Warrior("fixture-" + nextWarriorId++, group, 1, war.getMemory(),
                new RealModeAddress((short)0x1000, (short)0x1000),
                new RealModeAddress((short)0x2100, (short)2048),
                new RealModeAddress((short)0x2000, (short)0), (short)1024, type);
        if (!alive) warrior.kill();
        return warrior;
    }

    private Warrior survivor(String group) {
        return warrior(group, WarriorType.SURVIVOR, true);
    }

    private void caseCheck(String name, int expectedGroups, boolean expectedOver,
                           Warrior... supplied) throws Exception {
        Warrior[] slots = new Warrior[20];
        require(supplied.length <= slots.length, name + ": too many warriors");
        System.arraycopy(supplied, 0, slots, 0, supplied.length);
        Set<String> independentGroups = new HashSet<String>();
        int alive = 0;
        int survivors = 0;
        for (Warrior warrior : slots) {
            if (warrior != null && warrior.isAlive()) {
                ++alive;
                if (!warrior.isZombie()) {
                    ++survivors;
                    independentGroups.add(warrior.getGroupName());
                }
            }
        }
        require(independentGroups.size() == expectedGroups, name + ": invalid fixture expectation");
        field("m_warriors").set(war, slots);
        field("m_numWarriors").setInt(war, supplied.length);
        field("m_numWarriorsAlive").setInt(war, alive);
        field("m_numSurvivorsAlive").setInt(war, survivors);
        require(number(groupCount.invoke(war)) == expectedGroups, name + ": group count mismatch");
        require(war.isOver() == expectedOver, name + ": isOver mismatch");
        ++groupCases;
    }

    private void checkGroups() throws Exception {
        caseCheck("empty", 0, true);
        caseCheck("one survivor", 1, true, survivor("A"));
        caseCheck("two equal values, distinct String objects", 1, true,
                survivor(new String("A")), survivor(new String("A")));
        caseCheck("two distinct values", 2, false, survivor("A"), survivor("B"));
        caseCheck("two null names", 1, true, survivor(null), survivor(null));
        caseCheck("null and nonnull names", 2, false, survivor(null), survivor("A"));
        caseCheck("dead null name ignored", 1, true,
                warrior(null, WarriorType.SURVIVOR, false), survivor("A"));
        caseCheck("both zombie kinds excluded", 0, false,
                warrior("Z", WarriorType.ZOMBIE, true), warrior(null, WarriorType.ZOMBIE_H, true));
        caseCheck("one survivor plus both zombie kinds", 1, true,
                survivor("A"), warrior("Z", WarriorType.ZOMBIE, true),
                warrior(null, WarriorType.ZOMBIE_H, true));
        caseCheck("null holes and equal names across dead entry", 1, true,
                null, survivor("A"), warrior("B", WarriorType.SURVIVOR, false),
                null, survivor(new String("A")), null);
        caseCheck("survivor subtypes", 1, true,
                warrior("A", WarriorType.SURVIVOR_1, true), warrior("A", WarriorType.SURVIVOR_2, true));
        // Preserve existing isOver behavior: three live teammates are not the two-survivor branch.
        caseCheck("three same group", 1, false, survivor("A"), survivor("A"), survivor("A"));
        caseCheck("duplicates and null among many groups", 3, false,
                survivor(null), survivor("A"), survivor("B"), survivor(null), survivor(new String("A")));
        caseCheck("all dead", 0, true,
                warrior("A", WarriorType.SURVIVOR, false), warrior("Z", WarriorType.ZOMBIE, false));
        for (int count = 0; count <= 20; ++count) {
            Warrior[] distinct = new Warrior[count];
            for (int i = 0; i < count; ++i) distinct[i] = survivor(i == 0 ? null : "group-" + i);
            caseCheck("every distinct-count value " + count, count, count <= 1, distinct);
        }
        Warrior first = survivor("A");
        Warrior second = survivor("A");
        Warrior other = survivor("B");
        caseCheck("before death transition", 2, false, first, second, other);
        other.kill();
        caseCheck("after death transition", 1, true, first, second, other);
    }

    private void checkRandomDraw() throws Exception {
        Warrior survivor = survivor("rng");
        for (int energy : new int[] {0, 1, 2, 15, 16, 32768, 65535}) {
            for (int draw : new int[] {0, 15}) {
                CountingRandom random = new CountingRandom(draw);
                field("rand").set(war, random);
                survivor.setEnergy((short)energy);
                Object result = extraOpcode.invoke(war, survivor);
                require(result instanceof Boolean, "Expected boolean reflection result");
                require(((Boolean)result).booleanValue() == (draw < originalSpeed(energy)), "RNG decision mismatch");
                require(random.calls == 1 && random.lastBound == 16, "Must consume exactly one nextInt(16)");
                ++rngCases;
            }
        }
    }

    private static final class CountingRandom extends Random {
        private final int value;
        private int calls;
        private int lastBound;
        CountingRandom(int value) { this.value = value; }
        @Override public int nextInt(int bound) {
            ++calls;
            lastBound = bound;
            return value;
        }
    }

    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte value : bytes) result.append(String.format("%02x", value & 0xFF));
        return result.toString();
    }

    public static void main(String[] args) throws Exception {
        require(args.length == 1, "Pass expected loaded War code-source path");
        File actualSource = new File(War.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getCanonicalFile();
        require(actualSource.equals(new File(args[0]).getCanonicalFile()), "Wrong War class loaded: " + actualSource);
        WarEdgeFixture fixture = new WarEdgeFixture();
        MessageDigest speedDigest = MessageDigest.getInstance("SHA-256");
        for (int energy = 0; energy <= 0xFFFF; ++energy) {
            long actual = number(fixture.speed.invoke(fixture.war, energy));
            require(actual == originalSpeed(energy), "Speed mismatch at " + energy);
            speedDigest.update((byte)actual);
        }
        int[] extremes = {Integer.MIN_VALUE, -65536, -32769, -1, 65536, 65537, 1000000, Integer.MAX_VALUE};
        for (int energy : extremes) {
            require(number(fixture.speed.invoke(fixture.war, energy)) == originalSpeed(energy),
                    "Out-of-domain speed mismatch at " + energy);
        }
        fixture.checkGroups();
        fixture.checkRandomDraw();
        MessageDigest classDigest = MessageDigest.getInstance("SHA-256");
        try (InputStream stream = War.class.getResourceAsStream("War.class")) {
            require(stream != null, "Missing loaded War class resource");
            byte[] buffer = new byte[4096];
            for (int count; (count = stream.read(buffer)) != -1;) classDigest.update(buffer, 0, count);
        }
        System.out.println("{\"status\":\"PASS\",\"speedDomainCases\":65536,\"speedFallbackCases\":" + extremes.length
                + ",\"groupCountCases\":" + fixture.groupCases + ",\"isOverCases\":" + fixture.groupCases
                + ",\"rngDrawCases\":" + fixture.rngCases + ",\"speedDomainSha256\":\"" + hex(speedDigest.digest())
                + "\",\"warClassSha256\":\"" + hex(classDigest.digest()) + "\"}");
    }
}
