"use client";

import { useMemo, useState } from "react";
import { StudyRichText } from "@/components/study/study-rich-text";
import {
  analyzeComplexNumber,
  analyzeQuadraticEquation,
  computePowerOfI,
  getSubjectLabSpec,
  type SubjectLabId,
  type SubjectLabInitialMode,
} from "@/lib/curriculum/subject-labs";
import { SubjectLabFrame } from "./subject-lab-frame";

export type PilotLabProps = {
  labId: SubjectLabId;
  initialMode: SubjectLabInitialMode;
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
};

function ComplexCycleArgandLab({
  uiLocale,
  contentLocale,
  initialMode,
}: {
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  initialMode: SubjectLabInitialMode;
}) {
  const spec = getSubjectLabSpec("math-complex-argand");
  const [tab, setTab] = useState<"powers" | "argand">(
    initialMode === "argand" ? "argand" : "powers",
  );
  const [exponent, setExponent] = useState<number>(7);
  const [realA, setRealA] = useState<number>(3);
  const [imagB, setImagB] = useState<number>(4);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const power = useMemo(() => computePowerOfI(exponent), [exponent]);
  const complex = useMemo(() => analyzeComplexNumber(realA, imagB), [realA, imagB]);

  const symI = contentLocale === "ar" ? "\\text{ت}" : "i";
  const liveStatusText =
    tab === "powers"
      ? tContent(
          `$${symI}^{${power.exponent}} = ${power.remainder === 0 ? "1" : power.remainder === 1 ? "\\text{ت}" : power.remainder === 2 ? "-1" : "-\\text{ت}"}$ لأن باقي قسمة ${power.exponent} على $4$ هو $${power.remainder}$.`,
          `$i^{${power.exponent}} = ${power.notation}$ because $${power.exponent} \\bmod 4 = ${power.remainder}$.`,
        )
      : tContent(
          `$\\text{ع} = ${complex.a} ${complex.b >= 0 ? "+" : "-"} ${Math.abs(complex.b)}\\text{ت}$، والمرافق $\\bar{\\text{ع}} = ${complex.conjugateA} ${complex.conjugateB >= 0 ? "+" : "-"} ${Math.abs(complex.conjugateB)}\\text{ت}$، وحاصل ضربهما $= ${complex.modulusSq}$.`,
          `$z = ${complex.a} ${complex.b >= 0 ? "+" : "-"} ${Math.abs(complex.b)}i$, conjugate $\\bar{z}$ has imaginary part $${complex.conjugateB}$, product $z\\cdot\\bar{z} = ${complex.modulusSq}$.`,
        );

  const cycleNodes: Array<{ label: string; rem: 0 | 1 | 2 | 3; x: number; y: number }> = [
    { label: "1", rem: 0, x: 182, y: 100 },
    { label: contentLocale === "ar" ? "ت" : "i", rem: 1, x: 100, y: 20 },
    { label: "-1", rem: 2, x: 18, y: 100 },
    { label: contentLocale === "ar" ? "-ت" : "-i", rem: 3, x: 100, y: 180 },
  ];

  // Map Argand (-5..5) onto 220x220 viewBox
  const toSvgX = (x: number) => 110 + x * 17;
  const toSvgY = (y: number) => 110 - y * 17;

  return (
    <SubjectLabFrame
      spec={spec}
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      liveStatusText={liveStatusText}
      headerActions={
        <div className="noata-lab-mode-tabs" role="group" aria-label={tUi("أوضاع مختبر المركبة", "Complex lab modes")}>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "powers" ? "is-active" : ""}`}
            aria-pressed={tab === "powers"}
            onClick={() => setTab("powers")}
          >
            {tUi(
              `دورة قوى ${contentLocale === "ar" ? "ت" : "i"}`,
              "Powers of i Cycle",
            )}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${tab === "argand" ? "is-active" : ""}`}
            aria-pressed={tab === "argand"}
            onClick={() => setTab("argand")}
          >
            {tUi("مستوى أرجاند والمرافق", "Argand Plane & Conjugate")}
          </button>
        </div>
      }
    >
      {tab === "powers" ? (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card" dir="ltr">
            <svg
              viewBox="0 0 200 200"
              className="noata-lab-svg"
              role="img"
              aria-label={tContent(
                `دورة قوى i للأس ${power.exponent}`,
                `Unit circle powers of i diagram for exponent ${power.exponent}`,
              )}
            >
              <line x1="20" y1="100" x2="180" y2="100" stroke="var(--line-strong)" strokeDasharray="3 3" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="var(--line-strong)" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="64" fill="none" stroke="var(--subject-accent)" strokeWidth="2" strokeOpacity="0.35" />
              <line
                x1="100"
                y1="100"
                x2={100 + power.real * 64}
                y2={100 - power.imag * 64}
                stroke="var(--subject-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle
                cx={100 + power.real * 64}
                cy={100 - power.imag * 64}
                r="7"
                fill="var(--subject-accent)"
              />
              {cycleNodes.map((node) => {
                const active = power.remainder === node.rem;
                return (
                  <g key={node.rem}>
                    <rect
                      x={node.x - 16}
                      y={node.y - 12}
                      width="32"
                      height="24"
                      rx="8"
                      fill={active ? "var(--accent)" : "var(--surface-soft)"}
                      stroke={active ? "var(--accent)" : "var(--line-strong)"}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="800"
                      fill={active ? "var(--on-accent, #ffffff)" : "var(--ink)"}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="complex-exponent-slider">
                  {tUi("قيمة الأس n:", "Exponent n:")}
                </label>
                <strong dir="ltr">n = {power.exponent}</strong>
              </div>
              <input
                id="complex-exponent-slider"
                type="range"
                min={0}
                max={24}
                step={1}
                value={exponent}
                onChange={(e) => setExponent(Number(e.target.value))}
              />
              <div className="noata-lab-preset-row">
                <button
                  type="button"
                  className="noata-lab-preset-btn"
                  onClick={() => setExponent((v) => Math.max(0, v - 1))}
                >
                  −1
                </button>
                <button
                  type="button"
                  className="noata-lab-preset-btn"
                  onClick={() => setExponent((v) => Math.min(24, v + 1))}
                >
                  +1
                </button>
                {[7, 10, 14, 15, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    aria-label={
                      contentLocale === "ar"
                        ? `ت أس ${preset}`
                        : `i raised to power ${preset}`
                    }
                    className={`noata-lab-preset-btn ${exponent === preset ? "is-active" : ""}`}
                    onClick={() => setExponent(preset)}
                  >
                    <StudyRichText
                      content={
                        contentLocale === "ar"
                          ? `$\\text{ت}^{${preset}}$`
                          : `$i^{${preset}}$`
                      }
                      dir="ltr"
                      locale={contentLocale}
                      inline
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="noata-lab-readout-box" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
              <StudyRichText
                blocks={[{ type: "math", display: true, tex: power.latex }]}
                dir="ltr"
                locale={contentLocale}
              />
              <div className="noata-lab-metrics-row">
                <span>
                  {tUi("حاصل القسمة ÷ 4:", "Quotient ÷ 4:")} <strong>{power.quotient}</strong>
                </span>
                <span>
                  {tUi("الباقي r:", "Remainder r:")} <strong>{power.remainder}</strong>
                </span>
                <span>
                  {tUi("الزاوية:", "Rotation:")} <strong dir="ltr">{power.angleDeg}°</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="noata-lab-split">
          <div className="noata-lab-visual-card" dir="ltr">
            <svg
              viewBox="0 0 220 220"
              className="noata-lab-svg"
              role="img"
              aria-label={tContent(
                `تمثيل العدد المركب ومرافقه على مستوى أرجاند`,
                `Argand diagram showing z = ${complex.a} + ${complex.b}i and its conjugate`,
              )}
            >
              <line x1="15" y1="110" x2="205" y2="110" stroke="var(--line-strong)" strokeWidth="1.5" />
              <line x1="110" y1="15" x2="110" y2="205" stroke="var(--line-strong)" strokeWidth="1.5" />
              <text x="196" y="102" textAnchor="end" fontSize="11" fill="var(--muted)" fontWeight="700">
                {contentLocale === "ar" ? "ح (الحقيقي)" : "Re"}
              </text>
              <text x="116" y="24" fontSize="11" fill="var(--muted)" fontWeight="700">
                {contentLocale === "ar" ? "ت (التخيلي)" : "Im"}
              </text>

              {/* Projection triangle for modulus */}
              <line
                x1={toSvgX(complex.a)}
                y1="110"
                x2={toSvgX(complex.a)}
                y2={toSvgY(complex.b)}
                stroke="var(--muted)"
                strokeDasharray="3 3"
              />
              {/* Conjugate z̄ vector */}
              <line
                x1="110"
                y1="110"
                x2={toSvgX(complex.conjugateA)}
                y2={toSvgY(complex.conjugateB)}
                stroke="var(--muted)"
                strokeWidth="2.5"
                strokeDasharray="5 4"
              />
              <circle cx={toSvgX(complex.conjugateA)} cy={toSvgY(complex.conjugateB)} r="5" fill="var(--muted)" />
              {/* Primary z vector */}
              <line
                x1="110"
                y1="110"
                x2={toSvgX(complex.a)}
                y2={toSvgY(complex.b)}
                stroke="var(--subject-accent)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx={toSvgX(complex.a)} cy={toSvgY(complex.b)} r="6" fill="var(--subject-accent)" />
            </svg>
          </div>

          <div className="noata-lab-controls-card">
            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="argand-real-slider">{tUi("الجزء الحقيقي a:", "Real part a:")}</label>
                <strong dir="ltr">Re(z) = {complex.a}</strong>
              </div>
              <input
                id="argand-real-slider"
                type="range"
                min={-5}
                max={5}
                step={1}
                value={realA}
                onChange={(e) => setRealA(Number(e.target.value))}
              />
            </div>

            <div className="noata-lab-slider-field">
              <div className="noata-lab-slider-label-row">
                <label htmlFor="argand-imag-slider">{tUi("معامل الجزء التخيلي b:", "Imaginary coefficient b:")}</label>
                <strong dir="ltr">Im(z) = {complex.b}</strong>
              </div>
              <input
                id="argand-imag-slider"
                type="range"
                min={-5}
                max={5}
                step={1}
                value={imagB}
                onChange={(e) => setImagB(Number(e.target.value))}
              />
            </div>

            <div className="noata-lab-readout-box">
              <StudyRichText
                blocks={[
                  { type: "math", display: true, tex: complex.standardLatex },
                  { type: "math", display: true, tex: complex.conjugateProductLatex },
                ]}
                dir="ltr"
                locale={contentLocale}
              />
              <div className="noata-lab-metrics-row">
                <span>
                  {tUi("المعيار |z|:", "|z|:")} <strong dir="ltr">{complex.modulus}</strong>
                </span>
                <span>
                  {tUi("التصنيف:", "Type:")}{" "}
                  <strong>
                    {complex.classification === "pure-real"
                      ? tContent("حقيقي صرف (b = 0)", "Purely real (b = 0)")
                      : complex.classification === "pure-imaginary"
                        ? tContent("تخيلي صرف (a = 0)", "Purely imaginary (a = 0)")
                        : complex.classification === "zero"
                          ? tContent("نقطة الأصل (0)", "Zero")
                          : tContent("مركب عام a + bi", "General complex a + bi")}
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

function QuadraticParabolaLab({
  uiLocale,
  contentLocale,
  initialMode,
}: {
  uiLocale: "ar" | "en";
  contentLocale: "ar" | "en";
  initialMode: SubjectLabInitialMode;
}) {
  const spec = getSubjectLabSpec("math-quadratic-parabola");
  const [focusMode, setFocusMode] = useState<"discriminant" | "vieta" | "sign">(
    initialMode === "vieta"
      ? "vieta"
      : initialMode === "sign" || initialMode === "inequality"
        ? "sign"
        : "discriminant",
  );
  const [coeffA, setCoeffA] = useState<number>(1);
  const [coeffB, setCoeffB] = useState<number>(-2);
  const [coeffC, setCoeffC] = useState<number>(-3);

  const tUi = (ar: string, en: string) => (uiLocale === "ar" ? ar : en);
  const tContent = (ar: string, en: string) => (contentLocale === "ar" ? ar : en);

  const analysis = useMemo(
    () => analyzeQuadraticEquation(coeffA, coeffB, coeffC),
    [coeffA, coeffB, coeffC],
  );

  const liveStatusText = analysis.isDegenerateLinear
    ? tContent(
        `تنبيه: a = 0 يحوّل المعادلة إلى خطية (${analysis.b}x + ${analysis.c} = 0) ولا يُطبق المميز Δ عليها.`,
        `Boundary notice: a = 0 makes this a linear equation (${analysis.b}x + ${analysis.c} = 0), not a quadratic parabola.`,
      )
    : tContent(
        `Δ = ${analysis.discriminant}، عدد الجذور الحقيقية = ${analysis.rootCount}، مجموع الجذرين S = ${analysis.sumRoots}، الضرب P = ${analysis.productRoots}.`,
        `Δ = ${analysis.discriminant}, real root count = ${analysis.rootCount}, Vieta sum S = ${analysis.sumRoots}, product P = ${analysis.productRoots}.`,
      );

  // SVG plot over x in [-6, 6], y in [-6, 6] mapped onto 300x200
  const mapX = (x: number) => 150 + x * 22;
  const mapY = (y: number) => 100 - y * 14;

  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let x = -6; x <= 6; x += 0.25) {
      const y = coeffA * x * x + coeffB * x + coeffC;
      const clampedY = Math.max(-7.5, Math.min(7.5, y));
      pts.push(`${mapX(x).toFixed(1)},${mapY(clampedY).toFixed(1)}`);
    }
    return pts.join(" ");
  }, [coeffA, coeffB, coeffC]);

  return (
    <SubjectLabFrame
      spec={spec}
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      liveStatusText={liveStatusText}
      headerActions={
        <div className="noata-lab-mode-tabs" role="group" aria-label={tUi("عدسة التحليل التربيعي", "Quadratic lens")}>
          <button
            type="button"
            className={`noata-lab-mode-btn ${focusMode === "discriminant" ? "is-active" : ""}`}
            aria-pressed={focusMode === "discriminant"}
            onClick={() => setFocusMode("discriminant")}
          >
            {tUi("المميز والجذور", "Discriminant Δ")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${focusMode === "vieta" ? "is-active" : ""}`}
            aria-pressed={focusMode === "vieta"}
            onClick={() => setFocusMode("vieta")}
          >
            {tUi("علاقات فييت S و P", "Vieta Sum & Product")}
          </button>
          <button
            type="button"
            className={`noata-lab-mode-btn ${focusMode === "sign" ? "is-active" : ""}`}
            aria-pressed={focusMode === "sign"}
            onClick={() => setFocusMode("sign")}
          >
            {tUi("بحث الإشارة والمتباينات", "Sign & Inequalities")}
          </button>
        </div>
      }
    >
      <div className="noata-lab-split">
        <div className="noata-lab-visual-card" dir="ltr">
          <svg
            viewBox="0 0 300 200"
            className="noata-lab-svg noata-lab-svg--wide"
            role="img"
            aria-label={tContent(
              "رسم بياني للدالة التربيعية وتقاطعاتها مع محور السينات",
              "Coordinate plot of y = ax² + bx + c showing x-intercepts and vertex",
            )}
          >
            {/* Subtle sign strips when viewing sign mode */}
            {focusMode === "sign" && !analysis.isDegenerateLinear ? (
              <>
                <rect x="10" y="10" width="280" height="90" fill="var(--success)" fillOpacity="0.06" />
                <rect x="10" y="100" width="280" height="90" fill="var(--warning)" fillOpacity="0.06" />
                <text x="18" y="24" fontSize="10" fill="var(--success)" fontWeight="700">
                  {contentLocale === "ar" ? "د(س) > 0" : "y > 0"}
                </text>
                <text x="18" y="182" fontSize="10" fill="var(--warning)" fontWeight="700">
                  {contentLocale === "ar" ? "د(س) < 0" : "y < 0"}
                </text>
              </>
            ) : null}

            {/* Axes */}
            <line x1="12" y1="100" x2="288" y2="100" stroke="var(--line-strong)" strokeWidth="1.5" />
            <line x1="150" y1="10" x2="150" y2="190" stroke="var(--line-strong)" strokeWidth="1.5" />

            {/* Axis of symmetry */}
            {!analysis.isDegenerateLinear && Math.abs(analysis.vertexX) <= 6 ? (
              <line
                x1={mapX(analysis.vertexX)}
                y1="14"
                x2={mapX(analysis.vertexX)}
                y2="186"
                stroke="var(--subject-accent)"
                strokeOpacity="0.35"
                strokeDasharray="4 4"
              />
            ) : null}

            <polyline
              fill="none"
              stroke="var(--subject-accent)"
              strokeWidth="3"
              points={curvePoints}
            />

            {/* Real x-intercept dots */}
            {!analysis.isDegenerateLinear
              ? analysis.realRoots
                  .filter((r) => r >= -6 && r <= 6)
                  .map((r, idx) => (
                    <g key={idx}>
                      <circle cx={mapX(r)} cy={100} r="5.5" fill="var(--success)" stroke="var(--surface)" strokeWidth="1.5" />
                      <text x={mapX(r)} y="91" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--ink)">
                        {r}
                      </text>
                    </g>
                  ))
              : analysis.linearRoot !== null && Math.abs(analysis.linearRoot) <= 6 ? (
                  <circle cx={mapX(analysis.linearRoot)} cy={100} r="5.5" fill="var(--warning)" stroke="var(--surface)" strokeWidth="1.5" />
                ) : null}
          </svg>
        </div>

        <div className="noata-lab-controls-card">
          <div className="noata-lab-preset-row">
            <button
              type="button"
              aria-label={tUi("مميز موجب أكبر من صفر", "Discriminant greater than 0")}
              className="noata-lab-preset-btn"
              onClick={() => { setCoeffA(1); setCoeffB(-2); setCoeffC(-3); }}
            >
              <StudyRichText content="$\\Delta > 0$" dir="ltr" locale={contentLocale} inline />
            </button>
            <button
              type="button"
              aria-label={tUi("مميز يساوي صفر", "Discriminant equals 0")}
              className="noata-lab-preset-btn"
              onClick={() => { setCoeffA(1); setCoeffB(-4); setCoeffC(4); }}
            >
              <StudyRichText content="$\\Delta = 0$" dir="ltr" locale={contentLocale} inline />
            </button>
            <button
              type="button"
              aria-label={tUi("مميز سالب أصغر من صفر", "Discriminant less than 0")}
              className="noata-lab-preset-btn"
              onClick={() => { setCoeffA(1); setCoeffB(2); setCoeffC(3); }}
            >
              <StudyRichText content="$\\Delta < 0$" dir="ltr" locale={contentLocale} inline />
            </button>
            <button
              type="button"
              className="noata-lab-preset-btn"
              onClick={() => { setCoeffA(0); setCoeffB(2); setCoeffC(-4); }}
            >
              {tUi("حالة a = 0 الخطية", "a = 0 linear")}
            </button>
          </div>

          <div className="noata-lab-slider-field">
            <div className="noata-lab-slider-label-row">
              <label htmlFor="quad-a-slider">
                <StudyRichText
                  content={tUi("معامل $س^2$ ($a$):", "Coefficient $a$ ($x^2$):")}
                  dir={uiLocale === "ar" ? "rtl" : "ltr"}
                  locale={contentLocale}
                  inline
                />
              </label>
              <strong dir="ltr">a = {coeffA}</strong>
            </div>
            <input
              id="quad-a-slider"
              type="range"
              min={-3}
              max={3}
              step={0.5}
              value={coeffA}
              onChange={(e) => setCoeffA(Number(e.target.value))}
            />
          </div>

          <div className="noata-lab-slider-field">
            <div className="noata-lab-slider-label-row">
              <label htmlFor="quad-b-slider">
                <StudyRichText
                  content={tUi("معامل $س$ ($b$):", "Coefficient $b$ ($x$):")}
                  dir={uiLocale === "ar" ? "rtl" : "ltr"}
                  locale={contentLocale}
                  inline
                />
              </label>
              <strong dir="ltr">b = {coeffB}</strong>
            </div>
            <input
              id="quad-b-slider"
              type="range"
              min={-6}
              max={6}
              step={1}
              value={coeffB}
              onChange={(e) => setCoeffB(Number(e.target.value))}
            />
          </div>

          <div className="noata-lab-slider-field">
            <div className="noata-lab-slider-label-row">
              <label htmlFor="quad-c-slider">{tUi("الحد المطلق (c):", "Constant c:")}</label>
              <strong dir="ltr">c = {coeffC}</strong>
            </div>
            <input
              id="quad-c-slider"
              type="range"
              min={-6}
              max={6}
              step={1}
              value={coeffC}
              onChange={(e) => setCoeffC(Number(e.target.value))}
            />
          </div>

          <div className="noata-lab-readout-box">
            {analysis.isDegenerateLinear ? (
              <div className="noata-lab-degenerate-alert" dir={contentLocale === "ar" ? "rtl" : "ltr"}>
                <strong>
                  {tContent(
                    "تنبيه: عندما a = 0 تزول الدرجة الثانية (مستقيم خطي، ولا يمكن القسمة على 2a في القانون العام).",
                    "Degenerate linear case (a = 0): equation becomes linear, and quadratic Δ / Vieta divisions by a do not apply.",
                  )}
                </strong>
                <StudyRichText
                  blocks={[
                    {
                      type: "math",
                      display: true,
                      tex: analysis.equationLatex,
                    },
                  ]}
                  dir="ltr"
                  locale={contentLocale}
                />
              </div>
            ) : (
              <>
                <StudyRichText
                  blocks={[
                    { type: "math", display: true, tex: analysis.equationLatex },
                    { type: "math", display: true, tex: analysis.discriminantLatex },
                  ]}
                  dir="ltr"
                  locale={contentLocale}
                />
                <div className="noata-lab-metrics-row">
                  <span>
                    {tUi("النوع:", "Roots:")}{" "}
                    <strong>
                      {analysis.rootKind === "distinct-real"
                        ? tContent(`حقيقيان مختلفان (${analysis.realRoots.join(", ")})`, `2 distinct real (${analysis.realRoots.join(", ")})`)
                        : analysis.rootKind === "repeated-real"
                          ? tContent(`حقيقي متساوٍ (${analysis.realRoots[0]})`, `1 repeated real (${analysis.realRoots[0]})`)
                          : tContent(
                              `مركبان مترافقان (${analysis.complexRoots?.realPart} ± ${analysis.complexRoots?.imagAbs}i)`,
                              `Complex conjugate (${analysis.complexRoots?.realPart} ± ${analysis.complexRoots?.imagAbs}i)`,
                            )}
                    </strong>
                  </span>
                  {focusMode === "vieta" || focusMode === "discriminant" ? (
                    <>
                      <span>
                        <StudyRichText
                          content={`$S = -b/a = ${analysis.sumRoots}$`}
                          dir="ltr"
                          locale={contentLocale}
                          inline
                        />
                      </span>
                      <span>
                        <StudyRichText
                          content={`$P = c/a = ${analysis.productRoots}$`}
                          dir="ltr"
                          locale={contentLocale}
                          inline
                        />
                      </span>
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </SubjectLabFrame>
  );
}

/**
 * Pilot 1 router for Mathematics interactive labs.
 */
export function MathPilotLab({ labId, initialMode, uiLocale, contentLocale }: PilotLabProps) {
  if (labId === "math-complex-argand") {
    return (
      <ComplexCycleArgandLab
        uiLocale={uiLocale}
        contentLocale={contentLocale}
        initialMode={initialMode}
      />
    );
  }
  return (
    <QuadraticParabolaLab
      uiLocale={uiLocale}
      contentLocale={contentLocale}
      initialMode={initialMode}
    />
  );
}
