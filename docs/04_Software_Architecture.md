Software Architecture Document (SAD)

CUKI: The Kingdom of Sriwijaya

Document Version: 1.1

Status: Approved / Repository Ready

Target Platform: Web (Responsive Single-Page Application)

Architecture Style: Client-Side Single Page Application (SPA)

Persistence Model: Browser LocalStorage

1. Document Information

Attribute

Details

Project Name

CUKI: The Kingdom of Sriwijaya

Document Title

Software Architecture Document (SAD)

Document Version

1.1

Author

Principal Software Architect & Technical Lead

Approved By

Product & Architecture Review Board

Target Audience

Frontend Engineers, AI Coding Assistants (Codex/Claude), Technical Writers

Last Updated

August 2026

2. Related Documents

This architecture document is designed to work in tandem with the project reference documents. All architectural decisions adhere strictly to the requirements and specifications defined across the documentation suite.

Document Name

Filename

Description

Game Design Bible

01_Game_Design_Bible.md

Core game design mechanics, Sriwijaya historical theme, rules, and player experience definitions.

Product Requirements Document

02_Product_Requirements_Document.md

Functional requirements, user stories, MVP scope, feature matrices, and target KPIs.

Design System

03_Design_System.md

Visual tokens, typography, color palettes, UI components, layout grids, and animation guidelines.

CUKI Rulebook

CUKI_Rulebook.md

Formal mathematical and logical rule specifications for traditional CUKI board navigation and mechanics.

3. Architecture Overview

3.1 Architecture Paradigm

CUKI: The Kingdom of Sriwijaya is built as a Frontend-Only, Client-Side Rendered (CSR) Single Page Application (SPA). There are no external backend APIs, databases, or microservices required for the MVP release.

+-----------------------------------------------------------------------+
|                             BROWSER CLIENT                            |
|                                                                       |
|  +------------------+   +-------------------+   +------------------+  |
|  |   UI View Layer  | < | State Management  | < |   Game Engine    |  |
|  |  (React/Tailwind)|   | (Zustand Stores)  |   | (Pure TS Logic)  |  |
|  +------------------+   +-------------------+   +------------------+  |
|                                   |                                   |
|                                   v                                   |
|                         +-------------------+                         |
|                         |  Local Persistence|                         |
|                         |  (LocalStorage)   |                         |
|                         +-------------------+                         |
+-----------------------------------------------------------------------+


Key principles of this architecture:

Zero-Backend Infrastructure: All logic—including dice rolls, group matching, pawn validation, Oncak captures, mission tracking, historical scroll unlocks, and rule-based AI decisions—executes directly within the client browser runtime.

Deterministic State Engine: CUKI gameplay mechanics are isolated into a pure TypeScript engine operating independently of the React view layer, rendering gameplay deterministic, testable, and robust.

Client-Side Persistence: Guest session state, Sriwijaya Gold balance, inventory skins, missions, achievements, historical scrolls, and active game progress are serialized and persisted in browser LocalStorage.

Modular Architecture: The codebase follows a domain-driven layout (/features, /game, /store), ensuring clean boundaries between visual layout components, business logic, and local state.

Future Backend Extensibility: Persistence and game engine interactions are decoupled via a Service Layer facade (/services/storage.ts), enabling future integration with remote persistence or WebSockets multiplayer without altering core engine contracts.

4. Technology Stack

Layer / Role

Recommended Technology

Target Version

Selection Rationale

Core Framework

React

^18.3.0

Declarative UI rendering, robust hook ecosystem, and optimal component lifecycle control for interactive board games.

Build Tooling

Vite

^5.4.0

High-speed Hot Module Replacement (HMR), optimized production bundling, native ES module support, and lightweight footprint.

Language

TypeScript

^5.5.0

Strict type safety, explicit interfaces for board state, compile-time validation, and optimized Codex/AI code completion.

CSS Framework

Tailwind CSS

^3.4.0

Utility-first styling, direct mapping to 03_Design_System.md design tokens, zero runtime CSS overhead.

Routing

React Router

^6.26.0

Declarative client-side routing, route protection, and clean page boundary management.

State Management

Zustand

^4.5.0

Lightweight state engine, zero boilerplate, reactive state selection, built-in persistence middleware, and seamless integration between React and pure TS engine modules.

Animation Engine

Framer Motion

^11.3.0

Hardware-accelerated transitions, declarative layout animations, fluid pawn movements, and modal transitions.

Iconography

Lucide React

^0.420.0

High-performance, customizable, accessible SVG iconography matching Sriwijayan UI standards.

5. Repository Structure

The project follows a standard, domain-focused React/TypeScript repository layout:

cuki-sriwijaya/
├── docs/                      # Architectural & product design documentation
│   ├── 01_Game_Design_Bible.md
│   ├── 02_Product_Requirements_Document.md
│   ├── 03_Design_System.md
│   └── 04_Software_Architecture.md
├── public/                    # Static public assets (favicons, audio clips, manifest)
│   ├── audio/
│   ├── favicon.ico
│   └── manifest.json
├── src/                       # Application source code
│   ├── assets/                # Visual assets (illustrations, background patterns, SVG tokens)
│   │   ├── images/
│   │   ├── icons/
│   │   └── textures/
│   ├── components/            # Reusable UI system components (Atoms & Molecules)
│   │   ├── ui/                # Base primitives (Button, Card, Modal, Badge, Toast, Drawer)
│   │   ├── layout/            # Layout shells (Header, Navigation, AppLayout, PageContainer)
│   │   └── feedback/          # Loading overlays, empty states, error boundaries
│   ├── features/              # Domain-specific feature modules
│   │   ├── homepage/          # Main Landing, Kingdom Banner, Quick Play trigger
│   │   ├── game-board/        # Main Interactive Gameplay components (Board, Cell, Pawn, Dice)
│   │   ├── treasures/         # Treasures of Sriwijaya hub (Inventory, Missions, Achievements, Scrolls)
│   │   └── settings/          # Sound, Display, Language, and Reset controls
│   ├── pages/                 # Route-level page entry points
│   │   ├── HomePage.tsx
│   │   ├── GamePage.tsx
│   │   ├── TreasuresPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── TutorialPage.tsx
│   ├── game/                  # Decoupled Pure JS/TS Game Engine
│   │   ├── engine.ts          # Core gameplay loop, turn processor, & win evaluator
│   │   ├── rules.ts           # CUKI movement, group matching, & Oncak capture validation
│   │   ├── board.ts           # Board grid generator & cell coordinate mapping
│   │   ├── ai.ts              # Deterministic Rule-Based Bot AI
│   │   └── state.ts           # Board state initialization & clone helpers
│   ├── store/                 # Zustand global application state stores
│   │   ├── index.ts           # Store barrel export
│   │   ├── useUserStore.ts
│   │   ├── useWalletStore.ts
│   │   ├── useInventoryStore.ts
│   │   ├── useMissionsStore.ts
│   │   ├── useAchievementsStore.ts
│   │   ├── useScrollsStore.ts
│   │   ├── useSettingsStore.ts
│   │   └── useGameStore.ts
│   ├── hooks/                 # Reusable custom React hooks
│   │   ├── useAudio.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   └── useGameState.ts
│   ├── services/              # Client services (Persistence, Audio)
│   │   ├── storage.ts         # LocalStorage wrapper with schema migration
│   │   └── audio.ts           # Web Audio API / Audio manager
│   ├── utils/                 # Utilities & mathematical helpers
│   │   ├── formatters.ts      # Text and number formatting
│   │   ├── math.ts            # Board grid math and dice utilities
│   │   └── validators.ts      # Data sanity validators
│   ├── types/                 # Global TypeScript type definitions
│   │   ├── game.ts            # Game engine interfaces (Board, Pawn, Oncak, Move, Player)
│   │   ├── user.ts            # User profile and session types
│   │   ├── store.ts           # Store contracts
│   │   └── economy.ts         # Currency, items, missions, achievements, scrolls
│   ├── constants/             # Global standard constants
│   │   ├── gameRules.ts       # Board dimensions, group definitions, winning thresholds
│   │   ├── designTokens.ts    # Color codes, typography, layout dimensions
│   │   └── initialData.ts     # Initial seed state for storage
│   ├── App.tsx                # Main app component with routing
│   ├── main.tsx               # DOM entry point
│   └── index.css              # Tailwind base imports & custom styles
├── index.html                 # HTML main template
├── package.json               # Package configuration
├── tsconfig.json              # Strict TypeScript config
├── vite.config.ts             # Vite configuration
└── tailwind.config.js         # Tailwind theme configuration


6. Application Architecture

The application adopts a Layered Architecture Pattern operating strictly within the client browser runtime.

graph TD
    subgraph View Layer
        Pages[Page Entry Points - React Router]
        UIComponents[UI Primitives - Design System]
        GameComponents[Game Board, Cells, Pawn, Dice, HUD]
    end

    subgraph State Layer
        ZustandStores[Zustand Stores - User, Wallet, Inventory, Missions, Game, etc.]
    end

    subgraph Domain & Logic Layer
        GameEngine[Game Engine Module]
        RuleEngine[CUKI Rule Evaluator]
        BotAI[Rule-Based AI Engine]
    end

    subgraph Persistence Layer
        StorageService[Storage Service Facade]
        BrowserLS[(Browser LocalStorage)]
    end

    Pages --> UIComponents
    Pages --> GameComponents
    GameComponents --> ZustandStores
    UIComponents --> ZustandStores
    ZustandStores --> GameEngine
    GameEngine --> RuleEngine
    GameEngine --> BotAI
    ZustandStores --> StorageService
    StorageService --> BrowserLS


Layer Responsibilities

View Layer (/pages, /components, /features): Pure React components that render data from Zustand stores and dispatch user interactions.

State Management Layer (/store): Acts as the reactive bridge between UI events and domain logic, triggering state updates and persistence sync.

Domain & Game Engine Layer (/game): Pure TypeScript functions handling CUKI dice rules, pawn matching, path validation, Oncak captures, victory checks, and Bot decisions.

Persistence Layer (/services/storage.ts): Handles serialization, deserialization, schema migration, and fallback error recovery with LocalStorage.

7. Routing Architecture

Routing is managed by React Router v6. In alignment with the Product Requirements Document, feature modules like Inventory, Missions, Achievements, and Historical Scrolls reside within the Treasures of Sriwijaya hub (/treasures).

Route Path

Associated Page Component

Access Guard

Primary Description

/

HomePage.tsx

Public

Kingdom entry portal, news, quick play launch, and main navigation hub.

/game

GamePage.tsx

Public / Resume

Active interactive CUKI game board viewport (Vs AI / Local Player).

/treasures

TreasuresPage.tsx

Public

Sriwijaya Treasures hub: Inventory skins, Daily Missions, Achievements, and Unlocked Historical Scrolls.

/settings

SettingsPage.tsx

Public

Audio preferences, display settings, reset state, and credits.

/tutorial

TutorialPage.tsx

Public

How to play CUKI, rule walkthrough, and historical background.

*

NotFoundPage.tsx

Public

Fallback route redirecting to /.

8. Component Architecture

8.1 Base UI System Primitives (/components/ui)

Button.tsx: Standard button supporting primary (Sriwijaya Gold), secondary (Terracotta), and neutral bronze styles.

Card.tsx: Parchment/stone styled container card with decorative gold borders.

Modal.tsx: Accessible overlay for game dialogs, Pause menu, and Victory summary.

Badge.tsx: Indicator for status, player turn, or reward currency.

Toast.tsx: Non-intrusive notification popup for system feedback (e.g., "Mission Complete").

8.2 Game Domain Components (/features/game-board)

GameBoard.tsx: Main 2D CUKI board layout component managing grid alignment, background texture, and responsive rendering.

BoardCell.tsx: Individual grid cell displaying group styling, coordinate markers, and cell occupation state.

Pawn.tsx: Animated player pawn component utilizing Framer Motion for moving across board cells.

Dice.tsx: Interactive/animated CUKI dice component supporting spin/roll trigger and result display.

HUD.tsx: Top/bottom status bar showing active players, captured Oncak score, avatar, and active turn banner.

TurnIndicator.tsx: Visual notification bar displaying whose turn is currently active (Player vs Bot / Player 1 vs Player 2).

VictoryModal.tsx: End-of-game overlay displaying match results, captured Oncak totals, Sriwijaya Gold earned, and scroll unlock notifications.

PauseModal.tsx: In-game pause menu with resume, restart, settings, and forfeit options.

9. Game Engine Architecture

The CUKI Game Engine is stateless, deterministic, and isolated from React. It rigorously implements traditional CUKI rules without adding unverified board mechanics or special zones.

9.1 Gameplay Flow

sequenceDiagram
    autonumber
    actor Player
    participant UI as React UI (Board/Dice)
    participant Store as Game Store
    participant Engine as Game Engine
    participant Rules as Rule Evaluator

    Player->>UI: Action: Roll Dice
    UI->>Store: rollDice()
    Store->>Engine: executeDiceRoll()
    Engine-->>Store: returns diceValue
    Store->>Engine: getValidMoves(boardState, player, diceValue)
    Engine->>Rules: findMatchingGroup(diceValue) & validateMoves()
    Rules-->>Engine: returns validTargetCells[]
    Engine-->>Store: update validMoves[]
    Store-->>UI: Render highlighted pawns & valid cells

    Player->>UI: Select Pawn & Target Cell
    UI->>Store: executeMove(pawnId, targetCell)
    Store->>Engine: processMove(boardState, pawnId, targetCell)
    Engine->>Rules: checkOncakCapture(targetCell)
    Rules-->>Engine: captureResult (Oncak captured / removed)
    Engine->>Rules: evaluateWinCondition(boardState)
    Rules-->>Engine: returns updatedBoardState & winnerState
    Engine-->>Store: commit new game state
    Store-->>UI: Render pawn motion & remove captured Oncak

    alt Winner Found
        Store-->>UI: Show Victory Modal & Grant Rewards
    else Next Turn
        Store->>Store: switchTurn()
    end


9.2 Core Engine Sequence Steps

Roll Dice: Active player triggers dice roll to get diceValue.

Find Matching Group: System identifies cells matching the rolled value according to CUKI board rulebook.

Validate Movement: Rule engine evaluates legal pawn move trajectories based on matching cell groups.

Move Pawn: Selected pawn moves to target validated cell.

Capture Oncak: If target cell contains opposing target piece (Oncak), capture logic triggers.

Remove Oncak: Captured Oncak is removed from active board state and added to player score.

Update Board: Board grid data structure updates piece positions.

Check Winner: Evaluates whether player meets winning threshold (all target Oncak captured or opponent eliminated).

Next Turn: Advances turn to next player or triggers Bot turn.

10. State Management

Application state is structured into clean Zustand slices residing in /src/store.

                    +-----------------------+
                    |    Unified App State  |
                    +-----------------------+
                                |
  +---------+---------+---------+---------+---------+---------+
  |         |         |         |         |         |         |
User     Wallet   Inventory Missions Achievements Scrolls Settings Game
Store    Store      Store     Store     Store     Store   Store  Store


10.1 Store Slice Definitions

UserStore (useUserStore.ts):

State: guestId, username, avatarId, title, createdAt.

Actions: updateProfile(), setAvatar().

WalletStore (useWalletStore.ts):

State: coins (Sriwijaya Gold), transactionHistory.

Actions: addGold(), deductGold().

InventoryStore (useInventoryStore.ts):

State: ownedPawnSkins[], equippedPawnSkin, ownedBoardThemes[], equippedBoardTheme.

Actions: unlockItem(), equipPawnSkin(), equipBoardTheme().

MissionsStore (useMissionsStore.ts):

State: dailyMissions[], lastResetTimestamp.

Actions: updateMissionProgress(), claimMissionReward(), checkAndResetDailies().

AchievementsStore (useAchievementsStore.ts):

State: achievementsList[], unlockedCount.

Actions: checkAchievements(), claimAchievement().

ScrollsStore (useScrollsStore.ts):

State: historicalScrolls[] (Kedukan Bukit, Telaga Batu, Kota Kapur, etc.).

Actions: unlockScroll(), readScroll().

SettingsStore (useSettingsStore.ts):

State: bgmVolume, sfxVolume, isMuted, highContrastMode, language.

Actions: setVolume(), toggleMute(), resetAllData().

### GameStore (`useGameStore.ts`)

**State:**
- `gameMode: 'VS_AI' | 'LOCAL_MULTIPLAYER'`
- `players: Player[]`
- `currentPlayerIndex: number`
- `diceValue: number | null`
- `boardState: BoardState`
- `selectedPawn: string | null`
- `validMoves: Move[]`
- `capturedOncak: Record<string, number>`
- `winner: string | 'draw' | null`
- `matchStatus: 'IDLE' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED'`

**Actions:**
- `startMatch()`
- `rollDice()`
- `selectPawn()`
- `movePawn()`
- `endTurn()`
- `resetMatch()`
- `pauseMatch()`

11. Local Storage Schema

All persistent application data is stored under the primary LocalStorage key: cuki_sriwijaya_state_v1.

11.1 JSON Persistence Structure

{
  "version": "1.1.0",
  "lastSavedAt": "2026-08-07T12:00:00.000Z",
  "guestSession": {
    "guestId": "guest_sriwijaya_1082",
    "username": "Datu Kadatuan",
    "avatarId": "avatar_default",
    "title": "Datu of Musi"
  },
  "wallet": {
    "coins": 1250
  },
  "inventory": {
    "ownedPawnSkins": ["skin_default", "skin_gold_sriwijaya"],
    "equippedPawnSkin": "skin_gold_sriwijaya",
    "ownedBoardThemes": ["theme_classic_parchment"],
    "equippedBoardTheme": "theme_classic_parchment"
  },
  "missions": {
    "lastDailyReset": "2026-08-07T00:00:00.000Z",
    "dailyMissions": [
      {
        "id": "mission_01",
        "title": "Play 1 CUKI Match",
        "target": 1,
        "current": 1,
        "rewardGold": 100,
        "isClaimed": false
      }
    ]
  },
  "achievements": [
    {
      "id": "ach_first_win",
      "title": "First Victory",
      "isUnlocked": true,
      "unlockedAt": "2026-08-07T10:30:00.000Z"
    }
  ],
  "historicalScrolls": [
    {
      "id": "scroll_kedukan_bukit",
      "title": "Kedukan Bukit Inscription (682 AD)",
      "isUnlocked": true,
      "unlockedAt": "2026-08-07T10:30:00.000Z"
    }
  ],
  "settings": {
    "bgmVolume": 0.8,
    "sfxVolume": 1.0,
    "isMuted": false,
    "highContrastMode": false,
    "language": "id"
  },
  "gameProgress": {
    "hasActiveSavedMatch": false,
    "savedMatchState": null
  }
}


11.2 Storage Fault Tolerance

Initialization Check: Parses JSON on launch and merges with fallback schema defaults (initialData.ts).

Corruption Safeguard: If parsing fails, a backup is created (cuki_sriwijaya_corrupt_bak), and standard clean state is safely initialized.

12. Data Flow

Data flows through the application in a strict Unidirectional Data Flow:

[ User Action ]
       │
       ▼
[ Game Engine / Rule Evaluator ]
       │
       ▼
[ Rules Validation ]
       │
       ▼
[ State Update (Zustand) ]
       │
       ├───► [ UI Re-rendering (React / Framer Motion) ]
       │
       └───► [ Local Storage Sync (Persistence Service) ]


User Action: User interacts with UI (e.g., taps Dice or selects Pawn).

Game Engine Evaluation: Input is passed directly to pure rule functions (/game/rules.ts).

Validation: Engine checks move legality against CUKI rulebook.

State Update: Store receives validated result and updates Zustand state immutably.

UI Rendering: React components re-render automatically.

Local Storage Sync: State change triggers throttled update to LocalStorage.

13. AI Architecture

The single-player mode features a Rule-Based Bot AI Engine (/game/ai.ts) executing locally without external API calls. The AI strictly follows official CUKI rulebook mechanics.

graph TD
    A[AI Turn Triggered] --> B[Read Current Board State]
    B --> C[Read Dice Result]
    C --> D[Find Matching Groups]
    D --> E[Validate Legal Pawn Moves]
    E --> F{Capture Oncak Available?}
    F -- Yes --> G[Select Capture Move - Aggressive Strategy]
    F -- No --> H[Evaluate Best Tactical Position Move]
    G --> I[Execute Move & Capture Oncak]
    H --> I
    I --> J[End Turn]


13.1 AI Decision Flow

Read Board: Evaluates current placement of all active pawns and Oncak.

Read Dice Result: Takes current diceValue produced for the turn.

Find Matching Groups: Identifies valid board groups matching diceValue.

Validate Legal Moves: Generates list of all legal moves available for AI pawns.

Evaluate Best Move: Priority is given to capturing enemy Oncak pieces. If no capture is possible, evaluates optimal positional placement.

Capture Oncak / Execute Move: AI selects chosen move and dispatches execution event.

End Turn: Passes turn back to human player.

14. Performance Strategy

Route-Based Lazy Loading: Route pages (/pages/*) are code-split using React.lazy() and React.Suspense to ensure lightweight initial loads.

Memoization: Strategic use of React.memo, useMemo, and useCallback on GameBoard and BoardCell components to avoid re-rendering untouched cells during pawn movement.

Component Reuse: Base UI components (Button, Card, Modal) are modular and shared across all pages.

Responsive Board Rendering: Board grid scales dynamically using CSS Grid/Flexbox with standard aspect-ratio constraints to ensure crisp layout across desktop and mobile browsers.

Animation Optimization: Framer Motion animations strictly utilize hardware-accelerated properties (transform, opacity) to guarantee fluid 60fps pawn transitions.

15. Coding Standards

15.1 React & Component Guidelines

Write 100% Functional Components with React Hooks. Class components are strictly prohibited.

UI components in /components/ui must remain pure display primitives without direct domain engine logic dependencies.

15.2 TypeScript Standards

Enable strict: true in tsconfig.json.

Type all function arguments, parameters, and return types explicitly (noImplicitAny).

Interfaces (interface) are used for domain models and component props; type aliases (type) are used for union parameters.

15.3 Naming Conventions

React Components / Pages: PascalCase (e.g., GameBoard.tsx, TreasuresPage.tsx).

Hooks: camelCase with use prefix (e.g., useGameState.ts).

Utilities / Engine Files: camelCase (e.g., engine.ts, rules.ts).

Constants: SCREAMING_SNAKE_CASE (e.g., MAX_ONCAK_COUNT, DEFAULT_DICE_RANGE).

Types / Interfaces: PascalCase (e.g., BoardState, PawnDetails).

16. Developer Rules

STRICT COMPLIANCE REQUIRED FOR HUMAN DEVELOPERS AND AI AGENTS (CODEX)

Zero External Backend Calls: Do not insert fetch, axios, or WebSocket calls targeting external servers. All operations must run locally.

Strict Rule Adherence: Do not alter traditional CUKI board rules, turn logic, or winning conditions.

Design Token Compliance: Do not use arbitrary hex colors or hardcoded styling values. All styling must adhere to tokens defined in 03_Design_System.md.

Immutable State Updates: Never mutate Zustand state directly. Always use functional immutable setters.

Decoupled Game Engine: UI components must never compute game moves directly; all move evaluations must be processed through /game/rules.ts and /game/engine.ts.

17. Conflict Resolution

When discrepancies or conflicting requirements arise during development, technical implementation decisions MUST adhere to the following hierarchy of authority:

01_Game_Design_Bible.md (Highest Authority - Core Game Design & Historical Context)

02_Product_Requirements_Document.md (Functional Scope & MVP Boundaries)

04_Software_Architecture.md (Technical Implementation & State Structures)

05_CUKI_Rulebook.md (Board Mechanics & Mathematical Specifications)

Game Engine Test Cases (Engine Verification Specs)

03_Design_System.md (Visual Tokens & Component Layouts)

Functional Specification

Developer Assumption (Lowest Authority - Must be documented and submitted for formal approval)
