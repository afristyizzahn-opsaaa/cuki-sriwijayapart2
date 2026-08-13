07_Functional_Specification

1. Document Information

Attribute

Specification

Document Title

Functional Specification

Project Name

CUKI: The Kingdom of Sriwijaya

Document ID

SPEC-07-FUNC

Version

2.0.0

Status:
LOCKED — CANONICAL FUNCTIONAL SPECIFICATION

Author

Principal Software Architect & Senior Game Systems Analyst

Target Audience

Lead Game Developers, Core Engine Architects, QA Automation Engineers

System Classification

Deterministic Reactive Board Game Engine

2. Purpose

This document translates the authoritative gameplay rules defined in 05_CUKI_Rulebook.md into executable, deterministic functional software specifications for CUKI: The Kingdom of Sriwijaya.

While 05_CUKI_Rulebook.md defines what the game rules are, and 06_Game_Engine_Test_Cases.md defines how to verify those rules, this specification details what the software runtime must do state-by-state, module-by-module, and transition-by-transition to execute those rules flawlessly.

It provides explicit functional contracts covering:

Runtime state machines and state transitions;

Module inputs, outputs, preconditions, and postconditions;

Validation rules and rejection pathways;

Reachability, pathfinding, and capture group analysis algorithms;

Off-board pawn entry and on-board sliding mechanics;

Mandatory capture loops and reroll transitions;

AI decision interfaces and local multiplayer sequencing;

Persistence, recovery, and error boundary protocols;

Acceptance criteria and bidirectional rule/test traceability.

3. Authority & Document Hierarchy

Gameplay behavior and engine functionality are governed strictly by the following authoritative document hierarchy:

$$\text{05\_CUKI\_Rulebook.md} \succ \text{06\_Game\_Engine\_Test\_Cases.md} \succ \text{04\_Software\_Architecture.md} \succ \text{03\_Design\_System.md} \succ \text{02\_PRD.md} \succ \text{01\_Game\_Design\_Bible.md}$$

Critical Rules of Authority:

05_CUKI_Rulebook.md is the SOLE gameplay authority. No functional requirement in this document may override, modify, or add mechanics to 05.

06_Game_Engine_Test_Cases.md is the SOLE test authority. All acceptance criteria must map directly to real test case IDs in 06.

Implementation assumptions in older documents (including prior versions of Document 07 or architecture diagrams) that conflict with 05 or 06 are OBSOLETE AND DELETED.

4. Functional Scope

In Scope

Complete functional behavior of the core CUKI reactive state engine.

11x11 Intersection Layer spatial graph model and Central Logo hard-block enforcement.

Randomized initialization of 120 Oncak (60 Black, 60 White) with max-6 sequence validation.

Off-board pawn entry mechanics and board-wide first capture entry.

Authoritative $D_6$ dice resolution engine and target quantity matching.

Orthogonal sliding movement validation (1, 2, or 3 segments) with pawn blocking.

Atomic complete capture group resolution and endpoint settlement.

Mandatory same-$V$ capture loops and post-exhaustion reroll transitions.

Automatic turn rotation for 2, 3, or 4 human/AI players.

Gameplay match completion strictly triggered when $\text{remainingOncak} = 0$.

Persistence adapter integration, session recovery, and error handling.

Out of Scope / Explicitly Deleted Obsolete Mechanics

The following legacy assumptions have been PERMANENTLY REMOVED:

❌ 96 initial Oncak setup model.

❌ $10 \times 10$ Cell array as the gameplay positioning network.

❌ Four center gameplay void Cells.

❌ Pawn movement through Cell centers.

❌ Free initial Pawn placement phase or setup spawn coordinates.

❌ Quadrant-based or perimeter-only Pawn entry restrictions.

❌ Setup removal of Oncak to create Pawn starting positions.

❌ Generic flood-fill Oncak clusters or mixed-color capture groups.

❌ Dice Value $V$ interpreted as movement distance or segment allowance.

❌ Destination-cell-adjacent capture model.

❌ Universal rule treating PRESENT Oncak as movement obstacles.

❌ Pawn jumping or diagonal Pawn sliding.

❌ Movement routes with $>3$ straight segments.

❌ Immediate turn termination after capture sequence without checking rerolls.

❌ Pawn elimination, tie-breakers, or player territory rules.

❌ Match completion while Oncak remain on the board during normal gameplay.

5. Functional Invariants

The software runtime MUST maintain the following mathematical and state invariants across all operations:

Spatial Invariant: $11 \times 11 = 121$ Intersections. Exactly 120 valid gameplay intersections and 1 permanent block at $(5,5)$.

Oncak Conservation Invariant: At any point during gameplay:

$$\text{remainingOncak} + \sum_{p=1}^{P} \text{score}(p) \equiv 120$$

Color Balance Invariant: At match setup:

$$\text{count}(\text{BLACK}) = 60, \quad \text{count}(\text{WHITE}) = 60$$

Central Logo Invariant: Intersection $(5,5)$ MUST remain permanently empty ($\text{Oncak} = \text{null}$) and unoccupiable ($\text{Pawn} = \text{null}$). No route segment may traverse, enter, or cross $(5,5)$.

Pawn Identity Invariant: Exactly $P \in \{2, 3, 4\}$ Pawns exist. Every player controls exactly 1 Pawn. Pawns cannot be eliminated or duplicated.

Movement Segment Invariant: Every legal capture movement path $S$ consists of straight orthogonal segments $k$ such that $1 \le k \le 3$.

Dice Meaning Invariant: Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$ specifies the exact count of same-color Oncak in a capture group, never movement distance.

Match Termination Invariant: Match status transitions to MATCH_FINISHED if and only if $\text{remainingOncak} = 0$ as a gameplay completion trigger (excluding technical session resets or administrative aborts).

6. Runtime State Vocabulary

State Identifiers

MATCH_STATUS: Enum [IDLE, INITIALIZING, ACTIVE, MATCH_FINISHED]

TURN_PHASE: Enum [WAITING_FOR_DICE_ROLL, DICE_RESOLVED, EVALUATING_CAPTURE_OPPORTUNITIES, WAITING_FOR_CAPTURE_SELECTION, RESOLVING_CAPTURE_GROUP, REEVALUATING_SAME_DICE, REROLL_REQUIRED, TURN_END]

PAWN_STATUS: Enum [OFF_BOARD, ON_BOARD]

ONCAK_COLOR: Enum [BLACK, WHITE]

CONTROLLER_TYPE: Enum [HUMAN, AI]

Coordinate System

Intersections are denoted as $(x, y)$ where $x \in [0..10]$ and $y \in [0..10]$.

$x$ represents the column index (left-to-right).

$y$ represents the row index (top-to-bottom).

Central Logo Intersection is permanently fixed at $(5, 5)$.

7. Functional State Machine

The core game engine operates as a deterministic, finite state machine (FSM).

                      [ IDLE / SETUP ]
                             │
                             ▼
                  [ MATCH_INITIALIZING ]
                             │
                             ▼
                  [ WAITING_FOR_DICE_ROLL ] ◄─────────────────────────┐
                             │                                        │
                             ▼                                        │
                      [ DICE_RESOLVED ]                               │
                             │                                        │
                             ▼                                        │
            [ EVALUATING_CAPTURE_OPPORTUNITIES ]                      │
                             │                                        │
              ┌──────────────┴──────────────┐                         │
              │ (Count >= 1)                │ (Count == 0)            │
              ▼                             ▼                         │
 [ WAITING_FOR_CAPTURE_SELECTION ]      [ TURN_END ] ─────────────────┤
              │                             │ (CASE A: Newly rolled V │
              ▼                             │  has zero opportunities)│
   [ RESOLVING_CAPTURE_GROUP ]              │                         │
              │                             │                         │
              ▼                             │                         │
   [ REEVALUATING_SAME_DICE ]               │                         │
              │                             │                         │
     ┌────────┼─────────────────────────────┼─────────────────────────┐
     │        │                             │                         │
     │ (Remaining >= 1)                     │ (CASE C: remainingOncak == 0)
     ▼        ▼ (CASE B: Remaining == 0)    │                         │
(Loop back) [ REROLL_REQUIRED ] ────────────┘                         │
Capture Selection     │ (Triggers new roll for SAME player)           │
                      │                                               ▼
                      └───────────────────────────────────────► [ MATCH_FINISHED ]



State Transitions & Triggers

Current State

Event / Trigger

Target State

Functional Condition / Validation

IDLE

START_MATCH_COMMAND

MATCH_INITIALIZING

Session payload valid ($P \in \{2,3,4\}$).

MATCH_INITIALIZING

LAYOUT_VALIDATED

WAITING_FOR_DICE_ROLL

120 Oncak placed; max-6 sequence satisfied; Pawns OFF_BOARD.

WAITING_FOR_DICE_ROLL

ROLL_DICE_ACTION

DICE_RESOLVED

Triggered by active player or AI; generates $V \in \{1..6\}$.

DICE_RESOLVED

AUTO_EVALUATE

EVALUATING_CAPTURE_OPPORTUNITIES

Engine scans board graph for legal + reachable capture opportunities of size $V$.

EVALUATING_CAPTURE_OPPORTUNITIES

OPPORTUNITIES_EXIST

WAITING_FOR_CAPTURE_SELECTION

Available legal + reachable capture opportunities count $\ge 1$.

EVALUATING_CAPTURE_OPPORTUNITIES

NO_OPPORTUNITIES

TURN_END

CASE A: Newly rolled $V$ produces 0 legal + reachable opportunities. Clear $V$; advance player. No reroll.

WAITING_FOR_CAPTURE_SELECTION

SELECT_GROUP_ACTION

RESOLVING_CAPTURE_GROUP

Selected candidate payload matches legal candidate list.

RESOLVING_CAPTURE_GROUP

GROUP_RESOLUTION_COMPLETE

REEVALUATING_SAME_DICE

All $V$ Oncak removed; Pawn moved to endpoint; score updated; state committed.

REEVALUATING_SAME_DICE

MATCH_COMPLETED_CHECK

MATCH_FINISHED

CASE C: Evaluated if $\text{remainingOncak} == 0$. Immediate match completion. No reroll, no player advance.

REEVALUATING_SAME_DICE

SAME_V_GROUPS_EXIST

WAITING_FOR_CAPTURE_SELECTION

Re-evaluation from new endpoint for same $V$ returns $\ge 1$ legal + reachable opportunities.

REEVALUATING_SAME_DICE

SAME_V_GROUPS_EXHAUSTED

REROLL_REQUIRED

CASE B: Post-capture re-evaluation from new endpoint for same $V$ returns 0 legal + reachable opportunities.

REROLL_REQUIRED

ROLL_DICE_ACTION

DICE_RESOLVED

Active player rolls dice again (same turn continues).

TURN_END

ADVANCE_PLAYER

WAITING_FOR_DICE_ROLL

Active index updated: $(i + 1) \bmod P$.

8. Functional Modules

+-----------------------------------------------------------------------------------+
|                               FUNCTIONAL MODULES                                  |
+---------------------+-----------------------+-------------------------------------+
| MOD-01 Setup & Init | MOD-02 Dice Resolution| MOD-03 Capture Group Analysis       |
| MOD-04 Pathfinding  | MOD-05 Off-Board Entry| MOD-06 Capture Execution            |
| MOD-07 Mandatory Loop| MOD-08 Reroll Control | MOD-09 Turn Sequencing              |
| MOD-10 Match End    | MOD-11 AI Decision    | MOD-12 Local Multiplayer            |
| MOD-13 Persistence  | MOD-14 Error Handling |                                     |
+---------------------+-----------------------+-------------------------------------+



9. Match Initialization Behaviour (MOD-01)

Module Details

Feature Name: Board Setup & Match Initialization

Purpose: Constructs the 11x11 intersection graph, populates 120 Oncak (60 Black, 60 White), enforces layout max-6 constraints, initializes $P$ players with OFF_BOARD Pawns, and prepares the game state.

Functional Processing

Validate input parameters ($P \in \{2, 3, 4\}$, player types).

Construct 121 intersection node structures indexed $(x, y)$ for $x, y \in [0..10]$.

Set intersection $(5, 5)$ as IS_CENTRAL_LOGO = true, ONCAK = null, IS_BLOCKED = true.

Generate an array of 120 Oncak: 60 BLACK, 60 WHITE.

Randomly assign Oncak to all 120 non-$(5,5)$ intersections.

Validation Step: Evaluate layout for maximum consecutive same-color sequences along:

All vertical columns ($x = 0..10$);

All diagonal lines ($x - y = \text{const}$ and $x + y = \text{const}$).

Horizontal lines are explicitly excluded from this validation.

If any vertical or diagonal line contains $\ge 7$ consecutive same-color Oncak:

Reject layout;

Reshuffle Oncak array;

Re-evaluate until a valid layout is produced.

Initialize $P$ Player objects:

pawnStatus = OFF_BOARD

pawnPosition = null

score = 0

Set remainingOncak = 120, activePlayerIndex = 0, status = ACTIVE, turnPhase = WAITING_FOR_DICE_ROLL.

Preconditions / Postconditions

Precondition: System in IDLE state. Valid initialization payload provided.

Postcondition: Board contains 120 Oncak, $(5,5)$ empty, Pawns OFF_BOARD, state = WAITING_FOR_DICE_ROLL.

10. Dice Resolution Behaviour (MOD-02)

Module Details

Feature Name: Dice Generator & Resolver

Purpose: Resolves an authoritative integer $V \in \{1, 2, 3, 4, 5, 6\}$ for the active player.

Functional Processing

Receive ROLL_DICE_ACTION from active player UI or AI controller.

Verify system state is WAITING_FOR_DICE_ROLL or REROLL_REQUIRED.

Generate authoritative Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$.

Result generation must integrate with the deterministic/seeded runtime mechanism defined by architecture.

Identical authoritative seed/random stream and identical inputs must permit reproducible results where deterministic replay or testing is required.

Store $V$ into currentDiceValue.

Set turnPhase = DICE_RESOLVED.

Instantly dispatch $V$ to MOD-03 for capture opportunity evaluation.

Rules Enforcement

Dice Value $V$ specifies EXACT CAPTURE GROUP SIZE.

$V$ does NOT specify movement distance, spatial steps, or max segments.

11. Capture Opportunity Analysis (MOD-03)

Module Details

Feature Name: Capture Group Candidate Evaluator

Purpose: Identifies all structurally valid Capture Group candidates matching active Dice Value $V$ on the current board according to Rulebook §6.1.

Functional Processing & Constraints

Input: Board state matrix, active $V$.

GENERIC FLOOD-FILL MUST NOT BE USED AS THE AUTHORITATIVE CAPTURE-GROUP DEFINITION. Generic connected-component analysis or flood-filling all adjacent Oncak is explicitly invalid (preserving REG-015 compatibility).

A Capture Group MUST be derived from a legal Capture Opportunity. Every valid Capture Group candidate MUST:

Contain EXACTLY $V$ Oncak;

Contain Oncak of EXACTLY ONE COLOR (all BLACK or all WHITE);

Belong to the same applicable capture path and capture opportunity;

Be resolvable as one complete legal capture sequence.

Branching connected structures must NOT automatically combine into one group.

Discard mixed-color groups or candidate structures where size $\neq V$.

Output structurally valid candidate Capture Opportunities array to MOD-04 for reachability filtering.

12. OFF_BOARD Pawn Entry Behaviour (MOD-05)

Module Details

Feature Name: First Capture Board Entry Manager

Purpose: Manages the initial board entry of an OFF_BOARD Pawn through its first successful capture.

Functional Processing

If active player's pawnStatus == OFF_BOARD:

The Pawn has no physical coordinate on the board.

The engine evaluates candidate capture opportunities across the ENTIRE BOARD.

Entry selection is NOT restricted to perimeter edge intersections.

No imaginary route from outside the board is calculated.

Player selects a legal matching Capture Group candidate of size $V$.

Execution Sequence:

Capture #1 removes the first Oncak of the selected group at intersection $(x_1, y_1)$.

Active player score increments by +1.

Pawn status transitions to ON_BOARD.

Pawn position is instantiated directly at $(x_1, y_1)$ (the former intersection of that first captured Oncak).

The engine resolves the remaining Oncak in the selected Capture Group according to the validated capture sequence and settles the Pawn at the final captured endpoint.

Failed Roll Handling: If a newly rolled $V$ produces zero legal matching opportunities on the board:

Pawn remains OFF_BOARD.

Score remains unchanged.

Turn ends immediately (TURN_END).

No reroll is granted.

13. Pawn Movement & Reachability Behaviour (MOD-04)

Module Details

Feature Name: Orthogonal Sliding Pathfinding & Complete Reachability Engine

Purpose: Evaluates whether candidate Capture Opportunities discovered by MOD-03 are legally reachable and executable from an ON_BOARD Pawn's current state.

Functional Processing & Constraints

Responsibility Boundary:

MOD-03 discovers structurally valid Capture Group candidates for Dice Value $V$.

MOD-04 determines whether a candidate Capture Opportunity is legally reachable and executable from the Pawn's current position $(x_0, y_0)$.

Reachability is NOT defined as merely reaching one arbitrary Oncak.

Complete Capture Opportunity Validation:
For an ON_BOARD Pawn, a candidate Capture Opportunity $G$ is marked REACHABLE if and only if at least one complete legal capture route exists validating ALL of the following:

Approach / Axis: Legal orthogonal approach (Horizontal or Vertical) from current Pawn position to the entry node of group $G$. Diagonal sliding is strictly INVALID.

Segment Limit: Total route (approach + group traversal) contains $k \le 3$ straight movement segments. Any route requiring $k \ge 4$ segments is INVALID.

Central Logo Hard Block: Intersection $(5,5)$ is NEVER entered, traversed, or crossed at any point along the route.

Pawn Blocking: No segment passes through or jumps over an intersection occupied by another ON_BOARD Pawn.

Endpoint Validity: The final settlement endpoint (intersection of Oncak #$V$) is NOT occupied by another Pawn.

Execution Feasibility: The complete selected Capture Group can be resolved in full.

No Uncanonical Restrictions:

Shortest-path routing is NOT required.

Dice Value $V$ is NEVER used as movement distance.

PRESENT Oncak are NOT universal movement obstacles.

Output: Filtered array of legal + reachable Capture Opportunities available for selection.

14. Capture Group Resolution Behaviour (MOD-06)

Module Details

Feature Name: Atomic Capture Execution & Board Commit

Purpose: Executes the complete resolution of a selected legal Capture Group as an atomic operation before global same-$V$ re-evaluation.

Functional Processing

Receive selected legal + reachable Capture Group candidate $G$ (size $V$) and validated route.

Set turnPhase = RESOLVING_CAPTURE_GROUP.

Process Oncak removal sequentially from Oncak #1 to Oncak #$V$:

Set intersection Oncak state = null (becomes traversable empty intersection).

Active player score += 1.

remainingOncak -= 1.

Move Pawn position to current captured Oncak coordinate.

Note: Visual UI rendering may show sequential steps, but engine state commit occurs atomically.

Finalize settlement: Pawn remains at intersection of Oncak #$V$ (final endpoint).

Pawn does NOT take an extra step onto an empty intersection.

Pawn does NOT return to pre-capture starting position.

Commit complete-group state update.

Dispatch state to MOD-10 for match end check, then to MOD-07 for mandatory same-$V$ re-evaluation.

15. Mandatory Capture Behaviour (MOD-07)

Module Details

Feature Name: Mandatory Same-Dice Re-evaluation Engine

Purpose: Enforces continuous mandatory capturing when legal + reachable target groups matching current $V$ remain accessible from the new endpoint.

Functional Processing

Immediately following complete group resolution and endpoint settlement at $(x_E, y_E)$:

Re-evaluate legal + reachable Capture Opportunities from new origin $(x_E, y_E)$ using the SAME active Dice Value $V$.

If $\ge 1$ legal + reachable opportunity exists:

Active player MUST capture again.

Player selects one group from available candidates.

Reroll is strictly DISABLED.

Loop back to MOD-06 (Capture Execution).

If 0 legal + reachable opportunities exist for current $V$:

Same-$V$ capture sequence is exhausted.

Transition state to MOD-08 (REROLL_REQUIRED).

16. Reroll Behaviour (MOD-08)

Module Details

Feature Name: Reroll Transition Controller

Purpose: Manages reroll eligibility and turn continuation.

Critical State Rule

A reroll is granted IF AND ONLY IF current $V$ has produced at least one successful capture group during the turn and now zero same-$V$ legal + reachable opportunities remain (CASE B).

Functional Processing

Transition state to REROLL_REQUIRED.

Disable board interactions; enable Dice Roll button for active player.

Player or AI rolls dice $\rightarrow$ new Dice Value $V_{\text{new}}$ resolved.

Evaluate legal + reachable opportunities for $V_{\text{new}}$:

If $\ge 1$ opportunity exists: Continue turn in WAITING_FOR_CAPTURE_SELECTION.

If 0 opportunities exist: Turn ends immediately (TURN_END).

No Limits: There is no maximum cap on captures or rerolls per turn.

17. Turn Completion Behaviour (MOD-09)

Module Details

Feature Name: Turn State Sequencer & Player Rotation

Purpose: Concludes active player turn and advances control to the next player.

Trigger Conditions

Turn ends if and only if a newly rolled Dice Value $V$ produces zero legal + reachable matching Capture Opportunities on the board (CASE A).

Functional Processing

Set currentDiceValue = null.

Clear candidate group highlights and route vectors.

Increment active player index cyclically:

$$\text{activePlayerIndex} = (\text{activePlayerIndex} + 1) \bmod P$$

Set turnPhase = WAITING_FOR_DICE_ROLL.

If new active player is AI, trigger MOD-11 automatically.

18. Match Completion & Result Behaviour (MOD-10)

Module Details

Feature Name: Match Auditor & Victory Resolver

Purpose: Monitors board state for completion and determines final match outcomes.

Sole Match End Trigger

Gameplay match ends IF AND ONLY IF $\text{remainingOncak} == 0$ (CASE C).

Functional Processing

Post-capture check: If $\text{remainingOncak} == 0$:

Immediately halt turn loops, disable rerolls, and transition state to MATCH_FINISHED.

Compare final scores among all $P$ players.

Winner Determination:

Single highest score $\rightarrow$ Declare highest scorer as WINNER.

Multiple players tied for highest score $\rightarrow$ Declare DRAW among tied players.

No Tie-Breakers: No secondary tie-breaker algorithms are invoked.

19. AI Functional Behaviour (MOD-11)

Module Details

Feature Name: Rule-Compliant AI Decision Interface

Purpose: Executes automated gameplay decisions for AI-controlled players.

Functional Constraints

AI receives the EXACT SAME legal action set as a human.

AI is subject to identical rules: line sliding, $\le 3$ segments, Pawn blocking, $(5,5)$ hard block, mandatory captures, and rerolls.

AI receives ZERO hidden exemptions, teleports, or special state mutations.

Decision Heuristic

When multiple legal actions exist, AI selection strategy is IMPLEMENTATION-DEFINED unless another authoritative non-gameplay document defines the heuristic.

Regardless of heuristic, AI MUST:

Choose strictly from the same legal action set available to a Human;

Obey mandatory same-$V$ capture;

Obey reroll restrictions;

Obey $\le 3$ segment rule;

Obey Pawn blocking;

Obey Central Logo hard block;

Obey exact $V$ and same-color group rules.

20. Local Multiplayer Behaviour (MOD-12)

Module Details

Feature Name: Local Hotseat Session Manager

Purpose: Governs local multi-player matches on a shared device.

Specifications

Supports $P \in \{2, 3, 4\}$ players.

Turn rotation is strictly cyclic: $P_1 \rightarrow P_2 \rightarrow (P_3) \rightarrow (P_4) \rightarrow P_1$.

No player elimination mechanics exist.

Non-active players cannot dispatch inputs during another player's turn.

21. Screen Functional Specification

21.1 Gameplay Screen UI Representation

The Gameplay Screen MUST reflect the canonical runtime state:

Board Grid: Visual $10 \times 10$ cell grid framing the $11 \times 11$ Intersection Layer.

Oncak Overlay: Renders Oncak tokens at integer intersection nodes $(x, y)$.

Central Logo: Prominent Sriwijaya logo rendered permanently at $(5, 5)$.

Pawn Display: Renders Pawn tokens on occupied intersections; displays "OFF_BOARD" indicator in player panel if not on board.

HUD Panel: Displays active player, scores, active $V$, turn phase, and action controls (Roll Dice button).

Candidate Highlights: Visual guides indicating legal + reachable capture targets.

22. Runtime State Model

  matchStatus: 'IDLE' | 'INITIALIZING' | 'ACTIVE' | 'MATCH_FINISHED';
  turnPhase: 
    | 'WAITING_FOR_DICE_ROLL'
    | 'DICE_RESOLVED'
    | 'EVALUATING_CAPTURE_OPPORTUNITIES'
    | 'WAITING_FOR_CAPTURE_SELECTION'
    | 'RESOLVING_CAPTURE_GROUP'
    | 'REEVALUATING_SAME_DICE'
    | 'REROLL_REQUIRED'
    | 'TURN_END';
  playerCount: 2 | 3 | 4;
  activePlayerIndex: number;
  remainingOncak: number; // Starts at 120
  currentDiceValue: number | null; // 1 to 6
  board: IntersectionNode[][]; // 11x11 grid
  players: PlayerState[];
  legalOpportunities: CaptureOpportunity[];
  selectedOpportunity: CaptureOpportunity | null;
}

interface IntersectionNode {
  x: number; // 0 to 10
  y: number; // 0 to 10
  isCentralLogo: boolean; // true for (5,5)
  oncak: OncakPiece | null;
  pawnOccupantId: string | null;
}

interface OncakPiece {
  id: string;
  color: 'BLACK' | 'WHITE';
}

interface PlayerState {
  id: string;
  name: string;
  controllerType: 'HUMAN' | 'AI';
  score: number;
  pawnStatus: 'OFF_BOARD' | 'ON_BOARD';
  pawnPosition: { x: number; y: number } | null;
}

interface CaptureOpportunity {
  id: string;
  oncakColor: 'BLACK' | 'WHITE';
  oncakCoordinates: { x: number; y: number }[]; // Exactly V coordinates
  route: { x: number; y: number }[]; // Validated path
  endpoint: { x: number; y: number };
}


23. Component Interaction

[ User UI / AI Input ]
          │
          ▼
[ Action Dispatcher ] ──► [ Rule Validator ]
                                │
                      ┌─────────┴─────────┐
                      │ (Valid)           │ (Invalid)
                      ▼                   ▼
              [ State Reducer ]   [ Error Handler / Reject ]
                      │
                      ├───────────────────┐
                      ▼                   ▼
               [ Game Store ]     [ Persistence Adapter ]
                      │
                      ▼
               [ UI Renderer ]


24. Persistence & Recovery Behaviour (MOD-13)

Module Details

Feature Name: State Persistence & Recovery Engine

Purpose: Serializes active match state to browser storage via the architecture-approved persistence adapter and enables seamless state recovery.

Storage Integration

Interacts with the persistence service layer (storage.ts or equivalent store adapter) defined by Document 04 architecture.

Persisted Fields

Exact authoritative state snapshot including board intersection states, players, remainingOncak, activePlayerIndex, currentDiceValue, turnPhase, mandatorySameVState, rerollRequiredState, and matchStatus.

Fault Recovery

Recovery MUST preserve sufficient authoritative state to resume exactly without silently resetting a legal mandatory-capture or reroll state.
If persistence storage contains invalid or corrupted JSON schema:

Catch storage exception;

Purge corrupted snapshot key;

Re-initialize clean state (IDLE);

Log warning ERR_STORAGE_CORRUPT.

25. Invalid Action & Error Behaviour (MOD-14)

The engine enforces strict rejection protocols for invalid actions. Default invalid gameplay action behavior: reject action $\rightarrow$ zero authoritative gameplay state mutation $\rightarrow$ retain correct phase. Invalid dice input MUST NOT automatically trigger a dice reroll.

Error Code

Trigger Condition

System Rejection Behavior

ERR_CENTRAL_LOGO_VIOLATION

Action targets, enters, or traverses $(5, 5)$.

Reject action. State unchanged. Highlight logo block.

ERR_PAWN_BLOCK_VIOLATION

Route passes through or lands on another Pawn.

Reject path selection. Prompt valid alternate route.

ERR_SEGMENT_LIMIT_EXCEEDED

Proposed movement requires $\ge 4$ segments.

Reject path. Pathfinding returns null.

ERR_DIAGONAL_MOVEMENT

Proposed path includes diagonal sliding.

Reject action. Enforce orthogonal movement.

ERR_GROUP_SIZE_MISMATCH

Target group size $\neq V$.

Reject capture selection.

ERR_MIXED_COLOR_GROUP

Selected group contains mixed colors.

Reject capture selection.

ERR_ILLEGAL_REROLL

Player attempts reroll while same-$V$ capture exists.

Disable reroll control. Force mandatory capture.

ERR_INACTIVE_PLAYER_INPUT

Input received from non-active player.

Ignore input completely.

ERR_FREE_PLACEMENT_ATTEMPT

Player attempts manual Pawn spawn without capture.

Reject action. Keep Pawn OFF_BOARD.

ERR_TELEPORTATION_ATTEMPT

Non-sliding or unpathable spatial move attempted.

Reject action. State unchanged.

ERR_PARTIAL_GROUP_ABANDONMENT

Action attempts to stop mid-group capture sequence.

Force complete group resolution before state commit.

ERR_PAWN_OCCUPIED_ENDPOINT

Target capture endpoint is occupied by a Pawn.

Reject path selection.

ERR_EARLY_MATCH_COMPLETION

Attempt to declare match end while $\text{remainingOncak} > 0$.

Reject state mutation. Maintain active game loop.

ERR_INVALID_DICE_STATE

Roll command dispatched out of phase or with invalid $V$.

Reject roll command. Do NOT auto-reroll.

26. Functional Acceptance Criteria

Functional Req ID

Module

Source 05 Rule

Source 06 Test ID

Expected Functional Outcome

Status

FAC-001

MOD-01

§2.1, §2.2

TC-BRD-001

Board initializes exactly 121 intersections ($11 \times 11$).

SPECIFIED

FAC-002

MOD-01

§3.1

TC-INIT-001

Exactly 120 Oncak initialized (60 Black, 60 White); $(5,5)$ empty.

SPECIFIED

FAC-003

MOD-01

§3.2

TC-DIST-001

Vertical consecutive same-color sequence max 6 enforced.

SPECIFIED

FAC-004

MOD-01

§3.2

TC-DIST-002

Diagonal consecutive same-color sequence max 6 enforced.

SPECIFIED

FAC-005

MOD-01

§3.2

TC-DIST-003

Horizontal sequences allowed to exceed 6 without rejection.

SPECIFIED

FAC-006

MOD-01

§2.3

TC-CENT-001

Central Logo $(5,5)$ hard block prevents entity placement.

SPECIFIED

FAC-007

MOD-01

§4.1

TC-PawnInit-001

All Pawns default to OFF_BOARD status at match start.

SPECIFIED

FAC-008

MOD-05

§4.2

TC-ENTRY-001

First capture executes valid OFF_BOARD to ON_BOARD entry.

SPECIFIED

FAC-009

MOD-05

§4.2

TC-ENTRY-002

OFF_BOARD entry permits board-wide selection (no perimeter rule).

SPECIFIED

FAC-010

MOD-02

§5.1

TC-DICE-001

Dice Value $V$ dictates exact capture quantity.

SPECIFIED

FAC-011

MOD-02

§5.1

TC-DICE-002

Dice Value $V$ does NOT restrict straight spatial movement distance.

SPECIFIED

FAC-012

MOD-03

§6.1

TC-GRP-001

Engine rejects candidate groups where size $\neq V$.

SPECIFIED

FAC-013

MOD-03

§6.1

TC-GRP-002

Engine rejects candidate groups containing mixed colors.

SPECIFIED

FAC-014

MOD-04

§7.1

TC-GEO-002

Diagonal Pawn movement is strictly rejected.

SPECIFIED

FAC-015

MOD-04

§7.2

TC-SEG-001, TC-SEG-002

Paths up to 3 segments accepted; $\ge 4$ segments rejected.

SPECIFIED

FAC-016

MOD-04

§7.3

TC-BLK-001, TC-BLK-003

Other Pawns block route traversal and jumping.

SPECIFIED

FAC-017

MOD-06

§8.1

TC-RES-001

Capture group resolves completely before global same-$V$ re-eval.

SPECIFIED

FAC-018

MOD-07

§8.3

TC-MAN-001

Mandatory capture prevents reroll while valid same-$V$ group exists.

SPECIFIED

FAC-019

MOD-08

§8.4

TC-RER-001

Same-$V$ exhaustion post-capture triggers REROLL_REQUIRED.

SPECIFIED

FAC-020

MOD-09

§8.5

TC-TRN-001

Newly rolled $V$ with 0 legal groups triggers immediate TURN_END.

SPECIFIED

FAC-021

MOD-10

§10.1

TC-MCH-001

Match ends immediately when remainingOncak == 0.

SPECIFIED

FAC-022

MOD-10

§10.2

TC-WIN-002

Equal top score results in DRAW without tie-breakers.

SPECIFIED

27. Rulebook / Test Traceability Matrix

Rulebook Section

Section Name

Primary Test Case IDs

Functional Module

Functional Requirement

§2.1

Spatial Grid Network

TC-BRD-001, TC-BRD-002, REG-002

MOD-01

FAC-001

§2.2

Intersections & Connectivity

TC-BRD-001, TC-BRD-003

MOD-01

FAC-001

§2.3

Central Logo Hard Block

TC-CENT-001 to TC-CENT-004, REG-008

MOD-01, MOD-04

FAC-006

§3.1

Oncak Quantity & Colors

TC-INIT-001, TC-INIT-002, REG-001, REG-014

MOD-01

FAC-002

§3.2

Distribution Constraints

TC-DIST-001 to TC-DIST-003

MOD-01

FAC-003, FAC-004, FAC-005

§4.1

Pawn Initial State

TC-PawnInit-001, TC-PawnInit-002, REG-003, REG-011

MOD-01

FAC-007

§4.2

OFF_BOARD Board Entry

TC-ENTRY-001 to TC-ENTRY-003, REG-004

MOD-05

FAC-008, FAC-009

§5.1

Dice Semantics & Mechanics

TC-DICE-001, TC-DICE-002, REG-005

MOD-02

FAC-010, FAC-011

§6.1

Capture Group Validation

TC-GRP-001, TC-GRP-002, REG-015

MOD-03

FAC-012, FAC-013

§7.1

Movement Directions

TC-GEO-001, TC-GEO-002, REG-007

MOD-04

FAC-014

§7.2

Segment Count Limits

TC-SEG-001, TC-SEG-002, REG-006

MOD-04

FAC-015

§7.3

Pawn Blocking Logic

TC-BLK-001 to TC-BLK-004

MOD-04

FAC-016

§8.1

Atomic Multi-Capture Step

TC-RES-001

MOD-06

FAC-017

§8.2

Endpoint Settlement

TC-END-001

MOD-06

FAC-017

§8.3

Mandatory Capture Loop

TC-MAN-001 to TC-MAN-004, TC-UNR-002, REG-009

MOD-07

FAC-018

§8.4

Reroll Conditions

TC-RER-001, TC-RER-002, TC-UNR-003, REG-010

MOD-08

FAC-019

§8.5

Turn Termination

TC-TRN-001, TC-ENTRY-003, TC-UNR-003

MOD-09

FAC-020

§9.1

Turn Order & Rotation

TC-ORD-001

MOD-09, MOD-12

FAC-020

§10.1

Match Termination

TC-MCH-001, TC-MCH-002, REG-013

MOD-10

FAC-021

§10.2

Victory & Draw Conditions

TC-WIN-001, TC-WIN-002, REG-012

MOD-10

FAC-022

§11.1

AI Compliance Parity

TC-AI-001

MOD-11

FAC-014, FAC-015, FAC-016

28. Edge Cases

28.1 Unreachable Candidate Groups

Scenario: Candidate groups of size $V$ exist on the board, but all paths require $\ge 4$ segments or are blocked by Pawns or $(5,5)$ (evaluated per TC-UNR-001).

Handling: MOD-04 filters out all unreachable groups. Evaluator returns 0 legal + reachable groups. Turn ends (TURN_END).

28.2 Single Color Exhaustion

Scenario: All 60 BLACK Oncak are captured, leaving only WHITE Oncak on the board (evaluated per TC-EDG-001).

Handling: Match continues normally. Rolls of $V$ evaluate remaining WHITE Oncak. Match ends only when remainingOncak == 0.

28.3 Dynamic Reachability Changes

Scenario: A group was unreachable from Pawn position $A$, but becomes reachable from new endpoint $B$ after completing a capture (evaluated per TC-MAN-003).

Handling: Re-evaluation from endpoint $B$ identifies the group as newly reachable and includes it in mandatory same-$V$ capture.

29. Developer Notes

Spatial Representation: Ensure internal grid data structure uses an $11 \times 11$ array indexed [0..10][0..10]. Do NOT map pawn coordinates to visual cell centers.

Pathfinding Performance: Pathfinding implementation must support efficient validation of routes with maximum three movement segments on the 11x11 intersection graph.

Immutability: Always apply state modifications through pure reducers or Zustand functional setters to preserve deterministic rollbacks and state persistence recovery.

30. Unresolved Functional Dependencies

Physical Dice Presentation Mechanics: 

$$REQUIRES DESIGN DECISION$$

 (Whether the Dice Value $V \in \{1, 2, 3, 4, 5, 6\}$ presentation UI includes 3D die rolling, 2D animation, or instant roll display).

AI Heuristic Evaluation Formulas: 

$$REQUIRES DESIGN DECISION$$

 (Exact heuristic weighting parameters for AI candidate selection beyond mandatory legal move enumeration and rule compliance).