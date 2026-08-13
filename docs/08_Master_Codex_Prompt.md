OFFICIAL MASTER CODEX PROMPT

Project Name: CUKI: The Kingdom of Sriwijaya

Document ID: 08_Master_Codex_Prompt.md

Version: 1.0

Status: REVIEWED / APPROVED FOR IMPLEMENTATION

Target Execution Agent: GitHub Codex / Automated Code Generation Systems

1. PURPOSE

This document is the Master Implementation Prompt governing all code generation, refactoring, file structuring, and architectural execution performed by GitHub Codex (or any automated code generation agent) for the project CUKI: The Kingdom of Sriwijaya.

Operational Mandate: Codex must treat this document as its primary directive. Every line of code generated must comply with the instructions, architectural boundaries, and design principles set forth herein.

Scope of Authority: Codex is authorized solely to implement the software system defined by the approved project documentation. Codex is explicitly prohibited from redesigning mechanics, inventing features, modifying visual themes, or altering business logic.

Target Outcome: A fully functional, fully tested, production-ready, client-side web application implementing the board game CUKI with strict determinism, flawless UI execution, and absolute fidelity to specification.

2. REPOSITORY CONTEXT

CUKI: The Kingdom of Sriwijaya is a digital, turn-based strategy board game inspired by historical Indonesian maritime commerce and tactical board game mechanics set during the Sriwijaya Empire era.

The application is built as a lightweight, high-performance, single-page application (SPA) executing entirely in the browser (client-side execution model). The digital adaptation supports single-player gameplay against rule-based AI opponents and pass-and-play local multiplayer (2 to 4 players).

3. SOURCE OF TRUTH

Codex must operate strictly within the bounds established by the following reference documents:

01_Game_Design_Bible.md — Core vision, thematic background, and gameplay philosophy.

02_Product_Requirements_Document.md — Functional feature sets, user journeys, and product boundaries.

03_Design_System.md — Color palettes, typography, UI components, layout grids, and visual assets.

04_Software_Architecture.md — Technical design, data models, state management, directory layout, and architectural patterns.

05_CUKI_Rulebook.md — Authoritative board rules, move validation algorithms, winning conditions, and turn sequences.

06_Game_Engine_Test_Cases.md — Deterministic test suites and edge-case verification specifications.

07_Functional_Specification.md — Detailed module contracts, interface specs, and state transitions.

Codex MUST read and adhere to all seven documents before generating or modifying any repository files.

4. CONFLICT RESOLUTION ORDER & AUTHORITY HIERARCHY

If a conflict or ambiguity arises between documents or within generated code requirements, Codex MUST resolve the conflict by adhering strictly to the following explicit authority domains (Rank 1 overrides all lower ranks):

GAMEPLAY AUTHORITY

Rank 1: 05_CUKI_Rulebook.md (Highest Gameplay Authority)

Rank 2: 06_Game_Engine_Test_Cases.md

Rank 3: 07_Functional_Specification.md

ARCHITECTURE AUTHORITY

Rank 4: 04_Software_Architecture.md

PRODUCT AUTHORITY

Rank 5: 02_Product_Requirements_Document.md

VISION / THEME AUTHORITY

Rank 6: 01_Game_Design_Bible.md

VISUAL AUTHORITY

Rank 7: 03_Design_System.md (Lowest Authority)

Conflict Execution Protocol

Rule: When resolving gameplay conflicts, 05_CUKI_Rulebook.md always overrides product requirements, vision documents, architecture assumptions, and visual assumptions.

Codex MUST NOT modify gameplay rules based on lower-level documents.

If a visual design requirement in the Design System conflicts with the Software Architecture state model, the Software Architecture governs.

Codex MUST NOT attempt to resolve ambiguities by inventing new rules. If an unresolvable contradiction occurs, Codex must stop execution and report the exact document conflict to the maintainer.

5. DEVELOPMENT PRINCIPLES

Codex must adhere to the following non-negotiable software engineering principles throughout the codebase:

Implement, Never Redesign: Implement the specifications exactly as written. Do not add "extra" features, extra screens, unsolicited animations, or alternative gameplay options.

Reuse Before Create: Always inspect the existing directory tree for existing utilities, UI primitives, and hooks before writing new code.

Absolute Determinism: The Core Game Engine (src/engine/) must operate purely and deterministically according to the model:


$$\text{newState} = f(\text{previousState}, \text{validatedAction}, \text{resolvedRandomInputs})$$

The Core Game Engine MUST NOT call random APIs (e.g., direct Math.random()), access UI state, access network state, or mutate global state.

Dice generation and random resolution must be external to the core engine state transition function and injected directly into the engine to support deterministic replay and automated testing.

Strict Immutability: Game states, board configurations, and state store transitions must be strictly immutable. Direct state mutations on existing objects are forbidden.

Modularity & Separation of Concerns: Keep core engine rules, state stores, view controllers, and presentation components strictly separated. UI components must never contain raw rule-checking math; they must delegate entirely to the engine.

Zero-Fluff Readability: Write clean, self-documenting TypeScript code. Avoid deep nesting, obscure shorthand, or undocumented trickery. Include clear JSDoc comments on all core engine functions.

6. REPOSITORY STRUCTURE

Codex must enforce and strictly maintain the directory structure specified in 04_Software_Architecture.md:

cuki-game/
├── .github/
│   └── workflows/
│       └── ci.yml
├── public/
│   ├── assets/
│   │   ├── audio/
│   │   ├── images/
│   │   └── icons/
│   └── favicon.ico
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── game/
│   │   ├── layout/
│   │   └── ui/
│   ├── engine/
│   │   ├── ai/
│   │   ├── board/
│   │   ├── rules/
│   │   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── engine/
│   ├── components/
│   └── integration/
├── .eslintrc.cjs
├── .prettierrc
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts


Codex MUST NOT create top-level directories outside of this architecture.

Files must be organized exclusively according to their functional layer (Engine, Components, Stores, Pages, Utils).

7. TECHNOLOGY STACK

Codex must use the exact technology stack approved below. No alternative libraries, frameworks, or utility packages may be installed or imported without explicit documentation authorization.

Core Framework: React 18+ (Functional Components & Hooks only)

Build Tool & Dev Server: Vite

Language: TypeScript 5+ (Strict Mode enabled)

Styling Framework: Tailwind CSS

State Management: Zustand

Client-Side Routing: React Router v6+

Animation Library: Framer Motion

Icon Library: Lucide React

Testing Framework: Vitest (Engine unit testing & integration testing)

8. IMPLEMENTATION WORKFLOW

Codex must follow a rigorous, step-by-step phased workflow when building or expanding the codebase. Codex must complete each step fully before moving to the next:

Step 1: Project & Environment Setup

Configure Vite, TypeScript configs, Tailwind CSS, global styles, and directory structure.

Step 2: Type Definitions & Domain Contracts

Define all TypeScript interfaces, types, enums, and constants representing pieces, board positions, moves, captures, turns, game configurations, and storage schemas in src/types/ and src/engine/types/.

Step 3: Core Game Engine Implementation

Implement pure deterministic board state generation, legal action generation and capture opportunity generation, move validation, capture evaluation, turn progression, and win/draw condition checks in src/engine/.

Step 4: Engine Unit & Test Case Suite Verification

Write and execute unit test cases in tests/engine/ mapped directly to 06_Game_Engine_Test_Cases.md. Ensure 100% test pass rate for all legal and illegal move scenarios.

Step 5: Zustand State Stores Construction

Implement state management stores (useGameStore, useUIStore, useSettingsStore) wrapping the core engine with immutable action handlers.

Step 6: UI Design System & Shared Components

Build low-level design primitives (Buttons, Cards, Modals, Badges, Tooltips) in src/components/ui/ complying with 03_Design_System.md.

Step 7: Board & Gameplay Visual Components

Construct interactive board views, piece renderers, move highlight overlays, player HUDs, turn banners, and action logs in src/components/game/.

Step 8: Rule-Based AI Engine

Implement rule-based deterministic AI action logic complying strictly with official Rulebook rules.

Step 9: Local Multiplayer & Game Modes

Configure pass-and-play turn switching routines and local session management for 2, 3, and 4 players.

Step 10: Persistence & Recovery Service

Build state serialization, persistent user settings, and auto-resume capabilities adhering to storage service implementation according to the storage abstraction defined in 04_Software_Architecture.md.

Step 11: Application Routing & Supporting Pages

Implement React Router configuration and pages (MainMenu, ModeSelect, GamePage, RulebookPage, SettingsPage, AchievementsPage).

Step 12: Visual Animations & Audio Feedback Integration

Incorporate Framer Motion board transitions, piece movement animations, UI feedback, and audio hook triggers.

Step 13: End-to-End Verification & Final Polish

Run full test suite, verify accessibility, validate responsive layout constraints, and confirm zero console warnings/errors.

9. GAMEPLAY IMPLEMENTATION RULES

Codex MUST adhere to the following non-negotiable gameplay implementation directives:

Rulebook Supremacy: The mechanics defined in 05_CUKI_Rulebook.md are absolute.

Authoritative Board State Model:

The visual layout is rendered as a 10x10 Cell grid.

The authoritative gameplay position model uses the 11x11 Intersection Layer.

Engine state MUST explicitly represent:

Intersection coordinate states;

Oncak states (and remaining target count);

Pawn positions as Intersection coordinates $(x, y)$ where $0 \le x, y \le 10$;

Central Logo Intersection (5,5) hard block restriction.

Codex MUST NOT attempt to implement Pawn gameplay or move validation using Cell center positions.

Canonical Turn Lifecycle:
Game turn execution MUST strictly follow the canonical functional sequence:


$$\text{TURN\_START} \rightarrow \text{DICE\_RESOLVED} \rightarrow \text{CAPTURE\_OPPORTUNITY\_ANALYSIS} \rightarrow \text{CAPTURE\_SELECTION} \rightarrow \text{COMPLETE\_CAPTURE\_GROUP\_RESOLUTION} \rightarrow \text{SAME\_DICE\_REEVALUATION} \rightarrow (\text{REROLL\_REQUIRED} \mid \text{TURN\_END}) \rightarrow \text{MATCH\_FINISHED}$$

Dice Value: Determines capture target quantity, not movement distance.

Complete Capture Group Resolution: Fully resolves before same-dice reevaluation occurs.

Same-Dice Exhaustion: Successfully completing a capture group with a given dice value exhausts that dice value and triggers mandatory reroll requirements if additional rolls remain.

Failed Dice Roll: Rolling a dice value with no valid capture moves available causes turn termination.

Final Oncak Capture: Capturing the final required Oncak triggers immediate match completion and victory determination.

Move Validation Pipeline:

Every move input MUST pass through the core validation engine before state updating.

Attempting an illegal move must result in action rejection and visual UI feedback without throwing unhandled exceptions.

10. UI IMPLEMENTATION RULES

Codex MUST adhere to the visual and layout constraints defined in 03_Design_System.md:

Exact Design Fidelity: Use specified Tailwind CSS color tokens, typography scales, shadows, border radii, and spacing variables.

Layout Integrity:

Maintain strict responsive breakpoints (Mobile, Tablet, Desktop).

Game board must fit completely within the viewport without forcing vertical or horizontal scrollbars during gameplay.

Render the visual 10x10 tile grid while accurately aligning Pawn pieces and highlights onto the 11x11 intersection nodes.

No Redesigning or Inventing Screens: Implement only screens explicitly described in the Product Requirements Document and Functional Specification.

Framer Motion Standard: Use smooth, hardware-accelerated CSS/Framer Motion transforms for piece movements, overlay transitions, and modal popups. Keep animations under 300ms to preserve tactical responsiveness.

Accessibility (a11y): Ensure proper ARIA roles, color contrast ratios, keyboard navigation support, and semantic HTML tag usage across all pages and modals.

11. STATE MANAGEMENT RULES

Codex MUST structure state management around Zustand following these strict guidelines:

Store Division:

useGameStore: Holds authoritative gameplay state containing intersection-based board state, Pawn states, Oncak states, turn lifecycle state, dice roll state, move/capture history, active players, and result state.

useUIStore: Holds non-persistent visual state (active modals, open menus, tooltip states, active tab views).

useSettingsStore: Holds user configuration options (audio volume, animation speed, theme preferences, player aliases).

Engine Decoupling: Stores wrap the pure game engine. Stores MUST NOT contain movement mathematics, capture evaluation algorithms, or rule validation logic.

Immutable Updates: Store setters must produce fresh object/array references using immutable updating patterns. Direct state mutation (e.g., state.intersections[y][x] = piece) is strictly forbidden.

Action Atomicity: Store actions must be atomic. A single action dispatch (e.g., executeCapture(action)) must perform move validation, board modification, capture resolution, and win checking synchronously within the engine layer.

12. PERSISTENCE & STORAGE RULES

Codex MUST enforce the following storage guidelines:

Storage Abstraction: Persistence implementation must strictly follow the storage service abstraction defined in 04_Software_Architecture.md.

Browser LocalStorage Guidelines (when selected by architecture):

Prefix all storage keys with cuki_v1_ (e.g., cuki_v1_game_session, cuki_v1_user_settings, cuki_v1_stats).

Perform strict schema validation on incoming data with defensive fallbacks to default states in case of corrupted or outdated JSON.

Active game sessions must automatically persist upon every valid action completion and be cleared upon game completion (victory/draw) or manual match termination.

No External Remote Storage: Do NOT introduce cloud synchronization, remote databases, Firebase, AWS S3, or external backend persistence APIs.

13. AI IMPLEMENTATION RULES

Codex MUST follow these constraints when implementing the AI player module:

Rule-Based Framework: Implement AI logic in src/engine/ai/. AI decision strategy and difficulty scaling are implementation-defined.

Absolute Legality & Parity: The AI engine operates under the exact same constraints as human players. The AI MUST:

Use the exact same legal action generator as Human players;

Never bypass Rulebook validation;

Never generate or execute illegal actions;

Obey mandatory capture rules;

Obey reroll restrictions;

Obey Central Logo restrictions;

Obey Pawn blocking rules;

Obey movement segment limits.

Decoupling Directive: No AI heuristic, tactical weight, or search algorithm may be treated as or converted into a gameplay rule. The AI implementation must remain fully replaceable without requiring changes to Core Game Engine interfaces.

Asynchronous Execution: AI decision calculations must execute asynchronously off the main render thread or via scheduled micro-tasks/web workers to prevent UI jank or frame freezing.

No ML / LLM API Dependencies: Do NOT call external machine learning APIs, OpenAI endpoints, or neural network libraries.

14. MULTIPLAYER RULES

Codex MUST limit multiplayer implementation strictly to local paradigms:

Supported Modes:

Single Player (Human vs AI)

Local Pass-and-Play (2, 3, or 4 Players on a single device)

Out-of-Scope Notice:

Online real-time multiplayer, WebSockets, Peer-to-Peer (WebRTC), matchmaking servers, and lobby systems are Future Scope.

Codex MUST NOT generate server code, socket connections, or remote backend infrastructure.

15. TESTING REQUIREMENTS

Codex MUST verify code validity against automated testing standards:

Engine Test Suite: Every core rule, movement pattern, capture condition, and victory scenario defined in 06_Game_Engine_Test_Cases.md must have a corresponding Vitest test file under tests/engine/.

Test-Driven Verification: Before marking an engine module complete, run tests to verify 100% passing status.

Zero Regression: Modifying game rules or board handlers must not break existing test cases.

Functional Specification Compliance: UI components and state store triggers must be verified against requirements in 07_Functional_Specification.md.

16. CODING STANDARDS

Codex MUST adhere to standard enterprise TypeScript clean code guidelines:

TypeScript Strictness: Enable strict mode ("strict": true in tsconfig.json). No usage of any or implicit type casting. Use explicit union types, interfaces, and generic bounds.

React Patterns: Use Functional Components exclusively. Class components are forbidden. Custom logic must be extracted into reusable custom hooks (src/hooks/).

Naming Conventions:

Components: PascalCase.tsx (e.g., GameBoard.tsx)

Utilities/Engine: camelCase.ts (e.g., moveValidator.ts)

Interfaces/Types: PascalCase with explicit domain names (e.g., GameState, IntersectionPosition)

Constants: UPPER_SNAKE_CASE (e.g., BOARD_INTERSECTIONS, MAX_PLAYERS)

Formatting & Quality: Standard ESLint and Prettier rules must be followed. Code must be cleanly formatted and imports grouped logically (external dependencies first, internal components second, types third).

17. DEVELOPER CONSTRAINTS

Codex MUST strictly refrain from committing any of the following unauthorized actions:

DO NOT redesign or alter game mechanics described in 05_CUKI_Rulebook.md.

DO NOT alter UI layouts, color tokens, or styles defined in 03_Design_System.md.

DO NOT introduce backend frameworks (Node/Express, NestJS, Python, Go, etc.).

DO NOT introduce database ORMs or database drivers (Prisma, PostgreSQL, MongoDB, etc.).

DO NOT introduce authentication providers (Auth0, Firebase Auth, OAuth, JWT engines).

DO NOT introduce cloud deployment scripts, Docker containers, or Kubernetes manifests unless explicitly instructed.

DO NOT create additional gamification systems (XP, leveling, loot boxes, external currencies) not specified in the PRD.

DO NOT leave placeholder code, dead functions, // TODO hacks, or pseudo-code in core files.

18. BUILD ORDER

Codex MUST follow this strict sequence when constructing the repository from scratch:

[Phase 1: Environment & Tooling]
  ├── Initialize Vite + React + TypeScript repository setup
  ├── Configure tailwind.config.js, postcss, and tsconfig
  └── Establish folder structure in /src and /tests

[Phase 2: Types & Engine Core]
  ├── Write type definitions (src/types and src/engine/types)
  ├── Implement 11x11 Intersection Board Data Structure & Coordinates
  ├── Implement Pure Deterministic Action & Validation Engine
  ├── Implement Capture & Board State Resolution Logic
  └── Implement Canonical Turn Lifecycle & Win/Draw Evaluation Logic

[Phase 3: Engine Verification]
  ├── Implement Vitest test suites (tests/engine/)
  └── Verify 100% compliance with 06_Game_Engine_Test_Cases.md

[Phase 4: State Management & Storage Abstraction]
  ├── Build useGameStore (Zustand engine wrapper)
  ├── Build useUIStore & useSettingsStore
  └── Implement persistence service adhering to storage abstraction in 04_Software_Architecture.md

[Phase 5: Design System & UI Primitives]
  ├── Build styling primitives (Buttons, Cards, Modals, Badges)
  └── Establish visual theme tokens and typography layout helpers

[Phase 6: Gameplay UI Component Suite]
  ├── Build Interactive GameBoard component (10x10 tiles with 11x11 nodes)
  ├── Build Piece components with animations
  ├── Build Player HUDs, Action Logs, Turn Indicators, and Dice Overlay
  └── Integrate interaction move handling

[Phase 7: Rule-Based AI Engine]
  ├── Implement rule-based AI move selector following Rulebook rules
  └── Connect AI execution loop to useGameStore turn transitions

[Phase 8: Pages & Navigation Setup]
  ├── Configure React Router
  ├── Build Main Menu, Mode Selection, and Settings pages
  ├── Build Game Page layout container
  └── Build Rulebook reference modal/page and Achievements page

[Phase 9: Audio & Animation Polish]
  ├── Integrate sound hooks for moves, captures, and victory
  ├── Add Framer Motion board and menu transition effects
  └── Validate responsive layout constraints across viewports

[Phase 10: Final Audit & Package Prep]
  ├── Execute full test suite
  ├── Run TypeScript compiler check (tsc --noEmit)
  ├── Run Linter & Formatter checks
  └── Validate output against Completion Checklist


19. COMPLETION CHECKLIST

Before marking any implementation task or phase complete, Codex MUST verify compliance against this checklist:

[ ] Game Design Bible (01_Game_Design_Bible.md)

Core vision, historical Sriwijaya theme, and game identity accurately reflected.

[ ] Product Requirements Document (02_Product_Requirements_Document.md)

All functional requirements, player modes, and feature scopes fully implemented.

[ ] Design System (03_Design_System.md)

Colors, typography, spacing, UI controls, and responsive layouts adhere 100% to design specifications.

[ ] Software Architecture (04_Software_Architecture.md)

Directory structure, layer separation, tech stack, storage abstraction, and state flow match architectural blueprints.

[ ] CUKI Rulebook (05_CUKI_Rulebook.md)

11x11 intersection grid, Pawn rules, Oncak rules, capture mechanics, canonical turn lifecycle, and victory conditions strictly executed without deviation.

[ ] Game Engine Test Cases (06_Game_Engine_Test_Cases.md)

All test cases written, run, and verified passing with zero failures.

[ ] Functional Specification (07_Functional_Specification.md)

All state transitions, interface contracts, store actions, and error handling routines satisfied.

[ ] Master Codex Prompt Compliance

Implementation strictly follows repository constraints, technology restrictions, explicit authority hierarchy, coding standards, and developer constraints.

[ ] Code Quality & Integrity

Strict TypeScript compilation succeeds with zero errors. Linter produces zero warnings. Zero console errors or unhandled promises during runtime execution.

20. FINAL INSTRUCTIONS

MANDATORY CODEX OPERATIONAL DIRECTIVE:

Codex MUST execute implementation tasks strictly in accordance with this document and the referenced source-of-truth documents (01 through 07).

If a documentation conflict or specification ambiguity occurs during code execution, STOP IMMEDIATELY.

Do not guess. Do not assume. Do not invent requirements.

Resolve ambiguities strictly according to the Conflict Resolution Order defined in Section 4. If the conflict cannot be resolved using the precedence hierarchy, halt execution and request explicit instructions from the repository maintainer.