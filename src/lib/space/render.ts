/**
 * The mandala's drawing pass.
 *
 * Split out from the React component so it can be exercised against a mock 2D
 * context: a canvas that silently draws nothing (a single NaN in the geometry
 * poisons an entire path) looks exactly like a canvas that works, so the draw
 * calls themselves are worth asserting on.
 *
 * Nothing here touches the DOM, React, or time — everything the frame needs
 * arrives as an argument.
 */

import { RAY_SEGMENTS, segmentsFor, type MandalaSpec } from "./mandala";

/** Brand line colours. The seed mixes between them per mandala. */
export const LINE_PURPLE = [203, 187, 227] as const; // #cbbbe3
export const LINE_TEAL = [124, 176, 186] as const; // lifted from #204147 so it reads on dark
export const GLOW_WARM = "249, 217, 122"; // #f9d97a

/** Bloom feel — how far the pattern opens under a finger, and how wide. */
export const BLOOM_PUSH = 0.17; // fraction of the mandala radius
export const BLOOM_RADIUS = 0.42; // fraction of the mandala radius

export interface PointerState {
  x: number;
  y: number;
  /** 0-1 bloom intensity. Rises while held, decays after release. */
  strength: number;
  held: boolean;
}

export interface MotionState {
  /** Extra rotation from flicks, in radians. */
  spinAccum: number;
  spinVel: number;
  /** Vertical-drag squash, -1..1, springs back to 0. */
  tilt: number;
  tiltTarget: number;
  pointer: PointerState;
}

/** A motion state at complete rest — the loop's starting point, and the tests'. */
export function restingMotion(): MotionState {
  return {
    spinAccum: 0,
    spinVel: 0,
    tilt: 0,
    tiltTarget: 0,
    pointer: { x: 0, y: 0, strength: 0, held: false },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Fill the shorter axis, leaving room for the affirmation to sit over it. */
export function radiusFor(width: number, height: number): number {
  return Math.min(width, height) * 0.44;
}

export function mixChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function drawSpec(
  ctx: CanvasRenderingContext2D,
  spec: MandalaSpec,
  cx: number,
  cy: number,
  radius: number,
  seconds: number,
  motion: MotionState,
  alpha: number,
  reduced: boolean,
) {
  if (alpha <= 0.001) return;

  const stroke = [
    mixChannel(LINE_PURPLE[0], LINE_TEAL[0], spec.hueMix),
    mixChannel(LINE_PURPLE[1], LINE_TEAL[1], spec.hueMix),
    mixChannel(LINE_PURPLE[2], LINE_TEAL[2], spec.hueMix),
  ];
  const rgb = `${stroke[0]}, ${stroke[1]}, ${stroke[2]}`;

  // Vertical drag squashes the disc; the widening on the other axis is what
  // sells it as a tilt rather than a shrink.
  const sy = 1 - motion.tilt * 0.18;
  const sx = 1 + motion.tilt * 0.09;

  const bloom = motion.pointer.strength;
  const push = radius * BLOOM_PUSH;
  const falloff = radius * BLOOM_RADIUS;
  const falloffSq = falloff * falloff;
  const px = motion.pointer.x;
  const py = motion.pointer.y;

  /** Map a point in mandala space to screen space, through tilt and bloom. */
  const place = (angle: number, r: number): [number, number] => {
    let x = cx + Math.cos(angle) * r * sx;
    let y = cy + Math.sin(angle) * r * sy;

    if (bloom > 0.002) {
      const dx = x - px;
      const dy = y - py;
      const distSq = dx * dx + dy * dy;
      // Squared Lorentzian rather than plain: the plain form has a long tail
      // that nudges the far edge of the pattern by a couple of pixels whenever
      // a finger touches anywhere, which reads as the whole mandala being loose
      // rather than as it blooming under the fingertip. Squaring collapses the
      // tail to nothing while leaving full strength at the touch point.
      const falloff = falloffSq / (distSq + falloffSq);
      const strength = bloom * falloff * falloff;

      // Displace outward from the mandala's centre, not away from the finger.
      // A field pointing away from the touch point reverses direction as it
      // crosses that point, which puts a hard cusp in the rim exactly where the
      // user is looking. Radiating from the centre keeps the field smooth
      // everywhere and reads better anyway: the pattern opens where you touch
      // it, like a flower, instead of being shoved.
      const ox = x - cx;
      const oy = y - cy;
      const outward = Math.sqrt(ox * ox + oy * oy);
      if (outward > 0.001) {
        x += (ox / outward) * strength * push;
        y += (oy / outward) * strength * push;
      }
    }
    return [x, y];
  };

  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const layer of spec.layers) {
    const segments = segmentsFor(layer.count);
    const spin = reduced ? 0 : seconds * layer.spin + motion.spinAccum;
    const layerRadius = radius * layer.radius;

    ctx.strokeStyle = `rgba(${rgb}, ${(layer.alpha * alpha).toFixed(3)})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();

    for (let i = 0; i < layer.count; i++) {
      const base = (i * Math.PI * 2) / layer.count + spin;

      switch (layer.kind) {
        case "ring": {
          // A small circle riding the layer's radius.
          const ringRadius = layerRadius * 0.42;
          for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            const ox =
              Math.cos(base) * layerRadius + Math.cos(theta) * ringRadius;
            const oy =
              Math.sin(base) * layerRadius + Math.sin(theta) * ringRadius;
            const r = Math.hypot(ox, oy);
            const a = Math.atan2(oy, ox);
            const [x, y] = place(a, r);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          break;
        }

        case "petals": {
          // Two bowed edges from the centre out to a shared tip.
          for (const side of [-1, 1]) {
            for (let s = 0; s <= segments; s++) {
              const t = s / segments;
              const bow =
                Math.sin(Math.PI * t) * layer.curvature * layer.spread;
              const [x, y] = place(base + side * bow * 0.5, layerRadius * t);
              if (s === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          }
          break;
        }

        case "rays": {
          // Faint hairlines spanning the gap between the petal tips and the
          // rim. Starting them at the centre instead left them reading as
          // stray scratches across the middle of the pattern. Walked in steps
          // rather than drawn end-to-end so the bloom bends them.
          const inner = layerRadius * 0.72;
          for (let s = 0; s <= RAY_SEGMENTS; s++) {
            const t = s / RAY_SEGMENTS;
            const [x, y] = place(base, inner + (layerRadius - inner) * t);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          break;
        }

        case "arcs": {
          // A pair of shallow concentric arcs capping the outer edge.
          for (const inset of [1, 0.94]) {
            for (let s = 0; s <= segments; s++) {
              const t = s / segments;
              const angle = base - layer.spread / 2 + layer.spread * t;
              // Outward, not inward: pulling the midpoint in turns the rim into
              // a polygon, which is the one shape a mandala must not be.
              const bulge = 1 + layer.curvature * 0.22 * Math.sin(Math.PI * t);
              const [x, y] = place(angle, layerRadius * inset * bulge);
              if (s === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
          }
          break;
        }
      }
    }

    ctx.stroke();
  }

  // Warm points where the rim's scallops meet — the only saturated colour on
  // screen, and the only place shadowBlur is paid for. They borrow the rim
  // layer's radius and rotation so they sit *on* the structure and turn with
  // it, instead of drifting across it on a clock of their own.
  const rim = spec.layers[spec.layers.length - 1];
  const glowRadius = radius * rim.radius;
  const glowSpin = reduced ? 0 : seconds * rim.spin + motion.spinAccum;
  const junctionOffset = Math.PI / spec.glowCount;
  ctx.fillStyle = `rgba(${GLOW_WARM}, ${(0.85 * alpha).toFixed(3)})`;
  ctx.shadowColor = `rgba(${GLOW_WARM}, ${(0.6 * alpha).toFixed(3)})`;
  ctx.shadowBlur = 6 + 14 * alpha;
  for (let i = 0; i < spec.glowCount; i++) {
    const angle =
      (i * Math.PI * 2) / spec.glowCount + junctionOffset + glowSpin;
    const [x, y] = place(angle, glowRadius);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
