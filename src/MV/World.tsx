import type { FC } from "react";

const ink = "#243A3B";
const paper = "#F3E9D2";
const teal = "#6B9090";
const coral = "#D86648";
const mustard = "#D5AB53";
const font = '"NiumaSans", sans-serif';
const wrap = (value: number, period: number) =>
  ((value % period) + period) % period;

/** Time is in seconds. The paper stays below its top edge at y. */
export const PaperRail: FC<{
  t: number;
  y?: number;
  speed?: number;
  color?: string;
}> = ({ t, y = 820, speed = 80, color = paper }) => {
  const travel = wrap(t * speed, 320);

  return (
    <g transform={`translate(${-travel} ${y})`} fontFamily={font}>
      <path
        d="M-320 0H2560V175l-14-5-13 8-13-7-14 8-14-5H-320Z"
        fill={color}
        stroke={ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <path
        d="M-320 30H2560M-320 136H2560"
        stroke={ink}
        strokeWidth={2}
        opacity={0.22}
      />
      {Array.from({ length: 9 }, (_, tile) => (
        <g key={tile} transform={`translate(${(tile - 1) * 320} 0)`}>
          <path
            d="M0 34V132"
            stroke={ink}
            strokeWidth={2}
            strokeDasharray="4 8"
            opacity={0.26}
          />
          {Array.from({ length: 16 }, (_, tick) => (
            <path
              key={tick}
              d={`M${tick * 20 + 10} 3v${tick % 4 === 0 ? 19 : 10}`}
              stroke={ink}
              strokeWidth={tick % 4 === 0 ? 3 : 2}
              opacity={0.65}
            />
          ))}
          <g
            transform={`translate(76 84) rotate(${tile % 2 === 0 ? -11 : 8})`}
            opacity={0.72}
          >
            <rect
              x={-41}
              y={-32}
              width={82}
              height={56}
              rx={3}
              fill="none"
              stroke={coral}
              strokeWidth={4}
            />
            <path
              d="M-35-25h16m28 0h25M-34 17h21m20 0h26"
              stroke={coral}
              strokeWidth={2}
            />
            <text
              y={8}
              textAnchor="middle"
              fontSize={29}
              fontWeight={800}
              fill={coral}
            >
              {tile % 2 === 0 ? "已阅" : "续页"}
            </text>
          </g>
          <text
            x={145}
            y={64}
            fontSize={17}
            fontWeight={700}
            letterSpacing={2}
            fill={ink}
            opacity={0.7}
          >
            09:00 — 18:00
          </text>
          <path
            d="M146 84h125m-125 12h94m-94 12h110"
            stroke={ink}
            strokeWidth={2}
            opacity={0.22}
          />
          {Array.from({ length: 8 }, (_, hole) => (
            <g key={hole}>
              <circle
                cx={hole * 40 + 20}
                cy={155}
                r={6.5}
                fill={ink}
                opacity={0.22}
              />
              <path
                d={`M${hole * 40 + 12} 166l7-3`}
                stroke={ink}
                strokeWidth={1.5}
                opacity={0.14}
              />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
};

/** x is the door's center; y is the foot of the frame. open is 0–1. */
export const ExitDoor: FC<{
  x: number;
  y: number;
  scale?: number;
  open?: number;
}> = ({ x, y, scale = 1, open = 0 }) => {
  const amount = Math.max(0, Math.min(1, open));
  const panelScale = 1 - amount * 0.82;

  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      strokeLinejoin="round"
      fontFamily={font}
    >
      <path
        d={`M-98-5H98L${166 + amount * 200} ${25 + amount * 45}H-172Z`}
        fill={mustard}
        opacity={0.12 + amount * 0.3}
      />
      <rect
        x={-116}
        y={-354}
        width={232}
        height={354}
        rx={7}
        fill={mustard}
        stroke={ink}
        strokeWidth={7}
      />
      <rect
        x={-100}
        y={-338}
        width={200}
        height={332}
        fill={amount > 0 ? "#F8E5A4" : teal}
        stroke={ink}
        strokeWidth={4}
      />
      <path
        d="M-88-324h175M106-328v305"
        stroke={paper}
        strokeWidth={3}
        opacity={0.5}
      />
      <g
        transform={`translate(-100 -338) skewY(${amount * -7}) scale(${panelScale} 1)`}
      >
        <rect
          width={200}
          height={332}
          fill={teal}
          stroke={ink}
          strokeWidth={5}
        />
        <path
          d="M11 13h177v303H11Z"
          fill="none"
          stroke={ink}
          strokeWidth={2}
          opacity={0.36}
        />
        <rect
          x={21}
          y={51}
          width={158}
          height={88}
          rx={5}
          fill={paper}
          stroke={ink}
          strokeWidth={4}
        />
        <path d="M32 61h136M32 128h136" stroke={mustard} strokeWidth={3} />
        <text
          x={100}
          y={110}
          textAnchor="middle"
          fontSize={47}
          fontWeight={900}
          letterSpacing={7}
          fill={ink}
        >
          下班
        </text>
        <path
          d="M37 179h126M37 191h126M37 203h126"
          stroke={ink}
          strokeWidth={2}
          opacity={0.18}
        />
        <rect
          x={155}
          y={208}
          width={17}
          height={57}
          rx={7}
          fill={mustard}
          stroke={ink}
          strokeWidth={4}
        />
        <path
          d="M160 219v24"
          stroke={paper}
          strokeWidth={3}
          strokeLinecap="round"
        />
        {[16, 305].map((hinge) => (
          <rect
            key={hinge}
            x={-5}
            y={hinge}
            width={11}
            height={24}
            rx={2}
            fill={ink}
          />
        ))}
        <path
          d="M25 280l17-17m-17 28 28-28m-17 28 17-17"
          stroke={paper}
          strokeWidth={2}
          opacity={0.35}
        />
      </g>
      <path
        d="M-122 0H122"
        stroke={ink}
        strokeWidth={9}
        strokeLinecap="round"
      />
      <path d="M-104-360h208" stroke={ink} strokeWidth={3} opacity={0.25} />
    </g>
  );
};

/** Left/bottom anchor; approximately 420 × 400. */
export const Printer: FC<{
  x: number;
  y: number;
  scale?: number;
  t: number;
  jammed?: boolean;
}> = ({ x, y, scale = 1, t, jammed = false }) => {
  const feed = wrap(t * 25, 30);
  const shake = jammed ? Math.sin(t * 28) * 2 : 0;

  return (
    <g
      transform={`translate(${x + shake * scale} ${y}) scale(${scale})`}
      stroke={ink}
      strokeLinejoin="round"
      fontFamily={font}
    >
      <ellipse
        cx={210}
        cy={2}
        rx={204}
        ry={15}
        fill={ink}
        opacity={0.13}
        stroke="none"
      />
      <path d="M56-40v40m306-40v40" strokeWidth={17} strokeLinecap="round" />
      <path
        d="M47-275V-346Q47-394 101-394H301Q341-394 341-350v75"
        fill={teal}
        strokeWidth={6}
      />
      <ellipse
        cx={103}
        cy={-345}
        rx={48}
        ry={47}
        fill={paper}
        strokeWidth={5}
      />
      <ellipse cx={103} cy={-345} rx={31} ry={32} fill="none" strokeWidth={2} />
      <ellipse
        cx={103}
        cy={-345}
        rx={15}
        ry={16}
        fill={mustard}
        strokeWidth={4}
      />
      <path
        d="M103-392h178q32 0 32 35v71H152v-59q0-39-49-47Z"
        fill={paper}
        strokeWidth={4}
      />
      <path
        d="M166-377h122m-122 16h122m-122 16h122"
        strokeWidth={2}
        opacity={0.23}
      />
      {[173, 210, 247, 284].map((hole) => (
        <circle
          key={hole}
          cx={hole}
          cy={-306}
          r={4}
          fill={ink}
          stroke="none"
          opacity={0.4}
        />
      ))}
      <path
        d="M18-274l34-48h294l56 48v218H18Z"
        fill={mustard}
        strokeWidth={7}
      />
      <path
        d="M20-275h381M52-319l27 39m268-39 28 39"
        fill="none"
        strokeWidth={3}
      />
      <rect
        x={20}
        y={-273}
        width={382}
        height={219}
        rx={12}
        fill={teal}
        strokeWidth={7}
      />
      <rect
        x={43}
        y={-252}
        width={330}
        height={93}
        rx={9}
        fill={paper}
        strokeWidth={4}
      />
      <rect
        x={63}
        y={-235}
        width={157}
        height={47}
        rx={4}
        fill={ink}
        strokeWidth={3}
      />
      <text
        x={141}
        y={-204}
        fontSize={24}
        fontWeight={800}
        fill={paper}
        stroke="none"
        textAnchor="middle"
        letterSpacing={4}
      >
        续 页 机
      </text>
      <circle
        cx={260}
        cy={-211}
        r={12}
        fill={jammed ? coral : mustard}
        strokeWidth={4}
      />
      <path d="M260-217v11" strokeWidth={3} strokeLinecap="round" />
      <circle cx={307} cy={-211} r={13} fill={coral} strokeWidth={4} />
      <circle
        cx={348}
        cy={-211}
        r={6}
        fill={jammed && Math.sin(t * 10) > 0 ? coral : ink}
        stroke="none"
      />
      <rect
        x={75}
        y={-165}
        width={265}
        height={28}
        rx={11}
        fill={ink}
        strokeWidth={3}
      />
      <g transform={`translate(0 ${jammed ? Math.sin(t * 17) * 2 : 0})`}>
        <path
          d={
            jammed
              ? "M131-151h155l-11 26 18 21-26 16 11 24-34-6-29 16-30-14-34 4 8-24-27-21 18-19Z"
              : "M131-151h155v88l-15-4-14 7-15-6-16 7-16-6-17 6-15-6-15 6-17-7-15 5Z"
          }
          fill={paper}
          strokeWidth={3}
        />
        {!jammed &&
          [0, 1, 2].map((line) => (
            <path
              key={line}
              d={`M150 ${-143 + line * 30 + feed}h117`}
              strokeWidth={2}
              opacity={-143 + line * 30 + feed < -77 ? 0.35 : 0}
            />
          ))}
        {jammed && (
          <path
            d="M143-130l119 48m-107-17 121-17m-77-25 15 72"
            fill="none"
            strokeWidth={2}
            opacity={0.42}
          />
        )}
      </g>
      {[94, 320].map((roller) => (
        <g
          key={roller}
          transform={`translate(${roller} -147) rotate(${jammed ? Math.sin(t * 18) * 12 : t * 120})`}
        >
          <circle r={17} fill={mustard} strokeWidth={4} />
          <path d="M-11 0h22M0-11v22" strokeWidth={3} />
          <circle r={4} fill={ink} stroke="none" />
        </g>
      ))}
      <path
        d="M44-77h43m-43-10h43m-43-10h43M327-79h47m-47-10h47m-47-10h47"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path d="M25-49h369v15H25Z" fill={coral} strokeWidth={5} />
      <text
        x={210}
        y={-6}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        stroke="none"
        fill={ink}
        letterSpacing={3}
      >
        {jammed ? "请 稍 后 · 仍 在 续 页" : "今 日 份 · 明 日 续"}
      </text>
    </g>
  );
};

/** Left/bottom anchor; approximately 430 × 290. */
export const Desk: FC<{
  x: number;
  y: number;
  scale?: number;
  t: number;
}> = ({ x, y, scale = 1, t }) => (
  <g
    transform={`translate(${x} ${y}) scale(${scale})`}
    stroke={ink}
    strokeLinejoin="round"
    fontFamily={font}
  >
    <path d="M30-96 18 0m365-96 17 96" strokeWidth={11} strokeLinecap="round" />
    <path d="M30-49h361" strokeWidth={5} />
    <path d="M0-118h409l21 20H18Z" fill={mustard} strokeWidth={5} />
    <path d="M18-98h412v15H18Z" fill={coral} strokeWidth={5} />
    <path d="M24-90h392" stroke={paper} strokeWidth={2} opacity={0.5} />
    <path d="M273-154v33m-31 4h72" strokeWidth={10} strokeLinecap="round" />
    <rect
      x={181}
      y={-282}
      width={189}
      height={133}
      rx={10}
      fill={teal}
      strokeWidth={6}
    />
    <rect
      x={192}
      y={-270}
      width={167}
      height={105}
      rx={3}
      fill={paper}
      strokeWidth={3}
    />
    <rect x={204} y={-256} width={51} height={9} fill={mustard} stroke="none" />
    <path
      d="M204-233h96m-96 12h133m-133 12h116"
      strokeWidth={3}
      opacity={0.4}
    />
    <rect
      x={204}
      y={-190}
      width={139}
      height={9}
      rx={4}
      fill={teal}
      stroke="none"
      opacity={0.3}
    />
    <rect
      x={204}
      y={-190}
      width={30 + wrap(t * 9, 107)}
      height={9}
      rx={4}
      fill={coral}
      stroke="none"
    />
    <circle cx={276} cy={-157} r={2.5} fill={ink} stroke="none" />
    <path d="M119-137h155l14 18H108Z" fill={paper} strokeWidth={3} />
    {[0, 1, 2].map((row) => (
      <path
        key={row}
        d={`M${121 - row * 3} ${-132 + row * 5}h147`}
        strokeWidth={2}
        strokeDasharray={row === 2 ? "30 5 58 5 30" : "8 5"}
        opacity={0.65}
      />
    ))}
    <ellipse cx={313} cy={-125} rx={12} ry={7} fill={teal} strokeWidth={3} />
    <path d="M313-125v-5" strokeWidth={2} />
    <path d="M48-155h37v28q-18 15-37 0Z" fill={paper} strokeWidth={4} />
    <path d="M85-149h8q17 13-7 21" fill="none" strokeWidth={4} />
    <ellipse cx={67} cy={-155} rx={18.5} ry={5} fill={ink} strokeWidth={2} />
    {[0, 1].map((steam) => (
      <path
        key={steam}
        d={`M${58 + steam * 14}-169q${-7 + Math.sin(t * 2.5 + steam) * 3}-9 0-18t0-16`}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.35}
      />
    ))}
    <path
      d="M377-122h41m-23-3-12-88 22-40"
      fill="none"
      strokeWidth={6}
      strokeLinecap="round"
    />
    <circle cx={383} cy={-213} r={6} fill={mustard} strokeWidth={3} />
    <path d="M368-270h43l19 32h-79Z" fill={mustard} strokeWidth={4} />
    <path
      d="M356-237 298-119h119l9-118Z"
      fill={mustard}
      stroke="none"
      opacity={0.12}
    />
    <path d="M380-262h24" stroke={paper} strokeWidth={3} opacity={0.65} />
    <path
      d="M34-73l16-10m-4 10 16-10m-4 10 16-10"
      strokeWidth={2}
      opacity={0.3}
    />
  </g>
);

/** Center anchor; hands intentionally race against the working day. */
export const Clock: FC<{
  x: number;
  y: number;
  t: number;
  radius?: number;
}> = ({ x, y, t, radius = 70 }) => (
  <g
    transform={`translate(${x} ${y + Math.sin(t * 0.8) * 6}) rotate(${Math.sin(t * 0.45) * 2}) scale(${radius / 70})`}
    fontFamily={font}
  >
    <circle cx={5} cy={7} r={71} fill={ink} opacity={0.12} />
    <circle r={70} fill={mustard} stroke={ink} strokeWidth={6} />
    <circle r={61} fill={paper} stroke={ink} strokeWidth={2} />
    {Array.from({ length: 12 }, (_, tick) => (
      <path
        key={tick}
        d="M0-53v7"
        transform={`rotate(${tick * 30})`}
        stroke={ink}
        strokeWidth={tick % 3 === 0 ? 4 : 2}
      />
    ))}
    <g fill={ink} fontSize={15} fontWeight={800} textAnchor="middle">
      <text y={-29}>12</text>
      <text x={37} y={5}>
        3
      </text>
      <text y={41}>6</text>
      <text x={-37} y={5}>
        9
      </text>
    </g>
    <path
      d="M0 6V-29"
      transform={`rotate(${178 + t * 0.24})`}
      stroke={ink}
      strokeWidth={7}
      strokeLinecap="round"
    />
    <path
      d="M0 7V-43"
      transform={`rotate(${348 + t * 4 + Math.sin(t * 0.3) * 9})`}
      stroke={ink}
      strokeWidth={4}
      strokeLinecap="round"
    />
    <path
      d="M0 12V-48"
      transform={`rotate(${t * 24})`}
      stroke={coral}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <circle r={6} fill={coral} stroke={ink} strokeWidth={2} />
    <path
      d="M-45 42l9 8m0-8 9 8m0-8 9 8"
      stroke={ink}
      strokeWidth={1.5}
      opacity={0.25}
    />
  </g>
);

/** Center anchor; three cut-paper layers, with no SVG filters. */
export const Cloud: FC<{
  x: number;
  y: number;
  scale?: number;
}> = ({ x, y, scale = 1 }) => (
  <g
    transform={`translate(${x} ${y}) scale(${scale})`}
    stroke={ink}
    strokeLinejoin="round"
  >
    <path
      d="M-122 27q-18-33 20-45 0-35 37-35 23-38 62-10 37-11 51 23 41-8 55 26 38 1 30 36-37 25-255 5Z"
      fill={teal}
      strokeWidth={4}
      opacity={0.65}
    />
    <path
      d="M-127 14q-17-32 19-44 3-31 37-31 26-36 61-10 39-14 55 20 39-6 54 25 36 4 28 31-26 27-254 9Z"
      fill={mustard}
      strokeWidth={4}
    />
    <path
      d="M-132 2q-15-28 20-39 1-31 36-32 23-33 60-9 35-13 52 18 37-7 52 22 38 3 29 30-35 24-249 10Z"
      fill={paper}
      strokeWidth={4}
    />
    <path
      d="M-104-28q13-4 22-1m72-43q15 5 19 17m58 21q12 2 18 11"
      fill="none"
      strokeWidth={2}
      opacity={0.24}
      strokeLinecap="round"
    />
    {Array.from({ length: 6 }, (_, hatch) => (
      <path
        key={hatch}
        d={`M${-92 + hatch * 11} 3l9-7`}
        strokeWidth={1.5}
        opacity={0.25}
      />
    ))}
    <path d="M65 1h36" strokeWidth={2} opacity={0.2} />
  </g>
);
