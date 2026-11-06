import type { FC, ReactNode } from "react";
import { Audio } from "@remotion/media";
import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  cancelRender,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PaperCharacter } from "./Characters";
import { Clock, Cloud, Desk, ExitDoor, PaperRail, Printer } from "./World";
import { captions } from "./lyrics";

loadFont({
  family: "NiumaSans",
  url: staticFile("fonts/NotoSansSC.ttf"),
}).catch(cancelRender);

const C = {
  paper: "#F3E9D2",
  light: "#FBF5E7",
  ink: "#243A3B",
  teal: "#6B9090",
  coral: "#D86648",
  gold: "#D5AB53",
  night: "#233E43",
};
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const barSeconds = (4 * 60) / 112;
const useTime = () => useCurrentFrame() / useVideoConfig().fps;
const font = '"NiumaSans", sans-serif';

const Paper: FC<{ color?: string }> = ({ color = C.paper }) => (
  <>
    <defs>
      <pattern
        id="paper-fibers"
        width="131"
        height="107"
        patternUnits="userSpaceOnUse"
      >
        <path
          d="M8 17h10m65 20h8M39 79l8-1m64-15h5M15 99h3M112 7h9"
          stroke={C.ink}
          strokeWidth="1"
          opacity=".1"
        />
        <circle cx="54" cy="43" r="1" fill={C.ink} opacity=".14" />
        <circle cx="106" cy="92" r="1" fill={C.ink} opacity=".1" />
      </pattern>
    </defs>
    <rect width="1920" height="1080" fill={color} />
    <rect width="1920" height="1080" fill="url(#paper-fibers)" />
  </>
);

const FilmFrame: FC<{
  children: ReactNode;
  color?: string;
  chapter: string;
  chapterColor?: string;
}> = ({ children, color, chapter, chapterColor }) => {
  const t = useTime();
  return (
    <AbsoluteFill style={{ background: color ?? C.paper }}>
      <svg
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        style={{ fontFamily: font }}
      >
        <Paper color={color} />
        {children}
        <g
          fill={chapterColor ?? (color === C.night ? C.paper : C.ink)}
          opacity=".65"
        >
          <text
            x="106"
            y="104"
            fontSize="25"
            fontWeight="600"
            letterSpacing="4"
          >
            {chapter}
          </text>
          <path
            d="M106 126h76"
            stroke={chapterColor ?? (color === C.night ? C.paper : C.ink)}
            strokeWidth="2"
          />
        </g>
        <rect
          x="0"
          y="0"
          width="1920"
          height="1080"
          fill={C.paper}
          opacity={interpolate(t, [0, 0.22], [1, 0], clamp)}
          pointerEvents="none"
        />
      </svg>
    </AbsoluteFill>
  );
};

const Note: FC<{
  x: number;
  y: number;
  text: string;
  rotate?: number;
  fill?: string;
}> = ({ x, y, text, rotate = -5, fill = C.light }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <path
      d="M-116-48H99l18 18V48H-116Z"
      fill={fill}
      stroke={C.ink}
      strokeWidth="3"
    />
    <path d="M99-48v19h18" fill="none" stroke={C.ink} strokeWidth="2" />
    <text
      y="13"
      textAnchor="middle"
      fontSize="32"
      fill={C.ink}
      fontWeight="700"
    >
      {text}
    </text>
  </g>
);

const Boat: FC<{ x: number; y: number; scale?: number; angle?: number }> = ({
  x,
  y,
  scale = 1,
  angle = 0,
}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}
    stroke={C.ink}
    strokeWidth="4"
    strokeLinejoin="round"
  >
    <path d="M-110 0 0-92 105 0 55 50H-58Z" fill={C.light} />
    <path d="M-110 0H105L0 23Z" fill={C.gold} />
    <path d="M0-92v115L-58 50M0 23l55 27" fill="none" />
    <path d="m-45-35 22-20m-8 35 20-18" strokeWidth="2" opacity=".3" />
  </g>
);

const Opening: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="一首关于下班的纸上小歌">
      <circle cx="1530" cy="390" r="310" fill={C.gold} opacity=".5" />
      <path
        d="m1230 188 40 10m420 90 54-8m-270-175 8 40"
        stroke={C.ink}
        strokeWidth="4"
      />
      <g
        transform={`translate(${interpolate(t, [0, 1.1], [-100, 0], clamp)} 0)`}
      >
        <text
          x="154"
          y="331"
          fontSize="146"
          fontWeight="900"
          fill={C.ink}
          letterSpacing="-6"
        >
          下班还有
        </text>
        <text
          x="145"
          y="525"
          fontSize="187"
          fontWeight="900"
          fill={C.ink}
          letterSpacing="-9"
        >
          几厘米
        </text>
        <path
          d="M163 567q222-28 535-4"
          stroke={C.coral}
          strokeWidth="13"
          fill="none"
          strokeLinecap="round"
        />
        <text x="166" y="652" fontSize="34" fill={C.ink} letterSpacing="5">
          今天的路，好像又长了一点。
        </text>
        <text
          x="168"
          y="717"
          fontSize="25"
          fill={C.ink}
          opacity=".63"
          letterSpacing="3"
        >
          原创纸片动画 · 02:00
        </text>
      </g>
      <ExitDoor x={1700} y={600} scale={0.46} />
      <PaperRail t={t} y={870} speed={50} />
      <PaperCharacter
        kind="cow"
        x={1210 + Math.sin(t * 2) * 8}
        y={867}
        scale={1.03}
        t={t}
        pose="walk"
      />
      <PaperCharacter
        kind="horse"
        x={1510 + Math.sin(t * 2 + 1) * 10}
        y={867}
        scale={1.04}
        t={t + 1}
        pose="walk"
      />
      <g transform={`translate(1670 724) rotate(${Math.sin(t * 3) * 4})`}>
        <path
          d="M-49-33h97v66h-97Z"
          fill={C.coral}
          stroke={C.ink}
          strokeWidth="3"
        />
        <text
          textAnchor="middle"
          y="9"
          fontSize="24"
          fill={C.light}
          fontWeight="800"
        >
          还差一点
        </text>
      </g>
      <text x="106" y="1008" fontSize="24" fill={C.ink} opacity=".7">
        AI 辅助原创动画 · 原创词曲 · AI 合成歌声：绮萱 / DiffSinger
      </text>
    </FilmFrame>
  );
};

const Commute: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="01 / 早晨被装进格子" color={C.night}>
      <rect
        x="-30"
        y="190"
        width="1980"
        height="674"
        rx="65"
        fill={C.teal}
        stroke={C.ink}
        strokeWidth="8"
      />
      <path d="M-20 270H1940M-20 806H1940" stroke={C.ink} strokeWidth="8" />
      <rect
        x="756"
        y="208"
        width="408"
        height="78"
        rx="10"
        fill={C.paper}
        stroke={C.ink}
        strokeWidth="4"
      />
      <text
        x="960"
        y="259"
        textAnchor="middle"
        fontSize="37"
        fontWeight="800"
        fill={C.ink}
      >
        下一站：工位
      </text>
      {[150, 755, 1360].map((x, index) => (
        <g key={x}>
          <rect
            x={x}
            y="330"
            width="410"
            height="317"
            rx="32"
            fill={C.paper}
            stroke={C.ink}
            strokeWidth="9"
          />
          <svg
            x={x + 10}
            y="341"
            width="390"
            height="294"
            viewBox="0 0 390 294"
            overflow="hidden"
          >
            <rect width="390" height="294" fill="#D7D8BC" />
            <circle cx="300" cy="76" r="45" fill={C.gold} />
            {Array.from({ length: 8 }, (_, n) => {
              const bx =
                ((((n * 100 - t * 95 + index * 30) % 800) + 800) % 800) - 220;
              return (
                <g key={n} transform={`translate(${bx} 0)`}>
                  <path
                    d={`M0 294V${100 + (n % 3) * 27}h76V294Z`}
                    fill={n % 2 ? C.teal : C.ink}
                    opacity=".57"
                  />
                  <path
                    d={`M15 ${150 + (n % 3) * 20}h12m15 0h12m-39 22h12m15 0h12`}
                    stroke={C.paper}
                    strokeWidth="7"
                  />
                </g>
              );
            })}
            <path d="M0 267H390" stroke={C.ink} strokeWidth="5" />
          </svg>
        </g>
      ))}
      {[350, 640, 1280, 1570].map((x, index) => (
        <g
          key={x}
          transform={`rotate(${Math.sin(t * 2.7 + index) * 5} ${x} 278)`}
          stroke={C.ink}
          strokeWidth="7"
          fill={C.paper}
        >
          <path d={`M${x} 278v89`} />
          <path d={`M${x - 34} 377q34-32 68 0l-8 49h-52Z`} />
        </g>
      ))}
      <path
        d="M0 736H1920v125H0Z"
        fill={C.coral}
        stroke={C.ink}
        strokeWidth="6"
      />
      <g
        transform={`translate(${Math.sin(t * 2.7) * 7} 0) rotate(${Math.sin(t * 2.7) * 1.2} 960 850)`}
      >
        <PaperCharacter
          kind="cow"
          x={630}
          y={866}
          scale={1.15}
          t={t}
          pose="sleep"
        />
        <PaperCharacter
          kind="horse"
          x={1200}
          y={866}
          scale={1.14}
          t={t + 1}
          pose="idle"
        />
      </g>
      <PaperRail t={t} y={876} speed={145} />
      <Note x={1538} y={729} text="人醒了，魂没到" rotate={4} />
    </FilmFrame>
  );
};

const Work: FC = () => {
  const t = useTime();
  const close = interpolate(t, [7.9, 9], [0, 1], clamp);
  const pulse = ((t * 112) / 60) % 1;
  return (
    <FilmFrame chapter="02 / 再改最后一版">
      <g
        transform={`translate(${-close * 115} ${-close * 50}) scale(${1 + close * 0.1})`}
      >
        <path
          d="M100 178H1805V818H100Z"
          fill="#DDD8C2"
          stroke={C.ink}
          strokeWidth="5"
        />
        <path
          d="M100 406H1805M100 638H1805M505 178V818M1000 178V818M1430 178V818"
          stroke={C.ink}
          opacity=".15"
          strokeWidth="3"
        />
        <rect
          x="1334"
          y="224"
          width="380"
          height="330"
          fill={C.paper}
          stroke={C.ink}
          strokeWidth="7"
        />
        <circle
          cx={1450 + Math.sin(t * 0.3) * 38}
          cy="354"
          r="66"
          fill={C.gold}
        />
        <Cloud x={1543 - t * 7} y={334} scale={0.7} />
        <path d="M1518 224v330m-184-165h380" stroke={C.ink} strokeWidth="5" />
        <Clock x={1090} y={292} t={t * 3} radius={76} />
        <PaperRail t={t} y={834} speed={52 + close * 120} />
        <PaperCharacter
          kind="cow"
          x={448}
          y={836}
          t={t}
          scale={1.03}
          pose="type"
        />
        <PaperCharacter
          kind="horse"
          x={1000}
          y={836}
          t={t + 0.8}
          scale={1.02}
          pose="type"
        />
        <Desk x={335} y={845} t={t} scale={1.05} />
        <Desk x={884} y={845} t={t + 0.5} scale={1.05} />
        <Printer x={1435} y={840} t={t * 1.2} scale={0.6} />
        {Array.from({ length: 4 }, (_, i) => (
          <Note
            key={i}
            x={1410 - ((t * 95 + i * 310) % 1160)}
            y={658 - Math.sin(t * 2 + i) * 18}
            text={["再改一版", "就动一点", "今天要哦", "收到收到"][i]}
            rotate={Math.sin(t + i) * 8}
          />
        ))}
        {t > 8.5 && (
          <g
            transform={`translate(1100 180) rotate(-4) scale(${1 + Math.max(0, 0.3 - pulse) * 0.08})`}
          >
            <rect
              x="-310"
              y="-60"
              width="620"
              height="125"
              fill={C.coral}
              stroke={C.ink}
              strokeWidth="5"
            />
            <text
              y="22"
              textAnchor="middle"
              fontSize="58"
              fill={C.paper}
              fontWeight="900"
            >
              最后一版，第 {Math.floor((t - 8.5) / 1.5) + 1} 次
            </text>
          </g>
        )}
      </g>
    </FilmFrame>
  );
};

const Chase: FC = () => {
  const t = useTime();
  const second = t > 8.57;
  const distance = 12 + Math.floor(t / 2.14) * 8;
  return (
    <FilmFrame chapter="03 / 门又远了一截" color={C.gold}>
      <circle cx="940" cy="460" r="420" fill={C.paper} opacity=".35" />
      <g opacity=".12" stroke={C.ink} strokeWidth="5">
        {Array.from({ length: 16 }, (_, n) => (
          <path key={n} d={`M${n * 180 - 380} 190l-180 660`} />
        ))}
      </g>
      <g transform={second ? "translate(-50 90) scale(1.05)" : undefined}>
        {second && (
          <path
            d="M260 788C260 520 1410 505 1410 788s-1150 255-1150 0Z"
            fill={C.teal}
            stroke={C.ink}
            strokeWidth="9"
          />
        )}
        <PaperRail t={t} y={835} speed={second ? 420 : 290} />
        <ExitDoor
          x={1570 + Math.sin(t * 1.4) * 62}
          y={831}
          scale={second ? 0.68 : 0.84}
        />
        <PaperCharacter
          kind="cow"
          x={655 + Math.sin(t * 2) * 35}
          y={832}
          scale={1.14}
          t={t}
          pose="run"
          mood="surprised"
        />
        <PaperCharacter
          kind="horse"
          x={1010 + Math.sin(t * 2 + 1) * 40}
          y={832}
          scale={1.15}
          t={t + 0.3}
          pose="run"
          mood="surprised"
        />
      </g>
      <g transform="translate(175 199) rotate(-4)">
        <rect
          x="-28"
          y="-70"
          width="647"
          height="176"
          fill={C.paper}
          stroke={C.ink}
          strokeWidth="5"
        />
        <text x="0" y="0" fontSize="32" fill={C.ink} letterSpacing="5">
          距 离 下 班
        </text>
        <text x="-2" y="75" fontSize="86" fill={C.coral} fontWeight="900">
          {distance} 厘米
        </text>
        <path
          d="M435 23v44m-20-23 20-21 21 21"
          fill="none"
          stroke={C.coral}
          strokeWidth="9"
        />
      </g>
      <Note
        x={1517}
        y={258 + Math.sin(t * 3) * 9}
        text={second ? "又续了一页" : "明明就在前面"}
        rotate={8}
      />
      {Array.from({ length: 3 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${1710 - ((t * 230 + i * 490) % 1720)} ${420 + i * 70}) rotate(${t * 30 + i * 70})`}
        >
          <path
            d="M-20-27h40v54h-40Z"
            fill={C.light}
            stroke={C.ink}
            strokeWidth="2"
          />
          <path
            d="M-11-11h20m-20 9h17m-17 9h20"
            stroke={C.ink}
            strokeWidth="2"
            opacity=".45"
          />
        </g>
      ))}
    </FilmFrame>
  );
};

const Lunch: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="04 / 午饭等到凉了">
      <rect
        x="245"
        y="198"
        width="1429"
        height="616"
        rx="18"
        fill="#D6D6BB"
        stroke={C.ink}
        strokeWidth="5"
      />
      <path
        d="M960 200v610"
        stroke={C.ink}
        strokeWidth="3"
        strokeDasharray="9 12"
        opacity=".2"
      />
      <Clock x={960} y={320} t={t * 4} radius={78} />
      <PaperRail t={t} y={840} speed={45} />
      <PaperCharacter
        kind="cow"
        x={572}
        y={831}
        t={t}
        scale={1.04}
        pose="sit"
      />
      <PaperCharacter
        kind="horse"
        x={1335}
        y={831}
        t={t}
        scale={1.05}
        pose="sit"
        facing={-1}
      />
      <path
        d="M455 685Q965 540 1470 685v62q-510 140-1015 0Z"
        fill={C.gold}
        stroke={C.ink}
        strokeWidth="7"
      />
      <path d="M583 752v83m742-83v83" stroke={C.ink} strokeWidth="20" />
      {[760, 1145].map((x, i) => (
        <g key={x} transform={`translate(${x} 650)`}>
          <ellipse
            rx="76"
            ry="30"
            fill={C.light}
            stroke={C.ink}
            strokeWidth="4"
          />
          <path
            d="M-76 0q7 75 76 75t76-75"
            fill={C.teal}
            stroke={C.ink}
            strokeWidth="4"
          />
          <path d="M-24-10h47m-52 13h58" stroke={C.coral} strokeWidth="7" />
          <g opacity={interpolate(t, [0, 5], [0.8, 0], clamp)}>
            <path
              d={`M-25-40q-20-23 0-42t0-43M11-40q20-23 0-42t0-43`}
              fill="none"
              stroke={C.paper}
              strokeWidth="8"
              transform={`translate(0 ${-((t + i) % 1) * 12})`}
            />
          </g>
        </g>
      ))}
      <Boat
        x={960 + interpolate(t, [3, 8], [0, 155], clamp)}
        y={714 - interpolate(t, [3, 8], [0, 65], clamp)}
        scale={0.3}
        angle={Math.sin(t * 2) * 7}
      />
      <Note x={1510} y={280} text="边吃边开？" rotate={8} />
    </FilmFrame>
  );
};

const Meeting: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="05 / 没说完的话，折成纸船" color="#D4D8BC">
      <path
        d="M130 190h1660v645H130Z"
        fill={C.paper}
        stroke={C.ink}
        strokeWidth="5"
      />
      <path
        d="M238 284h150m35 0h150m35 0h150m35 0h150"
        stroke={C.teal}
        strokeWidth="19"
      />
      <text x="240" y="380" fontSize="58" fontWeight="900" fill={C.ink}>
        最后，再补充一点。
      </text>
      <g
        transform={`translate(1570 320) rotate(${Math.sin(t * 5) * 5})`}
        fill={C.coral}
        stroke={C.ink}
        strokeWidth="5"
      >
        <path d="M-70-40h45l100-52V93L-25 40h-45Z" />
        <path d="M-28 40 0 128h-50l-15-88Z" />
        <path
          d="M103-56q40 56 0 112m21-145q72 87 0 177"
          fill="none"
          opacity={0.3 + Math.max(0, Math.sin(t * 7)) * 0.6}
        />
      </g>
      <PaperRail t={t} y={845} speed={42} />
      <PaperCharacter kind="cow" x={570} y={839} t={t} scale={1} pose="sit" />
      <PaperCharacter
        kind="horse"
        x={1175}
        y={839}
        t={t}
        scale={1}
        pose="hold"
      />
      <path
        d="M240 700 1420 628l256 116-1144 88Z"
        fill={C.teal}
        stroke={C.ink}
        strokeWidth="6"
      />
      <path d="m530 833-9 40m903-70 9 70" stroke={C.ink} strokeWidth="18" />
      {Array.from({ length: 5 }, (_, i) => (
        <Note
          key={i}
          x={955 + Math.sin(t * 0.6 + i) * 40}
          y={625 - i * 60 - Math.min(t * 14, 75)}
          rotate={i % 2 ? 7 : -7}
          text={["小小建议", "再说一句", "最后一点", "补充一下", "顺便提提"][i]}
          fill={i % 2 ? C.light : "#E7D29D"}
        />
      ))}
      <Boat
        x={1260 - t * 45}
        y={714 - Math.sin(t) * 20}
        scale={0.37}
        angle={Math.sin(t * 2) * 8}
      />
    </FilmFrame>
  );
};

const Jam: FC = () => {
  const t = useTime();
  const stopped = t > 2.14;
  return (
    <FilmFrame chapter="06 / 机器终于卡纸了" color={C.night}>
      <g opacity=".13" stroke={C.paper} strokeWidth="3">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${i * 230 - 80} 210v510`} />
        ))}
      </g>
      <text
        x="960"
        y="291"
        textAnchor="middle"
        fontSize={t < 8 ? 118 : 91}
        fontWeight="900"
        fill={C.paper}
        letterSpacing="7"
      >
        {t < 8 ? "卡。住。了。" : "那就，停一停。"}
      </text>
      <g transform={`translate(${stopped ? 0 : Math.sin(t * 45) * 10} 0)`}>
        <PaperRail t={stopped ? 2.14 : t} y={855} speed={150} />
        <Printer
          x={727}
          y={852}
          t={stopped ? 2.14 : t * 5}
          jammed={stopped}
          scale={1.03}
        />
        <path
          d="M811 480 770 392l77 34-23-77 88 71 22-68 50 99 67-34-22 104"
          fill={C.paper}
          stroke={C.coral}
          strokeWidth="6"
          strokeLinejoin="round"
        />
      </g>
      <PaperCharacter
        kind="cow"
        x={444}
        y={851}
        t={t}
        scale={1.07}
        pose={t < 8 ? "reach" : "sit"}
        mood={t < 8 ? "surprised" : "tired"}
      />
      <PaperCharacter
        kind="horse"
        x={1420}
        y={851}
        t={t}
        scale={1.07}
        pose={t < 8 ? "reach" : "sit"}
        facing={-1}
        mood={t < 8 ? "surprised" : "happy"}
      />
      {t > 10 && (
        <g opacity={interpolate(t, [10, 12], [0, 1], clamp)}>
          <circle cx="960" cy="790" r="14" fill={C.gold} />
          <path
            d="M850 798h220m-210 28h200M884 769v86m43-86v86m43-86v86m43-86v86"
            stroke={C.ink}
            strokeWidth="2"
            opacity=".7"
          />
        </g>
      )}
    </FilmFrame>
  );
};

const Bridge: FC = () => {
  const t = useTime();
  const unfolding = interpolate(t, [1, 7], [0, 1], clamp);
  const seated = t > 8.5;
  return (
    <FilmFrame
      chapter="07 / 留一点，给我们自己"
      color={C.night}
      chapterColor={unfolding > 0.6 ? C.ink : C.paper}
    >
      <rect
        x="0"
        y="0"
        width="1920"
        height="1080"
        fill="#D9C09B"
        opacity={unfolding}
      />
      <circle
        cx="1475"
        cy="351"
        r={170 * unfolding}
        fill={C.coral}
        opacity=".85"
      />
      <g opacity={unfolding}>
        <Cloud x={1450 - t * 11} y={270} scale={1.5} />
        <Cloud x={340 + t * 6} y={500} scale={0.7} />
        <Cloud x={1710 - t * 5} y={530} scale={0.8} />
      </g>
      <path
        d={`M-100 861Q960 ${850 - 440 * unfolding} 2020 861L2020 1080H-100Z`}
        fill={C.paper}
        stroke={C.ink}
        strokeWidth="7"
      />
      <path
        d={`M-100 900Q960 ${889 - 440 * unfolding} 2020 900`}
        fill="none"
        stroke={C.gold}
        strokeWidth="28"
      />
      <path
        d={`M-100 941Q960 ${930 - 440 * unfolding} 2020 941`}
        fill="none"
        stroke={C.ink}
        strokeWidth="2"
        strokeDasharray="4 18"
        opacity=".4"
      />
      <g
        transform={`translate(960 ${720 - unfolding * 170}) scale(${0.3 + unfolding * 0.7} 1)`}
      >
        <path
          d="M-150-110 0-163 150-110 0-57Z"
          fill={C.light}
          stroke={C.ink}
          strokeWidth="4"
        />
        <path
          d="M-150-110v150L0 91V-57Z"
          fill={C.teal}
          stroke={C.ink}
          strokeWidth="4"
        />
        <path
          d="M150-110v150L0 91V-57Z"
          fill={C.gold}
          stroke={C.ink}
          strokeWidth="4"
        />
        <path
          d="M-130-82-21-44m42 0 109-38"
          stroke={C.paper}
          strokeWidth="2"
          opacity=".4"
        />
      </g>
      <PaperCharacter
        kind="cow"
        x={interpolate(t, [0, 8], [545, 730], clamp)}
        y={845 - unfolding * 170 + interpolate(t, [8.2, 9], [0, 118], clamp)}
        t={t}
        scale={1.02}
        pose={seated ? "sit" : "hold"}
        mood="happy"
      />
      <PaperCharacter
        kind="horse"
        x={interpolate(t, [0, 8], [1365, 1190], clamp)}
        y={845 - unfolding * 170 + interpolate(t, [8.2, 9], [0, 118], clamp)}
        t={t}
        scale={1.02}
        pose={seated ? "sit" : "reach"}
        facing={-1}
        mood="happy"
      />
      <Boat
        x={260 + t * 67}
        y={843 + Math.sin(t * 2) * 12}
        scale={0.43}
        angle={Math.sin(t * 2) * 5}
      />
      <g opacity={interpolate(t, [9, 11], [0, 1], clamp)}>
        <text x="165" y="281" fontSize="83" fontWeight="900" fill={C.ink}>
          这块空白，
        </text>
        <text x="164" y="390" fontSize="83" fontWeight="900" fill={C.ink}>
          先不打印。
        </text>
      </g>
    </FilmFrame>
  );
};

const Sunset: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="08 / 今天，也有没被打印的部分" color="#E8CFAC">
      <circle cx={1465 - t * 3} cy={329 + t * 3} r="188" fill={C.coral} />
      <Cloud x={1390 - t * 8} y={299} scale={1.65} />
      <Cloud x={410 + t * 4} y={413} scale={1.1} />
      <Cloud x={1740 - t * 7} y={628} scale={0.8} />
      <path
        d="M0 840 240 695l295 95 203-94 285 114 286-86 301 119 310-97v334H0Z"
        fill={C.teal}
        opacity=".6"
      />
      <path d="M0 970Q960 470 1920 970v110H0Z" fill={C.ink} />
      <path
        d="M0 837Q960 480 1920 837v76Q960 556 0 913Z"
        fill={C.paper}
        stroke={C.ink}
        strokeWidth="7"
      />
      <path
        d="M0 876Q960 519 1920 876"
        fill="none"
        stroke={C.gold}
        strokeWidth="17"
      />
      <PaperCharacter
        kind="cow"
        x={830}
        y={810}
        t={t}
        scale={0.95}
        pose="sit"
        mood="happy"
      />
      <PaperCharacter
        kind="horse"
        x={1110}
        y={811}
        t={t + 0.5}
        scale={0.95}
        pose="sit"
        mood="happy"
      />
      <g transform="translate(980 626)">
        <path
          d="M-35 0h70l-9 31h-52Z"
          fill={C.coral}
          stroke={C.ink}
          strokeWidth="3"
        />
        <path
          d="M-18-8q0-19 10-14m15 14q0-19 10-14"
          fill="none"
          stroke={C.paper}
          strokeWidth="3"
        />
      </g>
      <Boat
        x={260 + t * 80}
        y={870 + Math.sin(t) * 12}
        scale={0.46}
        angle={Math.sin(t) * 5}
      />
      <g transform={`translate(0 ${interpolate(t, [0, 1], [30, 0], clamp)})`}>
        <text x="160" y="270" fill={C.ink} fontSize="98" fontWeight="900">
          今天，留白。
        </text>
        <path d="M164 307h384" stroke={C.coral} strokeWidth="8" />
      </g>
    </FilmFrame>
  );
};

const Ending: FC = () => {
  const t = useTime();
  return (
    <FilmFrame chapter="送给每一个，总差一点下班的人">
      <text
        x="960"
        y="382"
        textAnchor="middle"
        fontSize="126"
        fontWeight="900"
        fill={C.ink}
        letterSpacing="-4"
      >
        下班还有几厘米
      </text>
      <path
        d="M475 430q480-30 970 0"
        fill="none"
        stroke={C.coral}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <text x="960" y="526" textAnchor="middle" fontSize="48" fill={C.ink}>
        路再长，也给自己留一点空白。
      </text>
      <text x="960" y="600" textAnchor="middle" fontSize="30" fill={C.ink}>
        AI 合成歌声：绮萱 · DiffSinger
      </text>
      <PaperRail t={t * 0.3} y={852} speed={30} />
      <PaperCharacter
        kind="cow"
        x={825}
        y={940}
        scale={0.63}
        t={t}
        pose="sit"
        mood="happy"
      />
      <PaperCharacter
        kind="horse"
        x={1085}
        y={940}
        scale={0.63}
        t={t}
        pose="sit"
        mood="happy"
      />
      <text
        x="960"
        y="1008"
        textAnchor="middle"
        fill={C.ink}
        fontSize="25"
        opacity=".7"
      >
        AI 辅助原创动画 · 原创词曲与程序合成配乐 · 2026
      </text>
    </FilmFrame>
  );
};

const Lyrics: FC = () => {
  const t = useTime();
  const line = captions.find(
    (item) => t * 1000 >= item.startMs && t * 1000 < item.endMs,
  );
  if (!line) return null;
  const start = line.startMs / 1000;
  const end = line.endMs / 1000;
  const opacity = interpolate(
    t,
    [start, start + 0.12, end - 0.12, end],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 67,
        opacity,
      }}
    >
      <div
        style={{
          fontFamily: font,
          fontSize: 43,
          fontWeight: 700,
          color: C.ink,
          letterSpacing: 5,
          background: C.light,
          padding: "17px 43px 21px",
          border: `3px solid ${C.ink}`,
          boxShadow: `5px 5px 0 ${C.ink}35`,
          position: "relative",
        }}
      >
        {line.text}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: `${interpolate(t, [start, end], [0, 100], clamp)}%`,
            height: 5,
            background: C.coral,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export type OffWorkProps = { showLyrics: boolean };

export const OffWorkMV: FC<OffWorkProps> = ({ showLyrics }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio
        name="原创配乐 · 112 BPM"
        src={staticFile("audio/instrumental.wav")}
        volume={0.43}
      />
      <Audio
        name="AI 合成歌声：绮萱 · DiffSinger"
        src={staticFile("audio/qixuan-vocal.wav")}
        volume={0.85}
      />
      <Sequence
        name="序 · 还差一点"
        durationInFrames={Math.round(4 * barSeconds * fps)}
      >
        <Opening />
      </Sequence>
      <Sequence
        name="01 · 通勤"
        from={Math.round(4 * barSeconds * fps)}
        durationInFrames={
          Math.round(8 * barSeconds * fps) - Math.round(4 * barSeconds * fps)
        }
      >
        <Commute />
      </Sequence>
      <Sequence
        name="02 · 工位与再改一版"
        from={Math.round(8 * barSeconds * fps)}
        durationInFrames={
          Math.round(16 * barSeconds * fps) - Math.round(8 * barSeconds * fps)
        }
      >
        <Work />
      </Sequence>
      <Sequence
        name="03 · 追赶下班门"
        from={Math.round(16 * barSeconds * fps)}
        durationInFrames={
          Math.round(24 * barSeconds * fps) - Math.round(16 * barSeconds * fps)
        }
      >
        <Chase />
      </Sequence>
      <Sequence
        name="04 · 凉掉的午饭"
        from={Math.round(24 * barSeconds * fps)}
        durationInFrames={
          Math.round(28 * barSeconds * fps) - Math.round(24 * barSeconds * fps)
        }
      >
        <Lunch />
      </Sequence>
      <Sequence
        name="05 · 没完的会议"
        from={Math.round(28 * barSeconds * fps)}
        durationInFrames={
          Math.round(32 * barSeconds * fps) - Math.round(28 * barSeconds * fps)
        }
      >
        <Meeting />
      </Sequence>
      <Sequence
        name="06 · 卡纸与停一停"
        from={Math.round(32 * barSeconds * fps)}
        durationInFrames={
          Math.round(40 * barSeconds * fps) - Math.round(32 * barSeconds * fps)
        }
      >
        <Jam />
      </Sequence>
      <Sequence
        name="07 · 把纸带搭成桥"
        from={Math.round(40 * barSeconds * fps)}
        durationInFrames={
          Math.round(48 * barSeconds * fps) - Math.round(40 * barSeconds * fps)
        }
      >
        <Bridge />
      </Sequence>
      <Sequence
        name="08 · 一起看晚风"
        from={Math.round(48 * barSeconds * fps)}
        durationInFrames={
          Math.round(54 * barSeconds * fps) - Math.round(48 * barSeconds * fps)
        }
      >
        <Sunset />
      </Sequence>
      <Sequence
        name="尾 · 今天留白"
        from={Math.round(54 * barSeconds * fps)}
        durationInFrames={120 * fps - Math.round(54 * barSeconds * fps)}
      >
        <Ending />
      </Sequence>
      {showLyrics && <Lyrics />}
    </AbsoluteFill>
  );
};
