/**
 * Graphics context and wrapper for gibber.graphics.lib.
 *
 * Provides a safe, typed interface for creating 3D ray-marched graphics
 * using the marching.js library wrapped by gibber.graphics.lib.
 *
 * @module gibber/graphics
 */

// ============================================================================
// Types
// ============================================================================

/**
 * State of the graphics context.
 */
export type GraphicsContextState = "uninitialized" | "initializing" | "ready" | "error";

/**
 * 2D vector with x, y components.
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 3D vector with x, y, z components.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 4D vector with x, y, z, w components.
 */
export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Material lighting modes.
 */
export type MaterialMode = "global" | "phong" | "orenn" | "normal";

/**
 * Available texture presets.
 */
export type TexturePreset =
  | "truchet"
  | "dots"
  | "checkers"
  | "zigzag"
  | "stripes"
  | "cellular"
  | "noise";

/**
 * Available material color presets.
 */
export type MaterialPreset =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "cyan"
  | "magenta"
  | "white"
  | "black"
  | "normal";

/**
 * Material configuration for geometries.
 */
export interface MaterialOptions {
  /** Lighting model mode */
  readonly mode?: MaterialMode;
  /** Ambient color (RGB, each 0-1) */
  readonly ambient?: Vec3;
  /** Diffuse color (RGB, each 0-1) */
  readonly diffuse?: Vec3;
  /** Specular color (RGB, each 0-1) */
  readonly specular?: Vec3;
  /** Specular shininess (higher = sharper highlights) */
  readonly shininess?: number;
  /** Fresnel effect (bias, scale, power) */
  readonly fresnel?: Vec3;
}

/**
 * Texture configuration for geometries.
 */
export interface TextureOptions {
  /** Texture resolution/size */
  readonly scale?: number;
  /** Texture effect strength */
  readonly strength?: number;
  /** Texture-specific radius (for dots) */
  readonly radius?: number;
  /** Time parameter for animated textures */
  readonly time?: number;
}

/**
 * Sequencable graphics property that supports .seq() and .tidal().
 */
export interface SequencableGraphicsProperty<T = number> {
  /** Current value */
  value: T;

  /**
   * Sequence values at specified timings.
   * @param values - Value(s) to sequence
   * @param timings - Duration(s) in beats
   * @param seqId - Optional sequence ID
   */
  seq(values: T | readonly T[], timings?: number | readonly number[], seqId?: number): void;

  /**
   * Use TidalCycles mini-notation for sequencing.
   * @param pattern - TidalCycles pattern string
   * @param tidalId - Optional tidal ID
   */
  tidal(pattern: string, tidalId?: number): void;

  /**
   * Fade property between values over time.
   * @param from - Starting value (null = current)
   * @param to - Ending value
   * @param time - Duration in seconds
   */
  fade(from: T | null, to: T, time: number): void;

  /**
   * Map an audio source to control this property.
   * @param source - Audio source to follow
   * @param multiplier - Optional scale multiplier
   * @param offset - Optional offset
   */
  map(source: unknown, multiplier?: number, offset?: number): void;
}

/**
 * Transform operations available on geometries.
 */
export interface TransformOperations {
  /**
   * Translate the geometry.
   * @param x - X offset (also applied to Y,Z if only arg)
   * @param y - Optional Y offset
   * @param z - Optional Z offset
   */
  translate(x: number, y?: number, z?: number): this;

  /**
   * Rotate the geometry.
   * @param angle - Rotation angle in degrees
   * @param x - X component of rotation axis
   * @param y - Y component of rotation axis
   * @param z - Z component of rotation axis
   */
  rotate(angle: number, x?: number, y?: number, z?: number): this;

  /**
   * Scale the geometry.
   * @param x - X scale (also applied to Y,Z if only arg)
   * @param y - Optional Y scale
   * @param z - Optional Z scale
   */
  scale(x: number, y?: number, z?: number): this;
}

/**
 * Base geometry interface with common operations.
 */
export interface Geometry extends TransformOperations {
  /** Unique identifier */
  readonly __id: string;

  /** Geometry type name */
  readonly type: string;

  /** X position */
  readonly x: SequencableGraphicsProperty<number>;

  /** Y position */
  readonly y: SequencableGraphicsProperty<number>;

  /** Z position */
  readonly z: SequencableGraphicsProperty<number>;

  /** Rotation properties */
  readonly rotation: {
    readonly x: SequencableGraphicsProperty<number>;
    readonly y: SequencableGraphicsProperty<number>;
    readonly z: SequencableGraphicsProperty<number>;
    readonly angle: SequencableGraphicsProperty<number>;
  };

  /**
   * Apply a material to this geometry.
   * @param preset - Material preset name or Material instance
   * @param modifiers - Optional property modifiers
   */
  material(preset: MaterialPreset | MaterialOptions, modifiers?: MaterialOptions): this;

  /**
   * Apply a texture to this geometry.
   * @param preset - Texture preset name
   * @param options - Texture options
   */
  texture(preset: TexturePreset, options?: TextureOptions): this;

  /**
   * Apply bump mapping using a texture.
   * @param texture - Texture to use for bump mapping
   * @param strength - Bump strength
   */
  bump(texture: unknown, strength?: number): this;

  /**
   * Render this geometry to the canvas.
   * @param quality - Rendering quality (1-10, higher = better but slower)
   * @param shouldAnimate - Whether to animate continuously
   */
  render(quality?: number, shouldAnimate?: boolean): this;

  /** Stop all sequences on this geometry */
  stop(): void;

  /** Start all sequences on this geometry */
  start(): void;
}

/**
 * Sphere geometry.
 */
export interface Sphere extends Geometry {
  readonly radius: SequencableGraphicsProperty<number>;
}

/**
 * Box geometry.
 */
export interface Box extends Geometry {
  readonly size: SequencableGraphicsProperty<Vec3>;
}

/**
 * Torus geometry.
 */
export interface Torus extends Geometry {
  readonly radii: SequencableGraphicsProperty<Vec2>;
}

/**
 * Capsule geometry.
 * Note: Uses startPos/endPos to avoid conflict with inherited start() method.
 */
export interface Capsule extends Geometry {
  readonly startPos: Vec3;
  readonly endPos: Vec3;
  readonly radius: SequencableGraphicsProperty<number>;
}

/**
 * Cone geometry.
 */
export interface Cone extends Geometry {
  readonly size: Vec3;
}

/**
 * Cylinder geometry.
 */
export interface Cylinder extends Geometry {
  readonly dimensions: Vec2;
}

/**
 * Hex prism geometry.
 */
export interface HexPrism extends Geometry {
  readonly dimensions: Vec2;
}

/**
 * Julia fractal geometry.
 */
export interface Julia extends Geometry {
  readonly fold: SequencableGraphicsProperty<number>;
}

/**
 * Mandelbulb fractal geometry.
 */
export interface Mandelbulb extends Geometry {
  readonly c0: SequencableGraphicsProperty<number>;
}

/**
 * Mandelbox fractal geometry.
 * Note: Uses fractalScale to avoid conflict with inherited scale() method.
 */
export interface Mandelbox extends Geometry {
  readonly fold: SequencableGraphicsProperty<number>;
  readonly fractalScale: SequencableGraphicsProperty<number>;
  readonly iterations: SequencableGraphicsProperty<number>;
}

/**
 * Plane geometry.
 */
export interface Plane extends Geometry {
  readonly normal: Vec3;
  readonly distance: Vec3;
}

/**
 * CSG operation result (Union, Difference, etc.).
 */
export interface CSGOperation extends Geometry {
  readonly a: Geometry;
  readonly b: Geometry;
}

/**
 * Domain modifier (Twist, Repeat, etc.).
 */
export interface DomainModifier extends Geometry {
  readonly amount: SequencableGraphicsProperty<number>;
}

/**
 * Post-processing effect base.
 */
export interface PostEffect {
  readonly __wrapped: unknown;
}

/**
 * Bloom post-processing effect.
 */
export interface BloomEffect extends PostEffect {
  readonly amount: SequencableGraphicsProperty<number>;
  readonly threshold: SequencableGraphicsProperty<number>;
}

/**
 * Blur post-processing effect.
 */
export interface BlurEffect extends PostEffect {
  readonly amount: SequencableGraphicsProperty<number>;
}

/**
 * Focus (depth of field) post-processing effect.
 */
export interface FocusEffect extends PostEffect {
  readonly depth: SequencableGraphicsProperty<number>;
  readonly radius: SequencableGraphicsProperty<number>;
}

/**
 * Godrays post-processing effect.
 */
export interface GodraysEffect extends PostEffect {
  readonly decay: SequencableGraphicsProperty<number>;
  readonly density: SequencableGraphicsProperty<number>;
  readonly threshold: SequencableGraphicsProperty<number>;
  readonly weight: SequencableGraphicsProperty<number>;
  readonly color: SequencableGraphicsProperty<Vec3>;
}

/**
 * Light in the scene.
 */
export interface Light {
  readonly position: Vec3;
  readonly color: Vec3;
}

/**
 * Camera in the scene.
 */
export interface Camera {
  readonly pos: {
    readonly x: SequencableGraphicsProperty<number>;
    readonly y: SequencableGraphicsProperty<number>;
    readonly z: SequencableGraphicsProperty<number>;
  };
  readonly rotation: SequencableGraphicsProperty<number>;
}

/**
 * Fog configuration.
 */
export interface Fog {
  readonly amount: SequencableGraphicsProperty<number>;
  readonly color: SequencableGraphicsProperty<Vec3>;
}

/**
 * Graphics namespace with all constructors.
 */
export interface GraphicsNamespace {
  // Primitives
  Box(size?: Vec3): Box;
  Sphere(radius?: number): Sphere;
  Torus(radii?: Vec2): Torus;
  Capsule(start?: Vec3, end?: Vec3, radius?: number): Capsule;
  Cone(size?: Vec3): Cone;
  Cylinder(dimensions?: Vec2): Cylinder;
  HexPrism(dimensions?: Vec2): HexPrism;
  Julia(fold?: number): Julia;
  Mandelbulb(c0?: number): Mandelbulb;
  Mandelbox(fold?: number, scale?: number, iterations?: number): Mandelbox;
  Plane(normal?: Vec3, distance?: Vec3): Plane;
  Torus82(radii?: Vec2): Torus;
  Torus88(radii?: Vec2): Torus;

  // CSG Operations
  Union(a: Geometry, b: Geometry): CSGOperation;
  Union2(...geometries: readonly Geometry[]): CSGOperation;
  Difference(a: Geometry, b: Geometry): CSGOperation;
  Intersection(a: Geometry, b: Geometry): CSGOperation;
  SmoothUnion(a: Geometry, b: Geometry, amount?: number): CSGOperation;
  SmoothDifference(a: Geometry, b: Geometry, amount?: number): CSGOperation;
  SmoothIntersection(a: Geometry, b: Geometry, amount?: number): CSGOperation;

  // Domain Operations
  Repeat(geometry: Geometry, spacing: Vec3): DomainModifier;
  Twist(geometry: Geometry, amount?: number): DomainModifier;
  Bend(geometry: Geometry, amount?: number): DomainModifier;
  Mirror(geometry: Geometry): Geometry;

  // Post-processing
  Antialias(): PostEffect;
  Bloom(amount?: number, threshold?: number): BloomEffect;
  BloomOld(amount?: number, threshold?: number): BloomEffect;
  Blur(amount?: number): BlurEffect;
  Edge(): PostEffect;
  Contrast(amount?: number): PostEffect;
  Hue(shift?: number, threshold?: number): PostEffect;
  Focus(depth?: number, radius?: number): FocusEffect;
  Godrays(decay?: number, density?: number, threshold?: number): GodraysEffect;
  Invert(threshold?: number): PostEffect;
  MotionBlur(amount?: number): PostEffect;

  // Scene elements
  Light(position: Vec3, color: Vec3): Light;
  Fog(amount?: number, color?: Vec3): Fog;
  Background(color: Vec4 | Vec3): void;
  Material(
    mode: MaterialMode,
    ambient: Vec3,
    diffuse: Vec3,
    specular: Vec3,
    shininess: number,
    fresnel?: Vec3
  ): MaterialOptions;
  Texture(preset: TexturePreset, options?: TextureOptions): unknown;

  // Vectors
  Vec2(x: number, y: number): Vec2;
  Vec3(x: number, y?: number, z?: number): Vec3;
  Vec4(x: number, y?: number, z?: number, w?: number): Vec4;

  // Camera
  Camera: Camera;

  // Core marching.js reference
  Marching: unknown;

  /** Clear the graphics scene */
  clear(): void;
}

/**
 * Graphics initialization options.
 */
export interface GraphicsInitOptions {
  /** Canvas element to render to */
  readonly canvas?: HTMLCanvasElement;
  /** Rendering quality (1-10) */
  readonly quality?: number;
  /** Whether to animate continuously */
  readonly animate?: boolean;
}

/**
 * Error codes for graphics operations.
 */
export type GraphicsErrorCode =
  | "INIT_FAILED"
  | "NO_CANVAS"
  | "WEBGL_NOT_SUPPORTED"
  | "RENDER_ERROR"
  | "INVALID_GEOMETRY";

/**
 * Graphics error.
 */
export interface GraphicsError {
  readonly code: GraphicsErrorCode;
  readonly message: string;
  readonly cause?: Error;
}

// ============================================================================
// State
// ============================================================================

/** Current graphics context state */
let contextState: GraphicsContextState = "uninitialized";

/** Last error that occurred */
let lastError: GraphicsError | null = null;

/** Graphics namespace instance */
let graphicsInstance: GraphicsNamespace | null = null;

/** Canvas element */
let canvasElement: HTMLCanvasElement | null = null;

/** State change listeners */
const stateListeners = new Set<(state: GraphicsContextState) => void>();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a GraphicsError with the given code and message.
 */
export const createGraphicsError = (
  code: GraphicsErrorCode,
  message: string,
  cause?: Error
): GraphicsError => ({
  code,
  message,
  cause,
});

/**
 * Type guard to check if value is a GraphicsError.
 */
export const isGraphicsError = (value: unknown): value is GraphicsError => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj["code"] === "string" && typeof obj["message"] === "string";
};

/**
 * Notifies all state listeners of a state change.
 */
const notifyStateChange = (newState: GraphicsContextState): void => {
  contextState = newState;
  for (const listener of stateListeners) {
    listener(newState);
  }
};

// ============================================================================
// Context Management
// ============================================================================

/**
 * Gets the current graphics context state.
 */
export const getGraphicsState = (): GraphicsContextState => contextState;

/**
 * Gets the last graphics error, if any.
 */
export const getGraphicsError = (): GraphicsError | null => lastError;

/**
 * Checks if the graphics context is ready.
 */
export const isGraphicsReady = (): boolean => contextState === "ready";

/**
 * Gets the graphics namespace instance.
 * @returns GraphicsNamespace or null if not initialized
 */
export const getGraphics = (): GraphicsNamespace | null => graphicsInstance;

/**
 * Gets the canvas element.
 */
export const getCanvas = (): HTMLCanvasElement | null => canvasElement;

/**
 * Checks if WebGL is supported in the current environment.
 */
export const isWebGLSupported = (): boolean => {
  if (typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    return gl !== null;
  } catch {
    return false;
  }
};

/**
 * Initializes the graphics context.
 *
 * @param options - Initialization options
 * @returns Promise that resolves when graphics are ready
 *
 * @example
 * ```typescript
 * await initializeGraphics({ canvas: myCanvas });
 * const g = getGraphics();
 * g?.Sphere().render();
 * ```
 */
export const initializeGraphics = async (options: GraphicsInitOptions = {}): Promise<void> => {
  // Already ready or initializing
  if (contextState === "ready") {
    return;
  }

  if (contextState === "initializing") {
    // Wait for existing initialization
    return new Promise((resolve, reject) => {
      const listener = (state: GraphicsContextState): void => {
        if (state === "ready") {
          stateListeners.delete(listener);
          resolve();
        } else if (state === "error") {
          stateListeners.delete(listener);
          reject(lastError);
        }
      };
      stateListeners.add(listener);
    });
  }

  notifyStateChange("initializing");
  lastError = null;

  try {
    // Check WebGL support
    if (!isWebGLSupported()) {
      throw createGraphicsError("WEBGL_NOT_SUPPORTED", "WebGL is not supported in this browser");
    }

    // Get or create canvas
    canvasElement = options.canvas ?? document.querySelector("canvas");
    if (!canvasElement) {
      throw createGraphicsError(
        "NO_CANVAS",
        "No canvas element found. Provide a canvas in options or add one to the document."
      );
    }

    // Dynamic import of gibber.graphics.lib
    const GraphicsModule = await import("gibber.graphics.lib");
    const Graphics = GraphicsModule.default;

    // Create a minimal Gibber-like object for initialization
    // The graphics lib expects a Gibber object with Audio.Gibberish
    const mockGibber = {
      Graphics: null,
      Audio: {
        Gibberish: {
          utilities: {
            getUID: (): string =>
              `graphics_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          },
          worklet: {
            ugens: new Map(),
          },
        },
        Clock: {
          time: (delay: number): number => delay,
        },
      },
      subscribe: (): void => {
        // No-op for clear subscription
      },
      Seq: (): unknown => ({
        start: (): unknown => ({}),
      }),
      Tidal: (): unknown => ({
        start: (): unknown => ({}),
        stop: (): void => {
          // Intentional no-op: Tidal stop is handled by graphics lib
        },
        clear: (): void => {
          // Intentional no-op: Tidal clear is handled by graphics lib
        },
      }),
      Environment: null,
    };

    // Initialize graphics with the canvas
    await Graphics.init({ canvas: canvasElement }, mockGibber);

    // Export graphics constructors to our namespace
    const namespace: Record<string, unknown> = {};
    Graphics.export(namespace);

    // Set default quality and animate settings
    if (options.quality !== undefined) {
      Graphics.quality = options.quality;
    }
    if (options.animate !== undefined) {
      Graphics.animate = options.animate;
    }

    graphicsInstance = namespace as unknown as GraphicsNamespace;
    notifyStateChange("ready");
  } catch (err) {
    if (isGraphicsError(err)) {
      lastError = err;
    } else if (err instanceof Error) {
      lastError = createGraphicsError("INIT_FAILED", err.message, err);
    } else {
      lastError = createGraphicsError("INIT_FAILED", String(err));
    }
    notifyStateChange("error");
    throw lastError;
  }
};

/**
 * Clears the graphics scene.
 */
export const clearGraphics = (): void => {
  if (graphicsInstance) {
    graphicsInstance.clear();
  }
};

/**
 * Destroys the graphics context.
 */
export const destroyGraphics = (): void => {
  if (graphicsInstance) {
    graphicsInstance.clear();
  }
  graphicsInstance = null;
  canvasElement = null;
  lastError = null;
  notifyStateChange("uninitialized");
};

/**
 * Subscribes to graphics state changes.
 *
 * @param listener - Function called on state changes
 * @returns Unsubscribe function
 */
export const subscribeToGraphicsStateChanges = (
  listener: (state: GraphicsContextState) => void
): (() => void) => {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
};

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Creates a Sphere geometry if graphics are initialized.
 */
export const createSphere = (radius?: number): Sphere | null => {
  return graphicsInstance?.Sphere(radius) ?? null;
};

/**
 * Creates a Box geometry if graphics are initialized.
 */
export const createBox = (size?: Vec3): Box | null => {
  return graphicsInstance?.Box(size) ?? null;
};

/**
 * Creates a Torus geometry if graphics are initialized.
 */
export const createTorus = (radii?: Vec2): Torus | null => {
  return graphicsInstance?.Torus(radii) ?? null;
};

/**
 * Creates a Vec3 if graphics are initialized.
 */
export const createVec3 = (x: number, y?: number, z?: number): Vec3 | null => {
  return graphicsInstance?.Vec3(x, y, z) ?? null;
};

/**
 * Creates a Vec2 if graphics are initialized.
 */
export const createVec2 = (x: number, y: number): Vec2 | null => {
  return graphicsInstance?.Vec2(x, y) ?? null;
};

/**
 * Creates a union of geometries if graphics are initialized.
 */
export const createUnion = (...geometries: readonly Geometry[]): CSGOperation | null => {
  if (!graphicsInstance || geometries.length < 2) {
    return null;
  }
  const first = geometries[0];
  const second = geometries[1];
  if (first === undefined || second === undefined) {
    return null;
  }
  if (geometries.length === 2) {
    return graphicsInstance.Union(first, second);
  }
  return graphicsInstance.Union2(...geometries);
};

/**
 * Creates a difference of geometries if graphics are initialized.
 */
export const createDifference = (a: Geometry, b: Geometry): CSGOperation | null => {
  return graphicsInstance?.Difference(a, b) ?? null;
};

/**
 * Creates an intersection of geometries if graphics are initialized.
 */
export const createIntersection = (a: Geometry, b: Geometry): CSGOperation | null => {
  return graphicsInstance?.Intersection(a, b) ?? null;
};
