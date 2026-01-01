/**
 * Type declarations for the gibber.graphics.lib module.
 *
 * This module doesn't ship with TypeScript types, so we declare it here
 * to satisfy the TypeScript compiler. The actual types are defined in
 * graphics.ts and used at runtime.
 */

declare module "gibber.graphics.lib" {
  /**
   * Mock Gibber interface expected by the graphics library.
   */
  interface MockGibber {
    Graphics: unknown;
    Audio: {
      Gibberish: {
        utilities: {
          getUID(): string;
        };
        worklet: {
          ugens: Map<string, unknown>;
        };
      };
      Clock: {
        time(delay: number): number;
      };
    };
    subscribe(event: string, callback: () => void): void;
    Seq(config: unknown): unknown;
    Tidal(config: unknown): unknown;
    Environment: unknown;
  }

  /**
   * Graphics initialization props.
   */
  interface GraphicsInitProps {
    canvas?: HTMLCanvasElement;
  }

  /**
   * The main Graphics namespace exported by the library.
   */
  const Graphics: {
    /**
     * Definition files for graphics objects.
     */
    defs: unknown;

    /**
     * Canvas element for rendering.
     */
    canvas: HTMLCanvasElement | null;

    /**
     * 2D context (if using 2D mode).
     */
    ctx: CanvasRenderingContext2D | null;

    /**
     * Rendering quality (1-10).
     */
    quality: number;

    /**
     * Whether to animate continuously.
     */
    animate: boolean;

    /**
     * Camera instance.
     */
    camera: {
      pos: { x: number; y: number; z: number };
      dir: { x: number; y: number; z: number };
      rotation: number;
      initialized: boolean;
      init(options: unknown, gibber: unknown): void;
    };

    /**
     * Whether graphics are initialized.
     */
    initialized: boolean;

    /**
     * Keys that should not be exported.
     */
    __doNotExport: readonly string[];

    /**
     * Whether the animation loop is running.
     */
    __running: boolean;

    /**
     * Current scene objects.
     */
    __scene: unknown[];

    /**
     * Prototype methods available on geometries.
     */
    __protomethods: readonly string[];

    /**
     * Active lights in the scene.
     */
    __lights: unknown[];

    /**
     * Post-processing effects.
     */
    __postprocessing: unknown[];

    /**
     * Export graphics constructors to an object.
     */
    export(obj: Record<string, unknown>): void;

    /**
     * Initialize the graphics context.
     * @param props - Initialization properties (canvas element)
     * @param gibber - Gibber namespace reference
     * @returns Promise resolving to [Graphics, 'Graphics']
     */
    init(props: GraphicsInitProps, gibber: MockGibber): Promise<[typeof Graphics, string]>;

    /**
     * Run the graphics rendering loop.
     */
    run(): void;

    /**
     * Set background color.
     */
    background(color: unknown): void;

    /**
     * Enable voxel rendering.
     */
    voxels(size?: number): typeof Graphics;

    /**
     * Set fog effect.
     */
    fog(amount?: number, color?: unknown, shouldRender?: boolean): unknown;

    /**
     * Apply texture to a geometry.
     */
    texture(...args: unknown[]): unknown;

    /**
     * Create a light in the scene.
     */
    light(...args: unknown[]): unknown;

    /**
     * Create a wrapped geometry/operation.
     */
    make(name: string, op: unknown, isfx?: boolean, props?: readonly string[] | null): void;

    /**
     * Create a mapping from audio to graphics.
     */
    createMapping(from: unknown, to: unknown, name: string, wrappedTo: unknown): void;

    /**
     * Create a sequencable property on an object.
     */
    createProperty(obj: unknown, name: string, value: unknown, wrapped: unknown): void;

    /**
     * Clear the graphics scene.
     */
    clear(): void;
  };

  export default Graphics;
}
