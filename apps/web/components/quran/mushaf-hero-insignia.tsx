/**
 * The Mushaf's editorial emblem.
 * Purely decorative: section name and reading instructions already appear
 * in the adjacent semantic heading, which remains available to screen readers.
 */
export function MushafHeroInsignia({english=false}:{english?:boolean}){
  return <div className="mushaf-hero-insignia" aria-hidden="true" data-testid="mushaf-hero-insignia">
    <svg className="mushaf-insignia-frame" viewBox="0 0 240 248" fill="none" focusable="false" aria-hidden="true">
      <path className="mushaf-insignia-outer" d="M120 10C143 30 181 33 202 65C214 83 214 99 214 118V171C214 200 176 224 120 240C64 224 26 200 26 171V118C26 99 26 83 38 65C59 33 97 30 120 10Z"/>
      <path className="mushaf-insignia-inner" d="M120 23C144 41 177 46 193 73C202 88 202 100 202 118V169C202 193 168 212 120 227C72 212 38 193 38 169V118C38 100 38 88 47 73C63 46 96 41 120 23Z"/>
      <path className="mushaf-insignia-crown" d="M120 23L126 35L120 47L114 35L120 23Z"/>
      <path className="mushaf-insignia-crown-soft" d="M104 38L108 42L104 46L100 42L104 38ZM136 38L140 42L136 46L132 42L136 38Z"/>
      <path className="mushaf-insignia-lower-ornament" d="M98 211H111L120 218L129 211H142"/>
      <circle className="mushaf-insignia-pin" cx="43" cy="125" r="2"/>
      <circle className="mushaf-insignia-pin" cx="197" cy="125" r="2"/>
      <path className="mushaf-insignia-side" d="M49 117V152M191 117V152"/>
    </svg>
    <div className="mushaf-insignia-content">
      <span className="mushaf-insignia-halo">
        <svg viewBox="0 0 70 60" fill="none" aria-hidden="true" focusable="false">
          <path d="M35 51C27 45 17 43 7 45V10C18 8 28 11 35 17V51ZM35 51C43 45 53 43 63 45V10C52 8 42 11 35 17V51Z" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round" strokeLinecap="round"/>
          <path d="M35 17V51M14 18C21 18 27 20 30 23M56 18C49 18 43 20 40 23M14 26C20 26 26 28 30 30M56 26C50 26 44 28 40 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".47"/>
          <path d="M35 5L37 9L41 11L37 13L35 17L33 13L29 11L33 9L35 5Z" fill="currentColor" opacity=".75"/>
        </svg>
      </span>
      <strong className="mushaf-insignia-arabic" lang="ar" dir="rtl">القرآن الكريم</strong>
      <span className="mushaf-insignia-divider"><i/><b/><i/></span>
      <small className="mushaf-insignia-caption">{english?"READ · RECITE · REFLECT":"قِرَاءَةٌ · تِلَاوَةٌ · تَدَبُّرٌ"}</small>
    </div>
  </div>;
}
