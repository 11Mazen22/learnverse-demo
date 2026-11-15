"use client";

import { useMemo, useState } from "react";
import { StudyRichText } from "@/components/study/study-rich-text";
import {
  classifyAqueousPh,
  computeAquaticSolutionState,
  computeWaterPhysicalState,
  getSubjectLabSpec,
  type SubjectLabId,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type SciencePilotLabProps = {
  labId: SubjectLabId;
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

function WaterPolarityDensityLab({
  uiLocale,
  contentLocale,
  initialMode,
}: {
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  initialMode: SubjectLabInitialMode;
}) {
  const spec = getSubjectLabSpec("sci-water-polarity-density");
  const [tab, setTab] = useState<"polarity" | "density">(
    initialMode === "density" ? "density" : "polarity",
  );
  const [showNeighbourHBond, setShowNeighbourHBond] = useState<boolean>(true);
  const [phValue, setPhValue] = useState<number>(7);
  const [tempC, setTempC] = useState<number>(4);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const phState = useMemo(() => classifyAqueousPh(phValue), [phValue]);
  const waterState = useMemo(() => computeWaterPhysicalState(tempC), [tempC]);

  const liveStatusText =
    tab === "polarity"
      ? tContent(
          `زاوية جزيء الماء 104.5° قطبية؛ عند 25°C قيمة pH = ${phState.ph} تُصنَّف كمحلول ${
            phState.category === "acidic" ? "حمضي (< 7)" : phState.category === "basic" ? "قاعدي (> 7)" : "متعادل (= 7)"
          }.`,
          `H₂O bent angle 104.5° polar; at 25°C, pH = ${phState.ph} is ${phState.category}.`,
        )
      : tContent(
          `عند ${waterState.tempC}°C (${waterState.tempKelvin} K)، كثافة الماء ≈ ${waterState.densityGCm3} g/cm³ — ${
            waterState.tempC < 0
              ? "حالة جليد يطفو على السطح عازلًا الأحياء المائية"
              : waterState.regime === "maximum-density"
                ? "ذروة الكثافة (~4°C) فينغمر للقاع الدافئ"
                : waterState.regime === "anomalous-liquid"
                  ? "شذوذ تمدد الماء بين 0°C و 4°C"
                  : "تمدد حراري اعتيادي"
          }.`,
          `At ${waterState.tempC}°C (${waterState.tempKelvin} K), water density is ~${waterState.densityGCm3} g/cm³ (${waterState.regime}).`,
        );

  // Density curve points across -5..25°C mapped onto SVG viewBox 280x165
  const densityCurvePath = useMemo(() => {
    const pts: string[] = [];
    for (let t = -5; t <= 25; t += 1) {
      const s = computeWaterPhysicalState(t);
      const x = 32 + ((t + 5) / 30) * 228;
      // Density range ~0.91 -> 1.001
      const y = 140 - ((s.densityGCm3 - 0.91) / 0.095) * 110;
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  const markerX = 32 + ((waterState.tempC + 5) / 30) * 228;
  const markerY = 140 - ((waterState.densityGCm3 - 0.91) / 0.095) * 110;

  return (
    <SubjectLabFrame
      spec={spec}
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      liveStatusText={liveStatusText}
      headerActions={
        <div className="noata-lab-mode-tabs" role="group" aria-label={tUi("أوضاع مختبر الماء", "Water lab views")}>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "polarity" ? "is-active" : ""}`}
            aria-pressed={tab === "polarity"}
            onClick={() => setTab("polarity")}
          >
            <StudyRichText
              content={tUi("قطبية $\\text{H}_2\\text{O}$ والروابط والـ $\\text{pH}$", "$\\text{H}_2\\text{O}$ Polarity & $\\text{pH}$")}
              dir={uiLocale === "ar" ? "rtl" : "ltr"}
              locale={contentLocale}
              inline
            />
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "density" ? "is-active" : ""}`}
            aria-pressed={tab === "density"}
            onClick={() => setTab("density")}
          >
            {tUi("شذوذ الكثافة 4°C والجليد", "4°C Density Anomaly")}
          </button>
        </div>
      }
    >
      {tab === "polarity" ? (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card" dir="ltr">
            <svg
              viewBox="0 0 280 185"
              className="noata-lab-svg noata-lab-svg--wide"
              role="img"
              aria-label={tContent(
                "تركيب جزيء الماء المنحني بزاوية 104.5° والروابط التساهمية مقابل الرابطة الهيدروجينية",
                "Bent H₂O molecule (104.5 degrees) comparing covalent O-H bonds with intermolecular hydrogen bonds",
              )}
            >
              {/* Primary H2O molecule */}
              <line x1="88" y1="88" x2="48" y2="124" stroke="var(--ink)" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="88" y1="88" x2="128" y2="124" stroke="var(--ink)" strokeWidth="4.5" strokeLinecap="round" />
              <circle cx="88" cy="88" r="22" fill="#b91c1c" />
              <text x="88" y="84" textAnchor="middle" fontSize="13" fontWeight="800" fill="#ffffff">O</text>
              <text x="88" y="99" textAnchor="middle" fontSize="11" fontWeight="700" fill="#ffffff">δ−</text>

              <circle cx="48" cy="124" r="14" fill="#0369a1" />
              <text x="48" y="128" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">H δ+</text>

              <circle cx="128" cy="124" r="14" fill="#0369a1" />
              <text x="128" y="128" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">H δ+</text>

              {/* Angle arc label */}
              <path d="M 70 105 A 22 22 0 0 0 106 105" fill="none" stroke="var(--warning)" strokeWidth="2" />
              <text x="88" y="126" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--ink)">104.5°</text>

              {/* Intermolecular H-bond to neighbour */}
              {showNeighbourHBond ? (
                <g>
                  <line
                    x1="143"
                    y1="120"
                    x2="188"
                    y2="82"
                    stroke="var(--warning)"
                    strokeWidth="3"
                    strokeDasharray="6 5"
                  />
                  <rect x="136" y="64" width="68" height="18" rx="6" fill="var(--surface-soft)" stroke="var(--warning)" />
                  <text x="170" y="76" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--ink)">
                    {tContent("هيدروجينية", "H-bond")}
                  </text>

                  <line x1="208" y1="68" x2="236" y2="108" stroke="var(--ink)" strokeWidth="4" />
                  <line x1="208" y1="68" x2="246" y2="54" stroke="var(--ink)" strokeWidth="4" />
                  <circle cx="208" cy="68" r="20" fill="#b91c1c" />
                  <text x="208" y="65" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff">O</text>
                  <text x="208" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill="#ffffff">δ−</text>
                  <circle cx="236" cy="108" r="12" fill="#0369a1" />
                  <text x="236" y="112" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">H</text>
                  <circle cx="246" cy="54" r="12" fill="#0369a1" />
                  <text x="246" y="58" textAnchor="middle" fontSize="10" fontWeight="800" fill="#ffffff">H</text>
                </g>
              ) : null}

              <text x="140" y="166" textAnchor="middle" fontSize="10" fill="var(--muted)" fontWeight="700">
                {tContent(
                  "خط متصل = رابطة تساهمية قطبية قوية (O–H)",
                  "Solid line = Polar Covalent O–H (strong)",
                )}
              </text>
            </svg>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-preset-row">
              <button
                type="button"
                aria-label={
                  showNeighbourHBond
                    ? tUi("إظهار الرابطة الهيدروجينية بين الجزيئات", "Intermolecular H-Bond: ON")
                    : tUi("عرض جزيء H2O منفرد", "Single H2O only")
                }
                className={`noata-lab-preset-btn ${showNeighbourHBond ? "is-active" : ""}`}
                aria-pressed={showNeighbourHBond}
                onClick={() => setShowNeighbourHBond((v) => !v)}
              >
                {showNeighbourHBond
                  ? tUi("إظهار الرابطة الهيدروجينية بين الجزيئات ✓", "Intermolecular H-Bond: ON")
                  : (
                      <StudyRichText
                        content={tUi("عرض جزيء $\\text{H}_2\\text{O}$ منفرد", "Single $\\text{H}_2\\text{O}$ only")}
                        dir={uiLocale === "ar" ? "rtl" : "ltr"}
                        locale={contentLocale}
                        inline
                      />
                    )}
              </button>
            </div>

            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="water-ph-slider">
                  {tUi("مقياس pH عند 25°C:", "Aqueous pH at 25°C:")}
                </label>
                <strong dir="ltr">pH = {phState.ph}</strong>
              </div>
              <input
                id="water-ph-slider"
                type="range"
                min={0}
                max={14}
                step={0.5}
                value={phValue}
                onChange={(e) => setPhValue(Number(e.target.value))}
              />
              <div className="noata-lab-preset-row">
                {[
                  { label: tUi("حمضي (pH 2)", "Acidic (2)"), val: 2 },
                  { label: tUi("متعادل (pH 7)", "Neutral (7)"), val: 7 },
                  { label: tUi("قاعدي (pH 11)", "Basic (11)"), val: 11 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    className={`noata-lab-preset-btn ${phValue === preset.val ? "is-active" : ""}`}
                    onClick={() => setPhValue(preset.val)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="noata-lab-readout-box">
              <div className="noata-lab-metrics-row">
                <span>
                  {tUi("التصنيف عند 25°C:", "Classification (25°C):")}{" "}
                  <strong>
                    <StudyRichText
                      content={
                        phState.category === "acidic"
                          ? tContent("وسط حمضي — تركيز $[\\text{H}^+]$ أعلى", "Acidic — higher $[\\text{H}^+]$")
                          : phState.category === "basic"
                            ? tContent("وسط قاعدي — تركيز $[\\text{OH}^-]$ أعلى", "Basic — higher $[\\text{OH}^-]$")
                            : tContent("وسط متعادل — ماء نقي $[\\text{H}^+] = [\\text{OH}^-]$", "Neutral — $[\\text{H}^+] = [\\text{OH}^-]$")
                      }
                      dir={contentLocale === "ar" ? "rtl" : "ltr"}
                      locale={contentLocale}
                      inline
                    />
                  </strong>
                </span>
              </div>
              <StudyRichText
                blocks={[
                  {
                    type: "chemistry",
                    display: true,
                    equation: `pH = ${phState.ph} (${
                      phState.category === "acidic" ? "< 7" : phState.category === "basic" ? "> 7" : "= 7"
                    } at 25°C)`,
                    tex: `\\text{pH} = ${phState.ph} \\;\\;(${
                      phState.category === "acidic" ? "< 7" : phState.category === "basic" ? "> 7" : "= 7"
                    }\\text{ at }25^\\circ\\text{C})`,
                  },
                ]}
                dir="ltr"
                locale={contentLocale}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card" dir="ltr">
            <svg
              viewBox="0 0 280 185"
              className="noata-lab-svg noata-lab-svg--wide"
              role="img"
              aria-label={tContent(
                "منحنى كثافة الماء مقابل درجة الحرارة من -5 إلى 25 مئوية",
                "Water density curve vs. temperature (-5°C to 25°C) peaking near 4°C",
              )}
            >
              {/* Axes */}
              <line x1="32" y1="22" x2="32" y2="146" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="32" y1="146" x2="266" y2="146" stroke="var(--line-strong)" strokeWidth="1.5" />
              {/* 4°C vertical peak marker */}
              <line x1="100.4" y1="26" x2="100.4" y2="146" stroke="var(--success)" strokeDasharray="4 3" />
              <text x="103" y="24" fontSize="9.5" fontWeight="800" fill="var(--success)">
                {tContent("الذروة ~4°C", "max ~4°C")}
              </text>
              {/* 0°C freezing transition */}
              <line x1="70" y1="26" x2="70" y2="146" stroke="var(--warning)" strokeDasharray="2 3" />
              <text x="66" y="160" textAnchor="middle" fontSize="9.5" fill="var(--muted)">0°C</text>
              <text x="100.4" y="160" textAnchor="middle" fontSize="9.5" fill="var(--success)" fontWeight="700">4°C</text>
              <text x="256" y="160" textAnchor="end" fontSize="9.5" fill="var(--muted)">25°C</text>
              <text x="28" y="34" textAnchor="end" fontSize="9" fill="var(--muted)">1.00</text>
              <text x="28" y="142" textAnchor="end" fontSize="9" fill="var(--muted)">0.91</text>

              <polyline fill="none" stroke="var(--subject-accent)" strokeWidth="3" points={densityCurvePath} />
              <circle cx={markerX} cy={markerY} r="6.5" fill="var(--danger)" stroke="var(--surface)" strokeWidth="2" />
            </svg>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="water-temp-slider">{tUi("درجة حرارة الماء (°C):", "Temperature (°C):")}</label>
                <strong dir="ltr">{waterState.tempC}°C ({waterState.tempKelvin} K)</strong>
              </div>
              <input
                id="water-temp-slider"
                type="range"
                min={-5}
                max={25}
                step={1}
                value={tempC}
                onChange={(e) => setTempC(Number(e.target.value))}
              />
              <div className="noata-lab-preset-row">
                {[
                  { label: tUi("جليد (-4°C)", "Ice (-4°C)"), val: -4 },
                  { label: "0°C", val: 0 },
                  { label: tUi("ذروة (4°C)", "Max (4°C)"), val: 4 },
                  { label: "20°C", val: 20 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    className={`noata-lab-preset-btn ${tempC === preset.val ? "is-active" : ""}`}
                    onClick={() => setTempC(preset.val)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="noata-lab-readout-box">
              <StudyRichText
                blocks={[
                  {
                    type: "chemistry",
                    display: true,
                    equation: `ρ(${waterState.tempC}°C) ≈ ${waterState.densityGCm3} g/cm³`,
                    tex: `\\rho(${waterState.tempC}^\\circ\\text{C}) \\approx ${waterState.densityGCm3}\\,\\text{g/cm}^3`,
                  },
                  {
                    type: "chemistry",
                    display: true,
                    equation: `T(K) = ${waterState.tempKelvin} K`,
                    tex: `T(\\text{K}) = ${waterState.tempKelvin}\\,\\text{K}`,
                  },
                ]}
                dir="ltr"
                locale={contentLocale}
              />
              <div className="noata-lab-metrics-row">
                <span>
                  {tUi("السلوك:", "Behaviour:")}{" "}
                  <strong>
                    {waterState.regime === "ice-lattice"
                      ? tContent("شبكة بلورية مفتوحة تطفو وتمنع تجمد القاع", "Open hexagonal ice floats & insulates benthic life")
                      : waterState.regime === "maximum-density"
                        ? tContent("أقصى كثافة عند ~4°C فينزل للقاع", "Peak density at ~4°C; sinks smoothly below surface ice")
                        : waterState.regime === "anomalous-liquid"
                          ? tContent("شذوذ التمدد (0 إلى 4°C)", "Anomalous cooling expansion (0–4°C)")
                          : tContent("سائل طبيعي فوق 4°C", "Normal thermal liquid phase above 4°C")}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </SubjectLabFrame>
  );
}

function AquaticSolutionExperimentLab({
  uiLocale,
  contentLocale,
  initialMode,
}: {
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  initialMode: SubjectLabInitialMode;
}) {
  const spec = getSubjectLabSpec("sci-aquatic-solution-osmosis");
  const [tab, setTab] = useState<"osmosis" | "trophic">(
    initialMode === "trophic" ? "trophic" : "osmosis",
  );
  const [extSalinity, setExtSalinity] = useState<number>(35);
  const [waterTemp, setWaterTemp] = useState<number>(22);
  const [trophicRate, setTrophicRate] = useState<number>(10);

  const cellSalinity = 9;
  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const state = useMemo(
    () => computeAquaticSolutionState(extSalinity, cellSalinity, waterTemp, trophicRate),
    [extSalinity, cellSalinity, waterTemp, trophicRate],
  );

  const liveStatusText =
    tab === "osmosis"
      ? tContent(
          `ملوحة الوسط ${state.externalSalinityPpt} ppt مقابل داخل الخلية 9 ppt: ${
            state.osmoticDirection === "efflux-shrink"
              ? "يخرج الماء للخارج وتنكمش الخلية"
              : state.osmoticDirection === "influx-swell"
                ? "يدخل الماء للداخل وتنتفخ الخلية"
                : "توازن أسموزي ديناميكي"
          }؛ ذوبان O₂ ${state.dissolvedO2Index}.`,
          `External ${state.externalSalinityPpt} ppt vs internal 9 ppt: ${state.osmoticDirection}; dissolved O₂ is ${state.dissolvedO2Index}.`,
        )
      : tContent(
          `تقدير تقريبي للهرم الغذائي (~${state.trophicTransferPercent}% لكل انتقال): من 1000 وحدة عند المنتجات إلى ${state.trophicLevels[3].energyUnits} عند المستهلك الثالثي.`,
          `Approximate trophic transfer (~${state.trophicTransferPercent}% per step): 1000 units at producers down to ${state.trophicLevels[3].energyUnits} at tertiary consumers.`,
        );

  return (
    <SubjectLabFrame
      spec={spec}
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      liveStatusText={liveStatusText}
      headerActions={
        <div className="noata-lab-mode-tabs" role="group" aria-label={tUi("أوضاع المحاليل البيئية", "Aquatic lab views")}>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "osmosis" ? "is-active" : ""}`}
            aria-pressed={tab === "osmosis"}
            onClick={() => setTab("osmosis")}
          >
            {tUi("الأسموزية وذوبان O₂", "Osmosis & Colligative")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "trophic" ? "is-active" : ""}`}
            aria-pressed={tab === "trophic"}
            onClick={() => setTab("trophic")}
          >
            {tUi("هرم الطاقة (~10%)", "Trophic Pyramid (~10%)")}
          </button>
        </div>
      }
    >
      {tab === "osmosis" ? (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card" dir="ltr">
            <svg
              viewBox="0 0 280 185"
              className="noata-lab-svg noata-lab-svg--wide"
              role="img"
              aria-label={tContent(
                "رسم الغشاء شبه المنفذ واتجاه انتقال جزيئات الماء بالأسموزية",
                "Semi-permeable cell membrane showing net osmotic water arrow direction",
              )}
            >
              {/* External bath background */}
              <rect x="10" y="10" width="260" height="165" rx="18" fill="var(--subject-accent)" fillOpacity="0.1" stroke="var(--line-strong)" />
              <text x="24" y="30" fontSize="10.5" fontWeight="700" fill="var(--ink)">
                {tContent(
                  `الوسط الخارجي: ${state.externalSalinityPpt} ppt`,
                  `External bath: ${state.externalSalinityPpt} ppt`,
                )}
              </text>

              {/* Living cell ellipse scaling slightly with turgor state */}
              <ellipse
                cx="140"
                cy="98"
                rx={state.osmoticDirection === "influx-swell" ? 68 : state.osmoticDirection === "efflux-shrink" ? 48 : 58}
                ry={state.osmoticDirection === "influx-swell" ? 50 : state.osmoticDirection === "efflux-shrink" ? 36 : 44}
                fill="var(--surface)"
                stroke="var(--subject-accent)"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
              <text x="140" y="95" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--ink)">
                {tContent("الخلية: 9 ppt", "Cell: 9 ppt")}
              </text>
              <text x="140" y="112" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--muted)">
                {state.osmoticDirection === "efflux-shrink"
                  ? tContent("صافي الماء للخارج ← انكماش", "Net H₂O OUT → shrinks")
                  : state.osmoticDirection === "influx-swell"
                    ? tContent("صافي الماء للداخل ← انتفاخ", "Net H₂O IN → swells")
                    : tContent("اتزان ديناميكي ⇄", "Dynamic equilibrium ⇄")}
              </text>

              {/* Directional osmosis arrows */}
              {state.osmoticDirection === "efflux-shrink" ? (
                <>
                  <path d="M 88 98 L 42 98 M 52 91 L 42 98 L 52 105" stroke="var(--danger)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 192 98 L 238 98 M 228 91 L 238 98 L 228 105" stroke="var(--danger)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              ) : state.osmoticDirection === "influx-swell" ? (
                <>
                  <path d="M 38 98 L 84 98 M 74 91 L 84 98 L 74 105" stroke="var(--success)" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 242 98 L 196 98 M 206 91 L 196 98 L 206 105" stroke="var(--success)" strokeWidth="3" fill="none" strokeLinecap="round" />
                </>
              ) : (
                <text x="140" y="160" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--success)">
                  {tContent("تدفق متوازن للماء في الاتجاهين", "Balanced bidirectional H₂O flux")}
                </text>
              )}
            </svg>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="salinity-slider">{tUi("ملوحة الوسط الخارجي (ppt):", "External Salinity (ppt):")}</label>
                <strong dir="ltr">{state.externalSalinityPpt} ppt</strong>
              </div>
              <input
                id="salinity-slider"
                type="range"
                min={0}
                max={60}
                step={1}
                value={extSalinity}
                onChange={(e) => setExtSalinity(Number(e.target.value))}
              />
              <div className="noata-lab-preset-row">
                <button type="button" className="noata-lab-preset-btn" onClick={() => setExtSalinity(0)}>
                  {tUi("ماء عذب (0)", "Fresh (0)")}
                </button>
                <button type="button" className="noata-lab-preset-btn" onClick={() => setExtSalinity(9)}>
                  {tUi("متساوي (9)", "Isotonic (9)")}
                </button>
                <button type="button" className="noata-lab-preset-btn" onClick={() => setExtSalinity(35)}>
                  {tUi("ماء بحر (35)", "Seawater (35)")}
                </button>
              </div>
            </div>

            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="aquatic-temp-slider">{tUi("حرارة الماء (°C):", "Water Temperature (°C):")}</label>
                <strong dir="ltr">{state.tempC}°C</strong>
              </div>
              <input
                id="aquatic-temp-slider"
                type="range"
                min={5}
                max={35}
                step={1}
                value={waterTemp}
                onChange={(e) => setWaterTemp(Number(e.target.value))}
              />
            </div>

            <div className="noata-lab-readout-box">
              <div className="noata-lab-metrics-row">
                <span>
                  {tUi("الخواص التجميعية:", "Colligative shifts:")}{" "}
                  <strong>
                    <StudyRichText
                      content={`$\\Delta T_b \\approx +${state.boilingElevationNote}^\\circ\\text{C}$ · $\\Delta T_f \\approx ${state.freezingDepressionNote}^\\circ\\text{C}$`}
                      dir="ltr"
                      locale={contentLocale}
                      inline
                    />
                  </strong>
                </span>
                <span>
                  <StudyRichText
                    content={tUi("توافر $\\text{O}_2$ المذاب:", "Dissolved $\\text{O}_2$:")}
                    dir={uiLocale === "ar" ? "rtl" : "ltr"}
                    locale={contentLocale}
                    inline
                  />{" "}
                  <strong>
                    {state.dissolvedO2Index === "high"
                      ? tContent("مرتفع (مياه باردة وعذبة نسبيًا)", "High (cooler, lower salinity)")
                      : state.dissolvedO2Index === "moderate"
                        ? tContent("متوسط", "Moderate")
                        : tContent("منخفض (حرارة أو ملوحة مرتفعة)", "Low (warm or saline stress)")}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card">
            <div className="noata-trophic-stack" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
              {state.trophicLevels.map((lvl) => {
                const labelsAr = ["المنتجات (الطحالب والنباتات)", "المستهلك الأولي", "المستهلك الثانوي", "المستهلك الثالثي"];
                const labelsEn = ["Producers (Algae / Plants)", "Primary Consumers", "Secondary Consumers", "Tertiary Consumers"];
                const widthPct = Math.max(12, Math.round((lvl.energyUnits / 1000) * 100));
                return (
                  <div key={lvl.level} className="noata-trophic-row">
                    <div className="noata-trophic-meta">
                      <span>{contentLocale === "ar" ? labelsAr[lvl.level - 1] : labelsEn[lvl.level - 1]}</span>
                      <strong dir="ltr">~{lvl.energyUnits} kJ</strong>
                    </div>
                    <div className="noata-trophic-track">
                      <span style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="trophic-rate-slider">
                  {tUi("نسبة الانتقال التقريبية بين المستويات:", "Approximate transfer rate:")}
                </label>
                <strong dir="ltr">~{state.trophicTransferPercent}%</strong>
              </div>
              <input
                id="trophic-rate-slider"
                type="range"
                min={5}
                max={20}
                step={1}
                value={trophicRate}
                onChange={(e) => setTrophicRate(Number(e.target.value))}
              />
            </div>

            <div className="noata-lab-readout-box" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
              <StudyRichText
                blocks={[
                  {
                    type: "callout",
                    variant: "pitfall",
                    title: tContent("قاعدة تقريبية لا قانون مطلق", "Empirical Approximation, Not Strict Law"),
                    content: tContent(
                      "يُفقد الجزء الأكبر من الطاقة في التنفس والحرارة والفضلات (~80–95%)، ولذلك يُستخدم 10% كنموذج إرشادي لتفسير قِصر السلاسل الغذائية.",
                      "Most energy leaves via respiration, heat, and waste (~80–95%). The ~10% figure is a teaching average across real ecosystems (~5–20%).",
                    ),
                  },
                ]}
                dir={contentLocale === "ar" ? "rtl" : "ltr"}
                locale={contentLocale}
              />
            </div>
          </div>
        </div>
      )}
    </SubjectLabFrame>
  );
}

/**
 * Pilot 2 router for Integrated Science interactive labs.
 */
export function SciencePilotLab({
  labId,
  initialMode,
  uiLocale,
  contentLocale,
}: SciencePilotLabProps) {
  if (labId === "sci-aquatic-solution-osmosis") {
    return (
      <AquaticSolutionExperimentLab
        uiLocale={uiLocale}
        contentLocale={contentLocale}
        initialMode={initialMode}
      />
    );
  }
  return (
    <WaterPolarityDensityLab
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      initialMode={initialMode}
    />
  );
}
