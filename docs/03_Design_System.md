CUKI Design System

Version: 1.1

Project: CUKI Interactive Cultural Experience

Status: Approved Specification (Repository Ready)

Document Information & Related Documents

Document Meta

Title: CUKI Design System & UI Specifications

Version: 1.1

Status: Approved Specification

Owner: CUKI Product & Design Team

Related Documents

This Design System operates as an integral part of the CUKI Software Product Documentation Suite. Developers and AI agents must reference these accompanying specifications:

01_Game_Design_Bible.md

02_Product_Requirements_Document.md

04_Software_Architecture.md

05_CUKI_Rulebook.md

06_Game_Engine_Test_Cases.md

07_Functional_Specification.md

08_Master_Codex_Prompt.md

Chapter 1: Brand Philosophy

Vision

CUKI is an interactive cultural experience that transforms learning history into an adventure.

Experience Statement

Players should never feel that they are opening an educational website.

Instead, they should feel like they are entering the Kingdom of Sriwijaya.

Emotional Goals

Design decisions must trigger specific player emotions during key journey touchpoints:

Moment

Target Emotion

UX / UI Context

Website Open

Curiosity

Mysterious ambient visual & audio cues

Gate Opens

Excitement

Smooth, grand entrance animation

Meet the King

Welcome

Warm dialog UI and respectful visual hierarchy

Tutorial

Confidence

Clear, non-intrusive micro-interactions

Win

Pride

Grand visual triumph & sound effect

Lose

Encouraged

Supportive feedback, quick retry flow

Royal Scroll

Curiosity

Tactile, parchment-like UI reveal

Treasure

Achievement

Tangible reward presentation

Chapter 2: Design Principles

Immersion before Information

Player harus merasa masuk ke lingkungan kerajaan terlebih dahulu sebelum membaca teks/informasi.

Learning should feel like progression

Pembelajaran disajikan sebagai level/pencapaian, bukan tugas sekolah atau modul materi kaku.

Every interaction should have purpose

Tidak ada elemen UI, tombol, atau klik yang sia-sia tanpa feedback visual/audio.

Movement should feel royal

Gerakan visual dan transisi harus berwibawa, anggun, tidak norak, dan tidak berlebihan (lebay).

Consistency over complexity

Mengutamakan kesederhanaan dan kestabilan antarmuka daripada menambah fitur berlebihan.

Chapter 3: World Language & Screen Mapping

Untuk menjaga imersi, seluruh penamaan teknis screen dipetakan langsung ke bahasa dunia (World Language) CUKI:

Technical Code

Player-Facing Name

Description / Purpose

SCR-001

Entrance Sequence

Landing gate and initial onboarding

SCR-002

Kingdom Hub

Primary navigation & central realm

SCR-003

Training Ground

Tutorial and trial area

SCR-004

Cuki Arena

Main gameplay interface

SCR-005

Royal Treasury

Collection & inventory of unlocked items

SCR-006

Kingdom Map

Realm selector and story progression map

SCR-007

Heritage Gallery

Showroom for physical board game artifacts

Note: SCR-007 diubah dari "Royal Workshop" menjadi Heritage Gallery untuk menekankan apresiasi budaya dan pameran fisik, bukan transaksi komersial.

Chapter 4: Design Tokens

Color Tokens

The CUKI color palette reflects the rich, dignified heritage of the Sriwijaya Kingdom, anchored in warm golds, deep mahogany/slate tones, and organic parchment surfaces.

Token Category

Token Name

Value / HEX

Usage & Context

Primary Brand

color-primary-gold

#D4AF37

Primary buttons, active borders, major highlights

Primary Brand

color-primary-amber

#FFBF00

Hover states, focus rings, interactive glow

Background / Realm

color-bg-dark-slate

#121820

Main application background, royal night atmosphere

Background / Surface

color-bg-mahogany

#2A1B18

Container backdrops, deep panel contrast

Surface / Card

color-surface-parchment

#F5E6C8

Content panels, scrolls, cards, dialog boxes

Text Primary

color-text-dark

#2B1E16

High-contrast body text on parchment surfaces

Text Light

color-text-light

#F8F5EE

Primary text on dark slate / mahogany backgrounds

Text Muted

color-text-muted

#A09383

Secondary labels, disabled states, captions

State / Feedback

color-state-success

#2E7D32

Valid move highlight, victory cues, unlock badges

State / Feedback

color-state-error

#C62828

Invalid move feedback, boundary alert

State / Feedback

color-state-info

#0288D1

Non-intrusive notifications, hints

Typography Tokens

Typography balances historical majesty with modern legibility. Headers use classical serif styling, while body copy remains ultra-legible.

Level

Token Name

Font Family

Size (Desktop / Mobile)

Weight

Line Height

Display Title

font-display

Primary Classical Serif

48px / 32px

Bold (700)

1.2

Heading 1

font-h1

Primary Classical Serif

36px / 28px

Bold (700)

1.25

Heading 2

font-h2

Primary Classical Serif

28px / 22px

Semi-Bold (600)

1.3

Heading 3

font-h3

Sans-Serif Clean

20px / 18px

Medium (500)

1.4

Body Large

font-body-lg

Sans-Serif Clean

18px / 16px

Regular (400)

1.5

Body Default

font-body-md

Sans-Serif Clean

16px / 14px

Regular (400)

1.5

Caption / Small

font-caption

Sans-Serif Clean

14px / 12px

Regular (400)

1.4

Iconography

Base Size: 24px x 24px grid (Scalable to 16px or 32px).

Line Weight: 2px uniform stroke with soft rounded joints.

Style: Tactile, organic, clean vector geometry matching the historical artifact aesthetic.

Color Integration: Inherits color-text-dark on parchment or color-primary-gold on dark surfaces.

Illustration Usage

Allowed Styles: Semi-flat, storybook, and traditional Indonesian / Sriwijaya motif.

Framing: Illustrations must be contained within rounded cards (20px border radius) or parchment dialog overlays with warm drop shadows.

Strict Prohibitions: Strictly no 3D photorealism, vector cartoonism, or futuristic cyberpunk visuals.

Chapter 5: Layout & Grid System

Desktop Layout Architecture

Website ini dirancang sebagai sebuah Story Experience, sehingga navigasi Sidebar ditiadakan.

+-------------------------------------------------------+
|                        NAVBAR                         |
+-------------------------------------------------------+
|                                                       |
|                         HERO                          |
|                                                       |
+-------------------------------------------------------+
|                                                       |
|                        CARDS                          |
|                                                       |
+-------------------------------------------------------+
|                        FOOTER                         |
+-------------------------------------------------------+


Grid System

Container Max Width: 1280px

Gutter / Gap: 24px

Breakpoint

Device Target

Columns

Margin (Left/Right)

Desktop

> 1024px

12 Columns

48px

Tablet

768px – 1023px

8 Columns

32px

Mobile

< 767px

4 Columns

16px

Chapter 6: Spacing Tokens

Semua ukuran margin, padding, dan gap WAJIB menggunakan token resmi di bawah ini (Dilarang keras menggunakan angka acak):

Token

Size (px)

Usage

XS

8px

Micro spacing, icon offsets, badge padding

S

16px

Internal element padding, small gap

M

24px

Standard card padding, component gap

L

32px

Section gap, sub-container padding

XL

48px

Hero element spacing, major layout block gap

XXL

64px

Major section boundary spacing

Chapter 7: Elevation, Radius & Shadows

Border Radius

Component

Radius (px)

Card

20px

Button

16px

Popup

24px

Image Container

12px

Shadow System

Penggunaan bayangan harus bertingkat sesuai kedalaman visual (elevation) dan tidak boleh berlebihan.

Level 1 (Low Elevation): Navbar

box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.15);

Level 2 (Medium Elevation): Cards

box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.25);

Level 3 (High Elevation): Modals

box-shadow: 0px 8px 32px rgba(0, 0, 0, 0.40);

Level 4 (Top Elevation): Popups & Critical Alerts

box-shadow: 0px 12px 48px rgba(0, 0, 0, 0.60);

Chapter 8: Responsive Component Guidelines

Navbar

Desktop (> 1024px): Top horizontal bar (1280px container max-width), brand title on left, inline cultural navigation on right. Fixed height 72px.

Tablet (768px - 1023px): Reduced padding (24px), horizontal layout maintained with compact spacing.

Mobile (< 767px): Height reduced to 60px. Navigation transforms into a sleek, royal parchment modal menu triggered by a gold-accented icon button.

Hero

Desktop (> 1024px): Centered grand layout with primary CTA (BTN_Primary) and ambient visual motifs. Height aligned with narrative entrance.

Tablet & Mobile: Dynamic scale-down of display typography (48px to 32px). Content stacks vertically with full horizontal container alignment.

Cards

Desktop (> 1024px): 3-column or 4-column layout utilizing 12-column grid (gap: 24px). Padding set to 24px (Token M).

Tablet (768px - 1023px): 2-column layout utilizing 8-column grid (gap: 24px).

Mobile (< 767px): Single column full-width layout utilizing 4-column grid (gap: 16px). Internal padding scales to 16px (Token S).

Popup

All Screens: Centered overlay with semi-transparent dark backdrop (rgba(0, 0, 0, 0.75)).

Desktop / Tablet: Max width 560px, 24px border radius, Level 4 shadow.

Mobile: Full horizontal fit with 16px screen margin, auto vertical scaling up to 85vh with inner touch scroll if required.

Game Board

Desktop / Tablet: Fixed aspect ratio container (1:1 or 4:3 based on screen), maximum height capped at 80vh to preserve vertical viewport alignment with HUD.

Mobile: Aspect ratio maintained; container expands to 100% viewport width minus 16px side margins, ensuring complete touch clarity without horizontal page scroll.

Chapter 9: Game UI Design Guidelines

Game Board

Visual Representation: Tactile traditional grid structured over stone/parchment background textures.

Boundary: Defined by a gold-embossed trim (color-primary-gold) with clear cell demarcation lines.

Grid Layout: Uniform cell layout adhering strictly to board game geometry rules.

Pawn

Visual Style: Elegant, distinctive royal markers/tokens representing player and rival pieces.

States:

Idle: Solid token with soft base drop shadow.

Selected: Scaled up (1.1x) with an glowing gold ring animation.

Moving: Smooth positional transition across cell paths.

Dice

Visual Design: Tactile, rounded die with traditional dot markers.

Interaction: Hover/Touch triggers a subtle lift; clicking initiates an animated roll sequence before settling on the target value.

Disabled State: Dimmed opacity (0.5) during opponent turn or invalid roll phases.

Selected Cell

Visual Feedback: Glowing amber/gold border highlight (2px solid color-primary-amber) with a subtle radial backlight tint inside the cell.

Valid Move Highlight

Visual Indicator: Soft glowing emerald/gold pulse circle (color-state-success at 30% opacity) centered inside target destination cells.

Invalid Move Feedback

Visual Indicator: Brief horizontal shake micro-animation (200ms) accompanied by a subtle crimson outline (color-state-error). Never jarring; maintains game flow.

HUD (Heads-Up Display)

Structure: Minimal, non-intrusive top/bottom bar overlay during game arena state (SCR-004).

Elements: Displays current player turn, score/progress status, and royal scroll menu access button.

Contrast: Dark semi-transparent mahogany background pill to guarantee full legibility over board elements.

Chapter 10: Motion & Animation Rules

Core Rules

Animation should never distract.

Animation should support storytelling.

Duration Tokens

Hover: 200ms (Ease-out)

Click/Active: 150ms (Ease-in-out)

Fade Transition: 300ms (Ease-in)

Entrance Sequence: 1500ms (Smooth custom curve)

Hard Limit: Animation duration MUST NEVER exceed 2.0 seconds.

Chapter 11: Audio Experience

Trigger / Context

Sound Cue Type

Atmosphere

King Dialog

Soft ambience

Dignified, serene

Victory Condition

Traditional Gong

Majestic, triumphant

Button / Element Hover

Tiny Wood Click

Tactile, natural

Quiz / Scroll Action

Paper Flip

Historic, parchment-like

Chapter 12: Accessibility Guidelines

Minimum Touch Target

All interactive UI controls, buttons, board cells, and icons MUST maintain a minimum tap target size of 44px x 44px on touch viewports.

Keyboard Navigation

Complete focus sequence support for non-pointer interaction:

Tab / Shift + Tab: Cycle forward and backward through interactive elements.

Space / Enter: Activate focused buttons, roll dice, and confirm selections.

Escape: Close open popups, modals, or royal scroll UI overlays.

Focus State

All interactive components MUST exhibit a prominent, high-contrast focus indicator when navigated via keyboard.

Focus Style: 2px solid ring of color-primary-amber with a 2px offset (outline: 2px solid #FFBF00; outline-offset: 2px;).

Color Contrast

Text and essential UI controls MUST meet or exceed WCAG AA contrast standard:

Minimum 4.5:1 contrast ratio for normal body text against background surfaces.

Minimum 3.0:1 contrast ratio for large titles, headings, and heavy graphics.

Chapter 13: Visual & Illustration Style

Allowed Styles

Semi-flat

Storybook

Traditional Indonesian / Sriwijaya Motif

Prohibited Styles (Strict Enforcement)

❌ Cartoon (Dilarang)

❌ Cyberpunk (Dilarang)

Chapter 14: Component Naming Convention

Pengkodean nama komponen harus mengikuti standar prefiks berikut:

BTN_[Name]: e.g., BTN_Primary, BTN_Secondary

CARD_[Name]: e.g., CARD_Mission, CARD_Artifact

MODAL_[Name]: e.g., MODAL_Reward, MODAL_Menu

POPUP_[Name]: e.g., POPUP_History, POPUP_Confirm

PAGE_[Name]: e.g., PAGE_KingdomHub, PAGE_CukiArena

Chapter 15: Developer Rules (Strict Constraints)

Seluruh developer (manusia maupun AI) DILARANG KERAS (DO NOT) melakukan hal-hal berikut:

Redesign Homepage

Add XP System

Add Login / User Authentication System

Add Backend Dependency

Change Defined User Flow

Change Reward System

Change Story Flow

Chapter 16: AI Implementation & Conflict Resolution Rules

Execution Rule

When implementing this project, never redesign. Only implement.

Conflict Resolution Order

Jika terjadi inkonsistensi atau batasan antar dokumen, AI/Codex WAJIB mengikuti urutan prioritas keputusan berikut (dari tertinggi ke terendah):

Game Design Bible (Highest Authority)

Product Requirements Document

Software Architecture

CUKI Rulebook

Game Engine Test Cases

Design System

Functional Specification

Developer Assumption (Lowest Authority)