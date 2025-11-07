/**
 * Library Scene API Contracts
 * 
 * This file defines the TypeScript interfaces and types that serve as the
 * contract between the LibraryScene implementation and the rest of the game.
 * 
 * These contracts ensure type safety and clear boundaries between systems.
 */

// ============================================================================
// SCENE CONFIGURATION
// ============================================================================

/**
 * Primary configuration for the LibraryScene
 */
export interface LibrarySceneConfig {
  /** Unique Phaser scene key */
  key: 'library-scene';
  
  /** World dimensions (game coordinate space) */
  worldSize: Size;
  
  /** Initial player spawn position */
  playerSpawn: Position;
  
  /** Camera following configuration */
  cameraConfig: CameraConfig;
}

/**
 * Camera behavior configuration
 */
export interface CameraConfig {
  /** Smooth following interpolation factor (0.0 - 1.0) */
  followLerp: number;
  
  /** Camera movement boundaries (world bounds) */
  bounds: Rectangle;
  
  /** Camera zoom level (1.0 = no zoom) */
  zoom: number;
  
  /** Round pixel positions for pixel-perfect rendering */
  roundPixels: boolean;
}

// ============================================================================
// PLAYER CHARACTER
// ============================================================================

/**
 * Configuration for creating a PlayerCharacter instance
 */
export interface PlayerCharacterConfig {
  /** Parent Phaser scene */
  scene: Phaser.Scene;
  
  /** Initial X position */
  x: number;
  
  /** Initial Y position */
  y: number;
  
  /** Sprite asset key to use for player visual */
  spriteKey: string;
  
  /** Movement speed in pixels per second (default: 150) */
  speed?: number;
}

/**
 * Public API for PlayerCharacter entity
 */
export interface IPlayerCharacter {
  /** Update player state (called each frame) */
  update(delta: number): void;
  
  /** Disable player movement (e.g., during dialogue) */
  lockMovement(): void;
  
  /** Re-enable player movement */
  unlockMovement(): void;
  
  /** Get current player position */
  getPosition(): Position;
  
  /** Set player position (for spawn/teleport) */
  setPosition(x: number, y: number): void;
  
  /** Get player sprite for physics collision setup */
  getSprite(): Phaser.GameObjects.Sprite;
  
  /** Check if player movement is currently locked */
  isMovementLocked(): boolean;
}

/**
 * WASD keyboard input keys
 */
export interface WASDKeys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
}

// ============================================================================
// FURNITURE & ENVIRONMENT
// ============================================================================

/**
 * Configuration for a single furniture object in the scene
 */
export interface FurnitureConfig {
  /** Unique identifier for this furniture piece */
  id: string;
  
  /** Category of furniture (for grouping/filtering) */
  type: FurnitureType;
  
  /** Sprite asset key to render */
  sprite: string;
  
  /** World position (center point) */
  position: Position;
  
  /** Collision box dimensions (may differ from sprite size) */
  collisionBox: Size;
  
  /** Render layer (0 = behind player, 1 = in front) */
  layer: number;
  
  /** Whether player can interact (future feature) */
  interactable?: boolean;
}

/**
 * Furniture categories for the library scene
 */
export enum FurnitureType {
  Bookshelf = 'bookshelf',
  Desk = 'desk',
  Seating = 'seating',
  Table = 'table',
  Fireplace = 'fireplace',
  Window = 'window',
  Door = 'door',
  Decoration = 'decoration',
}

/**
 * Configuration for invisible wall collision segments
 */
export interface WallConfig {
  /** Top-left corner X coordinate */
  x: number;
  
  /** Top-left corner Y coordinate */
  y: number;
  
  /** Width of wall segment */
  width: number;
  
  /** Height of wall segment */
  height: number;
}

// ============================================================================
// SCENE LAYOUT DATA
// ============================================================================

/**
 * Complete scene layout configuration (loaded from JSON)
 */
export interface LibraryLayoutConfig {
  /** Unique scene identifier */
  sceneId: string;
  
  /** Configuration version (for future migrations) */
  version: string;
  
  /** World dimensions */
  worldSize: Size;
  
  /** Player spawn position */
  playerSpawn: Position;
  
  /** All furniture objects in the scene */
  furniture: FurnitureConfig[];
  
  /** Wall collision segments */
  walls: WallConfig[];
  
  /** Future: ambient effects, lighting, particles */
  ambiance?: AmbianceConfig;
}

/**
 * Future: Ambient effects configuration (placeholder)
 */
export interface AmbianceConfig {
  particles?: unknown[];
  lighting?: unknown;
  soundscape?: string;
}

// ============================================================================
// ASSET MANIFEST
// ============================================================================

/**
 * Asset manifest structure for scene assets
 */
export interface AssetManifest {
  /** Sprite definitions */
  sprites: Record<string, SpriteAssetDef>;
  
  /** Audio definitions (optional) */
  audio?: Record<string, AudioAssetDef>;
}

/**
 * Individual sprite asset definition
 */
export interface SpriteAssetDef {
  /** File path relative to public directory */
  path: string;
  
  /** Explicit width for SVG assets */
  width?: number;
  
  /** Explicit height for SVG assets */
  height?: number;
  
  /** Asset type (inferred from path if not specified) */
  type?: 'svg' | 'png' | 'jpg';
}

/**
 * Individual audio asset definition
 */
export interface AudioAssetDef {
  /** File path relative to public directory */
  path: string;
  
  /** Volume level (0.0 - 1.0) */
  volume?: number;
  
  /** Whether audio should loop */
  loop?: boolean;
}

// ============================================================================
// GEOMETRY PRIMITIVES
// ============================================================================

/**
 * 2D size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 2D position coordinates
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 2D rectangle (position + size)
 */
export interface Rectangle extends Position, Size {}

// ============================================================================
// SCENE TRANSITION
// ============================================================================

/**
 * Data passed when transitioning to LibraryScene
 */
export interface LibrarySceneData {
  /** Optional: previous scene identifier */
  fromScene?: string;
  
  /** Optional: custom spawn position (overrides default) */
  spawnPosition?: Position;
  
  /** Future: game state for scene restoration */
  gameState?: unknown;
}

/**
 * Scene transition configuration
 */
export interface SceneTransitionConfig {
  /** Duration of fade-out in milliseconds */
  fadeOutDuration: number;
  
  /** Duration of fade-in in milliseconds */
  fadeInDuration: number;
  
  /** Fade color (RGB) */
  fadeColor: { r: number; g: number; b: number };
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Result of scene layout validation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Critical errors (prevent scene from loading) */
  errors: string[];
  
  /** Non-critical warnings */
  warnings: string[];
}

/**
 * Scene validator interface
 */
export interface ISceneValidator {
  /** Validate complete library layout configuration */
  validateLibraryLayout(layout: LibraryLayoutConfig): ValidationResult;
  
  /** Check if position is within bounds */
  isWithinBounds(pos: Position, size: Size): boolean;
  
  /** Verify walls fully enclose the scene */
  wallsEncloseScene(walls: WallConfig[], worldSize: Size): boolean;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Scene-specific error types
 */
export enum SceneErrorType {
  AssetLoadFailed = 'ASSET_LOAD_FAILED',
  InvalidLayout = 'INVALID_LAYOUT',
  PlayerSpawnFailed = 'PLAYER_SPAWN_FAILED',
  PhysicsSetupFailed = 'PHYSICS_SETUP_FAILED',
}

/**
 * Scene error with context
 */
export interface SceneError {
  type: SceneErrorType;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

// ============================================================================
// SCENE LIFECYCLE EVENTS
// ============================================================================

/**
 * Events emitted by LibraryScene
 */
export interface LibrarySceneEvents {
  /** Scene has completed loading assets */
  'scene-loaded': void;
  
  /** Scene has completed initialization */
  'scene-ready': void;
  
  /** Player has spawned into the scene */
  'player-spawned': { position: Position };
  
  /** Player has moved to a new position */
  'player-moved': { position: Position; velocity: Position };
  
  /** Scene is shutting down */
  'scene-shutdown': void;
  
  /** Asset loading error occurred */
  'asset-error': { assetKey: string; error: Error };
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for LibraryLayoutConfig
 */
export function isLibraryLayoutConfig(obj: unknown): obj is LibraryLayoutConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  const layout = obj as Partial<LibraryLayoutConfig>;
  
  return (
    typeof layout.sceneId === 'string' &&
    typeof layout.version === 'string' &&
    layout.worldSize !== undefined &&
    layout.playerSpawn !== undefined &&
    Array.isArray(layout.furniture) &&
    Array.isArray(layout.walls)
  );
}

/**
 * Type guard for FurnitureConfig
 */
export function isFurnitureConfig(obj: unknown): obj is FurnitureConfig {
  if (typeof obj !== 'object' || obj === null) return false;
  const furn = obj as Partial<FurnitureConfig>;
  
  return (
    typeof furn.id === 'string' &&
    typeof furn.type === 'string' &&
    typeof furn.sprite === 'string' &&
    furn.position !== undefined &&
    furn.collisionBox !== undefined &&
    typeof furn.layer === 'number'
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Scene configuration constants
 */
export const LIBRARY_SCENE_CONSTANTS = {
  /** Scene identifier */
  SCENE_KEY: 'library-scene' as const,
  
  /** World dimensions */
  WORLD_WIDTH: 2400,
  WORLD_HEIGHT: 1600,
  
  /** Default player spawn (center of room) */
  DEFAULT_SPAWN: { x: 1200, y: 800 },
  
  /** Default player movement speed (pixels/second) */
  DEFAULT_PLAYER_SPEED: 150,
  
  /** Camera follow interpolation */
  DEFAULT_CAMERA_LERP: 0.1,
  
  /** Scene transition timings (milliseconds) */
  FADE_OUT_DURATION: 500,
  FADE_IN_DURATION: 500,
  
  /** Minimum furniture count for rich environment */
  MIN_FURNITURE_COUNT: 10,
  
  /** Maximum furniture count for performance */
  MAX_FURNITURE_COUNT: 30,
  
  /** Wall thickness standard */
  WALL_THICKNESS: 50,
} as const;

/**
 * Standard furniture size presets
 */
export const FURNITURE_SIZE_PRESETS = {
  small: { width: 32, height: 32 },
  medium: { width: 64, height: 64 },
  large: { width: 96, height: 128 },
  xlarge: { width: 128, height: 160 },
} as const;
