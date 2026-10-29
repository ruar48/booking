import { useRef } from 'react';

import {
    arc,
    BALL_R,
    BallArt,
    ballParts,
    bounceSquash,
    clamp01,
    drawBall,
    easeOutCubic,
    isFastSwing,
    mod,
    paddlePose,
    queryPart,
    SceneDefs,
    SwingingPaddle,
    T_HIT,
    useSceneIds,
    useSceneLoop,
} from '@/components/paddle-rally';
import type { BallPose, Point } from '@/components/paddle-rally';
import { cn } from '@/lib/utils';

/**
 * Two players playing out a point over a net. They rally (each shot clears
 * the net, bounces once in the far court and is hit back on the rise), until
 * the opponent dumps one into the net. The winner celebrates, the opponent
 * hangs their head ("Nice game!"), perks up ("Let's play another!"), and the
 * ball is dropped for the next serve.
 *
 * The right-hand player is the left one mirrored on the same stroke timeline,
 * so both swings are identical and always meet the ball.
 */

const WIDTH = 800;
const GROUND = 140;
const GRAVITY = 900; // scene units / s²
const SHOT = 1.2; // seconds per rally shot
/** Length of one stroke timeline (ready, swing, recover), as paddleAngle runs it. */
const STROKE = 2.4;
const NET_X = WIDTH / 2;
// About as tall as a player's swing, like a real net; drives clear it by roughly a ball's width.
const NET_TOP = 82;

// Left player's side. The right player's points are these mirrored across the net.
const PIVOT: Point = { x: 80, y: 135 };
// Ball position at contact for the paddle angle at T_HIT (12°), just right of the face.
const HIT: Point = { x: 120, y: 72 };
const FAR_BOUNCE: Point = { x: 560, y: GROUND - BALL_R };
const FAR_HIT: Point = { x: WIDTH - HIT.x, y: HIT.y };

const DWELL = 0.012;
const T_BOUNCE = 0.7;

// The losing shot: a low drive into the net that drops and dribbles on the hitter's side.
const NET_HIT: Point = { x: NET_X + 7 + BALL_R, y: 94 };
const NET_DROP: Point = { x: NET_X + 26, y: GROUND - BALL_R };
const NET_REST: Point = { x: NET_X + 38, y: GROUND - BALL_R };
// The next serve is dropped in from above the server's paddle.
const SERVE_DROP: Point = { x: HIT.x + 4, y: -20 };

// The point, start to finish (seconds).
const T_NET_SHOT = SHOT * 3;
const T_NET = T_NET_SHOT + 0.35;
const T_DROP = T_NET + 0.3;
const T_REST = T_DROP + 0.22;
const T_CLEAR = 6.4;
const T_SERVE = 6.8;
const POINT = 7.2;

// When each player's paddle meets the ball. The left player serves again at POINT.
const HITS: [number[], number[]] = [
    [0, SHOT * 2, POINT],
    [SHOT, T_NET_SHOT],
];

type CheerEvent = {
    side: 0 | 1;
    start: number;
    end: number;
    word: string;
    x?: number;
};

// Nudged in from the hitter toward the net so the longest cheers, enlarged, stay in frame.
const CHEER_X = 175;

const CHEERS: CheerEvent[] = [
    { side: 0, start: 0, end: 0.95, word: 'FUN!' },
    { side: 1, start: SHOT, end: SHOT + 0.95, word: 'NICE SHOT!' },
    { side: 0, start: SHOT * 2, end: SHOT * 2 + 0.95, word: 'SO FUN!' },
    { side: 1, start: T_NET_SHOT, end: T_NET_SHOT + 0.8, word: 'OOPS!' },
    // The winner's cheer clears before the invite, so the two never overlap.
    { side: 0, start: T_REST, end: 5.75, word: 'WIN! WIN! WIN!' },
    { side: 1, start: T_REST + 0.2, end: 5.7, word: 'NICE GAME!' },
    // Centred over the net: the longest line, and it has to fit enlarged on phones.
    { side: 1, start: 5.75, end: 6.75, word: "LET'S PLAY ANOTHER!", x: NET_X },
];

const mirrorX = (x: number) => WIDTH - x;

/** 0 → 1 → 0 over [start, end], easing in and out over `ramp` seconds. */
const envelope = (t: number, start: number, end: number, ramp: number) =>
    clamp01((t - start) / ramp) * clamp01((end - t) / ramp);

/** The ball over one rally shot from the left player, `u` seconds after contact. */
function shotFromLeft(u: number) {
    if (u < DWELL) {
        // Flattened against the face along the paddle's normal.
        const k = Math.sin((u / DWELL) * Math.PI);

        return {
            ...HIT,
            spin: 0,
            squashX: 1 - 0.32 * k,
            squashY: 1 + 0.18 * k,
            squashAngle: 12,
            bounce: 0,
        };
    }

    const pose = {
        spin: 1100 * u,
        squashX: 1,
        squashY: 1,
        squashAngle: 0,
        bounce: bounceSquash(u - T_BOUNCE),
    };

    if (u < T_BOUNCE) {
        return {
            ...pose,
            ...arc(HIT, FAR_BOUNCE, u - DWELL, T_BOUNCE - DWELL, GRAVITY),
        };
    }

    return {
        ...pose,
        ...arc(FAR_BOUNCE, FAR_HIT, u - T_BOUNCE, SHOT - T_BOUNCE, GRAVITY),
    };
}

const fromRight = (pose: ReturnType<typeof shotFromLeft>) => ({
    ...pose,
    x: mirrorX(pose.x),
    spin: -pose.spin,
    squashAngle: -pose.squashAngle,
});

function ballAt(t: number): BallPose {
    if (t < T_NET_SHOT) {
        const shot = Math.floor(t / SHOT);
        const pose = shotFromLeft(t - shot * SHOT);

        return { ...(shot % 2 ? fromRight(pose) : pose), visible: true };
    }

    const still = {
        spin: 0,
        squashX: 1,
        squashY: 1,
        squashAngle: 0,
        bounce: 0,
        visible: true,
    };
    const u = t - T_NET_SHOT;

    if (u < DWELL) {
        return { ...fromRight(shotFromLeft(u)), visible: true };
    }

    if (t < T_NET) {
        return {
            ...still,
            ...arc(
                FAR_HIT,
                NET_HIT,
                u - DWELL,
                T_NET - T_NET_SHOT - DWELL,
                GRAVITY,
            ),
            spin: -900 * u,
        };
    }

    if (t < T_DROP) {
        // Flattened against the net for an instant, then it drops straight down.
        const k = bounceSquash(t - T_NET);

        return {
            ...still,
            ...arc(NET_HIT, NET_DROP, t - T_NET, T_DROP - T_NET, GRAVITY),
            spin: -320,
            squashX: 1 - 0.3 * k,
            squashY: 1 + 0.15 * k,
            bounce: bounceSquash(t - T_DROP),
        };
    }

    if (t < T_REST) {
        return {
            ...still,
            ...arc(NET_DROP, NET_REST, t - T_DROP, T_REST - T_DROP, GRAVITY),
            spin: -320 + 400 * (t - T_DROP),
            bounce: bounceSquash(t - T_DROP),
        };
    }

    if (t < T_CLEAR) {
        return {
            ...still,
            ...NET_REST,
            spin: -230,
            bounce: 0.5 * bounceSquash(t - T_REST),
        };
    }

    if (t < T_SERVE) {
        return { ...still, ...NET_REST, visible: false };
    }

    return {
        ...still,
        ...arc(SERVE_DROP, HIT, t - T_SERVE, POINT - T_SERVE, GRAVITY),
    };
}

/** Where `t` falls in a player's stroke timeline, or at rest between strokes. */
function strokeAt(hits: number[], t: number): number {
    for (const hit of hits) {
        const stroke = t - hit + T_HIT;

        if (stroke >= 0 && stroke < STROKE) {
            return stroke;
        }
    }

    return STROKE - 0.4;
}

/** Extra body language after the point, layered on top of the stroke. */
function mood(side: number, t: number): { dy: number; dAngle: number } {
    if (side === 0) {
        // The winner bounces on the spot, waggling the paddle.
        const k = envelope(t, T_REST, T_CLEAR - 0.1, 0.15);
        const beat = ((t - T_REST) * Math.PI) / 0.36;

        return {
            dy: -12 * Math.abs(Math.sin(beat)) * k,
            dAngle: 8 * Math.sin(beat) * k,
        };
    }

    // The opponent's head hangs toward the net, then lifts for a wave: "let's play another".
    const droop = 30 * envelope(t, T_REST, 5.75, 0.4);
    const wave =
        14 *
        Math.sin(((t - 5.75) * Math.PI * 2) / 0.3) *
        envelope(t, 5.75, 6.6, 0.12);

    return { dy: 0, dAngle: droop + wave };
}

function bindDuel(svg: SVGSVGElement) {
    const players = (['left', 'right'] as const).map((name) => ({
        paddle: queryPart(svg, name),
        ghostNear: queryPart(svg, `${name}GhostNear`),
        ghostFar: queryPart(svg, `${name}GhostFar`),
        cheer: queryPart(svg, `${name}Cheer`),
        cheerText: queryPart(svg, `${name}CheerText`),
        sparkLeft: queryPart(svg, `${name}SparkLeft`),
        sparkRight: queryPart(svg, `${name}SparkRight`),
        word: '',
    }));
    const ball = ballParts(svg);
    const ring = queryPart(svg, 'ring');
    const net = queryPart(svg, 'net');
    const contacts = HITS.flatMap((hits, side) =>
        hits.map((at) => ({ at, x: side ? FAR_HIT.x : HIT.x })),
    );

    return (time: number) => {
        const t = mod(time, POINT);

        players.forEach((player, side) => {
            const stroke = strokeAt(HITS[side], t);
            const { dy, dAngle } = mood(side, t);
            const pose = (offset: number) => {
                const p = paddlePose(stroke - offset, PIVOT, STROKE);

                return `translate(${p.x} ${p.y + dy}) rotate(${p.angle + dAngle})`;
            };
            const blur = isFastSwing(stroke, STROKE) ? 1 : 0;

            player.paddle?.setAttribute('transform', pose(0));
            player.ghostNear?.setAttribute('transform', pose(0.018));
            player.ghostNear?.setAttribute('opacity', String(0.22 * blur));
            player.ghostFar?.setAttribute('transform', pose(0.036));
            player.ghostFar?.setAttribute('opacity', String(0.1 * blur));

            // The latest cheer for this player pops in, floats up, and fades before it ends.
            const cheer = CHEERS.filter(
                (c) => c.side === side && t >= c.start && t < c.end,
            ).at(-1);

            if (!cheer) {
                player.cheer?.setAttribute('opacity', '0');

                return;
            }

            if (cheer.word !== player.word && player.cheerText) {
                player.word = cheer.word;
                player.cheerText.textContent = cheer.word;

                // Sparks sit just outside the word, however long it is.
                const width =
                    player.cheerText instanceof SVGTextElement
                        ? player.cheerText.getComputedTextLength()
                        : 0;
                const spread = Math.max(0, width / 2 - 38);
                player.sparkLeft?.setAttribute(
                    'transform',
                    `translate(${-spread} 0)`,
                );
                player.sparkRight?.setAttribute(
                    'transform',
                    `translate(${spread} 0)`,
                );
            }

            const since = t - cheer.start;
            const pop =
                since < 0.12
                    ? 0.6 + 0.55 * (since / 0.12)
                    : since < 0.24
                      ? 1.15 - 0.15 * ((since - 0.12) / 0.12)
                      : 1;
            const x = cheer.x ?? CHEER_X;
            const y = 14 - 14 * easeOutCubic(clamp01(since / 0.95));

            player.cheer?.setAttribute(
                'transform',
                `translate(${side ? mirrorX(x) : x} ${y}) rotate(${side ? 6 : -6}) scale(${pop})`,
            );
            player.cheer?.setAttribute(
                'opacity',
                String(clamp01((cheer.end - t) / 0.35)),
            );
        });

        drawBall(ball, ballAt(t), GROUND);

        const contact = contacts
            .filter((c) => c.at <= t)
            .sort((a, b) => b.at - a.at)[0];
        const impact = contact ? clamp01((t - contact.at) / 0.1) : 1;
        ring?.setAttribute('cx', String(contact?.x ?? HIT.x));
        ring?.setAttribute('r', String(BALL_R + 10 * easeOutCubic(impact)));
        ring?.setAttribute(
            'opacity',
            impact < 1 ? String(0.55 * (1 - impact)) : '0',
        );

        // The net sways from its base when the ball slams into it.
        const sway =
            t >= T_NET && t < T_NET + 0.4
                ? 6 * Math.sin((t - T_NET) * 45) * (1 - (t - T_NET) / 0.4)
                : 0;
        net?.setAttribute(
            'transform',
            `translate(${NET_X} ${GROUND}) skewX(${sway}) translate(${-NET_X} ${-GROUND})`,
        );
    };
}

/** The winner celebrating while the opponent says "Nice game!": the clearest single frame. */
const STILL_FRAME = 5.2;

function Cheer({ name, big }: { name: string; big: boolean }) {
    return (
        <g data-part={`${name}Cheer`} opacity={0}>
            {/* Enlarged cheers sit a little higher so they clear the paddle heads. */}
            <g transform={big ? 'translate(0 -16) scale(1.5)' : undefined}>
                <g
                    stroke="#d4ed2a"
                    strokeWidth={2}
                    strokeLinecap="round"
                    opacity={0.8}
                >
                    <g data-part={`${name}SparkLeft`}>
                        <line x1={-46} y1={-16} x2={-54} y2={-24} />
                        <line x1={-50} y1={2} x2={-60} y2={2} />
                    </g>
                    <g data-part={`${name}SparkRight`}>
                        <line x1={46} y1={-16} x2={54} y2={-24} />
                        <line x1={50} y1={2} x2={60} y2={2} />
                    </g>
                </g>
                <text
                    data-part={`${name}CheerText`}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={22}
                    fontWeight={900}
                    letterSpacing={1}
                    fill="#d4ed2a"
                    stroke="#0a1c30"
                    strokeWidth={4}
                    paintOrder="stroke"
                    style={{ fontFamily: 'inherit' }}
                >
                    WIN!
                </text>
            </g>
        </g>
    );
}

/**
 * `bigCheers` enlarges the cheer words for small renderings (phones), where
 * the scene is scaled down and normal-size words would be too small to read.
 */
export function PaddleDuel({
    className,
    label = 'Two players playing a point of pickleball over the net',
    bigCheers = false,
}: {
    className?: string;
    label?: string;
    bigCheers?: boolean;
}) {
    const ids = useSceneIds();
    const svgRef = useRef<SVGSVGElement>(null);

    useSceneLoop(svgRef, bindDuel, STILL_FRAME);

    return (
        <svg
            ref={svgRef}
            viewBox={`0 -46 ${WIDTH} 206`}
            role="img"
            aria-label={label}
            className={cn('block h-auto w-full', className)}
        >
            <SceneDefs ids={ids} />

            {/* Court surface and baseline. */}
            <rect
                x={20}
                y={GROUND}
                width={WIDTH - 40}
                height={6}
                rx={3}
                fill="#4a7fa8"
                fillOpacity={0.35}
            />
            <line
                x1={20}
                x2={WIDTH - 20}
                y1={GROUND}
                y2={GROUND}
                stroke="currentColor"
                strokeOpacity={0.45}
                strokeWidth={1.5}
                strokeLinecap="round"
            />

            {/* Net: post, mesh and the white top tape. */}
            <g data-part="net">
                <rect
                    x={NET_X - 2}
                    y={NET_TOP - 6}
                    width={4}
                    height={GROUND - NET_TOP + 6}
                    rx={1.5}
                    fill="#cbd5e1"
                />
                <rect
                    x={NET_X - 7}
                    y={NET_TOP}
                    width={14}
                    height={GROUND - NET_TOP - 2}
                    fill="currentColor"
                    fillOpacity={0.2}
                />
                <g stroke="currentColor" strokeOpacity={0.55} strokeWidth={0.8}>
                    {Array.from(
                        { length: 10 },
                        (_, i) => NET_TOP + 4 + i * 5.5,
                    ).map((y) => (
                        <line
                            key={y}
                            x1={NET_X - 7}
                            x2={NET_X + 7}
                            y1={y}
                            y2={y}
                        />
                    ))}
                    <line
                        x1={NET_X - 3.5}
                        x2={NET_X - 3.5}
                        y1={NET_TOP}
                        y2={GROUND - 2}
                    />
                    <line
                        x1={NET_X + 3.5}
                        x2={NET_X + 3.5}
                        y1={NET_TOP}
                        y2={GROUND - 2}
                    />
                </g>
                <rect
                    x={NET_X - 8}
                    y={NET_TOP - 3}
                    width={16}
                    height={4}
                    rx={1}
                    fill="#fff"
                />
            </g>

            <ellipse
                data-part="shadow"
                cx={HIT.x}
                cy={GROUND + 1}
                rx={8}
                ry={2.2}
                fill="#000"
                opacity={0}
            />

            <SwingingPaddle faceId={ids.face} name="left" />
            <g transform={`translate(${WIDTH} 0) scale(-1 1)`}>
                <SwingingPaddle faceId={ids.face} name="right" />
            </g>

            <circle
                data-part="ring"
                cx={HIT.x}
                cy={HIT.y}
                r={BALL_R}
                fill="none"
                stroke="#d4ed2a"
                strokeWidth={2}
                opacity={0}
            />

            <BallArt ids={ids} />

            <Cheer name="left" big={bigCheers} />
            <Cheer name="right" big={bigCheers} />
        </svg>
    );
}
