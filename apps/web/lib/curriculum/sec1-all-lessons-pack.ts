import type { ContentLanguage } from "./catalog.ts";
import type { CanonicalLessonStudyPack, CuratedStudyQuestion } from "./pack-types.ts";
import { RENAISSANCE_LESSON_STUDY_PACKS } from "./packs/index.ts";

export type {
  CanonicalFlashcard,
  CanonicalLessonStudyPack,
  CuratedStudyQuestion,
  StudyConceptSection,
  StudyWorkedExample,
  SubjectSlugKey,
} from "./pack-types.ts";

/**
 * Legacy Phase-0 packs. Any pack whose `id` is also exported by a Renaissance subject
 * file in `./packs/` is replaced at load time (see `ALL_LESSON_STUDY_PACKS` below), so the
 * legacy entry is retained only as a rollback reference until it is pruned.
 */
const LEGACY_LESSON_STUDY_PACKS: CanonicalLessonStudyPack[] = [
  // =========================================================================
  // 1A. INTEGRATED SCIENCE — ARABIC TRACK (5 EXACT LESSONS)
  // =========================================================================
  {
    id: "pack-sci-ar-1",
    lessonSlug: "sci-hydrosphere",
    trackSlug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 1,
    title: "الغلاف المائي على الأرض",
    titleAr: "الغلاف المائي على الأرض",
    titleEn: "The Hydrosphere on Earth",
    summary:
      "تغطي المياه نحو 70.7% من سطح الأرض؛ تشكل المياه المالحة قرابة 97% بينما لا تتعدى العذبة 3% (معظمها في الأنهار الجليدية والمياه الجوفية)، وتدور عبر التبخر والنتح والتكثف والهطول والجريان السطحي لربط الأغلفة البيئية.",
    formulaOrRule: "نسبة المسطحات ≈ 70.7% من سطح الأرض | 97% مياه مالحة : 3% مياه عذبة | النتح = تبخر حيوي من ثغور النبات",
    keyConcepts: [
      {
        id: "sci-hydro-ar-1",
        title: "توزيع المياه ومكونات النظام البيئي",
        body: "يتفاعل الغلاف المائي مع الغلاف الجوي والصخري والحيوي داخل الأنظمة البيئية بين عوامل حيوية (كائنات منتجة ومستهلكة ومحللة) وعوامل لا حيوية (ماء، أملاح ذائبة، ضوء، درجة حرارة).",
        formulaOrRule: "العذبة ≈ 3% (أغلبها جليد وجوفية — والنسبة السطحية السائلة ضئيلة جدًا)",
        example: "مياه الأنهار والبحيرات العذبة تمثل شريان الشرب والزراعة رغم صغر نسبتها الكلية."
      },
      {
        id: "sci-hydro-ar-2",
        title: "دورة الماء والعمليات الفيزيائية والحيوية",
        body: "ترفع الطاقة الشمسية الماء بالبخر والنتح إلى الغلاف الجوي فيتكثف مكونًا السحب، ثم يعود بالهطول ليتوزع بين جريان سطحي وتسرب جوفي يغذي الخزانات المائية والنيتروجينية.",
        example: "خلال النتح يمتص الجذر الماء ويرفعه في الخشب حتى يتبخر من الثغور لتبريد النبات وسحب العصارة."
      }
    ],
    workedExamples: [
      {
        problem: "تتبع رحلة قطرة مطر سقطت على مرتفع صخري قريب من بحيرة عذبة.",
        steps: [
          "1) تنقسم القطرة بين جريان سطحي يصب في المجرى المائي وتسرب عبر المسام لتغذية الخزان الجوفي.",
          "2) تمتص جذور النباتات جزءًا من رطوبة التربة وتعيده للجو بالنتح، بينما يتبخر جزء مباشر بفعل الشمس.",
          "3) يتكثف بخار الماء في طبقات الجو العليا الباردة ليهطل مجددًا ومكملًا دورة مغلقة الكتلة مفتوحة الطاقة."
        ],
        takeaway: "دورة الماء لا تُنتج ماءً جديدًا بل تعيد توزيع المياه وتنقيتها طبيعيًا مع انتقال الطاقة الحرارية."
      }
    ],
    commonMistakes: [
      "الاعتقاد أن معظم المياه العذبة متاح بسهولة في الأنهار؛ الصحيح أن النسبة الأكبر محجوزة في الجليديات والمياه الجوفية العميقة.",
      "اختزال دورة الماء في التبخر والهطول فقط وإغفال النتح النباتي والتسرب الجوفي والجريان السطحي."
    ],
    questions: [
      {
        id: "pack-q-sci-ar-1a",
        question_type: "multiple-choice",
        prompt: "أين توجد النسبة الأكبر من المياه العذبة على كوكب الأرض؟",
        choices: [
          "في القمم الجليدية والأنهار الجليدية والمياه الجوفية العميقة",
          "في الأنهار الجارية والبحيرات المفتوحة",
          "في بخار الماء داخل الغلاف الجوي",
          "في البحار والمحيطات قليلة الملوحة"
        ],
        correct_index: 0,
        explanation: "تشكل المياه العذبة نحو 3% فقط من إجمالي الماء، ومعظمها مخزون في الجليديات القطبية والمياه الجوفية وليس في الأنهار السطحية.",
        hint: "قارن بين حجم الأنهار المتدفقة وحجم الكتل الجليدية في القطبين.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-ar-1b",
        question_type: "multiple-choice",
        prompt: "أي عملية تضيف بخار ماء إلى الغلاف الجوي مباشرة من الكائنات الحية المنتجة؟",
        choices: ["التبخر من البحار", "النتح من أوراق النباتات", "التكثف حول نويات الغبار", "التسرب نحو الصخور النفاذة"],
        correct_index: 1,
        explanation: "النتح هو فقدان النبات لبخار الماء عبر الثغور، وهو المسار الحيوي الموازي للتبخر الفيزيائي من المسطحات.",
        hint: "اختر العملية التي تربط الغلاف الحيوي بالغلاف الجوي.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-ar-1c",
        question_type: "multiple-choice",
        prompt: "لماذا يؤدي تلوث طبقة طمي نافذة فوق خزان جوفي إلى أثر طويل المدى مقارنة بمجرى نهري سريع؟",
        choices: [
          "لأن حركة المياه الجوفية وتجددها بطيئة جدًا مقارنة بسرعة تجدد مياه الأنهار",
          "لأن المياه الجوفية لا تتفاعل مع الأكسجين نهائيًا",
          "لأن النهر يتبخر بالكامل كل أسبوع",
          "لأن الأملاح تمنع وصول الضوء إلى الخزان الجوفي"
        ],
        correct_index: 0,
        explanation: "بطء حركة المياه الجوفية وطول زمن مكوثها يعني أن الملوثات التي تتسرب إليها تحتاج سنوات طويلة لتتبدد.",
        hint: "قارن معدل استبدال المياه في الخزان الجوفي بمعدل الجريان في النهر.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "الغلاف المائي على الأرض", back: "يشمل المياه السطحية (≈70.7% من سطح الأرض)، نحو 97% مالحة و3% عذبة أغلبها جليد وجوفية.", hint: "تذكر النسبة: 97 مالحة مقابل 3 عذبة" },
      { front: "عملية النتح (Transpiration)", back: "تبخر الماء من ثغور الأوراق النباتية؛ تسهم في رفع العصارة وتبريد النبات وتغذية الغلاف الجوي ببخار الماء." },
      { front: "دورة الماء في الطبيعة", back: "تسلسل مستمر: تبخر + نتح ← تكثف ← هطول ← جريان سطحي وتسرب جوفي، مدفوعة بالطاقة الشمسية والجاذبية." }
    ]
  },
  {
    id: "pack-sci-ar-2",
    lessonSlug: "sci-water-chemistry",
    trackSlug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 2,
    title: "الخصائص الكيميائية للماء",
    titleAr: "الخصائص الكيميائية للماء",
    titleEn: "Chemical Properties of Water",
    summary:
      "يتكون جزيء الماء H2O من رابطتين تساهميتين قطبيتين بزاوية تقارب 104.5° بسبب فرق السالبية الكهربائية بين الأكسجين والهيدروجين؛ فتتكون روابط هيدروجينية بين الجزيئات تفسر شذوذ خواصه وتفاعلات التأين والتميؤ والرقم الهيدروجيني pH.",
    formulaOrRule: "زاوية الرابطة ≈ 104.5° | رابطة تساهمية قطبية داخل الجزيء، وهيدروجينية بين الجزيئات | pH < 7 حمضي، = 7 متعادل، > 7 قاعدي",
    keyConcepts: [
      {
        id: "sci-chem-ar-1",
        title: "القطبية والرابطة الهيدروجينية",
        body: "تجذب ذرة الأكسجين إلكترونات الرابطة التساهمية نحوها أقوى من الهيدروجين فتظهر عليها شحنة جزيئية سالبة δ− وعلى ذرتي الهيدروجين شحنة موجبة δ+، ومع انحناء الجزيء بزاوية 104.5° ينشأ تجاذب هيدروجيني بين الجزيئات.",
        formulaOrRule: "الرابطة التساهمية داخل الجزيء أقوى كثيرًا من الرابطة الهيدروجينية بين الجزيئات",
        example: "عند غليان الماء تنكسر الروابط الهيدروجينية بين الجزيئات، أما الرابطة التساهمية فتظل كما هي."
      },
      {
        id: "sci-chem-ar-2",
        title: "التحلل المائي للأملاح (التميؤ) ومقياس pH",
        body: "ذوبان كلوريد الصوديوم NaCl (من حمض قوي وقاعدة قوية) يبقي الماء متعادلًا (pH ≈ 7)، بينما يتميأ ملح بيكربونات الصوديوم ليرفع pH ويميل ملح كلوريد الأمونيوم للحامضية.",
        example: "محلول pH = 4 حمضي قوي نسبيًا مقارنة بمحلول متعادل pH = 7، ومحلول pH = 11 قاعدي."
      }
    ],
    workedExamples: [
      {
        problem: "رتب المحاليل ذات القيم الآتية لـ pH: (أ: 3.5، ب: 7.0، ج: 9.2) وفسر أثر كل منها على الأسماك.",
        steps: [
          "1) المحلول (أ = 3.5) حمضي لقيمة أقل من 7، ويشير لتركيز مرتفع من أيونات الهيدروجين قد يضر خياشيم الكائنات المائية.",
          "2) المحلول (ب = 7.0) متعادل وملائم لمعظم المياه العذبة المتزنة.",
          "3) المحلول (ج = 9.2) قاعدي لقيمة أعلى من 7؛ وأغلب الأحياء المائية تفضل مدى ضيقًا حول التعادل أو قلوية خفيفة."
        ],
        takeaway: "قيمة pH تقيس الحمضية والقاعدية لوغاريتميًا؛ تغير وحدة واحدة يعني تغير تركيز الأيونات عشر مرات."
      }
    ],
    commonMistakes: [
      "الخلط بين الرابطة التساهمية (التي تربط H و O داخل الجزيء نفسه) والرابطة الهيدروجينية (التي تربط بين جزيء ماء وجزيء آخر).",
      "الاعتقاد أن درجة غليان الماء تكسر الروابط التساهمية وتحول الماء إلى غازي H2 و O2 — الغليان تغير فيزيائي يفكك الروابط الهيدروجينية فقط."
    ],
    questions: [
      {
        id: "pack-q-sci-ar-2a",
        question_type: "multiple-choice",
        prompt: "ما نوع الرابطة التي تنكسر عند غليان الماء وتحوله إلى بخار؟",
        choices: [
          "الروابط الهيدروجينية بين جزيئات الماء",
          "الروابط التساهمية القطبية داخل الجزيء",
          "الروابط الأيونية داخل الأكسجين",
          "الروابط الفلزية بين ذرات الهيدروجين"
        ],
        correct_index: 0,
        explanation: "التبخير يفصل الجزيئات عن بعضها بكسر التجاذب الهيدروجيني بينها دون تفكيك الجزيء H2O نفسه.",
        hint: "هل ينتج عن غليان الماء غاز هيدروجين وأكسجين أم بخار ماء H2O؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-ar-2b",
        question_type: "multiple-choice",
        prompt: "ما قيمة الزاوية التقريبية بين رابطتي O–H في جزيء الماء المنحني؟",
        choices: ["90°", "104.5°", "120°", "180°"],
        correct_index: 1,
        explanation: "وجود زوجين غير رابطين من الإلكترونات على الأكسجين يضغط الزاوية لتصبح ≈ 104.5°، ما يمنع انعدام القطبية الكلية للجزيء.",
        hint: "لو كانت 180° لكان الجزيء خطيًا غير قطبي في المحصلة.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-ar-2c",
        question_type: "multiple-choice",
        prompt: "أي ملح يعطي محلولًا مائيًا متعادلًا (pH ≈ 7) عند إذابته في الماء المقطر؟",
        choices: ["كلوريد الصوديوم NaCl", "بيكربونات الصوديوم NaHCO3", "كلوريد الأمونيوم NH4Cl", "أسيتات الصوديوم CH3COONa"],
        correct_index: 0,
        explanation: "NaCl مشتق من قاعدة قوية (NaOH) وحمض قوي (HCl) فلا يتميأ أيوناه ولا يغيران توازن H+ و OH−.",
        hint: "ابحث عن الملح المشتق من حمض قوي وقاعدة قوية معًا.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "قطبية جزيء الماء H2O", back: "جزيء منحني (≈ 104.5°) تحمل فيه ذرة الأكسجين شحنة جزيئية سالبة δ− والهيدروجين شحنة موجبة δ+." },
      { front: "تميؤ الأملاح في الماء", back: "NaCl متعادل (حمض قوي + قاعدة قوية)، NH4Cl حمضي، NaHCO3 قاعدي لأن الأيون الضعيف يتفاعل مع أيونات الماء." },
      { front: "المحلول ذو pH = 4 مقابل pH = 11", back: "pH = 4 حمضي؛ pH = 7 متعادل؛ pH = 11 قاعدي." }
    ]
  },
  {
    id: "pack-sci-ar-3",
    lessonSlug: "sci-water-physics",
    trackSlug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 3,
    title: "الخصائص الفيزيائية للماء",
    titleAr: "الخصائص الفيزيائية للماء",
    titleEn: "Physical Properties of Water",
    summary:
      "يبلغ الماء أقصى كثافة له عند 4°C فيطفو الجليد الأقل كثافة فوق سطح البحيرات المتجمدة عازلًا الكائنات البحرية بالأسفل، كما تمنحه حرارته النوعية العالية (≈ 4200 J/kg·°C) قدرة فريدة على حفظ استقرار مناخ الأرض وأجسام الكائنات.",
    formulaOrRule: "ρ = m / V | أقصى كثافة للماء النقي عند 4°C (≈ 1000 kg/m³) | Q = m × c × ΔT",
    keyConcepts: [
      {
        id: "sci-phys-ar-1",
        title: "الكثافة وشذوذ تمدد الماء عند التجمد",
        body: "عند تبريد الماء من 4°C إلى 0°C تتخذ الجزيئات ترتيبًا بلوريًا سداسيًا مفتوحًا عبر الروابط الهيدروجينية يزداد فيه الحجم وتقل الكثافة، فيطفو الجليد فوق الماء السائل عند قاع بحيرة درجة حرارته 4°C.",
        formulaOrRule: "كثافة الجليد (0°C) < كثافة الماء عند 4°C ← يطفو الجليد ويعزل الطبقة السفلى",
        example: "استخدام الهيدروميتر لقياس الكثافة النسبية للسوائل؛ كلما زادت كثافة المحلول قلّ الجزء المغمور من الهيدروميتر."
      },
      {
        id: "sci-phys-ar-2",
        title: "الحرارة النوعية المرتفعة والاستقرار الحراري",
        body: "يمتص الماء كميات ضخمة من الحرارة لرفع درجة حرارته درجة مئوية واحدة فقط لأن جزءًا كبيرًا من الطاقة يُستهلك في تكسير الروابط الهيدروجينية قبل زيادة طاقة الحركة، فتحافظ المحيطات على مناخ معتدل.",
        formulaOrRule: "Q = m · c · ΔT (c للماء ≈ 4180–4200 J/kg·°C)",
        example: "عينة كتلتها 0.5 kg تسخن بمقدار 10°C تمتص Q = 0.5 × 4200 × 10 = 21,000 J."
      }
    ],
    workedExamples: [
      {
        problem: "احسب كمية الحرارة اللازمة لرفع درجة حرارة 2 kg من الماء من 20°C إلى 35°C علمًا بأن c = 4200 J/(kg·°C).",
        steps: [
          "1) احسب فرق درجات الحرارة: ΔT = 35 − 20 = 15°C.",
          "2) طبّق القانون Q = m × c × ΔT = 2 × 4200 × 15.",
          "3) الناتج: Q = 126,000 J (أو 126 kJ)."
        ],
        takeaway: "تحقق دائمًا من تحويل الكتلة إلى الكيلوجرام ومن أن ΔT هي الفرق بين النهائية والابتدائية."
      }
    ],
    commonMistakes: [
      "الاعتقاد أن الماء يستمر في الانكماش عند التبريد حتى 0°C مثل باقي السوائل؛ الماء ينكمش حتى 4°C ثم يتمدد بين 4°C و 0°C.",
      "نسيان أن غمر الهيدروميتر يزيد في السوائل الأقل كثافة ويقل في السوائل الأكثر كثافة مثل المياه عالية الملوحة."
    ],
    questions: [
      {
        id: "pack-q-sci-ar-3a",
        question_type: "multiple-choice",
        prompt: "عند أي درجة حرارة يبلغ الماء النقي أقصى كثافة له (وتستقر في قاع البحيرات المتجمدة)؟",
        choices: ["0°C", "4°C", "25°C", "100°C"],
        correct_index: 1,
        explanation: "تصل جزيئات الماء السائل إلى أقرب تعبئة قبل تكوّن الشبكة البلورية السداسية الواسعة عند 4°C.",
        hint: "عند 0°C يتجمد الماء ويتمدد فتقل كثافته ويصعد للأعلى.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-ar-3b",
        question_type: "multiple-choice",
        prompt: "سخان نقل 42,000 J من الحرارة إلى 1 kg من الماء (c = 4200 J/kg·°C). كم تبلغ الزيادة في درجة حرارته ΔT؟",
        choices: ["5°C", "10°C", "20°C", "42°C"],
        correct_index: 1,
        explanation: "من العلاقة Q = m·c·ΔT فإن ΔT = 42,000 ÷ (1 × 4200) = 10°C.",
        hint: "اقسم الطاقة Q على حاصل ضرب الكتلة في الحرارة النوعية.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-ar-3c",
        question_type: "multiple-choice",
        prompt: "وضع هيدروميتر في عينة ماء عذب ثم نقل إلى ماء بحر شديد الملوحة عند الحرارة نفسها. ماذا يحدث للجزء المغمور؟",
        choices: [
          "يغوص أعمق لأن الملوحة تقلل الدفع",
          "يرتفع أكثر فيطفو بجزء مغمور أقل لأن كثافة الماء المالح أعلى",
          "يبقى المغمور ثابتًا تمامًا",
          "يغرق إلى القاع فورًا"
        ],
        correct_index: 1,
        explanation: "المياه المالحة أعلى كثافة فتمنح قوة طفو أكبر لكل وحدة حجم مزاحة، لذا يحتاج الهيدروميتر لإزاحة حجم أقل.",
        hint: "كلما زادت كثافة السائل ارتفع الهيدروميتر للأعلى.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "شذوذ كثافة الماء عند 4°C", back: "أقصى كثافة للماء عند 4°C؛ عند التبريد نحو 0°C يتمدد لتكوّن بلورات ثلج سداسية مفتوحة فيطفو الجليد." },
      { front: "قانون الطاقة الحرارية النوعية", back: "Q = m · c · ΔT حيث c للماء ≈ 4200 J/(kg·°C)؛ تفسر استقرار حرارة المسطحات البحرية." },
      { front: "الهيدروميتر", back: "أداة قياس الكثافة النسبية للسوائل؛ كلما زادت كثافة السائل قل غطس الأداة فيه." }
    ]
  },
  {
    id: "pack-sci-ar-4",
    lessonSlug: "sci-aqueous-solutions",
    trackSlug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 4,
    title: "المحاليل المائية وخواصها",
    titleAr: "المحاليل المائية وخواصها",
    titleEn: "Aqueous Solutions and Their Properties",
    summary:
      "المحلول المائي مخلوط متجانس يذوب فيه المذاب داخل الماء كمذيب؛ وتتغير خواصه الجمعية تبعًا لتركيز الجسيمات المذابة (انخفاض الضغط البخاري ودرجة التجمد، وارتفاع درجة الغليان، والضغط الأسموزي)، كما يحدد العمق والتركيز نفاذ الضوء في البيئات المائية.",
    formulaOrRule: "زيادة تركيز الجسيمات المذابة ← ↓ الضغط البخاري | ↓ درجة التجمد | ↑ درجة الغليان | ↑ الضغط الأسموزي",
    keyConcepts: [
      {
        id: "sci-sol-ar-1",
        title: "الخواص الجمعية والتصنيف حسب التشبع",
        body: "ترتفع درجة غليان المحلول الملحي عن 100°C وتنخفض درجة تجمده عن 0°C لأن جسيمات المذاب تعيق هروب جزيئات الماء للبخر وانتظامها في بلورات الجليد. كما ينقسم المحلول إلى غير مشبع ومشبع وفوق مشبع.",
        formulaOrRule: "تعتمد الخواص الجمعية على عدد مولات الجسيمات المذابة لا على نوعها الكيميائي وحده",
        example: "ذوبان مول واحد من NaCl يعطي ضعف عدد الجسيمات تقريبًا (Na+ و Cl−) مقارنة بمول واحد من السكر C6H12O6."
      },
      {
        id: "sci-sol-ar-2",
        title: "الأسموزية ونفاذ الإشعاع الشمسي",
        body: "ينتقل الماء عبر الغشاء شبه المنفذ بالأسموزية من المحلول الأقل تركيزًا للمذاب (الأعلى جهدًا مائيًا) نحو المحلول الأعلى تركيزًا للمذاب. وفي المحيطات تمتص طبقات الماء الأطوال الموجية الحمراء أولًا بينما يتعمق الأزرق أكثر لتغذية التمثيل الضوئي.",
        example: "عند وضع خلية نباتية في محلول ملحي مركز يندفع الماء خارج الخلية فتنكمش (بلزمة)."
      }
    ],
    workedExamples: [
      {
        problem: "لماذا يتجمد ماء البحر عند درجة حرارة أقل من 0°C بينما يتجمد الماء المقطر عند 0°C؟",
        steps: [
          "1) ماء البحر يحتوي أيونات أملاح ذائبة تتداخل مع جزيئات الماء.",
          "2) تعيق هذه الأيونات اصطفاف جزيئات الماء في الشبكة البلورية المنتظمة للثلج.",
          "3) لذلك يلزم تبريد أشد (تحت الصفر المئوي) للوصول إلى حالة التجمد — وهو ما يُعرف بانخفاض درجة التجمد."
        ],
        takeaway: "الأملاح المذابة تُوسّع مدى الحالة السائلة للماء بخفض التجمد ورفع الغليان."
      }
    ],
    commonMistakes: [
      "عكس اتجاه الأسموزية: الماء ينتقل إلى المنطقة الأعلى تركيزًا بالمذاب وليس العكس.",
      "نسيان أن NaCl يتفكك إلى أيونين فيرفع الخواص الجمعية أكثر من السكر المتماثل في المولارية."
    ],
    questions: [
      {
        id: "pack-q-sci-ar-4a",
        question_type: "multiple-choice",
        prompt: "في أي اتجاه ينتقل الماء عبر غشاء شبه منفذ أثناء الخاصية الأسموزية؟",
        choices: [
          "من المحلول الأقل تركيزًا للمذاب إلى المحلول الأعلى تركيزًا للمذاب",
          "من المحلول الأعلى تركيزًا للمذاب إلى المحلول الأقل تركيزًا للمذاب",
          "ينتقل المذاب وحده دائمًا ويتوقف الماء",
          "يتحرك من الملح إلى الماء المقطر"
        ],
        correct_index: 0,
        explanation: "الأسموزية هي انتشار جزيئات المذيب (الماء) من الوسط المخفف ذي الجهد المائي الأعلى إلى الوسط المركز لتخفيفه.",
        hint: "تذكر: الماء يسعى لمعادلة التركيز فيذهب نحو الجانب «الأكثر عطشًا» بالملح أو السكر.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-ar-4b",
        question_type: "multiple-choice",
        prompt: "ماذا يحدث لدرجة الغليان والضغط البخاري عند إذابة كمية ملح في ماء نقي؟",
        choices: [
          "تزداد درجة الغليان وينخفض الضغط البخاري",
          "تنخفض درجة الغليان ويرتفع الضغط البخاري",
          "ينخفض كل من درجة الغليان ودرجة التجمد",
          "تبقى كل الخواص دون تغير"
        ],
        correct_index: 0,
        explanation: "تقلل جسيمات المذاب عدد جزيئات الماء على السطح القادرة على التبخر فينخفض الضغط البخاري وتحتاج طاقة أعلى للغليان.",
        hint: "الأملاح تصعّب هروب جزيئات الماء على هيئة بخار.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-ar-4c",
        question_type: "multiple-choice",
        prompt: "أي الألوان الضوئية يُمتص سريعًا في الطبقات السطحية الضحلة من البحار، وأيها يتغلغل لأعماق أكبر؟",
        choices: [
          "يُمتص الأحمر سريعًا ويتغلغل الأزرق والأخضر إلى أعماق أكبر",
          "يُمتص البنفسجي أولًا بينما يصل الأحمر إلى القاع السحيق",
          "تُمتص كل الألوان عند أول 5 سم من السطح",
          "ينفذ الأشعة تحت الحمراء دون امتصاص"
        ],
        correct_index: 0,
        explanation: "الأطوال الموجية الطويلة كالأحمر وتحت الحمراء تُمتص قرب السطح، بينما تنفذ الأطوال الأقصر كالأزرق لعمق أكبر في المنطقة المضيئة.",
        hint: "لماذا تبدو أعماق البحر بلون أزرق بينما لا ينمو العشب الأخضر إلا قرب السطح؟",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "الخواص الجمعية للمحلول المائي", back: "انخفاض الضغط البخاري، ارتفاع درجة الغليان، انخفاض درجة التجمد، وزيادة الضغط الأسموزي بزيادة تركيز الجسيمات." },
      { front: "اتجاه الخاصية الأسموزية", back: "انتقال جزيئات الماء عبر غشاء شبه منفذ من الأقل تركيزًا للمذاب إلى الأعلى تركيزًا للمذاب." },
      { front: "الفرق بين محلول مشبع وغير مشبع", back: "المشبع استوعب أقصى كمية مذاب ممكنة عند تلك الحرارة؛ غير المشبع لا يزال قادرًا على إذابة كمية إضافية." }
    ]
  },
  {
    id: "pack-sci-ar-5",
    lessonSlug: "sci-biological-water",
    trackSlug: "integrated-science-ar",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 5,
    title: "الأهمية الحيوية للماء",
    titleAr: "الأهمية الحيوية للماء",
    titleEn: "The Biological Importance of Water",
    summary:
      "يعمل الماء كمذيب عام وناقل للمغذيات والفضلات ووسط للتفاعلات الأيضية ومنظم لحرارة الجسم؛ كما تتكيف الكائنات الحية (أوليات النواة وحقيقيات النواة وأسماك المياه العذبة مقابل المالحة) مع التحديات الأسموزية للحفاظ على اتزانها المائي.",
    formulaOrRule: "4 أدوار حيوية: مذيب + ناقل + وسط أيضي (تحلل مائي) + منظم حراري | عذبة: تطرد الماء الزائد، مالحة: تعوّض فقد الماء",
    keyConcepts: [
      {
        id: "sci-bio-ar-1",
        title: "الوظائف الحيوية الأربع وتنظيم الأسموزية",
        body: "يشارك الماء في التفاعلات الإنزيمية كالتحلل المائي وينقل الغذاء والأكسجين في الدم ويبرد الجسم بالتعرق والنتح. وتواجه كائنات المياه العذبة دخول الماء باستمرار بالأسموزية فتتخلص منه بالفجوات المنقبضة أو بإدرار بول مخفف.",
        example: "الأميبا في البرك العذبة تضخ الماء الفائض دوريًا عبر الفجوة المنقبضة كي لا تنفجر."
      },
      {
        id: "sci-bio-ar-2",
        title: "تكيف الأسماك البحرية والفرق الخلوي",
        body: "الأسماك العظمية البحرية تفقد ماء جسمها نحو البحر المالح فتعوضه بشرب ماء البحر وطرح الأملاح الزائدة عبر خلايا خاصة في الخياشيم وإفراز بول قليل مركز؛ بينما تحتفظ أسماك القرش باليوريا لرفع ضغطها الأسموزي الداخلي ومقاربته للبحر.",
        example: "حقيقيات النواة تمتلك نواة محاطة بغلاف نووي وعضيات غشائية بعكس بدائيات النواة."
      }
    ],
    workedExamples: [
      {
        problem: "قارن بين تكيف سمكة مياه عذبة وسمكة عظمية بحرية في الحفاظ على اتزان الماء والأملاح.",
        steps: [
          "1) سمكة المياه العذبة: تركيز أملاح جسمها أعلى من النهر، فينفذ الماء إلى جسمها؛ لذلك لا تشرب ماءً كثيرًا، وتفرز بولًا وفيرًا مخففًا وتمتص الأملاح بالخياشيم.",
          "2) السمكة العظمية البحرية: ملوحة البحر أعلى من جسمها فيخرج الماء منها بالأسموزية؛ لذلك تشرب ماء البحر، وتطرد الأملاح الزائدة بالخياشيم، وتفرز بولًا شحيحًا مركزًا."
        ],
        takeaway: "الأسموزية تسحب الماء دومًا إلى الجانب الأكثر ملوحة، والتكيف الحيوي يعاكس ذلك للحفاظ على الاتزان الداخلي."
      }
    ],
    commonMistakes: [
      "عكس آلية البول: أسماك المياه العذبة تخرج بولًا وفيرًا مخففًا لطرد الماء الزائد، أما البحرية العظمية فتخرج بولًا قليلًا."
    ],
    questions: [
      {
        id: "pack-q-sci-ar-5a",
        question_type: "multiple-choice",
        prompt: "كيف تتجنب الأوليات وحيدة الخلية كالأميبا الانفجار عند معيشتها في الماء العذب؟",
        choices: [
          "بضخ الماء الزائد للخارج دوريًا عبر الفجوة المنقبضة",
          "بشرب كميات كبيرة من الماء لتعادل التركيز",
          "بتجمد السيتوبلازم داخليًا",
          "بطرد البروتينات خارج الغشاء البلازمي"
        ],
        correct_index: 0,
        explanation: "تدفع الفجوة المنقبضة الماء الذي يتسلل أسموزيًا للداخل إلى خارج الخلية باستمرار باستخدام طاقة ATP.",
        hint: "ما العضية المسؤولة عن الإخراج المائي في الأميبا؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-ar-5b",
        question_type: "multiple-choice",
        prompt: "أي العبارات يصف تكيف سمكة عظمية تعيش في مياه البحر المالحة؟",
        choices: [
          "تشرب ماء البحر، تطرح الأملاح بالخياشيم، وتفرز بولًا شحيحًا",
          "لا تشرب الماء وتفرز كميات ضخمة من البول المخفف",
          "تمتص الأملاح الزائدة من البحر عبر الجلد",
          "تتخلص من الماء الزائد عبر فجوة منقبضة"
        ],
        correct_index: 0,
        explanation: "تتعرض السمكة البحرية لفقد الماء بالخاصية الأسموزية، فتعوّضه بشرب ماء البحر وطرح فائض الملح بالخياشيم وتقليل فقد الماء في البول.",
        hint: "البيئة البحرية أعلى ملوحة من سوائل الجسم، فالسمكة تفقد الماء لا تكتسبه.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-ar-5c",
        question_type: "multiple-choice",
        prompt: "بماذا تتميز الخلايا حقيقية النواة عن الخلايا بدائية النواة؟",
        choices: [
          "وجود نواة محاطة بغلاف نووي وعضيات محاطة بأغشية مثل الميتوكوندريا",
          "خلوها من المادة الوراثية DNA",
          "غياب الغشاء البلازمي المحيط بالخلية",
          "عدم احتوائها على ماء سيتوبلازمي"
        ],
        correct_index: 0,
        explanation: "بدائيات النواة كالبكتيريا تفتقر للغلاف النووي والعضيات الغشائية، بينما حقيقيات النواة تنظم مادتها الوراثية داخل نواة محاطة بغشاء.",
        hint: "كلمة «حقيقية النواة» تعني وجود غشاء نووي واضح.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "الوظائف الحيوية للماء", back: "مذيب قطبي، ناقل في الدم والعصارة، وسط للتفاعلات الإنزيمية والتحلل المائي، ومنظم حراري." },
      { front: "التكيف الأسموزي: مياه عذبة مقابل مالحة", back: "عذبة: فجوة منقبضة / بول وفير مخفف؛ مالحة عظمية: تشرب ماءً، تطرد ملحًا بالخياشيم، وتخرج بولًا قليلًا." },
      { front: "استراتيجية أسماك القرش البحرية", back: "ترفع تركيز اليوريا في دمائها ليتوازن ضغطها الأسموزي مع ماء البحر فتقلل فقدان الماء." }
    ]
  },

  // =========================================================================
  // 1B. INTEGRATED SCIENCE — ENGLISH TRACK (5 EXACT LESSONS)
  // =========================================================================
  {
    id: "pack-sci-en-1",
    lessonSlug: "sci-hydrosphere",
    trackSlug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 1,
    title: "The Hydrosphere on Earth",
    titleAr: "الغلاف المائي على الأرض",
    titleEn: "The Hydrosphere on Earth",
    summary:
      "Water covers about 70.7% of Earth's surface (~97% saline oceans and only ~3% freshwater, mostly locked in glaciers and groundwater) and circulates continuously through evaporation, transpiration, condensation, precipitation, runoff, and infiltration.",
    formulaOrRule: "Surface water ≈ 70.7% | 97% Saltwater : 3% Freshwater | Hydrologic Cycle = Solar-driven closed mass loop",
    keyConcepts: [
      {
        id: "sci-hydro-en-1",
        title: "Water Distribution & Ecosystem Interactions",
        body: "Aquatic ecosystems unite biotic factors (producers, consumers, decomposers) and abiotic factors (dissolved salts, temperature, light, pH) across oceans, estuaries, rivers, lakes, and aquifers.",
        formulaOrRule: "Available surface freshwater is a tiny fraction of the 3% global freshwater total",
        example: "Preserving Nile freshwater prevents aquifer depletion and protects food webs."
      },
      {
        id: "sci-hydro-en-2",
        title: "The Hydrologic Cycle & Transpiration",
        body: "Solar energy drives evaporation from open surfaces and biological transpiration from plant stomata; vapor condenses into clouds and returns via precipitation to feed runoff and groundwater recharge.",
        example: "Removing forest cover cuts transpiration and alters regional rainfall patterns."
      }
    ],
    workedExamples: [
      {
        problem: "Trace a raindrop landing on a vegetated hillside near a freshwater valley.",
        steps: [
          "1) Part infiltrates permeable soil to recharge groundwater aquifers or gets absorbed by plant roots.",
          "2) Plants release water vapor through stomata (transpiration), while excess rain flows as surface runoff into rivers.",
          "3) Evaporated moisture cools and condenses high in the atmosphere before falling again as precipitation."
        ],
        takeaway: "Earth's water cycle conserves total water mass while redistributing energy and purifying water naturally."
      }
    ],
    commonMistakes: [
      "Thinking most freshwater sits in visible rivers/lakes — most is locked in polar ice caps and deep groundwater.",
      "Omitting plant transpiration and subsurface infiltration when sketching the hydrologic cycle."
    ],
    questions: [
      {
        id: "pack-q-sci-en-1a",
        question_type: "multiple-choice",
        prompt: "Where is the largest reservoir of Earth's freshwater stored?",
        choices: [
          "Glaciers, polar ice sheets, and deep groundwater",
          "Open rivers and temperate streams",
          "Atmospheric water vapor clouds",
          "Estuarine coastal wetlands"
        ],
        correct_index: 0,
        explanation: "Roughly 3% of Earth's water is fresh, and most of that 3% is frozen in glaciers/ice sheets or held underground in aquifers.",
        hint: "Compare visible river volume against continental ice sheets.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-en-1b",
        question_type: "multiple-choice",
        prompt: "Which process transfers water vapor directly from living plants into the atmosphere?",
        choices: ["Condensation", "Transpiration", "Percolation", "Salinization"],
        correct_index: 1,
        explanation: "Transpiration is the biological evaporation of water vapor through plant leaf stomata.",
        hint: "Pick the term that links the biosphere to atmospheric moisture.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-en-1c",
        question_type: "multiple-choice",
        prompt: "Why does chemical contamination in a confined groundwater aquifer persist longer than in a fast river?",
        choices: [
          "Groundwater moves and renews extremely slowly compared with river flow",
          "Groundwater contains no H2O hydrogen bonds",
          "Sunlight evaporates aquifers completely every summer",
          "Rivers dilute all solutes instantly to zero"
        ],
        correct_index: 0,
        explanation: "Aquifer residence times can span years to centuries, meaning pollutants flush out far more slowly than in flowing surface water.",
        hint: "Think about water turnover rate in underground rock vs. a flowing stream.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Global Water Split", back: "~70.7% surface coverage; ~97% saltwater and ~3% freshwater (mostly ice caps and groundwater)." },
      { front: "Transpiration", back: "Biological release of water vapor through plant stomata, driving sap transport and cooling leaves." },
      { front: "Closed Mass / Open Energy Cycle", back: "Solar radiation powers water phase changes continuously while Earth's total water mass stays constant." }
    ]
  },
  {
    id: "pack-sci-en-2",
    lessonSlug: "sci-water-chemistry",
    trackSlug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 2,
    title: "Chemical Properties of Water",
    titleAr: "الخصائص الكيميائية للماء",
    titleEn: "Chemical Properties of Water",
    summary:
      "Each H2O molecule has two polar covalent O–H bonds bent at ~104.5°, creating partial charges (δ− on O, δ+ on H) that form intermolecular hydrogen bonds, governing water's solvent power, salt hydrolysis, and pH scale (0–14).",
    formulaOrRule: "Bond angle ≈ 104.5° | Intramolecular: Polar covalent | Intermolecular: Hydrogen bonds | pH < 7 acidic, = 7 neutral, > 7 basic",
    keyConcepts: [
      {
        id: "sci-chem-en-1",
        title: "Molecular Polarity & Hydrogen Bonding",
        body: "Oxygen's higher electronegativity pulls shared electrons closer, producing δ− on oxygen and δ+ on both hydrogens. The bent 104.5° geometry prevents dipoles from cancelling, letting adjacent molecules form hydrogen bonds.",
        formulaOrRule: "Boiling breaks intermolecular hydrogen bonds — NOT covalent O–H bonds",
        example: "Water steam is still intact H2O gas, not separated H2 and O2 gases."
      },
      {
        id: "sci-chem-en-2",
        title: "Salt Hydrolysis & the pH Scale",
        body: "Salts of strong acid + strong base (NaCl) dissolve cleanly without shifting pH (= 7), whereas NaHCO3 hydrolyzes to yield basic solutions (pH > 7) and NH4Cl yields slightly acidic solutions (pH < 7).",
        example: "pH = 4 is acidic, pH = 7 is neutral reference water, and pH = 11 is basic/alkaline."
      }
    ],
    workedExamples: [
      {
        problem: "Compare aqueous solutions with pH = 4, pH = 7, and pH = 11.",
        steps: [
          "1) pH = 4 (< 7): acidic solution with high H+ concentration.",
          "2) pH = 7 (= 7): neutral balance where [H+] equals [OH−] at standard temperature.",
          "3) pH = 11 (> 7): strongly basic (alkaline) solution."
        ],
        takeaway: "Every 1-unit drop in pH represents a 10× jump in H+ concentration."
      }
    ],
    commonMistakes: [
      "Confusing covalent O–H bonds inside one H2O molecule with weaker hydrogen bonds linking neighboring molecules.",
      "Thinking boiling decomposes water into hydrogen and oxygen gas."
    ],
    questions: [
      {
        id: "pack-q-sci-en-2a",
        question_type: "multiple-choice",
        prompt: "Which bonds are overcome when liquid water boils into steam at 100°C?",
        choices: [
          "Hydrogen bonds between neighboring H2O molecules",
          "Polar covalent bonds inside each H2O molecule",
          "Ionic attractions inside dissolved oxygen",
          "Metallic lattices between hydrogen nuclei"
        ],
        correct_index: 0,
        explanation: "Vaporization separates whole H2O molecules by breaking intermolecular hydrogen bonds while keeping covalent O–H bonds intact.",
        hint: "Is steam made of H2O molecules or split H2 and O2?",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-en-2b",
        question_type: "multiple-choice",
        prompt: "What is the approximate H–O–H bond angle in a water molecule?",
        choices: ["90°", "104.5°", "120°", "180°"],
        correct_index: 1,
        explanation: "Two lone electron pairs on oxygen compress the H–O–H angle to ~104.5°, making the molecule bent and strongly polar.",
        hint: "If it were linear (180°), the two bond dipoles would cancel.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-en-2c",
        question_type: "multiple-choice",
        prompt: "Dissolving which salt produces a neutral aqueous solution (pH ≈ 7)?",
        choices: ["Sodium chloride (NaCl)", "Sodium bicarbonate (NaHCO3)", "Ammonium chloride (NH4Cl)", "Sodium acetate (CH3COONa)"],
        correct_index: 0,
        explanation: "NaCl forms from a strong acid (HCl) and a strong base (NaOH), so neither ion hydrolyzes water to alter [H+] or [OH−].",
        hint: "Choose the salt formed from both a strong acid and a strong base.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Why is H2O a Polar Molecule?", back: "High electronegativity of oxygen (δ−) + bent 104.5° geometry leaves an uneven charge distribution." },
      { front: "Salt Hydrolysis Rules", back: "Strong acid + strong base (NaCl) → neutral pH 7; NH4Cl → acidic; NaHCO3 → basic." },
      { front: "pH Classification", back: "pH < 7 acidic | pH = 7 neutral | pH > 7 basic (each step changes [H+] by 10×)." }
    ]
  },
  {
    id: "pack-sci-en-3",
    lessonSlug: "sci-water-physics",
    trackSlug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 3,
    title: "Physical Properties of Water",
    titleAr: "الخصائص الفيزيائية للماء",
    titleEn: "Physical Properties of Water",
    summary:
      "Water reaches maximum density at 4°C so ice floats and insulates aquatic habitats below; its high specific heat capacity (~4200 J/kg·°C) stabilizes regional climates and internal body temperatures through Q = m·c·ΔT.",
    formulaOrRule: "$\\rho = \\frac{m}{V}$ | Max density at $4^\\circ\\text{C}$ ($\\approx 1000\\text{ kg/m}^3$) | $Q = m \\cdot c \\cdot \\Delta T$",
    keyConcepts: [
      {
        id: "sci-phys-en-1",
        title: "Anomalous Expansion Below 4°C & Hydrometers",
        body: "Cooling water from 4°C to 0°C locks molecules into an open hexagonal hydrogen-bonded crystal lattice, lowering ice density below liquid water. Ice floats on top while dense 4°C liquid remains unfrozen underneath.",
        formulaOrRule: "Higher liquid density → smaller submerged hydrometer depth",
        example: "A hydrometer floats higher in salty ocean water than in pure freshwater."
      },
      {
        id: "sci-phys-en-2",
        title: "Specific Heat Capacity & Thermal Buffering",
        body: "Water absorbs large heat inputs with a modest ΔT because thermal energy first disrupts intermolecular hydrogen bonds. Using Q = m·c·ΔT, heating 0.50 kg by 10°C takes 21,000 J.",
        formulaOrRule: "Q = m · c · ΔT",
        example: "Coastal cities see gentler day-night temperature swings than inland deserts."
      }
    ],
    workedExamples: [
      {
        problem: "Calculate the heat energy absorbed by 0.50 kg of water warming by 10°C (c = 4200 J/kg·°C).",
        steps: [
          "1) Identify givens: m = 0.50 kg, c = 4200 J/(kg·°C), ΔT = 10°C.",
          "2) Substitute into Q = m · c · ΔT = 0.50 × 4200 × 10.",
          "3) Result: Q = 21,000 J (21 kJ)."
        ],
        takeaway: "Convert grams to kilograms before applying c = 4200 J/(kg·°C)."
      }
    ],
    commonMistakes: [
      "Assuming water keeps contracting all the way down to 0°C — contraction reverses below 4°C.",
      "Thinking a hydrometer sinks deeper in saltier water; higher density pushes the hydrometer higher up."
    ],
    questions: [
      {
        id: "pack-q-sci-en-3a",
        question_type: "multiple-choice",
        prompt: "At what temperature does pure liquid water reach its maximum density?",
        choices: ["0°C", "4°C", "25°C", "100°C"],
        correct_index: 1,
        explanation: "At 4°C molecules pack tightly before open hexagonal hydrogen-bond frameworks expand the structure toward freezing at 0°C.",
        hint: "It is slightly above freezing, explaining why lake bottoms sit near 4°C in winter.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-en-3b",
        question_type: "multiple-choice",
        prompt: "If 1.0 kg of water (c = 4200 J/kg·°C) absorbs 42,000 J of thermal energy, what is ΔT?",
        choices: ["5°C", "10°C", "20°C", "42°C"],
        correct_index: 1,
        explanation: "ΔT = Q / (m·c) = 42,000 / (1.0 × 4200) = 10°C.",
        hint: "Rearrange Q = m·c·ΔT to solve for ΔT.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-en-3c",
        question_type: "multiple-choice",
        prompt: "A hydrometer is moved from distilled water to dense Red Sea brine at the same temperature. How does it float?",
        choices: [
          "It sinks deeper because salt weakens buoyancy",
          "It floats higher with less submerged stem because denser brine needs less displaced volume",
          "Submerged depth stays identical",
          "It sinks immediately to the seabed"
        ],
        correct_index: 1,
        explanation: "Denser liquid supports the hydrometer's weight with a smaller displaced volume, so the stem rides higher.",
        hint: "Higher fluid density yields greater buoyant force per unit displaced volume.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Maximum Density of Water", back: "At 4°C (~1000 kg/m³); below 4°C open hexagonal crystal lattices lower density so ice floats." },
      { front: "Specific Heat Formula", back: "Q = m · c · ΔT with c ≈ 4200 J/(kg·°C); drives thermal buffering in oceans and organisms." },
      { front: "Hydrometer Reading Principle", back: "Higher fluid density → less stem submerged; measures relative density quickly." }
    ]
  },
  {
    id: "pack-sci-en-4",
    lessonSlug: "sci-aqueous-solutions",
    trackSlug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 4,
    title: "Aqueous Solutions and Their Properties",
    titleAr: "المحاليل المائية وخواصها",
    titleEn: "Aqueous Solutions and Their Properties",
    summary:
      "Aqueous solutions modify water's colligative properties according to dissolved particle count (lowering vapor pressure and freezing point while raising boiling point and osmotic pressure) and filter sunlight by wavelength with ocean depth.",
    formulaOrRule: "More dissolved particles → ↓ Vapor pressure | ↓ Freezing point | ↑ Boiling point | ↑ Osmotic pressure",
    keyConcepts: [
      {
        id: "sci-sol-en-1",
        title: "Colligative Properties & Solution Saturation",
        body: "Dissolved solutes hinder water molecules escaping as vapor and forming orderly ice crystals. Solutions may be unsaturated, saturated, or supersaturated at a given temperature.",
        formulaOrRule: "1 mol NaCl → ~2 mol ions (greater colligative shift than 1 mol non-electrolyte sugar)",
        example: "Salty seawater freezes below 0°C and boils above 100°C at 1 atm."
      },
      {
        id: "sci-sol-en-2",
        title: "Osmosis & Solar Penetration in Aquatic Zones",
        body: "Through a semipermeable membrane, water moves by osmosis from lower solute concentration toward higher solute concentration. In oceans, red wavelengths attenuate quickly near the surface while blue light penetrates deeper.",
        example: "Plant cells lose turgor (plasmolysis) when placed in hypertonic brine."
      }
    ],
    workedExamples: [
      {
        problem: "Why do roads dusted with salt melt ice even slightly below 0°C?",
        steps: [
          "1) Salt dissolves in any thin surface water film, splitting into Na+ and Cl− ions.",
          "2) Solute ions disrupt ice-crystal formation, depressing the freezing point below 0°C.",
          "3) Ice melts into liquid brine unless ambient temperature falls below the depressed freezing threshold."
        ],
        takeaway: "Colligative effects depend on dissolved particle concentration regardless of particle identity."
      }
    ],
    commonMistakes: [
      "Reversing osmosis direction — solvent moves from dilute to concentrated solute regions.",
      "Forgetting ionic dissociation (e.g., NaCl yields 2 ions per formula unit) when comparing boiling/freezing shifts."
    ],
    questions: [
      {
        id: "pack-q-sci-en-4a",
        question_type: "multiple-choice",
        prompt: "In which direction does water flow across a semipermeable membrane during osmosis?",
        choices: [
          "From lower solute concentration to higher solute concentration",
          "From higher solute concentration to lower solute concentration",
          "Solute moves across while water remains stationary",
          "Equally in both directions regardless of concentration"
        ],
        correct_index: 0,
        explanation: "Water moves from the dilute side (higher water potential) to dilute the more concentrated solute side.",
        hint: "Water flows toward the saltier side.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-en-4b",
        question_type: "multiple-choice",
        prompt: "What happens when non-volatile salt dissolves in pure water at 1 atm?",
        choices: [
          "Boiling point rises and vapor pressure falls",
          "Boiling point falls and vapor pressure rises",
          "Freezing point rises above 0°C",
          "Colligative properties remain identical"
        ],
        correct_index: 0,
        explanation: "Solute particles occupy surface fractions and lower solvent chemical potential, reducing vapor pressure and raising boiling point.",
        hint: "Disrupting vapor escape requires extra heat to reach atmospheric pressure.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-en-4c",
        question_type: "multiple-choice",
        prompt: "How does solar light color penetrate downward in clear marine water?",
        choices: [
          "Red/infrared wavelengths are absorbed quickly near the surface; blue penetrates deepest",
          "Blue light stops in the top centimeter while red reaches the abyss",
          "All colors penetrate identically without attenuation",
          "Ultraviolet warms the deep seabed first"
        ],
        correct_index: 0,
        explanation: "Water absorbs longer red wavelengths quickly, leaving blue/green wavelengths in the deeper photic zone.",
        hint: "Think about why underwater photos look blue without red flash lighting.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Colligative Shifts", back: "Higher dissolved particle count lowers vapor pressure & freezing point and raises boiling point & osmotic pressure." },
      { front: "Osmosis Rule", back: "Solvent crosses semipermeable membranes from lower solute concentration toward higher solute concentration." },
      { front: "Light Penetration in Seas", back: "Red light attenuates rapidly near the surface; shorter blue wavelengths reach greater photic depths." }
    ]
  },
  {
    id: "pack-sci-en-5",
    lessonSlug: "sci-biological-water",
    trackSlug: "integrated-science-en",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 5,
    title: "The Biological Importance of Water",
    titleAr: "الأهمية الحيوية للماء",
    titleEn: "The Biological Importance of Water",
    summary:
      "Water sustains life as a universal biological solvent, nutrient/waste transporter, enzymatic reaction medium (hydrolysis), and thermal regulator; freshwater and marine organisms evolve distinct osmoregulatory adaptations to survive opposing osmotic gradients.",
    formulaOrRule: "4 Vital Roles: Solvent + Transporter + Metabolic Medium + Thermal Buffer | Freshwater: expel excess water; Marine bony fish: drink & excrete salts",
    keyConcepts: [
      {
        id: "sci-bio-en-1",
        title: "Biological Roles & Cellular Osmoregulation",
        body: "Inside prokaryotes (no membrane-bound nucleus) and eukaryotes (membrane-bound nucleus and organelles), cytoplasm stays mostly water for hydrolysis and diffusion. Freshwater protozoa expel incoming water via contractile vacuoles.",
        example: "Blood plasma dissolves nutrients and hormones while sweating removes body heat via latent heat of vaporization."
      },
      {
        id: "sci-bio-en-2",
        title: "Freshwater vs. Marine Osmotic Adaptations",
        body: "Freshwater fish gain water osmotically, avoid drinking, and produce copious dilute urine. Marine bony fish lose water to salty seawater, drink seawater, pump excess salt out via gill chloride cells, and excrete scant concentrated urine.",
        example: "Sharks retain urea to stay nearly iso-osmotic with ocean water."
      }
    ],
    workedExamples: [
      {
        problem: "Contrast how a freshwater fish and a marine bony fish maintain internal water balance.",
        steps: [
          "1) Freshwater fish (hypertonic to river): water enters across gills; fish barely drinks, excretes large dilute urine volumes, and actively absorbs ions.",
          "2) Marine bony fish (hypotonic to ocean): water exits into sea; fish drinks seawater, actively secretes salt via gill cells, and produces very little concentrated urine."
        ],
        takeaway: "Freshwater animals fight flooding; marine bony fish fight dehydration."
      }
    ],
    commonMistakes: [
      "Thinking marine bony fish produce large volumes of dilute urine — that would accelerate dehydration."
    ],
    questions: [
      {
        id: "pack-q-sci-en-5a",
        question_type: "multiple-choice",
        prompt: "How does a freshwater amoeba avoid bursting from continuous osmotic water entry?",
        choices: [
          "Pumping excess water out using a contractile vacuole",
          "Drinking extra surrounding water",
          "Solidifying its cytoplasm completely",
          "Secreting digestive proteins externally"
        ],
        correct_index: 0,
        explanation: "Contractile vacuoles actively collect excess cytoplasmic water and expel it periodically.",
        hint: "Recall the specialized water-pumping organelle in unicellular freshwater protists.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-sci-en-5b",
        question_type: "multiple-choice",
        prompt: "Which adaptation characterizes a marine bony fish living in salty ocean water?",
        choices: [
          "Drinks seawater, excretes excess salts via gills, and passes very little urine",
          "Never drinks water and passes massive volumes of dilute urine",
          "Uses a contractile vacuole in muscle fibers",
          "Absorbs ocean salts through fins to stay diluted"
        ],
        correct_index: 0,
        explanation: "Because seawater pulls water outward osmotically, marine bony fish replenish fluid by drinking and remove excess ions through gills while conserving urine water.",
        hint: "Seawater is hypertonic relative to marine bony fish tissues.",
        difficulty: "standard"
      },
      {
        id: "pack-q-sci-en-5c",
        question_type: "multiple-choice",
        prompt: "Which structural feature distinguishes eukaryotic cells from prokaryotic cells?",
        choices: [
          "A true membrane-bound nucleus and membrane-bound organelles",
          "Complete absence of genetic material (DNA)",
          "Lack of a plasma membrane",
          "Absence of water in the cytoplasm"
        ],
        correct_index: 0,
        explanation: "Eukaryotes enclose DNA inside a nuclear envelope and organize metabolism in membrane-bound organelles.",
        hint: "Think about the root meaning of eu-karyon ('true kernel/nucleus').",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "Four Biological Roles of Water", back: "Solvent, transport medium (blood/sap), metabolic reactant/medium (hydrolysis), and thermal regulator." },
      { front: "Freshwater vs. Marine Bony Fish", back: "Freshwater: gains water → abundant dilute urine; Marine bony: loses water → drinks seawater, pumps salts via gills, scant urine." },
      { front: "Prokaryote vs. Eukaryote", back: "Prokaryotes lack a nuclear envelope and membrane-bound organelles; eukaryotes possess both." }
    ]
  },

  // =========================================================================
  // 2A. MATHEMATICS — ARABIC TRACK (ALL 5 EXACT LESSONS)
  // =========================================================================
  {
    id: "pack-math-ar-1",
    lessonSlug: "math-complex-intro",
    trackSlug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    position: 1,
    title: "مقدمة عن الأعداد المركبة",
    titleAr: "مقدمة عن الأعداد المركبة",
    titleEn: "Introduction to Complex Numbers",
    summary:
      "تُعرّف الوحدة التخيلية ت (i) بحيث ت² = −1 لحل معادلات مثل س² + 1 = 0؛ وتتكرر قوى ت دوريًا كل 4 (ت¹ = ت، ت² = −1، ت³ = −ت، ت⁴ = 1)، ويكتب العدد المركب ع = أ + ب ت حيث يتساوى عددان مركبان بتساوي الحقيقي مع الحقيقي والتخيلي مع التخيلي.",
    formulaOrRule: "ت² = −1 | ت^(4ك+ر) = ت^ر | مرافق (أ + ب ت) هو (أ − ب ت) وجمعهما 2أ وضربهما أ² + ب²",
    keyConcepts: [
      {
        id: "math-cx-ar-1",
        title: "تبسيط قوى ت والجذور السالبة",
        body: "لتبسيط ت^ن نقسم ن على 4 ونأخذ الباقي: 0 ← 1، 1 ← ت، 2 ← −1، 3 ← −ت. أما الجذر التربيعي لعدد سالب فيُكتب √(−أ) = √أ · ت قبل أي عملية ضرب.",
        formulaOrRule: "√(−أ) = √أ · ت أولًا! (لا تضرب سالبًا في سالب تحت جذر واحد مباشرة)",
        example: "ت²⁷ ← 27 ÷ 4 الباقي 3 ← ت³ = −ت؛ بينما √(−4) × √(−9) = (2ت)(3ت) = 6ت² = −6."
      },
      {
        id: "math-cx-ar-2",
        title: "تساوي الأعداد المركبة والمرافق",
        body: "إذا كان أ + ب ت = ج + د ت (حيث أ، ب، ج، د أعداد حقيقية) فإن أ = ج و ب = د. وللتخلص من ت في المقام نضرب البسط والمقام في مرافق المقام.",
        formulaOrRule: "(أ + ب ت)(أ − ب ت) = أ² + ب² (عدد حقيقي موجب دائمًا إذا أ، ب ≠ 0)",
        example: "إذا كان (2س − 1) + (ص + 3)ت = 5 − 2ت ← س = 3، ص = −5."
      }
    ],
    workedExamples: [
      {
        problem: "بسّط المقدار: (1 + ت)^4 + √(−4) × √(−9).",
        steps: [
          "1) (1 + ت)² = 1 + 2ت + ت² = 2ت ← إذن (1 + ت)^4 = (2ت)² = 4ت² = −4.",
          "2) حوّل كل جذر سالب أولًا: √(−4) = 2ت، و√(−9) = 3ت.",
          "3) اضربهما: (2ت)(3ت) = 6ت² = −6.",
          "4) المجموع = −4 + (−6) = −10."
        ],
        takeaway: "تجنب خطأ √(−4)×√(−9) = √36 = +6؛ حوّل الجذور السالبة بدلالة ت أولًا."
      }
    ],
    commonMistakes: [
      "الخطأ الشائع: √(−أ) × √(−ب) ≠ +√(أب)، بل = √أ ت × √ب ت = −√(أب).",
      "الخلط بين المعكوس الجمعي (تغيير إشارتي أ و ب) والمرافق (تغيير إشارة الجزء التخيلي ب فقط)."
    ],
    questions: [
      {
        id: "pack-q-math-ar-1a",
        question_type: "multiple-choice",
        prompt: "ما أبسط قيمة للمقدار ت⁴³؟",
        choices: ["1", "−1", "ت", "−ت"],
        correct_index: 3,
        explanation: "بقسمة 43 على 4 يكون الباقي 3، لذا ت⁴³ = ت³ = −ت.",
        hint: "اقسم الأس على 4 واستخدم باقي القسمة (1 ← ت، 2 ← −1، 3 ← −ت، 0 ← 1).",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-ar-1b",
        question_type: "multiple-choice",
        prompt: "ما ناتج √(−16) × √(−25) في أبسط صورة؟",
        choices: ["20", "−20", "20ت", "−20ت"],
        correct_index: 1,
        explanation: "√(−16) = 4ت و√(−25) = 5ت، وبضربهما ينتج 20ت² = 20(−1) = −20.",
        hint: "اكتب كل جذر على صورة (عدد حقيقي × ت) قبل الضرب.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-ar-1c",
        question_type: "multiple-choice",
        prompt: "إذا كان (س + 2ص ت) = 3 + 8ت حيث س، ص ∈ ℝ، فما قيمة س + ص؟",
        choices: ["7", "5", "11", "−1"],
        correct_index: 0,
        explanation: "بتساوي الحقيقي بالتخيلي: س = 3، و2ص = 8 ← ص = 4؛ إذن س + ص = 3 + 4 = 7.",
        hint: "ساوي الجزء الحقيقي بالحقيقي، ومعامل ت بمعامل ت.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "دورة قوى الوحدة التخيلية ت", back: "ت¹ = ت | ت² = −1 | ت³ = −ت | ت⁴ = 1 (اقسم الأس على 4 وخذ الباقي)." },
      { front: "ضرب الجذور التربيعية السالبة", back: "√(−أ) × √(−ب) = (√أ · ت)(√ب · ت) = −√(أب) وليس موجبًا." },
      { front: "مرافق العدد المركب أ + ب ت", back: "هو أ − ب ت؛ وحاصل ضرب العدد في مرافقه = أ² + ب² (عدد حقيقي دائمًا)." }
    ]
  },
  {
    id: "pack-math-ar-2",
    lessonSlug: "math-nature-of-roots",
    trackSlug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    position: 2,
    title: "تحديد نوع جذري المعادلة التربيعية",
    titleAr: "تحديد نوع جذري المعادلة التربيعية",
    titleEn: "Determining the Nature of the Roots of a Quadratic Equation",
    summary:
      "للمعادلة أ س² + ب س + ج = 0 (أ ≠ 0) ومعاملاتها حقيقية: تحدد إشارة المميز Δ = ب² − 4أج نوع الجذرين دون حلهما؛ Δ > 0 جذران حقيقيان مختلفان، Δ = 0 جذران حقيقيان متساويان، Δ < 0 جذران مركبان غير حقيقيين مترافقان.",
    formulaOrRule: "Δ = ب² − 4أج | حقيقيان ← Δ ≥ 0 | مختلفان ← Δ > 0 | متساويان ← Δ = 0 | غير حقيقيين ← Δ < 0",
    keyConcepts: [
      {
        id: "math-disc-ar-1",
        title: "حالات المميز الثلاثة (والتنبيه على Δ ≥ 0)",
        body: "عند سؤال «للجذرين قيمة حقيقية» دون تحديد اختلافهما نستخدم الشرط المشترك Δ ≥ 0. أما إذا طُلب «جذران حقيقيان مختلفان» فنلتزم Δ > 0 فقط.",
        formulaOrRule: "جذر مكرر عند Δ = 0 يساوي س = −ب / (2أ)",
        example: "المعادلة س² − 6س + 9 = 0 مميزها 36 − 36 = 0 ← جذران حقيقيان متساويان = 3."
      }
    ],
    workedExamples: [
      {
        problem: "أوجد قيم ك الحقيقية التي تجعل للمعادلة س² − 4س + ك = 0 جذرين حقيقيين مختلفين.",
        steps: [
          "1) استخرج المعاملات بعد الصفرية: أ = 1، ب = −4، ج = ك.",
          "2) شرط جذرين حقيقيين مختلفين: Δ > 0 ⇐ (−4)² − 4(1)(ك) > 0.",
          "3) 16 − 4ك > 0 ⇐ 4ك < 16 ⇐ ك < 4، أي ك ∈ (−∞, 4)."
        ],
        takeaway: "رتب المعادلة أولًا لتصبح صفرية قبل تعيين أ و ب و ج، وتذكر علامة التباين (> أم ≥)."
      }
    ],
    commonMistakes: [
      "استخدام Δ > 0 بدلًا من Δ ≥ 0 عند قول «جذران حقيقيان» دون كلمة «مختلفان».",
      "أخذ ب بإشارة خاطئة عند التعويض في ب² − 4أج قبل تصفير المعادلة."
    ],
    questions: [
      {
        id: "pack-q-math-ar-2a",
        question_type: "multiple-choice",
        prompt: "ما نوع جذري المعادلة 2س² − 3س + 5 = 0؟",
        choices: [
          "مركبان غير حقيقيين مترافقان",
          "حقيقيان مختلفان",
          "حقيقيان متساويان",
          "جذر حقيقي واحد فقط صفري"
        ],
        correct_index: 0,
        explanation: "المميز Δ = (−3)² − 4(2)(5) = 9 − 40 = −31 < 0، وبما أن المعاملات حقيقية فالجذران مركبان مترافقان غير حقيقيين.",
        hint: "احسب ب² − 4أج وتحقق من إشارته.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-ar-2b",
        question_type: "multiple-choice",
        prompt: "إذا كان جذرا المعادلة س² + م س + 9 = 0 حقيقيين متساويين، فما قيم م الممكنة؟",
        choices: ["6 فقط", "±6", "±3", "9 فقط"],
        correct_index: 1,
        explanation: "Δ = م² − 4(1)(9) = 0 ← م² = 36 ← م = +6 أو −6.",
        hint: "لا تنس الجذر السالب عند حل م² = 36.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-ar-2c",
        question_type: "multiple-choice",
        prompt: "ما الشرط الصحيح للمميز إذا كان للمعادلة س² + ب س + ج = 0 «جذران حقيقيان» (دون تحديد اختلافهما)؟",
        choices: ["Δ > 0", "Δ ≥ 0", "Δ < 0", "Δ = 0 فقط"],
        correct_index: 1,
        explanation: "عبارة «جذران حقيقيان» تشمل حالتي الاختلاف (Δ > 0) والتساوي (Δ = 0)، أي Δ ≥ 0.",
        hint: "هل الجذران المتساويان أعداد حقيقية أيضًا؟",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "حالات المميز Δ = ب² − 4أج", back: "Δ > 0 حقيقيان مختلفان | Δ = 0 حقيقيان متساويان | Δ < 0 مركبان غير حقيقيين | Δ ≥ 0 حقيقيان عمومًا." },
      { front: "شرط المعادلة ذات المعاملات النسبية", back: "إذا كان Δ مربعًا كاملًا (مثل 0, 1, 4, 9, 25...) فالجذران نسبيان." }
    ]
  },
  {
    id: "pack-math-ar-3",
    lessonSlug: "math-roots-coefficients",
    trackSlug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    position: 3,
    title: "العلاقة بين جذري المعادلة التربيعية ومعاملات حدودها",
    titleAr: "العلاقة بين جذري المعادلة التربيعية ومعاملات حدودها",
    titleEn: "The Relation Between Roots and Coefficients",
    summary:
      "إذا كان ل، م جذري المعادلة أ س² + ب س + ج = 0 فإن مجموع الجذرين ل + م = −ب/أ وحاصل ضربهما ل·م = ج/أ، وتُبنى أي معادلة تربيعية من جذريها بالصيغة س² − (مجموع الجذرين)س + حاصل ضربهما = 0.",
    formulaOrRule: "ل + م = −ب/أ | ل م = ج/أ | ل² + م² = (ل+م)² − 2ل م | س² − (المجموع)س + الضرب = 0",
    keyConcepts: [
      {
        id: "math-vieta-ar-1",
        title: "المتطابقات التماثلية والتكوين العكسي",
        body: "نُعبّر عن التعابير المتماثلة بدلالة (ل + م) و(ل م) مثل 1/ل + 1/م = (ل + م)/(ل م)، و(ل − م)² = (ل + م)² − 4ل م، ومعكوس جمعي للآخر يعني ب = 0، ومعكوس ضربي للآخر يعني أ = ج.",
        formulaOrRule: "أحد الجذرين معكوس جمعي للآخر ← ب = 0 | معكوس ضربي ← أ = ج",
        example: "للمعادلة 2س² − 8س + 6 = 0: ل + م = 8/2 = 4، ول·م = 6/2 = 3."
      }
    ],
    workedExamples: [
      {
        problem: "إذا كان ل، م جذري المعادلة س² − 5س + 3 = 0، كوّن المعادلة التي جذراها ل²، م².",
        steps: [
          "1) من المعادلة الأصلية: ل + م = 5، و ل م = 3.",
          "2) مجموع الجذرين الجديدين = ل² + م² = (ل + م)² − 2ل م = 25 − 6 = 19.",
          "3) حاصل ضرب الجذرين الجديدين = ل² م² = (ل م)² = 3² = 9.",
          "4) المعادلة المطلوبة: س² − 19س + 9 = 0."
        ],
        takeaway: "تحقق دائمًا من إشارة السالب أمام (المجموع × س) في صيغة تكوين المعادلة."
      }
    ],
    commonMistakes: [
      "نسيان الإشارة السالبة في (−ب/أ) لمجموع الجذرين، أو نسيان القسمة على أ عندما أ ≠ 1.",
      "الظن بأن أ² − ب² يساوي (أ − ب)² — التوسيع الصحيح: ل² + م² = (ل + م)² − 2ل م."
    ],
    questions: [
      {
        id: "pack-q-math-ar-3a",
        question_type: "multiple-choice",
        prompt: "إذا كان أحد جذري المعادلة 3س² + (ك − 4)س − 6 = 0 معكوسًا جمعيًا للآخر، فما قيمة ك؟",
        choices: ["4", "−4", "3", "−6"],
        correct_index: 0,
        explanation: "لكي يكون أحد الجذرين معكوسًا جمعيًا للآخر يجب أن يكون مجموع الجذرين = 0 ⇐ ب = 0 ⇐ ك − 4 = 0 ⇐ ك = 4.",
        hint: "مجموع العدد ومعكوسه الجمعي يساوي صفرًا.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-ar-3b",
        question_type: "multiple-choice",
        prompt: "ما المعادلة التربيعية التي جذراها (3 + ت) و (3 − ت)؟",
        choices: ["س² − 6س + 10 = 0", "س² + 6س + 10 = 0", "س² − 6س + 8 = 0", "س² − 10س + 6 = 0"],
        correct_index: 0,
        explanation: "المجموع = (3+ت) + (3−ت) = 6، والضرب = 3² + 1² = 10، فالمعادلة س² − 6س + 10 = 0.",
        hint: "احسب أولًا المجموع ثم الضرب ثم عوض في س² − (المجموع)س + الضرب = 0.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-ar-3c",
        question_type: "multiple-choice",
        prompt: "إذا كان ل، م جذري المعادلة س² − 7س + 5 = 0، فما قيمة (1/ل) + (1/م)؟",
        choices: ["7/5", "5/7", "−7/5", "12/5"],
        correct_index: 0,
        explanation: "(1/ل) + (1/م) = (ل + م) / (ل م) = 7 / 5.",
        hint: "وحّد المقامين لتحصل على المجموع في البسط وحاصل الضرب في المقام.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "مجموع وحاصل ضرب الجذرين", back: "ل + م = −ب/أ ، ل·م = ج/أ بشرط كتابة المعادلة على الصورة أ س² + ب س + ج = 0." },
      { front: "حالتان خاصتان للمعاملات", back: "معكوس جمعي ← ب = 0 | معكوس ضربي ← أ = ج." },
      { front: "المتطابقة الذهبية ل² + م²", back: "ل² + م² = (ل + م)² − 2 ل م." }
    ]
  },
  {
    id: "pack-math-ar-4",
    lessonSlug: "math-sign-of-quadratic",
    trackSlug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    position: 4,
    title: "إشارة الدالة التربيعية",
    titleAr: "إشارة الدالة التربيعية",
    titleEn: "The Sign of a Quadratic Function",
    summary:
      "تتحدد إشارة الدالة د(س) = أ س² + ب س + ج بحسب مميزها ومعاملها الرئيسي أ: عندما Δ > 0 تخالف إشارة أ بين الجذرين وتوافقها خارجهما؛ وعندما Δ = 0 توافق أ في ℝ ما عدا الجذر؛ وعندما Δ < 0 توافق أ دائمًا على كل ℝ.",
    formulaOrRule: "Δ > 0: خارج الجذرين (نفس أ) | بينهما (عكس أ) | عند الجذرين = 0 ••• Δ ≤ 0: نفس إشارة أ دائمًا (تساوي 0 عند الجذر إن وجد)",
    keyConcepts: [
      {
        id: "math-sign-ar-1",
        title: "جدول الإشارات على خط الأعداد",
        body: "1) احسب المميز Δ أو حلل د(س) إلى جذرين ل < م. 2) إذا وُجد جذران مختلفان فالإشارة خارج [ل، م] مطابقة لإشارة معامل س² (أ)، وبين (ل، م) معاكسة لإشارة أ. 3) إذا انعدم أو سالب المميز فالقطع المكافئ لا يعبر محور السينات.",
        formulaOrRule: "عندما أ < 0 تنعكس الإشارة فتصبح الدالة موجبة بين الجذرين وسالبة خارجهما!",
        example: "الدالة د(س) = س² + 4 مميزها سالب ومعامل س² موجب ← د(س) > 0 لجميع س ∈ ℝ."
      }
    ],
    workedExamples: [
      {
        problem: "ابحث إشارة الدالة د(س) = −س² + 2س + 8.",
        steps: [
          "1) نحل −س² + 2س + 8 = 0 ⇐ س² − 2س − 8 = 0 ⇐ (س − 4)(س + 2) = 0 ⇐ الجذران −2 و 4.",
          "2) نلاحظ أن معامل س² الأصلي في الدالة هو أ = −1 (سالب).",
          "3) إذن تخالف أ (موجبة > 0) في الفترة المفتوحة (−2, 4)، وتنعدم عند {−2, 4}، وتوافق أ (سالبة < 0) في ℝ − [−2, 4]."
        ],
        takeaway: "احتفظ بإشارة المعامل الرئيسي أ للدالة الأصلية حتى لو ضربت المعادلة في −1 عند إيجاد الجذور فقط."
      }
    ],
    commonMistakes: [
      "ضرب الدالة في −1 عند حساب الجذور ثم البحث بإشارة الدالة المعدلة بدلًا من د(س) الأصلية!",
      "إغلاق فترة الموجب أو السالب الصرف عند الجذرين رغم أن قيمة الدالة عند الجذرين تساوي صفرًا."
    ],
    questions: [
      {
        id: "pack-q-math-ar-4a",
        question_type: "multiple-choice",
        prompt: "متى تكون الدالة د(س) = س² − 5س + 6 سالبة تمامًا (د(س) < 0)؟",
        choices: ["س ∈ (2, 3)", "س ∈ ℝ − [2, 3]", "س ∈ [2, 3]", "س ∈ (3, ∞)"],
        correct_index: 0,
        explanation: "الجذران 2 و 3 ومعامل س² موجب، فتخالف الدالة إشارته (تصبح سالبة) بين الجذرين أي في الفترة المفتوحة (2, 3).",
        hint: "أ > 0، لذا بين الجذرين عكس أ (سالب) وفي الفترات المفتوحة.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-ar-4b",
        question_type: "multiple-choice",
        prompt: "ما إشارة الدالة د(س) = س² + 6س + 10 على مجموعة الأعداد الحقيقية ℝ؟",
        choices: [
          "موجبة دائمًا لجميع قيم س ∈ ℝ",
          "سالبة دائمًا لجميع قيم س ∈ ℝ",
          "تتغير إشارتها عند س = −3",
          "موجبة ما عدا عند س = −3 تساوي صفرًا"
        ],
        correct_index: 0,
        explanation: "المميز Δ = 36 − 40 = −4 < 0، إذن إشارة الدالة تتبع معامل س² الموجب على كل ℝ دون أصفار حقيقية.",
        hint: "احسب المميز أولًا قبل محاولة التحليل.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-ar-4c",
        question_type: "multiple-choice",
        prompt: "الدالة د(س) = 4 − س² تكون غير سالبة (د(س) ≥ 0) عندما س تنتمي إلى:",
        choices: ["[−2, 2]", "(−2, 2)", "ℝ − (−2, 2)", "(−∞, −2] ∪ [2, ∞)"],
        correct_index: 0,
        explanation: "الجذران −2 و 2 ومعامل س² سالب (−1)، فتكون موجبة في (−2, 2) وصفراً عند الطرفين، إذن ≥ 0 على [−2, 2].",
        hint: "انتبه إلى أن معامل س² سالب هنا وإشارة المتباينة تشمل الصفر (≥).",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "قاعدة إشارة التربيعية عند Δ > 0", back: "نفس إشارة أ خارج الجذرين، عكس إشارة أ بين الجذرين، وصفر عند الجذرين." },
      { front: "قاعدة إشارة التربيعية عند Δ < 0", back: "تظل دائمًا بنفس إشارة معامل س² (أ) لجميع س ∈ ℝ ولا تساوي الصفر أبدًا." }
    ]
  },
  {
    id: "pack-math-ar-5",
    lessonSlug: "math-quadratic-inequalities",
    trackSlug: "mathematics-ar",
    subject: "mathematics",
    contentLanguage: "ar",
    position: 5,
    title: "المتباينات التربيعية في متغير واحد",
    titleAr: "المتباينات التربيعية في متغير واحد",
    titleEn: "Quadratic Inequalities in One Variable",
    summary:
      "لحل متباينة تربيعية نجعل أحد طرفيها صفرًا، ثم نوجد أصفار المقدار ونحدد إشارته على خط الأعداد، ونختار الفترات المحققة للعلامة (> / < مفتوحة عند الجذور، ≥ / ≤ مغلقة عند الجذور أو مستخدمة ℝ − الفترة المكملة).",
    formulaOrRule: "1) صفّر المتباينة ← 2) أوجد الجذور ← 3) خط الأعداد ← 4) افتح () لـ > و < وأغلق [] لـ ≥ و ≤",
    keyConcepts: [
      {
        id: "math-ineq-ar-1",
        title: "خطوات الحل وترميز الفترات الدقيقة مقابل غير الدقيقة",
        body: "لا تتوقف عند إيجاد الجذور لأنها حدود فاصلة وليست مجموعة الحل. عند اختيار > 0 لـ (س−2)(س−3) نأخذ الفترتين الخارجيتين (−∞, 2) ∪ (3, ∞) أو ℝ − [2, 3]؛ وعند ≤ 0 نأخذ الفترة المغلقة [2, 3].",
        formulaOrRule: "تنبيه ضرب أو قسمة المتباينة في عدد سالب: يجب قلب علامة التباين فورًا!",
        example: "−س² + 4 ≥ 0 ⇐ س² − 4 ≤ 0 ⇐ مجموعة الحل [−2, 2]."
      }
    ],
    workedExamples: [
      {
        problem: "أوجد مجموعة حل المتباينة س² − س − 6 > 0 في ℝ.",
        steps: [
          "1) الطرف الأيسر صفري بالفعل؛ نحلل س² − س − 6 = (س − 3)(س + 2) = 0 ⇐ الجذران −2 و 3.",
          "2) معامل س² موجب، إذن المقدار موجب خارج الفترتين المفتوحتين.",
          "3) علامة > صارمة نستبعد الجذرين: م.ح = (−∞, −2) ∪ (3, ∞) = ℝ − [−2, 3]."
        ],
        takeaway: "تأكد من عدم دمج فترتين منفصلتين في فترة واحدة مغلوطة، وتحقق بأقواس الاستبعاد لـ > و <."
      }
    ],
    commonMistakes: [
      "التوقف عند إيجاد الجذور باعتبارها الحل رغم أنها نقاط الحدود فقط.",
      "نسيان استبعاد الجذرين من الحل في حالة التباين الصارم > أو <."
    ],
    questions: [
      {
        id: "pack-q-math-ar-5a",
        question_type: "multiple-choice",
        prompt: "ما مجموعة حل المتباينة (س − 1)(س + 4) < 0 في ℝ؟",
        choices: ["(−4, 1)", "[−4, 1]", "ℝ − [−4, 1]", "(−∞, −4) ∪ (1, ∞)"],
        correct_index: 0,
        explanation: "الجذران −4 و 1 ومعامل س² موجب، ولأن المطلوب < 0 (سالب تمامًا) نختار الفترة المفتوحة بين الجذرين (−4, 1).",
        hint: "الأقواس مفتوحة لأن العلامة < بدون تساوٍ.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-ar-5b",
        question_type: "multiple-choice",
        prompt: "ما مجموعة حل المتباينة س² − 5س + 6 ≥ 0 في ℝ؟",
        choices: ["ℝ − (2, 3)", "ℝ − [2, 3]", "[2, 3]", "(2, 3)"],
        correct_index: 0,
        explanation: "المطلوب ≥ 0 يشمل الصفر عند الجذرين {2, 3} بالإضافة إلى الخارج؛ استبعاد المفتوحة (2, 3) يُبقي الطرفين 2 و 3 داخل الحل.",
        hint: "تذكر: في ℝ − (2, 3) يدخل العددان 2 و 3 ضمن الحل لأننا طرحنا فترة مفتوحة فقط.",
        difficulty: "challenging"
      },
      {
        id: "pack-q-math-ar-5c",
        question_type: "multiple-choice",
        prompt: "ما مجموعة حل المتباينة س² + 1 < 0 في ℝ؟",
        choices: ["∅ (المجموعة الخالية)", "ℝ", "{−1, 1}", "(−1, 1)"],
        correct_index: 0,
        explanation: "س² + 1 ≥ 1 > 0 لجميع قيم س الحقيقية، لذا لا توجد أي قيمة حقيقية تجعله سالبًا.",
        hint: "هل يمكن لمقدار س² + 1 أن يكون سالبًا لأي عدد حقيقي؟",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "متى نستخدم ℝ − (ل، م) مقابل ℝ − [ل، م]؟", back: "لـ ≥ 0 نطرح المفتوحة ℝ − (ل، م) فيدخل الجذران؛ ولـ > 0 نطرح المغلقة ℝ − [ل، م] فيُستبعد الجذران." },
      { front: "فخ شائع في حل المتباينات", back: "إذا ضربت أو قسمت المتباينة على عدد سالب فلا تنسَ قلب اتجاه علامة التباين." }
    ]
  },

  // =========================================================================
  // 2B. MATHEMATICS — ENGLISH TRACK (ALL 5 EXACT LESSONS)
  // =========================================================================
  {
    id: "pack-math-en-1",
    lessonSlug: "math-complex-intro",
    trackSlug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    position: 1,
    title: "Introduction to Complex Numbers",
    titleAr: "مقدمة عن الأعداد المركبة",
    titleEn: "Introduction to Complex Numbers",
    summary:
      "Defined by i² = −1, complex numbers a + bi extend ℝ so equations like x² + 1 = 0 become solvable. Powers of i cycle every 4 (i, −1, −i, 1), conjugates (a − bi) rationalize denominators, and negative roots rewrite as √(−a) = i√a before multiplying.",
    formulaOrRule: "$i^2 = -1$ | $i^{4k+r} = i^r$ | $(a+bi)(a-bi) = a^2+b^2$ | $\\sqrt{-a}\\sqrt{-b} = -\\sqrt{ab}$",
    keyConcepts: [
      {
        id: "math-cx-en-1",
        title: "Cyclic Powers of i & Negative Radicals",
        body: "Divide exponent $n$ by $4$ and map remainder $r$: $0 \\to 1$, $1 \\to i$, $2 \\to -1$, $3 \\to -i$. Always extract $i$ from negative square roots before multiplying.",
        formulaOrRule: "$\\sqrt{-a} = i\\sqrt{a}$ first!",
        example: "$i^{27} = i^3 = -i$ (remainder $3 \\bmod 4$); $\\sqrt{-4}\\cdot\\sqrt{-9} = (2i)(3i) = 6i^2 = -6$."
      },
      {
        id: "math-cx-en-2",
        title: "Equality & Complex Conjugates",
        body: "For real a, b, c, d, a + bi = c + di iff a = c and b = d. Multiplying numerator and denominator by the conjugate a − bi clears imaginary terms from the denominator.",
        formulaOrRule: "Additive inverse negates BOTH parts (−a − bi); conjugate negates ONLY i (a − bi)",
        example: "If (2x − 1) + (y + 3)i = 5 − 2i then x = 3 and y = −5."
      }
    ],
    workedExamples: [
      {
        problem: "Simplify (1 + i)⁴ + √(−4) · √(−9).",
        steps: [
          "1) (1 + i)² = 1 + 2i + i² = 2i, so (1 + i)⁴ = (2i)² = 4i² = −4.",
          "2) Convert negative radicals first: √(−4) = 2i and √(−9) = 3i.",
          "3) Multiply: (2i)(3i) = 6i² = −6.",
          "4) Sum: −4 + (−6) = −10."
        ],
        takeaway: "Never multiply negative numbers directly under one square root sign."
      }
    ],
    commonMistakes: [
      "Writing √(−4)·√(−9) = √36 = +6 instead of (2i)(3i) = −6.",
      "Confusing conjugate (a − bi) with additive inverse (−a − bi)."
    ],
    questions: [
      {
        id: "pack-q-math-en-1a",
        question_type: "multiple-choice",
        prompt: "What is the simplified value of i⁴³?",
        choices: ["1", "−1", "i", "−i"],
        correct_index: 3,
        explanation: "43 divided by 4 leaves remainder 3, so i⁴³ = i³ = −i.",
        hint: "Divide the exponent by 4 and keep the remainder.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-en-1b",
        question_type: "multiple-choice",
        prompt: "Evaluate √(−16) × √(−25) in simplest form.",
        choices: ["20", "−20", "20i", "−20i"],
        correct_index: 1,
        explanation: "√(−16) = 4i and √(−25) = 5i, giving 20i² = 20(−1) = −20.",
        hint: "Convert each negative radical into i-form before multiplying.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-en-1c",
        question_type: "multiple-choice",
        prompt: "If (x + 2yi) = 3 + 8i for real x, y, what is x + y?",
        choices: ["7", "5", "11", "−1"],
        correct_index: 0,
        explanation: "Equating parts: x = 3 and 2y = 8 ⇒ y = 4, so x + y = 7.",
        hint: "Match real parts together and imaginary coefficients together.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "Powers of i Cycle", back: "i¹ = i | i² = −1 | i³ = −i | i⁴ = 1 (use exponent mod 4)." },
      { front: "Negative Square Root Trap", back: "√(−a)·√(−b) = (i√a)(i√b) = −√(ab), never +√(ab)." },
      { front: "Complex Conjugate", back: "Conjugate of a + bi is a − bi; product (a + bi)(a − bi) = a² + b²." }
    ]
  },
  {
    id: "pack-math-en-2",
    lessonSlug: "math-nature-of-roots",
    trackSlug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    position: 2,
    title: "Determining the Nature of the Roots",
    titleAr: "تحديد نوع جذري المعادلة التربيعية",
    titleEn: "Determining the Nature of the Roots of a Quadratic Equation",
    summary:
      "For ax² + bx + c = 0 (a ≠ 0) with real coefficients, the discriminant Δ = b² − 4ac classifies root nature without solving: Δ > 0 gives two distinct real roots, Δ = 0 gives two equal real roots, and Δ < 0 gives two complex conjugates.",
    formulaOrRule: "$\\Delta = b^2 - 4ac$ | Real roots: $\\Delta \\ge 0$ | Distinct real: $\\Delta > 0$ | Equal real: $\\Delta = 0$ | Complex: $\\Delta < 0$",
    keyConcepts: [
      {
        id: "math-disc-en-1",
        title: "Discriminant Classification & Δ ≥ 0",
        body: "When a question asks merely for 'real roots' without requiring distinctness, include both Δ > 0 and Δ = 0 via Δ ≥ 0. Note that equal roots share the value −b/(2a).",
        formulaOrRule: "Include Δ = 0 unless 'distinct' is explicitly specified",
        example: "x² − 6x + 9 = 0 has Δ = 36 − 36 = 0 → repeated real root 3."
      }
    ],
    workedExamples: [
      {
        problem: "Find real values of k for which x² − 4x + k = 0 has two distinct real roots.",
        steps: [
          "1) Extract coefficients in zero form: a = 1, b = −4, c = k.",
          "2) Set Δ > 0: (−4)² − 4(1)(k) > 0 ⇒ 16 − 4k > 0.",
          "3) Solve: k < 4, so k ∈ (−∞, 4)."
        ],
        takeaway: "Always rearrange to zero on one side before extracting a, b, and c."
      }
    ],
    commonMistakes: [
      "Using strict Δ > 0 when 'real roots' allows equal roots (Δ ≥ 0).",
      "Misreading sign of b or c before moving all terms to one side."
    ],
    questions: [
      {
        id: "pack-q-math-en-2a",
        question_type: "multiple-choice",
        prompt: "What is the nature of the roots of 2x² − 3x + 5 = 0?",
        choices: [
          "Two non-real complex conjugate roots",
          "Two distinct real roots",
          "Two equal real roots",
          "One zero root only"
        ],
        correct_index: 0,
        explanation: "Δ = (−3)² − 4(2)(5) = 9 − 40 = −31 < 0, yielding two non-real complex conjugate roots.",
        hint: "Compute b² − 4ac and check its sign.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-en-2b",
        question_type: "multiple-choice",
        prompt: "If x² + mx + 9 = 0 has two equal real roots, what are the possible values of m?",
        choices: ["6 only", "±6", "±3", "9 only"],
        correct_index: 1,
        explanation: "Δ = m² − 4(1)(9) = 0 ⇒ m² = 36 ⇒ m = +6 or −6.",
        hint: "Do not drop the negative root when taking ±√36.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-en-2c",
        question_type: "multiple-choice",
        prompt: "Which discriminant condition ensures ax² + bx + c = 0 has 'real roots' (not necessarily distinct)?",
        choices: ["Δ > 0", "Δ ≥ 0", "Δ < 0", "Δ = 0 only"],
        correct_index: 1,
        explanation: "Real roots encompass both distinct real roots (Δ > 0) and equal real roots (Δ = 0).",
        hint: "Are two equal real roots still real?",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Discriminant Δ = b² − 4ac", back: "Δ > 0 distinct real | Δ = 0 equal real | Δ < 0 complex conjugates | Δ ≥ 0 real in general." },
      { front: "Rational Roots Check", back: "With rational coefficients, roots are rational iff Δ is a perfect square." }
    ]
  },
  {
    id: "pack-math-en-3",
    lessonSlug: "math-roots-coefficients",
    trackSlug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    position: 3,
    title: "Relation Between Roots and Coefficients",
    titleAr: "العلاقة بين جذري المعادلة التربيعية ومعاملات حدودها",
    titleEn: "The Relation Between Roots and Coefficients",
    summary:
      "Vieta's formulas connect roots L, M of ax² + bx + c = 0 directly to coefficients: L + M = −b/a and LM = c/a. From any two new roots, build the monic quadratic x² − (Sum)x + Product = 0.",
    formulaOrRule: "$L + M = -\\frac{b}{a}$ | $LM = \\frac{c}{a}$ | $L^2 + M^2 = (L+M)^2 - 2LM$ | $x^2 - Sx + P = 0$",
    keyConcepts: [
      {
        id: "math-vieta-en-1",
        title: "Symmetric Expressions & Special Conditions",
        body: "Express L² + M², 1/L + 1/M = (L+M)/(LM), and (L−M)² = (L+M)² − 4LM using Vieta sums and products. If one root is the additive inverse of the other, b = 0; if multiplicative inverse (reciprocal), a = c.",
        formulaOrRule: "Additive inverse → b = 0 | Multiplicative inverse → a = c",
        example: "For 2x² − 8x + 6 = 0: Sum = 8/2 = 4, Product = 6/2 = 3."
      }
    ],
    workedExamples: [
      {
        problem: "If L, M are roots of x² − 5x + 3 = 0, form the quadratic whose roots are L² and M².",
        steps: [
          "1) Original Sum L + M = 5 and Product LM = 3.",
          "2) New Sum S = L² + M² = (L + M)² − 2LM = 25 − 6 = 19.",
          "3) New Product P = L²M² = (LM)² = 3² = 9.",
          "4) Equation: x² − 19x + 9 = 0."
        ],
        takeaway: "Keep the minus sign in x² − (Sum)x + Product = 0."
      }
    ],
    commonMistakes: [
      "Forgetting the negative sign in −b/a or omitting division by a when a ≠ 1.",
      "Writing L² + M² as (L + M)² without subtracting 2LM."
    ],
    questions: [
      {
        id: "pack-q-math-en-3a",
        question_type: "multiple-choice",
        prompt: "If one root of 3x² + (k − 4)x − 6 = 0 is the additive inverse of the other, find k.",
        choices: ["4", "−4", "3", "−6"],
        correct_index: 0,
        explanation: "Additive inverse roots sum to 0, forcing b = 0 ⇒ k − 4 = 0 ⇒ k = 4.",
        hint: "A number plus its additive inverse equals zero.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-en-3b",
        question_type: "multiple-choice",
        prompt: "Which quadratic equation has roots (3 + i) and (3 − i)?",
        choices: ["x² − 6x + 10 = 0", "x² + 6x + 10 = 0", "x² − 6x + 8 = 0", "x² − 10x + 6 = 0"],
        correct_index: 0,
        explanation: "Sum = 6 and Product = 3² + 1² = 10, yielding x² − 6x + 10 = 0.",
        hint: "Substitute Sum and Product into x² − Sx + P = 0.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-en-3c",
        question_type: "multiple-choice",
        prompt: "If L, M are roots of x² − 7x + 5 = 0, what is 1/L + 1/M?",
        choices: ["7/5", "5/7", "−7/5", "12/5"],
        correct_index: 0,
        explanation: "1/L + 1/M = (L + M)/(LM) = 7 / 5.",
        hint: "Put over a common denominator LM.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "Vieta's Formulas", back: "L + M = −b/a and L·M = c/a for ax² + bx + c = 0." },
      { front: "Inverse Root Shortcuts", back: "Additive inverse roots → b = 0; Multiplicative inverse roots → a = c." },
      { front: "Symmetric Sum of Squares", back: "L² + M² = (L + M)² − 2LM." }
    ]
  },
  {
    id: "pack-math-en-4",
    lessonSlug: "math-sign-of-quadratic",
    trackSlug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    position: 4,
    title: "The Sign of a Quadratic Function",
    titleAr: "إشارة الدالة التربيعية",
    titleEn: "The Sign of a Quadratic Function",
    summary:
      "The sign of f(x) = ax² + bx + c follows its discriminant Δ and leading coefficient a: for Δ > 0, f(x) opposes a between the roots and matches a outside; for Δ = 0, it matches a everywhere except zero at the double root; for Δ < 0, it always matches a on ℝ.",
    formulaOrRule: "Δ > 0: Opposite a between roots | Same as a outside | 0 at roots ••• Δ ≤ 0: Always same sign as a (0 at root if Δ = 0)",
    keyConcepts: [
      {
        id: "math-sign-en-1",
        title: "Number-Line Sign Rule",
        body: "Find roots in ascending order r1 < r2. Between (r1, r2), f(x) carries the opposite sign of a; outside [r1, r2], f(x) matches a. Always preserve the original leading sign a even if you temporarily factor out −1 to locate roots.",
        formulaOrRule: "When a < 0, the parabola opens downward: positive between roots, negative outside",
        example: "f(x) = x² + 4 has Δ < 0 and a = 1 > 0, so f(x) > 0 for all x ∈ ℝ."
      }
    ],
    workedExamples: [
      {
        problem: "Determine the sign of f(x) = −x² + 2x + 8 across ℝ.",
        steps: [
          "1) Roots of −x² + 2x + 8 = 0 are x = −2 and x = 4.",
          "2) Original leading coefficient is a = −1 < 0.",
          "3) Therefore f(x) > 0 on (−2, 4), f(x) = 0 at {−2, 4}, and f(x) < 0 on ℝ − [−2, 4]."
        ],
        takeaway: "Never confuse the sign of f(x) with the negated auxiliary equation you used to solve for roots."
      }
    ],
    commonMistakes: [
      "Multiplying by −1 to solve f(x) = 0 and accidentally reporting the flipped sign.",
      "Including roots inside strict > 0 or < 0 intervals."
    ],
    questions: [
      {
        id: "pack-q-math-en-4a",
        question_type: "multiple-choice",
        prompt: "For which values of x is f(x) = x² − 5x + 6 strictly negative (f(x) < 0)?",
        choices: ["(2, 3)", "ℝ − [2, 3]", "[2, 3]", "(3, ∞)"],
        correct_index: 0,
        explanation: "Roots are 2 and 3 with a = 1 > 0, so f(x) opposes a (negative) strictly on the open interval (2, 3).",
        hint: "With a > 0, the quadratic dips below the x-axis between its two roots.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-en-4b",
        question_type: "multiple-choice",
        prompt: "Describe the sign of f(x) = x² + 6x + 10 over ℝ.",
        choices: [
          "Strictly positive for all real numbers x ∈ ℝ",
          "Strictly negative for all x ∈ ℝ",
          "Positive except zero at x = −3",
          "Changes sign at x = −3"
        ],
        correct_index: 0,
        explanation: "Δ = 36 − 40 = −4 < 0, so f(x) keeps the positive sign of a = 1 everywhere on ℝ.",
        hint: "Check the discriminant before factoring.",
        difficulty: "standard"
      },
      {
        id: "pack-q-math-en-4c",
        question_type: "multiple-choice",
        prompt: "For which x is f(x) = 4 − x² non-negative (f(x) ≥ 0)?",
        choices: ["[−2, 2]", "(−2, 2)", "ℝ − (−2, 2)", "(−∞, −2] ∪ [2, ∞)"],
        correct_index: 0,
        explanation: "Roots are −2 and 2 with a = −1 < 0, so f(x) ≥ 0 on the closed interval [−2, 2].",
        hint: "Notice a < 0 opens downward and ≥ includes endpoints.",
        difficulty: "challenging"
      }
    ],
    cards: [
      { front: "Sign Rule when Δ > 0", back: "Same sign as a outside roots; opposite sign to a between roots; zero at the roots." },
      { front: "Sign Rule when Δ < 0", back: "Always carries the same sign as leading coefficient a for every x ∈ ℝ." }
    ]
  },
  {
    id: "pack-math-en-5",
    lessonSlug: "math-quadratic-inequalities",
    trackSlug: "mathematics-en",
    subject: "mathematics",
    contentLanguage: "en",
    position: 5,
    title: "Quadratic Inequalities in One Variable",
    titleAr: "المتباينات التربيعية في متغير واحد",
    titleEn: "Quadratic Inequalities in One Variable",
    summary:
      "Move all terms so one side is zero, find the roots, plot a sign chart, and pick intervals matching >, < (excluding roots with parentheses) or ≥, ≤ (including roots with brackets).",
    formulaOrRule: "1) Zero one side → 2) Find roots → 3) Sign chart → 4) () for strict >/<, [] for ≥/≤",
    keyConcepts: [
      {
        id: "math-ineq-en-1",
        title: "Interval Notation & Endpoint Discipline",
        body: "Roots are boundary points, not the final solution. For (x − 2)(x − 3) > 0, the solution is two outer rays (−∞, 2) ∪ (3, ∞) = ℝ − [2, 3]; for ≤ 0, it is the bounded segment [2, 3].",
        formulaOrRule: "Flip the inequality sign whenever multiplying or dividing by a negative number",
        example: "−x² + 4 ≥ 0 ⇔ x² − 4 ≤ 0 ⇒ [−2, 2]."
      }
    ],
    workedExamples: [
      {
        problem: "Solve x² − x − 6 > 0 over ℝ.",
        steps: [
          "1) Factor: (x − 3)(x + 2) > 0 → roots at −2 and 3.",
          "2) Leading coefficient a = 1 > 0, so positive values sit outside the roots.",
          "3) Strict > excludes endpoints: (−∞, −2) ∪ (3, ∞), i.e., ℝ − [−2, 3]."
        ],
        takeaway: "Never merge two disconnected outer rays into a single bracketed interval."
      }
    ],
    commonMistakes: [
      "Stopping after listing the roots instead of writing the solution intervals.",
      "Including roots when solving strict > or < inequalities."
    ],
    questions: [
      {
        id: "pack-q-math-en-5a",
        question_type: "multiple-choice",
        prompt: "What is the solution set of (x − 1)(x + 4) < 0 in ℝ?",
        choices: ["(−4, 1)", "[−4, 1]", "ℝ − [−4, 1]", "(−∞, −4) ∪ (1, ∞)"],
        correct_index: 0,
        explanation: "Roots are −4 and 1 with positive leading coefficient; negative values lie strictly between the roots on (−4, 1).",
        hint: "Strict < requires open parentheses.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-math-en-5b",
        question_type: "multiple-choice",
        prompt: "Solve x² − 5x + 6 ≥ 0 over ℝ.",
        choices: ["ℝ − (2, 3)", "ℝ − [2, 3]", "[2, 3]", "(2, 3)"],
        correct_index: 0,
        explanation: "Because ≥ 0 includes the roots {2, 3}, subtracting the open middle (2, 3) keeps 2 and 3 in the solution.",
        hint: "Watch carefully whether subtracting (2, 3) vs [2, 3] keeps the endpoints!",
        difficulty: "challenging"
      },
      {
        id: "pack-q-math-en-5c",
        question_type: "multiple-choice",
        prompt: "What is the real solution set of x² + 1 < 0?",
        choices: ["∅ (Empty set)", "ℝ", "{−1, 1}", "(−1, 1)"],
        correct_index: 0,
        explanation: "Since x² + 1 ≥ 1 > 0 for every real x, no real number satisfies x² + 1 < 0.",
        hint: "Can x² ever drop below 0 for real x?",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "ℝ − (r1, r2) vs ℝ − [r1, r2]", back: "Use ℝ − (r1, r2) for ≥ 0 (endpoints kept); use ℝ − [r1, r2] for strict > 0 (endpoints excluded)." },
      { front: "Negative Multiplier Rule", back: "Reverse >/< direction immediately whenever multiplying or dividing an inequality by a negative number." }
    ]
  },

  // =========================================================================
  // 3. ARABIC LANGUAGE (ALL 11 EXACT SEC 1 TERM 1 LESSONS)
  // =========================================================================
  {
    id: "pack-arab-1",
    lessonSlug: "arab-reading-hatim",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 1,
    title: "القراءة: مكارم الأخلاق وحاتم الطائي",
    titleAr: "القراءة: مكارم الأخلاق وحاتم الطائي",
    titleEn: "Reading: Moral Virtues and Hatim al-Tai",
    summary:
      "يبرز الدرس أثر مكارم الأخلاق (الكرم، العفو، الصدق، الحلم، الوفاء) في بناء الفرد والمجتمع، مقدمًا حاتم الطائي نموذجًا للمروءة مع التفريق الدقيق بين الكرم المنضبط بالحكمة والإسراف غير النافع.",
    formulaOrRule: "الكرم = بذل حكيم يراعي الحاجة ← يختلف عن الإسراف | سؤال «الأثر»: اشرح النتائج الاجتماعية والفردية لا تعريف الخلق",
    keyConcepts: [
      {
        id: "arab-hatim-1",
        title: "الفرق بين الكرم والإسراف ودلالة نموذج حاتم",
        body: "الكرم النافع ينظر إلى حاجة الناس ويصرف المال بحكمة في موضعه، أما الإسراف فهو مجاوزة الاعتدال بلا مصلحة. ومكارم الأخلاق في الجاهلية كانت أساس السيادة والشرف القبلي.",
        example: "سؤال أثر خلق «الحلم»: نوضح أثره في تهدئة النزاع وحفظ وحدة الجماعة لا مجرد تعريفه."
      }
    ],
    workedExamples: [
      {
        problem: "قارن بين الكرم والإسراف في إجابة نموذجية لاختبار القراءة المتحررة.",
        steps: [
          "1) عرّف الكرم بأنه العطاء المسؤول الموازن بين القدرة وحاجة الآخرين.",
          "2) عرّف الإسراف بأنه إنفاق زائد يجاوز الاعتدال دون نفع حقيقي.",
          "3) استنتج أن المروءة الجاهلية والإسلامية تقدّران الكرم وتذمان التبذير."
        ],
        takeaway: "في أسئلة القراءة لا تكرر جملة النص بل اربط السبب بالأثر والمغزى."
      }
    ],
    commonMistakes: [
      "الاكتفاء بتعريف الخُلق عند سؤال «ما أثر الخُلق في الفرد والمجتمع؟».",
      "الخلط بين الجود المحمود والتبذير المذموم."
    ],
    questions: [
      {
        id: "pack-q-arab-1a",
        question_type: "multiple-choice",
        prompt: "ما الفارق الجوهري بين الكرم والإسراف كما يضبطه المنهج؟",
        choices: [
          "الكرم يراعي حاجة الناس وحكمة الإنفاق، أما الإسراف فتجاوز للاعتدال بلا مصلحة",
          "الإسراف أعلى درجات الكرم في كل الأحوال",
          "الكرم يكون بالمال القليل والإسراف بالكثير فقط",
          "لا يوجد فارق دلالي بينهما"
        ],
        correct_index: 0,
        explanation: "يُحمد الكرم لارتباطه بالحكمة ونفع المحتاج، ويُذم الإسراف لتجاوزه حد التوازن.",
        hint: "ابحث عن قيد الحكمة والمصلحة في العطاء.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-1b",
        question_type: "multiple-choice",
        prompt: "إذا طُلب في الاختبار «بيّن أثر خُلق الحِلم في المجتمع»، فما الإجابة الأدق منهجيًا؟",
        choices: [
          "شرح أثره في نزع فتيل الخلاف ونشر السلم وتقوية الروابط الاجتماعية",
          "كتابة التعريف اللغوي لكلمة الحِلم فقط",
          "تعداد أسماء قبائل العرب في الجاهلية",
          "إعراب كلمة الحلم في جملة اسمية"
        ],
        correct_index: 0,
        explanation: "سؤال الأثر يستوجب بيان النتائج العملية على الفرد والمجتمع، لا الاكتفاء بالتعريف.",
        hint: "الأثر يعني النتيجة الواقعة في الحياة الاجتماعية.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "الفكرة الرئيسة في درس حاتم الطائي", back: "الأخلاق الكريمة ترفع مكانة الإنسان في مجتمعه، والكرم الحقيقي مقترن بالمروءة والحكمة لا الإسراف." },
      { front: "قاعدة الإجابة عن سؤال «الأثر»", back: "اشرح أثر الصفة في سلوك الفرد واستقرار المجتمع ولا تكتفِ بتكرار اسم الصفة أو تعريفها." }
    ]
  },
  {
    id: "pack-arab-2",
    lessonSlug: "arab-literature-samawal",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 2,
    title: "الأدب والنصوص: شباب تسامى للعلا — السموأل",
    titleAr: "الأدب والنصوص: شباب تسامى للعلا — السموأل",
    titleEn: "Literature & Texts: Al-Samawal — Noble Youth",
    summary:
      "يمثل نص السموأل نموذجًا للرثاء والفخر الجاهلي القائم على العفة والوفاء والاعتداد بالنفس وسمو القيم رغم قلة العدد؛ مع التدريب البلاغي على عدم الاكتفاء بتسمية الصورة البيانية بل شرح سر جمالها وإيحائها.",
    formulaOrRule: "العاطفة: الاعتزاز بالقيم والوفاء والثقة | البلاغة: اسم الصورة + شرح الإيحاء والمعنى = إجابة كاملة",
    keyConcepts: [
      {
        id: "arab-samawal-1",
        title: "سمات الفخر الجاهلي ومنهج تحليل الصور البلاغية",
        body: "يمزج السموأل الفخر الفردي والقبلي بقيم الدفاع عن المظلوم، الوفاء، وطهارة النفس. وعند استخراج تشبيه أو استعارة أو كناية اشرح أركانها وما توحي به من معانٍ كالشرف والصمود.",
        example: "قوله يرد على المعيرة بقلة العدد: الشرف بكثرة الفضائل والمكارم لا بمجرد كثرة العدد."
      }
    ],
    workedExamples: [
      {
        problem: "كيف تحلل صورة بلاغية في نص السموأل دون خسارة درجات البلاغة؟",
        steps: [
          "1) حدد نوع الصورة بدقة (تشبيه، استعارة مكنية/تصريحية، كناية).",
          "2) وضح طرفي التصوير أو الملازمة في الكناية.",
          "3) اشرح الإيحاء العاطفي والمعنوي (تدل على الثبات / الشرف / العفة) ولا تقف عند التسمية."
        ],
        takeaway: "ذكر «استعارة مكنية» وحدها يفقد نصف الدرجة؛ إظهار الإيحاء هو قلب التحليل البلاغي."
      }
    ],
    commonMistakes: [
      "الخلط بين الفخر بالثروة والغنى والفخر المعنوي عند السموأل القائم على الكرامة والوفاء.",
      "كتابة اسم اللون البياني بدون شرح سر الجمال أو الإيحاء."
    ],
    questions: [
      {
        id: "pack-q-arab-2a",
        question_type: "multiple-choice",
        prompt: "ما العاطفة المسيطرة على قصيدة السموأل في رده على المعيرة بقلة عدد قبيلته؟",
        choices: [
          "الاعتزاز بالقيم الأخلاقية والوفاء والثقة بالنفس",
          "الجزع والخوف من الأعداء",
          "الهجاء المقذع طلبًا للمال",
          "الحزن والبكاء على الأطلال فقط"
        ],
        correct_index: 0,
        explanation: "يُعلي السموأل من قيمة الخصال الحميدة والشرف على كثرة العدد المادية بثقة وفخر نبيل.",
        hint: "لماذا لم ينكر قلة العدد بل افتخر بمكانة القوم رغم ذلك؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-2b",
        question_type: "multiple-choice",
        prompt: "ما المعيار الأهم لاكتمال إجابتك عند تحليل صورة بلاغية في الأبيات؟",
        choices: [
          "تحديد نوع الصورة ثم شرح أركانها والمعنى الذي توحي به",
          "كتابة اسم الصورة فقط مثل «كناية»",
          "ذكر وزن القصيدة العروضي وبحرها فقط",
          "نقل البيت التالي لها مباشرة"
        ],
        correct_index: 0,
        explanation: "التحليل البلاغي يجمع بين التشخيص الفني وتفسير القيمة الشعورية والإيحائية للصورة.",
        hint: "الأثر والإيحاء أهم جزء في التذوق البلاغي.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "غرض نص «شباب تسامى للعلا»", back: "الفخر السامي بالوفاء والكرم والشرف الأخلاقي لا بمجرد كثرة العدد." },
      { front: "قاعدة تحليل البلاغة في النصوص", back: "حدد اللون البياني + اذكر طرفيه + بيّن الإيحاء العاطفي والمعنوي (تشخيص/تجسيم/توضيح)." }
    ]
  },
  {
    id: "pack-arab-3",
    lessonSlug: "arab-literature-wasiya",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 3,
    title: "الأدب والنصوص: وصية أم لابنتها",
    titleAr: "الأدب والنصوص: وصية أم لابنتها",
    titleEn: "Literature: A Mother's Advice to Her Daughter",
    summary:
      "نموذج للنثر الجاهلي الرفيع (فن الوصايا) لأمامة بنت الحارث لابنتها عند الزواج؛ يبرز خصائص أسلوب الوصية من قِصر الجمل، والسجع غير المتكلف، والمقابلة، وترابط الخبرة الحياتية بالعاطفة الأمومية.",
    formulaOrRule: "فن الوصايا: قول حكيم صادر عن مجرب محب | سماته: إيجاز، سجع لطيف، جمل متوازنة، قوة إقناع",
    keyConcepts: [
      {
        id: "arab-wasiya-1",
        title: "خصائص النثر الجاهلي في فن الوصايا",
        body: "تعتمد الوصية على الإقناع القلبي والعقلي معًا فتجمع بين النداء العاطفي، وتقديم النصائح المحددة (القناعة، حسن السمع والطاعة، التفقد والاهتمام، حفظ السر والمال)، والسجع الطبيعي.",
        example: "الازدواج والتوازن الموسيقي بين الجمل يعطي إيقاعًا يرسّخ الحكمة في الذهن."
      }
    ],
    workedExamples: [
      {
        problem: "لماذا جمع النص بين الأسلوب الإنشائي والخبري مع توازن الجمل؟",
        steps: [
          "1) الإنشاء (الأمر والنهي والنداء) يجذب الانتباه ويحرك المشاعر والالتزام.",
          "2) الخبر يقرر حقائق الحياة الزوجية والتجربة لإقناع العقل.",
          "3) السجع والازدواج يضيفان جرسًا موسيقيًا لطيفًا دون تكلف."
        ],
        takeaway: "ربط الشكل الفني (إنشاء + خبر + محسنات) بغرض النص هو مفتاح أسئلة النثر المتحررة."
      }
    ],
    commonMistakes: [
      "تصنيف المحسنات اللفظية مثل الجناس والسجع على أنها صور بيانية — السجع محسن بديعي لفظي لا صورة بيانية."
    ],
    questions: [
      {
        id: "pack-q-arab-3a",
        question_type: "multiple-choice",
        prompt: "إلى أي فن نثري ينتمي نص أمامة بنت الحارث لابنتها عند انتقالها إلى بيت الزوجية؟",
        choices: ["فن الوصايا", "فن المقامات", "فن الرسائل الديوانية", "المسرح النثري"],
        correct_index: 0,
        explanation: "الوصية هي خلاصة تجربة يوجهها حكيم أو قريب محب إلى من يُعنى بأمره، وهو من أبرز فنون النثر الجاهلي.",
        hint: "لاحظ العنوان وموقف النصيحة قبل الزواج.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-3b",
        question_type: "multiple-choice",
        prompt: "ما أثر استخدام الجمل القصيرة المتوازنة والسجع العفوي في الوصية الجاهلية؟",
        choices: [
          "إحداث جرس موسيقي محبب يساعد على التذكر وسرعة التأثير",
          "تغميض المعنى وإرباك السامع",
          "تحويل الوصية إلى قصيدة شعرية موزونة",
          "استخدام ألفاظ أعجمية حديثة"
        ],
        correct_index: 0,
        explanation: "التوازن الموسيقي غير المتكلف يزيد التأثير العاطفي ويثبّت النصائح في الذاكرة.",
        hint: "الأثر البلاغي للسجع والازدواج في النثر موسيقي وتأكيدي.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "مفهوم الوصية وسماتها الجاهلية", back: "خلاصة تجربة يقدمها ناصح محب؛ تتسم بقصر الجمل، وتنوع الخبر والإنشاء، ووضوح الألفاظ، والسجع غير المتكلف." },
      { front: "الفرق بين البديع والبيان", back: "السجع والازدواج والطباق والمقابلة محسنات بديعية؛ التشبيه والاستعارة والكناية والمجاز صور بيانية." }
    ]
  },
  {
    id: "pack-arab-4",
    lessonSlug: "arab-reading-social-values",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 4,
    title: "القراءة: القيم الاجتماعية",
    titleAr: "القراءة: القيم الاجتماعية",
    titleEn: "Reading: Social Values",
    summary:
      "يعالج الدرس مكانة التكافل والتعاون وقبول الآخر وتغليب الصالح العام على الأنانية الفردية، وكيفية استنتاج العلاقات الضمنية (التعليل، النتيجة، التفصيل بعد الإجمال) في نصوص القراءة المتحررة.",
    formulaOrRule: "العلاقات المنطقية: «لكي/لأن» ← تعليل | «ومن ثم/أدى إلى» ← نتيجة | تعدد الأنواع ← تفصيل بعد إجمال",
    keyConcepts: [
      {
        id: "arab-social-1",
        title: "التكافل الاجتماعي والتمييز بين العلاقات النصية",
        body: "القيم الاجتماعية منظومة تحمي تماسك المجتمع؛ وعند قراءة النص يجب التفرقة بين الرأي الشخصي والحقيقة، وبين سبب الظاهرة (التعليل) وما يترتب عليها (النتيجة).",
        example: "التكافل لا يقتصر على العطاء المادي بل يشمل النصيحة ومواساة المحتاج والعمل التعاوني."
      }
    ],
    workedExamples: [
      {
        problem: "في عبارة «يؤدي غياب التعاون إلى تفكك الروابط، مما يضعف قدرات المجتمع»، ما علاقة «مما يضعف قدرات المجتمع» بما قبلها؟",
        steps: [
          "1) الجملة الأولى تعرض السبب/الواقعة (غياب التعاون وتفكك الروابط).",
          "2) التعبير «مما يضعف» يذكر الأثر المترتب على تلك الواقعة.",
          "3) إذن العلاقة: نتيجة لما قبلها."
        ],
        takeaway: "اختبر علاقة «نتيجة» بسؤال: هل هذا ما حدث بعد السبب، أم تفسير لحدوثه (تعليل)؟"
      }
    ],
    commonMistakes: [
      "الخلط بين علاقة التعليل (يجيب عن «لماذا؟») وعلاقة النتيجة (يجيب عن «ماذا ترتب على ذلك؟»)."
    ],
    questions: [
      {
        id: "pack-q-arab-4a",
        question_type: "multiple-choice",
        prompt: "في القراءة المتحررة: ما العلاقة الضمنية لجملة مسبوقة بـ «لأنها تحفظ كرامة المحتاج» بعد دعوة إلى التكافل؟",
        choices: ["تعليل لما قبلها", "نتيجة لما قبلها", "تقابل وتضاد", "ترادف توكيدي"],
        correct_index: 0,
        explanation: "توضح الجملة السبب الداعي للحكم السابق وتجيب عن سؤال «لماذا؟»، فهي تعليل.",
        hint: "اسأل نفسك: هل تفسر الجملة السبب أم تبين الأثر الناتج؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-4b",
        question_type: "multiple-choice",
        prompt: "ما المعنى الشامل لمفهوم التكافل الاجتماعي كما يقرره الدرس؟",
        choices: [
          "تآزر أفراد المجتمع ماديًا ومعنويًا وأخلاقيًا لحفظ التوازن والكرامة",
          "الصدقة بالمال فقط دون دعم أو رعاية معنوية",
          "انعزال كل أسرة عن مشكلات محيطها",
          "التنافس الفردي على حساب الفئات الضعيفة"
        ],
        correct_index: 0,
        explanation: "التكافل يشمل الترابط المادي والعلمي والأخلاقي والمعنوي بين طبقات المجتمع.",
        hint: "اختر الإجابة التي تجمع الدعم المادي والمعنوي معًا.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "مفاتيح العلاقات في القراءة المتحررة", back: "لماذا حدث؟ ← تعليل | ماذا ترتب عليه؟ ← نتيجة | ذكر الكل ثم أجزائه ← تفصيل بعد إجمال." },
      { front: "ركائز القيم الاجتماعية", back: "التعاون، التكافل المادي والمعنوي، التسامح، واحترام النظام العام." }
    ]
  },
  {
    id: "pack-arab-5",
    lessonSlug: "arab-literature-kab",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 5,
    title: "الأدب والنصوص: العفو مأمول — كعب بن زهير",
    titleAr: "الأدب والنصوص: العفو مأمول — كعب بن زهير",
    titleEn: "Literature: Pardon Is Hoped For — Ka'b ibn Zuhayr",
    summary:
      "قصيدة شهيرة في عصر صدر الإسلام (قصيدة البردة / بانت سعاد) يعتذر فيها كعب بن زهير إلى النبي ﷺ، ممثلًا تحول الشعر نحو القيم الإسلامية والندم والرجاء والاستعارة التمثيلية للغرض الديني والأخلاقي.",
    formulaOrRule: "العصر: صدر الإسلام | الغرض: الاعتذار ومدح الرسول ﷺ وطلب العفو | البناء: تقليدي بمقدمة غزلية ثم التخلص للمدح والاعتذار",
    keyConcepts: [
      {
        id: "arab-kab-1",
        title: "سمات الشعر في عصر صدر الإسلام وبناء قصيدة كعب",
        body: "حافظ كعب على الهيكل الجاهلي (المقدمة الغزلية ووصف الناقة) ثم تخلص إلى الاعتذار الصادق وطلب العفو وبيان عظمة الرسول ﷺ وعدله وصفاته النورانية والهدى.",
        example: "يمثل النص أثر الإسلام في تهذيب الألفاظ ونبذ العصبية القبلية مع إبقاء قوة التصوير العربي."
      }
    ],
    workedExamples: [
      {
        problem: "كيف يوضح نص كعب بن زهير ثبات البناء التقليدي للقصيدة رغم تجديد المعاني في صدر الإسلام؟",
        steps: [
          "1) بدأ بمقدمة غزلية تقليدية (بانت سعاد) متبعًا نهج القصيدة الجاهلية.",
          "2) انتقل بحسن تخلص إلى موقفه الحقيقي: الخوف والندم وطلب العفو في ظل عدل الإسلام.",
          "3) عبّر بألفاظ مشرقة مستمدة من روح الهداية والعفو عند المقدرة."
        ],
        takeaway: "الأدب في صدر الإسلام جدد المضامين والقيم مع احتفاظه غالبًا بقوالب القصيدة العربية الأصيلة."
      }
    ],
    commonMistakes: [
      "الظن بأن الشعر توقف تمامًا في صدر الإسلام؛ الحقيقة أنه تطور لخدمة الدعوة والدفاع عن القيم الجديدة والاعتذار والحماسة."
    ],
    questions: [
      {
        id: "pack-q-arab-5a",
        question_type: "multiple-choice",
        prompt: "ما الغرض الأساسي لقصيدة «العفو مأمول» لكعب بن زهير؟",
        choices: [
          "الاعتذار وطلب العفو ومدح النبي ﷺ",
          "رثاء أحد ملوك المناذرة",
          "وصف القصور العباسية",
          "الهجاء السياسي بين الأحزاب"
        ],
        correct_index: 0,
        explanation: "نظم كعب القصيدة معتذرًا للنبي ﷺ ومظهرًا التوبة والرجاء ومدح الرسالة المحمدية.",
        hint: "لاحظ عنوان النص «العفو مأمول» وموقفه في صدر الإسلام.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-5b",
        question_type: "multiple-choice",
        prompt: "بمَ استهل كعب بن زهير قصيدته رغم أنها في الاعتذار ومدح النبي ﷺ؟",
        choices: [
          "بمقدمة غزلية تقليدية التزامًا بالنهج الموروث للقصيدة العربية",
          "بنظم أسلوب الموشحات الأندلسية",
          "بخطبة نثرية مسجوعة في الوسط",
          "بالشعر الحر متعدد التفعيلات"
        ],
        correct_index: 0,
        explanation: "التزم كعب البناء التقليدي الذي يبدأ بالغزل والرحلة قبل التخلص للغرض الرئيس.",
        hint: "مطلع القصيدة الشهير: «بانت سعاد فقلبي اليوم متبول».",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "موضوع قصيدة كعب بن زهير", back: "الاعتذار ومدح النبي ﷺ في عصر صدر الإسلام مع الحفاظ على المطلع التقليدي للقصيدة." },
      { front: "أثر الإسلام في الشعر", back: "تهذيب الألفاظ، محاكاة معاني القرآن، والبعد عن الغزل الفاحش والعصبية الجاهلية." }
    ]
  },
  {
    id: "pack-arab-6",
    lessonSlug: "arab-grammar-word-types",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 6,
    title: "القواعد: الكلمة وأقسامها",
    titleAr: "القواعد: الكلمة وأقسامها",
    titleEn: "Grammar: The Word and Its Parts",
    summary:
      "تنقسم الكلمة العربية إلى ثلاثة أقسام: اسم (يدل على معنى غير مقترن بزمن وتقبل «الـ» أو التنوين أو الجر)، وفعل (حدث + زمن)، وحرف (لا يظهر معناه كاملًا إلا مع غيره مثل حروف الجر والعطف).",
    formulaOrRule: "الاسم ← يقبل الجر والتنوين والنداء و«الـ» | الفعل ← حدث + زمن | الحرف ← يربط ولا يظهر معناه منفردًا",
    keyConcepts: [
      {
        id: "arab-wtypes-1",
        title: "علامات التمييز بين الاسم والفعل والحرف",
        body: "جرّب إدخال «الـ» أو التنوين أو حرف الجر على الكلمة؛ إن قبلته فهي اسم (مثل: علمٌ، إلى المدرسةِ)، وإن دلت على حدث بزمن فهي فعل (كتبَ، يكتبُ، اكتبْ). ولا تتوهم أن كل كلمة تبدأ بـ«ي» مضارعًا مثل كلمة «يقين» أو «يد»!",
        example: "«يمين» اسم يقبل «اليمين»، بينما «يمشي» فعل مضارع لا يقبل «الـ»."
      }
    ],
    workedExamples: [
      {
        problem: "صنّف كلمات الجملة: «حضر الطالبُ إلى المدرسةِ مبكرًا».",
        steps: [
          "1) حضرَ: فعل ماضٍ دل على حدث في الماضي.",
          "2) الطالبُ: اسم معرفة مسبوق بـ«الـ».",
          "3) إلى: حرف جر يربط المعنى.",
          "4) المدرسةِ: اسم مجرور لوجود «الـ» وقبوله الجر.",
          "5) مبكرًا: اسم منوّن."
        ],
        takeaway: "اختبر الكلمة بعلامات الاسم (الـ، التنوين، الجر، النداء) قبل الحكم عليها."
      }
    ],
    commonMistakes: [
      "الظن أن كلمات مثل «ياسر» أو «يقين» أفعال مضارعة لمجرد بدئها بحرف الياء!"
    ],
    questions: [
      {
        id: "pack-q-arab-6a",
        question_type: "multiple-choice",
        prompt: "أي العلامات الآتية تخص الاسم وتميزه عن الفعل والحرف؟",
        choices: [
          "قبول حرف الجر والتنوين ودخول «الـ»",
          "دلالته على زمن المستقبل فقط",
          "دخول أداة الجزم «لم» عليه",
          "عدم قبول الإعراب مطلقًا"
        ],
        correct_index: 0,
        explanation: "من علامات الاسم الجر والتنوين والنداء ودخول «الـ» والإسناد إليه.",
        hint: "جرّب إضافة «الـ» أو تنوين على الكلمة في ذهنك.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-6b",
        question_type: "multiple-choice",
        prompt: "ما نوع كلمة «يقين» في جملة «إن اليقينَ يزيلُ الشكَّ»؟",
        choices: ["اسم", "فعل مضارع", "فعل ماضٍ", "حرف ناسخ"],
        correct_index: 0,
        explanation: "رغم بدئها بالياء إلا أنها تقبل «الـ» (اليقين) والتنوين ولا تدل على زمن، فهي اسم.",
        hint: "هل قبلت الكلمة دخول «الـ» عليها في الجملة؟",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "أقسام الكلمة العربية الثلاثة", back: "اسم (معنى بلا زمن، يقبل الـ والجر والتنوين)، فعل (حدث + زمن)، حرف (معناه في غيره)." },
      { front: "فخ الياء في أول الكلمة", back: "لا تحكم ببدء الكلمة بالياء وحدها؛ جرّب «الـ»: «اليمين» اسم، بينما «يلعب» لا تقبل «الـ» فهي فعل." }
    ]
  },
  {
    id: "pack-arab-7",
    lessonSlug: "arab-grammar-noun-types",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 7,
    title: "القواعد: الاسم وأقسامه",
    titleAr: "القواعد: الاسم وأقسامه",
    titleEn: "Grammar: The Noun and Its Classifications",
    summary:
      "يُصنّف الاسم من حيث التعريف إلى نكرة ومعرفة (الضمائر، العلم، الإشارة، الموصول، المعرّف بـ«الـ»، المضاف لمعرفة، المنادى المقصود)، ومن حيث العدد إلى مفرد ومثنى وجمع بأنواعه، ومن حيث الاشتقاق إلى جامد ومشتق.",
    formulaOrRule: "المثنى: يرفع بالألف وينصب ويجر بالياء | جمع المذكر السالم: يرفع بالواو وينصب ويجر بالياء | المؤنث السالم: ينصب بالكسرة!",
    keyConcepts: [
      {
        id: "arab-ntypes-1",
        title: "المعرفة والنكرة وعلامات العدد الإعرابية",
        body: "«طالبٌ» نكرة لأنها غير معينة، بينما «الطالبُ» أو «محمود» أو «كتابُ الطالبِ» معرفة. المثنى يُرفع بالألف («جاء الطالبان») وجمع المذكر السالم بالواو («المعلمون»)، بينما يُنصب جمع المؤنث السالم بالكسرة نيابة عن الفتحة.",
        formulaOrRule: "انتبه: علامة نصب جمع المؤنث السالم هي الكسرة لا الفتحة!",
        example: "«رأيتُ الطالباتِ» ← الطالباتِ: مفعول به منصوب وعلامة نصبه الكسرة لأنه جمع مؤنث سالم."
      }
    ],
    workedExamples: [
      {
        problem: "ميّز المعرفة من النكرة في: «حضر طالبٌ مجتهدٌ، ثم سلّم المعلمُ على طالبِ العلمِ».",
        steps: [
          "1) «طالبٌ مجتهدٌ»: كلاهما نكرة غير دالة على شخص بعينه.",
          "2) «المعلمُ»: معرفة بدخول «الـ».",
          "3) «طالبِ العلمِ»: «طالبِ» صار معرفة بالإضافة إلى المعرفة «العلمِ»."
        ],
        takeaway: "النكرة المضافة إلى معرفة (مثل: طالبُ العلمِ، كتابي) تكتسب التعريف وتصبح معرفة!"
      }
    ],
    commonMistakes: [
      "نصب جمع المؤنث السالم بالفتحة بدلًا من الكسرة.",
      "الظن أن الاسم المضاف لمعرفة لا يزال نكرة."
    ],
    questions: [
      {
        id: "pack-q-arab-7a",
        question_type: "multiple-choice",
        prompt: "ما علامة نصب جمع المؤنث السالم في القاعدة العربية الأساسية؟",
        choices: ["الكسرة نيابة عن الفتحة", "الفتحة الظاهرة دائمًا", "الياء", "الألف"],
        correct_index: 0,
        explanation: "يرفع جمع المؤنث السالم بالضمة، وينصب ويجر بالكسرة مثل: «كافأتُ المتفوقاتِ».",
        hint: "هذه إحدى العلامات الفرعية المشهورة في الاسم.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-7b",
        question_type: "multiple-choice",
        prompt: "ما نوع كلمة «كتابُ» من حيث التعريف والتنكير في جملة «قرأتُ كتابَ النحوِ»؟",
        choices: [
          "معرفة بالإضافة إلى معرفة",
          "نكرة محضة",
          "علم مفرد",
          "اسم إشارة"
        ],
        correct_index: 0,
        explanation: "كلمة «كتاب» كانت نكرة بمفردها، لكنها تعرّفت عندما أضيفت إلى المعرفة «النحو».",
        hint: "انظر إلى الكلمة التي تليها والمجرورة بالإضافة.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "أنواع المعارف السبعة", back: "الضمير، العلم، اسم الإشارة، الاسم الموصول، المعرّف بـ«الـ»، المضاف لمعرفة، المنادى المقصود." },
      { front: "إعراب المثنى والجمعين", back: "المثنى: بالألف رفعًا والياء نصبًا وجرًا | المذكر السالم: بالواو رفعًا والياء نصبًا وجرًا | المؤنث السالم: بالكسرة نصبًا وجرًا." }
    ]
  },
  {
    id: "pack-arab-8",
    lessonSlug: "arab-grammar-verb-types",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 8,
    title: "القواعد: الفعل وأقسامه",
    titleAr: "القواعد: الفعل وأقسامه",
    titleEn: "Grammar: The Verb and Its Classes",
    summary:
      "ينقسم الفعل إلى ماضٍ مبني، وأمر مبني، ومضارع يعرب (يرفع، وينصب بعد لن/أن/كي، ويجزم بعد لم/لا الناهية) ما لم يتصل بنون النسوة أو نون التوكيد؛ مع تمييز علامات الأفعال الخمسة والمعتل الآخر.",
    formulaOrRule: "نواصب المضارع: أنْ، لن، كي، حتى، لام التعليل | جوازمه: لم، لمّا، لام الأمر، لا الناهية | الأفعال الخمسة: ترفع بثبوت النون وتنصب وتجزم بحذفها",
    keyConcepts: [
      {
        id: "arab-vtypes-1",
        title: "حالات المضارع الإعرابية وعلاماتها",
        body: "يُرفع المضارع الصحيح بالضمة («يذاكرُ»)، ويُنصب بالفتحة («لن يهملَ»)، ويُجزم بالسكون («لم يهملْ»). أما معتل الآخر فيُجزم بحذف حرف العلة («لم يدعُ / لم يمشِ»)، والأفعال الخمسة بحذف النون («لم يكتبوا»).",
        formulaOrRule: "«لا الناهية» تجزم المضارع («لا تهملْ»)، أما «لا النافية» فلا تؤثر في إعرابه («الطالبُ لا يهملُ»)",
        example: "«لن يقصرَ المجتهدُ»: يقصر فعل مضارع منصوب بـ«لن» وعلامة نصبه الفتحة الظاهرة."
      }
    ],
    workedExamples: [
      {
        problem: "فرّق إعرابيًا بين «يهمل» في: «لا تهملْ واجبك» و «المجتهد لا يهملُ واجبه».",
        steps: [
          "1) في الجملة الأولى «لا» طلبية للنهي ← «تهملْ» مضارع مجزوم بـ لا الناهية وعلامة جزمه السكون.",
          "2) في الجملة الثانية «لا» خبرية للنفي فقط ← «يهملُ» مضارع مرفوع بالضمة لتجرده من الناصب والجازم."
        ],
        takeaway: "التمييز بين لا الناهية الجازمة ولا النافية الرافعة سؤال امتحاني متكرر!"
      }
    ],
    commonMistakes: [
      "تطبيق علامة السكون أو الضمة الظاهرة على الفعل المعتل الآخر أو الأفعال الخمسة دون فحص آخر الفعل."
    ],
    questions: [
      {
        id: "pack-q-arab-8a",
        question_type: "multiple-choice",
        prompt: "ما إعراب الفعل في «لم يتكاسلوا عن أداء الواجب»؟",
        choices: [
          "مضارع مجزوم وعلامة جزمه حذف النون لأنه من الأفعال الخمسة",
          "مضارع مجزوم وعلامة جزمه السكون",
          "ماضٍ مبني على الضم",
          "مضارع منصوب بالفتحة المقدرة"
        ],
        correct_index: 0,
        explanation: "«لم» جازمة والفعل متصل بواو الجماعة من الأفعال الخمسة، فعلامة جزمه حذف النون.",
        hint: "اتصل الفعل بواو الجماعة! ما علامة نصب وجزم الأفعال الخمسة؟",
        difficulty: "standard"
      },
      {
        id: "pack-q-arab-8b",
        question_type: "multiple-choice",
        prompt: "في «الطالبُ لا يكذبُ»، ما إعراب الفعل «يكذبُ»؟",
        choices: [
          "مضارع مرفوع بالضمة لأن «لا» هنا نافية غير جازمة",
          "مضارع مجزوم بالسكون بـ «لا»",
          "مضارع منصوب بالفتحة",
          "فعل أمر مبني على السكون"
        ],
        correct_index: 0,
        explanation: "«لا» التي تنفي وقوع الفعل دون طلب الكف عنه لا تجزم المضارع، فيبقى مرفوعًا.",
        hint: "هل تطلب الجملة من الطالب شيئًا أم تخبر عنه؟",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "علامات جزم الفعل المضارع", back: "السكون (صحيح الآخر) | حذف حرف العلة (معتل الآخر) | حذف النون (الأفعال الخمسة)." },
      { front: "لا الناهية مقابل لا النافية", back: "الناهية طلبية تجزم المضارع («لا تهملْ»)؛ النافية خبرية يظل بعدها مرفوعًا («لا يهملُ»)." }
    ]
  },
  {
    id: "pack-arab-9",
    lessonSlug: "arab-grammar-inflected",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 9,
    title: "القواعد: المعرب والمبني من الأسماء والأفعال",
    titleAr: "القواعد: المعرب والمبني من الأسماء والأفعال",
    titleEn: "Grammar: Inflected and Fixed Nouns & Verbs",
    summary:
      "المعرب يتغير ضبط آخره بتغير موقعه والعامل («محمدٌ، محمدًا، محمدٍ»)، والمبني يلزم حركة واحدة في آخره («هذا، الذي، أنتَ»، والماضي، والأمر). الأسماء تشترك في الرفع والنصب والجر، أما الجزم فخاص بالمضارع لا الأسماء.",
    formulaOrRule: "الأصل في الأسماء الإعراب (عدا الضمائر والإشارة* والموصول* والاستفهام والشرط وبعض الظروف) | الجزم للأفعال فقط، والجر للأسماء فقط",
    keyConcepts: [
      {
        id: "arab-inflect-1",
        title: "خريطة الإعراب والبناء بين الأسماء والأفعال",
        body: "من الأسماء المبنية: الضمائر المتصلة والمنفصلة، أسماء الإشارة (عدا هذان/هاتان فيُعربان)، الأسماء الموصولة (عدا اللذان/اللتان)، وأسماء الاستفهام والشرط. ومن الأفعال: الماضي والأمر مبنيان دائمًا، والمضارع معرب إلا مع نون النسوة أو نون التوكيد.",
        formulaOrRule: "هذان / هاتان / اللذان / اللتان ← أسماء معربة تعرب إعراب المثنى!",
        example: "«حضر هؤلاءِ الطلابُ»: «هؤلاءِ» اسم إشارة مبني على الكسر في محل رفع فاعل."
      }
    ],
    workedExamples: [
      {
        problem: "لماذا قيل إن كلمة «محمد» معربة وكلمة «هذا» مبنية؟",
        steps: [
          "1) في «جاء محمدٌ / رأيت محمدًا / مررت بمحمدٍ» تغير آخر الكلمة تبعًا للموقع الإعرابي ← معرب.",
          "2) في «جاء هذا / رأيت هذا / مررت بهذا» لزم آخرها سكون الألف رغم تغير الموقع ← مبني (في محل رفع/نصب/جر)."
        ],
        takeaway: "الاسم المبني يحتفظ بحركة بنائه ويُقال عنه «مبني على ... في محل رفع/نصب/جر»."
      }
    ],
    commonMistakes: [
      "استخراج «هذان» أو «اللذان» ضمن الأسماء المبنية — هما معربان كالمثنى بالألف والياء."
    ],
    questions: [
      {
        id: "pack-q-arab-9a",
        question_type: "multiple-choice",
        prompt: "أي الحالات الإعرابية الآتية يختص بالفعل المضارع ولا يدخل الأسماء مطلقًا؟",
        choices: ["الجزم", "الرفع", "النصب", "الجر"],
        correct_index: 0,
        explanation: "الحالات في العربية: الرفع والنصب مشتركان بين الأسماء والأفعال، الجر خاص بالأسماء، والجزم خاص بالأفعال.",
        hint: "لا يقال «اسم مجزوم» أبدًا، فما المقابل؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-9b",
        question_type: "multiple-choice",
        prompt: "أي اسم مما يأتي يُعرب إعراب المثنى (أي أنه معرب وليس مبنيًا)؟",
        choices: ["هذان", "هؤلاء", "الذي", "نحن"],
        correct_index: 0,
        explanation: "أسماء الإشارة والأسماء الموصولة مبنية إلا ما دل على المثنى منها (هذان، هاتان، اللذان، اللتان) فيعرب بالألف والياء.",
        hint: "تذكر الاستثناء الوحيد للمثنى في الإشارة والموصول.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "استثناء الإعراب في أسماء الإشارة والموصول", back: "جميعها مبنية ما عدا «هذان، هاتان، اللذان، اللتان» فتُعرب إعراب المثنى (رفعًا بالألف ونصبًا وجرًا بالياء)." },
      { front: "متى يُبنى الفعل المضارع؟", back: "على السكون عند اتصاله بنون النسوة («يكتبْنَ»)، وعلى الفتح عند اتصاله بنون التوكيد («ليكتبَنَّ»)." }
    ]
  },
  {
    id: "pack-arab-10",
    lessonSlug: "arab-grammar-nominatives",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 10,
    title: "القواعد: مرفوعات الأسماء",
    titleAr: "القواعد: مرفوعات الأسماء",
    titleEn: "Grammar: Nominative Nouns",
    summary:
      "المرفوعات السبعة في الأسماء هي: المبتدأ، الخبر، الفاعل، نائب الفاعل، اسم كان وأخواتها، خبر إن وأخواتها، والتابع لمرفوع (النعت والعطف والتوكيد والبدل)؛ وعلامات الرفع الضمة، والألف للمثنى، والواو لجمع المذكر السالم والأسماء الخمسة.",
    formulaOrRule: "كان وأخواتها ترفع المبتدأ وتنصب الخبر | إنّ وأخواتها تنصب المبتدأ وترفع الخبر | المبني للمجهول يرفع نائب فاعل",
    keyConcepts: [
      {
        id: "arab-nom-1",
        title: "المرفوعات السبعة وتفادي خلط كان وإنّ",
        body: "لاحظ التقابل التام: في «كان الجوُّ معتدلًا» المرفوع هو اسم كان «الجوُّ»، وفي «إنّ الصدقَ منجاةٌ» المرفوع هو خبر إنّ «منجاةٌ». وفي الفعل المبني للمجهول مثل «شُرح الدرسُ» يُرفع «الدرسُ» نائب فاعل.",
        example: "«المهندسان ماهران»: مبتدأ وخبر مرفوعان وعلامة الرفع الألف لأنه مثنى."
      }
    ],
    workedExamples: [
      {
        problem: "استخرج الاسم المرفوع وسببه في: «إنّ العلمَ نافعٌ، وقد أضحى المجتهدون مقدَّرين».",
        steps: [
          "1) «نافعٌ»: خبر «إنّ» مرفوع وعلامة رفعه الضمة (أما «العلمَ» فاسم إنّ منصوب).",
          "2) «المجتهدون»: اسم «أضحى» (من أخوات كان) مرفوع وعلامة رفعه الواو لأنه جمع مذكر سالم."
        ],
        takeaway: "حدد نوع الناسخ أولًا: كان ترفع اسمها، وإنّ ترفع خبرها."
      }
    ],
    commonMistakes: [
      "الخلط بين عمل كان وعمل إنّ، أو خلط علامة «ثبوت النون» الخاصة بالأفعال الخمسة مع مرفوعات الأسماء."
    ],
    questions: [
      {
        id: "pack-q-arab-10a",
        question_type: "multiple-choice",
        prompt: "ما الموقع الإعرابي لكلمة «منجاةٌ» في جملة «إنَّ الصدقَ منجاةٌ»؟",
        choices: [
          "خبر إنّ مرفوع وعلامة رفعه الضمة",
          "اسم إنّ مرفوع",
          "فاعل مرفوع",
          "مفعول به منصوب"
        ],
        correct_index: 0,
        explanation: "الحرف الناسخ «إنّ» ينصب المبتدأ ويسمى اسمه (الصدقَ) ويرفع الخبر ويسمى خبره (منجاةٌ).",
        hint: "«إنّ» تنصب الأول وترفع الثاني.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-arab-10b",
        question_type: "multiple-choice",
        prompt: "ما إعراب كلمة «المتفوقُ» في جملة «كُرِّمَ المتفوقُ أمامَ المدرسةِ»؟",
        choices: [
          "نائب فاعل مرفوع بالضمة",
          "مفعول به منصوب",
          "فاعل مرفوع بالضمة",
          "مبتدأ مؤخر"
        ],
        correct_index: 0,
        explanation: "الفعل «كُرِّمَ» مبني للمجهول (ضم أوله وكسر ما قبل آخره)، فينوب المفعول به عن الفاعل ويُرفع نائب فاعل.",
        hint: "هل الفاعل الذي قام بالتكريم مذكور، أم الفعل مبني للمجهول؟",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "مرفوعات الأسماء السبعة", back: "1) المبتدأ 2) الخبر 3) الفاعل 4) نائب الفاعل 5) اسم كان 6) خبر إنّ 7) التابع لمرفوع." },
      { front: "كان وأخواتها مقابل إنّ وأخواتها", back: "كان: ترفع اسمها وتنصب خبرها | إنّ: تنصب اسمها وترفع خبرها." }
    ]
  },
  {
    id: "pack-arab-11",
    lessonSlug: "arab-story-antara",
    trackSlug: "arabic-language",
    subject: "arabic-language",
    contentLanguage: "ar",
    position: 11,
    title: "قصة «أبو الفوارس: عنترة بن شداد» — الأجزاء الأربعة",
    titleAr: "قصة «أبو الفوارس: عنترة بن شداد» — الأجزاء الأربعة",
    titleEn: "The Story: Abu al-Fawaris Antara ibn Shaddad",
    summary:
      "ترسم الفصول الأربعة صراع عنترة بين كفاءته وفروسيته واعتداده بكرامته وبين الحواجز الاجتماعية والنسب والعبودية، وتصاعد الصراع في خطبة عبلة واشتراط المهر الرمزي الصعب وصولًا إلى إثبات الجدارة والوفاء والاعتراف الاجتماعي.",
    formulaOrRule: "الأجزاء الأربعة: 1) البيئة والصراع الداخلي ← 2) أزمة خطبة عبلة ← 3) شروط المهر والامتحان ← 4) الانتصار والوفاء والاعتراف",
    keyConcepts: [
      {
        id: "arab-antara-1",
        title: "تطور الصراع وبناء شخصية عنترة",
        body: "يُرفض عنترة اجتماعيًا لرقّه ونسبه المعلق رغم أنه حامي عبس الأول وشاعرها، وتكشف قصة المهر (النوق العصافير) أن الهدف تعجيزه أو استغلال شجاعته؛ غير أن صبره ووفاءه وإصراره تجعل الكفاءة تتفوق على التمييز.",
        example: "الرمز الاجتماعي للمهر: لا يقاس بثمنه المادي بل كاختبار للجدارة وطلب للاعتراف بحقوقه."
      }
    ],
    workedExamples: [
      {
        problem: "كيف تجيب عن سؤال: «ما أثر العوائق الاجتماعية في مسار عنترة نحو حبه لعبلة»؟",
        steps: [
          "1) صف الفجوة بين مشاعر عنترة وعفة عبلة من جهة، ورفض مالك/القبيلة تزويجه من جهة أخرى.",
          "2) بيّن كيف تحول شرط المهر الصعب من عائق محبط إلى حافز لاختبار الشجاعة والإصرار.",
          "3) استخلص الفكرة العامة: قيمة الإنسان الحقيقية في فعله ووفائه لا في نسبه الموروث وحده."
        ],
        takeaway: "اربط دائمًا الحدث بصفة شخصية ودلالة اجتماعية عند الإجابة عن أسئلة القصة."
      }
    ],
    commonMistakes: [
      "اختزال القصة في المعارك الحربية فقط وإهمال الصراع النفسي والاجتماعي حول الحرية والكرامة والاعتراف."
    ],
    questions: [
      {
        id: "pack-q-arab-11a",
        question_type: "multiple-choice",
        prompt: "ما الدلالة الرمزية لشرط المهر الصعب الذي وُضع أمام عنترة عند خطبته لعبلة؟",
        choices: [
          "اختبار تعجيزي لإثبات الجدارة وطلب الاعتراف بمكانته لا مجرد القيمة المادية",
          "احتفال بسيط تقليدي لا يحمل أي صراع",
          "تخلّي عنترة عن فروسيته وتركه للقبيلة",
          "رغبة القبيلة في تزويجه بسرعة دون شروط"
        ],
        correct_index: 0,
        explanation: "ارتبط شرط المهر برفض الاعتراف الاجتماعي، فأصبح اجتيازه دليلًا على كفاءة عنترة وتفوق قيمته الفعلية على العوائق.",
        hint: "لماذا طلبوا مهرًا نادرًا من بلاد بعيدة ومحفوفة بالمخاطر؟",
        difficulty: "standard"
      },
      {
        id: "pack-q-arab-11b",
        question_type: "multiple-choice",
        prompt: "أي قيم إنسانية تجسدها قصة عنترة في ختام الأجزاء الأربعة؟",
        choices: [
          "أن قيمة الإنسان تُقاس بعزيمته وفعله ووفائه لا بتصنيفه الاجتماعي",
          "أن النسب وحده يغني عن الشجاعة والأخلاق",
          "أن الشعر لا تأثير له في مكانة الفارس",
          "أن الغضب غير المنضبط يحل المشكلات دائمًا"
        ],
        correct_index: 0,
        explanation: "تحمل القصة رسالة إنسانية مفادها أن الاعتراف قد يتأخر، لكن العمل والوفاء وضبط النفس تثبت جدارة المرء.",
        hint: "اختر الفكرة الجامعة بين الشجاعة والكرامة والوفاء.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "طبيعة الصراع في قصة عنترة", back: "صراع بين كفاءته وفروسيته وشاعريته وبين نظرة القبيلة التمييزية للون والنسب والرق." },
      { front: "مفاتيح شخصية عنترة", back: "الشجاعة، عزة النفس، الوفاء الصادق لعبلة، ضبط النفس وقت الحكمة، وإثبات الجدارة بالفعل." }
    ]
  },

  // =========================================================================
  // 4. ENGLISH (ALL 5 EXACT UNITS)
  // =========================================================================
  {
    id: "pack-eng-1",
    lessonSlug: "eng-heritage",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 1,
    title: "Unit 1 — Egypt's Heritage",
    titleAr: "الوحدة ١ — تراث مصر",
    titleEn: "Unit 1 — Egypt's Heritage",
    summary:
      "Covers heritage, civilization, and cultural preservation vocabulary alongside Past Simple (completed past events, used to) vs. Past Continuous (ongoing background actions), keeping while (+ continuous action), when (+ interrupting short action), and during (+ noun phrase) distinct.",
    formulaOrRule: "While + was/were + V-ing | When + Past Simple (interruption) | During + Noun Phrase",
    keyConcepts: [
      {
        id: "eng-u1-1",
        title: "Past Simple vs. Past Continuous & Time Connectors",
        body: "Use Past Simple for finished actions at a stated past time (visited, built) and Past Continuous for background duration interrupted by a short event. Remember: during MUST take a noun ('during the trip'), never a clause!",
        formulaOrRule: "While they were restoring the temple, an archaeologist discovered an inscription.",
        example: "Used to + base verb expresses past habits/states that no longer hold ('Old villages used to rely on wells')."
      }
    ],
    workedExamples: [
      {
        problem: "Choose the correct connector/tense: '_____ our visit to Luxor, I took notes while the guide _____ the carvings.'",
        steps: [
          "1) 'our visit to Luxor' is a noun phrase, so use 'During' (not 'While').",
          "2) 'while' introduces an ongoing background action in the past, requiring Past Continuous: 'was explaining'."
        ],
        takeaway: "During takes a noun; while takes Subject + was/were + V-ing."
      }
    ],
    commonMistakes: [
      "Writing 'During I was reading' instead of 'While I was reading' or 'During my reading'.",
      "Using continuous tenses with stative verbs like know, believe, belong."
    ],
    questions: [
      {
        id: "pack-q-eng-1a",
        question_type: "multiple-choice",
        prompt: "While the team _____ the ancient monument, heavy rain suddenly started.",
        choices: ["was documenting", "documented", "documents", "is documenting"],
        correct_index: 0,
        explanation: "'While' introduces the ongoing background action ('was documenting') interrupted by the sudden Past Simple event ('started').",
        hint: "Which action was already in progress when the rain started?",
        difficulty: "foundational"
      },
      {
        id: "pack-q-eng-1b",
        question_type: "multiple-choice",
        prompt: "Which sentence uses 'during' grammatically correctly?",
        choices: [
          "Many artifacts were catalogued during the summer excavation.",
          "During they excavated the tomb, students watched.",
          "She worked hard during she studied heritage.",
          "During visiting Cairo, they took photos."
        ],
        correct_index: 0,
        explanation: "'During' is a preposition and must be followed by a noun phrase ('the summer excavation'), not a clause or bare -ing clause.",
        hint: "Look for During + Noun Phrase.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "During vs. While", back: "During + Noun phrase ('during the museum tour'); While + Past Continuous ('while we were touring')." },
      { front: "Egypt's Heritage Key Vocabulary", back: "heritage (تراث), civilization (حضارة), monument (معلم تاريخي), preserve (يحافظ), restore (يرمّم), inscription (نقش)." }
    ]
  },
  {
    id: "pack-eng-2",
    lessonSlug: "eng-hands-help",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 2,
    title: "Unit 2 — Hands Help, Hearts Care",
    titleAr: "الوحدة ٢ — أيدٍ تساعد وقلوب ترعى",
    titleEn: "Unit 2 — Hands Help, Hearts Care",
    summary:
      "Focuses on kindness, volunteering, and civic responsibility alongside modal verbs of advice (should/shouldn't), strong internal obligation/prohibition (must/mustn't), external rules (have to/has to), and lack of necessity (don't/doesn't have to).",
    formulaOrRule: "mustn't = PROHIBITED (not allowed) ≠ don't have to = NOT NECESSARY (optional)",
    keyConcepts: [
      {
        id: "eng-u2-1",
        title: "Modals of Obligation vs. Prohibition vs. No Necessity",
        body: "Use 'should' for gentle advice, 'must'/'have to' for duty or rules, 'mustn't' for strict prohibition ('You mustn't share private patient records'), and 'don't/doesn't have to' when something is optional ('You don't have to bring food; just help organize').",
        example: "Descriptive essays on a helpful person follow: Introduction → Actions taken → Effect on others → Personal takeaway."
      }
    ],
    workedExamples: [
      {
        problem: "Contrast: (A) 'You _____ enter this restricted hospital ward.' vs (B) 'You _____ pay to volunteer at the shelter.'",
        steps: [
          "1) Sentence (A) forbids entry for safety/privacy → 'mustn't' (not allowed).",
          "2) Sentence (B) explains volunteering costs no money; paying is unnecessary → 'don't have to'."
        ],
        takeaway: "Never swap 'mustn't' (forbidden) with 'don't have to' (unnecessary) — they reverse meaning!"
      }
    ],
    commonMistakes: [
      "Using 'mustn't' to mean 'you don't need to' — 'mustn't' always forbids."
    ],
    questions: [
      {
        id: "pack-q-eng-2a",
        question_type: "multiple-choice",
        prompt: "Volunteers _____ share any private medical details they hear at the community clinic; it is strictly against the rules.",
        choices: ["mustn't", "don't have to", "should", "need to"],
        correct_index: 0,
        explanation: "'Mustn't' expresses prohibition (not allowed), whereas 'don't have to' merely says it isn't required.",
        hint: "Is sharing private medical data optional or forbidden?",
        difficulty: "foundational"
      },
      {
        id: "pack-q-eng-2b",
        question_type: "multiple-choice",
        prompt: "Joining our clean-up campaign is free—you _____ donate money if you can give your time.",
        choices: ["don't have to", "mustn't", "shouldn't", "can't"],
        correct_index: 0,
        explanation: "'Don't have to' means there is no obligation or necessity to donate money.",
        hint: "Donating money isn't forbidden; it's just not required.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "mustn't vs. don't have to", back: "mustn't = prohibited / forbidden ('You mustn't share private data'); don't have to = optional / unnecessary." },
      { front: "Volunteering Vocabulary", back: "volunteer, charity, donate, community, compassion, emergency, reliable, responsibility." }
    ]
  },
  {
    id: "pack-eng-3",
    lessonSlug: "eng-truth-lies",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 3,
    title: "Unit 3 — Truth vs. Lies",
    titleAr: "الوحدة ٣ — الحقيقة مقابل الأكاذيب",
    titleEn: "Unit 3 — Truth vs. Lies",
    summary:
      "Teaches digital media literacy (claim, source, verify, misleading, bias) and the six-step fact-checking routine alongside Zero (facts), First (real future possibilities), and Second (hypothetical/imaginary) Conditional structures.",
    formulaOrRule: "0: If + Pres, Pres (fact) | 1st: If + Pres, will + base (likely future) | 2nd: If + Past, would + base (hypothetical; use 'were')",
    keyConcepts: [
      {
        id: "eng-u3-1",
        title: "Choosing Zero vs. First vs. Second Conditionals",
        body: "Zero pairs two present simple clauses for timeless facts ('If water reaches 100°C, it boils'). First expresses real future conditions ('If you check the source, you will avoid misinformation'). Second imagines unreal situations ('If I were the editor, I would verify every photo').",
        formulaOrRule: "Never put 'will' or 'would' directly inside the if-clause in standard school grammar!",
        example: "Six-step fact check: check publisher → date/context → corroborate sources → read past headline → inspect image/quote → pause before emotional sharing."
      }
    ],
    workedExamples: [
      {
        problem: "Choose the right conditional: 'If I _____ you, I _____ check the original source before reposting that rumour.'",
        steps: [
          "1) Being someone else is hypothetical/unreal → Second Conditional.",
          "2) Use formal school 'were' in the if-clause and 'would + base verb' in the main clause: 'were ... would check'."
        ],
        takeaway: "Always ask: scientific/routine fact (Zero), realistic future plan (First), or imaginary/advice 'If I were...' (Second)?"
      }
    ],
    commonMistakes: [
      "Writing 'If you will check the source...' instead of keeping Present Simple inside the First-Conditional if-clause."
    ],
    questions: [
      {
        id: "pack-q-eng-3a",
        question_type: "multiple-choice",
        prompt: "If I _____ the newspaper editor, I _____ verify every statistic before publishing the headline.",
        choices: ["were / would", "am / will", "would be / verified", "was / will"],
        correct_index: 0,
        explanation: "In formal Second Conditional hypotheticals, 'If I were...' pairs with 'would + base verb'.",
        hint: "The speaker is imagining holding someone else's job (Second Conditional).",
        difficulty: "foundational"
      },
      {
        id: "pack-q-eng-3b",
        question_type: "multiple-choice",
        prompt: "Which action violates the six-step digital fact-checking routine?",
        choices: [
          "Reposting an alarming headline immediately because it made you angry",
          "Checking who originally published the claim and when",
          "Cross-checking facts across two or more independent sources",
          "Distinguishing factual data from opinion wording"
        ],
        correct_index: 0,
        explanation: "Sharing reactive claims driven by anger, fear, or excitement spreads misinformation without verification.",
        hint: "Spot the emotional reaction vs. verification habits.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "Three Conditionals Summary", back: "Zero: If + Pres, Pres (facts) | 1st: If + Pres, will + V (likely) | 2nd: If + Past, would + V (unreal, 'If I were...')." },
      { front: "Digital Fact-Checking Vocabulary", back: "claim, source, reliable, verify, evidence, rumour, misleading, bias, privacy." }
    ]
  },
  {
    id: "pack-eng-4",
    lessonSlug: "eng-save-shine",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 4,
    title: "Unit 4 — Save and Shine",
    titleAr: "الوحدة ٤ — احفظ وتألق",
    titleEn: "Unit 4 — Save and Shine",
    summary:
      "Covers sustainability and waste reduction (renewable, recycle, emissions, energy-efficient), gerund (-ing) vs. to-infinitive verb patterns—especially the crucial meaning shift in stop/remember/try—and writing formal emails.",
    formulaOrRule: "Gerund: avoid/enjoy/suggest/finish + V-ing | Infinitive: decide/hope/plan/want + to + V | stop doing (quit) ≠ stop to do (pause in order to)",
    keyConcepts: [
      {
        id: "eng-u4-1",
        title: "Gerund vs. Infinitive & Meaning Shifts",
        body: "Verbs like enjoy, avoid, finish, keep, suggest take V-ing ('We should avoid wasting water'). Verbs like decide, hope, plan, promise take to + V ('They decided to organize a clean-up'). Watch 'stop': 'stopped wasting water' = ended the habit; 'stopped to save water' = paused another activity to do it.",
        example: "Formal email parts: Clear short Subject → Dear [Name/Title] → Purpose opening → Body details → Closing next step → Kind regards / Yours sincerely."
      }
    ],
    workedExamples: [
      {
        problem: "Explain the difference between 'She stopped buying plastic bottles' and 'She stopped to buy a reusable bottle'.",
        steps: [
          "1) 'stopped buying' (gerund): she quit the habit of purchasing plastic bottles.",
          "2) 'stopped to buy' (to-infinitive): she paused walking/driving in order to purchase a reusable bottle."
        ],
        takeaway: "With 'stop', V-ing ends an activity while 'to + V' states the purpose for pausing."
      }
    ],
    commonMistakes: [
      "Using 'to + infinitive' after 'avoid', 'enjoy', or 'suggest' (e.g., wrong: 'avoid to waste'; right: 'avoid wasting')."
    ],
    questions: [
      {
        id: "pack-q-eng-4a",
        question_type: "multiple-choice",
        prompt: "Factories must avoid _____ untreated industrial waste into freshwater canals.",
        choices: ["dumping", "to dump", "dump", "dumped"],
        correct_index: 0,
        explanation: "'Avoid' is strictly followed by a gerund (V-ing): 'avoid dumping'.",
        hint: "Remember the gerund group: avoid, enjoy, finish, suggest + V-ing.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-eng-4b",
        question_type: "multiple-choice",
        prompt: "What does 'On her walk home, Nadia stopped to sort the recyclables' mean?",
        choices: [
          "She paused walking in order to sort the recyclables",
          "She permanently gave up sorting recyclables",
          "She never sorted recyclables again",
          "She threw the recyclables into mixed trash"
        ],
        correct_index: 0,
        explanation: "'Stop + to-infinitive' means pausing one action (walking) so you can perform another (sorting).",
        hint: "Did she quit sorting or pause walking for that purpose?",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "stop + V-ing vs. stop + to + V", back: "stop wasting = quit wasting; stop to save = pause another task in order to save." },
      { front: "Formal Email Anatomy", back: "Subject line → Dear [Name/Title] → Clear purpose → Body details/request → Thank you + next step → Kind regards / Yours sincerely." }
    ]
  },
  {
    id: "pack-eng-5",
    lessonSlug: "eng-technology-schools",
    trackSlug: "english",
    subject: "english",
    contentLanguage: "en",
    position: 5,
    title: "Unit 5 — Using Technology at Schools",
    titleAr: "الوحدة ٥ — استخدام التكنولوجيا في المدارس",
    titleEn: "Unit 5 — Using Technology at Schools",
    summary:
      "Explores EdTech, digital dictionaries, and balanced AI use alongside countable vs. uncountable nouns (advice, information, equipment, knowledge) and quantifiers (some, any, much, many, a few/few, a little/little), plus informal friend emails.",
    formulaOrRule: "Uncountables (no plural -s, no a/an): advice, information, equipment, knowledge, homework | Countable: many, a few/few | Uncountable: much, a little/little",
    keyConcepts: [
      {
        id: "eng-u5-1",
        title: "Uncountable Traps & Nuance of a few vs. few / a little vs. little",
        body: "Words like advice, information, homework, and equipment are uncountable in English — write 'a piece of advice' and 'much information', NEVER 'an advice' or 'informations'. Also, 'a few / a little' are positive ('enough to help'), whereas 'few / little' signal scarcity ('almost none').",
        example: "'I downloaded a few useful apps and found some advice, but we have little time left before the exam.'"
      }
    ],
    workedExamples: [
      {
        problem: "Fix the grammar error: 'The AI tutor gave me an useful advice and many informations about pronunciation.'",
        steps: [
          "1) Both 'advice' and 'information' are uncountable nouns.",
          "2) Replace 'an useful advice' with 'some useful advice' or 'a useful piece of advice'.",
          "3) Replace 'many informations' with 'much information' or 'a lot of information'."
        ],
        takeaway: "Use 'piece of' to count uncountable abstract nouns like advice, news, or information."
      }
    ],
    commonMistakes: [
      "Pluralizing uncountable nouns ('advices', 'informations', 'homeworks', 'equipments') or adding 'a/an' directly.",
      "Confusing 'a little' (some small helpful amount) with 'little' (almost none)."
    ],
    questions: [
      {
        id: "pack-q-eng-5a",
        question_type: "multiple-choice",
        prompt: "Our school lab still lacks _____ modern equipment, and we only have _____ minutes to test the app.",
        choices: ["much / a few", "many / a little", "many / little", "some / much"],
        correct_index: 0,
        explanation: "'Equipment' is uncountable (takes 'much' in negative/lacking sense, not 'many'), and 'minutes' is plural countable (takes 'a few').",
        hint: "Check whether 'equipment' and 'minutes' can take plural -s.",
        difficulty: "standard"
      },
      {
        id: "pack-q-eng-5b",
        question_type: "multiple-choice",
        prompt: "Which phrase is grammatically correct in Standard English?",
        choices: [
          "two helpful pieces of advice",
          "two helpful advices",
          "an useful information",
          "many new homeworks"
        ],
        correct_index: 0,
        explanation: "'Advice', 'information', and 'homework' are uncountable and require 'pieces of' rather than plural -s or 'a/an'.",
        hint: "Find the option that uses a partitive expression ('pieces of').",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "Key Uncountable Nouns in Sec. 1", back: "advice, information, knowledge, equipment, homework, news (use singular verb & 'a piece of', never plural -s)." },
      { front: "a few / a little vs. few / little", back: "'a few / a little' = a small positive amount; 'few / little' = hardly any (negative sufficiency nuance)." }
    ]
  },

  // =========================================================================
  // 5. HISTORY (ALL 5 EXACT LESSONS)
  // =========================================================================
  {
    id: "pack-hist-1",
    lessonSlug: "hist-civilization-history",
    trackSlug: "history",
    subject: "history",
    contentLanguage: "ar",
    position: 1,
    title: "الحضارة والتاريخ",
    titleAr: "الحضارة والتاريخ",
    titleEn: "Civilization and History",
    summary:
      "الحضارة ثمرة التفاعل بين الإنسان وبيئته لتحسين ظروف حياته ماديًا (عمران وأدوات) ومعنويًا (قيم وعلوم وفنون) وتنتقل عبر التواصل الحضاري مع احتفاظ كل أمة بهويتها؛ والتاريخ علم يربط الحاضر بالماضي ليستخلص العبر وينمي القدوة والانتماء.",
    formulaOrRule: "الحضارة = مادي (عمران) + معنوي (فكر وأخلاق) | التاريخ = استخلاص العبر + إبراز القدوة + الشعور بالمسؤولية + الابتعاد عن التعصب",
    keyConcepts: [
      {
        id: "hist-c1-1",
        title: "الجانب المادي والمعنوي للحضارة وتواصل الحضارات",
        body: "تبدأ الحضارة بالزراعة والاستقرار وتتكامل فيها المباني والأدوات مع القوانين والآداب والعلوم، ولا تنشأ من عزلة بل بتبادل الخبرات بين الشرق والغرب على مر العصور.",
        example: "التاريخ يعلمنا أن التعدد والتواصل الحضاري مصدر غنى بشرط صون الهوية."
      }
    ],
    workedExamples: [
      {
        problem: "عند المقارنة في التاريخ بين حضارتين أو عصرين، ما المنهج السليم؟",
        steps: [
          "1) حدد معيار مقارنة واضحًا (البناء الإداري، الاقتصاد، النشاط العسكري، أو القيم).",
          "2) قدّم شواهد دقيقة لكل جانب دون تعميم مطلق أو تحيز لجهة دون دليل."
        ],
        takeaway: "معيار المقارنة الواضح يحمي الإجابة من السرد الإنشائي غير المنظم."
      }
    ],
    commonMistakes: [
      "قصر الحضارة على الآثار المبنية وإهمال الجوانب الفكرية والقانونية والأخلاقية."
    ],
    questions: [
      {
        id: "pack-q-hist-1a",
        question_type: "multiple-choice",
        prompt: "ما المعنى الدقيق لانتقال الحضارات عبر التاريخ في منظور الدرس؟",
        choices: [
          "تبادل المنجزات عبر التواصل مع احتفاظ كل حضارة بهويتها الثقافية وخصوصيتها",
          "نسخ حضارة لغيرها وإلغاء لغتها وقيمها تمامًا",
          "بقاء الحضارة محصورة في مكان واحد طوال التاريخ",
          "توقف الإبداع البشري عند قارة واحدة فقط"
        ],
        correct_index: 0,
        explanation: "تنتقل الحضارات كسلسلة تواصل وأخذ وعطاء، مع حفاظ كل حضارة على شخصيتها الثقافية وعقيدتها.",
        hint: "الحضارات تتواصل لا تذوب بلا هوية.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-hist-1b",
        question_type: "multiple-choice",
        prompt: "أي مما يأتي يُعد من الجوانب المعنوية للحضارة؟",
        choices: [
          "القوانين والعلوم والفنون والقيم الأخلاقية",
          "المعابد والأدوات المعدنية والسدود فقط",
          "تربة النهر والهضاب الصخرية",
          "مناجم النحاس الخام غير المصنّعة"
        ],
        correct_index: 0,
        explanation: "الجانب المعنوي يشمل الفكر والعلم والقانون والأدب والقيم، بينما الجانب المادي يشمل العمران والأدوات.",
        hint: "ما يُنتجه العقل والروح والقيم مقابل الأبنية الحجرية.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "مفهوم الحضارة وشقاها", back: "ثمرة مجهود الإنسان مع بيئته؛ لها شق مادي (المباني والأدوات) وشق معنوي (الثقافة والعلوم والقيم)." },
      { front: "أهداف دراسة التاريخ الأربع", back: "استخلاص العبر، إبراز القدوات الصالحة، تنمية الشعور بالمسؤولية، والابتعاد عن التعصب." }
    ]
  },
  {
    id: "pack-hist-2",
    lessonSlug: "hist-sources",
    trackSlug: "history",
    subject: "history",
    contentLanguage: "ar",
    position: 2,
    title: "مصادر دراسة الحضارات",
    titleAr: "مصادر دراسة الحضارات",
    titleEn: "Sources for Studying Civilizations",
    summary:
      "تنقسم المصادر إلى أولية معاصرة للحدث (الآثار، النقوش مثل حجر بالرمو وصلاية نعرمر، البرديات، الأوستراكا، النقود والمسكوكات، كتابات المؤرخين القدماء)، ومصادر ثانوية كُتبت لاحقًا (دراسات حديثة، كتابات الفلاسفة والشعراء والأساطير) وتُدرس بحذر ونقد.",
    formulaOrRule: "مصدر أولي = عاصر الحدث أو قريب منه (نقش/بردية/أوستراكا/نقود) | مصدر ثانوي = استند للأولية أو خيالي/متأخر (كتابات حديثة/أساطير)",
    keyConcepts: [
      {
        id: "hist-c2-1",
        title: "الفرق المنهجي بين الأوستراكا والبردي والنقود والأساطير",
        body: "البرديات كانت غالية الثمن للكتابة الرسمية والطبية (مثل بردية إيبرس)، بينما استخدم عامة الناس الأوستراكا (شقفات الفخار) لوفرتها في الحسابات والرسائل. والنقود تحدد العصور والحالة الاقتصادية — مع ملاحظة عدم وجود نقود مسكوكة في مصر الفرعونية القديمة!",
        example: "دراسة جامعية نُشرت حديثًا عن الملك مينا مصدر ثانوي، أما لوحة/صلاية نعرمر فمصدر أولي."
      }
    ],
    workedExamples: [
      {
        problem: "صنّف: (أ) شقفة فخارية عليها تدريب كتابي من دير المدينة، (ب) كتاب مؤرخ معاصر عام 2020 عن الأهرامات.",
        steps: [
          "1) الشقفة الفخارية (أوستراكا) خُلِّفت مباشرة من الحياة اليومية للمصريين القدماء ← مصدر أولي.",
          "2) كتاب المؤرخ المعاصر أُلف بعد آلاف السنين معتمدًا على آثار سابقة ← مصدر ثانوي (مراجع)."
        ],
        takeaway: "معيار الفصل: المعاصرة للحدث مقابل التأليف اللاحق."
      }
    ],
    commonMistakes: [
      "الاعتقاد أن مصر الفرعونية استخدمت العملات المعدنية المسكوكة — لم تُسك العملات إلا في عصور تالية، وكانت التجارة فرعونيًا بالمقايضة."
    ],
    questions: [
      {
        id: "pack-q-hist-2a",
        question_type: "multiple-choice",
        prompt: "أيّ مما يأتي يُصنّف مصدرًا أوليًا في دراسة الحضارة المصرية القديمة؟",
        choices: [
          "صلاية نعرمر المنقوشة وبردية إيبرس الطبية",
          "مقال تحليلي في مجلة تاريخية معاصرة",
          "رواية أدبية حديثة عن الحياة الفرعونية",
          "موسوعة إلكترونية كُتبت عام 2024"
        ],
        correct_index: 0,
        explanation: "النقوش والبرديات آثار ووثائق صادرة عن العصر المدروس نفسه فهي مصادر أولية.",
        hint: "اختر الأثر أو الوثيقة المعاصرة لفترة الحدث.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-hist-2b",
        question_type: "multiple-choice",
        prompt: "لماذا اعتمدت الطبقتان المتوسطة والفقيرة في مصر القديمة على «الأوستراكا»؟",
        choices: [
          "لأنها متوافرة رخيصة التكلفة مقارنة بأوراق البردي المرتفعة الثمن",
          "لأن البردي لم يُعرف إلا بعد الفتح الروماني",
          "لأن الكتابة على البردي كانت محرمة قانونًا على الكتبة",
          "لأن الفخار كان يذوب في الماء فيسهل محوه"
        ],
        correct_index: 0,
        explanation: "كانت شقفات الفخار والحجارة متاحة مجانًا أو بتكلفة زهيدة بعكس البردي المُكلِف، فاستخدمتها الطبقة الوسطى والفقيرة في الرسائل والتمارين.",
        hint: "قارن التكلفة بين كسر الفخار وبين لفائف البردي.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "المصادر الأولية مقابل الثانوية", back: "الأولية: آثار، نقوش، برديات، أوستراكا، نقود، كتابات مؤرخين قدامى | الثانوية: أبحاث حديثة، أساطير، فلسفة وشعر متأخر." },
      { front: "الأوستراكا", back: "كسرات الفخار والحجارة المكتوب عليها؛ استُخدمت لسهولتها وتوافرها كبديل اقتصادي للبردي." }
    ]
  },
  {
    id: "pack-hist-3",
    lessonSlug: "hist-civilization-factors",
    trackSlug: "history",
    subject: "history",
    contentLanguage: "ar",
    position: 3,
    title: "عوامل قيام الحضارات",
    titleAr: "عوامل قيام الحضارات",
    titleEn: "Factors Behind the Rise of Civilizations",
    summary:
      "تقوم الحضارة بتكامل العوامل الطبيعية (نهر النيل، الموقع الجغرافي المتميز، اعتدال المناخ، الحدود الطبيعية، الثروات المعدنية والصخرية) مع العامل البشري الفاعل: كفاح الإنسان وإرادته وتنظيمه للدولة؛ فلا يصنع النيل حضارة وحده بلا عمل بشري.",
    formulaOrRule: "مقولة هيرودوت «مصر هبة النيل» ناقصة ← الصحيح: مصر هبة النيل والمصريين (تكامل الطبيعي + البشري)",
    keyConcepts: [
      {
        id: "hist-c3-1",
        title: "دور النهر والموقع والمناخ في التفاعل مع كفاح الإنسان",
        body: "جلب النيل الماء والتربة الخصبة وعلم المصريين الوحدة والتضامن والتكافل والتبادل عبر النقل النهري؛ كما جمعت الحدود الطبيعية الآمنة والاستثمار البشري في الصخور والمعادن شروط الاستقرار والإبداع.",
        example: "وجود نهر جارٍ في مناطق أخرى لم ينشئ حضارة بمفرده حين غاب التنظيم البشري والعمل الجماعي."
      }
    ],
    workedExamples: [
      {
        problem: "ناقش نقديًا عبارة «مصر هبة النيل وحده» في ضوء درس عوامل قيام الحضارات.",
        steps: [
          "1) أثبت أهمية النيل كعامل طبيعي للري والنقل والوحدة والتضامن.",
          "2) بيّن أن العوامل الطبيعية كانت خامات ومقومات احتاجت عقل المصري وجهده في شق الترع والسدود وإقامة الدولة المنظمة.",
          "3) استنتج أن التفاعل بين النيل والإنسان المصري هو ما أقام الحضارة."
        ],
        takeaway: "البيئة تمنح الفرص، ولكن إرادة الإنسان وكفاحه هما المحرك الفعلي لصناعة الحضارة."
      }
    ],
    commonMistakes: [
      "الاكتفاء بدور النيل في الحضارة وإغفال دور كفاح الإنسان المصري وتنظيمه الإداري والزراعي."
    ],
    questions: [
      {
        id: "pack-q-hist-3a",
        question_type: "multiple-choice",
        prompt: "أي عبارة تصوّب مقولة هيرودوت «مصر هبة النيل» وفق رؤية التاريخ المنهجية؟",
        choices: [
          "مصر هبة النيل والمصريين معًا، لأن العمل والتنظيم البشري استثمرا النهر",
          "مصر هبة الصحراء وحدها دون أثر للنيل",
          "النيل أنشأ الحضارة تلقائيًا دون جهد الإنسان",
          "العوامل البشرية تغني عن المياه والمناخ دائمًا"
        ],
        correct_index: 0,
        explanation: "لولا كفاح المصريين في شق الترع والتعاون والزراعة لبقي النيل نهرًا جاريًا بلا حضارة.",
        hint: "الحضارة تحتاج تفاعل الطبيعي مع البشري.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-hist-3b",
        question_type: "multiple-choice",
        prompt: "ما القيم الأخلاقية والسياسية المباشرة التي تعلّمها المصريون من جريان نهر النيل وفيضانه؟",
        choices: [
          "الوحدة والتضامن والتكافل والتكامل بين أقاليم الشمال والجنوب",
          "العزلة التامة بين كل قرية وجارتها",
          "إهمال مشروعات الري وتخزين الغلال",
          "الاعتماد على الصيد البحري فقط"
        ],
        correct_index: 0,
        explanation: "ضبط الفيضان وبناء الجسور أوجبا تعاون المصريين وتكافلهم وتوحيد سلطتهم حول النهر.",
        hint: "هل يمكن لقرية بمفردها أن تتحكم في فيضان نهر يمتد على طول البلاد؟",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "عوامل قيام الحضارة المصرية", back: "طبيعية (النيل، الموقع، الثروات، المناخ، الحدود الآمنة) + بشرية (إرادة الإنسان وكفاحه وتنظيم الدولة)." },
      { front: "القيم المكتسبة من النيل", back: "الوحدة والتضامن في ضبط الفيضان، والتكافل في تبادل المحاصيل، والتواصل عبر النقل النهري." }
    ]
  },
  {
    id: "pack-hist-4",
    lessonSlug: "hist-ancient-egypt",
    trackSlug: "history",
    subject: "history",
    contentLanguage: "ar",
    position: 4,
    title: "ملامح من تاريخ مصر القديمة",
    titleAr: "ملامح من تاريخ مصر القديمة",
    titleEn: "Features of Ancient Egyptian History",
    summary:
      "يمر التاريخ الفرعوني (الأسرات 1–30) بعصور القوة والازدهار وعصور الضعف والانتقال: العصر العتيق (توحيد نعرمر/مينا)، الدولة القديمة (بناة الأهرامات وانهيار أول)، الدولة الوسطى (الرخاء الاقتصادي وإعادة التوحيد والهكسوس)، الدولة الحديثة (المجد الحربي والإمبراطورية والإصلاح والتحديات)، والعصر المتأخر.",
    formulaOrRule: "العتيق: نعرمر/مينا وتوحيد القطرين | القديمة: الأهرامات | الوسطى: منتوحتب الثاني والمشاريع الاقتصادية | الحديثة: المجد الحربي وأحمس وتحتمس ورمسيس",
    keyConcepts: [
      {
        id: "hist-c4-1",
        title: "الخط الزمني وربط كل عصر بسمته المميزة",
        body: "يساعد الخط الزمني على عدم الخلط بين المنجزات: العتيق للتوحيد السياسي، والقديمة للاستقرار العمراني والأهرامات، والوسطى للاستقرار والري والاستصلاح، والحديثة للجيش النظامي والإمبراطورية الواسعة ثم العصر المتأخر.",
        example: "دروس عصور الانتقال الأول والثاني: تفكك الإدارة وضعف السلطة يفتح الباب للأزمات أو الغزو الخارجي كالهكسوس."
      }
    ],
    workedExamples: [
      {
        problem: "رتب هذه الملامح زمنيًا من الأقدم إلى الأحدث: (الدولة الوسطى / العصر العتيق وتوحيد نعرمر / الدولة الحديثة / الدولة القديمة).",
        steps: [
          "1) العصر العتيق (الأسرتان 1–2): توحيد القطرين على يد الملك نعرمر (مينا).",
          "2) عصر الدولة القديمة (بناة الأهرامات، 3–6).",
          "3) عصر الدولة الوسطى (الرخاء الاقتصادي، 11–12 بعد إعادة التوحيد).",
          "4) عصر الدولة الحديثة (المجد الحربي، 18–20 بعد طرد الهكسوس)."
        ],
        takeaway: "تذكّر تعاقب: وحدة وتأسيس ← أهرامات ← رخاء وزراعة ← مجد حربي وإمبراطورية."
      }
    ],
    commonMistakes: [
      "الخلط بين عصر الدولة القديمة (الأهرامات) وعصر الدولة الحديثة (المجد الحربي والفتوحات وطرد الهكسوس)."
    ],
    questions: [
      {
        id: "pack-q-hist-4a",
        question_type: "multiple-choice",
        prompt: "بمَ يُعرف عصر الدولة الحديثة (الأسرات 18–20) في تاريخ مصر القديمة؟",
        choices: [
          "عصر المجد الحربي وتكوين الجيش النظامي والإمبراطورية",
          "عصر بناء الأهرامات الكبرى في الجيزة",
          "العصر العتيق الذي شهِد أول توحيد للقطرين",
          "عصر الانتقال الثاني وحكم الهكسوس"
        ],
        correct_index: 0,
        explanation: "بعد طرد الهكسوس على يد أحمس أسست الدولة الحديثة جيشًا قويًا وحققت اتساعًا عسكريًا ودبلوماسيًا كبيرًا.",
        hint: "اذكر منجزات أحمس وتحتمس الثالث ورمسيس الثاني.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-hist-4b",
        question_type: "multiple-choice",
        prompt: "بماذا يُنسب توحيد القطرين وبداية الأسرات المصرية في العصر العتيق؟",
        choices: ["الملك نعرمر (مينا)", "الملك خوفو", "الملك إخناتون", "الملك نخاو الثاني"],
        correct_index: 0,
        explanation: "حقق نعرمر (مينا) الوحدة السياسية للبلاد قرابة 3200 ق.م واتخذ من نفر (منف) قاعدة لوحدة القطرين.",
        hint: "مُوثّق على صلاية شهيرة من مصادر التاريخ الأولية.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "سمات العصور التاريخية الثلاثة الكبرى", back: "القديمة: بناة الأهرامات | الوسطى: الرخاء الاقتصادي ومشروعات الري | الحديثة: المجد الحربي والإمبراطورية." },
      { front: "دلالة عصور الانتقال", back: "فترات ضعف سلطة المركزية وتفكك إداري سبقت كل نهضة وإعادة توحيد." }
    ]
  },
  {
    id: "pack-hist-5",
    lessonSlug: "hist-economy",
    trackSlug: "history",
    subject: "history",
    contentLanguage: "ar",
    position: 5,
    title: "الحياة الاقتصادية في مصر القديمة",
    titleAr: "الحياة الاقتصادية في مصر القديمة",
    titleEn: "The Economy of Ancient Egypt",
    summary:
      "ارتكز اقتصاد مصر على الزراعة المرتبطة بمواسم النيل (الفيضان، البذر، الحصاد) وإدارة الدولة للري والمخازن، إلى جانب الصيد وتربية الحيوان والصناعات الحرفية المتقنة (البردي والزجاج والفخار والكتان والتعدين)، والتجارة الداخلية عبر النيل والخارجية والرحلات الاستكشافية كرحلة نخاو الثاني.",
    formulaOrRule: "الزراعة (نيل + مواسم + صوامع) + الحرف (بردي/زجاج/كتان/معادن) + التجارة (مقايضة داخلية وبعثات نيلية وبحرية)",
    keyConcepts: [
      {
        id: "hist-c5-1",
        title: "الزراعة ودور الدولة والصناعات والتجارة",
        body: "نظّمت الدولة السدود والترع ومقياس النيل وصوامع الغلال لمواجهة سنوات الجفاف. وبرع المصريون في استثمار البردي للقوارب والحبال والورق، وسبقوا في صناعة الزجاج من الرمل النقي والكتان في النسيج، مع تنظيم بعثات تجارية لبلاد بونت وإفريقيا والمتوسط.",
        example: "أرسل الملك نخاو الثاني في العصر المتأخر رحلة للدوران حول إفريقيا بالاستعانة ببحارة فينيقيين لتنشيط الاستكشاف والتجارة."
      }
    ],
    workedExamples: [
      {
        problem: "بيّن دور الدولة المصرية القديمة في حماية الاقتصاد الزراعي ومواجهة الأزمات.",
        steps: [
          "1) حفر الترع وإقامة السدود (مثل سد اللاهون) ومراقبة مناسيب الفيضان.",
          "2) إنشاء المخازن والصوامع لتخزين الحبوب وتوزيعها وقت انخفاض النيل.",
          "3) تنظيم الضرائب العادلة وتوفير الأمن لطرق النقل النهرية والبرية."
        ],
        takeaway: "الاقتصاد القديم لم يكن فرديًا عشوائيًا بل مدعومًا بتخطيط مركزي للبنية المائية والمخازن."
      }
    ],
    commonMistakes: [
      "الظن أن التجارة القديمة اعتمدت على العملات المعدنية — كانت التجارة المصرية تقوم على المقايضة بالمحاصيل والسلع."
    ],
    questions: [
      {
        id: "pack-q-hist-5a",
        question_type: "multiple-choice",
        prompt: "كيف ساعد نهر النيل على ازدهار التجارة الداخلية في مصر القديمة؟",
        choices: [
          "كان شريان النقل الرئيس الذي ربط قرى ومدن الشمال بالجنوب بسهولة",
          "منع قيام أي تبادل تجاري بين الأقاليم",
          "استخدموه للتجارة مع أمريكا الجنوبية",
          "اقتصر أثره على الزراعة دون الملاحة"
        ],
        correct_index: 0,
        explanation: "تسهيل الملاحة النيلية بالتيار شمالًا والرياح السائدة جنوبًا جعل النيل أفضل طريق لنقل السلع والغلال.",
        hint: "الرياح الشمالية تدفع الأشرعة جنوبًا وتيار النيل يحمل السفن شمالًا!",
        difficulty: "foundational"
      },
      {
        id: "pack-q-hist-5b",
        question_type: "multiple-choice",
        prompt: "أي الملوك يُنسب إليه تنظيم بعثة الدوران حول قارة إفريقيا في العصر المتأخر؟",
        choices: ["نخاو الثاني", "أحمس الأول", "منقرع", "توت عنخ آمون"],
        correct_index: 0,
        explanation: "كلف الملك نخاو الثاني (الأسرة 26) بحارة فينيقيين بالدوران حول إفريقيا انطلاقًا من البحر الأحمر والعودة من البحر المتوسط.",
        hint: "من ملوك الأسرة السادسة والعشرين في العصر المتأخر.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "مكونات الاقتصاد المصري القديم", back: "الزراعة (بفضل النيل والصوامع)، تربية الحيوان والصيد، الصناعات (البردي والزجاج والكتان والمعادن)، والتجارة (مقايضة وبعثات)." },
      { front: "البعثات البحرية في عهد نخاو الثاني", back: "رحلة استكشافية وتجارية حول إفريقيا انطلقت من البحر الأحمر وعادت عبر المتوسط." }
    ]
  },

  // =========================================================================
  // 6. PHILOSOPHY & LOGIC (ALL 5 UNITS, MARKING #5 AS EXTRA REVIEW)
  // =========================================================================
  {
    id: "pack-phil-1",
    lessonSlug: "phil-human-thinking",
    trackSlug: "philosophy-logic",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    position: 1,
    title: "التفكير الإنساني",
    titleAr: "التفكير الإنساني",
    titleEn: "Human Thinking",
    summary:
      "التفكير نشاط عقلي يربط الخبرات والملاحظات للوصول لحكم أو حل؛ ويميز المنهج وظائفه وأساليبه الأربعة (الخرافي، الديني، الفلسفي، العلمي)، مع التفريق التكاملي بين التفكير الناقد (فحص الأدلة) والتفكير الإبداعي (الطلاقة والمرونة والأصالة والتطوير).",
    formulaOrRule: "4 أساليب: خرافي (علل وهمية) | ديني (إيمان وهداية) | فلسفي (تأمل كلي وتساؤل) | علمي (ملاحظة وفرض وتجربة) • الإبداع يقترح والنقد يفحص",
    keyConcepts: [
      {
        id: "phil-c1-1",
        title: "الأساليب الأربعة وعدم الخلط بين البراهين",
        body: "يُفسر الخرافي الأحداث بقوى خفية بلا دليل قابل للاختبار؛ وينطلق الديني من الإيمان؛ ويبحث الفلسفي في العلل الكلية والمبادئ الأولى؛ بينما يختبر العلمي الفروض بالملاحظة والتجربة والقابلية للمراجعة.",
        example: "عند مرض طفل: الذهاب لطبيب أسلوب علمي، والتمائم أسلوب خرافي، والدعاء مع العلاج أسلوب ديني متزن."
      },
      {
        id: "phil-c1-2",
        title: "التفكير الناقد والتفكير الإبداعي",
        body: "التفكير الإبداعي يولّد حلولًا جديدة بالجمع بين الطلاقة والمرونة والأصالة والتفاصيل، ثم يأتي التفكير الناقد ليميز الحقيقة من الرأي ويفحص المصادر ويكشف التناقض ويختار الحل الأقوى.",
        example: "العملية المتكاملة: ابدأ بالعصف الذهني الإبداعي ثم قم بالتمحيص النقدي."
      }
    ],
    workedExamples: [
      {
        problem: "حلل موقفين: الأول يرجع سبب تأخر المطر لتشاؤم من عدد، والثاني يراجع بيانات الأرصاد والضغط الجوي.",
        steps: [
          "1) الموقف الأول يربط النتيجة بسبب غير منطقي لا يقوم عليه دليل قابل للاختبار ← أسلوب خرافي.",
          "2) الموقف الثاني يعتمد الملاحظة وجمع البيانات وتفسير الأسباب المباشرة ← أسلوب علمي."
        ],
        takeaway: "اسأل دومًا: ما نوع التعليل المستخدم؟ أهو خرافي وهمي، أم تجريبي، أم فلسفي كلي؟"
      }
    ],
    commonMistakes: [
      "الخلط بين الأسلوب الفلسفي (التأمل العقلي الكلي) والأسلوب العلمي (البحث التجريبي في العلل القريبة الجزئية).",
      "عدّ التفكير الإبداعي مجرد خيال عشوائي؛ الإبداع المنتج يجتمع مع الملاءمة والفحص النقدي."
    ],
    questions: [
      {
        id: "pack-q-phil-1a",
        question_type: "multiple-choice",
        prompt: "عزَا شخص مرضه المفاجئ إلى خرزة مكسورة بدل زيارة الطبيب. أي أسلوب تفكير يُمثله هذا الموقف؟",
        choices: ["الأسلوب الخرافي", "الأسلوب العلمي", "الأسلوب الفلسفي", "التفكير الناقد"],
        correct_index: 0,
        explanation: "التفسير بقوى وهمية أو ربطات سحرية لا تقوم على دليل قابل للاختبار سمة الأسلوب الخرافي.",
        hint: "الأسباب هنا ساذجة وغير خاضعة للتجربة أو البرهان.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-phil-1b",
        question_type: "multiple-choice",
        prompt: "كيف يتكامل التفكير الإبداعي والتفكير الناقد في حل المشكلات؟",
        choices: [
          "الإبداع يقترح بدائل جديدة ومبتكرة، والنقد يفحص مصداقيتها وأدلتها ليختار الأقوى",
          "النقد يمنع ظهور أي أفكار جديدة تمامًا",
          "الإبداع يكتفي بتكرار الحلول المألوفة فقط",
          "لا صلة بين التفكير الناقد ومهارات حل المشكلات"
        ],
        correct_index: 0,
        explanation: "التفكير الإبداعي ينتج البدائل (طلاقة ومرونة وأصالة) والتفكير الناقد يمحص الأدلة ويكشف التناقض قبل التنفيذ.",
        hint: "التوليد أولًا ثم التقييم والفحص.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "الأساليب الأربعة للتفكير", back: "الخرافي (علل وهمية ساذجة)، الديني (القدرة الإلهية والهداية)، الفلسفي (التأمل الكلي العقلي)، العلمي (التجربة والعلل القريبة)." },
      { front: "عناصر التفكير الإبداعي", back: "الطلاقة (كثرة الأفكار)، المرونة (تنوع الزوايا)، الأصالة (الجدة)، والتطوير/الإفاضة." }
    ]
  },
  {
    id: "pack-phil-2",
    lessonSlug: "phil-philosophical-stance",
    trackSlug: "philosophy-logic",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    position: 2,
    title: "الفلسفة وطبيعة الموقف الفلسفي",
    titleAr: "الفلسفة وطبيعة الموقف الفلسفي",
    titleEn: "Philosophy and the Nature of the Philosophical Stance",
    summary:
      "الفلسفة لغةً «محبة الحكمة»، وتبحث في مباحث الوجود والمعرفة والقيم والمنطق والسياسة والجمال لتكوين عقل ناقد مستقل؛ والموقف الفلسفي نظرة متسائلة تتسم بالدهشة والتساؤل والشك المنهجي والحوار والتسامح الفكري في مواجهة التعصب وضغط الجماعة.",
    formulaOrRule: "الشك المنهجي = تعليق الحكم مؤقتًا لفحص الأدلة (وسيلة للوصول لليقين) ≠ الشك المطلق أو الإنكار الدائم",
    keyConcepts: [
      {
        id: "phil-c2-1",
        title: "الشك المنهجي مقابل الإنكار والتعصب",
        body: "الفيلسوف لا يحفظ آراء السابقين كمسلّمات بل يتساءل ويميز بين الرأي العابر والحقيقة المؤيدة بدليل. والشك المنهجي خطوة مؤقتة لفرز الصواب لا غاية للعدمية؛ وأكبر تحدياته التعصب والانصياع للشائعات والضغط الاجتماعي.",
        example: "الشك عند الغزالي وديكارت كان طريقًا للوصول إلى اليقين لا إنكار الحقيقة."
      }
    ],
    workedExamples: [
      {
        problem: "افحص الادعاء: «كل من يختلف مع رأيي فهو مخطئ حتمًا» في ضوء خصائص الموقف الفلسفي.",
        steps: [
          "1) هذا الادعاء يخلط الرأي الشخصي بالحقيقة المطلقة ويتنافى مع التسامح الفكري.",
          "2) الفحص الفلسفي يسأل: ما الدليل؟ وهل عُرض رأي الآخر بموضوعية؟ وهل توجد أمثلة مضادة؟",
          "3) الخلاصة: الاختلاف يستدعي الحوار وفحص الأسباب لا التكذيب المسبق."
        ],
        takeaway: "التسامح الفكري يعني الاستعداد لتعديل الرأي إذا ظهر دليل أقوى."
      }
    ],
    commonMistakes: [
      "اختزال دراسة الفلسفة في حفظ أسماء الفلاسفة وآرائهم بدل ممارسة التساؤل وفحص الحجج.",
      "الخلط بين الشك المنهجي المؤقت والإنكار المطلق."
    ],
    questions: [
      {
        id: "pack-q-phil-2a",
        question_type: "multiple-choice",
        prompt: "ما الفرق بين «الشك المنهجي» والشك المذهبي أو الإنكار المطلق؟",
        choices: [
          "الشك المنهجي يعلق الحكم مؤقتًا لفحص الأدلة والوصول إلى اليقين، أما الإنكار المطلق فيجعل الشك غاية دائمة",
          "الشك المنهجي يرفض كل حقيقة علمية إلى الأبد",
          "لا يوجد فرق؛ فكلاهما يمنع البحث العلمي",
          "الشك المنهجي يعني اتباع الشائعات دون مراجعة"
        ],
        correct_index: 0,
        explanation: "الشك المنهجي أداة بحث لتصفية الآراء حتى يقوم البرهان السليم على اليقين.",
        hint: "هل الشك المنهجي وسيلة أم نهاية؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-phil-2b",
        question_type: "multiple-choice",
        prompt: "أي المباحث الفلسفية يدرس مصادر معرفتنا وحدود قدرتنا على التثبت من الصدق؟",
        choices: ["مبحث المعرفة (الإبستمولوجيا)", "مبحث الجمال", "علم العروض الشعري", "مبحث الطبيعيات الميكانيكية"],
        correct_index: 0,
        explanation: "مباحث الفلسفة الكبرى: الوجود (الأنطولوجيا)، المعرفة (الإبستمولوجيا)، والقيم (الأكسيولوجيا: حق وخير وجمال).",
        hint: "اختر المبحث المتصل بكيفية المعرفة ومصادرها.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "خصائص الموقف الفلسفي", back: "الدهشة، التساؤل الدقيق، الشك المنهجي، النقد، الحوار، التسامح الفكري، والتركيب العقلي." },
      { front: "مباحث الفلسفة الثلاثة الكبرى", back: "الوجود (طبيعة الواقع)، المعرفة (كيف نعرف وحدودها)، القيم (الحق والخير والجمال)." }
    ]
  },
  {
    id: "pack-phil-3",
    lessonSlug: "phil-logic-terms-propositions",
    trackSlug: "philosophy-logic",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    position: 3,
    title: "مبادئ المنطق — الحدود والقضايا",
    titleAr: "مبادئ المنطق — الحدود والقضايا",
    titleEn: "Principles of Logic — Terms and Propositions",
    summary:
      "يدرس المنطق قواعد التفكير السليم ويكشف أخطاءه الذاتية والاجتماعية واللغوية والمعرفية؛ ويفرّق بين الحد (المفهوم والماصدق والعلاقة العكسية بينهما)، والكليات الخمس، والقضايا الخبرية وتصنيفها الرباعي: A (كلية موجبة)، E (كلية سالبة)، I (جزئية موجبة)، O (جزئية سالبة).",
    formulaOrRule: "كلما زادت صفات المفهوم ← ضاق الماصدق (علاقة عكسية) | A: كلية موجبة (الموضوع مستغرق) • E: كلية سالبة (كلاهما) • I: جزئية موجبة (لا شيء) • O: جزئية سالبة (المحمول)",
    keyConcepts: [
      {
        id: "phil-c3-1",
        title: "المفهوم والماصدق والقضايا الحملية الأربع",
        body: "المفهوم هو الصفات التي يفهمها الذهن من الحد، والماصدق هو الأفراد الذين ينطبق عليهم في الواقع؛ فـ«طالب» أوسع ماصدقًا من «طالب أولى ثانوي متفوق». والقضية قول خبري يحتمل الصدق أو الكذب (على خلاف الأمر والاستفهام)، وتصنف بالكم والكيف إلى A, E, I, O.",
        formulaOrRule: "توزيع/استغراق الحدود: الكلي يستغرق الموضوع؛ السالب يستغرق المحمول!",
        example: "«بعض المدن ليست ساحلية» ← جزئية (بعض) سالبة (ليست) ← قضية من النوع O، والمحمول مستغرق."
      }
    ],
    workedExamples: [
      {
        problem: "صنّف القضية: «بعض المدارس ليست متخصصة في اللغات» وحدد الحدود المستغرقة فيها.",
        steps: [
          "1) السور «بعض» يفيد الجزئية، والأداة «ليست» تفيد السلب ← قضية جزئية سالبة (O).",
          "2) القاعدة: الجزئية لا تستغرق الموضوع (بعض المدارس)؛ والسلب يستغرق المحمول (متخصصة في اللغات).",
          "3) إذن الموضوع غير مستغرق والمحمول مستغرق."
        ],
        takeaway: "احفظ القاعدة الذهبية: الكليات تستغرق الموضوع، والسالبة تستغرق المحمول."
      }
    ],
    commonMistakes: [
      "الظن أن جملة الاستفهام أو الأمر «اكتب واجبك!» تعد قضية منطقية — هي إنشاء لا يُحكم عليه بالصدق أو الكذب.",
      "الخلط بين الاستغراق في القضية A (الموضوع فقط) والقضية O (المحمول فقط)."
    ],
    questions: [
      {
        id: "pack-q-phil-3a",
        question_type: "multiple-choice",
        prompt: "إذا أضفنا صفة «المجيد للرياضيات» إلى مفهوم كلمة «طالب»، فماذا يحدث لماصدق هذا الحد؟",
        choices: [
          "يضيق الماصدق (يقل عدد الأفراد الذين ينطبق عليهم الحد)",
          "يتسع الماصدق ليشمل جميع البشر",
          "يبقى الماصدق ثابتًا تمامًا",
          "يتحول الحد إلى قضية إنشاء"
        ],
        correct_index: 0,
        explanation: "العلاقة بين المفهوم والماصدق عكسية: كلما زادت صفات المفهوم قَلّت الأفراد الداخلة في ماصدقه.",
        hint: "هل عدد «الطلاب المجيدين للرياضيات» أكثر أم أقل من عدد «الطلاب» عمومًا؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-phil-3b",
        question_type: "multiple-choice",
        prompt: "ما تصنيف القضية «كل الأنهار الجارية ليست مالحة» أو «لا نهر مالح» وماذا تستغرق؟",
        choices: [
          "كلية سالبة (E) وتستغرق الموضوع والمحمول معًا",
          "كلية موجبة (A) وتستغرق الموضوع فقط",
          "جزئية موجبة (I) ولا تستغرق أي حد",
          "جزئية سالبة (O) وتستغرق المحمول فقط"
        ],
        correct_index: 0,
        explanation: "الكلية السالبة (E) تفصل فئة الموضوع كلها عن فئة المحمول كلها، فتستغرق كليهما.",
        hint: "استحضر القاعدة: كلي يأخذ الموضوع، وسالب يأخذ المحمول.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "قاعدة الاستغراق في القضايا الأربع", back: "A (ك.م): الموضوع فقط | E (ك.س): الموضوع والمحمول | I (ج.م): لا أحد | O (ج.س): المحمول فقط." },
      { front: "المفهوم مقابل الماصدق", back: "المفهوم = الصفات الذهنية؛ الماصدق = الأفراد الواقعيون، والعلاقة بينهما عكسية." }
    ]
  },
  {
    id: "pack-phil-4",
    lessonSlug: "phil-inference",
    trackSlug: "philosophy-logic",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    position: 4,
    title: "الاستدلال — تعريفه وأنواعه",
    titleAr: "الاستدلال — تعريفه وأنواعه",
    titleEn: "Inference — Definition and Types",
    summary:
      "الاستدلال انتقال عقلي من مقدمات إلى نتيجة تلزم عنها، وينقسم إلى استدلال مباشر (من قضية واحدة كالتقابل) وغير مباشر (القياس من مقدمتين وثلاثة حدود: أكبر، أصغر، وأوسط). ويميز المنطق بين صحة الصورة المنطقية وصدق المقدمات الواقعي.",
    formulaOrRule: "القياس = مقدمة كبرى + مقدمة صغرى ← نتيجة | الحد الأوسط يربط المقدمتين ويغيب في النتيجة | صحة الصورة ≠ صدق الواقع!",
    keyConcepts: [
      {
        id: "phil-c4-1",
        title: "القياس الصوري والتمييز بين الصدق والصحة",
        body: "يكون الاستدلال الاستنباطي صحيحًا (صوريًا) إذا لزمت النتيجة عن المقدمات حتمًا بصرف النظر عن مطابقتها للواقع؛ وقد تكون المقدمات كاذبة في الواقع لكن الحجة صحيحة صوريًا، كما أن صدق النتيجة واقعيًا لا يثبت صحة صورة الاستدلال إن كان الربط فاسدًا.",
        formulaOrRule: "الحد الأوسط: يجب أن يأتي بمعنى واحد في المقدمتين وأن يكون مستغرقًا في إحداهما على الأقل",
        example: "كل المعادن توصل الكهرباء؛ النحاس معدن ← النحاس يوصل الكهرباء (الحد الأوسط: معدن)."
      }
    ],
    workedExamples: [
      {
        problem: "استخرج الحدود الثلاثة والمقدمات في: «كل الفاكهة نبات؛ والتفاح فاكهة؛ إذن التفاح نبات».",
        steps: [
          "1) المقدمة الكبرى: كل الفاكهة نبات (الحد الأكبر: نبات).",
          "2) المقدمة الصغرى: التفاح فاكهة (الحد الأصغر: التفاح).",
          "3) الحد الأوسط: «فاكهة» يظهر في المقدمتين للربط ويختفي من النتيجة: «التفاح نبات»."
        ],
        takeaway: "موضوع النتيجة دائمًا هو الحد الأصغر، ومحمول النتيجة هو الحد الأكبر."
      }
    ],
    commonMistakes: [
      "الاعتقاد أن مجرد صدق النتيجة في الواقع يعني صحة القياس المنطقي أو تجاهل خطأ التبديل في الحد الأوسط."
    ],
    questions: [
      {
        id: "pack-q-phil-4a",
        question_type: "multiple-choice",
        prompt: "أين يقع «الحد الأوسط» في القياس الصحيح وكيف يظهر في النتيجة؟",
        choices: [
          "يوجد في المقدمتين الكبرى والصغرى للربط بينهما ولا يظهر في النتيجة",
          "يظهر في النتيجة وحدها دون المقدمات",
          "يكون هو نفسه موضوع النتيجة دائمًا",
          "يتغير معناه بين المقدمة الأولى والثانية"
        ],
        correct_index: 0,
        explanation: "مهمة الحد الأوسط وصل الحد الأصغر بالأكبر عبر المقدمتين ثم الاختفاء تمامًا من النتيجة.",
        hint: "هل ترى كلمة «معدن» في نتيجة «إذن النحاس يوصل الكهرباء»؟",
        difficulty: "foundational"
      },
      {
        id: "pack-q-phil-4b",
        question_type: "multiple-choice",
        prompt: "أي عبارة تصوغ القاعدة المنطقية الدقيقة بشأن الحجة الاستنباطية؟",
        choices: [
          "صحة الحجة تعني لزوم النتيجة من المقدمات صوريًا، وقد يختلف ذلك عن صدق المقدمات واقعيًا",
          "كل نتيجة صادقة في الواقع تثبت أن القياس صحيح دائمًا",
          "المنطق يدرس الحقيقة الكيميائية وحدها",
          "الاستدلال المباشر يتطلب ثلاث مقدمات على الأقل"
        ],
        correct_index: 0,
        explanation: "الصحة (Validity) علاقة صورة بين المقدمات والنتيجة، أما الصدق والبطلان فيتعلقان بمطابقة القضية للواقع.",
        hint: "فرّق بين صحة الصورة الشكلية للحجة وبين صدق القضايا في الواقع.",
        difficulty: "standard"
      }
    ],
    cards: [
      { front: "أقسام الحدود الثلاثة في القياس", back: "الحد الأصغر (موضوع النتيجة)، الحد الأكبر (محمول النتيجة)، الحد الأوسط (يربط المقدمتين ويغيب في النتيجة)." },
      { front: "صحة الصورة مقابل الصدق الواقعي", back: "الصحة تعني التزام النتيجة بالمقدمات منطقيًا؛ وقد تصح الصورة رغم كذب مقدمة في الواقع." }
    ]
  },
  {
    id: "pack-phil-5",
    lessonSlug: "phil-extra-review",
    trackSlug: "philosophy-logic",
    subject: "philosophy-logic",
    contentLanguage: "ar",
    position: 5,
    title: "مراجعة إضافية — ليست درسًا رسميًا",
    titleAr: "مراجعة إضافية — ليست درسًا رسميًا",
    titleEn: "Additional Review — Not an Official Lesson",
    isExtraReview: true,
    summary:
      "تنبيه منهجي: يحتوي فهرس الفلسفة والمنطق لأولى ثانوي على أربعة دروس رسمية فقط، وهذه الوحدة مراجعة تركيبية إضافية غير مقررة كدرس مستقل؛ تجمع بين خريطة الفكر الإنساني والموقف الفلسفي وقواعد القضايا والقياس، وتقدم قالب الإجابة المقالية النموذجي.",
    formulaOrRule: "تنبيه: ليست درسًا رسميًا • قالب المقال الفلسفي: 1) تعريف ← 2) شرح الفكرة ← 3) مثال واقعي ← 4) نتيجة أو مقارنة",
    keyConcepts: [
      {
        id: "phil-c5-1",
        title: "الربط الكلي للدروس الأربعة وقالب الإجابة المقالية",
        body: "التفكير الجيد ينطلق من بيانات موثوقة، والفلسفة تحلل المفاهيم وتفحص المسلمات بشك منهجي، والمنطق يختبر صورة الحجج عبر الحدود والقضايا والقياس. وفي الامتحان المقالي التزم بخطوات: تعريف المفهوم ثم الشرح ثم مثال دقيق ثم استنتاج.",
        example: "لا تخلط هذه المراجعة الإضافية بدرس خامس مستقل عند المذاكرة."
      }
    ],
    workedExamples: [
      {
        problem: "طبّق قالب المقال المقترح على سؤال: «دلّل على أهمية التفكير الناقد للطالب».",
        steps: [
          "1) التعريف: قدرة عقلية على فحص المعلومات والحجج وتمييز الحقيقة من الرأي.",
          "2) الشرح: يحمي من التضليل والانفعال والتعصب ويقيس الأدلة قبل القبول.",
          "3) المثال: التحقق من مصدر خبر دراسي قبل نشره أو الاعتماد عليه.",
          "4) النتيجة: قرارات مسؤولة واستقلال فكري."
        ],
        takeaway: "البناء الرباعي (تعريف ← شرح ← مثال ← نتيجة) يمنح المقالي وضوحًا كاملًا."
      }
    ],
    commonMistakes: [
      "التعامل مع وحدة المراجعة الإضافية كدرس رسمي خامس في المنهج المقرر."
    ],
    questions: [
      {
        id: "pack-q-phil-5a",
        question_type: "multiple-choice",
        prompt: "ما الترتيب الموصى به في دليل المنهج لكتابة إجابة مقالية متقنة في الفلسفة؟",
        choices: [
          "تعريف المفهوم ← شرح الفكرة ← مثال تطبيقي ← نتيجة أو مقارنة",
          "ذكر مثال عشوائي دون تعريف أو ربط",
          "نقل سؤال الاختبار كما هو مع علامة تعجب",
          "تعداد أسماء الفلاسفة دون تفسير الفكرة"
        ],
        correct_index: 0,
        explanation: "يساعد القالب المنظم (تعريف ثم شرح ثم مثال ثم استنتاج) على تغطية جميع نقاط التقييم المقالي.",
        hint: "من المفهوم العام إلى الشرح فالمثال ثم الخلاصة.",
        difficulty: "foundational"
      },
      {
        id: "pack-q-phil-5b",
        question_type: "multiple-choice",
        prompt: "ما التنبيه المنهجي الخاص بالوحدة الخامسة «مراجعة إضافية» في مادة الفلسفة والمنطق؟",
        choices: [
          "إنها مراجعة إضافية للربط بين الدروس الأربعة الرسمية وليست درسًا رسميًا مستقلًا",
          "إنها أطول درس إجباري في المنهج وتلغي الدروس الأربعة السابقة",
          "إنها خاصة فقط بالرياضيات والفيزياء",
          "تقتصر على حفظ تواريخ غير مرتبطة بالتفكير"
        ],
        correct_index: 0,
        explanation: "الفهرس الرسمي للصف الأول الثانوي في الفلسفة والمنطق أربعة دروس، وهذه الوحدة تجميع ومراجعة تطبيقية مساندة فقط.",
        hint: "انظر إلى وصف الوحدة في العنوان.",
        difficulty: "foundational"
      }
    ],
    cards: [
      { front: "تنبيه الفهرس الرسمي للفلسفة", back: "أربعة دروس رسمية فقط (التفكير الإنساني، الموقف الفلسفي، الحدود والقضايا، الاستدلال) والوحدة الخامسة مراجعة إضافية." },
      { front: "قالب الإجابة المقالية في الفلسفة", back: "1) تعريف دقيق ← 2) شرح الفكرة ← 3) مثال واقعي ← 4) نتيجة أو مقارنة." }
    ]
  }
];

/**
 * Effective pack list: each Renaissance pack replaces the legacy pack with the same `id`;
 * Renaissance packs with a brand-new `id` (e.g. respiratory and motion pathways) are appended.
 */
function mergeRenaissancePacks(
  legacy: readonly CanonicalLessonStudyPack[],
  renaissance: readonly CanonicalLessonStudyPack[],
): CanonicalLessonStudyPack[] {
  const byId = new Map(renaissance.map((pack) => [pack.id, pack] as const));
  const merged = legacy.map((pack) => byId.get(pack.id) ?? pack);
  const legacyIds = new Set(legacy.map((pack) => pack.id));
  for (const pack of renaissance) {
    if (!legacyIds.has(pack.id)) merged.push(pack);
  }
  return merged;
}

export const ALL_LESSON_STUDY_PACKS: CanonicalLessonStudyPack[] = mergeRenaissancePacks(
  LEGACY_LESSON_STUDY_PACKS,
  RENAISSANCE_LESSON_STUDY_PACKS,
);

const PACKS_BY_TRACK = new Map<string, CanonicalLessonStudyPack[]>();
for (const pack of ALL_LESSON_STUDY_PACKS) {
  const existing = PACKS_BY_TRACK.get(pack.trackSlug) ?? [];
  existing.push(pack);
  existing.sort((a, b) => a.position - b.position);
  PACKS_BY_TRACK.set(pack.trackSlug, existing);
}

const PACKS_BY_LESSON_LANG = new Map<string, CanonicalLessonStudyPack>();
for (const pack of ALL_LESSON_STUDY_PACKS) {
  PACKS_BY_LESSON_LANG.set(`${pack.lessonSlug}::${pack.contentLanguage}`, pack);
}

export function getTrackLessonStudyPacks(trackSlug: string): CanonicalLessonStudyPack[] {
  const direct = PACKS_BY_TRACK.get(trackSlug);
  if (direct && direct.length > 0) return direct;
  const normalized = trackSlug.replace(/^(arabic-language|english|history|philosophy-logic)-(ar|en)$/, "$1");
  return PACKS_BY_TRACK.get(normalized) ?? [];
}

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Candidate pack keys for a DB lesson slug: exact, then without the `-en` translation-track suffix. */
function slugCandidates(lessonSlug: string): string[] {
  const clean = lessonSlug.trim();
  if (!clean || UUID_LIKE.test(clean)) return [];
  const withoutEn = clean.replace(/-en$/i, "");
  return withoutEn === clean ? [clean] : [clean, withoutEn];
}

/**
 * Resolve the canonical pack for a real `lessons.slug`. DB English clones are stored as
 * `<slug>-en`; packs are keyed by the base slug plus content language. UUIDs never match
 * (callers must pass `lessons.slug`), so a wrong-lesson pack can never be returned.
 */
export function getLessonStudyPack(
  lessonSlug?: string | null,
  contentLanguage?: ContentLanguage
): CanonicalLessonStudyPack | null {
  if (!lessonSlug) return null;
  const candidates = slugCandidates(lessonSlug);
  if (candidates.length === 0) return null;
  if (contentLanguage) {
    for (const key of candidates) {
      const exact = PACKS_BY_LESSON_LANG.get(`${key}::${contentLanguage}`);
      if (exact) return exact;
    }
  }
  for (const key of candidates) {
    const any = ALL_LESSON_STUDY_PACKS.find((pack) => pack.lessonSlug === key);
    if (any) return any;
  }
  return null;
}

export function findPackQuestionById(questionId: string): CuratedStudyQuestion | null {
  for (const pack of ALL_LESSON_STUDY_PACKS) {
    const hit = pack.questions.find((q) => q.id === questionId);
    if (hit) return hit;
  }
  return null;
}
