# Conditional-camper topology (research only)

Pair the exact m050 Warrior A binary (`0268ce4f301bf2ada8566f4e608180a0670a335a80b9c2b93b67aee2b632bd44`) with `B-conditional-camper.asm`. Do not replace `final/` on the basis of this hypothesis.

This is a **survival/offense split**, not a direct repair of m050's broken `FF 1F` anchors. A keeps its tested moving Phoenix attack and captured-Zombie process. B keeps its m050 `INT 87h` Zombie redirect, then writes a single `74 FE` (`JZ -2`) loop at a load-dependent position in arena segment `0FFCh` and enters it through a private far pointer. `XOR CX,CX` makes ZF true; the intervening `MOV`, `STOSW`, and indirect `JMP FAR` preserve ZF. B leaves SS as the private stack segment, so its own execution makes no arena return-address trail. The phase `74h` puts the loop at least `39h` high-byte units from B's initial code for every remainder of the `3Ch` quantizer, avoiding initial self-overwrite. This loop is still only two bytes and can be destroyed by opponents.

The mechanism differs from the rejected direct-copy and near-hopper candidates: no 15–18-byte arena body is fetched over many turns. The expected cost is large: once parked, B contributes no further arena writes. A 20-battle structural smoke, then a same-name paired 2025-field screen and fresh holdout against **both** exact m049 and m050 are required before any general-strength claim. The unique JZ signature avoids `EB FE` and `FF 1F` counter signatures, but its advantage is unmeasured.

Important engine constraint: `Warrior.java` gives private stack memory read/write access but restricts executable memory to the arena; jumping to the private template would die. The two-byte arena loop avoids that mistake.
