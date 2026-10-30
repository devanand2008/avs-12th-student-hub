"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { LabLesson } from "@/lib/advanced-models";
import {
  binarySearchFrames,
  circuit,
  insertionSortFrames,
  parseLabArray,
  secantSlope,
  sineVoltage,
  tangent,
  thinLens,
  transformerVoltage,
  trophicEnergy,
} from "@/lib/lab-math";

const subscribeMotion = (notify: () => void) => {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", notify);
  return () => q.removeEventListener("change", notify);
};
const motionSnapshot = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const controlClass =
  "min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-blue-800 disabled:opacity-40";
const blue = "#2563eb",
  green = "#059669",
  amber = "#b45309";

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}: {value}
      <input
        className="mt-2 w-full accent-blue-700"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function Plot({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 640 350"
      className="my-4 w-full rounded-2xl border border-blue-100 bg-white text-[15px]"
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}
const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = blue,
  dash?: string,
) => (
  <line
    x1={x1}
    y1={y1}
    x2={x2}
    y2={y2}
    stroke={color}
    strokeWidth="3"
    strokeDasharray={dash}
  />
);
const txt = (x: number, y: number, text: string, color = "#334155") => (
  <text x={x} y={y} fill={color}>
    {text}
  </text>
);
const pathFor = (
  fn: (x: number) => number,
  start: number,
  end: number,
  xmap: (x: number) => number,
  ymap: (y: number) => number,
) =>
  Array.from({ length: 161 }, (_, i) => {
    const x = start + ((end - start) * i) / 160;
    return `${i ? "L" : "M"}${xmap(x).toFixed(2)},${ymap(fn(x)).toFixed(2)}`;
  }).join(" ");

export default function LabSimulation({ lesson }: { lesson: LabLesson }) {
  const [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const [p, setP] = useState(
    lesson.id === "thin-lens"
      ? 2
      : lesson.id === "ecosystem"
        ? 10
        : lesson.id === "derivative"
          ? 1
          : 12,
  );
  const [q, setQ] = useState(
    lesson.id === "derivative" ? 0.5 : lesson.id === "ac-wave" ? 1 : 6,
  );
  const [input, setInput] = useState("13, 5, 21, 8, 3, 11"),
    [target, setTarget] = useState("11"),
    [numbers, setNumbers] = useState([13, 5, 21, 8, 3, 11]),
    [searchTarget, setSearchTarget] = useState(11);
  const [error, setError] = useState(""),
    [selected, setSelected] = useState<number | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionSnapshot,
    () => true,
  );
  const root = useRef<HTMLDivElement>(null),
    visible = useRef(true);
  const frames = useMemo(
    () =>
      lesson.id === "binary-search"
        ? binarySearchFrames(numbers, searchTarget)
        : lesson.id === "insertion-sort"
          ? insertionSortFrames(numbers)
          : [],
    [lesson.id, numbers, searchTarget],
  );
  const count = frames.length || lesson.stages.length;
  const current = frames[step];
  const running = playing && step < count - 1;
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!running || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && visible.current)
        setStep((s) => Math.min(s + 1, count - 1));
    }, 1200 / speed);
    return () => window.clearInterval(timer);
  }, [running, reducedMotion, count, speed]);
  const reset = () => {
    setStep(0);
    setPlaying(false);
    setSpeed(1);
    setP(
      lesson.id === "thin-lens"
        ? 2
        : lesson.id === "ecosystem"
          ? 10
          : lesson.id === "derivative"
            ? 1
            : 12,
    );
    setQ(lesson.id === "derivative" ? 0.5 : lesson.id === "ac-wave" ? 1 : 6);
    setSelected(null);
    setError("");
    setInput("13, 5, 21, 8, 3, 11");
    setTarget("11");
    setNumbers([13, 5, 21, 8, 3, 11]);
    setSearchTarget(11);
  };
  const apply = () => {
    try {
      const a = parseLabArray(input);
      if (
        !/^[-+]?\d+$/.test(target) ||
        !Number.isSafeInteger(Number(target)) ||
        Math.abs(Number(target)) > 999
      )
        throw new Error("Use an integer target from −999 to 999.");
      setNumbers(a);
      setSearchTarget(Number(target));
      setStep(0);
      setPlaying(false);
      setSelected(null);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check input.");
    }
  };
  let drawing: React.ReactNode = null,
    output = "";
  if (lesson.id === "replication") {
    const rows =
      step === 0 ? [115, 180] : step === 1 ? [75, 245] : [70, 120, 230, 280];
    drawing = (
      <Plot label="Semiconservative DNA replication; blue old strands, green new strands">
        {rows.map((y, i) => (
          <g key={i}>
            {line(
              80,
              y,
              540,
              y,
              step >= 2 && (i === 1 || i === 2) ? green : blue,
            )}
            {txt(
              90,
              y - 12,
              step >= 2 && (i === 1 || i === 2)
                ? "New strand"
                : "Old parental strand",
              step >= 2 && (i === 1 || i === 2) ? green : blue,
            )}
            {Array.from({ length: 10 }, (_, k) => (
              <circle
                key={k}
                cx={90 + k * 48}
                cy={y}
                r="6"
                fill={step >= 2 && (i === 1 || i === 2) ? green : blue}
              />
            ))}
          </g>
        ))}
        {step >= 2 && (
          <>
            {txt(90, 165, "Daughter duplex 1: old + new")}
            {txt(90, 325, "Daughter duplex 2: new + old")}
          </>
        )}
      </Plot>
    );
  } else if (lesson.id === "transcription") {
    const template = "TACGGA",
      rna = "AUGCCU",
      n = step === 0 ? 0 : step === 1 ? 3 : 6;
    drawing = (
      <Plot label="Complementary RNA grows 5 prime to 3 prime against DNA template read 3 prime to 5 prime">
        {txt(35, 55, "Template DNA: 3′ → 5′", blue)}
        {txt(35, 280, "RNA product: 5′ → 3′", green)}
        {template.split("").map((base, i) => (
          <g key={i}>
            <rect
              x={45 + i * 90}
              y="80"
              width="65"
              height="55"
              rx="10"
              fill="#dbeafe"
            />
            {txt(69 + i * 90, 115, base)}
            {i < n && (
              <>
                {line(78 + i * 90, 140, 78 + i * 90, 180, "#94a3b8", "4 4")}
                <rect
                  x={45 + i * 90}
                  y="185"
                  width="65"
                  height="55"
                  rx="10"
                  fill="#d1fae5"
                />
                {txt(69 + i * 90, 220, rna[i])}
              </>
            )}
          </g>
        ))}
      </Plot>
    );
  } else if (lesson.id === "mendel") {
    const genotypes = ["TT", "Tt", "Tt", "tt"];
    drawing = (
      <>
        <div className="mx-auto my-6 grid max-w-sm grid-cols-3 gap-2 text-center">
          <span />
          <strong>Parent 2: T</strong>
          <strong>Parent 2: t</strong>
          {["T", "t"].map((a, i) => (
            <div className="contents" key={a}>
              <strong className="self-center">Parent 1: {a}</strong>
              {genotypes.slice(i * 2, i * 2 + 2).map((g, j) => (
                <button
                  key={j}
                  className={`${controlClass} h-20 ${selected === i * 2 + j ? "ring-2 ring-blue-600" : ""}`}
                  onClick={() => setSelected(i * 2 + j)}
                >
                  {step > 0 ? g : "?"}
                </button>
              ))}
            </div>
          ))}
        </div>
        {selected !== null && (
          <p role="status">
            Cell {selected + 1}:{" "}
            {step > 0
              ? genotypes[selected] + " · probability 1/4"
              : "Advance a stage to combine the gametes."}
          </p>
        )}
      </>
    );
  } else if (lesson.id === "pollination") {
    drawing = (
      <Plot label="Pollen reaches stigma, then pollen tube grows through style to ovule">
        {line(390, 110, 390, 235, green)}
        <ellipse
          cx="390"
          cy="260"
          rx="65"
          ry="50"
          fill="#d1fae5"
          stroke={green}
          strokeWidth="3"
        />
        <ellipse cx="390" cy="95" rx="42" ry="12" fill="#a78bfa" />
        <circle cx="390" cy="260" r="16" fill="#fbbf24" />
        {txt(440, 100, "Stigma")}
        {txt(415, 185, "Style")}
        {txt(465, 270, "Ovary")}
        {txt(350, 330, "Ovule inside ovary")}
        {line(125, 220, 125, 100, green)}
        <ellipse cx="125" cy="90" rx="32" ry="14" fill="#fbbf24" />
        {txt(70, 260, "Anther")}
        {line(160, 70, 340, 70, "#94a3b8", "6 6")}
        <circle
          cx={step === 0 ? 150 : 390}
          cy={step === 0 ? 65 : 80}
          r="10"
          fill={amber}
        />
        {step >= 2 && (
          <path
            d="M390,90 Q360,155 390,220 Q420,250 390,260"
            fill="none"
            stroke={amber}
            strokeWidth="6"
          />
        )}
        {step === 3 &&
          txt(40, 315, "Gamete delivery shown; fusion detail omitted.")}
      </Plot>
    );
  } else if (lesson.id === "ecosystem") {
    const energy = trophicEnergy(1000, p / 100);
    output = energy
      .map(
        (e, i) =>
          `${["Producers", "Primary consumers", "Secondary consumers", "Tertiary consumers"][i]}: ${e.toFixed(2)} kJ`,
      )
      .join(" · ");
    drawing = (
      <>
        <Slider
          label="Transfer efficiency (%)"
          value={p}
          min={5}
          max={25}
          onChange={setP}
        />
        <Plot label="Four trophic levels; widths are illustrative rather than energy-proportional">
          {[3, 2, 1, 0].map((level, row) => {
            const w = 140 + row * 95;
            return (
              <g key={level}>
                <rect
                  x={(640 - w) / 2}
                  y={25 + row * 72}
                  width={w}
                  height="62"
                  rx="10"
                  fill={["#dcfce7", "#dbeafe", "#e0e7ff", "#fef3c7"][level]}
                />
                {txt(
                  (640 - w) / 2 + 15,
                  63 + row * 72,
                  `${["Producers", "Primary", "Secondary", "Tertiary"][level]}: ${energy[level].toFixed(2)} kJ`,
                )}
              </g>
            );
          })}
        </Plot>
      </>
    );
  } else if (lesson.id === "ac-wave") {
    const t = step / (4 * q);
    output = `Period T = ${(1 / q).toFixed(3)} s · RMS = ${(p / Math.SQRT2).toFixed(2)} V · sample t = ${t.toFixed(3)} s, v = ${sineVoltage(p, q, t).toFixed(2)} V`;
    drawing = (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            label="Peak voltage (V)"
            value={p}
            min={1}
            max={24}
            onChange={setP}
          />
          <Slider
            label="Frequency (Hz)"
            value={q}
            min={0.5}
            max={3}
            step={0.5}
            onChange={setQ}
          />
        </div>
        <Plot label="Sinusoidal voltage versus time; fixed vertical scale ±24 volts">
          {line(40, 170, 600, 170, "#94a3b8")}
          {line(50, 35, 50, 310, "#94a3b8")}
          <path
            d={pathFor(
              (x) => sineVoltage(p, q, x),
              0,
              2,
              (x) => 50 + 260 * x,
              (y) => 170 - 5 * y,
            )}
            stroke={blue}
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={50 + 260 * t}
            cy={170 - 5 * sineVoltage(p, q, t)}
            r="7"
            fill={amber}
          />
          {txt(65, 30, "v (V), range −24 to +24")}
          {txt(480, 335, "t: 0 to 2 s")}
        </Plot>
      </>
    );
  } else if (lesson.id === "thin-lens") {
    const { imageDistance: di, magnification: m } = thinLens(p);
    const centre = 300,
      scale = 65,
      height = 45,
      ox = centre - p * scale,
      ix = centre + di * scale;
    output = `f = 1 unit · dₒ = ${p.toFixed(2)} · dᵢ = ${di.toFixed(2)} · magnification = ${m.toFixed(2)}`;
    drawing = (
      <>
        <Slider
          label="Object distance (multiples of f)"
          value={p}
          min={1.5}
          max={4}
          step={0.1}
          onChange={setP}
        />
        <Plot label="Two principal rays meet at real inverted image to right of converging thin lens">
          {line(20, 165, 620, 165, "#94a3b8")}
          <ellipse
            cx={centre}
            cy="165"
            rx="12"
            ry="100"
            fill="#dbeafe"
            stroke={blue}
          />
          {line(ox, 165, ox, 165 - height, green)}
          {txt(ox - 10, 100, "Object")}
          {line(ix, 165, ix, 165 - m * height, amber)}
          {txt(ix - 12, 190 - m * height, "Image")}
          {line(ox, 165 - height, centre, 165 - height, blue)}
          {line(centre, 165 - height, ix, 165 - m * height, blue)}
          {line(ox, 165 - height, ix, 165 - m * height, "#7c3aed")}
          {[centre - scale, centre + scale].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy="165" r="4" fill="#0f172a" />
              {txt(x - 10, 190, i ? "F₂" : "F₁")}
            </g>
          ))}
          {txt(255, 325, "Ideal thin lens")}
        </Plot>
      </>
    );
  } else if (lesson.id === "ohm") {
    const { current, power } = circuit(p, q);
    output = `I = V/R = ${current.toFixed(2)} A · P = VI = ${power.toFixed(2)} W`;
    drawing = (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            label="Voltage (V)"
            value={p}
            min={0}
            max={24}
            onChange={setP}
          />
          <Slider
            label="Resistance (Ω)"
            value={q}
            min={1}
            max={24}
            onChange={setQ}
          />
        </div>
        <Plot label="Closed DC circuit with battery and a single resistor">
          {line(100, 100, 270, 100)}
          {line(370, 100, 540, 100)}
          {line(540, 100, 540, 270)}
          {line(540, 270, 100, 270)}
          {line(100, 270, 100, 195)}
          {line(100, 155, 100, 100)}
          {line(70, 155, 130, 155, amber)}
          {line(85, 195, 115, 195, amber)}
          <rect
            x="270"
            y="80"
            width="100"
            height="40"
            fill="#dbeafe"
            stroke={blue}
            strokeWidth="3"
          />
          {txt(255, 60, `${q} Ω resistor`)}
          {txt(145, 180, `${p} V (+ upper)`)}
          {txt(235, 235, "Conventional current: clockwise")}
        </Plot>
      </>
    );
  } else if (lesson.id === "derivative") {
    const xmap = (x: number) => 320 + 65 * x,
      ymap = (y: number) => 290 - 35 * y;
    output = `Point (${p.toFixed(2)}, ${(p * p).toFixed(2)}) · tangent slope = ${(2 * p).toFixed(2)} · secant slope = ${secantSlope(p, q).toFixed(2)}`;
    drawing = (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          <Slider
            label="Point a"
            value={p}
            min={-2}
            max={2}
            step={0.1}
            onChange={setP}
          />
          <Slider
            label="Secant step h"
            value={q}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setQ}
          />
        </div>
        <Plot label="y=x squared, tangent and secant; axes use coordinate units">
          {line(40, 290, 610, 290, "#94a3b8")}
          {line(320, 20, 320, 320, "#94a3b8")}
          <svg
            x="40"
            y="20"
            width="570"
            height="300"
            viewBox="40 20 570 300"
            overflow="hidden"
          >
            <path
              d={pathFor((x) => x * x, -4, 4, xmap, ymap)}
              stroke={blue}
              strokeWidth="3"
              fill="none"
            />
            <path
              d={pathFor((x) => tangent(p, x), -4, 4, xmap, ymap)}
              stroke={green}
              strokeWidth="3"
              fill="none"
            />
            <path
              d={pathFor(
                (x) => p * p + secantSlope(p, q) * (x - p),
                -4,
                4,
                xmap,
                ymap,
              )}
              stroke={amber}
              strokeDasharray="6 5"
              strokeWidth="2"
              fill="none"
            />
            <circle cx={xmap(p)} cy={ymap(p * p)} r="6" fill={green} />
            <circle
              cx={xmap(p + q)}
              cy={ymap((p + q) ** 2)}
              r="5"
              fill={amber}
            />
          </svg>
          {txt(560, 335, "x (units)")}
          {txt(330, 20, "y")}
          {txt(40, 335, "Blue: x² · Green: tangent · Dashed: secant")}
        </Plot>
      </>
    );
  } else if (lesson.kind === "algorithm") {
    drawing = (
      <>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="text-sm font-semibold">
            Input array
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={100}
            />
          </label>
          {lesson.id === "binary-search" && (
            <label className="text-sm font-semibold">
              Target
              <input
                className="mt-1 w-24 rounded-xl border p-2"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                maxLength={5}
              />
            </label>
          )}
        </div>
        <button className={`${controlClass} mt-3`} onClick={apply}>
          Apply input
        </button>
        {error && (
          <p role="alert" className="mt-2 text-red-700">
            {error}
          </p>
        )}
        <div className="my-6 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {current?.values.map((v, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              aria-label={`Index ${i}, value ${v}`}
              className={`${controlClass} ${current.active.includes(i) ? "bg-blue-100 ring-2 ring-blue-500" : ""} ${current.low !== undefined && (i < current.low || i > current.high!) ? "opacity-50" : ""}`}
            >
              <strong>{v}</strong>
              <span className="block text-xs">index {i}</span>
            </button>
          ))}
        </div>
        {current?.key !== undefined && (
          <p className="rounded-xl bg-amber-50 p-3">
            Held key: <strong>{current.key}</strong> (stored separately during
            shifts)
          </p>
        )}
        {selected !== null && (
          <p role="status">
            Selected index {selected}: {current?.values[selected]}
          </p>
        )}
        {current?.low !== undefined && (
          <p>
            Search bounds: {current.low} to {current.high}
          </p>
        )}
      </>
    );
  } else if (lesson.id === "transformer") {
    // Parameter p starts at 12 for other lessons; ratio is controlled independently by q/6.
    const ratio = q / 6;
    output = `Primary: 12 V RMS · Nₛ/Nₚ = ${ratio.toFixed(2)} · Secondary: ${transformerVoltage(12, ratio).toFixed(2)} V RMS · ${ratio > 1 ? "Step-up" : ratio < 1 ? "Step-down" : "Equal turns"}`;
    drawing = (
      <>
        <Slider
          label="Turns ratio Nₛ/Nₚ"
          value={ratio}
          min={0.5}
          max={3}
          step={0.25}
          onChange={(n) => setQ(n * 6)}
        />
        <Plot label="Ideal transformer with separate windings coupled by a common core">
          <rect
            x="210"
            y="70"
            width="220"
            height="220"
            rx="25"
            fill="#e2e8f0"
          />
          <rect x="250" y="110" width="140" height="140" fill="white" />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <ellipse
                cx="225"
                cy={110 + i * 25}
                rx="40"
                ry="9"
                fill="none"
                stroke={blue}
                strokeWidth="4"
              />
              <ellipse
                cx="415"
                cy={110 + i * 25}
                rx="40"
                ry="9"
                fill="none"
                stroke={green}
                strokeWidth="4"
              />
            </g>
          ))}
          {txt(65, 45, "Primary AC: 12 V RMS", blue)}
          {txt(365, 45, "Secondary", green)}
          {txt(245, 325, "Common magnetic core")}
        </Plot>
      </>
    );
  }
  return (
    <div
      ref={root}
      className="relative z-10 p-5 pt-20 sm:p-7 sm:pt-20"
      data-testid="lab-simulation"
    >
      <h2 className="text-xl font-bold text-navy">{lesson.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {lesson.objective}
      </p>
      {drawing}
      {output && (
        <p
          className="my-4 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-900"
          role="status"
        >
          {output}
        </p>
      )}
      {count > 0 && (
        <>
          <p
            className="my-3 min-h-14 rounded-xl bg-slate-50 p-3 text-sm"
            aria-live={running ? "off" : "polite"}
          >
            Stage {step + 1}/{count}: {current?.message ?? lesson.stages[step]}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              className={controlClass}
              disabled={step === 0}
              onClick={() => {
                setPlaying(false);
                setStep((s) => s - 1);
              }}
            >
              Previous stage
            </button>
            <button
              className={controlClass}
              disabled={step >= count - 1}
              onClick={() => {
                setPlaying(false);
                setStep((s) => s + 1);
              }}
            >
              Next stage
            </button>
            <button
              className={controlClass}
              disabled={reducedMotion}
              onClick={() => {
                if (step === count - 1) setStep(0);
                setPlaying(!running);
              }}
            >
              {running ? "Pause process" : "Play process"}
            </button>
            <label className="flex items-center gap-2 text-sm">
              Playback speed
              <select
                className={controlClass}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={2}>2×</option>
              </select>
            </label>
          </div>
          {reducedMotion && (
            <p className="mt-3 text-sm">
              Reduced motion: use Previous stage and Next stage; automatic
              playback is disabled.
            </p>
          )}
        </>
      )}
      <button className={`${controlClass} my-4`} onClick={reset}>
        Reset lesson
      </button>
      <p className="text-xs leading-5 text-slate-500">{lesson.limitations}</p>
    </div>
  );
}

export function LessonCheck({ lesson }: { lesson: LabLesson }) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <details className="mt-5 rounded-xl border border-blue-100 p-3">
      <summary className="cursor-pointer font-semibold text-blue-800">
        Quick review · concept check
      </summary>
      <p className="my-3 text-sm">{lesson.check.question}</p>
      <p className="mb-2 text-xs text-slate-500">
        Model-local check; not an official textbook MCQ.
      </p>
      <div className="space-y-2">
        {lesson.check.options.map((o, i) => (
          <button
            className={`${controlClass} w-full text-left`}
            key={o}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            {o}
          </button>
        ))}
      </div>
      {choice !== null && (
        <p className="mt-3 text-sm" role="status">
          {choice === lesson.check.answer ? "Correct. " : "Try again. "}
          {lesson.check.explanation}
        </p>
      )}
    </details>
  );
}
