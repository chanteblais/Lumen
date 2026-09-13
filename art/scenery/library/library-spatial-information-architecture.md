# Library --- Spatial Information Architecture

*Reconciliation status (2026-09-13): retain this spatial design proposal and its rationale. The [Library product document](../../../docs/product/lists-library.md) defines the broader role; [Shared terminology](../../../docs/product/shared-model.md) defines shared-state ownership. Collections, Thread Groups, shelves and book presentations are views, not compulsory life-model nesting. Concrete spatial interactions remain open; absence of the spatial-map branch assets from main does not mean rejection.*

## Purpose

The Library is Coherence's long-term space for **continuity of
thought**. It is not a decorative representation of folders or a
conventional file browser rendered as books.

Its purpose is to allow the user's accumulated thinking to develop a
**spatial, navigable shape** over time.

The Library should answer:

-   *What areas of my life and thinking have developed substance?*
-   *What have I been thinking about within them?*
-   *Where did we leave off?*
-   *What is still unresolved?*
-   *How has my thinking changed?*

The user should not need to manually maintain this structure. Lumi
quietly helps identify, organize, connect, revise, and resurface
developing threads.

## Core hierarchy

The Library has four navigational scales:

**Library → Collection → Thread Group → Thread**

### 1. Library

The wide isometric room represents the user's overall intellectual
landscape.

It contains a fixed set of **architectural collection slots**,
internally identified independently of their content:

-   `collection_01`
-   `collection_02`
-   `collection_03`
-   etc.

These are stable physical locations. Their semantic identities are
dynamic.

For one user:

`collection_03 = Coherence`

For another:

`collection_03 = Music`

Collections should emerge from what meaningfully exists in the user's
life rather than requiring the user to design a filing system in
advance.

The Library architecture may eventually **expand** when the user's
accumulated material genuinely requires more space. Expansion represents
informational growth, not points or levels.

### 2. Collection

Selecting an architectural collection causes the camera to move into a
**canonical close-up of that physical location**.

Spatial continuity matters: the user should recognize the shelf they
clicked.

Within the close-up, Lumi's organization of the Collection becomes
visible through several dynamic **Thread Groups**.

For example:

**Coherence**

-   `thread_group_01 → Product & Design`
-   `thread_group_02 → Memory & Continuity`
-   `thread_group_03 → Motivation & ADHD`
-   `thread_group_04 → Philosophy`

These groupings may evolve as Lumi's understanding of the user's
thinking changes.

### 3. Thread Group

Selecting a Thread Group moves closer to a shelf where individual
intellectual Threads become identifiable.

Threads may have different physical forms reflecting their maturity:

-   **Loose paper** --- emerging thought
-   **Stitched booklet / folio** --- developing thread
-   **Bound volume** --- established thread
-   **Multiple volumes** --- substantial body of thought

The metaphor communicates development without requiring explicit
progress scores.

### 4. Thread

Selecting a Thread ends spatial navigation.

Lumi retrieves the relevant volume/material and brings it to the
**central Library table**.

The Thread opens as a living book containing its current intellectual
state:

-   **Where we've arrived**
-   **Still alive**
-   **Settled for now**
-   **How this changed**
-   **Open questions**
-   **Disagreements / revisions**
-   **Evidence & origins**
-   **Lumi's related notebook entries**
-   **Conversation history**
-   **Related Threads**

A Table of Contents allows precise navigation through mature Threads.

The opening spread always prioritizes **re-entry over history**. The
user should be able to understand where the thought currently stands
without rereading its development.

## The central table

The central table represents **working intellectual context**.

Shelves hold what has accumulated.

The table holds **what we're thinking about now**.

A small number of recently active Threads may physically remain on or
around the table. Dormant Threads naturally return to their Collections.

## Lumi's role

Lumi inhabits the Library rather than functioning as a menu.

She may:

-   shelve newly developed material
-   retrieve books
-   climb small ladders
-   reorganize Collections
-   carry emerging notes
-   read existing Threads
-   write in her own notebook
-   bring relevant older material back to the table

These animations communicate otherwise invisible system behaviour
without interrupting conversation.

## Spatial continuity

Every architectural Collection slot should eventually have a canonical
asset set:

-   `library_wide`
-   `collection_01_closeup`
-   `collection_02_closeup`
-   `collection_03_closeup`
-   ...

Each close-up should preserve the recognizable architecture, lighting,
materials, and neighbouring landmarks of its location in the wide
Library.

Each view should also define stable interactive regions so dynamic
content can be layered programmatically without regenerating the
environment.

## Growth principle

**The Library grows because the user's thinking requires somewhere to
go.**

No XP unlocks. No arbitrary levels.

A few thoughts may become a shelf.\
A substantial domain may occupy an alcove.\
A mature body of work may eventually require another room.

The user experiences this not as a reward screen, but as a subtle
realization:

**There's more here than there used to be.**
