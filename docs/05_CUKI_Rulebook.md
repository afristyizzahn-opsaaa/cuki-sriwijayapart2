CUKI Official Rulebook & Game Engine Specification

1. Document Information

Document Title: CUKI Official Rulebook & Game Engine Specification

Status: LOCKED — Gameplay Source of Truth

Governance Standard: Canonical Locks #1 through #15

Target Audience: Game Developers, Engine Architects, Rules Arbiters, AI Developers, and Quality Assurance Engineers

2. Purpose

This document provides the definitive, complete, and unalterable specification for the traditional-inspired strategic board game CUKI. It serves as both the official player rulebook and the formal game engine specification for digital implementations. Every mechanics definition, edge case resolution, turn flow, and validation constraint contained herein is binding upon all engine implementations and client software.

3. Rule Authority & Principles

3.1 Highest Authority

The definitive rules of CUKI are governed by Canonical Locks #1 through #15. In any conflict between visual assets, UI implementations, external documentation, or legacy summaries, Canonical Locks #1–#15 take absolute, binding precedence.

Supersession Notice: LOCK #13 and LOCK #14 supersede the initial Pawn placement portion of LOCK #6. LOCK #6 remains authoritative only for established Player order where not otherwise superseded.

Core Authority Range: Specifically, LOCK #13, LOCK #14, and LOCK #15 contain authoritative rules regarding Pawn-entry, state transitions, and board blocking geometry, forming an integral part of the highest gameplay authority.

3.2 Core Principles

Determinism: Given a board state and an active Dice Value $V$, all legal routes and valid Capture Groups are deterministically computable.

Mandatory Capture: If at least one legal and reachable Capture Group matching Dice Value $V$ exists, the active Player MUST capture.

No Teleportation: Pawns slide continuously along intersection lines.

No Diagonal Pawn Movement: Pawn movement is strictly orthogonal.

Preservation of Authentic Voice and Mechanics: No custom rules, homebrew variants, or alternative pathfinding limits may supersede Canonical Locks #1–#15.

4. Definitions

Term

Precise Definition

ONCAK

Stationary capture piece occupying an intersection. Total 120 (60 Black, 60 White).

PAWN

Player-controlled piece used to navigate intersection lines and capture Oncak.

INTERSECTION

A grid vertex $(r,c)$ on the $11 \times 11$ layer used as the spatial position system for Pawns and Oncak. The Central Logo Intersection is an exception and is permanently invalid for gameplay occupancy.

CENTRAL LOGO INTERSECTION

Intersection at $(5,5)$, permanently reserved, non-traversable, acting as a hard block.

CELL

A $1 \times 1$ visual grid square. Game pieces never occupy cell centers.

CAPTURE GROUP

One complete legal group containing exactly $V$ same-color Oncak for active Dice Value $V$.

CAPTURE STEP

The removal and traversal of a single Oncak during the resolution of a Capture Group.

CAPTURE ACTION / RESOLUTION

The complete process of executing and resolving one entire Capture Group of size $V$.

OFF_BOARD

The initial state of a Pawn prior to executing its first capture.

ON_BOARD

The state of a Pawn after executing its first successful capture action.

MOVEMENT SEGMENT

A continuous, straight orthogonal line traversed before changing direction.

5. Game Components

Oncak Pieces: Exactly 120 stationary capture target pieces (60 Black Oncak and 60 White Oncak).

Pawns: Player-controlled pieces (one per active Player) used to perform board entries, orthogonal movement, and captures.

Game Board: A physical $10 \times 10$ cell grid producing an $11 \times 11$ Intersection Layer (121 total vertices).

Dice / Randomizer: Mechanics utilize a rolled Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$ that dictates the exact Capture Group size for the active turn.

Physical Dice Specification (e.g., exact physical die count/type vs digital RNG): [REQUIRES DESIGN DECISION]

6. Board Model

6.1 Grid and Intersection Layer

The physical board is defined by a $10 \times 10$ cell grid.

Gameplay occurs exclusively on the $11 \times 11$ Intersection Layer, yielding exactly 121 intersections labeled $(r, c)$ where $r, c \in \{0, 1, \dots, 10\}$.

Game pieces (Pawns and Oncak) occupy Intersections, never Cell centers.

(0,0) --- (0,1) --- ... --- (0,10)
  |         |                 |
(1,0) --- (1,1) --- ... --- (1,10)
  |         |                 |
 ...       ...      ...      ...
  |         |                 |
(10,0) -- (10,1) -- ... --- (10,10)


6.2 Central Logo Intersection Hard Block (Lock #1 & Lock #15)

The intersection at $(5, 5)$ is designated as the Central Logo Intersection.

The Central Logo Intersection functions as a permanently blocked gameplay intersection and hard block in the Pawn movement network:

Does not contain an Oncak at any point.

Is reserved to preserve central CUKI / Sriwijaya branding.

Cannot serve as a Pawn starting position, entry point, or final capture endpoint.

Cannot be occupied, traversed, crossed, or passed through by a Pawn under any circumstances.

Cannot be included as an intermediate node in any legal movement or capture route.

Does not belong to any Player or Oncak color.

Any proposed Pawn route that enters, crosses, passes through, or terminates at $(5, 5)$ is strictly illegal. This hard block applies equally to OFF_BOARD entry routes, ON_BOARD movement routes, all Players, all game modes, and all Dice Values.

7. Initial Setup

7.1 Initial Oncak Distribution (Lock #1 & Lock #2)

The 120 valid intersections (excluding $(5,5)$) are populated with exactly 120 Oncak:

60 Black Oncak

60 White Oncak

Oncak are randomized across all 120 valid intersections. There are no predefined territories, quadrants, or player-owned zones.

Same-Color Sequence Constraint (Lock #2): During initial board generation, Oncak of the same color may form a maximum consecutive sequence of 6 along any vertical or diagonal line.

Vertical lines ($c = \text{constant}$): Maximum 6 consecutive same-color Oncak.

Diagonal lines ($r - c = \text{constant}$ or $r + c = \text{constant}$): Maximum 6 consecutive same-color Oncak.

Horizontal lines ($r = \text{constant}$): Not evaluated under the 6-sequence constraint.

7.2 Initial Pawn State (Lock #13 & Lock #14 superseding Lock #6)

Every Player's Pawn begins in the OFF_BOARD state.

There is NO setup phase where Oncak are removed to create starting positions.

There is NO free initial Pawn placement phase on the board (LOCK #13 and LOCK #14 supersede the initial placement portion of LOCK #6).

Player turn order is fixed: Player 1 $\rightarrow$ Player 2 $\rightarrow$ Player 3 $\rightarrow$ Player 4 (when applicable).

8. Supported Game Modes

Standard Player Matches: Supports 2-player, 3-player, or 4-player competitive configurations utilizing fixed turn rotation.

No additional game mode variants are defined by this Rulebook.

9. Objective

The objective of CUKI is to score the highest total points by capturing Oncak pieces from the board. Each captured Oncak awards exactly +1 point to the capturing Player's score. The match ends when all Oncak on the board have been captured, and the Player with the highest total score wins.

10. Turn Structure

10.1 Turn Execution Flow

Dice Roll: Active Player rolls the dice to generate Dice Value $V$.

Board Evaluation: Engine evaluates all legal and reachable Capture Groups of size $V$ for the active Pawn.

Capture Execution:

If zero legal reachable groups exist: Turn ends immediately.

If one or more legal reachable groups exist: Active Player selects and completely resolves ONE legal Capture Group of size $V$.

Endpoint Re-Evaluation: Pawn comes to rest at the final capture endpoint. Engine re-evaluates the board from this new endpoint using the SAME Dice Value $V$.

Mandatory Loop / Turn Continuation:

If matching reachable groups still exist: Player MUST capture again (loop back to Step 3).

If zero matching reachable groups remain for $V$: Player is granted a REROLL (loop back to Step 1).

Turn Control Pass: When a dice roll produces zero legal reachable groups, the active turn ends and control passes to the next Player in turn order.

11. Dice Rules

A dice roll establishes the active Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$.

The Dice Value $V$ specifies the EXACT number of same-color Oncak that must be captured in a target Capture Group.

The Dice Value $V$ does NOT determine movement distance, maximum intersections crossed, or maximum segment counts.

Physical Dice Engine Specification (e.g., single physical 6-sided die vs RNG implementation): [REQUIRES DESIGN DECISION]

12. Oncak Group Rules

12.1 Capture Group Definition (Lock #3)

An Oncak Group is NOT a generic flood-filled cluster.

A legal Capture Group consists of Oncak belonging to an applicable capture opportunity that satisfies all of the following conditions:

All Oncak in the group belong to the same applicable capture opportunity.

All Oncak in the group form part of the same applicable capture opportunity.

All Oncak in the group share the exact same color (all Black or all White).

The group contains exactly $V$ Oncak, where $V$ is the active Dice Value.

12.2 Branching and Color Rules

Branching paths (e.g., T-junctions or cross-junctions) do not automatically combine connected Oncak into one group.

If a Pawn reaches a junction with:

White Oncak — Pawn — White Oncak (line of 2): Forms a valid Capture Group of 2 if $V=2$.

White Oncak — Pawn — Black Oncak: Does NOT form a valid group because colors differ.

13. Movement Rules

13.1 Line Network & Orthogonal Sliding (Lock #4)

An ON_BOARD Pawn moves by sliding continuously along the horizontal and vertical lines connecting intersections.

Diagonal Pawn movement is strictly prohibited.

Movement occurs along intersection lines, never through Cell centers.

13.2 Movement Segment Limit (Lock #4 & Lock #5)

A Movement Segment is defined as one uninterrupted straight movement along a single horizontal or vertical line before changing direction.

For any single capture movement, a Pawn path may contain a maximum of 3 straight movement segments:

1 Segment: Legal (e.g., Horizontal OR Vertical)

2 Segments: Legal (e.g., Horizontal $\rightarrow$ Vertical OR Vertical $\rightarrow$ Horizontal)

3 Segments: Legal (e.g., Horizontal $\rightarrow$ Vertical $\rightarrow$ Horizontal OR Vertical $\rightarrow$ Horizontal $\rightarrow$ Vertical)

$> 3$ Segments: Illegal

The number of intersections crossed within a single straight segment is unlimited, provided the path remains unobstructed and legal.

Valid 3-Segment Example (Horizontal -> Vertical -> Horizontal):
Pawn (0,0) --------> (0,4)
                       |
                       v
                     (3,4) --------> (3,8) [Target Capture Group]


14. Capture Rules

14.1 Pawn Entry Mechanics (Lock #13 & Lock #14)

At match start, all Pawns are OFF_BOARD.

An OFF_BOARD Pawn enters the board exclusively through its first successful capture action.

When a Dice Value $V$ is rolled:

The engine checks if any valid Capture Group of exactly $V$ same-color Oncak exists on the board.

The Player selects one legal Capture Group of size $V$.

The first captured Oncak in the selected group counts as Capture #1 and contributes normally (+1) to the Player's score.

The Pawn enters the board at the former intersection of that first captured Oncak.

The Pawn continues through the remaining Oncak of the selected Capture Group.

The Pawn comes to rest at the former intersection of the final captured Oncak in that group.

Upon completion of this first capture action, the Pawn's state transitions from OFF_BOARD to ON_BOARD.

Entry is NOT restricted to perimeter intersections. There are no designated spawn zones.

The selected first-entry capture route itself MUST NOT enter, cross, traverse, or terminate at the Central Logo Intersection $(5,5)$.

14.2 Capture Traversal & Endpoint (Lock #11)

After completing a legal capture movement, the Pawn remains at the former intersection of the final captured Oncak (Oncak #$V$).

The Pawn does NOT automatically advance to an extra vacant intersection beyond the final captured Oncak.

The Pawn does NOT return to its pre-capture starting position.

If multiple valid legal capture endpoints exist for a given capture configuration, the Player strategically selects among those legal endpoints.

The selected endpoint becomes the Pawn's new position for all subsequent reachability and board evaluations.

15. Mandatory Capture & Re-roll Rules

15.1 Mandatory Capture Rule (Lock #7 & Lock #8)

After a dice roll of value $V$, if at least one legal and reachable Capture Group matching $V$ exists, the active Player MUST capture.

15.2 Complete Group Resolution Before Board Re-Evaluation

Board re-evaluation for Mandatory Capture does NOT occur mid-group or after individual capture steps.

A Capture Group of size $V$ MUST be completely resolved before any global board re-evaluation takes place.

Individual Oncak inside a single Capture Group are NOT separate Mandatory Capture triggers.

15.3 Multiple Mandatory Capture Resolution Loop (Lock #7)

If multiple legal and reachable matching Capture Groups exist for current Dice Value $V$:

Roll Dice V
  │
  ▼
Evaluate Board for Groups of size V
  │
  ├──► Zero reachable matching groups ──► TURN ENDS (Reroll NOT granted)
  │
  └──► One or more reachable matching groups
        │
        ▼
  Player selects ONE legal group of size V
        │
        ▼
  Resolve COMPLETE group of V Oncak (Capture Steps 1..V)
        │
        ▼
  Pawn reaches final capture endpoint
        │
        ▼
  Re-evaluate board from NEW Pawn endpoint using SAME Dice Value V
        │
        ├──► Matching reachable group STILL exists ──► MUST capture another complete group
        │                                              (Loop back to group selection)
        │
        └──► NO matching reachable groups remain ────► ROLL AGAIN (Dice Reroll Granted)


Process Rules:

The Player selects which legal matching Capture Group to resolve first.

The Pawn resolves the complete group and comes to rest at the selected legal endpoint.

Engine re-evaluates the board from the Pawn's new position using the SAME Dice Value $V$.

If one or more legal and reachable matching groups still exist, the Player MUST execute another capture action.

Groups that become unreachable after the Pawn moves are no longer mandatory.

Groups that become newly reachable from the new position become mandatory.

The Player MAY NOT reroll while at least one legal and reachable matching group remains for current Dice Value $V$.

This resolution loop repeats until zero legal and reachable matching groups remain for current Dice Value $V$.

16. Blocking Rules

16.1 Pawn Blocking (Lock #8)

An ON_BOARD Pawn cannot pass through, jump over, or land on an intersection occupied by another Player's Pawn.

An intersection containing another Player's Pawn acts as a complete line block for pathfinding purposes.

16.2 Central Logo Hard Block (Lock #15)

The Central Logo Intersection at $(5, 5)$ acts as a permanent, absolute hard block in the movement network regardless of Pawn positions.

No Pawn (OFF_BOARD or ON_BOARD) may pass through, enter, cross, or terminate on $(5, 5)$.

If avoiding $(5, 5)$ or another Pawn requires a path with more than 3 movement segments, that alternate route is illegal.

16.3 Unreachable Group Criteria (Lock #8 & Lock #15)

A matching Oncak group is classified as unreachable if every valid path to it violates one or more gameplay rules:

Requires more than 3 straight movement segments.

Passes through or jumps over another Player's Pawn.

Enters, crosses, or passes through the Central Logo Intersection at $(5,5)$.

Requires diagonal sliding.

Uses any otherwise prohibited path.

17. Turn Completion

17.1 Exact Turn-End Conditions (Lock #9)

A Player's turn ends immediately when a dice roll produces zero legal and reachable matching Capture Groups. This includes two exact scenarios:

No matching Capture Group of size $V$ exists anywhere on the board.

Matching Capture Groups of size $V$ exist, but none are legally reachable by the active Pawn under movement, blocking, and Central Logo rules.

17.2 Turn Termination Actions

When a turn ends:

The active Dice Value $V$ is cleared.

No additional Pawn movement is permitted.

No free capture is permitted.

No reroll is granted.

Control passes immediately to the next Player in turn order.

18. Match Completion

Match Completion Trigger (Lock #10): The match ends immediately when the final remaining Oncak on the board is captured and zero Oncak remain on the board.

Match completion takes absolute priority over turn continuation mechanics and reroll grants.

19. Winner & Draw Conditions

19.1 Scoring & Victory

Each captured Oncak awards +1 point to the capturing Player.

The Player with the highest total score when the match ends wins the match.

19.2 Tie Resolution Rule (Lock #10)

If two or more Players share the highest final score when the match ends, the result is a Draw.

NO tie-breaker is applied.

A Draw may involve 2, 3, or 4 Players sharing the top score.

20. AI Compliance Rules

Engine implementations and AI agents MUST evaluate board states and legal paths deterministically in strict compliance with Canonical Locks #1–#15.

AI agents MUST recognize Mandatory Capture loops and execute legal captures whenever reachable matching groups exist.

AI agents MUST NOT evaluate imaginary off-board movement paths or attempt illegal traversals through $(5,5)$ or occupied Pawn intersections.

Specific AI Search Heuristics or Evaluation Tree Standards: [REQUIRES DESIGN DECISION]

21. Invalid Actions

The engine MUST reject and prohibit all of the following invalid actions:

Moving or sliding a Pawn diagonally.

Traversing or executing a capture route containing more than 3 movement segments.

Entering, crossing, passing through, or terminating on the Central Logo Intersection $(5,5)$.

Passing through, jumping over, or landing on an intersection occupied by another Pawn.

Executing a capture group whose size does not equal the active Dice Value $V$ exactly.

Rerolling the dice while at least one legal and reachable matching Capture Group remains for current $V$.

Moving a Pawn without executing a valid capture.

Placing a Pawn freely on the board during initial setup.

Attempting to execute mid-group board re-evaluation or partial group captures.

22. Edge Cases

22.1 Failed OFF_BOARD Roll

Condition: Pawn is OFF_BOARD and rolls $V$, but zero legal groups of size $V$ exist on the board.

Resolution: Pawn remains OFF_BOARD. No Oncak are removed, score is unchanged, no reroll is granted, and turn ends immediately.

22.2 Unreachable Matching Groups

Condition: Groups of size $V$ exist, but ALL are rendered unreachable due to Pawn blocking, 3-segment limits, or the $(5,5)$ Central Logo hard block.

Resolution: Treated as zero legal captures. Turn ends immediately. No reroll granted.

22.3 Branching Endpoint Strategic Selection

Condition: Resolving a capture group yields multiple valid legal capture endpoints.

Resolution: Player strategically selects one legal endpoint. Re-evaluation originates strictly from the chosen endpoint.

22.4 Equal Highest Final Scores

Condition: Match ends (0 Oncak remain) and Player 1 and Player 2 share the top score.

Resolution: Declared a Draw between Player 1 and Player 2. No tie-breaker.

23. Rule Priority

In the event of any ambiguity, implementation dispute, or UI design conflict, interpretation must adhere to the following strict hierarchy:

Canonical Locks #1 through #15 (Highest Authority).

Note: LOCK #13 and LOCK #14 supersede the initial placement portion of LOCK #6.

Section 1 through Section 22 of this Rulebook.

Test Scenarios & QA Verification Matrix.

Non-normative Developer Notes.

24. Gameplay Examples

Test Scenario A: ON_BOARD Mandatory Capture Loop

Initial State: Pawn is ON_BOARD at $(2,2)$. Active Dice Roll $V = 4$.

Board Condition: Group A contains 4 White Oncak reachable in 2 segments. Group B contains 4 White Oncak reachable in 3 segments from Group A's endpoint.

Execution Sequence:

Player selects Group A.

Capture Steps 1..4 executed $\rightarrow$ Pawn reaches final endpoint of Group A. Score += 4.

Engine Re-evaluates Board: Group B evaluated from new endpoint for $V = 4$.

Group B is legal and reachable $\rightarrow$ Capture is MANDATORY.

Player resolves Group B completely. Pawn reaches final endpoint of Group B. Score += 4.

Engine Re-evaluates Board: Zero groups of size 4 remain reachable.

Player is granted a REROLL.

Test Scenario B: OFF_BOARD Pawn Entry

Initial State: Pawn is OFF_BOARD. Active Dice Roll $V = 3$.

Board Condition: A legal group of 3 Black Oncak exists at $(7,1)-(7,3)$.

Execution Sequence:

Player selects Black group at $(7,1)-(7,3)$.

Black #1 at $(7,1)$ captured $\rightarrow$ Pawn enters board at $(7,1)$.

Black #2 at $(7,2)$ captured $\rightarrow$ Pawn advances to $(7,2)$.

Black #3 at $(7,3)$ captured $\rightarrow$ Pawn comes to rest at $(7,3)$.

Score += 3. Pawn state becomes ON_BOARD.

Engine re-evaluates board from $(7,3)$ for $V = 3$.

This example represents one valid straight capture route and does not restrict OFF_BOARD entry to straight-line captures only.

Test Scenario C: Failed OFF_BOARD Roll

Initial State: Pawn is OFF_BOARD. Active Dice Roll $V = 5$.

Board Condition: Zero groups of exactly 5 same-color Oncak exist on the board.

Execution Sequence:

Engine evaluates board for $V = 5 \rightarrow$ Result: 0 legal groups.

Pawn remains OFF_BOARD. Turn ends immediately. Control passes to next Player.

25. Developer Notes

25.1 Pathfinding & Validation Method

Engine implementations may use any deterministic route-enumeration or validation method, provided that every accepted route and rejected route exactly complies with the gameplay rules defined in this Rulebook.

25.2 Gameplay Constraints Summary

Any validation engine must strictly enforce:

Board layer is an $11 \times 11$ intersection grid (121 total vertices).

Central Logo at $(5,5)$ is strictly unoccupiable and non-traversable (permanent hard block).

Orthogonal Pawn movement only (no diagonal sliding).

Maximum 3 straight movement segments per capture action.

Path blocking by other Pawns (no jumping, passing through, or landing on Pawns).

Dice Value $V$ dictates exact Capture Group size, not maximum travel distance.

OFF_BOARD Pawns enter directly via any legal Capture Group of size $V$ without calculating imaginary off-board movement paths. Entry route must not traverse $(5,5)$.

Complete group resolution must occur before board re-evaluation.

Unresolved Design Decisions

Physical Dice Specification: Whether the Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$ is produced physically by a single 6-sided die, double dice sum, or digital RNG mechanism in specific software titles.

AI Search / Heuristic Standards: Exact heuristic scoring formulas, depth limits, or decision-tree evaluation standards for AI bots beyond mandatory legal move enumeration and rule compliance.