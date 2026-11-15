import type { CanonicalLessonStudyPack } from "../pack-types";

export const INTEGRATED_SCIENCE_PACKS: CanonicalLessonStudyPack[] = [
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
    hook: "رغم أن الماء يغطي قرابة $70.7\\%$ من سطح الكوكب، فإن الماء العذب السائل المتاح للحياة اليومية لا يمثل سوى قطرة صغيرة مقارنة بمخزون الجليد والمحيطات.",
    summary:
      "يشكّل الغلاف المائي نظامًا مترابطًا يدور فيه الماء باستمرار بين المحيطات والغلاف الجوي واليابسة والكائنات الحية دون زيادة أو نقصان في كتلته الكلية على الكوكب.",
    formulaOrRule: "نسبة المسطحات المائية $\\approx 70.7\\%$ — مياه مالحة $\\approx 97\\%$ مقابل مياه عذبة $\\approx 3\\%$",
    keyConcepts: [
      {
        id: "sci-hydro-ar-1",
        stage: "foundation",
        title: "خريطة توزيع المياه على كوكب الأرض",
        body: "يُصنّف الماء في الغلاف المائي إلى مياه مالحة في البحار والمحيطات ($\\approx 97\\%$) ومياه عذبة ($\\approx 3\\%$)، يتركز معظمها في الأنهار الجليدية والقمم القطبية والمياه الجوفية العميقة، بينما تشكل الأنهار والبحيرات العذبة نسبة ضئيلة للغاية.",
        formulaOrRule: "$\\text{المياه الكلية} = 97\\% \\text{ مالحة} + 3\\% \\text{ عذبة}$",
        example: "مياه الأنهار كالنيل تمثل جزءًا يسيرًا من الـ $3\\%$ العذبة، لكنها شريان الشرب والزراعة.",
        blocks: [
          {
            blockId: "sci-h-ar-1a",
            type: "explanation",
            content: "تغطي المياه قرابة $70.7\\%$ من مساحة سطح الأرض، وتتوزع بين خزانات مالحة وخزانات عذبة متفاوتة سهولة الوصول والتجدد.",
          },
          {
            blockId: "sci-h-ar-1b",
            type: "math",
            tex: "\\text{المياه العذبة السطحية السائلة} \\ll 3\\%\\text{ (أغلبها جليديات ومياه جوفية)}",
            caption: "توزيع المخزون المائي",
          },
          {
            blockId: "sci-h-ar-1c",
            type: "callout",
            variant: "tip",
            title: "العلاقة بين الأغلفة الأربعة",
            content: "يتفاعل الغلاف المائي مباشرة مع الغلاف الجوي (بخار ومطر)، والغلاف الصخري (تعرية وترشيح جوفي)، والغلاف الحيوي (امتصاص الجذور وعملية النتح).",
          },
        ],
      },
      {
        id: "sci-hydro-ar-2",
        stage: "mechanism",
        title: "محركات دورة الماء الفيزيائية والحيوية",
        body: "ترفع الطاقة الشمسية الماء من المسطحات عبر التبخر الفيزيائي، ومن ثغور النباتات عبر النتح الحيوي، ثم يتكثف البخار في طبقات الجو الباردة ويهطل ليتوزع بين الجريان السطحي والتسرب إلى الخزانات الجوفية.",
        blocks: [
          {
            blockId: "sci-h-ar-2a",
            type: "explanation",
            content: "تعمل الشمس والجاذبية كمحركين متكاملين لدورة الماء: فالإشعاع الشمسي يرفع بخار الماء لأعلى عبر التبخر والنتح، والجاذبية تُسقط المطر وتُسيّر الأنهار وتُرشّح المياه داخل الصخور النفاذة.",
          },
          {
            blockId: "sci-h-ar-2b",
            type: "callout",
            variant: "note",
            title: "زمن مكوث المياه الجوفية",
            content: "تتجدد مياه الأنهار خلال أيام أو أسابيع، بينما تتحرك المياه الجوفية ببطء شديد عبر مسام الصخور؛ لذا يستمر تلوث الخزان الجوفي سنوات طويلة.",
          },
        ],
      },
      {
        id: "sci-hydro-ar-3",
        stage: "application",
        title: "النظام البيئي المائي: عوامل حيوية ولا حيوية",
        body: "يتزن النظام البيئي المائي بتكامل العوامل الحيوية (منتجات، مستهلكات، محللات) مع العوامل اللاحيوية مثل نفاذية الضوء والأكسجين المذاب والملوحة ودرجة الحموضة $\\mathrm{pH}$.",
        blocks: [
          {
            blockId: "sci-h-ar-3a",
            type: "explanation",
            content: "أي اختلال في عامل لاحيوي — كارتفاع درجة حرارة النهر أو زيادة الأسمدة النتراتية — يقلل الأكسجين المذاب ويهدد السلسلة الغذائية داخل الماء.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "تتبع مسار قطرة مطر في حوض تصريف نهري",
        problem: "تتبع رحلة قطرة مطر سقطت على مرتفع صخري نفاذ يطل على وادٍ زراعي ومجرى نهري.",
        steps: [
          "١) ينقسم السقوط عند السطح إلى جريان سطحي يتجه بسرعة نحو النهر، وتسرب بطيء عبر المسام الصخرية إلى الخزان الجوفي.",
          "٢) تمتص جذور النباتات رطوبة التربة فترتفع العصارة في الخشب ثم تتبخر عبر الثغور بعملية النتح.",
          "٣) يرتفع بخار الماء الناتج عن التبخر والنتح فيتكثف مكونًا السحب، ثم يعود بالهطول لتكتمل دورة مغلقة الكتلة مفتوحة الطاقة.",
        ],
        takeaway: "دورة الماء لا تخلق ماءً جديدًا بل تعيد توزيع المخزون المائي وتنقيته طبيعيًا مع انتقال الطاقة الشمسية.",
      },
    ],
    commonMistakes: [
      "الاعتقاد أن معظم المياه العذبة يوجد في الأنهار؛ الصحيح أن النسبة العظمى محبوسة في الجليديات والمياه الجوفية.",
      "اختزال دورة الماء في التبخر والهطول فقط وإغفال النتح النباتي والتسرب الجوفي والجريان السطحي.",
      "تسوية سرعة تطهير النهر بسرعة تطهير الخزان الجوفي رغم البطء الشديد في حركة المياه الجوفية.",
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
          "في البحار والمحيطات قليلة الملوحة",
        ],
        correct_index: 0,
        explanation:
          "تشكل المياه العذبة نحو $3\\%$ من ماء الأرض، ويتركز معظمها في الأنهار الجليدية والمياه الجوفية العميقة وليس في الأنهار السطحية.",
        hint: "قارن بين حجم الأنهار المتدفقة وحجم الكتل الجليدية القطبية.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-ar-1b",
        question_type: "multiple-choice",
        prompt: "أي عملية تضيف بخار ماء إلى الغلاف الجوي مباشرة من الكائنات الحية المنتجة؟",
        choices: [
          "التبخر الفيزيائي من البحار",
          "النتح من ثغور أوراق النباتات",
          "التكثف حول نويات الغبار",
          "التسرب نحو الصخور النفاذة",
        ],
        correct_index: 1,
        explanation:
          "النتح هو فقدان النبات لبخار الماء عبر الثغور، وهو المسار الحيوي الموازي للتبخر الفيزيائي من المسطحات.",
        hint: "اختر العملية التي تربط الغلاف الحيوي بالغلاف الجوي.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-ar-1c",
        question_type: "multiple-choice",
        prompt: "لماذا يؤدي تلوث طبقة طمي نفاذة فوق خزان جوفي إلى أثر طويل المدى مقارنة بمجرى نهري سريع؟",
        choices: [
          "لأن حركة المياه الجوفية وتجددها بطيئة جدًا مقارنة بسرعة تجدد مياه الأنهار",
          "لأن المياه الجوفية لا تذيب أي أملاح أو غازات نهائيًا",
          "لأن النهر يتبخر بالكامل كل أسبوع",
          "لأن الصخور الجوفية تمنع انتقال الماء إلى الجذور",
        ],
        correct_index: 0,
        explanation:
          "طول زمن مكوث المياه الجوفية وبطء حركتها يجعل تشتت الملوثات فيها يحتاج سنوات أو عقودًا مقارنة بجريان الأنهار.",
        hint: "قارن معدل استبدال المياه في الخزان الجوفي بمعدل الجريان في النهر.",
        difficulty: "challenging",
      },
    ],
    cards: [
      {
        front: "توزيع المياه في الغلاف المائي",
        back: "تغطي المياه $\\approx 70.7\\%$ من سطح الأرض: نحو $97\\%$ مياه مالحة و$3\\%$ مياه عذبة أغلبها جليديات ومياه جوفية.",
        hint: "تذكر النسبة: $97\\%$ مقابل $3\\%$",
      },
      {
        front: "عملية النتح",
        back: "خروج بخار الماء عبر ثغور الأوراق النباتية؛ يسحب العصارة بالخشب ويبرد الورقة ويغذي السحب.",
      },
      {
        front: "النتيجة البيئية لتغير عامل لاحيوي",
        back: "تغير الحرارة أو $\\mathrm{pH}$ أو الأكسجين المذاب ينعكس مباشرة على تنوع الأسماك والعوالق في النظام المائي.",
      },
    ],
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
    hook: "لو كان جزيء الماء $\\mathrm{H_2O}$ خطيًا بزاوية $180^{\\circ}$ لانعدمت قطبيته ولتبخر في درجة حرارة الغرفة؛ انحناؤه عند $104.5^{\\circ}$ هو سر الحياة السائلة على الأرض.",
    summary:
      "يرتبط الأكسجين والهيدروجين في $\\mathrm{H_2O}$ برابطتين تساهميتين قطبيتين بزاوية $104.5^{\\circ}$ فتنشأ روابط هيدروجينية بين الجزيئات، تحكم سلوك الذوبان وتميؤ الأملاح والرقم الهيدروجيني $\\mathrm{pH}$.",
    formulaOrRule: "جزيء $\\mathrm{H_2O}$: زاوية $104.5^{\\circ}$، قطبية $\\delta^-$ على $\\mathrm{O}$ و$\\delta^+$ على $\\mathrm{H}$",
    keyConcepts: [
      {
        id: "sci-chem-ar-1",
        stage: "foundation",
        title: "الهندسة المنحنية والقطبية الكهربائية",
        body: "تجذب ذرة الأكسجين إلكترونات الرابطة التساهمية بقوة أكبر من الهيدروجين فتظهر شحنة جزئية سالبة $\\delta^-$ على الأكسجين وشحنة جزئية موجبة $\\delta^+$ على ذرتي الهيدروجين، وبفعل زوجَي الإلكترونات الحرين تنضغط الزاوية إلى $\\approx 104.5^{\\circ}$.",
        blocks: [
          {
            blockId: "sci-c-ar-1a",
            type: "chemistry",
            equation: "\\mathrm{H^{\\delta+}-O^{\\delta-}-H^{\\delta+}} \\quad (\\theta \\approx 104.5^{\\circ})", tex: "\\mathrm{H^{\\delta+}-O^{\\delta-}-H^{\\delta+}} \\quad (\\theta \\approx 104.5^{\\circ})",
            caption: "البنية القطبية لجزيء الماء",
          },
          {
            blockId: "sci-c-ar-1b",
            type: "callout",
            variant: "pitfall",
            title: "تمييز حاسم: الرابطة التساهمية أم الهيدروجينية؟",
            content: "الرابطة التساهمية تربط $\\mathrm{O}$ و$\\mathrm{H}$ داخل الجزيء الواحد، أما الرابطة الهيدروجينية فتربط جزيء ماء بجزيء آخر مجاور؛ وعند الغليان تنكسر الهيدروجينية فقط ويبقى بخار $\\mathrm{H_2O}$ متماسكًا.",
          },
        ],
      },
      {
        id: "sci-chem-ar-2",
        stage: "mechanism",
        title: "التميؤ الملحي وتوازن الأيونات",
        body: "عند ذوبان ملح مشتق من حمض قوي وقاعدة قوية مثل $\\mathrm{NaCl}$ يظل الماء متعادلًا ($\\mathrm{pH} \\approx 7$)، بينما يتميأ الأيون الضعيف في أملاح مثل $\\mathrm{NH_4Cl}$ (حمضي) و$\\mathrm{NaHCO_3}$ (قاعدي).",
        blocks: [
          {
            blockId: "sci-c-ar-2a",
            type: "chemistry",
            equation: "\\mathrm{NaCl(s)} \\xrightarrow{\\mathrm{H_2O}} \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (\\mathrm{pH} = 7)", tex: "\\mathrm{NaCl(s)} \\xrightarrow{\\mathrm{H_2O}} \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (\\mathrm{pH} = 7)",
            caption: "ذوبان متعادل لملح قوي الشقين",
          },
          {
            blockId: "sci-c-ar-2b",
            type: "explanation",
            content: "أما $\\mathrm{NH_4Cl}$ (حمض قوي + قاعدة ضعيفة) فترتفع فيه نسبة $\\mathrm{H_3O^+}$ فيصبح المحلول حمضيًا ($\\mathrm{pH} < 7$)، بينما يرفع $\\mathrm{NaHCO_3}$ أيونات الهيدروكسيد $\\mathrm{OH^-}$ ليصبح قاعديًا ($\\mathrm{pH} > 7$).",
          },
        ],
      },
      {
        id: "sci-chem-ar-3",
        stage: "application",
        title: "مقياس $\\mathrm{pH}$ وسلامة الأنظمة المائية",
        body: "يمتد مقياس $\\mathrm{pH}$ من $0$ إلى $14$: القيم الأقل من $7$ حمضية، والمساوية لـ $7$ متعادلة، والأكبر من $7$ قاعدية، وكل تغير بمقدار وحدة واحدة يعني تضاعفًا بمقدار عشر مرات في تركيز أيونات الهيدروجين.",
        blocks: [
          {
            blockId: "sci-c-ar-3a",
            type: "math",
            tex: "\\mathrm{pH} < 7 \\text{ (حمضي)} \\qquad \\mathrm{pH} = 7 \\text{ (متعادل)} \\qquad \\mathrm{pH} > 7 \\text{ (قاعدي)}",
            caption: "تصنيف المحاليل المائية",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "تفسير أثر قيم pH المختلفة على الحياة المائية",
        problem: "رتب ثلاث عينات مائية قيم $\\mathrm{pH}$ لها: (أ: $3.5$، ب: $7.0$، جـ: $9.2$) وحدد صلاحيتها للأسماك.",
        steps: [
          "١) العينة (أ = $3.5$): حمضية مرتفعة؛ تضر خياشيم الأسماك وتذيب المعادن الثقيلة السامة من الرواسب.",
          "٢) العينة (ب = $7.0$): متعادلة تمامًا حيث يتساوى تركيز $\\mathrm{H^+}$ مع $\\mathrm{OH^-}$ وتلائم الأنظمة العذبة.",
          "٣) العينة (جـ = $9.2$): قاعدية مرتفعة تتجاوز المدى الآمن لمعظم الأسماك ($6.5$ إلى $8.5$).",
        ],
        takeaway: "مقياس $\\mathrm{pH}$ لوغاريتمي؛ فالفرق بين $7.0$ و$4.0$ يساوي $10^3 = 1000$ ضعفًا في الحمضية.",
      },
    ],
    commonMistakes: [
      "الخلط بين الرابطة التساهمية داخل جزيء $\\mathrm{H_2O}$ والرابطة الهيدروجينية بين الجزيئات.",
      "الظن أن غليان الماء يفصل الماء إلى غازي $\\mathrm{H_2}$ و$\\mathrm{O_2}$ — الغليان تغير فيزيائي يفكك التجاذب بين الجزيئات فقط.",
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
          "الروابط الفلزية بين ذرات الهيدروجين",
        ],
        correct_index: 0,
        explanation: "التبخير يفصل الجزيئات عن بعضها بكسر التجاذب الهيدروجيني دون تفكيك الجزيء $\\mathrm{H_2O}$.",
        hint: "هل ينتج عن غليان الماء غاز هيدروجين وأكسجين أم بخار ماء؟",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-ar-2b",
        question_type: "multiple-choice",
        prompt: "ما قيمة الزاوية التقريبية بين رابطتي $\\mathrm{O-H}$ في جزيء الماء المنحني؟",
        choices: ["$90^{\\circ}$", "$104.5^{\\circ}$", "$120^{\\circ}$", "$180^{\\circ}$"],
        correct_index: 1,
        explanation: "وجود زوجين غير رابطين من الإلكترونات على الأكسجين يضغط الزاوية إلى $\\approx 104.5^{\\circ}$.",
        hint: "لو كانت $180^{\\circ}$ لكان الجزيء خطيًا متماثلًا غير قطبي.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-ar-2c",
        question_type: "multiple-choice",
        prompt: "أي ملح يعطي محلولًا مائيًا متعادلًا ($\\mathrm{pH} \\approx 7$) عند إذابته في الماء المقطر؟",
        choices: [
          "كلوريد الصوديوم $\\mathrm{NaCl}$",
          "بيكربونات الصوديوم $\\mathrm{NaHCO_3}$",
          "كلوريد الأمونيوم $\\mathrm{NH_4Cl}$",
          "أسيتات الصوديوم $\\mathrm{CH_3COONa}$",
        ],
        correct_index: 0,
        explanation: "الملح $\\mathrm{NaCl}$ ناتج من حمض قوي $\\mathrm{HCl}$ وقاعدة قوية $\\mathrm{NaOH}$ فلا يتميأ أيوناه.",
        hint: "اختر الملح المشتق من حمض قوي وقاعدة قوية معًا.",
        difficulty: "challenging",
      },
    ],
    cards: [
      {
        front: "قطبية جزيء $\\mathrm{H_2O}$",
        back: "جزيء منحني الزاوية ($\\approx 104.5^{\\circ}$) يحمل فيه الأكسجين شحنة جزئية سالبة $\\delta^-$ والهيدروجين $\\delta^+$.",
      },
      {
        front: "تميؤ الأملاح",
        back: "$\\mathrm{NaCl}$ متعادل ($\\mathrm{pH}=7$)، و$\\mathrm{NH_4Cl}$ حمضي، و$\\mathrm{NaHCO_3}$ قاعدي.",
      },
      {
        front: "معنى تغير درجة pH بمقدار 2",
        back: "يعني تغير تركيز أيونات الهيدروجين $10^2 = 100$ مرة لأن المقياس لوغاريتمي عشري.",
      },
    ],
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
    hook: "بينما تغوص معظم السوائل عند تجمدها، يتمدد الماء دون $4^{\\circ}\\text{C}$ ليطفو الجليد كبطانية عازلة تحفظ حياة البحيرات القطبية.",
    summary:
      "يصل الماء النقي إلى أقصى كثافة عند $4^{\\circ}\\text{C}$، وتمنحه حرارته النوعية العالية ($c \\approx 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$) استقرارًا حراريًا فريدًا في البحار وأجسام الكائنات.",
    formulaOrRule: "$\\rho = \\frac{m}{V}$ وأقصى كثافة عند $4^{\\circ}\\text{C}$، والحرارة النوعية $Q = m c \\Delta T$",
    keyConcepts: [
      {
        id: "sci-phys-ar-1",
        stage: "foundation",
        title: "الكثافة وشذوذ تمدد الماء دون $4^{\\circ}\\text{C}$",
        body: "عند تبريد الماء من $4^{\\circ}\\text{C}$ إلى $0^{\\circ}\\text{C}$ تصطف الجزيئات عبر الروابط الهيدروجينية في شبكة سداسية مفتوحة ذات فراغات أكبر، فيزداد الحجم وتنخفض الكثافة ويطفو الجليد فوق الماء الدافئ نسبيًا عند القاع.",
        blocks: [
          {
            blockId: "sci-p-ar-1a",
            type: "math",
            tex: "\\rho_{\\text{ice}}(0^{\\circ}\\text{C}) < \\rho_{\\text{water}}(4^{\\circ}\\text{C}) \\approx 1000\\text{ kg/m}^3",
            caption: "شذوذ كثافة الماء",
          },
          {
            blockId: "sci-p-ar-1b",
            type: "callout",
            variant: "tip",
            title: "الهيدروميتر وكثافة المحاليل",
            content: "يقيس الهيدروميتر الكثافة النسبية للسوائل: كلما ارتفعت كثافة الماء بالملوحة زادت قوة الطفو فقلّ الجزء المغمور من الهيدروميتر.",
          },
        ],
      },
      {
        id: "sci-phys-ar-2",
        stage: "mechanism",
        title: "الحرارة النوعية المرتفعة ومعادلة الطاقة الحرارية",
        body: "يستطيع الماء امتصاص طاقة حرارية ضخمة مقابل ارتفاع طفيف في درجة حرارته لأن جزءًا كبيرًا من الطاقة يُصرف أولًا في إضعاف الروابط الهيدروجينية قبل زيادة طاقة حركة الجزيئات.",
        blocks: [
          {
            blockId: "sci-p-ar-2a",
            type: "math",
            tex: "Q = m \\cdot c \\cdot \\Delta T \\quad \\left(c_{\\mathrm{H_2O}} \\approx 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}\\right)",
            caption: "معادلة الحرارة المكتسبة أو المفقودة",
          },
        ],
      },
      {
        id: "sci-phys-ar-3",
        stage: "application",
        title: "الاعتدال المناخي بين السواحل والصحارى",
        body: "بفضل الحرارة النوعية المرتفعة للماء تسخن المحيطات وتبرد ببطء، فتحافظ المدن الساحلية على مدى حراري نهاري وليلي معتدل مقارنة بالمناطق الصحراوية الداخلية.",
        blocks: [
          {
            blockId: "sci-p-ar-3a",
            type: "explanation",
            content: "نفس المبدأ يحمي خلايا جسم الإنسان — التي يتجاوز الماء $60\\%$ من كتلتها — من التقلبات الحرارية المفاجئة أثناء المجهود أو تغير الطقس.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب الطاقة الحرارية اللازمة لتسخين كتلة ماء",
        problem: "احسب كمية الحرارة $Q$ اللازمة لرفع درجة حرارة $2\\text{ kg}$ من الماء من $20^{\\circ}\\text{C}$ إلى $35^{\\circ}\\text{C}$ علمًا بأن $c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$.",
        steps: [
          "١) احسب التغير في درجة الحرارة: $\\Delta T = 35 - 20 = 15^{\\circ}\\text{C}$.",
          "٢) عوّض في المعادلة: $Q = m \\cdot c \\cdot \\Delta T = 2 \\times 4200 \\times 15$.",
          "٣) الناتج النهائي: $Q = 126\\,000\\text{ J} = 126\\text{ kJ}$.",
        ],
        takeaway: "تأكد دائمًا من وحدة الكتلة بالكيلوجرام قبل ضربها في $c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$.",
      },
    ],
    commonMistakes: [
      "الاعتقاد أن الماء يستمر في الانكماش عند التبريد حتى $0^{\\circ}\\text{C}$؛ الحقيقة أنه يتمدد بين $4^{\\circ}\\text{C}$ و$0^{\\circ}\\text{C}$.",
      "الخلط بين غطس الهيدروميتر وكثافة السائل: يطفو الهيدروميتر أكثر (غطس أقل) في السوائل الأكثر كثافة مثل الماء المالح.",
    ],
    questions: [
      {
        id: "pack-q-sci-ar-3a",
        question_type: "multiple-choice",
        prompt: "عند أي درجة حرارة يبلغ الماء النقي أقصى كثافة له؟",
        choices: ["$0^{\\circ}\\text{C}$", "$4^{\\circ}\\text{C}$", "$25^{\\circ}\\text{C}$", "$100^{\\circ}\\text{C}$"],
        correct_index: 1,
        explanation: "عند $4^{\\circ}\\text{C}$ تقترب الجزيئات قبل بدء الشبكة السداسية الواسعة التي تكوّن الجليد عند $0^{\\circ}\\text{C}$.",
        hint: "هي درجة حرارة قاع البحيرة المتجمد السطح.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-ar-3b",
        question_type: "multiple-choice",
        prompt: "نُقلت طاقة حرارية مقدارها $42\\,000\\text{ J}$ إلى $1\\text{ kg}$ من الماء ($c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$). ما الزيادة $\\Delta T$؟",
        choices: ["$5^{\\circ}\\text{C}$", "$10^{\\circ}\\text{C}$", "$20^{\\circ}\\text{C}$", "$42^{\\circ}\\text{C}$"],
        correct_index: 1,
        explanation: "$\\Delta T = \\frac{Q}{m \\cdot c} = \\frac{42000}{1 \\times 4200} = 10^{\\circ}\\text{C}$.",
        hint: "اقسم الطاقة $Q$ على حاصل ضرب الكتلة في الحرارة النوعية.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-ar-3c",
        question_type: "multiple-choice",
        prompt: "وُضع هيدروميتر في ماء عذب ثم نُقل إلى ماء بحر شديد الملوحة عند الحرارة نفسها. ماذا يحدث للجزء المغمور؟",
        choices: [
          "يغوص أعمق لأن الملوحة تقلل الدفع",
          "يرتفع أكثر فيطفو بجزء مغمور أقل لأن كثافة الماء المالح أعلى",
          "يبقى المغمور ثابتًا تمامًا",
          "يغرق إلى القاع فورًا",
        ],
        correct_index: 1,
        explanation: "السائل الأعلى كثافة يحقق قوة طفو مساوية للوزن بإزاحة حجم أصغر، لذا يرتفع الهيدروميتر للأعلى.",
        hint: "كلما زادت الكثافة قل الحجم اللازم إزاحته لتحقيق الطفو.",
        difficulty: "challenging",
      },
    ],
    cards: [
      {
        front: "شذوذ كثافة الماء عند $4^{\\circ}\\text{C}$",
        back: "تبلغ كثافة الماء ذروتها عند $4^{\\circ}\\text{C}$ ثم يتمدد بتكوّن حلقات سداسية مفتوحة حتى $0^{\\circ}\\text{C}$ فيطفو الجليد.",
      },
      {
        front: "معادلة الطاقة الحرارية النوعية",
        back: "$Q = m \\cdot c \\cdot \\Delta T$ حيث $c_{\\mathrm{H_2O}} \\approx 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$.",
      },
      {
        front: "قاعدة الهيدروميتر",
        back: "يزداد عمق انغماره في السوائل الأقل كثافة ويقل انغماره في السوائل عالية الكثافة.",
      },
    ],
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
    hook: "إضافة الملح لا تغيّر طعم الماء فقط؛ بل تؤخر تجمده تحت الصفر، وترفع غليانه فوق المئة، وتحدد اتجاه تدفق الماء داخل كل خلية حية.",
    summary:
      "تتغير الخواص الجمعية للمحلول المائي تبعًا لعدد جسيمات المذاب الكلي، بينما تحكم الأسموزية انتقال الماء عبر الأغشية ويتدرج امتصاص الضوء مع عمق البحر.",
    formulaOrRule: "زيادة جسيمات المذاب $\\Rightarrow$ انخفاض الضغط البخاري والتجمد، وارتفاع الغليان والضغط الأسموزي",
    keyConcepts: [
      {
        id: "sci-sol-ar-1",
        stage: "foundation",
        title: "الخواص الجمعية وعدد الجسيمات المذابة",
        body: "تعتمد الخواص الجمعية الأربعة على عدد مولات الجسيمات المنطلقة في المحلول لا نوعها؛ فملح $\\mathrm{NaCl}$ يتأين إلى $\\mathrm{Na^+}$ و$\\mathrm{Cl^-}$ (أيونيْن مقابل جزيء واحد من السكر).",
        blocks: [
          {
            blockId: "sci-s-ar-1a",
            type: "chemistry",
            equation: "\\mathrm{NaCl(s)} \\rightarrow \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (i \\approx 2 \\text{ جسيمات})", tex: "\\mathrm{NaCl(s)} \\rightarrow \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (i \\approx 2 \\text{ جسيمات})",
            caption: "مقارنة التفكك الأيوني بالجزيئي",
          },
          {
            blockId: "sci-s-ar-1b",
            type: "callout",
            variant: "tip",
            title: "اتجاه التغير في الخواص الأربع",
            content: "إضافة المذاب تخفض الضغط البخاري ودرجة التجمد (تحت $0^{\\circ}\\text{C}$)، وترفع درجة الغليان (فوق $100^{\\circ}\\text{C}$) والضغط الأسموزي.",
          },
        ],
      },
      {
        id: "sci-sol-ar-2",
        stage: "mechanism",
        title: "الخاصية الأسموزية والاتزان الخلوي",
        body: "عبر غشاء شبه منفذ، تندفع جزيئات الماء من المحلول الأقل تركيزًا للمذاب (الأعلى تركيزًا للماء) نحو المحلول الأعلى تركيزًا للمذاب لمعادلة التركيزين.",
        blocks: [
          {
            blockId: "sci-s-ar-2a",
            type: "explanation",
            content: "عند وضع خلية نباتية في محلول ملحي مركز يندفع الماء من فجوتها للخارج فتنكمش (بلزمة)، أما في ماء مقطر فينتفخ الغشاء وتزداد صلابة الخلية.",
          },
        ],
      },
      {
        id: "sci-sol-ar-3",
        stage: "application",
        title: "نفاذ ألوان الطيف في الأعماق المائية",
        body: "تمتص المياه السطحية الضحلة الأطوال الموجية الطويلة كالأحمر وتحت الحمراء سريعًا، بينما تنفذ الأطوال الموجية القصيرة كالأزرق والأخضر لأعماق أكبر لدعم الطحالب والشعاب المرجانية.",
        blocks: [
          {
            blockId: "sci-s-ar-3a",
            type: "explanation",
            content: "لذلك يزدهر التمثيل الضوئي في المنطقة المضيئة العلوية، وتتلون الطحالب الحمراء بأصباغ تستغل الضوء الأزرق العميق.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "مقارنة التجمد بين الماء النقي وماء البحر",
        problem: "لماذا يتجمد ماء البحر عند درجة حرارة أقل من $0^{\\circ}\\text{C}$ بينما يتجمد الماء المقطر عند $0^{\\circ}\\text{C}$؟",
        steps: [
          "١) يحتوي ماء البحر أيونات ذائبة مثل $\\mathrm{Na^+}$ و$\\mathrm{Cl^-}$ تتجاذب مع جزيئات الماء القطبية.",
          "٢) تعترض هذه الأيونات اصطفاف جزيئات $\\mathrm{H_2O}$ في البلورة السداسية المنتظمة للثلج.",
          "٣) لذلك يلزم خفض الحرارة دون الصفر المئوي حتى تتكون بلورات الجليد (انخفاض درجة التجمد).",
        ],
        takeaway: "ذوبان الأملاح يوسع مدى الحالة السائلة للماء بخفض التجمد ورفع الغليان.",
      },
    ],
    commonMistakes: [
      "عكس اتجاه الأسموزية: يتحرك الماء دائمًا نحو الوسط الأعلى تركيزًا للمذاب، لا العكس.",
      "مساواة محلول $1\\text{ M}$ سكر بمحلول $1\\text{ M}$ ملح طعام $\\mathrm{NaCl}$؛ الأخير ينتج ضعف عدد الجسيمات تقريبًا.",
    ],
    questions: [
      {
        id: "pack-q-sci-ar-4a",
        question_type: "multiple-choice",
        prompt: "في أي اتجاه ينتقل الماء عبر غشاء شبه منفذ أثناء الخاصية الأسموزية؟",
        choices: [
          "من المحلول الأقل تركيزًا للمذاب إلى المحلول الأعلى تركيزًا للمذاب",
          "من المحلول الأعلى تركيزًا للمذاب إلى المحلول الأقل تركيزًا للمذاب",
          "يتحرك المذاب وحده دائمًا ويتوقف الماء",
          "ينتقل من الملح الصلب إلى الماء النقي",
        ],
        correct_index: 0,
        explanation: "ينتقل الماء من الوسط المخفف ذي الجهد المائي الأعلى لتخفيف المحلول المركز.",
        hint: "يتجه الماء دائمًا نحو الجانب الأكثر ملوحة أو تركيزًا.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-ar-4b",
        question_type: "multiple-choice",
        prompt: "ماذا يحدث لدرجة الغليان والضغط البخاري عند إذابة ملح طعام $\\mathrm{NaCl}$ في ماء نقي؟",
        choices: [
          "تزداد درجة الغليان وينخفض الضغط البخاري",
          "تنخفض درجة الغليان ويرتفع الضغط البخاري",
          "ينخفض كل من الغليان والتجمد معًا",
          "تبقى كل الخواص دون تغير",
        ],
        correct_index: 0,
        explanation: "تشغل جسيمات المذاب جزءًا من السطح وتقلل تبخر الماء فينخفض الضغط البخاري وتلزم حرارة أعلى للغليان.",
        hint: "الأملاح تعيق هروب جزيئات الماء إلى البخار.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-ar-4c",
        question_type: "multiple-choice",
        prompt: "أي الألوان الضوئية يُمتص سريعًا قرب سطح البحر، وأيها يتغلغل لأعماق أكبر؟",
        choices: [
          "يُمتص الأحمر سريعًا ويتغلغل الأزرق والأخضر إلى أعماق أكبر",
          "يُمتص الأزرق أولًا بينما يصل الأحمر إلى القاع السحيق",
          "تُمتص كل الألوان عند أول $5\\text{ cm}$ فقط",
          "ينفذ الأشعة تحت الحمراء دون امتصاص",
        ],
        correct_index: 0,
        explanation: "تمتص الطبقات السطحية الأطوال الموجية الطويلة كالأحمر وتحت الحمراء بينما ينفذ الأزرق أعمق.",
        hint: "تذكر سبب اللون الأزرق السائد في أعماق التصوير البحري.",
        difficulty: "challenging",
      },
    ],
    cards: [
      {
        front: "الخواص الجمعية الأربع للمحاليل",
        back: "انخفاض الضغط البخاري، انخفاض درجة التجمد، ارتفاع درجة الغليان، وزيادة الضغط الأسموزي.",
      },
      {
        front: "قاعدة الأسموزية",
        back: "انتقال جزيئات الماء عبر غشاء شبه منفذ من التركيز الأقل للمذاب إلى التركيز الأعلى للمذاب.",
      },
      {
        front: "أنواع المحاليل حسب التشبع",
        back: "غير مشبع (يقبل مذابًا إضافيًا)، مشبع (في حالة اتزان ذوبان)، فوق مشبع (يحوي مذابًا زائدًا بالتسخين ثم التبريد الهادئ).",
      },
    ],
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
    hook: "سمكة النهر مهددة بالانتفاخ والانفجار المائي، بينما تواجه سمكة البحر خطر الجفاف المستمر — وكلاهما يتحدى الفيزياء الأسموزية بآلية مختلفة.",
    summary:
      "يعمل الماء كمذيب وناقل ووسط للتحلل المائي ومنظم حراري؛ وتتنوع استراتيجيات التنظيم الأسموزي وبنية الخلايا بين أوليات النواة وحقيقياتها وأحياء المياه العذبة والمالحة.",
    formulaOrRule: "عذبة: فائض ماء $\\Rightarrow$ بول وفير مخفف أو فجوة منقبضة؛ بحرية عظمية: فقد ماء $\\Rightarrow$ شرب وطرح أملاح بالخياشيم",
    keyConcepts: [
      {
        id: "sci-bio-ar-1",
        stage: "foundation",
        title: "الوظائف الحيوية الأربع وبنية الخلايا",
        body: "يذيب الماء المغذيات، وينقل الأكسجين والفضلات في الدم، ويشترك في تفاعلات التحلل المائي والتمثيل الضوئي، ويثبت حرارة الجسم بالتعرق والنتح. وتختلف حقيقيات النواة عن بدائيات النواة بوجود نواة محاطة بغلاف نووي وعضيات غشائية.",
        blocks: [
          {
            blockId: "sci-b-ar-1a",
            type: "explanation",
            content: "بدائيات النواة كالبكتيريا تفتقر للغلاف النووي والعضيات المحاطة بأغشية، في حين تنظّم حقيقيات النواة عملياتها الأيضية في نواة وعضيات متخصصة داخل سيتوبلازم غني بالماء.",
          },
        ],
      },
      {
        id: "sci-bio-ar-2",
        stage: "mechanism",
        title: "مواجهة دخول الماء الزائد في المياه العذبة",
        body: "سوائل الأوليات وأسماك المياه العذبة أعلى تركيزًا من النهر فيدخل الماء باستمرار بالأسموزية؛ لذا تطرده الأميبا بفجوة منقبضة، وتخرج الأسماك العذبة بولًا وفيرًا مخففًا دون شرب ماء كثير.",
        blocks: [
          {
            blockId: "sci-b-ar-2a",
            type: "callout",
            variant: "tip",
            title: "تحدي الفيضان المائي",
            content: "الأوليات مثل الأميبا والبراميسيوم تستهلك طاقة $\\mathrm{ATP}$ لتشغيل الفجوة المنقبضة وطرد الماء المتسرب قبل تمزق الغشاء البلازمي.",
          },
        ],
      },
      {
        id: "sci-bio-ar-3",
        stage: "application",
        title: "استراتيجيات الأسماك البحرية: العظمية مقابل القرش",
        body: "الأسماك العظمية البحرية أقل ملوحة من البحر فتفقد الماء؛ لذا تشرب ماء البحر وتطرد الأملاح بالخياشيم وتخرج بولًا شحيحًا مركزًا، بينما تحتفظ أسماك القرش باليوريا لرفع ضغطها الأسموزي ومعادلة البحر.",
        blocks: [
          {
            blockId: "sci-b-ar-3a",
            type: "explanation",
            content: "بفضل اليوريا يصبح التركيز الأسموزي الداخلي لدم القرش مقاربًا لماء البحر فلا يحتاج لشرب كميات كبيرة من المياه المالحة.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "مقارنة الاتزان الأسموزي بين بيئتين متعاكستين",
        problem: "قارن بين تكيف سمكة البلطي النيلية (مياه عذبة) وسمكة الدنيس (مياه مالحة) لحفظ الاتزان المائي.",
        steps: [
          "١) البلطي النيلية: محاطة بماء عذب أقل تركيزًا من دمها، فينفذ الماء عبر الخياشيم؛ لذلك لا تشرب كثيرًا وتنتج بولًا غزيرًا مخففًا وتمتص الأملاح بالخياشيم.",
          "٢) سمكة الدنيس البحرية: البحر أكثر ملوحة من دمها، فتفقد الماء أسموزيًا؛ لذلك تشرب ماء البحر وتضخ فائض الملح عبر خلايا كلوريد الخياشيم وتفرز بولًا قليلًا.",
        ],
        takeaway: "الأسموزية تحرك الماء نحو الوسط الأكثر ملوحة، والتكيف الحيوي يوازن هذا الفقد أو الزيادة.",
      },
    ],
    commonMistakes: [
      "عكس آلية البول: أسماك المياه العذبة تخرج بولًا وفيرًا مخففًا، أما البحرية العظمية فتخرج بولًا شحيحًا مركزًا.",
      "الظن أن أسماك القرش تتبع نفس آلية البول والملوحة للأسماك العظمية البحرية مع أنها تستخدم اليوريا للاتزان الأسموزي.",
    ],
    questions: [
      {
        id: "pack-q-sci-ar-5a",
        question_type: "multiple-choice",
        prompt: "كيف تتجنب الأوليات وحيدة الخلية كالأميبا الانفجار عند معيشتها في الماء العذب؟",
        choices: [
          "بضخ الماء الزائد للخارج دوريًا عبر الفجوة المنقبضة",
          "بشرب كميات إضافية من الماء",
          "بتجميد السيتوبلازم داخليًا",
          "بطرد البروتينات خارج الغشاء البلازمي",
        ],
        correct_index: 0,
        explanation: "تضخ الفجوة المنقبضة الماء الذي يدخل أسموزيًا خارج الخلية بانتظام مستخدمة طاقة $\\mathrm{ATP}$.",
        hint: "ما العضية المختصة بطرد الماء الفائض في الأوليات العذبة؟",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-ar-5b",
        question_type: "multiple-choice",
        prompt: "أي العبارات يصف تكيف سمكة عظمية تعيش في مياه البحر المالحة؟",
        choices: [
          "تشرب ماء البحر، تطرح الأملاح بالخياشيم، وتفرز بولًا شحيحًا",
          "لا تشرب الماء وتفرز كميات ضخمة من البول المخفف",
          "تمتص الأملاح الزائدة من البحر عبر الجلد",
          "تتخلص من الماء الزائد عبر فجوة منقبضة",
        ],
        correct_index: 0,
        explanation: "لتعويض فقد الماء للبحر، تشرب السمكة البحرية ماءً مالحًا وتطرد الملح الزائد نشطًا عبر الخياشيم وتقلص البول.",
        hint: "البيئة البحرية أعلى ملوحة من سوائل الجسم.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-ar-5c",
        question_type: "multiple-choice",
        prompt: "بماذا تتميز الخلايا حقيقية النواة عن الخلايا بدائية النواة؟",
        choices: [
          "وجود نواة محاطة بغلاف نووي وعضيات محاطة بأغشية مثل الميتوكوندريا",
          "خلوها من المادة الوراثية $\\mathrm{DNA}$",
          "غياب الغشاء البلازمي المحيط بالخلية",
          "عدم احتوائها على سيتوبلازم مائي",
        ],
        correct_index: 0,
        explanation: "تمتلك حقيقيات النواة نواة محاطة بغلاف نووي وعضيات غشائية، بعكس البكتيريا بدائية النواة.",
        hint: "تذكر معنى اسم «حقيقية النواة».",
        difficulty: "foundational",
      },
    ],
    cards: [
      {
        front: "الأدوار الحيوية الأربعة للماء",
        back: "مذيب قطبي، ناقل في الدم والعصارة، وسط ومتفاعل أيضي (التحلل المائي)، ومنظم حراري.",
      },
      {
        front: "السمكة العذبة مقابل البحرية العظمية",
        back: "العذبة: بول وفير مخفف وطرد ماء؛ البحرية: تشرب ماء البحر وتضخ الملح بالخياشيم وتفرز بولًا شحيحًا.",
      },
      {
        front: "كيف تتوازن أسماك القرش؟",
        back: "تحتفظ باليوريا في دمائها لتساوي ضغطها الأسموزي تقريبًا مع ماء البحر.",
      },
    ],
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
    hook: "Although water blankets roughly $70.7\\%$ of Earth's surface, readily accessible liquid freshwater is only a hairline sliver compared with saline oceans and polar ice.",
    summary:
      "Earth's hydrosphere operates as a closed-mass, solar-powered reservoir system linking oceans, ice caps, aquifers, rivers, and living organisms through the hydrologic cycle.",
    formulaOrRule: "Surface water $\\approx 70.7\\%$ — Saltwater $\\approx 97\\%$ vs. Freshwater $\\approx 3\\%$",
    keyConcepts: [
      {
        id: "sci-hydro-en-1",
        stage: "foundation",
        title: "Global Water Reservoirs & Accessibility",
        body: "Saline oceans hold about $97\\%$ of global water, leaving just $\\approx 3\\%$ freshwater—mostly locked inside glaciers, ice sheets, and deep groundwater rather than flowing rivers.",
        blocks: [
          {
            blockId: "sci-h-en-1a",
            type: "math",
            tex: "\\text{Total Water} \\approx 97\\%\\text{ Saline Oceans} + 3\\%\\text{ Freshwater (mostly ice \\& aquifers)}",
            caption: "Hydrosphere Distribution",
          },
          {
            blockId: "sci-h-en-1b",
            type: "callout",
            variant: "tip",
            title: "Ecosystem Coupling",
            content: "Aquatic ecosystems connect biotic communities (producers, consumers, decomposers) with abiotic drivers (light, temperature, dissolved $\\mathrm{O_2}$, salinity, and $\\mathrm{pH}$).",
          },
        ],
      },
      {
        id: "sci-hydro-en-2",
        stage: "mechanism",
        title: "Physical vs. Biological Drivers of the Water Cycle",
        body: "Solar heating drives surface evaporation alongside biological transpiration from plant stomata; atmospheric cooling causes condensation into clouds, returning moisture via precipitation to surface runoff and groundwater infiltration.",
        blocks: [
          {
            blockId: "sci-h-en-2a",
            type: "explanation",
            content: "Whereas evaporation occurs over lakes and seas, transpiration draws water up xylem vessels and cools leaves while feeding atmospheric humidity.",
          },
        ],
      },
      {
        id: "sci-hydro-en-3",
        stage: "application",
        title: "Residence Times & Aquifer Vulnerability",
        body: "Rivers turn over water in days to weeks, whereas confined aquifers percolate over years or centuries, making groundwater contamination unusually persistent.",
        blocks: [
          {
            blockId: "sci-h-en-3a",
            type: "callout",
            variant: "note",
            title: "Why Aquifers Recover Slowly",
            content: "Protecting permeable recharge zones prevents long-lived agricultural or industrial solutes from lingering in underground reservoirs.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Tracing a Raindrop Across a River Basin",
        problem: "Trace a raindrop landing on a vegetated hillside above a freshwater valley.",
        steps: [
          "1) A portion infiltrates porous soil to recharge groundwater aquifers or enters plant roots.",
          "2) Leaves return absorbed moisture as vapor via stomatal transpiration while excess water flows down as surface runoff.",
          "3) Rising water vapor cools and condenses high in the troposphere before precipitating back down, conserving global water mass.",
        ],
        takeaway: "The hydrologic cycle conserves Earth's total water mass while redistributing thermal energy and purifying freshwater naturally.",
      },
    ],
    commonMistakes: [
      "Assuming visible rivers and lakes hold most freshwater — polar ice caps and deep groundwater store the vast majority.",
      "Omitting plant transpiration and subsurface infiltration when modeling the hydrologic cycle.",
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
          "Estuarine coastal wetlands",
        ],
        correct_index: 0,
        explanation: "About $3\\%$ of Earth's water is fresh, and most of it sits in glaciers, ice caps, or underground aquifers.",
        hint: "Compare visible river volume against continental ice sheets.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-en-1b",
        question_type: "multiple-choice",
        prompt: "Which process transfers water vapor directly from living plants into the atmosphere?",
        choices: ["Condensation", "Transpiration", "Percolation", "Salinization"],
        correct_index: 1,
        explanation: "Transpiration releases water vapor from living plants through leaf stomata.",
        hint: "Pick the term that links the biosphere to atmospheric moisture.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-en-1c",
        question_type: "multiple-choice",
        prompt: "Why does chemical contamination in a confined groundwater aquifer persist longer than in a fast river?",
        choices: [
          "Groundwater moves and renews extremely slowly compared with river flow",
          "Groundwater lacks polar $\\mathrm{H_2O}$ molecules",
          "Sunlight evaporates deep aquifers every summer",
          "Rivers neutralize all solutes instantly",
        ],
        correct_index: 0,
        explanation: "Slow subsurface flow yields residence times spanning years to centuries, delaying natural flushing.",
        hint: "Compare water turnover rates underground vs. in a flowing river.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "Global Water Split", back: "Water covers $\\approx 70.7\\%$ of Earth's surface: $\\approx 97\\%$ saline oceans and $\\approx 3\\%$ freshwater." },
      { front: "Transpiration", back: "Biological evaporation of water vapor through plant leaf stomata, aiding xylem sap pull and cooling." },
      { front: "Closed Mass / Open Energy", back: "Solar radiation continuously drives phase transitions while total planetary water mass remains conserved." },
    ],
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
    hook: "Without its bent $104.5^{\\circ}$ geometry, $\\mathrm{H_2O}$ bond dipoles would cancel out—turning Earth's oceans into a thin gas at room temperature.",
    summary:
      "Each $\\mathrm{H_2O}$ molecule has two polar covalent $\\mathrm{O-H}$ bonds bent at $104.5^{\\circ}$, producing partial charges ($\\delta^-$ on $\\mathrm{O}$, $\\delta^+$ on $\\mathrm{H}$) that build intermolecular hydrogen bonds and drive salt hydrolysis and $\\mathrm{pH}$ behavior.",
    formulaOrRule: "$\\theta_{\\mathrm{H-O-H}} \\approx 104.5^{\\circ}$ — $\\mathrm{pH} < 7$ acidic, $= 7$ neutral, $> 7$ basic",
    keyConcepts: [
      {
        id: "sci-chem-en-1",
        stage: "foundation",
        title: "Molecular Polarity & Hydrogen Bonding",
        body: "Oxygen pulls shared bonding electrons harder than hydrogen, leaving $\\delta^-$ on oxygen and $\\delta^+$ on both hydrogens. Two lone electron pairs force a bent $104.5^{\\circ}$ angle so molecules attract neighbors via hydrogen bonds.",
        blocks: [
          {
            blockId: "sci-c-en-1a",
            type: "chemistry",
            equation: "\\mathrm{H^{\\delta+}-O^{\\delta-}-H^{\\delta+}} \\quad (\\theta \\approx 104.5^{\\circ})", tex: "\\mathrm{H^{\\delta+}-O^{\\delta-}-H^{\\delta+}} \\quad (\\theta \\approx 104.5^{\\circ})",
            caption: "Polar Bent Water Structure",
          },
          {
            blockId: "sci-c-en-1b",
            type: "callout",
            variant: "pitfall",
            title: "Boiling Breaks Intermolecular Hydrogen Bonds Only",
            content: "Boiling converts liquid $\\mathrm{H_2O}$ into $\\mathrm{H_2O}$ vapor by overcoming intermolecular hydrogen bonds; covalent $\\mathrm{O-H}$ bonds stay completely intact.",
          },
        ],
      },
      {
        id: "sci-chem-en-2",
        stage: "mechanism",
        title: "Salt Hydrolysis in Aqueous Solutions",
        body: "Salts derived from a strong acid and strong base ($\\mathrm{NaCl}$) dissolve cleanly near $\\mathrm{pH} = 7$, whereas weak-ion salts hydrolyze water ($\\mathrm{NH_4Cl}$ yields $\\mathrm{pH} < 7$; $\\mathrm{NaHCO_3}$ yields $\\mathrm{pH} > 7$).",
        blocks: [
          {
            blockId: "sci-c-en-2a",
            type: "chemistry",
            equation: "\\mathrm{NH_4^+ + H_2O \\rightleftharpoons NH_3 + H_3O^+} \\quad (\\text{acidic salt hydrolysis})", tex: "\\mathrm{NH_4^+ + H_2O \\rightleftharpoons NH_3 + H_3O^+} \\quad (\\text{acidic salt hydrolysis})",
            caption: "Example of Salt Hydrolysis",
          },
        ],
      },
      {
        id: "sci-chem-en-3",
        stage: "application",
        title: "Interpreting the Logarithmic pH Scale",
        body: "Because $\\mathrm{pH}$ is logarithmic, every 1-unit shift represents a 10-fold change in hydrogen ion concentration $[\\mathrm{H^+}]$—crucial for gill physiology and mineral solubility.",
        blocks: [
          {
            blockId: "sci-c-en-3a",
            type: "math",
            tex: "\\Delta\\mathrm{pH} = 1 \\implies 10\\times\\text{ change in } [\\mathrm{H^+}]",
            caption: "Logarithmic Acidity Step",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Comparing Solutions at pH 4, 7, and 11",
        problem: "Classify aqueous samples with $\\mathrm{pH} = 4$, $\\mathrm{pH} = 7$, and $\\mathrm{pH} = 11$ and explain the ion ratio between $\\mathrm{pH} = 4$ and $\\mathrm{pH} = 7$.",
        steps: [
          "1) $\\mathrm{pH} = 4 < 7$: acidic sample with elevated $[\\mathrm{H^+}]$ concentration.",
          "2) $\\mathrm{pH} = 7$: neutral equilibrium where $[\\mathrm{H^+}] = [\\mathrm{OH^-}]$.",
          "3) $\\mathrm{pH} = 11 > 7$: basic (alkaline); moreover, $\\mathrm{pH} = 4$ has $10^{7-4} = 1000\\times$ higher $[\\mathrm{H^+}]$ than $\\mathrm{pH} = 7$.",
        ],
        takeaway: "Use powers of 10 to compare $[\\mathrm{H^+}]$ across any two $\\mathrm{pH}$ values.",
      },
    ],
    commonMistakes: [
      "Confusing covalent $\\mathrm{O-H}$ bonds inside one $\\mathrm{H_2O}$ molecule with weaker intermolecular hydrogen bonds.",
      "Thinking boiling water breaks molecules apart into $\\mathrm{H_2}$ and $\\mathrm{O_2}$ gases.",
    ],
    questions: [
      {
        id: "pack-q-sci-en-2a",
        question_type: "multiple-choice",
        prompt: "Which bonds are overcome when liquid water boils into steam at $100^{\\circ}\\text{C}$?",
        choices: [
          "Hydrogen bonds between neighboring $\\mathrm{H_2O}$ molecules",
          "Polar covalent bonds inside each $\\mathrm{H_2O}$ molecule",
          "Ionic attractions inside dissolved oxygen",
          "Metallic lattices between hydrogen nuclei",
        ],
        correct_index: 0,
        explanation: "Boiling separates whole $\\mathrm{H_2O}$ molecules by overcoming intermolecular hydrogen bonds.",
        hint: "Is steam still made of $\\mathrm{H_2O}$ molecules?",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-en-2b",
        question_type: "multiple-choice",
        prompt: "What is the approximate $\\mathrm{H-O-H}$ bond angle in a water molecule?",
        choices: ["$90^{\\circ}$", "$104.5^{\\circ}$", "$120^{\\circ}$", "$180^{\\circ}$"],
        correct_index: 1,
        explanation: "Two lone electron pairs compress the bond angle to $\\approx 104.5^{\\circ}$, preserving molecular polarity.",
        hint: "If linear ($180^{\\circ}$), the two bond dipoles would cancel.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-en-2c",
        question_type: "multiple-choice",
        prompt: "Dissolving which salt produces a neutral aqueous solution ($\\mathrm{pH} \\approx 7$)?",
        choices: [
          "Sodium chloride ($\\mathrm{NaCl}$)",
          "Sodium bicarbonate ($\\mathrm{NaHCO_3}$)",
          "Ammonium chloride ($\\mathrm{NH_4Cl}$)",
          "Sodium acetate ($\\mathrm{CH_3COONa}$)",
        ],
        correct_index: 0,
        explanation: "$\\mathrm{NaCl}$ comes from strong acid $\\mathrm{HCl}$ and strong base $\\mathrm{NaOH}$, so neither ion hydrolyzes water.",
        hint: "Select the salt formed from both a strong acid and a strong base.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "Why $\\mathrm{H_2O}$ is Polar", back: "Oxygen's electronegativity ($\\delta^-$) combined with the bent $104.5^{\\circ}$ angle keeps dipoles uncancelled." },
      { front: "Salt Hydrolysis Quick Rule", back: "$\\mathrm{NaCl} \\to$ neutral ($7$); $\\mathrm{NH_4Cl} \\to$ acidic ($<7$); $\\mathrm{NaHCO_3} \\to$ basic ($>7$)." },
      { front: "Logarithmic $\\mathrm{pH}$ Scale", back: "Each 1-unit drop multiplies $[\\mathrm{H^+}]$ acidity by $10\\times$." },
    ],
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
    hook: "Most liquids sink when frozen—yet water hits peak density at $4^{\\circ}\\text{C}$, forcing $0^{\\circ}\\text{C}$ ice to float and insulate aquatic life underneath.",
    summary:
      "Water reaches maximum density at $4^{\\circ}\\text{C}$ due to open hexagonal hydrogen bonding on freezing, while its unusually high specific heat capacity buffers climates and living organisms via $Q = m c \\Delta T$.",
    formulaOrRule: "$\\rho = \\frac{m}{V}$, Max density at $4^{\\circ}\\text{C}$ ($\\approx 1000\\text{ kg/m}^3$), and $Q = m c \\Delta T$",
    keyConcepts: [
      {
        id: "sci-phys-en-1",
        stage: "foundation",
        title: "The $4^{\\circ}\\text{C}$ Density Anomaly",
        body: "Cooling water below $4^{\\circ}\\text{C}$ arranges molecules into an open hexagonal hydrogen-bonded lattice with larger volume and lower density, allowing ice ($0^{\\circ}\\text{C}$) to float atop dense $4^{\\circ}\\text{C}$ bottom water.",
        blocks: [
          {
            blockId: "sci-p-en-1a",
            type: "math",
            tex: "\\rho_{\\text{ice}}(0^{\\circ}\\text{C}) < \\rho_{\\text{liquid}}(4^{\\circ}\\text{C}) \\approx 1000\\text{ kg/m}^3",
            caption: "Ice Floats on Liquid Water",
          },
          {
            blockId: "sci-p-en-1b",
            type: "callout",
            variant: "tip",
            title: "Hydrometer Buoyancy",
            content: "A hydrometer sits higher (smaller submerged stem depth) in dense saline water than in pure freshwater because denser fluid supplies more buoyancy per unit displaced volume.",
          },
        ],
      },
      {
        id: "sci-phys-en-2",
        stage: "mechanism",
        title: "High Specific Heat Capacity",
        body: "Much of the heat added to water goes into breaking intermolecular hydrogen bonds before raising average kinetic energy, giving liquid water $c \\approx 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$.",
        blocks: [
          {
            blockId: "sci-p-en-2a",
            type: "math",
            tex: "Q = m \\cdot c \\cdot \\Delta T",
            caption: "Thermal Energy Transfer Equation",
          },
        ],
      },
      {
        id: "sci-phys-en-3",
        stage: "application",
        title: "Marine vs. Continental Thermal Stability",
        body: "Oceans absorb daytime solar energy with gentle temperature rises and release it slowly at night, moderating coastal temperatures far better than arid inland deserts.",
        blocks: [
          {
            blockId: "sci-p-en-3a",
            type: "explanation",
            content: "Cellular cytoplasm behaves similarly, protecting enzymes against sudden environmental temperature spikes.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Specific Heat Energy Calculation",
        problem: "Calculate the thermal energy $Q$ absorbed when $0.50\\text{ kg}$ of water warms by $\\Delta T = 10^{\\circ}\\text{C}$ ($c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$).",
        steps: [
          "1) List given values in SI units: $m = 0.50\\text{ kg}$, $c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$, $\\Delta T = 10^{\\circ}\\text{C}$.",
          "2) Substitute into $Q = m \\cdot c \\cdot \\Delta T = 0.50 \\times 4200 \\times 10$.",
          "3) Evaluate: $Q = 21\\,000\\text{ J} = 21\\text{ kJ}$.",
        ],
        takeaway: "Always convert grams to kilograms before using $c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$.",
      },
    ],
    commonMistakes: [
      "Assuming water contracts continuously down to $0^{\\circ}\\text{C}$ — volume expands below $4^{\\circ}\\text{C}$.",
      "Thinking a hydrometer sinks deeper in saltier water; higher fluid density lifts the stem higher.",
    ],
    questions: [
      {
        id: "pack-q-sci-en-3a",
        question_type: "multiple-choice",
        prompt: "At what temperature does pure liquid water reach its maximum density?",
        choices: ["$0^{\\circ}\\text{C}$", "$4^{\\circ}\\text{C}$", "$25^{\\circ}\\text{C}$", "$100^{\\circ}\\text{C}$"],
        correct_index: 1,
        explanation: "At $4^{\\circ}\\text{C}$, molecules pack most tightly before hexagonal ice frameworks expand toward $0^{\\circ}\\text{C}$.",
        hint: "Slightly above freezing, explaining why lake beds stabilize near $4^{\\circ}\\text{C}$.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-en-3b",
        question_type: "multiple-choice",
        prompt: "If $1.0\\text{ kg}$ of water ($c = 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$) absorbs $42\\,000\\text{ J}$, what is $\\Delta T$?",
        choices: ["$5^{\\circ}\\text{C}$", "$10^{\\circ}\\text{C}$", "$20^{\\circ}\\text{C}$", "$42^{\\circ}\\text{C}$"],
        correct_index: 1,
        explanation: "$\\Delta T = \\frac{Q}{m \\cdot c} = \\frac{42000}{1.0 \\times 4200} = 10^{\\circ}\\text{C}$.",
        hint: "Rearrange $Q = m \\cdot c \\cdot \\Delta T$ to isolate $\\Delta T$.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-en-3c",
        question_type: "multiple-choice",
        prompt: "A hydrometer moves from distilled water into dense Red Sea brine at the same temperature. How does it float?",
        choices: [
          "Sinks deeper because dissolved salt weakens buoyancy",
          "Floats higher with less submerged stem because denser brine needs less displaced volume",
          "Submerged depth stays identical",
          "Sinks straight to the seabed",
        ],
        correct_index: 1,
        explanation: "Higher brine density creates equal upward buoyant force with less displaced volume, lifting the stem.",
        hint: "Higher fluid density yields greater buoyancy per unit displaced volume.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "Maximum Density Temperature", back: "$4^{\\circ}\\text{C}$ ($\\approx 1000\\text{ kg/m}^3$); open hexagonal crystals expand ice toward $0^{\\circ}\\text{C}$." },
      { front: "Specific Heat Formula", back: "$Q = m \\cdot c \\cdot \\Delta T$ with $c \\approx 4200\\text{ J/(kg}\\cdot{}^{\\circ}\\text{C)}$." },
      { front: "Hydrometer Reading", back: "Higher fluid density results in a smaller submerged stem depth." },
    ],
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
    hook: "Sprinkling salt onto icy winter roads lowers water's freezing point—the same particle-counting rule that drives osmotic pressure across every cell membrane.",
    summary:
      "Colligative properties depend strictly on total dissolved particle count, osmosis shifts water toward higher solute concentrations, and ocean waters absorb red light far faster than blue.",
    formulaOrRule: "More dissolved particles $\\implies$ lower vapor pressure & freezing point, higher boiling point & osmotic pressure",
    keyConcepts: [
      {
        id: "sci-sol-en-1",
        stage: "foundation",
        title: "Colligative Shifts & Electrolytes",
        body: "Dissolved solutes hinder water molecules escaping to vapor and locking into ice crystals. Ionic salts such as $\\mathrm{NaCl}$ dissociate into $\\mathrm{Na^+}$ and $\\mathrm{Cl^-}$, doubling particle count compared with equimolar non-electrolyte sugar.",
        blocks: [
          {
            blockId: "sci-s-en-1a",
            type: "chemistry",
            equation: "\\mathrm{NaCl(s)} \\rightarrow \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (\\approx 2\\times\\text{ colligative shift vs. glucose})", tex: "\\mathrm{NaCl(s)} \\rightarrow \\mathrm{Na^+(aq)} + \\mathrm{Cl^-(aq)} \\quad (\\approx 2\\times\\text{ colligative shift vs. glucose})",
            caption: "Ionic Dissociation Boost",
          },
        ],
      },
      {
        id: "sci-sol-en-2",
        stage: "mechanism",
        title: "Osmosis Across Semipermeable Membranes",
        body: "Water flows osmotically from lower solute concentration (higher water potential) toward higher solute concentration until osmotic equilibrium is reached.",
        blocks: [
          {
            blockId: "sci-s-en-2a",
            type: "callout",
            variant: "pitfall",
            title: "Plasmolysis in Hypertonic Brine",
            content: "A plant cell placed in concentrated salt solution loses vacuolar water outward by osmosis, shrinking its membrane away from the cell wall.",
          },
        ],
      },
      {
        id: "sci-sol-en-3",
        stage: "application",
        title: "Wavelength Filtering in Aquatic Photonic Zones",
        body: "Surface marine layers rapidly absorb longer red and infrared wavelengths while shorter blue-green wavelengths penetrate deeper into the photic zone.",
        blocks: [
          {
            blockId: "sci-s-en-3a",
            type: "explanation",
            content: "This selective attenuation explains why deep algae use specialized accessory pigments to capture remaining blue light.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Why Road Salt Melts Ice Below Zero",
        problem: "Explain why road salt melts ice at $-3^{\\circ}\\text{C}$ without adding external heat.",
        steps: [
          "1) Salt dissolves in the microscopic liquid water film atop ice, dissociating into $\\mathrm{Na^+}$ and $\\mathrm{Cl^-}$ ions.",
          "2) Ions interfere with orderly hydrogen-bonded crystal locking, depressing the freezing point below $-3^{\\circ}\\text{C}$.",
          "3) At $-3^{\\circ}\\text{C}$, the new brine solution is above its depressed freezing point, so solid ice transitions to liquid brine.",
        ],
        takeaway: "Colligative depression widens water's liquid temperature window at both ends.",
      },
    ],
    commonMistakes: [
      "Reversing osmosis direction — water always crosses toward higher solute concentration.",
      "Ignoring ionic dissociation ($\\mathrm{NaCl} \\to 2$ ions) when comparing equimolar colligative shifts.",
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
          "Equally in both directions regardless of gradient",
        ],
        correct_index: 0,
        explanation: "Water moves from the dilute side (higher water potential) to dilute the more concentrated solute side.",
        hint: "Water flows toward the saltier compartment.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-en-4b",
        question_type: "multiple-choice",
        prompt: "What happens when non-volatile salt dissolves in pure water at $1\\text{ atm}$?",
        choices: [
          "Boiling point rises and vapor pressure falls",
          "Boiling point falls and vapor pressure rises",
          "Freezing point rises above $0^{\\circ}\\text{C}$",
          "Colligative properties remain unchanged",
        ],
        correct_index: 0,
        explanation: "Solute particles lower surface solvent escape tendency, depressing vapor pressure and requiring a higher boiling point.",
        hint: "Blocking vapor escape requires extra thermal energy to boil.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-en-4c",
        question_type: "multiple-choice",
        prompt: "How does solar light color attenuate downward in clear seawater?",
        choices: [
          "Red/infrared wavelengths attenuate quickly near the surface; blue penetrates deepest",
          "Blue light stops in the top centimeter while red reaches the abyss",
          "All colors penetrate equally without absorption",
          "Infrared heats the deep seabed directly",
        ],
        correct_index: 0,
        explanation: "Longer red wavelengths are absorbed quickly by water molecules, leaving blue/green wavelengths in deeper layers.",
        hint: "Recall why deep underwater photos appear blue without artificial red lighting.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "Colligative Effects Summary", back: "Higher dissolved particle count lowers vapor pressure & freezing point and raises boiling point & osmotic pressure." },
      { front: "Osmosis Direction Rule", back: "Solvent moves across semipermeable membranes from lower solute concentration toward higher solute concentration." },
      { front: "Underwater Light Spectrum", back: "Red absorbs shallowly near the surface; shorter blue wavelengths penetrate furthest into the photic zone." },
    ],
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
    hook: "Freshwater fish risk bursting from incoming water while marine bony fish fight constant dehydration—solving opposite osmotic threats to keep blood chemistry stable.",
    summary:
      "Water powers life as a solvent, nutrient transporter, hydrolysis reactant, and thermal buffer, while prokaryotes, eukaryotes, freshwater fish, and marine fish adopt distinct osmoregulatory designs.",
    formulaOrRule: "Freshwater: expel water (copious dilute urine); Marine bony fish: drink seawater, excrete salt via gills, scant urine",
    keyConcepts: [
      {
        id: "sci-bio-en-1",
        stage: "foundation",
        title: "Four Vital Roles & Cellular Architecture",
        body: "Water acts as biological solvent, vascular transporter, enzymatic hydrolysis medium, and thermal regulator. Eukaryotes enclose DNA in a nuclear envelope with membrane-bound organelles, unlike prokaryotes.",
        blocks: [
          {
            blockId: "sci-b-en-1a",
            type: "explanation",
            content: "Prokaryotes (bacteria) carry naked cytoplasmic DNA without membrane-bound organelles, whereas eukaryotic cells compartmentalize reactions inside nuclei and mitochondria bathed in aqueous cytosol.",
          },
        ],
      },
      {
        id: "sci-bio-en-2",
        stage: "mechanism",
        title: "Preventing Flooding in Freshwater Organisms",
        body: "Freshwater protozoa and river fish stay hypertonic to surrounding water so fluid diffuses inward continuously; protozoa pump excess water out with contractile vacuoles while freshwater fish excrete large volumes of dilute urine.",
        blocks: [
          {
            blockId: "sci-b-en-2a",
            type: "callout",
            variant: "tip",
            title: "Active Ion Uptake",
            content: "Because freshwater fish lose trace ions in dilute urine, specialized gill cells actively import replacement salts from river water.",
          },
        ],
      },
      {
        id: "sci-bio-en-3",
        stage: "application",
        title: "Preventing Dehydration in Marine Fish & Sharks",
        body: "Marine bony fish lose water to salty seawater, so they drink seawater, pump excess ions outward through gill chloride cells, and excrete scant concentrated urine; sharks retain urea to match seawater osmolarity.",
        blocks: [
          {
            blockId: "sci-b-en-3a",
            type: "explanation",
            content: "Retaining blood urea keeps sharks nearly iso-osmotic with ocean water, avoiding heavy seawater drinking.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Contrasting River vs. Ocean Osmoregulation",
        problem: "Contrast how a Nile tilapia (freshwater) and a Red Sea bony fish conserve water-salt homeostasis.",
        steps: [
          "1) Nile tilapia: blood is saltier than river water, so water enters across gills; fish avoids drinking excess water and excretes copious dilute urine.",
          "2) Marine bony fish: ocean brine is saltier than tissues, pulling water outward; fish drinks seawater, secretes salt ions across gills, and conserves water via tiny urine volumes.",
        ],
        takeaway: "Freshwater animals battle osmotic flooding; marine bony fish battle osmotic dehydration.",
      },
    ],
    commonMistakes: [
      "Thinking marine bony fish produce large volumes of dilute urine — that would rapidly dehydrate them.",
      "Assuming sharks osmoregulate identically to marine bony fish instead of retaining urea for osmotic balance.",
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
          "Secreting digestive proteins externally",
        ],
        correct_index: 0,
        explanation: "Contractile vacuoles actively collect incoming cytoplasmic water and expel it rhythmically using $\\mathrm{ATP}$.",
        hint: "Recall the specialized water-pumping organelle in unicellular freshwater protists.",
        difficulty: "foundational",
      },
      {
        id: "pack-q-sci-en-5b",
        question_type: "multiple-choice",
        prompt: "Which adaptation characterizes a marine bony fish living in salty ocean water?",
        choices: [
          "Drinks seawater, excretes excess salts via gills, and passes very little urine",
          "Never drinks water and passes massive volumes of dilute urine",
          "Uses a contractile vacuole in muscle fibers",
          "Absorbs ocean salts through fins to stay diluted",
        ],
        correct_index: 0,
        explanation: "Marine bony fish replenish osmotically lost fluid by drinking seawater while removing salts through gills and minimizing urine loss.",
        hint: "Seawater is hypertonic relative to marine bony fish body fluids.",
        difficulty: "standard",
      },
      {
        id: "pack-q-sci-en-5c",
        question_type: "multiple-choice",
        prompt: "Which structural feature distinguishes eukaryotic cells from prokaryotic cells?",
        choices: [
          "A true membrane-bound nucleus and membrane-bound organelles",
          "Complete absence of genetic material ($\\mathrm{DNA}$)",
          "Lack of a plasma membrane",
          "Absence of water in the cytoplasm",
        ],
        correct_index: 0,
        explanation: "Eukaryotes enclose $\\mathrm{DNA}$ inside a nuclear envelope and organize metabolism in membrane-bound organelles.",
        hint: "Think about the root meaning of eu-karyon ('true nucleus').",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Four Biological Roles of Water", back: "Solvent, vascular transporter, metabolic medium/reactant (hydrolysis), and thermal regulator." },
      { front: "Freshwater vs. Marine Bony Fish", back: "Freshwater: gains water $\\to$ copious dilute urine; Marine bony: loses water $\\to$ drinks seawater, pumps salts out via gills, scant urine." },
      { front: "Shark Osmotic Strategy", back: "Retains blood urea to stay nearly iso-osmotic with ocean salinity." },
    ],
  },
];
