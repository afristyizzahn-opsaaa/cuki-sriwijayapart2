GAME DESIGN BIBLE

CUKI: The Kingdom of Sriwijaya

Document Version: 2.1.0

Status: DESIGN LOCKED (REPOSITORY READY - VERSION 2.1 SPECIFICATION)

Target Platform: Web (Desktop & Mobile Responsive)

Target Engineering Sprint: 2-Day MVP Rapid Deployment

Authors/Roles: Lead Product Manager, Principal Game Designer, Senior UX Designer, Lead Technical Writer, Principal Software Architect

1. DOCUMENT GOVERNANCE & DESIGN LOCKS

To preserve brand identity, scope velocity, and user experience coherence, the following immutable design constraints are locked. No AI assistant, engineer, or designer may modify these core parameters without explicit architectural revision approval.

Summary of Immutable Design Locks

Design Lock ID

Scope

Mandatory Directives

DESIGN LOCK #1

UX Core Flow

Welcome Page (Guest Only) $\rightarrow$ Micro-Transition Gate Open (1–2s) $\rightarrow$ Homepage $\rightarrow$ Tutorial (1st Time Only) $\rightarrow$ Gameplay (Player vs AI) $\rightarrow$ Outcome Handling (Victory / Defeat Branch).

DESIGN LOCK #2

Homepage Preservation & Visual Identity

IMMUTABLE HOMEPAGE. Layout, King illustration, kingdom background, gold/brown luxury aesthetic, composition, and hero layout are final. Do NOT redesign or alter the homepage. All feature expansions occur on child screens.

DESIGN LOCK #3

Defeat & Recovery Loop

Defeat triggers the King dialogue ("You fought well.") $\rightarrow$ Royal Scroll $\rightarrow$ Mini Quiz $\rightarrow$ Correct Answer grants +1 Heart $\rightarrow$ Retry Match.

DESIGN LOCK #4

Treasures Visibility

"Treasures of Sriwijaya" is visible on the Homepage from the start. Unlocks dynamically as rewards are earned.

DESIGN LOCK #5

Economy System

Coins (Primary Currency), Hearts (Second Chance Tokens), Treasures (Inventory/Koleksi), and Achievements/Missions. XP IS STRICTLY EXCLUDED FROM MVP.

DESIGN LOCK #6

MVP Scope Boundaries

2-day rapid deployment scope strictly enforced. Guest mode only, no backend database authentication, static Peta Kerajaan, local storage state persistence.

DESIGN LOCK #7

Authentication (Guest Only)

MVP operates strictly on "Continue as Guest". Account login, social login, and database users are deferred to Future Scope.

DESIGN LOCK #8

Hearts Mechanic

Hearts act strictly as Second Chance Tokens (not health points). If a player loses and has $\ge 1$ Heart, they can instant-replay. If $0$ Hearts, they must complete the King's Royal Scroll + Quiz recovery flow to gain +1 Heart.

DESIGN LOCK #9

Peta Kerajaan (Static)

Peta Kerajaan is a purely Static Informational Page showcasing territory, landmarks, and brief historical context. No interactive questing, gating, or unlocking logic.

DESIGN LOCK #10

MVP Mission System

MVP contains exactly 4 hardcoded missions with fixed rewards. No procedural generation or dynamic daily resets.

2. RELATED DOCUMENTS

This document operates as the central game design specification within the engineering documentation suite. For implementation details, data models, and rule engine specifics, reference the following repository documents:

02_Product_Requirements_Document.md

03_Design_System.md

04_Software_Architecture.md

05_CUKI_Rulebook.md

06_Game_Engine_Test_Cases.md

07_Functional_Specification.md

08_Master_Codex_Prompt.md

3. USER EXPERIENCE & SCREEN FLOWS

3.1 Complete End-to-End User Journey

journey
    title Player Experience Journey (MVP Scope)
    section Onboarding
      Arrive at Gate: 5: Player
      Click "Continue as Guest": 5: Player
      Watch Gate Transition (1-2s): 4: Player
    section Hub & Learning
      Welcome by King of Sriwijaya: 5: Player
      Select "Mulai Bermain": 5: Player
      Complete First-Time Tutorial: 4: Player
    section Core Gameplay
      Play Cuki vs AI: 5: Player
    section Outcome - Victory Branch
      Win Match: 5: Player
      View Victory Screen & Earn Coins/Progress: 5: Player
      Redirect to Treasures of Sriwijaya: 5: Player
      Inspect Unlocked Item & Return Home: 5: Player
    section Outcome - Defeat Branch
      Lose Match: 2: Player
      Check Hearts Balance: 3: System
      Instant Play Again (If Heart > 0): 4: Player
      Trigger King's Encouragement (If Heart = 0): 4: Player
      Read Royal Scroll (30s Story): 4: Player
      Answer Mini Quiz Correctly: 5: Player
      Earn +1 Heart & Play Again: 5: Player


3.2 Screen Flow Diagram

graph TD
    A[Welcome Page\nOutside Gate] -->|Click Continue as Guest| B[Micro-Transition\nGate Opens 1-2s]
    B --> C[Kingdom Homepage\nDESIGN LOCKED]
    
    C -->|Mulai Bermain| D{Is First Time?}
    D -->|Yes| E[Tutorial Page]
    D -->|No| F[Cuki Gameplay\nPlayer vs AI]
    E -->|Complete Tutorial| F
    
    F -->|Match Finished| G{Outcome}
    
    G -->|Victory| H[Victory Screen\nEarn Coins + Mission Progress]
    H --> I[Auto Redirect: Treasures of Sriwijaya]
    I -->|Back Button| C
    
    G -->|Defeat| J{Has Heart > 0?}
    J -->|Yes| K[Instant Play Again\nConsume 1 Heart]
    K --> F
    
    J -->|No| L[King Dialogue\n'You fought well']
    L --> M[Royal Scroll\n30s Story]
    M --> N[Mini Quiz]
    N -->|Correct Answer| O[Receive +1 Heart]
    N -->|Incorrect Answer| P[Retry Quiz Option]
    P --> N
    O --> F
    
    C -->|Peta Kerajaan| Q[Static Kingdom Map]
    C -->|Tutorial| E
    C -->|Treasures| R[Treasures of Sriwijaya\nInventory & Achievements]
    C -->|Produk| S[Physical Board Game Product Page]
    
    Q -->|Back| C
    R -->|Back| C
    S -->|Back| C


3.3 Navigation Sitemap

flowchart TD
    subgraph Root
        W[Welcome Gate Screen]
    end
    
    subgraph Main Hub
        H[Kingdom Homepage - Locked]
    end
    
    subgraph Modules
        PK[Peta Kerajaan - Static]
        TUT[Tutorial - First Time / Replay]
        TR[Treasures of Sriwijaya - Inventory]
        PRD[Physical Product Page]
    end
    
    subgraph Gameplay Loop
        GAME[Cuki Board vs AI]
        VIC[Victory Modal & Reward Auto-Redirect]
        DEF[Defeat Handling Modal]
        RS[Royal Scroll & Mini Quiz Recovery]
    end
    
    W -->|Continue as Guest| H
    H --> PK
    H --> TUT
    H --> TR
    H --> PRD
    H --> GAME
    
    GAME --> VIC
    GAME --> DEF
    DEF --> RS
    RS -->|Quiz Pass| GAME
    VIC --> TR


4. GAMEPLAY & RULE ENGINE

4.1 Core Gameplay Summary

The operational game loop follows a sequential turn-based structure:

$$\text{Roll Dice} \longrightarrow \text{Find Matching Group} \longrightarrow \text{Move Pawn} \longrightarrow \text{Capture Oncak} \longrightarrow \text{Remove Captured Oncak} \longrightarrow \text{Repeat} \longrightarrow \text{End Turn}$$

Note: Detailed execution rules, movement constraints, and validation logic are defined in 05_CUKI_Rulebook.md.

4.2 Core Game Objects

The primary physical and digital game entities within the Cuki system consist of:

Board: The grid playing field upon which all pieces are placed, moved, and captured.

Oncak: Static neutral or target game pieces positioned on specific board coordinates available for capture.

Player Pawn: The active movable game piece controlled by a player (Human or AI) to navigate the grid and execute captures.

Dice: The random numeric or symbol generator determining valid move distances and matching rules per turn.

Empty Cell: Unoccupied coordinate spaces on the board grid eligible for pawn movement or landing.

Center Area: The inner focal zone of the board grid governing specific movement and scoring milestones.

4.3 Cuki Core Rules & AI Specification (MVP)

Game Type: Abstract strategy board game adapted from traditional Sumatran / Sriwijaya folk games.

Match Format: Player (Human) vs AI Opponent.

AI Difficulty (MVP): Deterministic rule-based heuristic engine (prioritizes captures $\rightarrow$ position control $\rightarrow$ random valid moves).

First-Time User Experience (FTUE): Triggered automatically on first click of "Mulai Bermain".

4.4 Gameplay Loop Diagram

graph LR
    SubGraph1[Start Match] --> PlayerTurn[Player Turn]
    PlayerTurn --> ValidateMove{Valid Move?}
    ValidateMove -->|No| PlayerTurn
    ValidateMove -->|Yes| BoardState[Update Board State]
    BoardState --> CheckWin1{Win / Lose?}
    CheckWin1 -->|Game Continues| AITurn[AI Turn Heuristic]
    AITurn --> CheckWin2{Win / Lose?}
    CheckWin2 -->|Game Continues| PlayerTurn
    
    CheckWin1 -->|Player Wins| Victory[Victory Branch]
    CheckWin2 -->|AI Wins| Defeat[Defeat Branch]


4.5 Recovery & Second-Chance Loop (Hearts Logic)

Hearts do NOT act as HP or energy bars that time-gate gameplay arbitrarily. They are strictly Second Chance Tokens.

stateDiagram-v2
    [*] --> InMatch
    InMatch --> MatchLost: AI Wins
    
    state MatchLost {
        [*] --> CheckHearts
        CheckHearts --> InstantRetry: Balance > 0
        CheckHearts --> RecoveryFlow: Balance == 0
        
        state InstantRetry {
            [*] --> ConsumeHeart: Hearts = Hearts - 1
            ConsumeHeart --> RestartGame
        }
        
        state RecoveryFlow {
            [*] --> KingDialogue: 'You fought well'
            KingDialogue --> ReadScroll: Show 30s Royal Scroll
            ReadScroll --> PresentQuiz: Render 1-Question Mini Quiz
            PresentQuiz --> QuizEvaluator
            QuizEvaluator --> EarnHeart: Correct Answer
            QuizEvaluator --> PresentQuiz: Incorrect Answer
            EarnHeart --> RestartGame: Hearts = Hearts + 1
        }
    }
    
    RestartGame --> InMatch


5. ECONOMY, MISSIONS & TREASURES

5.1 Currency & Item Taxonomy

classDiagram
    class PlayerInventory {
        +int coins
        +int hearts
        +List~String~ unlockedSkins
        +List~String~ unlockedBoardThemes
        +List~String~ unlockedBadges
        +List~String~ unlockedScrolls
        +List~String~ completedMissionIds
    }
    
    class CoinSystem {
        +Source: Match Victory (+50)
        +Source: Mission Completions (+20 / +50)
        +Use: Purchase Cosmetics in Treasures
        +Use: Purchase Extra Hearts
    }
    
    class HeartSystem {
        +Role: Second Chance Token
        +Source: Royal Scroll Mini Quiz (+1)
        +Source: Mission #3 (+1)
        +Source: Purchased via Coins
        +Use: Instant Replay on Defeat (-1)
    }
    
    class MissionSystem {
        +Mission 1: Finish Tutorial
        +Mission 2: Win First Match
        +Mission 3: Read First Royal Scroll
        +Mission 4: Answer First Quiz Correctly
    }

    PlayerInventory --|> CoinSystem
    PlayerInventory --|> HeartSystem
    PlayerInventory --|> MissionSystem


5.2 Hardcoded MVP Mission Register

The MVP contains exactly four static missions. No dynamic mission generation or daily resets exist in the MVP.

Mission ID

Title

Objective Criteria

Reward

Auto-Claim Behavior

MIS_01

Langkah Pertama

Complete the interactive Tutorial.

20 Coins

Instant deposit on tutorial completion screen.

MIS_02

Panglima Sriwijaya

Win 1 match against the AI.

50 Coins

Instant deposit on Victory modal.

MIS_03

Hikayat Kerajaan

Read the first Royal Scroll during recovery flow.

1 Heart

Instant deposit upon scroll completion.

MIS_04

Cendekiawan Istana

Answer the first Mini Quiz correctly.

Exclusive Piece Skin (SKIN_SRIWIJAYA_GOLD)

Item unlocked in Treasures of Sriwijaya.

5.3 Behavioral Reward Loop

flowchart LR
    A[Play Cuki Match] --> B{Match Outcome}
    B -->|Victory| C[+50 Coins]
    B -->|Defeat & No Hearts| D[Read Royal Scroll + Quiz]
    D -->|Pass| E[+1 Heart]
    
    C --> F[Progress Missions]
    E --> F
    
    F --> G{Mission Complete?}
    G -->|Yes| H[Claim Coins / Skins / Hearts]
    G -->|No| I[Update Treasures Inventory]
    H --> I
    
    I --> J[Player Inspects Unlocked Items in Treasures]
    J --> A


6. PAGE-BY-PAGE DETAILED SPECIFICATIONS

6.1 Welcome Page (Outside Gate)

Visual Atmosphere: Stone gates of the Sriwijaya palace, misty morning, heroic Sriwijaya motif.

UI Components:

Primary CTA: Continue as Guest button (prominent gold button with hover shimmer).

Subtext: "Masuk sebagai Tamu Kerajaan".

Behavior: Clicking Continue as Guest initializes local session storage and triggers the Micro-Transition.

6.2 Micro-Transition

Duration: 1.0 – 2.0 seconds.

Visual Sequence: Palace doors slide open smoothly accompanied by traditional ambient sound effects (gamelan stroke / royal gong).

Technical Implementation: CSS transform keyframe transition overlaid with an opacity fade to the Kingdom Homepage.

6.3 Kingdom Homepage (DESIGN LOCKED)

Visual Baseline: Approved reference layout. Rich gold, mahogany brown, royal Sriwijaya palette.

Hero Element: King of Sriwijaya visual avatar with speech bubble containing welcome greetings.

Navigation Grid (Cards):

🎮 Mulai Bermain (Primary CTA)

🗺 Peta Kerajaan

📖 Tutorial

🏆 Treasures of Sriwijaya

📦 Produk

6.4 Peta Kerajaan (Static Page)

Scope: Completely static informational presentation.

Content: High-resolution illustrated map of the historical Sriwijaya realm (Palembang, Malacca Strait, Southern Thailand trade routes).

Interactive Elements: Interactive map pins that display static popover cards on click/hover detailing historical facts (e.g., Prasasti Kedukan Bukit, Pelabuhan Palembang).

Constraints: No gating, no unlock levels, no quest nodes.

6.5 Treasures of Sriwijaya

Scope: Player inventory and collection showcase. Always accessible from Homepage.

Tabs / Categories:

Koleksi Bidak (Skins): Piece customization options (Default Wood, Royal Gold).

Misi Kerajaan (Missions): Progress cards for Missions 1–4.

Peti Harta (Currencies): Live counters for Coins ($C$) and Hearts ($H$).

Dokumen Sejarah (Scrolls): Unlocked historical text archives collected from recovery quizzes.

6.6 Produk (Physical Board Game Page)

Scope: Promotional showcase for the physical Cuki board game.

Content: High-quality image carousel, craft specifications, cultural preservation message, and pre-order / external marketplace link buttons.

7. SYSTEM ARCHITECTURE & DATA STRUCTURES

7.1 State Management Architecture

graph TD
    subgraph Browser Local Storage Persistence
        LS_AUTH[auth_type: guest]
        LS_COINS[balance_coins: integer]
        LS_HEARTS[balance_hearts: integer]
        LS_INV[unlocked_items: array]
        LS_MIS[mission_states: object]
        LS_FTUE[has_completed_tutorial: boolean]
    end
    
    subgraph Application State Engine (React Context / Pinia)
        AppState[Global App Store]
    end
    
    LS_AUTH --> AppState
    LS_COINS --> AppState
    LS_HEARTS --> AppState
    LS_INV --> AppState
    LS_MIS --> AppState
    LS_FTUE --> AppState
    
    AppState --> UI_Views[UI View Renderers]


7.2 Data Schema (JSON Spec for Local State Persistence)

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CukiPlayerState",
  "type": "object",
  "properties": {
    "user": {
      "type": "object",
      "properties": {
        "isGuest": { "type": "boolean", "default": true },
        "hasCompletedTutorial": { "type": "boolean", "default": false }
      },
      "required": ["isGuest", "hasCompletedTutorial"]
    },
    "wallet": {
      "type": "object",
      "properties": {
        "coins": { "type": "integer", "minimum": 0, "default": 0 },
        "hearts": { "type": "integer", "minimum": 0, "default": 1 }
      },
      "required": ["coins", "hearts"]
    },
    "inventory": {
      "type": "object",
      "properties": {
        "activePieceSkin": { "type": "string", "default": "SKIN_DEFAULT_WOOD" },
        "unlockedPieceSkins": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["SKIN_DEFAULT_WOOD"]
        },
        "unlockedScrolls": {
          "type": "array",
          "items": { "type": "string" },
          "default": []
        }
      },
      "required": ["activePieceSkin", "unlockedPieceSkins", "unlockedScrolls"]
    },
    "missions": {
      "type": "object",
      "properties": {
        "MIS_01": { "type": "boolean", "default": false },
        "MIS_02": { "type": "boolean", "default": false },
        "MIS_03": { "type": "boolean", "default": false },
        "MIS_04": { "type": "boolean", "default": false }
      },
      "required": ["MIS_01", "MIS_02", "MIS_03", "MIS_04"]
    }
  },
  "required": ["user", "wallet", "inventory", "missions"]
}


8. SCOPE BOUNDARIES: MVP vs FUTURE SCOPE

To ensure rapid, successful execution during a 2-day development cycle, scope boundaries are strictly defined.

Feature Area

In MVP Scope (2-Day Sprint)

Deferred to Future Scope

Authentication

Continue as Guest strictly (Local Browser Storage).

Full user registration, OAuth (Google/Apple), Cloud Database Sync.

Gameplay

Single Player vs Rule-based Heuristic AI.

Online Real-Time Multiplayer (WebSocket), Matchmaking.

Economy

Coins, Hearts (Second Chance Tokens), Static Purchases.

Real Money Purchases (IAP), Complex Shop Engine.

Leveling / XP

EXCLUDED COMPLETELY.

XP, Player Levels, Level Unlocks.

Kingdom Map

Static Informational Page with regional text snippets.

Interactive Campaign Map, Region Unlocks, Area Quests.

Missions

Exactly 4 Hardcoded Static Missions.

Dynamic Daily Missions, Weekly Challenges, Battle Pass.

Audio / FX

Basic web audio SFX (Gong, move click, win chime).

Full orchestral adaptive soundtrack, full voiceovers for the King.

9. INSTRUCTIONS FOR AI CODING ASSISTANTS (CODEX / GEMINI)

When writing or refactoring code based on this Game Design Bible, AI systems MUST obey the following directives:

Do NOT modify the Homepage layout or components. The structure of Homepage.tsx / Homepage.vue must adhere strictly to the visual baseline.

Do NOT introduce XP, Level, or Experience Point variables. If prompt contexts request leveling features, suppress them and maintain the Coins/Hearts/Treasures model.

Do NOT inject database calls or auth libraries. State must rely strictly on LocalStorage / Client Memory.

Ensure Hearts are treated as boolean/token checks on Defeat. Do not implement continuous timer-based heart regeneration. Hearts are earned via Mini Quiz recovery or purchases.

Maintain strictness on Mission IDs (MIS_01 through MIS_04).

10. DEVELOPER REFERENCES

All software architecture and front-end rule implementations must adhere strictly to the formal engine definitions and validation test suites provided in:

Rule Logic & State Transitions: 05_CUKI_Rulebook.md