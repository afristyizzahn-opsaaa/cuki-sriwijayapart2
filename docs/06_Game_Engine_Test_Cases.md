06_Game_Engine_Test_Cases

1. Document Information

Document Title: CUKI: The Kingdom of Sriwijaya — Game Engine Test Cases Specification

Document Version: 2.2.0 (QA Test-Coverage Completion & Traceability Audit)

Author: Senior Game Engine QA Architect & Technical Test Specification Writer

Target Audience: Core Engine Developers, Automated QA Engineers, AI System Architects, Refactoring Lead

 **Status:** LOCKED — CANONICAL GAME ENGINE TEST SPECIFICATION

2. Purpose

This document provides a comprehensive, deterministic, and fully traceable test specification for the core game engine of CUKI: The Kingdom of Sriwijaya.

The sole purpose of this test suite is to verify that the game engine software implementation adheres strictly and completely to the official rules established in 05_CUKI_Rulebook.md.

This specification defines:

Structural unit tests for grid geometry, entity data structures, and state initialization.

Behavioral integration tests for dice evaluation, pawn movement, capture sequencing, turn transitions, and match completion.

Boundary, negative, and state-integrity invariants.

An anti-regression test suite specifically designed to prevent the re-introduction of obsolete legacy assumptions.

Traceability matrices mapping every rule in 05_CUKI_Rulebook.md to explicit test procedures.

3. Authority & Traceability

Sole Authoritative Baseline: 05_CUKI_Rulebook.md is the primary and sole authoritative baseline for all gameplay rules, constraints, logic, and state transitions.

Subordination: This document (06_Game_Engine_Test_Cases.md) answers “How do we prove the engine implements the official rules correctly?” It possesses zero authority to invent gameplay rules, override rulebook specifications, resolve unstated game design questions, or introduce arbitrary default mechanics.

Precedence: In any conflict between previous test documents, legacy code, historical design notes, and 05_CUKI_Rulebook.md, the rulebook ALWAYS takes precedence.

Obsolete Assumptions Removed: Legacy concepts (e.g., 96 Oncak, cell-center pawn movement, perimeter-only entry, dice value as movement distance, 4-segment movements, free initial pawn placement, pawn elimination, tie-breaker rules) are strictly non-canonical and are actively tested for rejection in Section 31.

4. Test Philosophy

Deterministic Verification: Every test case specifies exact preconditions, inputs, board configurations, step sequences, expected post-conditions, and explicit failure criteria. Vague expectations such as "works correctly" or "handles turn normally" are strictly forbidden.

Framework-Agnostic Semantics: Function names, state label identifiers, and error type labels used in this document (e.g., Match.start(), REROLL_REQUIRED, ERROR_CENTRAL_LOGO_HARD_BLOCK) are strictly illustrative and semantic. Engines are evaluated on exact state transitions, invariant maintenance, and rejection of illegal inputs without state mutation, regardless of concrete class structures or identifier names.

Atomic State Invariants: The game state must maintain mathematical integrity across every operation. Oncak counts, pawn spatial coordinates, active dice values, and player scores are asserted before and after every state transition.

Exhaustive Edge Coverage: Tests evaluate standard successful paths (positive testing), invalid player inputs, unpathable board configurations, boundary constraints, and illegal state transitions (negative testing).

Parity Across Actors: AI decision engines and human player interactions invoke identical core engine validation logic and are subject to the exact same gameplay constraints.

5. Test Conventions & State Vocabulary

Spatial Conventions

Visual Board Grid: 10 × 10 Cell grid.

Gameplay Spatial Network: Intersections $(x, y)$ where $x \in [0, 10]$ and $y \in [0, 10]$ (total 121 intersections).

Central Logo Intersection: Position $(5, 5)$ on the intersection layer. Designated as a permanent hard block.

Adjacent Intersections: Intersections separated by exactly 1 grid unit along an orthogonal axis: $(x \pm 1, y)$ or $(x, y \pm 1)$.

Entity States

Pawn State:

OFF_BOARD: Pawn has no valid board coordinates (null, null). An OFF_BOARD Pawn has no physical board location and generates no imaginary movement route from outside the board.

ON_BOARD: Pawn resides at an explicit intersection coordinate $(x, y) \neq (5, 5)$.

Oncak State:

PRESENT: Oncak occupies an intersection $(x, y)$ with color BLACK or WHITE.

CAPTURED: Oncak has been permanently removed from the board intersection and added to a player's score tally.

Execution Contexts

Dice Value ($V$): Integer result $V \in \text{Domain}(\text{Dice})$ governing exact capture quantity.

Capture Group: A set of exactly $V$ same-color Oncak formed through a valid capture route for a single applicable capture opportunity.

Movement Segment: A straight, uninterrupted sequence of contiguous orthogonal intersection steps along a single direction vector without changing axis.

Legal + Reachable Group: A valid Capture Group of size $V$ for which at least one legal movement path (complying with orthogonal direction, $\le 3$ segment limit, pawn blocking, and Central Logo restrictions) exists from the Pawn's current location (or, for an OFF_BOARD Pawn, a legal board-wide capture route whose first captured Oncak serves as the Pawn's entry coordinate).

6. Board Geometry Tests

TC-BRD-001 — Intersection Network Initialization and Bounds

Source Rule: 05 Rulebook Section 2.1 & 2.2

Priority: Critical

Test Type: Unit / Structural

Preconditions: Core engine initialized.

Input / Initial State: Invoke board initialization.

Steps:

Query total node count of the spatial intersection graph.

Iterate through coordinates $(x, y)$ for $x \in [0, 10]$ and $y \in [0, 10]$.

Query validity of out-of-bounds coordinates $(-1, 0)$, $(11, 5)$, $(5, 11)$, $(0, -1)$.

Expected Result:

Total intersection nodes count is exactly 121.

Every coordinate in $[0..10, 0..10]$ is initialized as a valid intersection node.

All out-of-bounds queries are rejected as invalid coordinates without changing state.

Failure Conditions: Node count $\neq 121$; valid coordinates missing; out-of-bounds coordinates accepted.

TC-BRD-002 — Cell Center Non-Occupancy Verification

Source Rule: 05 Rulebook Section 2.1

Priority: Critical

Test Type: Unit / Spatial Safety

Preconditions: Board spatial model initialized.

Input / Initial State: Query non-intersection spatial locations (cell centers $(x + 0.5, y + 0.5)$ for $x, y \in [0..9]$).

Steps:

Attempt to place an Oncak entity at cell center $(2.5, 2.5)$.

Attempt to move a Pawn to cell center $(4.5, 4.5)$.

Expected Result:

Engine rejects both placement attempts without state mutation.

Pawns and Oncak can reside ONLY at integer intersection coordinates $(x, y)$.

Failure Conditions: Entity placement or movement to non-integer cell center succeeds.

TC-BRD-003 — Orthogonal Connectivity Mapping

Source Rule: 05 Rulebook Section 2.2 & 2.3

Priority: High

Test Type: Unit

Preconditions: Board graph initialized.

Input / Initial State: Query adjacent nodes for corner $(0,0)$, edge $(0,5)$, and interior $(2,2)$.

Steps:

Retrieve neighbors for $(0,0)$.

Retrieve neighbors for $(0,5)$.

Retrieve neighbors for $(2,2)$.

Expected Result:

Corner $(0,0)$ has exactly 2 orthogonal neighbors: $(1,0)$ and $(0,1)$.

Edge $(0,5)$ has exactly 3 orthogonal neighbors: $(0,4)$, $(0,6)$, and $(1,5)$.

Interior $(2,2)$ has exactly 4 orthogonal neighbors: $(2,1)$, $(2,3)$, $(1,2)$, and $(3,2)$.

No diagonal connections exist in the spatial graph structure.

Failure Conditions: Diagonal neighbors returned; incorrect edge/corner neighbor counts.

7. Oncak Initialization Tests

TC-INIT-001 — Oncak Quantity and Color Distribution

Source Rule: 05 Rulebook Section 3.1

Priority: Critical

Test Type: State Transition / Unit

Preconditions: Fresh match initialization invoked.

Input / Initial State: Engine executes match start sequence.

Steps:

Count all Oncak entities generated on the board.

Count total BLACK Oncak.

Count total WHITE Oncak.

Check intersection $(5, 5)$.

Expected Result:

Total Oncak on board = 120.

BLACK Oncak count = 60.

WHITE Oncak count = 60.

Central Logo intersection $(5, 5)$ contains NO Oncak (NULL / EMPTY).

Failure Conditions: Total Oncak count $\neq 120$; Black $\neq 60$; White $\neq 60$; $(5,5)$ contains an Oncak.

TC-INIT-002 — Complete Intersection Coverage (Excluding Central Logo)

Source Rule: 05 Rulebook Section 3.1 & 3.2

Priority: High

Test Type: Unit / Invariant

Preconditions: Board state initialized.

Input / Initial State: Initialized 121-intersection grid.

Steps:

Iterate through all 121 intersections.

Verify occupancy status for each node $(x, y)$.

Expected Result:

Exactly 120 intersections return occupied = true with an Oncak entity.

Exactly 1 intersection $(5, 5)$ returns occupied = false.

Failure Conditions: Any non-$(5,5)$ intersection is empty; $(5,5)$ is occupied.

8. Oncak Distribution Constraint Tests

TC-DIST-001 — Vertical Max-Six Color Sequence Constraint

Source Rule: 05 Rulebook Section 3.2

Priority: High

Test Type: Boundary / Rule Enforcement

Preconditions: Initial board generation algorithm running.

Input / Initial State: Initializer generating layout for vertical column $x = 3$.

Steps:

Evaluate vertical column $x = 3$ for $y = 0$ through $y = 10$.

Test candidate sequence of 6 consecutive BLACK Oncak ($y = 0..5$).

Test candidate sequence of 7 consecutive BLACK Oncak ($y = 0..6$).

Expected Result:

Sequence of 6 same-color Oncak vertically is VALID (accepted).

Sequence of 7 same-color Oncak vertically is INVALID (rejected by generator, triggering layout regeneration).

Failure Conditions: Engine allows $>6$ consecutive vertical same-color Oncak during initialization.

TC-DIST-002 — Diagonal Max-Six Color Sequence Constraint

Source Rule: 05 Rulebook Section 3.2

Priority: High

Test Type: Boundary / Rule Enforcement

Preconditions: Board initialization evaluator active.

Input / Initial State: Candidate layout evaluated along a diagonal vector completely clear of $(5,5)$, specifically $(0,2)$ through $(6,8)$.

Steps:

Evaluate continuous diagonal vector $(0,2), (1,3), (2,4), (3,5), (4,6), (5,7), (6,8)$ (7 consecutive diagonal intersections).

Inject test candidate layout containing 7 consecutive WHITE Oncak along this diagonal vector.

Expected Result:

Initializer detects 7 consecutive same-color diagonal Oncak and rejects the layout for regeneration.

Note: This constraint strictly governs initial board layout generation and does NOT grant diagonal Pawn movement during gameplay.

Failure Conditions: Initializer permits $>6$ consecutive diagonal same-color Oncak.

TC-DIST-003 — Horizontal Direction Exclusion from Max-Six Constraint

Source Rule: 05 Rulebook Section 3.2

Priority: Medium

Test Type: Positive / Special Exemption

Preconditions: Board layout validator active.

Input / Initial State: Layout generated with 7 consecutive BLACK Oncak along row $y = 2$ at coordinates $(0,2)$ to $(6,2)$.

Steps:

Run initial layout validation algorithm.

Expected Result:

Layout is ACCEPTED. The max-six constraint explicitly applies ONLY to vertical and diagonal directions; horizontal sequences are not restricted by this rule.

Failure Conditions: Horizontal sequence of $>6$ same-color Oncak causes layout rejection.

9. Central Logo Hard Block Tests

TC-CENT-001 — Central Logo Occupancy Rejection

Source Rule: 05 Rulebook Section 2.3 & 3.1

Priority: Critical

Test Type: Negative / Invariant

Preconditions: Board initialized.

Input / Initial State: Intersection $(5,5)$.

Steps:

Attempt to spawn an Oncak at $(5,5)$.

Attempt to place a Pawn at $(5,5)$ during setup or movement.

Expected Result:

Both operations are rejected without modifying game state.

Failure Conditions: Any entity is successfully placed at $(5,5)$.

TC-CENT-002 — Route Traversal Through Central Logo Rejection

Source Rule: 05 Rulebook Section 2.3

Priority: Critical

Test Type: Negative / Pathfinding

Preconditions: Active player pawn at $(5,3)$. Dice Value $V = 3$. Target Capture Group route requires moving straight through $(5,4) \rightarrow (5,5) \rightarrow (5,6)$.

Input / Initial State: Movement path vector traversing $(5,5)$.

Steps:

Submit movement path $[(5,3), (5,4), (5,5), (5,6)]$.

Expected Result:

Path validation fails because segment 1 traverses $(5,5)$.

Action is rejected as illegal without state mutation.

Failure Conditions: Path traversing $(5,5)$ is evaluated as legal.

TC-CENT-003 — Alternate Detour Route Around Central Logo ($\le 3$ Segments)

Source Rule: 05 Rulebook Section 2.3 & 7.2

Priority: High

Test Type: Integration / Pathfinding

Preconditions: Pawn at $(4,3)$. Target capture endpoint at $(6,5)$. Direct line segment between $(4,5)$ and $(6,5)$ is illegal as it crosses $(5,5)$.

Input / Initial State: Path proposal evaluating candidate detours.

Steps:

Submit detour path:

Segment 1: $(4,3) \rightarrow (4,6)$ (traverses $(4,3), (4,4), (4,5), (4,6)$ — all $x=4$, clear of $x=5$).

Segment 2: $(4,6) \rightarrow (6,6)$ (traverses $(4,6), (5,6), (6,6)$ — all $y=6$, clear of $y=5$).

Segment 3: $(6,6) \rightarrow (6,5)$ (traverses $(6,6), (6,5)$ — all $x=6$, clear of $x=5$).

Verify every intermediate intersection traversed in each straight segment.

Test secondary scenario where surrounding pawns block all $\le 3$-segment detours around $(5,5)$, leaving only 4-segment options.

Expected Result:

Detour path containing 3 straight segments completely avoids $(5,5)$ at every traversed node and is validated as LEGAL.

Secondary scenario correctly marks the target as UNREACHABLE due to exceeding the 3-segment limit.

Failure Conditions: Detour traversing $(5,5)$ accepted; legal $\le 3$-segment detour rejected; 4-segment detour accepted.

TC-CENT-004 — OFF_BOARD Entry via Central Logo Rejection

Source Rule: 05 Rulebook Section 2.3 & 4.2

Priority: Critical

Test Type: Negative / State Transition

Preconditions: Player 1 Pawn is OFF_BOARD. Active Roll $V = 1$. Target selection points to intersection $(5,5)$.

Input / Initial State: Player submits capture selection targeting intersection $(5,5)$.

Steps:

Attempt entry capture selection at $(5,5)$.

Expected Result:

Selection is rejected as illegal because $(5,5)$ is a permanent hard block.

Player 1 Pawn remains OFF_BOARD.

Player Score remains unchanged (0). No Oncak is removed. Game state remains unmutated.

Failure Conditions: Pawn enters board at $(5,5)$; score increases; Oncak created or removed at $(5,5)$.

10. Pawn Initial State Tests

TC-PawnInit-001 — All Pawns Default to OFF_BOARD

Source Rule: 05 Rulebook Section 4.1

Priority: Critical

Test Type: Unit / State Initialization

Preconditions: Match configuration set for 2, 3, or 4 players.

Input / Initial State: Execute match start sequence.

Steps:

Query state and coordinates for Player 1 Pawn, Player 2 Pawn, Player 3 Pawn, Player 4 Pawn.

Expected Result:

All pawns have status OFF_BOARD.

All pawn coordinates are NULL or unassigned.

No board Oncak is removed during setup.

Failure Conditions: Any pawn starts with ON_BOARD status or assigned board coordinates.

TC-PawnInit-002 — Prohibition of Free Placement or Setup Removal

Source Rule: 05 Rulebook Section 4.1

Priority: Critical

Test Type: Negative / Setup Compliance

Preconditions: Game in setup transition to Turn 1.

Input / Initial State: Client submits manual placement command.

Steps:

Client attempts action to place Player 1 Pawn at $(0,0)$.

Expected Result:

Action is rejected without state mutation.

Oncak at $(0,0)$ remains untouched (PRESENT).

Failure Conditions: Manual placement allowed or setup Oncak removal occurs.

11. OFF_BOARD Pawn Entry Tests

TC-ENTRY-001 — Entry via First Successful Capture

Source Rule: 05 Rulebook Section 4.2

Priority: Critical

Test Type: State Transition / Integration

Preconditions: Player 1 Pawn is OFF_BOARD. Active Roll $V = 2$.

Input / Initial State: Player selects a legal matching Capture Group of 2 BLACK Oncak at $(1,1)$ and $(1,2)$.

Steps:

Execute capture action for selected group.

Verify capture #1 at $(1,1)$: score increases by +1, Pawn enters board at $(1,1)$.

Verify capture #2 at $(1,2)$: score increases by +1 (total +2).

Verify complete group settlement at endpoint $(1,2)$.

Expected Result:

Pawn enters board at $(1,1)$ (the former intersection of the first captured Oncak). No imaginary movement path from outside the board is generated.

Pawn completes capture sequence and settles at final endpoint $(1,2)$.

Pawn state becomes ON_BOARD. Total score increases by +2.

Failure Conditions: Pawn fails to transition to ON_BOARD; score does not increase; entry coordinate incorrect.

TC-ENTRY-002 — Unrestricted Board-Wide Entry Selection

Source Rule: 05 Rulebook Section 4.2

Priority: High

Test Type: Positive / Boundary

Preconditions: Player 1 Pawn OFF_BOARD. Active roll $V = 1$. Valid WHITE Oncak at central interior intersection $(3,4)$.

Input / Initial State: Player selects interior Oncak at $(3,4)$.

Steps:

Validate entry selection at non-perimeter coordinate $(3,4)$.

Expected Result:

Entry selection is VALID. Board entry is NOT restricted to perimeter edge intersections.

Pawn enters directly at $(3,4)$, captures Oncak, and sets status to ON_BOARD.

Failure Conditions: Engine restricts OFF_BOARD entry selection to perimeter intersections.

TC-ENTRY-003 — Entry Failure on Unmatched/Unreachable Dice Roll

Source Rule: 05 Rulebook Section 4.2 & 8.5

Priority: High

Test Type: Negative / Turn Flow

Preconditions: Player 1 Pawn OFF_BOARD. Initial Turn 1 roll $V = 5$. Board configuration contains ZERO legal matching Capture Groups of size 5.

Input / Initial State: Roll evaluation phase.

Steps:

Evaluate turn options for newly rolled $V = 5$.

Expected Result:

No capture can be made.

Player 1 Pawn remains OFF_BOARD.

Score remains unchanged (0).

Turn ends immediately; control passes to Player 2. (Because this is a newly rolled $V$ with 0 legal groups, Turn End is triggered without reroll).

Failure Conditions: Pawn spawned on failure; reroll granted illegally on initial roll failure; turn fails to end.

12. Dice Semantics Tests

TC-DICE-001 — Dice Value Strictly Governs Capture Quantity

Source Rule: 05 Rulebook Section 5.1

Priority: Critical

Test Type: Functional / Logic

Preconditions: Pawn ON_BOARD at $(2,2)$. Active roll $V = 3$.

Input / Initial State: Player selects a Capture Group of 3 same-color Oncak.

Steps:

Execute capture sequence.

Count total Oncak removed during this capture step.

Expected Result:

Exactly 3 Oncak are captured.

Failure Conditions: Oncak count captured $\neq 3$.

TC-DICE-002 — Dice Value Independence from Movement Distance

Source Rule: 05 Rulebook Section 5.1

Priority: Critical / Anti-Regression

Preconditions: Pawn ON_BOARD at $(0,0)$. Active roll $V = 2$.

Input / Initial State: Target 2-Oncak Capture Group located at $(0,7)$ and $(0,8)$ (straight line segment distance of 7 intersections before first capture).

Steps:

Submit movement path $[(0,0) \rightarrow (0,7) \rightarrow (0,8)]$ (1 straight segment, total spatial distance = 8 intersections traversed).

Expected Result:

Movement path is LEGAL.

Dice Value $V = 2$ dictates capturing exactly 2 Oncak, NOT moving a maximum spatial distance of 2 units.

Failure Conditions: Engine rejects path because spatial distance (8) $> V$ (2).

13. Capture Group Validation Tests

TC-GRP-001 — Exact Size Matching ($V$)

Source Rule: 05 Rulebook Section 6.1

Priority: Critical

Test Type: Unit / Boundary

Preconditions: Active roll $V = 3$.

Input / Initial State: Test selection groups of sizes 2, 3, and 4.

Steps:

Submit Group A (size 2).

Submit Group B (size 3).

Submit Group C (size 4).

Expected Result:

Group A is rejected ($2 \neq 3$).

Group B is accepted as valid.

Group C is rejected ($4 \neq 3$).

Failure Conditions: Group sizes other than $V$ accepted.

TC-GRP-002 — Same-Color Requirement Enforcement

Source Rule: 05 Rulebook Section 6.1

Priority: Critical

Test Type: Negative

Preconditions: Active roll $V = 2$.

Input / Initial State: Selection containing 1 BLACK Oncak at $(2,2)$ and 1 WHITE Oncak at $(2,3)$.

Steps:

Validate capture group $[(2,2), (2,3)]$.

Expected Result:

Selection is rejected due to mixed-color composition.

Failure Conditions: Mixed-color group accepted.

14. Movement Geometry Tests

TC-GEO-001 — Orthogonal Movement Permitted

Source Rule: 05 Rulebook Section 7.1

Priority: Critical

Test Type: Unit / Geometry

Preconditions: Pawn at $(2,2)$. Target Oncak at $(2,5)$ (Vertical) and $(5,2)$ (Horizontal).

Input / Initial State: Orthogonal vectors.

Steps:

Validate movement $[(2,2) \rightarrow (2,5)]$.

Validate movement $[(2,2) \rightarrow (5,2)]$.

Expected Result:

Both orthogonal movements are validated as LEGAL.

Failure Conditions: Orthogonal movements rejected.

TC-GEO-002 — Diagonal Movement Strict Rejection

Source Rule: 05 Rulebook Section 7.1

Priority: Critical

Test Type: Negative / Anti-Regression

Preconditions: Pawn at $(2,2)$. Target Oncak at $(4,4)$.

Input / Initial State: Direct diagonal trajectory $[(2,2) \rightarrow (3,3) \rightarrow (4,4)]$.

Steps:

Submit diagonal movement path.

Expected Result:

Path validation fails. Diagonal movement is strictly forbidden for Pawn movement.

Failure Conditions: Diagonal movement accepted.

15. Movement Segment Limit Tests

TC-SEG-001 — Valid 1, 2, and 3 Segment Movements vs 4-Segment Rejection

Source Rule: 05 Rulebook Section 7.2

Priority: Critical

Test Type: Boundary / Movement

Preconditions: Pawn at $(0,0)$. Board layout clear of blocking pawns. Routes designed completely clear of $(5,5)$.

Input / Initial State: Candidate paths with 1, 2, 3, and 4 segments.

Steps:

Path 1 (1 segment): $(0,0) \rightarrow (0,5)$ (traverses along $x=0$, clear of $(5,5)$).

Path 2 (2 segments): $(0,0) \rightarrow (0,4) \rightarrow (4,4)$ (Segment 1 along $x=0$; Segment 2 along $y=4$, clear of $(5,5)$).

Path 3 (3 segments): $(0,0) \rightarrow (0,3) \rightarrow (3,3) \rightarrow (3,8)$ (Segment 1 along $x=0$; Segment 2 along $y=3$; Segment 3 along $x=3$, clear of $(5,5)$).

Path 4 (4 segments): $(0,0) \rightarrow (0,2) \rightarrow (2,2) \rightarrow (2,4) \rightarrow (4,4)$ (3 direction changes).

Expected Result:

Path 1 validated as LEGAL (1 segment).

Path 2 validated as LEGAL (2 segments).

Path 3 validated as LEGAL (3 segments).

Path 4 rejected for exceeding the 3-segment maximum limit.

Failure Conditions: Legal 1, 2, or 3 segment paths rejected; 4-segment path accepted.

TC-SEG-002 — Five-or-More Segment Movement Rejection

Source Rule: 05 Rulebook Section 7.2

Priority: High

Test Type: Boundary / Negative

Preconditions: Pawn at $(0,0)$. All candidate routes strictly within grid bounds $[0..10, 0..10]$ and clear of $(5,5)$. No blocking Pawns.

Input / Initial State: Candidate paths with 5 and 6 segments.

Steps:

Submit Path 1 (5 segments): $(0,0) \rightarrow (0,1) \rightarrow (1,1) \rightarrow (1,2) \rightarrow (2,2) \rightarrow (2,3)$ (4 direction changes).

Submit Path 2 (6 segments): $(0,0) \rightarrow (0,1) \rightarrow (1,1) \rightarrow (1,2) \rightarrow (2,2) \rightarrow (2,3) \rightarrow (3,3)$ (5 direction changes).

Expected Result:

Both Path 1 and Path 2 are rejected explicitly because segment count $> 3$.

Rejection occurs regardless of the spatial distance traversed (even if total intersections crossed is very small).

Failure Conditions: Path with $\ge 5$ segments validated as legal.

16. Pawn Blocking Tests

TC-BLK-001 — Blocked Intermediate Node Traversal

Source Rule: 05 Rulebook Section 7.3

Priority: Critical

Test Type: Negative / Pathfinding

Preconditions: Active Pawn P1 at $(1,1)$. Opponent Pawn P2 ON_BOARD at $(1,3)$.

Input / Initial State: P1 attempts capture path to target at $(1,5)$ passing through $(1,3)$.

Steps:

Submit straight-line path $[(1,1) \rightarrow (1,3) \rightarrow (1,5)]$.

Expected Result:

Path validation fails. Pawns cannot pass through or jump over other Pawns at intermediate nodes.

Failure Conditions: Path traversing an occupied pawn node is permitted.

TC-BLK-002 — Blocked Endpoint Occupancy

Source Rule: 05 Rulebook Section 7.3

Priority: Critical

Test Type: Negative

Preconditions: Active Pawn P1 at $(2,2)$. Opponent Pawn P2 at $(2,4)$.

Input / Initial State: P1 target capture endpoint is $(2,4)$.

Steps:

Submit movement path terminating at $(2,4)$.

Expected Result:

Path validation fails. Pawns cannot land on an intersection occupied by another Pawn.

Failure Conditions: Pawn allowed to land on an occupied Pawn intersection.

TC-BLK-003 — Prohibition of Jumping Over Blocking Pawns

Source Rule: 05 Rulebook Section 7.3

Priority: Critical

Test Type: Negative / Pathfinding

Preconditions: Active Pawn P1 at $(1,1)$. Opponent Pawn P2 at $(1,2)$. Target Oncak at $(1,3)$. Active $V = 1$.

Input / Initial State: P1 attempts direct 1-segment jump over P2 to reach $(1,3)$.

Steps:

Submit movement path $[(1,1) \rightarrow (1,2) \rightarrow (1,3)]$.

Expected Result:

Path validation fails explicitly due to intermediate node blocking at $(1,2)$.

Jumping over occupied Pawn intersections is strictly illegal.

Failure Conditions: Pawn successfully jumps over blocking Pawn at $(1,2)$.

TC-BLK-004 — Alternate Route Around Blocking Pawn ($\le 3$ vs $>3$ Segments)

Source Rule: 05 Rulebook Section 7.2 & 7.3

Priority: High

Test Type: Integration / Pathfinding

Preconditions: Active Pawn P1 at $(1,1)$. Opponent Pawn P2 at $(1,2)$, blocking straight segment $(1,1) \rightarrow (1,3)$. Target Oncak at $(1,3)$. Active $V = 1$.

Input / Initial State: Detour path proposal around P2.

Steps:

Submit 3-segment detour path: Segment 1: $(1,1) \rightarrow (2,1)$; Segment 2: $(2,1) \rightarrow (2,3)$; Segment 3: $(2,3) \rightarrow (1,3)$. All clear of $(5,5)$ and P2.

Submit secondary scenario where additional Opponent Pawns are placed at P3 $(0,1)$ (blocking leftward departure along $y=1$) and P4 $(2,1)$ (blocking rightward departure along $y=1$).

Expected Result:

Step 1 (3-segment detour around blocking Pawn) is validated as LEGAL.

Step 2 (horizontal departures blocked, forcing backward departure to $(1,0)$) results in any route to $(1,3)$ requiring at least 4 segments: e.g., $(1,1) \rightarrow (1,0) \rightarrow (2,0) \rightarrow (2,3) \rightarrow (1,3)$. Target is mathematically proven UNREACHABLE due to exceeding the 3-segment maximum limit.

Failure Conditions: Legal 3-segment detour around Pawn rejected; 4-segment detour accepted.

17. Capture Resolution Tests

TC-RES-001 — Atomic Multi-Capture Resolution Sequence

Source Rule: 05 Rulebook Section 8.1

Priority: Critical

Test Type: Integration / Sequence Integrity

Preconditions: Pawn P1 at $(0,0)$. Roll $V = 3$. Valid capture group at $(0,1)$, $(0,2)$, $(0,3)$. Global state re-evaluation listener active.

Input / Initial State: Execute single Capture Action of size 3.

Steps:

Process Capture #1 at $(0,1)$: Pawn advances to $(0,1)$, Oncak removed, score +1. Verify global mandatory capture check is NOT triggered mid-sequence.

Process Capture #2 at $(0,2)$: Pawn advances to $(0,2)$, Oncak removed, score +1. Verify global re-evaluation is NOT triggered.

Process Capture #3 at $(0,3)$: Pawn advances to $(0,3)$, Oncak removed, score +1.

Finalize complete group resolution at endpoint $(0,3)$.

Expected Result:

Selected Capture Group resolves as a single atomic unit.

Global mandatory capture re-evaluation triggers ONLY ONCE after Capture #3 completes and endpoint settlement at $(0,3)$ is finalized.

Total score increases by 3. Board remaining Oncak decreases by 3.

Failure Conditions: Global mandatory capture re-evaluation triggers mid-sequence after capture #1 or #2.

18. Capture Endpoint Tests

TC-END-001 — Final Captured Intersection Settlement

Source Rule: 05 Rulebook Section 8.2

Priority: High

Test Type: State Transition

Preconditions: Pawn P1 at $(2,2)$. Active Roll $V = 2$. Capture sequence targets Oncak at $(2,3)$ then $(2,4)$.

Input / Initial State: Execute capture group.

Steps:

Resolve capture at $(2,3)$.

Resolve final capture at $(2,4)$.

Query final P1 location.

Expected Result:

P1 final settlement location is exactly $(2,4)$ (the intersection of the final captured Oncak).

P1 does NOT advance an extra empty step to $(2,5)$ or bounce back to $(2,2)$.

Failure Conditions: Final location $\neq (2,4)$.

19. Mandatory Capture Tests

TC-MAN-001 — Loop Continuation with Same Dice Value $V$

Source Rule: 05 Rulebook Section 8.3

Priority: Critical

Test Type: Integration / Rule Enforcement

Preconditions: Pawn P1 completed Capture Group 1 for $V = 2$, settling at $(4,4)$. From $(4,4)$, exactly one legal + reachable Capture Group 2 of size $V = 2$ exists (e.g., at $(4,2)$ and $(4,1)$).

Input / Initial State: Mandatory capture re-evaluation phase following Capture Group 1.

Steps:

Engine re-evaluates reachability from current endpoint $(4,4)$ using active $V = 2$.

Attempt to trigger dice reroll before resolving Group 2.

Expected Result:

Engine detects legal + reachable group for current $V = 2$.

Reroll attempt is REJECTED.

Mandatory capture enforcement requires resolving Group 2 with current $V = 2$.

Failure Conditions: Reroll permitted while a legal + reachable group remains for active $V$.

TC-MAN-002 — Strategic Selection Among Multiple Reachable Groups

Source Rule: 05 Rulebook Section 8.3

Priority: High

Test Type: Positive / Choice

Preconditions: Pawn P1 at $(3,3)$. Active $V = 1$. Two legal Oncak of matching color reachable at $(3,4)$ (Group A) and $(4,3)$ (Group B). Both clear of $(5,5)$.

Input / Initial State: Mandatory capture evaluation returns 2 legal options.

Steps:

Player submits selection for Group B at $(4,3)$.

Expected Result:

Selection accepted as legal. Player is granted strategic choice among available legal + reachable groups.

Failure Conditions: Engine forces an arbitrary or non-player choice when multiple legal groups exist.

TC-MAN-003 — Dynamic Reachability Changes Post-Endpoint Settlement

Source Rule: 05 Rulebook Section 8.3

Priority: High

Test Type: Integration / Dynamic State

Preconditions: Pawn P1 initially at $(0,0)$. Active $V = 1$ (BLACK).

Group 1: 1 BLACK Oncak at $(0,2)$.

Group 2 (Target): 1 BLACK Oncak at $(0,4)$.

Opponent Pawn P2 at $(0,3)$ (blocks direct vertical path along $x=0$).

Opponent Pawn P3 at $(1,0)$ (blocks horizontal departure along $y=0$).

Input / Initial State: Initial reachability evaluation from $(0,0)$.

Steps:

Evaluate reachability of Group 2 at $(0,4)$ from initial location $(0,0)$:

Direct path $[(0,0) \rightarrow (0,4)]$ along $x=0$ blocked by P2 at $(0,3)$.

Rightward detours along $y=0$ blocked by P3 at $(1,0)$.

Leftward detours out of bounds ($x < 0$).

Assert: Group 2 at $(0,4)$ is mathematically UNREACHABLE from $(0,0)$.

P1 executes capture of Group 1 at $(0,2)$ via path $[(0,0) \rightarrow (0,2)]$ (1 segment) and settles at endpoint $(0,2)$.

Re-evaluate reachability of Group 2 at $(0,4)$ from new endpoint $(0,2)$:

3-segment detour around P2 at $(0,3)$: Segment 1: $(0,2) \rightarrow (1,2)$; Segment 2: $(1,2) \rightarrow (1,4)$; Segment 3: $(1,4) \rightarrow (0,4)$.

All traversed nodes $(0,2), (1,2), (1,3), (1,4), (0,4)$ are completely clear of P2, P3, and $(5,5)$.

Expected Result:

Target Group 2 at $(0,4)$ was mathematically UNREACHABLE from $(0,0)$, but becomes REACHABLE (3 segments) from new endpoint $(0,2)$.

Engine includes Target Group 2 in mandatory capture evaluation for active $V = 1$.

Failure Conditions: Target Group 2 evaluated as reachable from $(0,0)$; newly reachable group ignored at $(0,2)$.

TC-MAN-004 — Consecutive Multi-Group Capture Chain Under Same $V$

Source Rule: 05 Rulebook Section 8.3 & 8.4

Priority: High

Test Type: Integration / Sequence

Preconditions: Active $V = 2$. Board configured with a sequence of 3 distinct, consecutive matching Capture Groups reachable one after another from successive endpoints.

Input / Initial State: Execute sequential mandatory captures.

Steps:

Resolve Capture Group 1 $\rightarrow$ Pawn settles at Endpoint 1. Re-evaluation finds Group 2 reachable.

Attempt reroll before resolving Group 2 (Assert: Rejected).

Resolve Capture Group 2 $\rightarrow$ Pawn settles at Endpoint 2. Re-evaluation finds Group 3 reachable.

Resolve Capture Group 3 $\rightarrow$ Pawn settles at Endpoint 3. Re-evaluation finds 0 reachable groups for $V = 2$.

Expected Result:

All 3 groups resolved under the SAME active $V = 2$.

Reroll is granted ONLY after Group 3 completes and 0 reachable groups remain for $V = 2$.

Failure Conditions: Reroll allowed before Group 2 or Group 3; mandatory chain artificially broken.

20. Reroll Tests

TC-RER-001 — Reroll Triggered Upon Current $V$ Exhaustion

Source Rule: 05 Rulebook Section 8.4

Priority: Critical

Test Type: State Transition / Flow

Preconditions: Pawn P1 settles at $(8,8)$ after resolving a successful capture. Active $V = 2$. Zero legal + reachable groups of size 2 remain from $(8,8)$.

Input / Initial State: Mandatory capture re-evaluation phase following successful capture.

Steps:

Evaluate legal + reachable groups for current $V = 2$ from $(8,8)$.

Verify state transition.

Expected Result:

Engine confirms 0 legal + reachable groups for active $V = 2$.

State transitions to REROLL_REQUIRED.

Player rolls dice, generating new value $V_{new} = 4$.

Failure Conditions: Turn ends immediately without granting reroll after exhausting current $V$ following successful capture.

TC-RER-002 — Unlimited Rerolls and Captures Per Turn

Source Rule: 05 Rulebook Section 8.4

Priority: High

Test Type: Stress / Boundary

Preconditions: Active player turn in progress.

Input / Initial State: Sequence of rolls where each newly rolled $V$ yields valid captures, followed by current $V$ exhaustion and successful rerolls (Sequence: Roll 1 $\rightarrow$ Capture $\rightarrow$ Exhaustion $\rightarrow$ Reroll $\rightarrow$ Roll 2 $\rightarrow$ Capture $\rightarrow$ Exhaustion $\rightarrow$ Reroll ... repeated 10 times).

Steps:

Process 10 consecutive capture-exhaustion-reroll cycles within a single turn.

Expected Result:

Engine permits all 10 reroll cycles without imposing an arbitrary cap on captures or rerolls per turn.

Failure Conditions: Engine artificially terminates turn due to arbitrary reroll or capture count limits.

21. Unreachable Group Tests

TC-UNR-001 — Independent Unreachable Condition Diagnostics

Source Rule: 05 Rulebook Section 7.1, 7.2, 7.3, & 8.3

Priority: High

Test Type: Logic / Pathfinding Integration

Preconditions: Active Pawn P1. Active $V = 1$. Total Pawns $\le 4$.

Input / Initial State: Test 5 distinct board setups causing unreachability.

Steps:

Setup 1 (Segment limit): Active P1 at $(0,0)$, Target Oncak at $(4,4)$ (PRESENT at $(4,4)$). Opponent Pawns at P2 $(0,2)$ (blocks $y$-axis departures above $y=1$), P3 $(2,0)$ (blocks $x$-axis departures right of $x=1$), and P4 $(1,1)$ (blocks remaining 3-segment detours via $(0,1) \rightarrow (4,1)$ and $(1,0) \rightarrow (1,4)$). All remaining routes require $\ge 4$ segments.

Setup 2 (Pawn blocking): Active P1 at $(1,1)$, Target Oncak at $(1,4)$ (PRESENT). Opponent Pawns at P2 $(1,2)$ (blocks direct path), P3 $(2,2)$ (blocks right 3-segment detour), and P4 $(0,2)$ (blocks left 3-segment detour). All $\le 3$-segment routes blocked by Pawns.

Setup 3 (Central Logo block): Active P1 at $(5,3)$, Target Oncak at $(5,7)$ (PRESENT). Direct path passes $(5,5)$. Opponent Pawns at P2 $(4,5)$ (blocks left 3-segment detour $(5,3) \rightarrow (4,3) \rightarrow (4,7) \rightarrow (5,7)$) and P3 $(6,5)$ (blocks right 3-segment detour $(5,3) \rightarrow (6,3) \rightarrow (6,7) \rightarrow (5,7)$). All $\le 3$-segment detours around $(5,5)$ blocked.

Setup 4 (Diagonal spatial relation requiring orthogonal routing): Active P1 at $(3,3)$, Target Oncak at $(4,4)$ (PRESENT). Direct diagonal trajectory forbidden. Opponent Pawns at P2 $(3,4)$ (blocks Route 2A), P3 $(4,3)$ (blocks Route 2B), and P4 $(2,3)$ (blocks Route 3A). All $\le 3$-segment orthogonal routes blocked.

Setup 5 (Route node / endpoint pawn blocking): Active P1 at $(1,1)$. Active $V = 1$. Target Oncak at $(1,3)$ (PRESENT at $(1,3)$). Intersection $(1,3)$ contains a valid PRESENT Oncak. However, required intermediate node $(1,2)$ is occupied by Opponent Pawn P2 (Pawn at $(1,2)$). P1 cannot pass through or land on P2, rendering target Oncak at $(1,3)$ UNREACHABLE.

Expected Result:

Targets in Setups 1, 2, 3, 4, and 5 are ALL correctly evaluated as UNREACHABLE.

None of these targets are included as valid candidates during mandatory capture evaluation.

Failure Conditions: Any unreachable condition evaluated as a legal capture candidate.

TC-UNR-002 — Partial Reachability and Mandatory Candidate Filtering

Source Rule: 05 Rulebook Section 8.3

Priority: High

Test Type: Integration / Filtering

Preconditions: Pawn P1 at $(2,2)$. Active $V = 1$. Board contains matching Oncak Group A at $(2,3)$ (reachable in 1 segment) and matching Oncak Group B at $(2,7)$. Opponent Pawns at P2 $(2,5)$ (blocks direct path along $x=2$), P3 $(1,2)$ (blocks left departure along $y=2$), and P4 $(3,2)$ (blocks right departure along $y=2$).

Input / Initial State: Mandatory capture evaluator execution.

Steps:

Run reachability filter on available matching groups.

Expected Result:

Group A at $(2,3)$ is marked REACHABLE and added to legal options.

Group B at $(2,7)$ is marked UNREACHABLE (all routes from $(2,2)$ require $\ge 4$ segments) and filtered out.

Mandatory capture requires resolving Group A.

Failure Conditions: Unreachable Group B forced as selection; Group A ignored.

TC-UNR-003 — Total Unreachability Turn-State Transitions

Source Rule: 05 Rulebook Section 8.4 & 8.5

Priority: Critical

Test Type: State Transition

Preconditions: Active match state.

Input / Initial State: Evaluate zero reachable groups across two distinct turn phases.

Steps:

Phase A: Player rolls initial/new Dice Value $V = 5$. Zero legal + reachable groups exist.

Phase B: Player completes a capture for $V = 2$, exhausts all $V = 2$ groups, transitions to REROLL_REQUIRED, and rolls new $V_{new} = 3$. Zero legal + reachable groups exist for $V_{new} = 3$.

Expected Result:

Phase A results in immediate TURN_END (no reroll granted on failed new roll).

Phase B results in immediate TURN_END (control passes to next player).

Failure Conditions: Reroll granted on failed Phase A or Phase B roll.

22. Turn Completion Tests

TC-TRN-001 — Distinction Between Current $V$ Exhaustion vs New $V$ Failure

Source Rule: 05 Rulebook Section 8.4 & 8.5

Priority: Critical / Anti-Regression

Preconditions: Player 1 completes capture sequence for $V_1 = 3$. Current $V_1$ has 0 remaining reachable groups.

Input / Initial State: Sequence of state transitions.

Steps:

Evaluate state transition after $V_1$ exhaustion following capture.

Verify state is REROLL_REQUIRED (NOT Turn End).

Player rolls new value $V_2 = 5$.

Engine evaluates legal + reachable groups for newly rolled $V_2 = 5$. Finding 0 legal + reachable groups for $V_2$, evaluate state transition.

Expected Result:

Step 1 results in REROLL_REQUIRED.

Step 4 results in TURN_END (Control passes to next player without further reroll).

Failure Conditions: Turn ends immediately after Step 1 without granting reroll; reroll granted after Step 4 failure.

23. Player Order Tests

TC-ORD-001 — Cyclic Player Rotation across 2, 3, and 4 Player Configurations

Source Rule: 05 Rulebook Section 9.1

Priority: Critical

Test Type: State Transition

Preconditions: Test initialized for 2-player, 3-player, and 4-player match setups.

Input / Initial State: Execute consecutive turn end transitions.

Steps:

2-Player Match: P1 turn ends $\rightarrow$ assert active P2. P2 turn ends $\rightarrow$ assert active P1.

3-Player Match: P1 turn ends $\rightarrow$ assert active P2. P2 turn ends $\rightarrow$ assert active P3. P3 turn ends $\rightarrow$ assert active P1.

4-Player Match: P1 turn ends $\rightarrow$ assert active P2. P2 turn ends $\rightarrow$ assert active P3. P3 turn ends $\rightarrow$ assert active P4. P4 turn ends $\rightarrow$ assert active P1.

Expected Result:

Player control rotates strictly in cyclic order without skipping active players or invoking player elimination.

Failure Conditions: Incorrect turn order sequence; player skipped; rotation fails to return to P1.

24. Match Completion Tests

TC-MCH-001 — Immediate Match Completion Upon Zero Remaining Oncak

Source Rule: 05 Rulebook Section 10.1

Priority: Critical

Test Type: Integration / Termination

Preconditions: Board state has exactly 1 Oncak remaining at $(9,9)$. Active Player P2 rolls $V = 1$.

Input / Initial State: P2 executes capture of final Oncak.

Steps:

Resolve final Oncak capture.

Query remaining board Oncak count.

Query match state.

Expected Result:

Remaining Oncak count reaches exactly 0.

Match state transitions IMMEDIATELY to MATCH_COMPLETED.

No further rerolls, turn transitions, or player actions are permitted.

Failure Conditions: Game requests another reroll or turn transition after remaining Oncak reaches 0.

TC-MCH-002 — Non-Termination Invariants Under Non-Zero Oncak Conditions

Source Rule: 05 Rulebook Section 10.1

Priority: Critical

Test Type: Invariant / Negative

Preconditions: Match in progress with $>0$ remaining Oncak on board.

Input / Initial State: Test 5 non-zero Oncak scenarios.

Steps:

Scenario 1: All 60 BLACK Oncak captured, but 10 WHITE Oncak remain.

Scenario 2: Newly rolled $V$ produces 0 legal + reachable groups for active player.

Scenario 3: Player's Pawn is completely surrounded by opponent Pawns.

Scenario 4: Active player turn ends and passes to next player.

Scenario 5: Turn counter reaches 100 turns.

Expected Result:

None of Scenarios 1–5 trigger match completion.

Match state remains active (IN_PROGRESS).

Match completion is triggered ONLY when remainingOncak == 0.

Failure Conditions: Match terminates under any scenario while remainingOncak > 0.

25. Winner & Draw Tests

TC-WIN-001 — Unique Highest Score Victory

Source Rule: 05 Rulebook Section 10.2

Priority: Critical

Test Type: Unit / Scoring

Preconditions: MATCH_COMPLETED state.

Input / Initial State: Final score tally: P1 = 40, P2 = 50, P3 = 20, P4 = 10 (Total 120).

Steps:

Execute winner evaluation function.

Expected Result:

Engine declares P2 as sole WINNER.

Failure Conditions: Incorrect winner declared or tie-breaker logic incorrectly invoked.

TC-WIN-002 — Multi-Way Draw Executions (2-Way, 3-Way, and 4-Way)

Source Rule: 05 Rulebook Section 10.2

Priority: Critical

Test Type: Boundary / Scoring

Preconditions: MATCH_COMPLETED state.

Input / Initial State: Execute 3 distinct tie score fixtures whose totals equal 120.

Steps:

Fixture A (2-Way Draw): P1 = 50, P2 = 50, P3 = 20, P4 = 0.

Fixture B (3-Way Draw): P1 = 35, P2 = 35, P3 = 35, P4 = 15.

Fixture C (4-Way Draw): P1 = 30, P2 = 30, P3 = 30, P4 = 30.

Expected Result:

Fixture A results in a DRAW declared between P1 and P2.

Fixture B results in a DRAW declared between P1, P2, and P3.

Fixture C results in a DRAW declared between P1, P2, P3, and P4.

Engine does NOT execute any tie-breaker algorithms in any scenario.

Failure Conditions: Tie-breaker invoked to force a single winner in any draw fixture.

26. AI Compliance Tests

TC-AI-001 — Parity of Rule Enforcement Between Human and AI

Source Rule: 05 Rulebook Section 11.1

Priority: Critical

Test Type: Integration / AI Parity

Preconditions: AI Player assigned control of P2.

Input / Initial State: AI attempts to submit an action violating movement or capture rules (e.g., 4-segment path, passing through a blocking Pawn, or traversing $(5,5)$).

Steps:

Pass AI action through core engine rule validator.

Expected Result:

Action is rejected with the exact same error semantics as a human action.

AI receives zero special exemptions or hidden state mutations.

Failure Conditions: AI bypasses engine validation constraints.

27. State Integrity Tests

TC-INT-001 — Global Oncak Conservation Invariant

Source Rule: 05 Rulebook Section 3.1 & Match Invariants

Priority: Critical

Test Type: System Invariant

Preconditions: Active match in progress across multiple turns.

Input / Initial State: Intermittent query during turn transitions.

Steps:

Compute invariant sum: $S = \text{RemainingOncakOnBoard} + \sum (\text{PlayerScores})$.

Expected Result:

$S \equiv 120$ at all times without exception throughout the match lifecycle.

Failure Conditions: $S \neq 120$ at any point.

28. Determinism Tests

TC-DET-001 — Deterministic Action Execution

Source Rule: Core Engine Integrity

Priority: High

Test Type: Determinism

Preconditions: Two identical board state clones $S_A$ and $S_B$ with fixed random seeds.

Input / Initial State: Identical action sequence submitted to $S_A$ and $S_B$.

Steps:

Apply identical action sequence to $S_A$ and $S_B$.

Compare final state hash of $S_A$ and $S_B$.

Expected Result:

State hash $H(S_A) \equiv H(S_B)$ exactly.

Failure Conditions: Divergent state hashes given identical input streams.

29. Invalid Action Tests

TC-INV-001 — Movement Without Required Capture

Source Rule: 05 Rulebook Section 4.2 & 8.1

Priority: Critical

Test Type: Negative / Rule Enforcement

Preconditions: Pawn ON_BOARD at $(2,2)$. Player attempts to move Pawn to $(2,5)$ without capturing an Oncak group.

Input / Initial State: Non-capturing movement command.

Steps:

Submit movement command without capture payload.

Expected Result:

Action rejected without state mutation. Free non-capturing movement is strictly forbidden.

Failure Conditions: Pawn moves without executing a valid capture.

30. Edge Case Tests

TC-EDG-001 — Exhaustion of All Oncak for Single Color

Source Rule: 05 Rulebook Edge Mechanics

Priority: Medium

Test Type: Edge Case

Preconditions: All 60 BLACK Oncak have been captured. 10 WHITE Oncak remain on board. Active roll $V = 2$.

Input / Initial State: Remaining board state query.

Steps:

Engine evaluates reachable Capture Groups.

Expected Result:

Engine evaluates reachable groups considering ONLY available WHITE Oncak.

Exhaustion of one color does not prematurely end the match while Oncak of the opposite color remain on the board.

Failure Conditions: Match terminates prematurely upon single-color exhaustion.

31. Regression Test Suite

This section contains automated regression guards explicitly designed to prevent the re-introduction of obsolete legacy rules and false assumptions from earlier development builds.

Test ID

Legacy Assumption Guarded Against

Canonical Rule Assertion

Pass Criteria

REG-001

Initial Oncak count was 96

Rulebook §3.1 requires exactly 120 initial Oncak

Board initialization with 96 Oncak fails.

REG-002

Pawns move on Cell centers

Rulebook §2.1 requires Intersections ONLY

Movement to cell center $(x.5, y.5)$ fails.

REG-003

Free initial Pawn placement phase

Rulebook §4.1 requires Pawns start OFF_BOARD

Manual placement during setup fails.

REG-004

Pawn board entry restricted to perimeter

Rulebook §4.2 permits entry at any legal capture

Interior board entry succeeds.

REG-005

Dice Value determines movement distance

Rulebook §5.1 states Dice Value = Capture Quantity

Moving $>V$ distance for a valid group succeeds.

REG-006

4-segment movements allowed

Rulebook §7.2 strictly limits movement to $\le 3$ segments

4-segment path fails validation.

REG-007

Diagonal Pawn movement allowed

Rulebook §7.1 restricts movement to Orthogonal

Diagonal path fails validation.

REG-008

Central Logo $(5,5)$ can be traversed

Rulebook §2.3 designates $(5,5)$ as Permanent Hard Block

Path traversing $(5,5)$ fails validation.

REG-009

Illegal reroll with mandatory group left

Rulebook §8.3 forbids reroll during mandatory capture

Reroll attempt rejected.

REG-010

Immediate Turn End after capture sequence

Rulebook §8.4 requires reroll upon current $V$ exhaustion

Engine requests reroll, not turn end.

REG-011

Pawn elimination mechanics

Rulebook §4.1 contains no pawn elimination

No elimination trigger exists in engine logic.

REG-012

Tie-breaker execution on equal high score

Rulebook §10.2 declares Draw on equal high scores

Draw state emitted on equal high scores.

REG-013

Match ends via turn limit or deadlock

Rulebook §10.1 trigger is strictly remainingOncak == 0

Match continues until 0 Oncak remain.

REG-014

Setup removal of Oncak for Pawn spawn

Rulebook §3.1 populates all 120 valid intersections

120 Oncak present at turn 1 start.

REG-015

Flood-fill cluster capture logic

Rulebook §6.1 explicit group definition required

Non-rule-compliant flood fill rejected.

32. Rulebook Traceability Matrix

05 Rulebook Section

Section Name

Primary Test Case IDs

Coverage Type

§2.1

Spatial Grid Network

TC-BRD-001, TC-BRD-002, REG-002

Complete Unit & Safety

§2.2

Intersections & Connectivity

TC-BRD-001, TC-BRD-003

Structural Unit

§2.3

Central Logo Hard Block

TC-CENT-001, TC-CENT-002, TC-CENT-003, TC-CENT-004, REG-008

Pathfinding & Entry

§3.1

Oncak Quantity & Colors

TC-INIT-001, TC-INIT-002, REG-001, REG-014

State Initialization

§3.2

Distribution Constraints

TC-DIST-001, TC-DIST-002, TC-DIST-003

Boundary & Layout

§4.1

Pawn Initial State

TC-PawnInit-001, TC-PawnInit-002, REG-003, REG-011

State Machine

§4.2

OFF_BOARD Board Entry

TC-ENTRY-001, TC-ENTRY-002, TC-ENTRY-003, TC-CENT-004, REG-004

Integration Flow

§5.1

Dice Semantics & Mechanics

TC-DICE-001, TC-DICE-002, REG-005

Core Logic

§6.1

Capture Group Validation

TC-GRP-001, TC-GRP-002, REG-015

Structural & Color

§7.1

Movement Directions

TC-GEO-001, TC-GEO-002, REG-007

Geometry

§7.2

Segment Count Limits

TC-SEG-001, TC-SEG-002, TC-UNR-001, REG-006

Pathfinding Constraint

§7.3

Pawn Blocking Logic

TC-BLK-001, TC-BLK-002, TC-BLK-003, TC-BLK-004, TC-UNR-001

Collision Safety

§8.1

Atomic Multi-Capture Step

TC-RES-001

Resolution Sequence

§8.2

Endpoint Settlement

TC-END-001

State Settlement

§8.3

Mandatory Capture Loop

TC-MAN-001, TC-MAN-002, TC-MAN-003, TC-MAN-004, TC-UNR-002, REG-009

Rule Enforcement

§8.4

Reroll Conditions

TC-RER-001, TC-RER-002, TC-TRN-001, TC-UNR-003, REG-010

Turn State Transition

§8.5

Turn Termination

TC-ENTRY-003, TC-TRN-001, TC-UNR-003

Flow Control

§9.1

Turn Order & Rotation

TC-ORD-001

Sequence

§10.1

Match Termination

TC-MCH-001, TC-MCH-002, REG-013

Termination Integrity

§10.2

Victory & Draw Conditions

TC-WIN-001, TC-WIN-002, REG-012

End Game Evaluation

§11.1

AI Compliance Parity

TC-AI-001

Parity & Validation

33. Critical Pre-Implementation Gate

Before any candidate core engine codebase is accepted for deployment, integration, or automated gameplay testing, it MUST pass 100% of the following Critical Pre-Implementation Gate test cases:

TC-BRD-001: 121 Intersections verified.

TC-INIT-001: 120 Oncak (60 Black, 60 White) initialized; $(5,5)$ empty.

TC-CENT-001 & TC-CENT-002: Central Logo $(5,5)$ hard block strictly enforced.

TC-PawnInit-001: Pawns default to OFF_BOARD.

TC-ENTRY-001: First capture triggers valid OFF_BOARD to ON_BOARD entry sequence.

TC-DICE-001 & TC-DICE-002: Dice dictates capture quantity $V$ only; distance independent.

TC-GRP-001 & TC-GRP-002: Capture group size $V$ and same-color checks enforced.

TC-GEO-002: Diagonal movement strictly rejected.

TC-SEG-001 & TC-SEG-002: 4-segment and $\ge 5$-segment movements strictly rejected.

TC-BLK-001 & TC-BLK-003: Intermediate pawn blocking and jumping prohibition strictly enforced.

TC-RES-001: Capture group resolution is atomic before global re-evaluation.

TC-MAN-001: Mandatory capture prevents illegal reroll while valid $V$ groups remain.

TC-TRN-001: Current $V$ exhaustion triggers reroll; newly rolled $V$ failure ends turn.

TC-MCH-001: Match ends immediately when remainingOncak == 0.

TC-WIN-002: Draw declared on score tie without tie-breakers.

34. Unresolved-Test Dependencies

No test cases in this canonical suite are currently blocked by unresolved rulebook items. Should future non-gameplay UI/UX or hardware integrations require test coverage, they shall be added under a dedicated non-gameplay extension module without altering the canonical engine invariants established herein.