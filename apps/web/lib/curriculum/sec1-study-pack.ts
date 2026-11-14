import type { ContentLanguage, SubjectKey } from "./catalog.ts";
import {
  getLessonStudyPack,
  getTrackLessonStudyPacks,
  type CanonicalLessonStudyPack,
} from "./sec1-all-lessons-pack.ts";

export {
  getLessonStudyPack,
  getTrackLessonStudyPacks,
  type CanonicalLessonStudyPack,
};

export type StudyConceptSection = {
  id: string;
  title: string;
  body: string;
  formulaOrRule?: string;
  example?: string;
};

export type StudyWorkedExample = {
  problem: string;
  steps: string[];
  takeaway: string;
};

export type CuratedStudyQuestion = {
  id: string;
  question_type: "multiple-choice";
  prompt: string;
  choices: string[];
  correct_index: number;
  explanation: string;
  hint: string;
  difficulty: "foundational" | "standard" | "challenging";
  lessonTitle?: string;
};

export type CanonicalFlashcard = {
  front: string;
  back: string;
  hint?: string;
};

export type CanonicalStudyDeck = {
  id: string;
  trackSlug: string;
  subject: SubjectKey;
  contentLanguage: ContentLanguage;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  cards: CanonicalFlashcard[];
};

export type LessonStudyCompanion = {
  matchedTopic: string;
  keyConcepts: StudyConceptSection[];
  workedExamples: StudyWorkedExample[];
  commonMistakes: string[];
  aiTutorPrompts: string[];
  curatedQuestions: CuratedStudyQuestion[];
  flashcards: CanonicalFlashcard[];
};

type LocalizedText = { ar: string; en: string };

type RawConcept = {
  id: string;
  title: LocalizedText;
  body: LocalizedText;
  formulaOrRule?: LocalizedText;
  example?: LocalizedText;
};

type RawWorked = {
  problem: LocalizedText;
  steps: LocalizedText[];
  takeaway: LocalizedText;
};

type RawQuestion = {
  id: string;
  prompt: LocalizedText;
  choices: LocalizedText[];
  correct_index: number;
  explanation: LocalizedText;
  hint: LocalizedText;
  difficulty: "foundational" | "standard" | "challenging";
};

type RawCard = {
  front: LocalizedText;
  back: LocalizedText;
  hint?: LocalizedText;
};

type TopicModule = {
  slug: string;
  aliases: string[];
  subject: SubjectKey;
  position: number;
  title: LocalizedText;
  concepts: RawConcept[];
  worked: RawWorked[];
  mistakes: LocalizedText[];
  questions: RawQuestion[];
  flashcards: RawCard[];
};

const L = (ar: string, en: string): LocalizedText => ({ ar, en });

/** Complete Sec. 1 Term 1 (2026-2027) structured modules grounded in the official study pack. */
const TOPIC_MODULES: readonly TopicModule[] = [
  // =========================================================================
  // INTEGRATED SCIENCE (AR & EN TRACKS)
  // =========================================================================
  {
    slug: "sci-hydrosphere",
    aliases: ["hydrosphere", "الغلاف المائي", "دورة الماء", "water cycle"],
    subject: "integrated-science",
    position: 1,
    title: L("الغلاف المائي ودورة الماء", "The Hydrosphere & Water Cycle"),
    concepts: [
      {
        id: "spheres",
        title: L("أغلفة الأرض الأربعة وتفاعلها", "Earth's Four Interacting Spheres"),
        body: L(
          "يتفاعل النظام البيئي من خلال أربعة أغلفة: الجوي (الغازات)، المائي (المحيطات والأنهار والجليد وبخار الماء والمياه الجوفية)، الصخري (القشرة الصلبة)، والحيوي (نطاق الحياة). يغطي الماء قرابة 71% من سطح الأرض.",
          "Ecosystems operate across four interacting spheres: Atmosphere (gases), Hydrosphere (all liquid, frozen, groundwater, and atmospheric water), Lithosphere (solid crust), and Biosphere (all regions supporting life). Water covers ~71% of Earth's surface.",
        ),
        formulaOrRule: L(
          "توزيع الماء: ~97% ماء مالح في البحار والمحيطات | ~3% ماء عذب (معظمه جليد ومياه جوفية)",
          "Water distribution: ~97% saline oceans/seas | ~3% freshwater (mostly glaciers & groundwater)",
        ),
      },
      {
        id: "cycle",
        title: L("مراحل دورة الماء في الطبيعة", "Processes of the Water Cycle"),
        body: L(
          "تحرّك الطاقة الشمسية التبخر والنتح من النباتات عبر الثغور، ثم يبرد البخار ويتكاثف مكوّنًا السحب، ويعود بالجاذبية في صورة هطول ثم جريان سطحي وتسرب عبر التربة لتغذية المياه الجوفية.",
          "Solar radiation drives evaporation and plant transpiration through stomata; cooling leads to condensation into clouds, followed by gravity-driven precipitation, surface runoff, and infiltration into aquifers.",
        ),
        example: L(
          "مثال تطبيقي: يمتص جذر النبات ماءً من الغلاف المائي/الصخري ثم يطلقه كبخار عبر النتح إلى الغلاف الجوي.",
          "Applied link: Plant roots absorb soil water (lithosphere/hydrosphere) and release vapour to the atmosphere via transpiration.",
        ),
      },
    ],
    worked: [
      {
        problem: L(
          "رغم أن الماء يغطي 71% من سطح الأرض، لماذا يُعد الأمن المائي تحديًا عالميًا؟",
          "Water covers 71% of Earth's surface; why is usable freshwater still scarce?",
        ),
        steps: [
          L("نحو 97% من مياه الأرض مالحة في البحار والمحيطات.", "About 97% of global water is saline ocean water."),
          L("نسبة الماء العذب لا تتجاوز ~3% فقط.", "Only ~3% of total Earth water is freshwater."),
          L("معظم هذا الماء العذب محبوس في الأنهار الجليدية أو المياه الجوفية العميقة.", "Most freshwater is locked in glaciers/ice sheets or deep groundwater."),
          L("تبقى نسبة ضئيلة للغاية متاحة بسهولة في الأنهار والبحيرات العذبة.", "Only a tiny accessible fraction sits in rivers and freshwater lakes."),
        ],
        takeaway: L(
          "وفرة الماء الإجمالية لا تعني وفرة الماء العذب السطحي الصالح للاستخدام المباشر.",
          "Abundant planetary water does not equal abundant accessible freshwater.",
        ),
      },
    ],
    mistakes: [
      L("الخلط بين التبخر من المسطحات المائية والنتح الحيوي من ثغور أوراق النبات.", "Confusing open-surface evaporation with biological plant transpiration through leaf stomata."),
      L("الاعتقاد بأن أغلب الماء العذب موجود في الأنهار، بينما معظمه في الجليد والمياه الجوفية.", "Assuming most freshwater lies in rivers, whereas most is stored in glaciers and groundwater."),
    ],
    questions: [
      {
        id: "sec1-sci1-q1",
        prompt: L(
          "ما النسبة التقريبية للمياه المالحة من إجمالي الماء على كوكب الأرض؟",
          "Approximately what percentage of Earth's total water is saline water in oceans and seas?",
        ),
        choices: [L("71%", "71%"), L("97%", "97%"), L("3%", "3%"), L("50%", "50%")],
        correct_index: 1,
        explanation: L(
          "تغطي المياه نحو 71% من مساحة السطح، لكن نحو 97% من حجم الماء نفسه مالح، بينما ~3% فقط ماء عذب.",
          "Water covers ~71% of Earth's surface, while ~97% of total water volume is saline and only ~3% is freshwater.",
        ),
        hint: L("فرّق بين نسبة التغطية المساحية ونسبة ملوحة حجم المياه.", "Distinguish surface area coverage (71%) from saline water volume fraction."),
        difficulty: "foundational",
      },
      {
        id: "sec1-sci1-q2",
        prompt: L(
          "أي العمليات الآتية ينقل خلالها النبات بخار الماء مباشرة إلى الغلاف الجوي عبر الثغور؟",
          "Through which process do plants release water vapour directly into the atmosphere via leaf stomata?",
        ),
        choices: [
          L("التسرب (Infiltration)", "Infiltration"),
          L("النتح (Transpiration)", "Transpiration"),
          L("التكاثف (Condensation)", "Condensation"),
          L("الجريان السطحي", "Surface runoff"),
        ],
        correct_index: 1,
        explanation: L(
          "النتح هو إطلاق النبات لبخار الماء عبر ثغور الأوراق، ويُظهر تفاعل الغلاف الحيوي مع الغلاف الجوي.",
          "Transpiration releases water vapour through leaf stomata, directly linking the biosphere and atmosphere.",
        ),
        hint: L("فكّر في دور الكائنات النباتية في الغلاف الحيوي.", "Think of the biological link from plant leaves to air."),
        difficulty: "foundational",
      },
      {
        id: "sec1-sci1-q3",
        prompt: L(
          "أي مصدرين للطاقة والقوة يقودان استمرار دورة الماء بين التبخر والهطول؟",
          "Which two primary drivers power evaporation and the return of precipitation to Earth's surface?",
        ),
        choices: [
          L("طاقة المد والجزر والرياح", "Tidal force and ocean currents"),
          L("الطاقة الشمسية والجاذبية الأرضية", "Solar energy and gravity"),
          L("الضغط الأسموزي فقط", "Osmotic pressure alone"),
          L("الحرارة الأرضية الجوفية فقط", "Geothermal heat alone"),
        ],
        correct_index: 1,
        explanation: L(
          "الطاقة الشمسية تسبب تسخين وتبخر الماء، بينما تسحب الجاذبية الأرضية الهطول والجريان والتسرب نحو الأسفل.",
          "Solar radiation drives evaporation/transpiration, while Earth's gravity pulls precipitation, runoff, and infiltration downward.",
        ),
        hint: L("ما الذي يرفع البخار لأعلى وما الذي يُسقط المطر لأسفل؟", "What lifts water vapour up and what pulls rain down?"),
        difficulty: "standard",
      },
      {
        id: "sec1-sci1-q4",
        prompt: L(
          "عند مقارنة الغلاف المائي والغلاف الحيوي، أي العبارات الآتية أدق علميًا؟",
          "When comparing the hydrosphere and biosphere, which statement is most scientifically accurate?",
        ),
        choices: [
          L("الغلاف المائي يشمل المياه العذبة فقط دون الجليد", "Hydrosphere excludes glaciers and groundwater"),
          L("الغلاف الحيوي يقتصر على اليابسة ولا يشمل المحيطات", "Biosphere excludes aquatic habitats"),
          L("الغلاف المائي يشمل جميع حالات الماء بينما الحيوي يشمل نطاق الكائنات الحية وتفاعلها معه", "Hydrosphere encompasses all water reservoirs, while the biosphere encompasses living organisms interacting across spheres"),
          L("لا يوجد تفاعل بين الغلاف الصخري ودورة الماء", "The lithosphere plays no role in the water cycle"),
        ],
        correct_index: 2,
        explanation: L(
          "الغلاف المائي يضم الماء السائل والمتجمد والبخار والمياه الجوفية، ويتفاعل باستمرار مع الغلاف الحيوي حيث توجد الحياة.",
          "The hydrosphere encompasses all liquid, solid, vapour, and groundwater reservoirs and continuously interacts with living organisms in the biosphere.",
        ),
        hint: L("تذكّر شمول الغلاف المائي للحالات الثلاث للماء وتكامل الأغلفة.", "Remember the hydrosphere includes liquid, ice, and vapour across Earth."),
        difficulty: "challenging",
      },
    ],
    flashcards: [
      { front: L("نسبة الماء المالح إلى العذب على الأرض", "Saltwater vs. Freshwater on Earth"), back: L("نحو 97% مالح و~3% عذب (معظمه جليد ومياه جوفية).", "~97% saline and ~3% freshwater (mostly glaciers & groundwater).") },
      { front: L("النتح (Transpiration)", "Transpiration"), back: L("إطلاق النبات لبخار الماء إلى الغلاف الجوي عبر ثغور الأوراق.", "Release of water vapour from plants through leaf stomata.") },
      { front: L("العوامل الحيوية مقابل اللاحيوية", "Biotic vs. Abiotic Factors"), back: L("الحيوية: الكائنات الحية | اللاحيوية: الماء والهواء والضوء والحرارة والتربة.", "Biotic: living organisms | Abiotic: water, air, light, temperature, soil.") },
    ],
  },
  {
    slug: "sci-water-chemistry",
    aliases: ["chemical properties", "hydrogen bonding", "الخصائص الكيميائية للماء", "الروابط الهيدروجينية"],
    subject: "integrated-science",
    position: 2,
    title: L("الخصائص الكيميائية للماء والروابط الهيدروجينية", "Chemical Properties of Water & Hydrogen Bonding"),
    concepts: [
      {
        id: "polarity",
        title: L("قطبية جزيء الماء (H₂O) وزاوية الرابطة", "Polarity of H₂O & Molecular Geometry"),
        body: L(
          "يرتبط ذرتا هيدروجين بذرة أكسجين برابطتين تساهميتين قطبيتين بزاوية ≈ 104.5°. ونظرًا لكهروسالبية الأكسجين الأعلى، تجذب الأكسجين إلكترونات الرابطة فتحمل شحنة سالبة جزئية (-δ) ويحمل الهيدروجين شحنة موجبة جزئية (+δ).",
          "Two H atoms covalently bond to one O atom in a bent shape (~104.5°). Because oxygen is more electronegative, it pulls shared electrons closer, gaining a partial negative charge (δ−) while hydrogens become partially positive (δ+).",
        ),
        formulaOrRule: L("الشكل المنحني (104.5°) + فرق السالبية الكهربائية = جزيء ماء قطبي", "Bent Geometry (104.5°) + Uneven Electron Pull = Polar H₂O Molecule"),
      },
      {
        id: "ph-solvent",
        title: L("الروابط الهيدروجينية والإذابة ومقياس pH", "Hydrogen Bonds, Hydration & pH Scale"),
        body: L(
          "تتجاذب الشحنة الموجبة الجزئية للهيدروجين مع الأكسجين المجاور مكوّنة روابط هيدروجينية (أضعف من التساهمية لكنها مسؤولة عن الخواص المميزة للماء). ويُذيب الماء المواد الأيونية والقطبية كملح NaCl عبر إحاطة أيونات Na⁺ وCl⁻، بينما يصنّف مقياس pH المحاليل عند 25°C إلى حمضي (<7)، متعادل (=7)، وقاعدي (>7).",
          "Attractions between δ+ hydrogen and δ− oxygen form hydrogen bonds (weaker than covalent O–H bonds, yet explaining high boiling point and cohesion). Polar H₂O dissolves ionic/polar solutes like NaCl via ion hydration shells. At ~25°C: pH < 7 acidic, pH = 7 neutral, pH > 7 basic.",
        ),
      },
    ],
    worked: [
      {
        problem: L("لماذا يذوب ملح الطعام NaCl بسهولة في الماء بينما لا يمتزج الزيت بالماء؟", "Why does table salt (NaCl) dissolve readily in water while oil does not?"),
        steps: [
          L("جزيء الماء قطبي يحمل قطبًا سالبًا جزئيًا على الأكسجين وموجبًا على الهيدروجين.", "Water is polar with a δ− oxygen end and δ+ hydrogen ends."),
          L("تجذب أقطاب الماء أيونات Na⁺ الموجبة وأيونات Cl⁻ السالبة وتفصلها وتحيط بها.", "Water's opposite partial charges attract Na⁺ and Cl⁻ ions and surround them."),
          L("أما جزيئات الزيت فغير قطبية، فتبقى الروابط الهيدروجينية بين جزيئات الماء أقوى من أي تجاذب مع الزيت.", "Oil molecules are non-polar, so water molecules attract one another much more strongly via hydrogen bonds."),
        ],
        takeaway: L("المذيب القطبي يُذيب المركبات الأيونية والقطبية بكفاءة أكبر من المركبات غير القطبية.", "Polar solvents readily dissolve ionic and polar substances, not non-polar oils."),
      },
    ],
    mistakes: [
      L("الاعتقاد بأن الرابطة الهيدروجينية أقوى من الرابطة التساهمية داخل جزيء الماء نفسه.", "Thinking intermolecular hydrogen bonds are stronger than intramolecular covalent O–H bonds."),
      L("افتراض أن أي ملح مذاب يجعل المحلول متعادلًا دائمًا دون النظر لأيوناته.", "Assuming every dissolved salt automatically yields pH = 7 regardless of ion hydrolysis."),
    ],
    questions: [
      {
        id: "sec1-sci2-q1",
        prompt: L("ما الزاوية التقريبية بين الرابطتين التساهميتين داخل جزيء الماء H₂O؟", "What is the approximate bond angle inside a bent water (H₂O) molecule?"),
        choices: [L("180°", "180°"), L("104.5°", "104.5°"), L("90°", "90°"), L("120°", "120°")],
        correct_index: 1,
        explanation: L("يتخذ جزيء الماء شكلًا منحنيًا بزاوية تقارب 104.5° نتيجة أزواج الإلكترونات الحرة على ذرة الأكسجين.", "Water has a bent geometry with an H–O–H angle of ~104.5°, enabling net molecular polarity."),
        hint: L("الشكل المنحني لـ H₂O ليست زاويته مستقيمة (180°).", "The bent geometry is slightly smaller than a tetrahedral 109.5° angle."),
        difficulty: "foundational",
      },
      {
        id: "sec1-sci2-q2",
        prompt: L("أين تتكون الرابطة الهيدروجينية في عينة ماء نقي؟", "Where does a hydrogen bond form in pure liquid water?"),
        choices: [
          L("بين ذرة الأكسجين والهيدروجين داخل الجزيء الواحد", "Between O and H inside the same H₂O molecule"),
          L("بين الهيدروجين الموجب جزئيًا في جزيء والأكسجين السالب جزئيًا في جزيء آخر", "Between a δ+ H on one molecule and a δ− O on a neighbouring molecule"),
          L("بين أيوني الصوديوم والكلوريد فقط", "Only between Na⁺ and Cl⁻ ions"),
          L("عند غليان الماء فقط", "Only above 100°C"),
        ],
        correct_index: 1,
        explanation: L("الروابط الهيدروجينية قوى تجاذب بين الجزيئات، أما داخل الجزيء الواحد فالروابط تساهمية قطبية.", "Hydrogen bonds are intermolecular attractions between neighbouring water molecules; O–H bonds inside a molecule are polar covalent."),
        hint: L("فرّق بين الرابطة داخل الجزيء وبين التجاذب بين الجزيئات.", "Distinguish intramolecular covalent bonds from intermolecular attractions."),
        difficulty: "standard",
      },
      {
        id: "sec1-sci2-q3",
        prompt: L("محلولان مائيان عند 25°C: المحلول (س) له pH = 3، والمحلول (ص) له pH = 11. ما تصنيفهما؟", "Two aqueous solutions at 25°C have pH = 3 (X) and pH = 11 (Y). How are they classified?"),
        choices: [
          L("(س) قاعدي، (ص) حمضي", "X is basic, Y is acidic"),
          L("(س) متعادل، (ص) حمضي", "X is neutral, Y is acidic"),
          L("(س) حمضي، (ص) قاعدي", "X is acidic, Y is basic"),
          L("كلاهما متعادل", "Both are neutral"),
        ],
        correct_index: 2,
        explanation: L("أقل من 7 يعني محلولًا حمضيًا (تركيز H⁺ أعلى)، وأكبر من 7 يعني محلولًا قاعديًا (تركيز OH⁻ أعلى).", "At 25°C, pH < 7 indicates an acidic solution, whereas pH > 7 indicates a basic/alkaline solution."),
        hint: L("نقطة التعادل المرجعية عند 25°C هي pH = 7.", "Compare each value against the neutral reference pH = 7."),
        difficulty: "foundational",
      },
    ],
    flashcards: [
      { front: L("الزاوية داخل جزيء الماء", "Water molecule bond angle"), back: L("حوالي 104.5° وشكل جزيئي منحنٍ قطبي.", "Approximately 104.5° with a bent polar shape.") },
      { front: L("مقياس الرقم الهيدروجيني (pH) عند 25°C", "pH Scale at 25°C"), back: L("أقل من 7: حمضي | يساوي 7: متعادل | أكبر من 7: قاعدي.", "pH < 7 acidic | pH = 7 neutral | pH > 7 basic.") },
    ],
  },
  {
    slug: "sci-water-physics",
    aliases: ["physical properties", "density", "specific heat", "الخصائص الفيزيائية", "الكثافة والحرارة النوعية"],
    subject: "integrated-science",
    position: 3,
    title: L("الخصائص الفيزيائية للماء: الكثافة والحرارة النوعية", "Physical Properties of Water: Density & Specific Heat"),
    concepts: [
      {
        id: "density-anomaly",
        title: L("شذوذ كثافة الماء عند 4°C", "Water's Density Anomaly at 4°C"),
        body: L(
          "الكثافة = الكتلة / الحجم. وتبلغ كثافة الماء السائل أقصاها عند ~4°C؛ وعند تبريده من 4°C إلى 0°C يتمدد وتقل كثافته فيطفو الجليد فوق الماء، مما يحمي الكائنات المائية أسفل الجليد من التجمد الكامل.",
          "Density = mass / volume. Liquid water reaches maximum density near 4°C. As it cools from 4°C toward 0°C, hydrogen-bonded lattices expand, lowering density so ice floats and insulates aquatic organisms below.",
        ),
        formulaOrRule: L("الكثافة = m / V  |  T(K) = T(°C) + 273.15", "ρ = m / V  |  T(K) = T(°C) + 273.15"),
      },
      {
        id: "specific-heat",
        title: L("درجة الحرارة مقابل كمية الحرارة ومعادلة Q = mcΔT", "Temperature vs. Heat & Q = mcΔT"),
        body: L(
          "درجة الحرارة مقياس لمتوسط طاقة حركة الجزيئات، بينما الحرارة طاقة منتقلة بسبب فرق درجات الحرارة. يمتلك الماء سعة حرارية نوعية عالية (≈ 4200 J/(kg·°C)) تلطف مناخ السواحل وتفسر نسيم البحر نهارًا ونسيم البر ليلًا.",
          "Temperature reflects average particle kinetic energy, while heat is energy transferred due to a temperature difference. Water's high specific heat (~4200 J/(kg·°C)) moderates coastal climates and drives day sea breezes and night land breezes.",
        ),
        formulaOrRule: L("Q = m × c × ΔT   (c للماء ≈ 4200 J/(kg·°C))", "Q = m × c × ΔT   (c_water ≈ 4200 J/(kg·°C))"),
      },
    ],
    worked: [
      {
        problem: L("احسب كمية الحرارة اللازمة لرفع درجة حرارة 2 kg من الماء بمقدار 5°C علمًا بأن c = 4200 J/(kg·°C).", "Calculate Q required to warm 2 kg of water by ΔT = 5°C given c = 4200 J/(kg·°C)."),
        steps: [
          L("اكتب القانون: Q = m × c × ΔT", "Write equation: Q = m × c × ΔT"),
          L("عوّض بالقيم: m = 2 kg ، c = 4200 ، ΔT = 5°C", "Substitute: m = 2 kg, c = 4200 J/(kg·°C), ΔT = 5°C"),
          L("احسب: Q = 2 × 4200 × 5 = 42,000 J", "Compute: Q = 2 × 4200 × 5 = 42,000 J (42 kJ)"),
        ],
        takeaway: L("تتناسب الحرارة المكتسبة طرديًا مع الكتلة وفرق درجات الحرارة.", "Heat transferred scales linearly with mass, specific heat, and ΔT."),
      },
    ],
    mistakes: [
      L("استخدام درجة الحرارة بمعنى كمية الحرارة أو الخلط بين وحدتي الكلفن والدرجة المئوية.", "Treating temperature and heat energy as synonyms or forgetting +273(.15) for Kelvin."),
    ],
    questions: [
      {
        id: "sec1-sci3-q1",
        prompt: L("عند أي درجة حرارة تقريبًا يبلغ الماء السائل أقصى كثافة له؟", "At approximately what temperature does liquid water reach its maximum density?"),
        choices: [L("0°C", "0°C"), L("4°C", "4°C"), L("25°C", "25°C"), L("100°C", "100°C")],
        correct_index: 1,
        explanation: L("تبلغ كثافة الماء النقي أقصاها عند 4°C تقريبًا، وبعدها يتمدد مع انخفاض الحرارة إلى 0°C.", "Water peaks in density at ~4°C and expands below 4°C as open ice-like clusters form."),
        hint: L("ليست درجة التجمد الصفرية؛ أعلى قليلًا منها.", "It is slightly above freezing point 0°C."),
        difficulty: "foundational",
      },
      {
        id: "sec1-sci3-q2",
        prompt: L("ما كمية الحرارة اللازمة لتسخين 0.50 kg من الماء بمقدار 10°C (حيث c = 4200 J/(kg·°C))؟", "Calculate Q to heat 0.50 kg of water by 10°C (c = 4200 J/(kg·°C))."),
        choices: [L("4,200 J", "4,200 J"), L("21,000 J", "21,000 J"), L("42,000 J", "42,000 J"), L("2,100 J", "2,100 J")],
        correct_index: 1,
        explanation: L("بتطبيق Q = m × c × ΔT = 0.50 × 4200 × 10 = 21,000 J.", "Q = m × c × ΔT = 0.50 × 4200 × 10 = 21,000 J."),
        hint: L("استخدم العلاقة Q = m × c × ΔT مباشرة.", "Multiply m × c × ΔT directly."),
        difficulty: "standard",
      },
      {
        id: "sec1-sci3-q3",
        prompt: L("أي الأجهزة الآتية يُستخدم لقياس الكثافة النسبية للسوائل من خلال عمق طفوه؟", "Which instrument measures the relative density of liquids by how deeply it floats?"),
        choices: [L("البارومتر", "Barometer"), L("الهيدرومتر", "Hydrometer"), L("الأميتر", "Ammeter"), L("الكالوريمتر", "Calorimeter")],
        correct_index: 1,
        explanation: L("يقيس الهيدرومتر الكثافة النسبية للسوائل اعتمادًا على مبدأ الطفو.", "A hydrometer floats higher in denser liquids and lower in less dense liquids to read relative density."),
        hint: L("يبدأ اسمه بمقطع يدل على السوائل والماء (Hydro).", "Look for the prefix referring to water/liquid density."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("معادلة السعة الحرارية", "Heat capacity formula"), back: L("Q = m × c × ΔT (بوحدة الجول).", "Q = m × c × ΔT (joules).") },
      { front: L("لماذا يطفو الجليد فوق الماء؟", "Why does ice float?"), back: L("لأن كثافة الجليد أقل من كثافة الماء السائل الذي يبلغ أقصى كثافة عند 4°C.", "Ice expands below 4°C, giving it lower density than liquid water.") },
    ],
  },
  {
    slug: "sci-solutions-biology",
    aliases: ["aqueous solutions", "biological importance", "المحاليل المائية", "الأهمية الحيوية", "الإنزيمات", "أسموزية"],
    subject: "integrated-science",
    position: 4,
    title: L("المحاليل المائية والأهمية الحيوية للماء والإنزيمات", "Aqueous Solutions, Osmosis & Biological Water"),
    concepts: [
      {
        id: "colligative-osmosis",
        title: L("الخواص التجميعية والخاصية الأسموزية", "Colligative Properties & Osmosis"),
        body: L(
          "تعتمد الخواص التجميعية (انخفاض الضغط البخاري، ارتفاع درجة الغليان، انخفاض درجة التجمد) على عدد دقائق المذاب المذابة لا نوعها الكيميائي فحسب. والأسموزية هي صافي انتقال جزيئات المذيب عبر غشاء شبه منفذ من التركيز الأقل للمذاب نحو التركيز الأعلى للمذاب.",
          "Colligative properties (vapour-pressure lowering, boiling-point elevation, freezing-point depression) depend primarily on dissolved particle count. Osmosis is net solvent flow across a selectively permeable membrane from lower solute concentration toward higher solute concentration.",
        ),
      },
      {
        id: "cells-enzymes",
        title: L("الخلايا والإنزيمات ودور الماء الحيوي", "Cells, Enzymes & Metabolic Water"),
        body: L(
          "الخلايا بدائية النواة (مثل البكتيريا) تفتقر إلى نواة محاطة بغشاء، بينما حقيقية النواة تمتلك نواة وعضيات غشائية. والإنزيمات عوامل حفز حيوية بروتينية تسرّع الأيض بخفض طاقة التنشيط وتتأثر بدرجة الحرارة المثلى والـ pH.",
          "Prokaryotes (e.g., bacteria) lack a membrane-bound nucleus, while eukaryotes possess a membrane-bound nucleus and organelles. Protein enzymes catalyse metabolism by lowering activation energy and denature at extreme temperatures or pH.",
        ),
      },
    ],
    worked: [
      {
        problem: L("وُضعت خلية نباتية في محلول ملحي مركز جدًا. ما اتجاه حركة الماء ولماذا؟", "A plant cell is placed in a concentrated salt solution. Which way does water move and why?"),
        steps: [
          L("تركيز المذاب (الملح) خارج الخلية أعلى من داخله، أي تركيز الماء الحر أعلى داخل الخلية.", "Solute concentration is higher outside the cell than inside."),
          L("بفعل الأسموزية، ينتقل الماء عبر الغشاء شبه المنفذ من الداخل (أقل تركيز مذاب) إلى الخارج (أعلى تركيز مذاب).", "By osmosis, water moves across the semi-permeable membrane from lower solute concentration (inside) to higher solute concentration (outside)."),
          L("تفقد الخلية ضغط الامتلاء وتنكمش.", "The cell loses turgor and shrinks."),
        ],
        takeaway: L("ينتقل المذيب بالأسموزية دائمًا نحو المحلول الأعلى تركيزًا بالمذاب.", "Osmotic solvent flow runs toward the higher solute concentration side."),
      },
    ],
    mistakes: [
      L("الخلط بين قابلية الذوبان القصوى (Solubility) والتركيز الفعلي للمحلول (Concentration).", "Confusing maximum solubility with current solution concentration."),
      L("الاعتقاد أن حركة الجزيئات تتوقف تمامًا عند الوصول لحالة التشبع.", "Thinking molecular dissolution stops at saturation (it is a dynamic equilibrium)."),
    ],
    questions: [
      {
        id: "sec1-sci4-q1",
        prompt: L("ما الاتجاه الصافي لانتقال الماء في الأسموزية عبر غشاء شبه منفذ؟", "What is the net direction of water movement during osmosis across a selectively permeable membrane?"),
        choices: [
          L("من التركيز الأعلى للمذاب إلى التركيز الأقل للمذاب", "From higher solute concentration to lower solute concentration"),
          L("من التركيز الأقل للمذاب إلى التركيز الأعلى للمذاب", "From lower solute concentration to higher solute concentration"),
          L("ينتقل الملح فقط دون الماء", "Only solute ions cross without solvent movement"),
          L("يتوقف الانتقال في وجود أغشية نباتية", "Movement ceases across plant membranes"),
        ],
        correct_index: 1,
        explanation: L("الأسموزية انتقال المذيب (الماء) نحو الوسط الأعلى تركيزًا بالمذاب لمعادلة الجهد المائي.", "Water (solvent) flows toward the region with higher solute concentration across the membrane."),
        hint: L("الماء يتحرك لتخفيف الجانب الأكثر ملوحة أو تركيزًا.", "Solvent moves to dilute the side containing more dissolved particles."),
        difficulty: "standard",
      },
      {
        id: "sec1-sci4-q2",
        prompt: L("لماذا ينخفض نشاط الإنزيم بشدة عند رفع الحرارة أعلى بكثير من الدرجة المثلى؟", "Why does enzyme activity drop sharply at temperatures well above the optimum?"),
        choices: [
          L("تُستهلك مادة التفاعل للأبد بتكوين الإنزيم", "The enzyme is permanently consumed as a reactant"),
          L("تتغير البنية الفراغية للإنزيم والموقع النشط (تدنتر البروتين)", "Heat denatures the enzyme and alters its active site shape"),
          L("تزيد طاقة التنشيط بفعل الضوء", "Sunlight increases activation energy"),
          L("تتحول الخلايا حقيقية النواة إلى بدائية النواة", "Eukaryotic cells convert into prokaryotes"),
        ],
        correct_index: 1,
        explanation: L("الحرارة المفرطة تكسر الروابط الضعيفة المثبتة لشكل الإنزيم البروتيني، فيفقد الموقع النشط شكله الملائم.", "Excessive heat disrupts weak stabilizing bonds, denaturing the protein enzyme so the substrate no longer fits its active site."),
        hint: L("الإنزيمات مواد بروتينية حساسة للحرارة ودرجة الحموضة.", "Think about protein active-site stability."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("الخواص التجميعية للمحاليل", "Colligative Properties"), back: L("انخفاض الضغط البخاري، ارتفاع الغليان، انخفاض التجمد؛ تعتمد على عدد الدقائق المذابة.", "Lower vapour pressure, higher boiling point, lower freezing point; depend on dissolved particle number.") },
      { front: L("حقيقية النواة مقابل بدائية النواة", "Eukaryotes vs. Prokaryotes"), back: L("حقيقية النواة تمتلك نواة غشائية وعضيات؛ بدائية النواة (كالبكتيريا) بلا غشاء نووي.", "Eukaryotes have a membrane-bound nucleus; prokaryotes lack one.") },
    ],
  },

  // =========================================================================
  // MATHEMATICS (AR & EN TRACKS)
  // =========================================================================
  {
    slug: "math-complex-intro",
    aliases: ["complex numbers", "imaginary unit", "الأعداد المركبة", "الوحدة التخيلية"],
    subject: "mathematics",
    position: 1,
    title: L("الأعداد المركبة والوحدة التخيلية i", "Complex Numbers & Imaginary Unit i"),
    concepts: [
      {
        id: "powers-i",
        title: L("تعريف i والدورة الرباعية لقوى i", "Imaginary Unit i & Four-Cycle Powers"),
        body: L(
          "تُعرّف الوحدة التخيلية i بحيث i² = −1 لحل معادلات مثل x² + 1 = 0. تتكرر قوى i كل 4 قوى: i¹ = i ، i² = −1 ، i³ = −i ، i⁴ = 1. لتبسيط iⁿ نقسم n على 4 ونستعمل الباقي.",
          "The imaginary unit satisfies i² = −1. Integer powers repeat every four: i¹ = i, i² = −1, i³ = −i, i⁴ = 1. To simplify iⁿ, divide n by 4 and evaluate using the remainder.",
        ),
        formulaOrRule: L("z = a + bi  |  Re(z) = a , Im(z) = b  |  المرافق z̄ = a − bi  |  (a+bi)(a−bi) = a² + b²", "z = a + bi  |  Re(z) = a, Im(z) = b  |  Conjugate z̄ = a − bi  |  z·z̄ = a² + b²"),
      },
    ],
    worked: [
      {
        problem: L("بسّط المقدار (1 + i) / (1 − i) في الصورة القياسية a + bi.", "Simplify (1 + i) / (1 − i) into standard form a + bi."),
        steps: [
          L("اضرب البسط والمقام في مرافق المقام (1 + i).", "Multiply numerator and denominator by the denominator's conjugate (1 + i)."),
          L("المقام يصبح: (1 − i)(1 + i) = 1² + 1² = 2.", "Denominator becomes (1 − i)(1 + i) = 1² − i² = 1 + 1 = 2."),
          L("البسط يصبح: (1 + i)² = 1 + 2i + i² = 1 + 2i − 1 = 2i.", "Numerator becomes (1 + i)² = 1 + 2i + (−1) = 2i."),
          L("إذن الناتج: 2i / 2 = i.", "Quotient evaluates to 2i / 2 = i."),
        ],
        takeaway: L("استخدم مرافق المقام دائمًا لتحويل المقام إلى عدد حقيقي موجب.", "Always multiply top and bottom by the denominator's conjugate to rationalize quotients."),
      },
    ],
    mistakes: [
      L("نسيان أن i² = −1 عند فك الأقواس.", "Forgetting to substitute i² = −1 when expanding products."),
      L("أخذ الحد التخيلي bi بالكامل بدل المعامل الحقيقي b عند كتابة Im(z).", "Treating bi rather than b as the imaginary coefficient Im(z)."),
    ],
    questions: [
      {
        id: "sec1-math1-q1",
        prompt: L("ما قيمة المقدار التخيلي i¹⁴ في أبسط صورة؟", "Simplify the power i¹⁴."),
        choices: [L("i", "i"), L("-i", "-i"), L("-1", "-1"), L("1", "1")],
        correct_index: 2,
        explanation: L("بقسمة 14 على 4 يكون الباقي 2، إذن i¹⁴ = i¹² × i² = 1 × (−1) = −1.", "Dividing 14 by 4 leaves remainder 2, so i¹⁴ = (i⁴)³ · i² = 1 · (−1) = −1."),
        hint: L("اقسم الأس 14 على 4 واستخدم باقي القسمة.", "Divide exponent 14 by 4 and evaluate i^(remainder)."),
        difficulty: "foundational",
      },
      {
        id: "sec1-math1-q2",
        prompt: L("إذا كان 3 + (x − 2)i = 3 + 5i حيث x عدد حقيقي، فما قيمة x؟", "If 3 + (x − 2)i = 3 + 5i for real x, find x."),
        choices: [L("3", "3"), L("7", "7"), L("5", "5"), L("-3", "-3")],
        correct_index: 1,
        explanation: L("بتساوي الجزء التخيلي في الطرفين: x − 2 = 5، ومنها x = 7.", "Equating imaginary coefficients gives x − 2 = 5, hence x = 7."),
        hint: L("يتساوى عددان مركبان إذا تساوى الجزء الحقيقي مع الحقيقي والتخيلي مع التخيلي.", "Set the imaginary coefficients equal: x − 2 = 5."),
        difficulty: "foundational",
      },
      {
        id: "sec1-math1-q3",
        prompt: L("ما ناتج ضرب (2 + i)(3 − 2i) في الصورة a + bi؟", "Compute (2 + i)(3 − 2i) in standard form."),
        choices: [L("4 − i", "4 − i"), L("8 − i", "8 − i"), L("6 − 2i", "6 − 2i"), L("8 + 7i", "8 + 7i")],
        correct_index: 1,
        explanation: L("6 − 4i + 3i − 2i² = 6 − i − 2(−1) = 6 + 2 − i = 8 − i.", "6 − 4i + 3i − 2i² = 6 − i + 2 = 8 − i."),
        hint: L("استبدل −2i² بالقيمة +2.", "Remember −2i² = +2."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("دورة قوى i", "Cyclic powers of i"), back: L("i¹ = i , i² = −1 , i³ = −i , i⁴ = 1", "i¹ = i, i² = −1, i³ = −i, i⁴ = 1") },
      { front: L("حاصل ضرب العدد المركب في مرافقه", "Product of z and conjugate z̄"), back: L("(a + bi)(a − bi) = a² + b² (عدد حقيقي دائمًا)", "(a + bi)(a − bi) = a² + b² (always real)") },
    ],
  },
  {
    slug: "math-nature-of-roots",
    aliases: ["discriminant", "nature of roots", "المميز", "نوع جذور"],
    subject: "mathematics",
    position: 2,
    title: L("تحديد نوع جذور المعادلة التربيعية بالمميز", "Nature of Quadratic Roots via Discriminant"),
    concepts: [
      {
        id: "discriminant",
        title: L("حالات المميز Δ = b² − 4ac والمدلول البياني", "Discriminant Cases Δ = b² − 4ac"),
        body: L(
          "في المعادلة ax² + bx + c = 0 (حيث a ≠ 0): إذا كان Δ > 0 يوجد جذران حقيقيان مختلفان (القطع المكافئ يقطع محور السينات في نقطتين). إذا كان Δ = 0 يوجد جذران حقيقيان متساويان (يمس محور السينات). إذا كان Δ < 0 يوجد جذران مركبان غير حقيقيين مترافقان (لا يقطع محور السينات).",
          "For ax² + bx + c = 0 (a ≠ 0): Δ > 0 gives two distinct real roots (parabola crosses x-axis twice); Δ = 0 gives one repeated real root x = −b/(2a) (tangent to x-axis); Δ < 0 gives two complex conjugate non-real roots (no x-intercepts).",
        ),
        formulaOrRule: L("Δ = b² − 4ac", "Δ = b² − 4ac"),
      },
    ],
    worked: [
      {
        problem: L("أوجد قيمة الثابت k التي تجعل جذري المعادلة x² + kx + 9 = 0 متساويين.", "Find k such that x² + kx + 9 = 0 has equal real roots."),
        steps: [
          L("شرط تساوي الجذرين هو أن يكون المميز Δ = 0.", "Equal roots occur when Δ = 0."),
          L("a = 1 ، b = k ، c = 9 إذن Δ = k² − 4(1)(9) = k² − 36 = 0.", "With a = 1, b = k, c = 9: k² − 36 = 0."),
          L("إذن k² = 36 ومنها k = 6 أو k = −6.", "Solving yields k = ±6."),
        ],
        takeaway: L("للجذور المتساوية ضع Δ = 0، وللمختلفة الحقيقية Δ > 0، وللمركبة غير الحقيقية Δ < 0.", "Set Δ = 0 for equal roots, Δ > 0 for distinct real roots, Δ < 0 for complex roots."),
      },
    ],
    mistakes: [
      L("نسيان إشارة السالب عند تربيع b سالب مثل (−5)² = +25 وليس −25.", "Computing (−5)² as −25 instead of +25 in b² − 4ac."),
    ],
    questions: [
      {
        id: "sec1-math2-q1",
        prompt: L("ما نوع جذري المعادلة 2x² − 3x + 1 = 0؟", "What is the nature of the roots of 2x² − 3x + 1 = 0?"),
        choices: [
          L("جذران حقيقيان متساويان", "Two equal real roots"),
          L("جذران حقيقيان مختلفان", "Two distinct real roots"),
          L("جذران مركبان غير حقيقيين", "Two non-real complex conjugate roots"),
          L("لا توجد جذور للمعادلة", "No solutions exist"),
        ],
        correct_index: 1,
        explanation: L("المميز Δ = (−3)² − 4(2)(1) = 9 − 8 = 1 > 0، لذا يوجد جذران حقيقيان مختلفان.", "Δ = (−3)² − 4(2)(1) = 9 − 8 = 1 > 0, giving two distinct real roots."),
        hint: L("احسب Δ = b² − 4ac حيث a=2, b=-3, c=1.", "Compute Δ = b² − 4ac."),
        difficulty: "foundational",
      },
      {
        id: "sec1-math2-q2",
        prompt: L("إذا كان منحنى الدالة التربيعية y = ax² + bx + c لا يقطع محور السينات مطلقًا، فما إشارة المميز Δ؟", "If y = ax² + bx + c never intersects the x-axis, what must hold for Δ?"),
        choices: [L("Δ > 0", "Δ > 0"), L("Δ = 0", "Δ = 0"), L("Δ < 0", "Δ < 0"), L("Δ ≥ 1", "Δ ≥ 1")],
        correct_index: 2,
        explanation: L("عدم تقاطع المنحنى مع محور السينات يعني عدم وجود جذور حقيقية، أي Δ < 0.", "No x-intercepts means zero real roots, which occurs strictly when Δ < 0."),
        hint: L("نقاط التقاطع مع محور x هي الجذور الحقيقية.", "x-intercepts correspond to real roots."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("شرط الجذور المركبة غير الحقيقية", "Condition for non-real complex roots"), back: L("Δ = b² − 4ac < 0", "Δ = b² − 4ac < 0") },
      { front: L("شرط الجذرين الحقيقيين المتساويين", "Condition for equal real roots"), back: L("Δ = 0 ويمس المنحنى محور السينات في نقطة واحدة.", "Δ = 0; parabola touches the x-axis at one point.") },
    ],
  },
  {
    slug: "math-roots-coefficients",
    aliases: ["vieta", "roots and coefficients", "الجذرين والمعاملات"],
    subject: "mathematics",
    position: 3,
    title: L("العلاقة بين جذري المعادلة التربيعية ومعاملاتها", "Vieta's Formulas: Roots & Coefficients"),
    concepts: [
      {
        id: "vieta-formulas",
        title: L("مجموع الجذرين وحاصل ضربهما والمتطابقات التماثلية", "Sum, Product & Symmetric Identities"),
        body: L(
          "إذا كان α وβ جذري المعادلة ax² + bx + c = 0 فإن S = α + β = −b/a و P = αβ = c/a. ومن المتطابقات المهمة: α² + β² = S² − 2P ، و 1/α + 1/β = S/P. ولتكوين معادلة جذراها معلومان نكتب: x² − Sx + P = 0.",
          "If α and β solve ax² + bx + c = 0, then S = α + β = −b/a and P = αβ = c/a. Useful symmetric forms: α² + β² = S² − 2P and 1/α + 1/β = S/P. Forming a quadratic: x² − Sx + P = 0.",
        ),
        formulaOrRule: L("α + β = −b/a  |  αβ = c/a  |  x² − (α+β)x + αβ = 0", "α + β = −b/a  |  αβ = c/a  |  x² − Sx + P = 0"),
      },
    ],
    worked: [
      {
        problem: L("إذا كان مجموع جذري معادلة تربيعية −2 وحاصل ضربهما −8، كوّن المعادلة واحسب α² + β².", "If sum S = −2 and product P = −8, form the equation and evaluate α² + β²."),
        steps: [
          L("المعادلة هي x² − Sx + P = 0، أي x² − (−2)x + (−8) = 0.", "Quadratic: x² − Sx + P = x² − (−2)x + (−8) = 0."),
          L("تبسيط المعادلة: x² + 2x − 8 = 0.", "Simplified: x² + 2x − 8 = 0."),
          L("α² + β² = S² − 2P = (−2)² − 2(−8) = 4 + 16 = 20.", "α² + β² = (−2)² − 2(−8) = 4 + 16 = 20."),
        ],
        takeaway: L("حافظ على إشارة السالب أمام S في الصيغة x² − Sx + P = 0.", "Watch signs carefully in x² − Sx + P = 0 and α² + β² = S² − 2P."),
      },
    ],
    mistakes: [
      L("كتابة x² + Sx + P = 0 بدل x² − Sx + P = 0، أو نسيان السالب في −b/a.", "Writing +Sx instead of −Sx in x² − Sx + P = 0, or forgetting the minus in −b/a."),
    ],
    questions: [
      {
        id: "sec1-math3-q1",
        prompt: L("ما حاصل ضرب جذري المعادلة 3x² − 7x + 12 = 0؟", "What is the product of the roots of 3x² − 7x + 12 = 0?"),
        choices: [L("4", "4"), L("7/3", "7/3"), L("-4", "-4"), L("12", "12")],
        correct_index: 0,
        explanation: L("حاصل الضرب = c / a = 12 / 3 = 4.", "Product αβ = c/a = 12/3 = 4."),
        hint: L("اقسم الحد المطلق c على معامل x² وهو a.", "Use αβ = c/a (divide by leading coefficient 3!)."),
        difficulty: "foundational",
      },
      {
        id: "sec1-math3-q2",
        prompt: L("إذا كان مجموع جذري معادلة 7 وحاصل ضربهما 10، فما قيمة α² + β²؟", "Given root sum 7 and root product 10, evaluate α² + β²."),
        choices: [L("49", "49"), L("29", "29"), L("69", "69"), L("39", "39")],
        correct_index: 1,
        explanation: L("α² + β² = (α + β)² − 2αβ = 7² − 2(10) = 49 − 20 = 29.", "α² + β² = S² − 2P = 49 − 20 = 29."),
        hint: L("طبّق المتطابقة α² + β² = S² − 2P.", "Use S² − 2P."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("متطابقة مجموع مربعي الجذرين", "Sum of squares of roots"), back: L("α² + β² = (α + β)² − 2αβ", "α² + β² = (α + β)² − 2αβ") },
    ],
  },
  {
    slug: "math-sign-of-quadratic",
    aliases: ["sign of quadratic", "quadratic inequalities", "إشارة الدالة التربيعية", "المتباينات التربيعية"],
    subject: "mathematics",
    position: 4,
    title: L("إشارة الدالة التربيعية والمتباينات التربيعية", "Sign of Quadratic Function & Inequalities"),
    concepts: [
      {
        id: "sign-chart",
        title: L("قاعدة الإشارة وحل المتباينات التربيعية", "Sign Chart & Quadratic Inequalities"),
        body: L(
          "عند وجود جذرين حقيقيين r₁ < r₂ للدالة f(x) = ax² + bx + c: خارج الجذرين توافق إشارة الدالة إشارة المعامل a، وبين الجذرين تخالفها. وإذا كان Δ ≤ 0 تأخذ الدالة إشارة a في ح كلها (مع الصفر عند الجذر المكرر إن وُجد). لحل متباينة نجعل طرفها صفرًا، نوجد الجذور، ونختار الفترات المطلوبة مع فتح أو إغلاق الأقواس.",
          "When f(x) = ax² + bx + c has two real roots r₁ < r₂, f(x) shares the sign of 'a' outside (r₁, r₂) and has the opposite sign between them. If Δ ≤ 0, f(x) matches 'a' everywhere (zero at the repeated root if Δ=0). Solve inequalities by zeroing one side, finding roots, and mapping intervals.",
        ),
      },
    ],
    worked: [
      {
        problem: L("أوجد مجموعة حل المتباينة x² − 5x + 6 ≤ 0 في ح.", "Solve x² − 5x + 6 ≤ 0 in R."),
        steps: [
          L("نحلل الطرف الأيمن: (x − 2)(x − 3) ≤ 0، الجذور هي 2 و 3.", "Factor: (x − 2)(x − 3) ≤ 0 -> roots 2 and 3."),
          L("بما أن معامل x² موجب (a = 1 > 0)، فالدالة سالبة بين الجذرين وموجبة خارجهما.", "Since a = 1 > 0, the quadratic is negative between 2 and 3."),
          L("لوجود علامة ≤ نغلق الفترة عند الجذرين: مجموعة الحل = [2, 3].", "Including endpoints for ≤ yields closed interval [2, 3]."),
        ],
        takeaway: L("تحقّق دائمًا من علامة التباين (> مفتوحة، ≥ مغلقة) ومن إشارة المعامل الرئيسي a.", "Verify strict vs. non-strict inequality bounds and leading sign a."),
      },
    ],
    mistakes: [
      L("إغلاق الفترة عند استخدام علامة < أو > الصريحة.", "Including boundary roots in strict inequalities (< or >)."),
    ],
    questions: [
      {
        id: "sec1-math4-q1",
        prompt: L("ما مجموعة حل المتباينة x² − 9 < 0 في مجموعة الأعداد الحقيقية؟", "What is the real solution set of x² − 9 < 0?"),
        choices: [
          L("[-3, 3]", "[-3, 3]"),
          L("(-3, 3)", "(-3, 3)"),
          L("ح \\ [-3, 3]", "R \\ [-3, 3]"),
          L("(-∞, 3)", "(-∞, 3)"),
        ],
        correct_index: 1,
        explanation: L("الجذور هي −3 و 3 ومعامل x² موجب، فتكون الدالة سالبة تمامًا في الفترة المفتوحة (−3, 3).", "Roots are −3 and 3 with a > 0, so x² − 9 < 0 strictly between −3 and 3: (−3, 3)."),
        hint: L("العلامة < تعني فترة مفتوحة عند الجذرين.", "Strict < requires parentheses (open interval)."),
        difficulty: "standard",
      },
      {
        id: "sec1-math4-q2",
        prompt: L("إذا كان f(x) = x² + 4، فأين تكون إشارة الدالة سالبة في ح؟", "For f(x) = x² + 4, where is f(x) negative over R?"),
        choices: [
          L("(-2, 2)", "(-2, 2)"),
          L("∅ (موجبة دائمًا لكل x ∈ ح)", "∅ (always positive for all real x)"),
          L("x < 0 فقط", "x < 0 only"),
          L("R \\ {0}", "R \\ {0}"),
        ],
        correct_index: 1,
        explanation: L("المميز Δ = 0 − 16 < 0 ومعامل x² موجب (a = 1 > 0)، فتبقى الدالة موجبة دائمًا لكل عدد حقيقي.", "Δ < 0 and a = 1 > 0, so f(x) is strictly positive across all of R."),
        hint: L("هل توجد جذور حقيقية للمعادلة x² + 4 = 0؟", "Does x² + 4 = 0 have any real roots?"),
        difficulty: "challenging",
      },
    ],
    flashcards: [
      { front: L("إشارة ax²+bx+c عندما Δ < 0", "Sign of ax²+bx+c when Δ < 0"), back: L("تأخذ الدالة إشارة المعامل a دائمًا لكل قيم x الحقيقية.", "Same sign as leading coefficient 'a' for all real x.") },
    ],
  },

  // =========================================================================
  // PHILOSOPHY & LOGIC
  // =========================================================================
  {
    slug: "phil-human-thinking",
    aliases: ["تفكير إنساني", "فلسفة", "منطق", "استدلال", "thinking", "philosophy", "logic"],
    subject: "philosophy-logic",
    position: 1,
    title: L("التفكير الإنساني وأساليبه والموقف الفلسفي والمنطق", "Human Thinking, Philosophical Stance & Logic"),
    concepts: [
      {
        id: "thinking-styles",
        title: L("أساليب التفكير والتفكير الناقد والإبداعي", "Thinking Styles, Critical & Creative Thinking"),
        body: L(
          "أساليب التفكير: الخرافي (تفسير بلا دليل)، الديني (يرتكز على الإيمان ومصادره)، الفلسفي (التساؤل المنظم وفحص الافتراضات)، العلمي (الملاحظة والفروض والتجربة)، والإبداعي (طلاقة ومرونة وأصالة وتطوير). التفكير الناقد يفحص الحجج ويميز الحقيقة عن الرأي ويكشف التناقض.",
          "Human thinking operates via superstitious, religious, philosophical, scientific, and creative modes. Critical thinking evaluates evidence, separates fact from opinion, and detects fallacies; creative thinking combines fluency, flexibility, originality, and elaboration.",
        ),
      },
      {
        id: "stance-logic",
        title: L("الموقف الفلسفي والحدود والقضايا والاستدلال", "Philosophical Stance, Terms, Propositions & Inference"),
        body: L(
          "الموقف الفلسفي يتسم بالدهشة والتساؤل والشك المنهجي والنقد والتحليل والتسامح الفكري. وفي المنطق: الحد له مفهوم (الصفات) وماصدق (الأفراد) والعلاقة عكسية، والقضية الحملية تنقسم وفق الكم والكيف (A, E, I, O)، والقياس يتكون من مقدمتين ونتيجة يربطهما حد أوسط.",
          "Key traits of philosophical stance: wonder, questioning, methodical doubt, criticism, analysis, dialogue. In logic: Concept vs. Denotation vary inversely; categorical propositions classify into A, E, I, O; syllogistic inference links two premises via a middle term.",
        ),
        formulaOrRule: L("A: كلية موجبة | E: كلية سالبة | I: جزئية موجبة | O: جزئية سالبة", "A: Universal Aff. | E: Universal Neg. | I: Particular Aff. | O: Particular Neg."),
      },
    ],
    worked: [
      {
        problem: L("صنّف القضية «بعض المدن ليست ساحلية» من حيث الكم والكيف، واستخرج الحد الأوسط في القياس: كل المعادن توصل الكهرباء؛ النحاس معدن؛ إذن النحاس يوصل الكهرباء.", "Classify 'Some cities are not coastal' by quantity & quality, and identify the middle term in: All metals conduct electricity; Copper is a metal; Therefore copper conducts electricity."),
        steps: [
          L("كلمة «بعض» تفيد الكم الجزئي، وكلمة «ليست» تفيد الكيف السالب -> قضية جزئية سالبة (O).", "'Some' marks Particular quantity and 'not' marks Negative quality -> Type O."),
          L("الحد الذي تكرر في المقدمتين واختفى من النتيجة هو «معدن/المعادن» -> هو الحد الأوسط.", "The term shared in both premises and absent in the conclusion is 'metal' -> Middle Term."),
        ],
        takeaway: L("تأكد من تمييز الكم (كل/بعض/لا أحد) والكيف (إثبات/نفي)، وميز الحد الأوسط بدوره الرابط.", "Identify quantity + quality first, and locate the middle term connecting the two premises."),
      },
    ],
    mistakes: [
      L("الخلط بين الشك المنهجي (تعليق الحكم لحين فحص الأدلة) والشك المطلق (الرفض الدائم للحقيقة).", "Confusing temporary methodical doubt with absolute skepticism."),
      L("الخلط بين المفهوم (الصفات الذهنية) والماصدق (الأفراد الواقعيين).", "Confusing intensional meaning (concept) with extensional set of individuals (denotation)."),
    ],
    questions: [
      {
        id: "sec1-phil-q1",
        prompt: L("أي خصائص التفكير الإبداعي تعني «تنوع الأفكار وعدم الجمود في زاوية واحدة»؟", "Which creative thinking skill denotes generating diverse angles rather than staying fixed on one path?"),
        choices: [L("الطلاقة", "Fluency"), L("المرونة", "Flexibility"), L("الأصالة", "Originality"), L("الشك المنهجي", "Methodical doubt")],
        correct_index: 1,
        explanation: L("الطلاقة هي غزارة عدد الأفكار، أما المرونة فهي تنوعها والانتقال بين زوايا مختلفة، والأصالة هي جِدّتها.", "Fluency measures quantity of ideas; Flexibility measures diversity of perspectives; Originality measures novelty."),
        hint: L("ابحث عن الخاصية المرتبطة بتنوع الاتجاهات والقدرة على التغيير.", "Think of shifting perspectives flexibly."),
        difficulty: "foundational",
      },
      {
        id: "sec1-phil-q2",
        prompt: L("ما تصنيف القضية المنطقية: «بعض الطلاب ليسوا رياضيين»؟", "Classify the categorical proposition: 'Some students are not athletes.'"),
        choices: [
          L("كلية موجبة (A)", "Universal affirmative (A)"),
          L("كلية سالبة (E)", "Universal negative (E)"),
          L("جزئية موجبة (I)", "Particular affirmative (I)"),
          L("جزئية سالبة (O)", "Particular negative (O)"),
        ],
        correct_index: 3,
        explanation: L("اللفظ «بعض» يحدد الكم الجزئي، و«ليسوا» يحدد الكيف السالب، فهي جزئية سالبة (O).", "'Some' makes it particular; 'are not' makes it negative -> Type O."),
        hint: L("حدد الكم (كل/بعض) ثم الكيف (إثبات/نفي).", "Check quantity ('some') and quality ('not')."),
        difficulty: "standard",
      },
      {
        id: "sec1-phil-q3",
        prompt: L("ماذا يحدث للماصدق (عدد الأفراد) عند زيادة الصفات المكونة لمفهوم حدٍّ منطقي؟", "What happens to the denotation (set of objects) when we add more defining attributes to a concept?"),
        choices: [
          L("يتسع الماصدق ويزداد عدد الأفراد", "Denotation expands"),
          L("يضيق الماصدق ويقل عدد الأفراد غالبًا", "Denotation usually narrows"),
          L("يظل الماصدق ثابتًا في كل الأحوال", "Denotation remains identical"),
          L("يتحول الحد الكلي إلى أداة استفهام", "The term loses logical reference"),
        ],
        correct_index: 1,
        explanation: L("العلاقة عكسية: كلما أضفت صفات (مثل الانتقال من «طالب» إلى «طالب أولى ثانوي بمدرسة محددة») قلّ عدد الأفراد المنطبق عليهم الحد.", "Intension and extension vary inversely: adding attributes narrows the matching set of individuals."),
        hint: L("قارن بين عدد أفراد «طالب» وعدد أفراد «طالب متفوق في الصف الأول الثانوي».", "Compare 'student' vs. 'honors First Secondary student'."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("المفهوم مقابل الماصدق", "Intension vs. Denotation"), back: L("المفهوم: الصفات الذهنية للحد | الماصدق: الأفراد التي ينطبق عليها الحد (العلاقة عكسية).", "Concept: defining attributes | Denotation: matching individuals (inverse relation).") },
      { front: L("الشك المنهجي", "Methodical doubt"), back: L("تعليق الحكم مؤقتًا وفحص الأدلة للوصول للحقيقة، لا إنكار المعرفة مطلقًا.", "Temporary suspension of judgment to test evidence systematically.") },
    ],
  },

  // =========================================================================
  // HISTORY
  // =========================================================================
  {
    slug: "hist-civilization-history",
    aliases: ["الحضارة والتاريخ", "مصادر دراسة", "عوامل قيام", "مصر القديمة", "الاقتصاد", "civilization", "history"],
    subject: "history",
    position: 1,
    title: L("الحضارة والتاريخ ومصادر الحضارة ومصر القديمة", "Civilization, Historical Sources & Ancient Egypt"),
    concepts: [
      {
        id: "civ-vs-hist",
        title: L("مفهوم الحضارة والتاريخ والعصور التاريخية", "Civilization vs. History & Historical Eras"),
        body: L(
          "الحضارة هي ثمرة تفاعل الإنسان مع بيئته لتحسين ظروف الحياة ماديًا ومعنويًا. أما التاريخ فهو دراسة النشاط الإنساني في الماضي بالاستناد إلى الأدلة والمصادر لتفسير التغير وفهم الحاضر. وتنتقل مراكز الحضارة عبر التبادل والتأثير بين الشرق والبحر المتوسط والحضارة الإسلامية وأوروبا.",
          "Civilization is humanity's material and cultural achievement from interacting with environment; History studies past human activity through evidence. Historical eras divide broadly into Ancient (to ~476 CE), Middle (476–1453 CE), Modern (1453–late 18th c.), and Contemporary.",
        ),
        formulaOrRule: L("المصادر الأولية (آثار، نقوش، برديات، أوستراكا، نقود) أقوى توثيقًا لزمن الحدث من المصادر الثانوية (دراسات لاحقة)", "Primary Sources (inscriptions, papyri, ostraca, coins, monuments) date directly to the era vs. Secondary Sources (modern analyses)"),
      },
      {
        id: "egypt-factors",
        title: L("مقومات الحضارة المصرية وتوحيد القطرين", "Foundations of Egyptian Civilization & Unification"),
        body: L(
          "تفاعلت العوامل الطبيعية (نهر النيل، الموقع المتوسط، الحدود الآمنة نسبيًا، المناخ والثروات المعدنية) مع العوامل البشرية (كفاح المصري القديم وتنظيم الري والإدارة). وتوحّدت مصر على يد الملك نعرمر/مينا، ومرت بالدولة القديمة والوسطى والحديثة وعصور الاضمحلال والمتأخرة.",
          "Natural factors (Nile River, strategic crossroads, protective borders, minerals) combined with human administration, irrigation engineering, and labour. King Narmer (Menes) unified Upper and Lower Egypt into an enduring state.",
        ),
      },
    ],
    worked: [
      {
        problem: L("لماذا لا تكفي مقولة «مصر هبة النيل» وحدها لتفسير قيام الحضارة المصرية القديمة؟", "Why is calling Egypt solely 'the gift of the Nile' incomplete?"),
        steps: [
          L("نهر النيل قدّم الماء والطمي وخط النقل الطبيعي (عامل طبيعي أساسي).", "The Nile supplied water, fertile silt, and transport (vital natural factor)."),
          L("لكنه لم يحفر القنوات أو ينظّم الفيضان أو يبنِ الإدارة بمفرده.", "Yet the river alone did not dig canals, manage harvests, or build law and architecture."),
          L("جاء جهد الإنسان المصري في العمل والتخطيط والإدارة والابتكار ليحول المورد الطبيعي إلى حضارة.", "Human effort, irrigation coordination, administration, and knowledge converted natural potential into civilization."),
        ],
        takeaway: L("الحضارة نتاج تفاعل الموارد الطبيعية مع الجهد والعقل البشري المنظّم.", "Civilization emerges when human effort organizes natural gifts."),
      },
    ],
    mistakes: [
      L("الخلط بين المصدر الأولي المعاصر للحدث والمصدر الثانوي الذي كتبه باحث في عصر لاحق.", "Mixing primary contemporaneous sources with secondary modern books."),
      L("اعتبار الحدود التاريخية مثل 476م أو 1453م تغيرًا فجائيًا في يوم واحد.", "Treating conventional era boundary dates (476 CE, 1453 CE) as abrupt overnight shifts."),
    ],
    questions: [
      {
        id: "sec1-hist-q1",
        prompt: L("أيٌّ مما يلي يُعد مصدرًا أوليًا لدراسة تاريخ مصر القديمة؟", "Which of the following is a primary source for studying ancient Egyptian history?"),
        choices: [
          L("موسوعة تاريخية أُلّفت في القرن العشرين", "A 20th-century historical encyclopedia"),
          L("بردية إدارية أو لوحة نقوش تعود لعصر الدولة الحديثة", "An administrative papyrus or carved stele from the New Kingdom"),
          L("مقال صحفي حديث عن الأهرامات", "A modern news article about the pyramids"),
          L("رواية أدبية معاصرة", "A contemporary historical novel"),
        ],
        correct_index: 1,
        explanation: L("البرديات والنقوش والآثار والمسكوكات والأوستراكا المعاصرة للحدث هي مصادر أولية؛ أما الكتب الحديثة فمصادر ثانوية.", "Papyri, inscriptions, ostraca, and artefacts dating from the period itself are primary sources."),
        hint: L("المصدر الأولي ينتمي لزمن الحدث أو يُنقَل عن شهود معاصرين له.", "Look for an artefact produced during the ancient period itself."),
        difficulty: "foundational",
      },
      {
        id: "sec1-hist-q2",
        prompt: L("ما «الأوستراكا» التي استُخدمت في مصر القديمة وتُعد من المصادر الأولية؟", "What were 'ostraca' used as primary sources in ancient Egypt?"),
        choices: [
          L("توابيت خشبية ملكية", "Royal wooden coffins"),
          L("كسرات فخار أو حجر رخيص استُخدمت للكتابة والتدريب والمراسلات اليومية", "Pottery shards or limestone flakes used for everyday writing, notes, and drafts"),
          L("سفن تجارية في البحر الأحمر", "Red Sea merchant vessels"),
          L("معابد صخرية في النوبة", "Rock-cut Nubian temples"),
        ],
        correct_index: 1,
        explanation: L("استُخدمت شقفات الفخار والحجر الجيري (الأوستراكا) لوفرتها وقلة تكلفتها مقارنة بالبردي في الملاحظات والخطابات.", "Ostraca were inexpensive pottery or stone shards widely used for daily letters, receipts, and scribal practice."),
        hint: L("كانت بديلًا اقتصاديًا للكتابة اليومية غير الرسمية.", "Think of an affordable everyday writing surface compared to papyrus."),
        difficulty: "standard",
      },
      {
        id: "sec1-hist-q3",
        prompt: L("لماذا ينبغي فحص النقوش الملكية القديمة نقديًا رغم كونها مصادر أولية؟", "Why must royal victory inscriptions still be evaluated critically even though they are primary sources?"),
        choices: [
          L("لأنها كُتبت بعد الحدث بألف عام دائمًا", "Because they were always written 1,000 years later"),
          L("لأنها قد تنحاز أو تبالغ في تمجيد الحاكم وانتصاراته فتحتاج للمقارنة بمصادر أخرى", "Because they may reflect bias or royal exaggeration, requiring cross-checking"),
          L("لأنها لا تحتوي أي تواريخ أو أسماء", "Because they contain no names or events"),
          L("لأن الآثار غير قابلة للدراسة", "Because physical artefacts cannot be dated"),
        ],
        correct_index: 1,
        explanation: L("تقييم المصدر التاريخي يشمل فحص الأصالة والزمن والغرض والانحياز والمقارنة بمصادر مستقلة.", "Evaluating sources requires inspecting purpose, audience, potential bias, and corroboration with independent evidence."),
        hint: L("فكّر في معايير نقد المصدر التاريخي: الغرض والانحياز.", "Consider bias and royal propaganda in official inscriptions."),
        difficulty: "challenging",
      },
    ],
    flashcards: [
      { front: L("المصادر الأولية مقابل الثانوية", "Primary vs. Secondary Sources"), back: L("الأولية: آثار ونقوش وبرديات وأوستراكا معاصرة للحدث | الثانوية: دراسات وكتب الباحثين اللاحقة.", "Primary: contemporary artefacts/texts | Secondary: later scholarly interpretations.") },
      { front: L("تقسيم العصور التاريخية", "Major Historical Eras"), back: L("قديمة (حتى ~476م) -> وسطى (حتى 1453م) -> حديثة -> معاصرة.", "Ancient (to ~476 CE) -> Middle (476-1453 CE) -> Modern -> Contemporary.") },
    ],
  },

  // =========================================================================
  // ARABIC LANGUAGE
  // =========================================================================
  {
    slug: "arab-parts-of-speech",
    aliases: ["أقسام الكلمة", "الإعراب والبناء", "المرفوعات", "عنترة", "حاتم الطائي", "السموأل", "كعب بن زهير"],
    subject: "arabic-language",
    position: 1,
    title: L("أقسام الكلمة والإعراب والبناء والمرفوعات والأدب", "Parts of Speech, Inflection, Nominatives & Literature"),
    concepts: [
      {
        id: "grammar-core",
        title: L("الكلمة والمعرب والمبني ومرفوعات الأسماء", "Word Classes, Mu'rab vs. Mabni & Nominatives"),
        body: L(
          "الكلمة: اسم (يقبل الـ والتنوين والجر والنداء)، فعل (ماضٍ مبني، مضارع معرب يرفع بالضمة وينصب بعد لن/أن ويجزم بعد لم، وأمر مبني)، وحرف. المعرب يتغير آخره بتغير العامل (جاء محمدٌ، رأيت محمدًا، مررت بمحمدٍ)، والمبني يلزم آخره صورة واحدة (هذا، الذي، الضمائر، الماضي والأمر).",
          "Arabic classifies words into nouns, verbs (past/present/imperative), and particles. Inflected words shift endings by syntax; invariant words stay fixed.",
        ),
        formulaOrRule: L("المرفوعات: المبتدأ، الخبر، الفاعل، نائب الفاعل، اسم كان، خبر إنّ | علامات الرفع: الضمة (أصلية) والألف (المثنى) والواو (جمع المذكر والأسماء الخمسة)", "Nominatives: Subject, Predicate, Doer, Deputy Doer, Noun of Kana, Predicate of Inna | Markers: Damma / Alif / Waw"),
      },
      {
        id: "literature-texts",
        title: L("النصوص والقراءة وقصة عنترة بن شداد", "Core Readings, Classical Poetry & Antara's Saga"),
        body: L(
          "تشمل نصوص الترم الأول: مكارم الأخلاق وحاتم الطائي (الكرم والحلم والوفاء)، قصيدة السموأل (شباب تسامى للعلا وكهول — الفخر بالخلق والوفاء لا كثرة العدد)، وصية أمامة بنت الحارث (النثر التعليمي)، وقصة عنترة بن شداد (الصراع بين الكفاءة الشخصية والحواجز الاجتماعية حتى نيل الاعتراف والوفاء لعبلة).",
          "Covers Hatim al-Ta'i reading, Al-Samaw'al's ode on honour over numbers, Umamah's prose counsel, and the four parts of Antara ibn Shaddad's heroic struggle for recognition.",
        ),
      },
    ],
    worked: [
      {
        problem: L("أعرب: «المهندسان ماهران» و«إن الصدقَ منجاةٌ» و«لن يقصرَ المجتهدُ».", "Parse: «المهندسان ماهران», «إن الصدقَ منجاةٌ», and «لن يقصرَ المجتهدُ»."),
        steps: [
          L("المهندسان: مبتدأ مرفوع وعلامة رفعه الألف لأنه مثنى؛ ماهران: خبر مرفوع بالألف لأنه مثنى.", "المهندسان: subject raised with Alif (dual); ماهران: predicate raised with Alif (dual)."),
          L("إن الصدقَ منجاةٌ: الصدق اسم إن منصوب بالفتحة، ومنجاة خبر إن مرفوع بالضمة.", "الصدق: noun of إنّ (mansub with Fatha); منجاة: predicate of إنّ (marfu with Damma)."),
          L("لن يقصرَ: يقصر فعل مضارع منصوب بـ(لن) وعلامة نصبه الفتحة الظاهرة.", "يقصر: present verb in subjunctive (mansub) after لن with visible Fatha."),
        ],
        takeaway: L("حدّد نوع الجملة (اسمية أم فعلية) والعامل السابق للكلمة قبل تعيين علامة الإعراب الأصلية أو الفرعية.", "Check sentence type and governing particle before assigning primary vs. secondary markers."),
      },
    ],
    mistakes: [
      L("إدخال الجزم على الأسماء؛ فالجزم يختص بالفعل المضارع فقط بينما الجر يختص بالأسماء.", "Applying jazm to nouns or jarr to verbs (jarr is nouns only; jazm is present verbs only)."),
      L("الخلط بين اسم كان (المرفوع) واسم إنّ (المنصوب).", "Confusing noun of كان (nominative) with noun of إنّ (accusative)."),
    ],
    questions: [
      {
        id: "sec1-arab-q1",
        prompt: L("ما علامة رفع الكلمتين في جملة «المهندسان ماهران»؟", "What is the nominative marker in «المهندسان ماهران»?"),
        choices: [L("الضمة الظاهرة", "Visible Damma"), L("الألف لأنهما مثنى", "Alif (dual noun)"), L("الواو لأنهما جمع", "Waw (plural)"), L("ثبوت النون", "Retention of Nun")],
        correct_index: 1,
        explanation: L("المثنى يُرفع بالألف (المهندسان، ماهران) ويُنصب ويُجر بالياء.", "Dual nouns take Alif in the nominative case and Ya in accusative/genitive."),
        hint: L("انظر إلى عدد الاسم قبل تعيين علامة الرفع الفرعية.", "Notice both words denote two (dual)."),
        difficulty: "foundational",
      },
      {
        id: "sec1-arab-q2",
        prompt: L("في جملة «كان الجوُّ معتدلًا»، ما الإعراب الصحيح لكلمة «معتدلًا»؟", "In «كان الجوُّ معتدلًا», how is «معتدلًا» parsed?"),
        choices: [
          L("خبر مبتدأ مرفوع", "Nominative predicate"),
          L("اسم كان مرفوع", "Nominative noun of كان"),
          L("خبر كان منصوب وعلامة نصبه الفتحة", "Accusative predicate of كان"),
          L("فاعل مرفوع", "Nominative doer"),
        ],
        correct_index: 2,
        explanation: L("كان وأخواتها ترفع المبتدأ ويسمى اسمها (الجوُّ) وتنصب الخبر ويسمى خبرها (معتدلًا).", "كان raises its subject (الجوُّ) and puts its predicate (معتدلًا) in the accusative."),
        hint: L("تذكّر عمل الأفعال الناسخة: ترفع الاسم وتنصب الخبر.", "كان raises the noun and makes the predicate accusative."),
        difficulty: "standard",
      },
      {
        id: "sec1-arab-q3",
        prompt: L("في قصيدة السموأل «شباب تسامى للعلا وكهول»، بمَ تُقاس قيمة الجماعة وقوتها الحقيقية؟", "In Al-Samaw'al's poem, what truly defines a community's strength and worth?"),
        choices: [
          L("بكثرة العدد فقط مهما تراجعت الأخلاق", "Numerical size alone"),
          L("بالأخلاق الكريمة والوفاء والشرف وحماية الجار لا بكثرة العدد", "Noble character, loyalty, honour, and bravery rather than sheer numbers"),
          L("بجمع الثروات المادية حصرًا", "Hoarding wealth exclusively"),
          L("بالعزلة عن القبائل", "Total isolation"),
        ],
        correct_index: 1,
        explanation: L("يدافع السموأل عن قومه بأن قلة العدد لا تعيبهم ما دام فيهم الوفاء والشجاعة والشرف وعلو الهمة.", "Al-Samaw'al celebrates moral integrity, courage, and loyalty as surpassing mere numerical superiority."),
        hint: L("تذكّر القيمة الأساسية التي افتخر بها الشاعر الجاهلي ردًا على التعيير بقلة العدد.", "Recall Al-Samaw'al's famous defence against small numbers."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("الحالات الإعرابية المختصة بالأسماء والأفعال", "Inflectional Scope: Nouns vs. Verbs"), back: L("الجر خاص بالأسماء | الجزم خاص بالفعل المضارع | الرفع والنصب مشتركان.", "Jarr = nouns only | Jazm = present verbs only | Raf' & Nasb = shared.") },
      { front: L("عمل كان مقابل إنّ", "Kana vs. Inna sisters"), back: L("كان: ترفع الاسم وتنصب الخبر | إنّ: تنصب الاسم وترفع الخبر.", "Kana raises noun / accusative predicate | Inna does the opposite.") },
    ],
  },

  // =========================================================================
  // ENGLISH
  // =========================================================================
  {
    slug: "eng-past-tenses",
    aliases: ["past narrative", "egypt's heritage", "hands help", "truth vs. lies", "save and shine", "using technology"],
    subject: "english",
    position: 1,
    title: L("مهارات وقواعد اللغة الإنجليزية — الوحدات الخمس", "English Units 1–5: Grammar, Vocabulary & Writing"),
    concepts: [
      {
        id: "tenses-modals",
        title: L("Past Simple vs. Past Continuous & Modals of Obligation", "Past Narrative Tenses & Modal Distinctions"),
        body: L(
          "Past Simple (verb+ed / irregular) describes completed events and sequences. Past Continuous (was/were + V-ing) describes ongoing background actions (While we were walking, the guide called us). For obligation: mustn't = strictly prohibited; don't have to = unnecessary (optional); should = advice.",
          "Past Simple narrates completed actions; Past Continuous frames ongoing background actions interrupted by 'when' or paired with 'while'. Key modal contrast: 'mustn't' means forbidden/not allowed, whereas 'don't have to' means not necessary.",
        ),
        formulaOrRule: L("Conditionals: Zero (present, present) | First (present, will+inf) | Second (past simple, would+inf)", "Conditionals: 0 (If+pres, pres) | 1st (If+pres, will+V) | 2nd (If+past, would+V)"),
      },
      {
        id: "patterns-quantifiers",
        title: L("Verb Patterns (-ing vs. to+V) & Countable/Uncountable Quantifiers", "Gerunds vs. Infinitives & Quantifiers"),
        body: L(
          "Enjoy, avoid, finish, suggest take gerund (-ing). Decide, hope, plan, promise take to + infinitive. Uncountable nouns (information, advice, homework, equipment) have no plural and pair with much / a little / little; countable plural nouns pair with many / a few / few.",
          "Avoid/enjoy/suggest + V-ing; decide/hope/plan + to V (stop V-ing = quit; stop to V = pause in order to do it). Uncountable nouns like 'information' and 'advice' take much / a little (never 'an advice' or 'informations').",
        ),
      },
    ],
    worked: [
      {
        problem: L("اختر الصيغة الصحيحة: 'You _____ share private passwords online' و 'We have _____ information about the source'.", "Choose: (1) 'You _____ share private information without permission' [prohibition]; (2) 'We have very _____ information about this source'."),
        steps: [
          L("في (1) المعنى منع وتحريم وليس عدم ضرورة -> نستخدم mustn't.", "For (1), prohibition requires 'mustn't' (not 'don't have to')."),
          L("في (2) كلمة information غير معدود وبمعنى عدم الكفاية -> نستخدم little.", "For (2), 'information' is uncountable and insufficient -> 'little'."),
        ],
        takeaway: L("تأكد من المعنى (منع مقابل اختيارية) ومن كون الاسم معدودًا أم غير معدود.", "Always check prohibition vs. absence of need, and countable vs. uncountable nouns."),
      },
    ],
    mistakes: [
      L("استعمال 'informations' أو 'an advice' جمعًا أو تنكيرًا للأسماء غير المعدودة.", "Pluralizing uncountable nouns like 'informations' or using 'an advice'."),
      L("وضع 'will' داخل جملة الشرط 'if' في الحالة الشرطية الأولى.", "Placing 'will' inside the if-clause in First Conditional sentences."),
    ],
    questions: [
      {
        id: "sec1-eng-q1",
        prompt: L(
          "Choose the correct option: While the students _____ the museum statues, the guide _____ their history.",
          "While the students _____ the museum statues, the guide _____ their history.",
        ),
        choices: [
          L("examined / explained", "examined / explained"),
          L("were examining / was explaining", "were examining / was explaining"),
          L("examining / explain", "examining / explain"),
          L("had examine / explains", "had examine / explains"),
        ],
        correct_index: 1,
        explanation: L(
          "With 'while' describing two simultaneous ongoing background actions in the past, both take Past Continuous (were examining / was explaining).",
          "Two simultaneous ongoing past actions introduced by 'while' take Past Continuous (were examining / was explaining).",
        ),
        hint: L("'While' here joins two actions in progress at the same moment in the past.", "Notice the two simultaneous continuous background actions."),
        difficulty: "foundational",
      },
      {
        id: "sec1-eng-q2",
        prompt: L(
          "You _____ enter the construction area without a safety helmet; it is strictly forbidden.",
          "You _____ enter the construction area without a safety helmet; it is strictly forbidden.",
        ),
        choices: [L("don't have to", "don't have to"), L("mustn't", "mustn't"), L("should", "should"), L("had to", "had to")],
        correct_index: 1,
        explanation: L(
          "'mustn't' expresses strict prohibition (not allowed), whereas 'don't have to' merely means there is no obligation.",
          "'mustn't' signals strict prohibition ('not allowed'), whereas 'don't have to' means 'optional / not necessary'.",
        ),
        hint: L("Look closely at the phrase 'strictly forbidden'.", "Prohibition vs. lack of necessity."),
        difficulty: "foundational",
      },
      {
        id: "sec1-eng-q3",
        prompt: L(
          "If I _____ the school headteacher, I would start a fact-checking club for digital literacy.",
          "If I _____ the school headteacher, I would start a fact-checking club for digital literacy.",
        ),
        choices: [L("am", "am"), L("were", "were"), L("will be", "will be"), L("would be", "would be")],
        correct_index: 1,
        explanation: L(
          "In a Second Conditional hypothetical situation, formal school grammar uses Past Simple ('were') in the if-clause paired with 'would + base verb'.",
          "Second conditional hypothetical situations take Past Simple ('were') in the if-clause and 'would + infinitive' in the result clause.",
        ),
        hint: L("Check 'would start' in the main clause — which conditional type uses 'would'?", "Identify the conditional type from 'would start'."),
        difficulty: "standard",
      },
      {
        id: "sec1-eng-q4",
        prompt: L(
          "We should avoid _____ disposable plastic whenever reusable alternatives exist.",
          "We should avoid _____ disposable plastic whenever reusable alternatives exist.",
        ),
        choices: [L("to use", "to use"), L("using", "using"), L("used", "used"), L("use", "use")],
        correct_index: 1,
        explanation: L(
          "The verb 'avoid' (along with enjoy, finish, suggest, keep, mind) is followed directly by a gerund (-ing).",
          "Verbs like 'avoid', 'enjoy', 'finish', and 'suggest' require a gerund (-ing) complement.",
        ),
        hint: L("Remember which verb pattern follows 'avoid'.", "Gerund vs. to-infinitive after 'avoid'."),
        difficulty: "standard",
      },
    ],
    flashcards: [
      { front: L("mustn't مقابل don't have to", "mustn't vs. don't have to"), back: L("mustn't = ممنوع تمامًا | don't have to = غير ضروري (اختياري).", "mustn't = prohibited | don't have to = not necessary.") },
      { front: L("الأسماء غير المعدودة ومحدداتها", "Uncountable nouns & quantifiers"), back: L("information / advice / homework + much / a little / little (بدون جمع أو a/an).", "information / advice / homework + much / a little / little.") },
    ],
  },
];

function normalizeText(value?: string | null): string {
  return (value ?? "").toLowerCase().trim();
}

function findTopicModule(input: {
  lessonIdOrSlug?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  trackSlug?: string | null;
  subjectKey?: string | null;
  position?: number | null;
}): TopicModule {
  const idSlug = normalizeText(input.lessonIdOrSlug);
  const titleCombined = `${normalizeText(input.titleAr)} ${normalizeText(input.titleEn)}`;
  const subjectHint = normalizeText(input.subjectKey) || normalizeText(input.trackSlug?.replace(/-(ar|en)$/, ""));

  // 1. Exact slug or alias match
  for (const mod of TOPIC_MODULES) {
    if (mod.slug === idSlug || mod.aliases.some((alias) => idSlug.includes(alias) || titleCombined.includes(alias.toLowerCase()))) {
      return mod;
    }
  }

  // 2. Match by subject + position
  const subjectMods = TOPIC_MODULES.filter((mod) => subjectHint && mod.subject.includes(subjectHint));
  if (subjectMods.length) {
    const pos = Math.max(1, input.position ?? 1);
    return subjectMods.find((mod) => mod.position === pos) ?? subjectMods[(pos - 1) % subjectMods.length];
  }

  // 3. Fallback by keywords inside titles
  if (/complex|discriminant|quadratic|vieta|جذور|مركبة|متباينات|مصفوف|معادلة/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "mathematics")!;
  }
  if (/water|hydrosphere|osmosis|ph|enzyme|ماء|غلاف مائي|أسموزية|كثافة/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "integrated-science")!;
  }
  if (/history|civilization|nile|حضارة|تاريخ|مصادر|مصر القديمة|أوستراكا/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "history")!;
  }
  if (/thinking|philosophy|logic|تفكير|فلسفة|منطق|استدلال/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "philosophy-logic")!;
  }
  if (/past|modal|conditional|heritage|english/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "english")!;
  }
  if (/نحو|إعراب|بناء|مرفوع|عنترة|حاتم|السموأل|كعب/.test(titleCombined)) {
    return TOPIC_MODULES.find((m) => m.subject === "arabic-language")!;
  }
  return TOPIC_MODULES[0];
}

export function getLessonStudyCompanion(input: {
  lessonIdOrSlug?: string | null;
  titleAr?: string | null;
  titleEn?: string | null;
  trackSlug?: string | null;
  subjectKey?: string | null;
  position?: number | null;
  contentLanguage: ContentLanguage;
}): LessonStudyCompanion {
  const lang = input.contentLanguage;
  const pick = (loc: LocalizedText) => (lang === "en" ? loc.en : loc.ar);
  const slugKey = (input.lessonIdOrSlug ?? "").trim().toLowerCase();
  const hasDirectTopicSlug = slugKey
    ? TOPIC_MODULES.some((m) => m.slug === slugKey)
    : false;
  const exactPack = !hasDirectTopicSlug ? getLessonStudyPack(input.lessonIdOrSlug, lang) : null;

  if (exactPack) {
    const lessonName =
      (lang === "en" ? input.titleEn : input.titleAr) || exactPack.title;
    return {
      matchedTopic: exactPack.title,
      keyConcepts: exactPack.keyConcepts,
      workedExamples: exactPack.workedExamples,
      commonMistakes: exactPack.commonMistakes,
      aiTutorPrompts:
        lang === "en"
          ? [
              `Explain "${lessonName}" step by step with simple real-life examples.`,
              `Quiz me on "${lessonName}" with 3 exam-style questions and check my answers.`,
              `What are the most common exam mistakes in "${lessonName}" and how do I avoid them?`,
              `Create concise study flashcards summarizing the laws and definitions in "${lessonName}".`,
            ]
          : [
              `اشرح لي درس «${lessonName}» خطوة بخطوة بأسلوب مبسط مع أمثلة.`,
              `اختبرني في درس «${lessonName}» بثلاثة أسئلة بمستوى الامتحان وصحّح لي إجاباتي.`,
              `ما أكثر الأخطاء الشائعة في امتحان درس «${lessonName}» وكيف أتجنبها؟`,
              `لخّص القوانين والتعريفات الأساسية في درس «${lessonName}» في بطاقات مراجعة سريعة.`,
            ],
      curatedQuestions: exactPack.questions.map((q) => ({
        ...q,
        lessonTitle: lessonName,
      })),
      flashcards: exactPack.cards,
    };
  }

  const mod = findTopicModule(input);
  const lessonName = (lang === "en" ? input.titleEn : input.titleAr) || pick(mod.title);

  return {
    matchedTopic: pick(mod.title),
    keyConcepts: mod.concepts.map((c) => ({
      id: c.id,
      title: pick(c.title),
      body: pick(c.body),
      formulaOrRule: c.formulaOrRule ? pick(c.formulaOrRule) : undefined,
      example: c.example ? pick(c.example) : undefined,
    })),
    workedExamples: mod.worked.map((w) => ({
      problem: pick(w.problem),
      steps: w.steps.map(pick),
      takeaway: pick(w.takeaway),
    })),
    commonMistakes: mod.mistakes.map(pick),
    aiTutorPrompts:
      lang === "en"
        ? [
            `Explain "${lessonName}" step by step with simple real-life examples.`,
            `Quiz me on "${lessonName}" with 3 exam-style questions and check my answers.`,
            `What are the most common exam mistakes in "${lessonName}" and how do I avoid them?`,
            `Create concise study flashcards summarizing the laws and definitions in "${lessonName}".`,
          ]
        : [
            `اشرح لي درس «${lessonName}» خطوة بخطوة بأسلوب مبسط مع أمثلة.`,
            `اختبرني في درس «${lessonName}» بثلاثة أسئلة بمستوى الامتحان وصحّح لي إجاباتي.`,
            `ما أكثر الأخطاء الشائعة في امتحان درس «${lessonName}» وكيف أتجنبها؟`,
            `لخّص القوانين والتعريفات الأساسية في درس «${lessonName}» في بطاقات مراجعة سريعة.`,
          ],
    curatedQuestions: mod.questions.map((q) => ({
      id: q.id,
      question_type: "multiple-choice",
      prompt: pick(q.prompt),
      choices: q.choices.map(pick),
      correct_index: q.correct_index,
      explanation: pick(q.explanation),
      hint: pick(q.hint),
      difficulty: q.difficulty,
      lessonTitle: lessonName,
    })),
    flashcards: mod.flashcards.map((f) => ({
      front: pick(f.front),
      back: pick(f.back),
      hint: f.hint ? pick(f.hint) : undefined,
    })),
  };
}

/** Retrieve curated Sec. 1 questions across a whole subject/track (used by /review and /boss). */
export function getSubjectQuestionBank(
  subjectOrTrackSlug: string,
  contentLanguage: ContentLanguage,
): CuratedStudyQuestion[] {
  const cleanSubject = subjectOrTrackSlug.replace(/-(ar|en)$/, "");
  const mods = TOPIC_MODULES.filter((mod) => mod.subject === cleanSubject);
  const pool = mods.length ? mods : TOPIC_MODULES;
  const pick = (loc: LocalizedText) => (contentLanguage === "en" ? loc.en : loc.ar);
  const baseQuestions = pool.flatMap((mod) =>
    mod.questions.map((q) => ({
      id: q.id,
      question_type: "multiple-choice" as const,
      prompt: pick(q.prompt),
      choices: q.choices.map(pick),
      correct_index: q.correct_index,
      explanation: pick(q.explanation),
      hint: pick(q.hint),
      difficulty: q.difficulty,
      lessonTitle: pick(mod.title),
    })),
  );

  const trackCandidates = [
    subjectOrTrackSlug,
    `${cleanSubject}-${contentLanguage}`,
    cleanSubject,
  ];
  const extraPacks =
    trackCandidates.map((slug) => getTrackLessonStudyPacks(slug)).find((arr) => arr.length > 0) ??
    [];
  const seenPrompts = new Set(baseQuestions.map((q) => q.prompt.trim().toLowerCase()));
  const merged = [...baseQuestions];
  for (const pack of extraPacks) {
    for (const q of pack.questions) {
      const key = q.prompt.trim().toLowerCase();
      if (seenPrompts.has(key)) continue;
      seenPrompts.add(key);
      merged.push({ ...q, lessonTitle: pack.title });
    }
  }
  return merged;
}

/** Canonical pre-built Sec. 1 Term 1 study decks for /study across all 8 tracks. */
export function getCanonicalStudyDecks(): CanonicalStudyDeck[] {
  const specs: Array<{
    trackSlug: string;
    subject: SubjectKey;
    contentLanguage: ContentLanguage;
    titleAr: string;
    titleEn: string;
    descriptionAr: string;
    descriptionEn: string;
  }> = [
    {
      trackSlug: "integrated-science-ar",
      subject: "integrated-science",
      contentLanguage: "ar",
      titleAr: "العلوم المتكاملة — المسار العربي (أولى ثانوي ترم ١)",
      titleEn: "Integrated Science — Arabic Track (Sec. 1 Term 1)",
      descriptionAr: "بطاقات ومفاهيم الغلاف المائي، قطبية الماء والـ pH، شذوذ الكثافة والحرارة النوعية، والأسموزية والإنزيمات.",
      descriptionEn: "Hydrosphere, water polarity, pH scale, density anomaly, specific heat, osmosis, and enzymes.",
    },
    {
      trackSlug: "integrated-science-en",
      subject: "integrated-science",
      contentLanguage: "en",
      titleAr: "العلوم المتكاملة — المسار الإنجليزي (أولى ثانوي ترم ١)",
      titleEn: "Integrated Science — English Track (Sec. 1 Term 1)",
      descriptionAr: "نسخة المنهج بالإنجليزية: الغلاف المائي، الروابط الهيدروجينية، الحرارة النوعية، والأهمية الحيوية.",
      descriptionEn: "Hydrosphere, hydrogen bonding, Q = mcΔT, colligative properties, osmosis, and enzymes.",
    },
    {
      trackSlug: "mathematics-ar",
      subject: "mathematics",
      contentLanguage: "ar",
      titleAr: "الرياضيات — المسار العربي (أولى ثانوي ترم ١)",
      titleEn: "Mathematics — Arabic Track (Sec. 1 Term 1)",
      descriptionAr: "الأعداد المركبة وقوى i، المميز Δ، صيغ فييتا، إشارة الدالة التربيعية، وحل المتباينات.",
      descriptionEn: "Complex numbers, discriminant, Vieta's formulas, sign chart, and quadratic inequalities.",
    },
    {
      trackSlug: "mathematics-en",
      subject: "mathematics",
      contentLanguage: "en",
      titleAr: "الرياضيات — المسار الإنجليزي (أولى ثانوي ترم ١)",
      titleEn: "Mathematics — English Track (Sec. 1 Term 1)",
      descriptionAr: "نسخة الرياضيات بالإنجليزية: الأعداد المركبة والمميز والعلاقات بين الجذور والمتباينات.",
      descriptionEn: "Complex numbers, discriminant analysis, root relations, sign of quadratics, and inequalities.",
    },
    {
      trackSlug: "arabic-language-ar",
      subject: "arabic-language",
      contentLanguage: "ar",
      titleAr: "اللغة العربية — النحو والنصوص وقصة عنترة (ترم ١)",
      titleEn: "Arabic Language — Grammar, Literature & Antara",
      descriptionAr: "أقسام الكلمة، المعرب والمبني، المرفوعات، ومفاتيح نصوص القراءة والشعر وقصة عنترة.",
      descriptionEn: "Parts of speech, inflection vs. invariance, nominatives, reading texts, and Antara.",
    },
    {
      trackSlug: "english-en",
      subject: "english",
      contentLanguage: "en",
      titleAr: "اللغة الإنجليزية — الوحدات ١ إلى ٥ (ترم ١)",
      titleEn: "English — Units 1 to 5 Master Deck (Term 1)",
      descriptionAr: "الأزمنة الماضية، أفعال الإلزام والنصيحة، الجمل الشرطية، المصادر والأفعال، والمعدود وغير المعدود.",
      descriptionEn: "Past narrative tenses, modals, conditionals 0–2, verb patterns, and quantifiers.",
    },
    {
      trackSlug: "history-ar",
      subject: "history",
      contentLanguage: "ar",
      titleAr: "التاريخ — مصر الحضارة والعالم القديم (ترم ١)",
      titleEn: "History — Egypt & Ancient World (Term 1)",
      descriptionAr: "الحضارة والتاريخ، المصادر الأولية والثانوية، عوامل قيام الحضارة، توحيد القطرين، والاقتصاد.",
      descriptionEn: "Civilization vs. history, primary vs. secondary sources, Nile factors, and ancient economy.",
    },
    {
      trackSlug: "philosophy-logic-ar",
      subject: "philosophy-logic",
      contentLanguage: "ar",
      titleAr: "الفلسفة والمنطق — التفكير والموقف الفلسفي والقياس (ترم ١)",
      titleEn: "Philosophy & Logic — Thinking, Stance & Syllogism",
      descriptionAr: "أساليب التفكير، التفكير الناقد والإبداعي، مباحث الفلسفة، الحدود والقضايا، والقياس.",
      descriptionEn: "Thinking styles, critical vs. creative thought, propositions A/E/I/O, and syllogism.",
    },
  ];

  return specs.map((spec) => {
    const pick = (loc: LocalizedText) => (spec.contentLanguage === "en" ? loc.en : loc.ar);
    const baseCards = TOPIC_MODULES.filter((mod) => mod.subject === spec.subject).flatMap((mod) =>
      mod.flashcards.map((c) => ({
        front: pick(c.front),
        back: pick(c.back),
        hint: c.hint ? pick(c.hint) : undefined,
      })),
    );
    const lessonPacks = getTrackLessonStudyPacks(spec.trackSlug);
    const seen = new Set(baseCards.map((c) => c.front.trim().toLowerCase()));
    const cards: Array<{ front: string; back: string; hint?: string }> = [...baseCards];
    for (const pack of lessonPacks) {
      for (const c of pack.cards) {
        const key = c.front.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push(c);
      }
    }
    return {
      id: `canonical-${spec.trackSlug}`,
      trackSlug: spec.trackSlug,
      subject: spec.subject,
      contentLanguage: spec.contentLanguage,
      titleAr: spec.titleAr,
      titleEn: spec.titleEn,
      descriptionAr: spec.descriptionAr,
      descriptionEn: spec.descriptionEn,
      cards,
    };
  });
}

/** Local deterministic evaluator for supplementary practice and offline/fallback grading. */
export function evaluateLocalChoice(input: {
  selectedChoice: string;
  choices: string[];
  correctIndex?: number | null;
  answerKey?: unknown;
}): { correct: boolean; correctChoiceText?: string } | null {
  const selectedNorm = input.selectedChoice.trim().toLowerCase();
  let resolvedIndex: number | null =
    typeof input.correctIndex === "number" && Number.isInteger(input.correctIndex)
      ? input.correctIndex
      : null;

  if (resolvedIndex === null && input.answerKey && typeof input.answerKey === "object") {
    const key = input.answerKey as Record<string, unknown>;
    if (typeof key.correct_index === "number") resolvedIndex = key.correct_index;
    else if (typeof key.correctIndex === "number") resolvedIndex = key.correctIndex;
    else if (typeof key.value === "string") {
      const target = key.value.trim().toLowerCase();
      const idx = input.choices.findIndex((c) => c.trim().toLowerCase() === target);
      if (idx >= 0) resolvedIndex = idx;
      else return { correct: selectedNorm === target, correctChoiceText: key.value };
    } else if (Array.isArray(key.accepted_answers)) {
      const accepted = key.accepted_answers.map((v) => String(v).trim().toLowerCase());
      return {
        correct: accepted.includes(selectedNorm),
        correctChoiceText: String(key.accepted_answers[0] ?? ""),
      };
    }
  }

  if (resolvedIndex === null || !input.choices[resolvedIndex]) return null;
  const expected = input.choices[resolvedIndex];
  return {
    correct: expected.trim().toLowerCase() === selectedNorm,
    correctChoiceText: expected,
  };
}
