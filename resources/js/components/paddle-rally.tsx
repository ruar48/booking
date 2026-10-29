import { useEffect, useId, useRef } from 'react';
import type { RefObject } from 'react';

import { cn } from '@/lib/utils';

/**
 * A looping paddle-hits-ball scene: the ball drops in on a gravity arc,
 * bounces, and is driven back out on the rise. Positions are computed per
 * frame from a fixed timeline (not CSS keyframes) so every flight segment is a
 * true parabola and the swing can be eased like a real stroke.
 *
 * Frames are written straight to the SVG attributes, so the animation never
 * re-renders React. It pauses while off-screen and shows a single still frame
 * to visitors who prefer reduced motion.
 *
 * The paddle, ball, physics and frame loop are exported for PaddleDuel.
 */

const LOOP = 2; // seconds
const GRAVITY = 900; // scene units / s²
const GROUND = 141;
export const BALL_R = 8;

export type Point = { x: number; y: number };

const ENTRY: Point = { x: 385, y: 30 };
const BOUNCE: Point = { x: 205, y: GROUND - BALL_R };
// Where the face meets the ball at the contact angle (12°), just inside the rim.
const HIT: Point = { x: 135, y: 63 };
const EXIT: Point = { x: 395, y: 35 };

const T_BOUNCE = 0.55;
/** When, in the paddle's own stroke timeline, the face meets the ball. */
export const T_HIT = 0.85;
// A real paddle holds the ball for a few milliseconds; just long enough to see the squash.
const T_RELEASE = 0.862;
const T_GONE = 1.1;

// The butt of the grip, where the (unseen) hand holds it.
const PIVOT: Point = { x: 95, y: 126 };

const easeInOutSine = (p: number) => -(Math.cos(Math.PI * p) - 1) / 2;
const easeInQuad = (p: number) => p * p;
export const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
export const clamp01 = (p: number) => Math.min(1, Math.max(0, p));
export const mod = (value: number, by: number) => ((value % by) + by) % by;

/** Position on the parabola that leaves `from` and lands on `to` after `duration`. */
export function arc(from: Point, to: Point, elapsed: number, duration: number, gravity = GRAVITY): Point {
    const vy = (to.y - from.y - 0.5 * gravity * duration ** 2) / duration;

    return {
        x: from.x + ((to.x - from.x) * elapsed) / duration,
        y: from.y + vy * elapsed + 0.5 * gravity * elapsed ** 2,
    };
}

/** Paddle angle in degrees: ready, backswing, accelerate into contact, follow through, recover. */
function paddleAngle(t: number): number {
    const seg = (start: number, end: number) => clamp01((t - start) / (end - start));

    if (t < 0.4) {
        return -6;
    }

    if (t < 0.74) {
        return -6 - 26 * easeInOutSine(seg(0.4, 0.74));
    }

    if (t < T_HIT) {
        return -32 + 44 * easeInQuad(seg(0.74, T_HIT));
    }

    if (t < 1.05) {
        return 12 + 30 * easeOutCubic(seg(T_HIT, 1.05));
    }

    if (t < 1.6) {
        return 42 - 48 * easeInOutCubic(seg(1.05, 1.6));
    }

    return -6;
}

/**
 * Where the paddle is `stroke` seconds into its stroke (contact at T_HIT).
 * The hand travels with the swing, and the player breathes between shots.
 */
export function paddlePose(stroke: number, pivot: Point, loop: number): Point & { angle: number } {
    const angle = paddleAngle(mod(stroke, loop));

    return {
        x: pivot.x + angle * 0.22,
        y: pivot.y + Math.sin((stroke / loop) * Math.PI * 2) * 1.2,
        angle,
    };
}

export function paddleTransform(stroke: number, pivot: Point, loop: number): string {
    const { x, y, angle } = paddlePose(stroke, pivot, loop);

    return `translate(${x} ${y}) rotate(${angle})`;
}

/** True during the fast part of the swing, when the paddle leaves a motion blur. */
export const isFastSwing = (stroke: number, loop: number) => {
    const t = mod(stroke, loop);

    return t > 0.74 && t < 0.97;
};

type Ball = { x: number; y: number; spin: number; visible: boolean; squashX: number; squashY: number; squashAngle: number };

function ballAt(t: number): Ball {
    const base = { spin: 0, visible: true, squashX: 1, squashY: 1, squashAngle: 0 };

    if (t < T_BOUNCE) {
        return { ...base, ...arc(ENTRY, BOUNCE, t, T_BOUNCE), spin: -300 * t };
    }

    if (t < T_HIT) {
        const p = arc(BOUNCE, HIT, t - T_BOUNCE, T_HIT - T_BOUNCE);

        return { ...base, ...p, spin: -165 + 500 * (t - T_BOUNCE) };
    }

    if (t < T_RELEASE) {
        // Flattened against the face, pressed along the paddle's normal.
        const k = Math.sin(((t - T_HIT) / (T_RELEASE - T_HIT)) * Math.PI);

        return { ...base, ...HIT, spin: -15, squashX: 1 - 0.32 * k, squashY: 1 + 0.18 * k, squashAngle: 12 };
    }

    if (t < T_GONE) {
        const elapsed = t - T_RELEASE;
        const p = arc(HIT, EXIT, elapsed, T_GONE - T_RELEASE);
        // Rebound: still slightly stretched for a moment after leaving the face.
        const k = Math.max(0, 1 - elapsed / 0.08);

        return { ...base, ...p, spin: -15 + 1400 * elapsed, squashX: 1 + 0.12 * k, squashY: 1 - 0.1 * k, squashAngle: -15 };
    }

    return { ...base, ...EXIT, visible: false };
}

/** Squash factor `k` (0–1) for a ball that hits the court `fromBounce` seconds away. */
export const bounceSquash = (fromBounce: number) => Math.max(0, 1 - Math.abs(fromBounce) / 0.04);

export type BallParts = {
    ball: Element | null;
    squash: Element | null;
    spin: Element | null;
    shadow: Element | null;
};

export type BallPose = {
    x: number;
    y: number;
    spin: number;
    visible: boolean;
    /** Squash against a paddle face: stretch factors along an axis at `squashAngle`. */
    squashX: number;
    squashY: number;
    squashAngle: number;
    /** 0–1 flattening against the court. */
    bounce: number;
};

/** Writes a ball pose, its squash and its court shadow onto the ball's SVG parts. */
export function drawBall(parts: BallParts, pose: BallPose, ground: number) {
    const sx = 1 + 0.22 * pose.bounce;
    const sy = 1 - 0.28 * pose.bounce;

    parts.ball?.setAttribute('opacity', pose.visible ? '1' : '0');
    // Bounce squash is anchored at the contact point on the ground, not the ball's centre.
    parts.ball?.setAttribute('transform', `translate(${pose.x} ${pose.y + BALL_R * (1 - sy)})`);
    parts.squash?.setAttribute(
        'transform',
        `rotate(${pose.squashAngle}) scale(${pose.squashX * sx} ${pose.squashY * sy}) rotate(${-pose.squashAngle})`,
    );
    parts.spin?.setAttribute('transform', `rotate(${pose.spin})`);

    // The shadow tightens and darkens as the ball comes down to the court.
    const height = Math.max(0, ground - BALL_R - pose.y);
    const nearness = Math.max(0, 1 - height / 180);
    parts.shadow?.setAttribute('cx', String(pose.x));
    parts.shadow?.setAttribute('rx', String(3 + 7 * nearness));
    parts.shadow?.setAttribute('opacity', pose.visible ? String(0.08 + 0.3 * nearness) : '0');
}

export const queryPart = (svg: SVGSVGElement, name: string) => svg.querySelector(`[data-part="${name}"]`);

export const ballParts = (svg: SVGSVGElement): BallParts => ({
    ball: queryPart(svg, 'ball'),
    squash: queryPart(svg, 'squash'),
    spin: queryPart(svg, 'spin'),
    shadow: queryPart(svg, 'shadow'),
});

/**
 * Runs a scene's frame function on every animation frame while the SVG is on
 * screen. `bind` looks up the SVG parts once and returns the per-frame draw.
 * Visitors who prefer reduced motion get the single frame at `stillTime`.
 */
export function useSceneLoop(
    svgRef: RefObject<SVGSVGElement | null>,
    bind: (svg: SVGSVGElement) => (time: number) => void,
    stillTime: number,
) {
    useEffect(() => {
        const svg = svgRef.current;

        if (!svg) {
            return;
        }

        const draw = bind(svg);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            draw(stillTime);

            return;
        }

        let frame = 0;
        let started: number | null = null;
        let pausedAt = 0;

        const tick = (now: number) => {
            started ??= now - pausedAt * 1000;
            pausedAt = (now - started) / 1000;
            draw(pausedAt);
            frame = requestAnimationFrame(tick);
        };

        const stop = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            started = null;
        };

        draw(0);

        // Only animate while the scene is on screen.
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && frame === 0) {
                frame = requestAnimationFrame(tick);
            } else if (!entry.isIntersecting) {
                stop();
            }
        });

        observer.observe(svg);

        return () => {
            observer.disconnect();
            stop();
        };
    }, [svgRef, bind, stillTime]);
}

function bindRally(svg: SVGSVGElement) {
    const paddle = queryPart(svg, 'paddle');
    const ghostNear = queryPart(svg, 'paddleGhostNear');
    const ghostFar = queryPart(svg, 'paddleGhostFar');
    const ring = queryPart(svg, 'ring');
    const streaks = queryPart(svg, 'streaks');
    const ball = ballParts(svg);

    return (time: number) => {
        const t = time % LOOP;

        paddle?.setAttribute('transform', paddleTransform(t, PIVOT, LOOP));

        // Motion blur: trailing copies of the paddle only during the fast part of the swing.
        const blur = isFastSwing(t, LOOP) ? 1 : 0;
        ghostNear?.setAttribute('transform', paddleTransform(t - 0.018, PIVOT, LOOP));
        ghostNear?.setAttribute('opacity', String(0.22 * blur));
        ghostFar?.setAttribute('transform', paddleTransform(t - 0.036, PIVOT, LOOP));
        ghostFar?.setAttribute('opacity', String(0.1 * blur));

        const pose = ballAt(t);
        drawBall(ball, { ...pose, bounce: bounceSquash(t - T_BOUNCE) }, GROUND);

        const impact = clamp01((t - T_HIT) / 0.1);
        const ringOn = t >= T_HIT && impact < 1;
        ring?.setAttribute('r', String(BALL_R + 10 * easeOutCubic(impact)));
        ring?.setAttribute('opacity', ringOn ? String(0.55 * (1 - impact)) : '0');

        const streak = clamp01((t - T_RELEASE) / 0.22);
        const streakOn = t >= T_RELEASE && streak < 1;
        streaks?.setAttribute('transform', `translate(${pose.x} ${pose.y}) rotate(-20)`);
        streaks?.setAttribute('opacity', streakOn ? String(0.5 * (1 - streak)) : '0');
    };
}

/** The moment just before contact: the most readable single frame. */
const STILL_FRAME = T_HIT - 0.04;

const HOLES: Point[] = [
    { x: 0, y: 0 },
    { x: -4.2, y: -2.2 },
    { x: 4.2, y: -2.2 },
    { x: -4.2, y: 2.6 },
    { x: 4.2, y: 2.6 },
    { x: 0, y: -5 },
    { x: 0, y: 5.2 },
];

export type SceneIds = { face: string; ball: string; clip: string };

export function useSceneIds(): SceneIds {
    const uid = useId().replace(/:/g, '');

    return { face: `face-${uid}`, ball: `ball-${uid}`, clip: `clip-${uid}` };
}

/** Gradients and clip path the paddle and ball refer to. One per SVG. */
export function SceneDefs({ ids }: { ids: SceneIds }) {
    return (
        <defs>
            <linearGradient id={ids.face} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6a9fc4" />
                <stop offset="55%" stopColor="#4a7fa8" />
                <stop offset="100%" stopColor="#1a3a5c" />
            </linearGradient>
            <radialGradient id={ids.ball} cx="35%" cy="30%" r="75%">
                <stop offset="0%" stopColor="#f3ff8a" />
                <stop offset="55%" stopColor="#d4ed2a" />
                <stop offset="100%" stopColor="#a3bb14" />
            </radialGradient>
            <clipPath id={ids.clip}>
                <circle r={BALL_R} />
            </clipPath>
        </defs>
    );
}

export function Paddle({ faceId, ghost = false }: { faceId: string; ghost?: boolean }) {
    // Drawn with the butt of the grip at the origin, face pointing up (−y), and
    // turned three-quarters toward the ball. Proportions follow a real paddle:
    // an elongated face on a slim handle, with only a sliver of edge guard
    // showing, since a paddle is barely a centimetre and a half thick.
    return (
        <>
            <path d="M -3.5 -35 L -6 -40 L 6 -40 L 3.5 -35 Z" fill="#0f172a" />
            <rect x={-14} y={-108} width={32} height={70} rx={12} fill="#0a1c30" />
            <rect x={-16} y={-108} width={32} height={70} rx={12} fill={`url(#${faceId})`} stroke="#0a1c30" strokeWidth={1.6} />
            {!ghost && (
                <>
                    <rect x={-13} y={-105} width={26} height={64} rx={9.5} fill="none" stroke="#d4ed2a" strokeOpacity={0.5} strokeWidth={0.9} />
                    <path d="M -9 -100 Q -2 -103 6 -101" fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={1.6} strokeLinecap="round" />
                    <ellipse cx={0} cy={-73} rx={4} ry={6.5} fill="none" stroke="#d4ed2a" strokeOpacity={0.3} strokeWidth={0.8} />
                </>
            )}
            <rect x={-4} y={-36} width={8} height={34} rx={3} fill="#1e293b" />
            {!ghost && (
                <g stroke="#475569" strokeWidth={0.9} strokeLinecap="round">
                    {[-31, -25, -19, -13, -7].map((y) => (
                        <line key={y} x1={-3.2} y1={y + 2.5} x2={3.2} y2={y} />
                    ))}
                </g>
            )}
            <rect x={-5} y={-4} width={10} height={5} rx={2} fill="#0f172a" />
        </>
    );
}

/** A paddle with its two motion-blur copies, named `${name}`, `${name}GhostNear`, `${name}GhostFar`. */
export function SwingingPaddle({ faceId, name }: { faceId: string; name: string }) {
    return (
        <>
            <g data-part={`${name}GhostFar`} opacity={0}>
                <Paddle faceId={faceId} ghost />
            </g>
            <g data-part={`${name}GhostNear`} opacity={0}>
                <Paddle faceId={faceId} ghost />
            </g>
            <g data-part={name}>
                <Paddle faceId={faceId} />
            </g>
        </>
    );
}

/** The ball, drawn at the origin; drawBall moves it. */
export function BallArt({ ids }: { ids: SceneIds }) {
    return (
        <g data-part="ball" opacity={0}>
            <g data-part="squash">
                <circle r={BALL_R} fill={`url(#${ids.ball})`} />
                <g clipPath={`url(#${ids.clip})`}>
                    <g data-part="spin">
                        {HOLES.map((hole) => (
                            <circle key={`${hole.x},${hole.y}`} cx={hole.x} cy={hole.y} r={1.15} fill="#7f9410" fillOpacity={0.75} />
                        ))}
                    </g>
                </g>
                <ellipse cx={-2.6} cy={-3.2} rx={2.6} ry={1.6} fill="#fff" fillOpacity={0.55} />
            </g>
        </g>
    );
}

export function PaddleRally({ className, label = 'A paddle hitting a pickleball' }: { className?: string; label?: string }) {
    const ids = useSceneIds();
    const svgRef = useRef<SVGSVGElement>(null);

    useSceneLoop(svgRef, bindRally, STILL_FRAME);

    return (
        <svg ref={svgRef} viewBox="0 0 360 160" role="img" aria-label={label} className={cn('block h-auto w-full', className)}>
            <SceneDefs ids={ids} />

            <line x1={16} x2={344} y1={GROUND} y2={GROUND} stroke="currentColor" strokeOpacity={0.22} strokeWidth={1.5} strokeLinecap="round" />
            <ellipse data-part="shadow" cx={HIT.x} cy={GROUND + 1} rx={8} ry={2.2} fill="currentColor" opacity={0} />

            <SwingingPaddle faceId={ids.face} name="paddle" />

            <circle data-part="ring" cx={HIT.x} cy={HIT.y} r={BALL_R} fill="none" stroke="#d4ed2a" strokeWidth={2} opacity={0} />

            <g data-part="streaks" opacity={0} stroke="#d4ed2a" strokeWidth={1.6} strokeLinecap="round">
                <line x1={-14} y1={-3} x2={-30} y2={-3} />
                <line x1={-13} y1={3} x2={-24} y2={3} />
            </g>

            <BallArt ids={ids} />
        </svg>
    );
}
