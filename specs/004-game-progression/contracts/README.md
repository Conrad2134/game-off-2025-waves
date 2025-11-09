# API Contracts: Game Progression System

**Feature**: 004-game-progression  
**Date**: 2025-11-09

## Overview

This directory contains TypeScript interface definitions that serve as contracts between the game progression system components. These contracts define the public APIs that must be implemented and respected across the codebase.

## Contract Files

| File | Purpose |
|------|---------|
| `progression-manager.ts` | GameProgressionManager system API |
| `clue-tracker.ts` | ClueTracker system API |
| `progression-types.ts` | Shared type definitions for progression |
| `clue-types.ts` | Shared type definitions for clues |
| `dialog-extensions.ts` | Extensions to existing dialog system |

## Usage

These contracts should be:
1. Imported by implementation files in `src/systems/` and `src/types/`
2. Used for type checking during development
3. Referenced during testing to verify compliance
4. Updated when requirements change (with version bump)

## Integration with Existing Contracts

The progression system extends contracts from:
- `specs/003-dialog-system/contracts/` - DialogManager, InteractionDetector
- `src/types/` - Existing type definitions

No breaking changes to existing contracts are required.
