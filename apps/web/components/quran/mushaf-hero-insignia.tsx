/**
 * Architectural Mushaf identity. Decorative artwork, never a replacement
 * for the actual semantic Quran heading in the reading-page hero.
 *
 * Geometry and lettering are independent: the ornamental border can never
 * decide the flow, baseline or width of the Arabic wordmark.
 */
export function MushafHeroInsignia({ english = false }: { english?: boolean }) {
  return (
    <div className="mushaf-hero-insignia" aria-hidden="true" data-testid="mushaf-hero-insignia">
      <svg className="mushaf-insignia-frame" viewBox="0 0 240 280" fill="none" focusable="false" aria-hidden="true">
        <path className="mushaf-insignia-outer" d="M120 9 C149 32 190 48 208 83 C219 104 220 122 220 150 V193 C220 226 173 252 120 270 C67 252 20 226 20 193 V150 C20 122 21 104 32 83 C50 48 91 32 120 9 Z"/>
        <path className="mushaf-insignia-inner" d="M120 25 C147 46 178 60 194 91 C204 109 205 128 205 151 V189 C205 216 166 237 120 253 C74 237 35 216 35 189 V151 C35 128 36 109 46 91 C62 60 93 46 120 25 Z"/>
        <path className="mushaf-insignia-crown" d="M120 37 L126 47 L120 57 L114 47 Z"/>
        <path className="mushaf-insignia-crown-soft" d="M104 45 L108 49 L104 53 L100 49 Z M136 45 L140 49 L136 53 L132 49 Z"/>
        <path className="mushaf-insignia-base" d="M102 239 H111 L120 244 L129 239 H138"/>
      </svg>
      <div className="mushaf-insignia-content">
        <span className="mushaf-insignia-halo">
          <svg viewBox="0 0 70 60" fill="none" aria-hidden="true" focusable="false">
            <path d="M35 51 C27 45 17 43 7 45 V10 C18 8 28 11 35 17 V51 Z M35 51 C43 45 53 43 63 45 V10 C52 8 42 11 35 17 V51 Z"
              stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round"/>
            <path d="M35 17 V51 M14 18 C21 18 27 20 30 23 M56 18 C49 18 43 20 40 23 M14 26 C20 26 26 28 30 30 M56 26 C50 26 44 28 40 30"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".47"/>
            <path d="M35 5 L37 9 L41 11 L37 13 L35 17 L33 13 L29 11 L33 9 Z" fill="currentColor" opacity=".75"/>
          </svg>
        </span>
        <div className="mushaf-insignia-wordmark">
          <strong className="mushaf-insignia-arabic" lang="ar" dir="rtl">القرآن الكريم</strong>
          <span className="mushaf-insignia-divider" aria-hidden="true"><i/><b/><i/></span>
          <small className="mushaf-insignia-caption" lang={english ? "en" : "ar"} dir={english ? "ltr" : "rtl"}>
            {english ? "READ · RECITE · REFLECT" : "قِرَاءَةٌ · تِلَاوَةٌ · تَدَبُّرٌ"}
          </small>
        </div>
      </div>
    </div>
  );
}
