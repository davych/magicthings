import type { FC } from "react";

export type PaperCharacterProps = {
  kind: "cow" | "horse";
  x: number;
  y: number;
  scale?: number;
  t: number;
  pose?:
    | "idle"
    | "walk"
    | "run"
    | "type"
    | "sleep"
    | "sit"
    | "dance"
    | "reach"
    | "hold";
  facing?: 1 | -1;
  mood?: "tired" | "happy" | "surprised";
};

type Point = readonly [number, number];

const INK = "#243A3B";
const PAPER = "#F3E9D2";
const COW = "#6B9090";
const HORSE = "#C5764F";
const CORAL = "#D86648";
const GOLD = "#D5AB53";

const Joint: FC<{
  a: Point;
  b: Point;
  c: Point;
  color: string;
  width: number;
}> = ({ a, b, c, color, width }) => {
  const d = `M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={INK} strokeWidth={width + 7} />
      <path d={d} stroke={color} strokeWidth={width} />
      <circle
        cx={b[0]}
        cy={b[1]}
        r={3}
        fill={INK}
        stroke="none"
        opacity={0.2}
      />
    </g>
  );
};

// All movement is a pure function of the composition's time; no independent clock.
export const PaperCharacter: FC<PaperCharacterProps> = ({
  kind,
  x,
  y,
  scale = 1,
  t,
  pose = "idle",
  facing = 1,
  mood = "tired",
}) => {
  const cow = kind === "cow";
  const fur = cow ? COW : HORSE;
  const shirt = cow ? PAPER : "#91A7A1";
  const moving = pose === "walk" || pose === "run";
  const dancing = pose === "dance";
  const seated = pose === "sit" || pose === "type";
  const sleeping = pose === "sleep";
  const pace = t * (pose === "run" ? 13 : cow ? 6 : 7.4);
  const stride = Math.sin(pace);
  const beat = Math.sin(t * 7);
  const breath = Math.sin(t * 2.2 + (cow ? 0 : 0.8));
  const bounce = moving
    ? -Math.abs(Math.cos(pace)) * (pose === "run" ? 13 : 4)
    : dancing
      ? -Math.abs(beat) * 10
      : breath * 1.7;
  const lean = pose === "run" ? 11 : sleeping ? 10 : dancing ? beat * 7 : 0;
  const hipWidth = cow ? 36 : 25;
  const shoulderWidth = cow ? 66 : 43;
  const shoulderY = cow ? -225 : -226;
  const blinkPhase = (((t + (cow ? 0 : 1.3)) % 4.3) + 4.3) % 4.3;
  const closed = sleeping || blinkPhase < 0.13;
  const headNod = sleeping
    ? 13 + breath * 4
    : pose === "type"
      ? 7
      : dancing
        ? -beat * 6
        : breath * 1.2;

  const legs = [-1, 1].map((side) => {
    const wave = stride * side;
    let knee: Point = [side * hipWidth, -70];
    let ankle: Point = [side * (hipWidth + 4), -16];
    if (moving) {
      const length = pose === "run" ? 56 : 35;
      knee = [
        side * hipWidth + wave * length * 0.8,
        -72 - Math.max(0, wave) * 24,
      ];
      ankle = [
        side * hipWidth + wave * length,
        -16 - Math.max(0, -wave) * (pose === "run" ? 52 : 25),
      ];
    } else if (seated) {
      knee = [side * hipWidth + 49, -114];
      ankle = [side * hipWidth + 60 + Math.sin(t * 3 + side) * 3, -16];
    } else if (dancing) {
      knee = [side * (hipWidth + 12) + beat * 12, -74];
      ankle = [side * (hipWidth + 22), -16 - Math.max(0, beat * side) * 20];
    } else if (sleeping) {
      knee = [side * hipWidth + 10, -66];
      ankle = [side * hipWidth + 15, -16];
    }
    return { side, knee, ankle };
  });

  const arms = [-1, 1].map((side) => {
    const shoulder: Point = [side * shoulderWidth, shoulderY];
    let elbow: Point = [side * (shoulderWidth + 14), -177];
    let hand: Point = [side * (shoulderWidth + 9), -125];
    if (moving) {
      elbow = [side * (shoulderWidth + 5) - stride * side * 21, -181];
      hand = [
        side * shoulderWidth - stride * side * 45,
        -137 - Math.max(0, stride * side) * 20,
      ];
    } else if (pose === "type") {
      elbow = [side * shoulderWidth + 25, -180];
      hand = [
        side * shoulderWidth + 83,
        -185 + Math.sin(t * 16 + side * 2) * 7,
      ];
    } else if (pose === "reach") {
      elbow = [side * shoulderWidth + 40, -259];
      hand = [side * shoulderWidth + 80, -296 + Math.sin(t * 3 + side) * 5];
    } else if (pose === "hold") {
      elbow = [side * (shoulderWidth + 10), -170];
      hand = [side * 27, -157 + breath * 2];
    } else if (seated) {
      elbow = [side * (shoulderWidth + 7), -175];
      hand = [side * 41 + 22, -125];
    } else if (dancing) {
      elbow = [side * (shoulderWidth + 28), -222 - beat * side * 28];
      hand = [side * (shoulderWidth + 58), -276 - beat * side * 40];
    } else if (sleeping) {
      elbow = [side * (shoulderWidth + 8), -180];
      hand = [side * 15 + 25, -160];
    }
    return { side, shoulder, elbow, hand };
  });

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale * facing} ${scale})`}
      stroke={INK}
      strokeWidth={5}
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <g transform={`translate(0 ${bounce}) rotate(${lean} 0 -130)`}>
        {/* A separate tail and bent, two-segment legs keep silhouettes alive. */}
        <path
          d={`M ${cow ? -66 : -40} -160 Q ${cow ? -112 : -79} -150 ${cow ? -101 : -72} ${-113 + breath * 8}`}
          fill="none"
          strokeWidth={8}
        />
        <path
          d={`M ${cow ? -103 : -74} ${-124 + breath * 8} l -7 19 l 18 -2 z`}
          fill={cow ? INK : "#864B36"}
          strokeWidth={3}
        />
        {legs.map(({ side, knee, ankle }) => (
          <g key={side}>
            <Joint
              a={[side * hipWidth, -132]}
              b={knee}
              c={ankle}
              width={cow ? 28 : 19}
              color={cow ? "#49686C" : "#47696B"}
            />
            <path
              d={`M ${ankle[0] - 15} ${ankle[1] - 5} Q ${ankle[0]} ${ankle[1] - 12} ${ankle[0] + 11} ${ankle[1] - 4} L ${ankle[0] + 27} ${ankle[1] + 3} Q ${ankle[0] + 34} ${ankle[1] + 16} ${ankle[0] + 18} ${ankle[1] + 16} L ${ankle[0] - 17} ${ankle[1] + 16} Z`}
              fill={INK}
              strokeWidth={3}
            />
            <path
              d={`M ${ankle[0] - 12} ${ankle[1] + 10} L ${ankle[0] + 25} ${ankle[1] + 10}`}
              stroke={PAPER}
              strokeWidth={2}
              opacity={0.45}
            />
          </g>
        ))}

        {!cow && (
          <path d="M -30 -211 L -33 -317 L 15 -330 L 31 -214 Z" fill={fur} />
        )}
        <path
          d={
            cow
              ? "M -60 -244 Q -82 -228 -77 -180 L -69 -122 Q 0 -108 72 -124 L 77 -204 Q 76 -233 56 -244 Z"
              : "M -36 -249 Q -55 -236 -50 -197 L -42 -128 Q 3 -116 49 -131 L 49 -213 Q 49 -237 31 -249 Z"
          }
          fill={INK}
          opacity={0.13}
          transform="translate(6 7)"
          stroke="none"
        />
        <path
          d={
            cow
              ? "M -60 -244 Q -82 -228 -77 -180 L -69 -122 Q 0 -108 72 -124 L 77 -204 Q 76 -233 56 -244 Z"
              : "M -36 -249 Q -55 -236 -50 -197 L -42 -128 Q 3 -116 49 -131 L 49 -213 Q 49 -237 31 -249 Z"
          }
          fill={shirt}
        />
        <path
          d={
            cow
              ? "M -70 -139 Q 0 -127 72 -140 L 72 -124 Q 0 -108 -69 -122 Z"
              : "M -43 -145 L 48 -147 L 49 -131 Q 3 -116 -42 -128 Z"
          }
          fill="#49686C"
          strokeWidth={3}
        />
        <path
          d={
            cow
              ? "M -31 -243 L -2 -214 L 14 -238 M 40 -242 L 18 -213 L -2 -236"
              : "M -22 -245 L 0 -220 L 19 -246 M 0 -220 L 27 -226"
          }
          fill={PAPER}
          strokeWidth={3}
        />
        <path
          d={`M ${cow ? 8 : 5} -225 L ${cow ? 20 : 15} -216 L ${cow ? 18 : 11 + beat * 3} -177 L ${cow ? 6 : -1 + beat * 3} -188 Z`}
          fill={cow ? CORAL : PAPER}
          strokeWidth={3}
        />
        <path
          d={
            cow
              ? "M -54 -184 L -23 -183 L -25 -162 L -50 -162 Z"
              : "M -35 -183 L -12 -183 L -14 -162 L -32 -162 Z"
          }
          fill="none"
          strokeWidth={2.5}
        />
        <path
          d={
            cow
              ? "M 65 -169 L 70 -139 L 48 -143 Z"
              : "M 41 -175 L 46 -148 L 28 -152 Z"
          }
          fill={cow ? "#E3D8BD" : "#748F89"}
          strokeWidth={2}
        />
        <path
          d="M 22 -239 L 40 -195 L 31 -153"
          fill="none"
          stroke={cow ? "#537F82" : "#42666A"}
          strokeWidth={4}
        />
        <g
          transform={`rotate(${moving ? stride * 12 : dancing ? beat * 16 : breath * 2} 31 -157)`}
        >
          <rect
            x={18}
            y={-163}
            width={30}
            height={39}
            rx={4}
            fill={PAPER}
            strokeWidth={2.5}
          />
          <rect
            x={18}
            y={-163}
            width={30}
            height={9}
            rx={3}
            fill={cow ? CORAL : GOLD}
            stroke="none"
          />
          <circle cx={29} cy={-145} r={5} fill={fur} strokeWidth={1.5} />
          <path
            d="M 24 -132 L 42 -132 M 36 -147 L 42 -147 M 36 -141 L 42 -141"
            strokeWidth={1.8}
          />
        </g>

        {arms.map(({ side, shoulder, elbow, hand }) => (
          <g key={side}>
            <Joint
              a={shoulder}
              b={elbow}
              c={hand}
              width={cow ? 24 : 17}
              color={fur}
            />
            <path
              d={`M ${shoulder[0]} ${shoulder[1]} L ${elbow[0]} ${elbow[1]}`}
              fill="none"
              stroke={INK}
              strokeWidth={cow ? 34 : 27}
            />
            <path
              d={`M ${shoulder[0]} ${shoulder[1]} L ${elbow[0]} ${elbow[1]}`}
              fill="none"
              stroke={shirt}
              strokeWidth={cow ? 27 : 20}
            />
            <path
              d={`M ${elbow[0] - 10} ${elbow[1] - 1} L ${elbow[0] + 9} ${elbow[1] + 2}`}
              strokeWidth={2.5}
              opacity={0.55}
            />
            <ellipse
              cx={hand[0]}
              cy={hand[1]}
              rx={cow ? 16 : 12}
              ry={cow ? 19 : 15}
              fill={fur}
              strokeWidth={3.5}
              transform={`rotate(${side * 12} ${hand[0]} ${hand[1]})`}
            />
            <path d={`M ${hand[0]} ${hand[1] + 6} l 0 9`} strokeWidth={2} />
          </g>
        ))}

        <g
          transform={`translate(${cow ? 0 : 1} ${cow ? -300 : -326}) rotate(${headNod} 0 29)`}
        >
          {cow ? (
            <>
              <path
                d="M -58 -58 Q -82 -72 -83 -102 L -61 -93 L -41 -59"
                fill={PAPER}
              />
              <path
                d="M 44 -61 Q 88 -82 79 -110 Q 111 -87 92 -60 L 64 -43"
                fill={PAPER}
              />
              <path
                d="M -62 -87 L -51 -64 M 82 -83 Q 89 -73 78 -64"
                fill="none"
                stroke={GOLD}
                strokeWidth={6}
              />
              <g transform={`rotate(${breath * 6 - 7} -73 -30)`}>
                <path
                  d="M -70 -39 Q -114 -67 -125 -32 Q -115 -4 -75 -10 Z"
                  fill={fur}
                />
                <path
                  d="M -87 -28 Q -105 -43 -113 -31 L -98 -19 Z"
                  fill="#C28A78"
                  stroke="none"
                />
              </g>
              <g transform={`rotate(${-breath * 5 + 9} 72 -31)`}>
                <path
                  d="M 69 -42 Q 108 -62 120 -31 Q 111 -10 74 -12 Z"
                  fill={fur}
                />
                <path
                  d="M 87 -29 Q 104 -42 110 -29 L 97 -21 Z"
                  fill="#C28A78"
                  stroke="none"
                />
              </g>
              <path
                d="M -80 -40 Q -78 -82 -31 -81 Q 0 -89 35 -78 Q 79 -75 86 -35 L 82 27 Q 65 68 0 69 Q -65 67 -83 26 Z"
                fill={fur}
              />
              <path
                d="M -45 -75 Q -13 -94 19 -78 L 6 -60 L -12 -66 L -30 -54 Z"
                fill="#426A6D"
                strokeWidth={3}
              />
              <path
                d="M -76 5 Q -49 -16 0 -9 Q 58 -15 82 8 L 85 40 Q 70 72 3 73 Q -65 72 -83 42 Z"
                fill={PAPER}
              />
              <ellipse
                cx={-35}
                cy={28}
                rx={8}
                ry={5}
                fill={INK}
                stroke="none"
                transform="rotate(-18 -35 28)"
              />
              <ellipse
                cx={38}
                cy={27}
                rx={8}
                ry={5}
                fill={INK}
                stroke="none"
                transform="rotate(18 38 27)"
              />
              <path
                d="M -72 11 L -58 6 M 62 7 L 74 12"
                stroke="#D7C9AA"
                strokeWidth={3}
              />
              {[-34, 34].map((eyeX) => (
                <g key={eyeX}>
                  {closed || mood === "happy" ? (
                    <path
                      d={`M ${eyeX - 12} -26 Q ${eyeX} ${mood === "happy" && !closed ? -38 : -18} ${eyeX + 12} -26`}
                      fill="none"
                      strokeWidth={4}
                    />
                  ) : (
                    <>
                      <ellipse
                        cx={eyeX}
                        cy={-28}
                        rx={13}
                        ry={mood === "surprised" ? 17 : 13}
                        fill={PAPER}
                        strokeWidth={3}
                      />
                      <ellipse
                        cx={eyeX + 3}
                        cy={mood === "tired" ? -23 : -28}
                        rx={4}
                        ry={6}
                        fill={INK}
                        stroke="none"
                      />
                      {mood === "tired" && (
                        <path
                          d={`M ${eyeX - 13} -31 L ${eyeX + 13} -31`}
                          stroke={fur}
                          strokeWidth={8}
                        />
                      )}
                    </>
                  )}
                  <path
                    d={`M ${eyeX - 12} -49 L ${eyeX + 9} ${mood === "surprised" ? -55 : -47}`}
                    strokeWidth={4}
                  />
                </g>
              ))}
              {mood === "surprised" || (dancing && mood === "happy") ? (
                <ellipse
                  cx={3}
                  cy={52}
                  rx={10}
                  ry={7 + Math.abs(beat) * 5}
                  fill={INK}
                  strokeWidth={2}
                />
              ) : (
                <path
                  d={
                    mood === "happy"
                      ? "M -19 49 Q 3 66 26 47"
                      : "M -11 53 Q 3 48 18 51"
                  }
                  fill="none"
                  strokeWidth={3}
                />
              )}
            </>
          ) : (
            <>
              <path
                d="M -29 -41 Q -66 -79 -48 -99 Q -24 -103 -10 -48"
                fill={fur}
                transform={`rotate(${breath * 4} -20 -45)`}
              />
              <path
                d="M 3 -49 Q 9 -102 31 -101 Q 44 -78 26 -42"
                fill={fur}
                transform={`rotate(${-breath * 4} 13 -46)`}
              />
              <path
                d="M -43 -87 L -25 -57 M 24 -88 L 15 -58"
                stroke="#A65940"
                strokeWidth={6}
              />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <path
                  key={i}
                  d={`M -33 ${-53 + i * 21} L ${-69 - Math.sin(t * 5 + i * 0.9) * (moving ? 8 : 2)} ${-67 + i * 21} L -58 ${-29 + i * 21} L -27 ${-22 + i * 21} Z`}
                  fill={i % 2 ? "#8F503A" : "#A75A3E"}
                  strokeWidth={3}
                />
              ))}
              <path
                d="M -33 -45 Q -18 -69 14 -64 Q 50 -58 55 -24 L 64 8 Q 102 14 105 43 Q 107 75 71 82 L -8 73 Q -34 67 -38 37 Z"
                fill={fur}
              />
              <path
                d="M 29 9 Q 66 1 95 24 Q 115 42 101 67 Q 77 91 15 72 L -1 51 Z"
                fill="#E4BB8E"
              />
              <path
                d="M -24 -49 L -10 -61 L 7 -50 L -7 -21 L -20 -27 Z"
                fill={PAPER}
                strokeWidth={2.5}
              />
              <ellipse
                cx={79}
                cy={36}
                rx={7}
                ry={5}
                fill={INK}
                stroke="none"
                transform="rotate(-22 79 36)"
              />
              {closed || mood === "happy" ? (
                <path
                  d={`M -7 -15 Q 4 ${mood === "happy" && !closed ? -27 : -6} 18 -15`}
                  fill="none"
                  strokeWidth={4}
                />
              ) : (
                <>
                  <ellipse
                    cx={7}
                    cy={-17}
                    rx={13}
                    ry={mood === "surprised" ? 18 : 14}
                    fill={PAPER}
                    strokeWidth={3}
                  />
                  <ellipse
                    cx={11}
                    cy={mood === "tired" ? -12 : -17}
                    rx={4}
                    ry={6}
                    fill={INK}
                    stroke="none"
                  />
                  {mood === "tired" && (
                    <path d="M -5 -21 L 19 -21" stroke={fur} strokeWidth={8} />
                  )}
                </>
              )}
              <path
                d={
                  mood === "surprised"
                    ? "M -5 -42 L 17 -46"
                    : "M -8 -38 L 15 -35"
                }
                fill="none"
                strokeWidth={4}
              />
              <path d="M -7 9 L 15 13" stroke="#99533D" strokeWidth={3} />
              {mood === "surprised" || (dancing && mood === "happy") ? (
                <ellipse
                  cx={69}
                  cy={63}
                  rx={9}
                  ry={5 + Math.abs(beat) * 5}
                  fill={INK}
                  strokeWidth={2}
                />
              ) : (
                <path
                  d={
                    mood === "happy"
                      ? "M 47 60 Q 67 76 87 56"
                      : "M 52 65 L 77 63"
                  }
                  fill="none"
                  strokeWidth={3}
                />
              )}
            </>
          )}
        </g>
      </g>
    </g>
  );
};
