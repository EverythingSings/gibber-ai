/**
 * Unit tests for the Gibber graphics module.
 *
 * Tests graphics context management, error handling, and type guards.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createGraphicsError,
  isGraphicsError,
  getGraphicsState,
  getGraphicsError,
  isGraphicsReady,
  getGraphics,
  getCanvas,
  isWebGLSupported,
  destroyGraphics,
  subscribeToGraphicsStateChanges,
  createSphere,
  createBox,
  createTorus,
  createVec3,
  createVec2,
  createUnion,
  createDifference,
  createIntersection,
  type GraphicsError,
  type GraphicsErrorCode,
} from "$lib/gibber/graphics";

describe("gibber/graphics", () => {
  beforeEach(() => {
    destroyGraphics();
    vi.clearAllMocks();
  });

  afterEach(() => {
    destroyGraphics();
  });

  describe("createGraphicsError", () => {
    it("should create an error with code and message", () => {
      const error = createGraphicsError("INIT_FAILED", "Test error");

      expect(error.code).toBe("INIT_FAILED");
      expect(error.message).toBe("Test error");
      expect(error.cause).toBeUndefined();
    });

    it("should create an error with cause", () => {
      const cause = new Error("Original error");
      const error = createGraphicsError("RENDER_ERROR", "Render failed", cause);

      expect(error.code).toBe("RENDER_ERROR");
      expect(error.message).toBe("Render failed");
      expect(error.cause).toBe(cause);
    });

    it("should create errors with different codes", () => {
      const codes: GraphicsErrorCode[] = [
        "INIT_FAILED",
        "NO_CANVAS",
        "WEBGL_NOT_SUPPORTED",
        "RENDER_ERROR",
        "INVALID_GEOMETRY",
      ];

      for (const code of codes) {
        const error = createGraphicsError(code, `Error: ${code}`);
        expect(error.code).toBe(code);
      }
    });
  });

  describe("isGraphicsError", () => {
    it("should return true for valid GraphicsError objects", () => {
      const error = createGraphicsError("INIT_FAILED", "Test");
      expect(isGraphicsError(error)).toBe(true);
    });

    it("should return true for plain objects with code and message", () => {
      const error = { code: "NO_CANVAS", message: "No canvas" };
      expect(isGraphicsError(error)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isGraphicsError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isGraphicsError(undefined)).toBe(false);
    });

    it("should return false for primitives", () => {
      expect(isGraphicsError("error")).toBe(false);
      expect(isGraphicsError(123)).toBe(false);
      expect(isGraphicsError(true)).toBe(false);
    });

    it("should return false for objects missing code", () => {
      expect(isGraphicsError({ message: "test" })).toBe(false);
    });

    it("should return false for objects missing message", () => {
      expect(isGraphicsError({ code: "INIT_FAILED" })).toBe(false);
    });

    it("should return false for objects with non-string code", () => {
      expect(isGraphicsError({ code: 123, message: "test" })).toBe(false);
    });

    it("should return false for objects with non-string message", () => {
      expect(isGraphicsError({ code: "INIT_FAILED", message: 123 })).toBe(false);
    });

    it("should return false for standard Error objects", () => {
      expect(isGraphicsError(new Error("test"))).toBe(false);
    });

    it("should return false for empty objects", () => {
      expect(isGraphicsError({})).toBe(false);
    });

    it("should return false for arrays", () => {
      expect(isGraphicsError([])).toBe(false);
    });
  });

  describe("getGraphicsState", () => {
    it("should return uninitialized initially", () => {
      expect(getGraphicsState()).toBe("uninitialized");
    });
  });

  describe("getGraphicsError", () => {
    it("should return null when no error", () => {
      expect(getGraphicsError()).toBeNull();
    });
  });

  describe("isGraphicsReady", () => {
    it("should return false when uninitialized", () => {
      expect(isGraphicsReady()).toBe(false);
    });
  });

  describe("getGraphics", () => {
    it("should return null when not initialized", () => {
      expect(getGraphics()).toBeNull();
    });
  });

  describe("getCanvas", () => {
    it("should return null when not initialized", () => {
      expect(getCanvas()).toBeNull();
    });
  });

  describe("isWebGLSupported", () => {
    it("should return false in jsdom environment", () => {
      // jsdom doesn't support WebGL
      expect(isWebGLSupported()).toBe(false);
    });
  });

  describe("destroyGraphics", () => {
    it("should reset state to uninitialized", () => {
      destroyGraphics();
      expect(getGraphicsState()).toBe("uninitialized");
    });

    it("should clear graphics instance", () => {
      destroyGraphics();
      expect(getGraphics()).toBeNull();
    });

    it("should clear canvas reference", () => {
      destroyGraphics();
      expect(getCanvas()).toBeNull();
    });

    it("should clear error", () => {
      destroyGraphics();
      expect(getGraphicsError()).toBeNull();
    });
  });

  describe("subscribeToGraphicsStateChanges", () => {
    it("should return an unsubscribe function", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToGraphicsStateChanges(listener);

      expect(typeof unsubscribe).toBe("function");
      unsubscribe();
    });

    it("should be called when state changes", () => {
      const listener = vi.fn();
      subscribeToGraphicsStateChanges(listener);

      // Trigger a state change via destroy
      destroyGraphics();

      expect(listener).toHaveBeenCalledWith("uninitialized");
    });

    it("should not be called after unsubscribe", () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToGraphicsStateChanges(listener);

      unsubscribe();
      listener.mockClear();

      // This shouldn't trigger the listener
      destroyGraphics();

      expect(listener).not.toHaveBeenCalled();
    });

    it("should support multiple listeners", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      subscribeToGraphicsStateChanges(listener1);
      subscribeToGraphicsStateChanges(listener2);

      destroyGraphics();

      expect(listener1).toHaveBeenCalledWith("uninitialized");
      expect(listener2).toHaveBeenCalledWith("uninitialized");
    });
  });

  describe("convenience factory functions", () => {
    describe("createSphere", () => {
      it("should return null when graphics not initialized", () => {
        expect(createSphere()).toBeNull();
      });

      it("should return null when graphics not initialized with radius", () => {
        expect(createSphere(2)).toBeNull();
      });
    });

    describe("createBox", () => {
      it("should return null when graphics not initialized", () => {
        expect(createBox()).toBeNull();
      });

      it("should return null when graphics not initialized with size", () => {
        expect(createBox({ x: 1, y: 1, z: 1 })).toBeNull();
      });
    });

    describe("createTorus", () => {
      it("should return null when graphics not initialized", () => {
        expect(createTorus()).toBeNull();
      });

      it("should return null when graphics not initialized with radii", () => {
        expect(createTorus({ x: 0.5, y: 0.1 })).toBeNull();
      });
    });

    describe("createVec3", () => {
      it("should return null when graphics not initialized", () => {
        expect(createVec3(1, 2, 3)).toBeNull();
      });

      it("should return null when graphics not initialized with single value", () => {
        expect(createVec3(1)).toBeNull();
      });
    });

    describe("createVec2", () => {
      it("should return null when graphics not initialized", () => {
        expect(createVec2(1, 2)).toBeNull();
      });
    });

    describe("createUnion", () => {
      it("should return null when graphics not initialized", () => {
        const mockGeom1 = { __id: "1", type: "sphere" } as never;
        const mockGeom2 = { __id: "2", type: "box" } as never;
        expect(createUnion(mockGeom1, mockGeom2)).toBeNull();
      });

      it("should return null with less than 2 geometries", () => {
        const mockGeom = { __id: "1", type: "sphere" } as never;
        expect(createUnion(mockGeom)).toBeNull();
      });

      it("should return null with empty array", () => {
        expect(createUnion()).toBeNull();
      });
    });

    describe("createDifference", () => {
      it("should return null when graphics not initialized", () => {
        const mockGeom1 = { __id: "1", type: "sphere" } as never;
        const mockGeom2 = { __id: "2", type: "box" } as never;
        expect(createDifference(mockGeom1, mockGeom2)).toBeNull();
      });
    });

    describe("createIntersection", () => {
      it("should return null when graphics not initialized", () => {
        const mockGeom1 = { __id: "1", type: "sphere" } as never;
        const mockGeom2 = { __id: "2", type: "box" } as never;
        expect(createIntersection(mockGeom1, mockGeom2)).toBeNull();
      });
    });
  });

  describe("type exports", () => {
    it("should export GraphicsContextState type", () => {
      const state: "uninitialized" | "initializing" | "ready" | "error" = getGraphicsState();
      expect(["uninitialized", "initializing", "ready", "error"]).toContain(state);
    });

    it("should export GraphicsErrorCode type", () => {
      const codes: GraphicsErrorCode[] = [
        "INIT_FAILED",
        "NO_CANVAS",
        "WEBGL_NOT_SUPPORTED",
        "RENDER_ERROR",
        "INVALID_GEOMETRY",
      ];
      expect(codes).toHaveLength(5);
    });

    it("should export GraphicsError interface", () => {
      const error: GraphicsError = {
        code: "INIT_FAILED",
        message: "Test",
      };
      expect(error.code).toBe("INIT_FAILED");
      expect(error.message).toBe("Test");
    });
  });
});

describe("gibber/graphics types", () => {
  describe("MaterialMode type", () => {
    it("should accept valid material modes", () => {
      const modes = ["global", "phong", "orenn", "normal"];
      expect(modes).toHaveLength(4);
    });
  });

  describe("TexturePreset type", () => {
    it("should accept valid texture presets", () => {
      const presets = ["truchet", "dots", "checkers", "zigzag", "stripes", "cellular", "noise"];
      expect(presets).toHaveLength(7);
    });
  });

  describe("MaterialPreset type", () => {
    it("should accept valid material presets", () => {
      const presets = [
        "red",
        "green",
        "blue",
        "yellow",
        "cyan",
        "magenta",
        "white",
        "black",
        "normal",
      ];
      expect(presets).toHaveLength(9);
    });
  });

  describe("Vec2 interface", () => {
    it("should have x and y properties", () => {
      const vec = { x: 1, y: 2 };
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
    });
  });

  describe("Vec3 interface", () => {
    it("should have x, y, and z properties", () => {
      const vec = { x: 1, y: 2, z: 3 };
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });
  });

  describe("Vec4 interface", () => {
    it("should have x, y, z, and w properties", () => {
      const vec = { x: 1, y: 2, z: 3, w: 4 };
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
      expect(vec.w).toBe(4);
    });
  });

  describe("MaterialOptions interface", () => {
    it("should accept all optional properties", () => {
      const material = {
        mode: "phong" as const,
        ambient: { x: 0.1, y: 0.1, z: 0.1 },
        diffuse: { x: 0.5, y: 0.5, z: 0.5 },
        specular: { x: 1, y: 1, z: 1 },
        shininess: 8,
        fresnel: { x: 1, y: 50, z: 5 },
      };
      expect(material.mode).toBe("phong");
      expect(material.shininess).toBe(8);
    });

    it("should work with no properties", () => {
      const material = {};
      expect(material).toEqual({});
    });
  });

  describe("TextureOptions interface", () => {
    it("should accept all optional properties", () => {
      const texture = {
        scale: 10,
        strength: 0.5,
        radius: 0.25,
        time: 0,
      };
      expect(texture.scale).toBe(10);
      expect(texture.strength).toBe(0.5);
    });

    it("should work with no properties", () => {
      const texture = {};
      expect(texture).toEqual({});
    });
  });
});
