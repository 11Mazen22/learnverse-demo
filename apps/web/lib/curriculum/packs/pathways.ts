import type { CanonicalLessonStudyPack } from "../pack-types";

/**
 * Dedicated study packs for Demo Motion Basics/Graphs and the 7-lesson
 * Respiratory System pathway (both Arabic and English content views).
 * Using distinct pathway track slugs + isExtraReview avoids shifting the
 * Sec. 1 official 46-pack track counts.
 */
export const PATHWAY_LESSON_PACKS: CanonicalLessonStudyPack[] = [
  // =========================================================================
  // DEMO SCIENCE PATHWAY — MOTION & GRAPHS (AR / EN)
  // =========================================================================
  {
    id: "pack-path-motion-1-ar",
    lessonSlug: "motion-basics",
    trackSlug: "demo-motion-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 1,
    isExtraReview: true,
    title: "ما معنى السرعة؟",
    titleAr: "ما معنى السرعة؟",
    titleEn: "What Does Speed Mean?",
    hook: "السرعة لا تقيس المسافة وحدها؛ بل تقيس كم مترًا يقطعه الجسم في كل ثانية مقارنة بساعة القياس.",
    summary:
      "تعبّر السرعة المتوسطة عن المعدل الزمني لتغير المسافة، وتقاس بوحدة $\\text{m/s}$ أو $\\text{km/h}$ عبر القسمة المباشرة للمسافة الكلية على الزمن الكلي.",
    formulaOrRule: "السرعة المتوسطة $v = \\frac{\\Delta d}{\\Delta t}$",
    keyConcepts: [
      {
        id: "path-motion-1a-ar",
        stage: "foundation",
        title: "مفهوم السرعة كـمعدل زمني",
        body: "جسم يقطع $120\\text{ m}$ في $20\\text{ s}$ أسرع من جسم يقطع نفس المسافة في $40\\text{ s}$ لأن نصيب الثانية الواحدة من الحركة أكبر.",
        blocks: [
          {
            blockId: "pm1-a",
            type: "math",
            tex: "v = \\frac{d}{t} \\quad (\\text{m/s})",
            caption: "قانون السرعة المتوسطة",
          },
          {
            blockId: "pm1-b",
            type: "callout",
            variant: "tip",
            title: "مثلث الكميات الثلاث",
            content: "لحساب المسافة نضرب $d = v \\cdot t$، ولحساب الزمن نقسم $t = \\frac{d}{v}$، مع توحيد الوحدات قبل التعويض.",
          },
        ],
      },
      {
        id: "path-motion-1b-ar",
        stage: "application",
        title: "التحويل بين $\\text{km/h}$ و$\\text{m/s}$",
        body: "للتحويل من $\\text{km/h}$ إلى $\\text{m/s}$ نقسم على $3.6$ (أو نضرب في $\\frac{5}{18}$)، وللعكس نضرب في $3.6$.",
        blocks: [
          {
            blockId: "pm1-c",
            type: "math",
            tex: "72\\text{ km/h} \\times \\frac{5}{18} = 20\\text{ m/s}",
            caption: "مثال تحويل وحدات السرعة",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب زمن رحلة عدّاء بسرعة ثابتة",
        problem: "يجري عدّاء بسرعة متوسطة $v = 8\\text{ m/s}$ لمسافة $d = 200\\text{ m}$. ما الزمن المستغرق؟",
        steps: [
          "١) نعيد ترتيب القانون لعزل الزمن: $t = \\frac{d}{v}$.",
          "٢) نعوّض بالوحدات المتوافقة: $t = \\frac{200}{8} = 25\\text{ s}$.",
        ],
        takeaway: "تأكّد دائمًا من تطابق وحدة المسافة مع بسط وحدة السرعة قبل القسمة.",
      },
    ],
    commonMistakes: [
      "قسمة الزمن على المسافة ($t / d$) بدل قسمة المسافة على الزمن ($d / t$).",
      "دمج الكيلومتر مع الثواني دون التحويل عبر المعامل $\\frac{5}{18}$.",
    ],
    questions: [
      {
        id: "pq-motion-1-ar",
        question_type: "multiple-choice",
        prompt: "تتحرك سيارة بسرعة ثابتة $15\\text{ m/s}$. ما المسافة التي تقطعها في $12\\text{ s}$؟",
        choices: ["$180\\text{ m}$", "$1.25\\text{ m}$", "$27\\text{ m}$", "$120\\text{ m}$"],
        correct_index: 0,
        explanation: "بالتعويض في $d = v \\cdot t = 15 \\times 12 = 180\\text{ m}$.",
        hint: "اضرب السرعة في الزمن.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "معادلة السرعة المتوسطة", back: "$v = \\frac{d}{t}$ وتُقاس بالمتر لكل ثانية $\\text{m/s}$." },
      { front: "تحويل $\\text{km/h} \\to \\text{m/s}$", back: "اضرب في $\\frac{5}{18}$ (أو اقسم على $3.6$)." },
    ],
  },
  {
    id: "pack-path-motion-1-en",
    lessonSlug: "motion-basics",
    trackSlug: "demo-motion-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 1,
    isExtraReview: true,
    title: "What Does Speed Mean?",
    titleAr: "ما معنى السرعة؟",
    titleEn: "What Does Speed Mean?",
    hook: "Speed tells us far more than distance alone—it reveals how much ground an object covers in every single second.",
    summary:
      "Average speed measures distance traveled per unit time via $v = \\frac{d}{t}$, linking SI meters, seconds, and unit conversions reliably.",
    formulaOrRule: "Average Speed $v = \\frac{d}{t}$",
    keyConcepts: [
      {
        id: "path-motion-1a-en",
        stage: "foundation",
        title: "Speed as Rate of Distance Over Time",
        body: "Covering $120\\text{ m}$ in $20\\text{ s}$ equals $6\\text{ m/s}$, meaning $6$ meters pass during each second on average.",
        blocks: [
          { blockId: "pm1e-a", type: "math", tex: "v = \\frac{d}{t}, \\qquad d = v \\cdot t, \\qquad t = \\frac{d}{v}", caption: "Speed-Distance-Time Triad" },
        ],
      },
      {
        id: "path-motion-1b-en",
        stage: "application",
        title: "Converting $\\text{km/h}$ to $\\text{m/s}$",
        body: "Because $1\\text{ km} = 1000\\text{ m}$ and $1\\text{ h} = 3600\\text{ s}$, multiplying $\\text{km/h}$ by $\\frac{5}{18}$ (dividing by $3.6$) yields $\\text{m/s}$.",
        blocks: [
          { blockId: "pm1e-b", type: "math", tex: "54\\text{ km/h} \\times \\frac{5}{18} = 15\\text{ m/s}", caption: "Unit Conversion Example" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Solving for Travel Time",
        problem: "A sprinter averages $v = 8\\text{ m/s}$ over $d = 200\\text{ m}$. Find the elapsed time $t$.",
        steps: [
          "1) Rearrange $v = \\frac{d}{t}$ to $t = \\frac{d}{v}$.",
          "2) Substitute aligned SI units: $t = \\frac{200}{8} = 25\\text{ s}$.",
        ],
        takeaway: "Check distance and speed units before dividing.",
      },
    ],
    commonMistakes: [
      "Inverting the ratio to compute $t/d$ instead of $d/t$.",
      "Mixing kilometers with seconds without applying $\\frac{5}{18}$.",
    ],
    questions: [
      {
        id: "pq-motion-1-en",
        question_type: "multiple-choice",
        prompt: "A scooter moves steadily at $15\\text{ m/s}$ for $12\\text{ s}$. How far does it travel?",
        choices: ["$180\\text{ m}$", "$1.25\\text{ m}$", "$27\\text{ m}$", "$120\\text{ m}$"],
        correct_index: 0,
        explanation: "Using $d = v \\cdot t = 15 \\times 12 = 180\\text{ m}$.",
        hint: "Multiply steady speed by elapsed time.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Average Speed Formula", back: "$v = \\frac{d}{t}$ in SI units of $\\text{m/s}$." },
      { front: "$\\text{km/h} \\to \\text{m/s}$ Factor", back: "Divide by $3.6$ (equivalently multiply by $\\frac{5}{18}$)." },
    ],
  },
  {
    id: "pack-path-motion-2-ar",
    lessonSlug: "motion-graphs",
    trackSlug: "demo-motion-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 2,
    isExtraReview: true,
    title: "احكِ قصة الرسم",
    titleAr: "احكِ قصة الرسم",
    titleEn: "Tell the Graph's Story",
    hook: "المنحنى على رسم المسافة والزمن ليس مجرد خط مرسوم—إن ميله يفضح سرعة الجسم وتوقفه ولحظة انطلاقه فورًا.",
    summary:
      "في منحنى المسافة والزمن $(d-t)$ يمثّل الميل $\\frac{\\Delta d}{\\Delta t}$ السرعة اللحظية، والخط الأفقي يعني السكون، بينما يعني الخط الأكثر انحدارًا سرعة أكبر.",
    formulaOrRule: "ميل منحنى المسافة–الزمن $= \\frac{\\Delta d}{\\Delta t} = v$",
    keyConcepts: [
      {
        id: "path-motion-2a-ar",
        stage: "foundation",
        title: "قراءة الميل على منحنى المسافة–الزمن",
        body: "كلما زاد ميل الخط المستقيم الصاعد قطع الجسم مسافة أكبر في نفس الزمن، أي ارتفعت سرعته؛ أما القطعة الأفقية حيث $\\Delta d = 0$ فتعني جسمًا ساكنًا.",
        blocks: [
          {
            blockId: "pm2-a",
            type: "math",
            tex: "\\text{Slope} = \\frac{d_2 - d_1}{t_2 - t_1} = v",
            caption: "معنى الميل هندسيًا وفيزيائيًا",
          },
        ],
      },
      {
        id: "path-motion-2b-ar",
        stage: "mechanism",
        title: "التمييز بين السكون والحركة المنتظمة",
        body: "الخط المستقيم المائل يعني سرعة منتظمة ثابتة، بينما تغير الميل (منحنى غير مستقيم) يشير لتسارع أو تباطؤ الجسم.",
        blocks: [
          {
            blockId: "pm2-b",
            type: "callout",
            variant: "pitfall",
            title: "فخ شائع عند قراءة الخط الأفقي",
            content: "على رسم (المسافة–الزمن)، الخط الأفقي يعني أن المسافة لا تتغير فالجسم **متوقف** ($v=0$)، وليس يتحرك بسرعة ثابتة!",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "استخراج السرعة من مرحلتين في رسم بياني",
        problem: "تحرك جسم من $d=0\\text{ m}$ عند $t=0\\text{ s}$ إلى $d=30\\text{ m}$ عند $t=5\\text{ s}$، ثم ثبت عند $30\\text{ m}$ حتى $t=9\\text{ s}$. صف حركته.",
        steps: [
          "١) في الفترة $[0, 5]\\text{ s}$: الميل $= \\frac{30 - 0}{5 - 0} = 6\\text{ m/s}$ (حركة بسرعة منتظمة).",
          "٢) في الفترة $[5, 9]\\text{ s}$: الميل $= \\frac{30 - 30}{9 - 5} = 0\\text{ m/s}$ (توقف تام لمدة $4\\text{ s}$).",
        ],
        takeaway: "احسب الميل $\\frac{\\Delta d}{\\Delta t}$ لكل قطعة مستقيمة على حدة لقراءة القصة كاملة.",
      },
    ],
    commonMistakes: [
      "الظن أن الخط الأفقي على رسم المسافة–الزمن يمثل سرعة منتظمة؛ الصحيح أن ذلك على رسم (السرعة–الزمن) فقط.",
    ],
    questions: [
      {
        id: "pq-motion-2-ar",
        question_type: "multiple-choice",
        prompt: "ماذا يدل وجود خط أفقي موازٍ لمحور الزمن في رسم (المسافة–الزمن)؟",
        choices: ["الجسم متوقف ($v=0$)", "الجسم يتسارع بانتظام", "السرعة تزداد للضعف", "الجسم يعود للخلف"],
        correct_index: 0,
        explanation: "ثبات قيمة المسافة مع مرور الزمن يعني $\\Delta d = 0$ وبالتالي السرعة صفر.",
        hint: "هل يتغير موضع الجسم بمرور الثواني؟",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "ميل منحنى (المسافة–الزمن)", back: "يساوي السرعة $v = \\frac{\\Delta d}{\\Delta t}$؛ الميل الصفر يعني السكون." },
      { front: "الخط الأشد انحدارًا في $(d-t)$", back: "يمثل جسمًا يتحرك بسرعة أكبر من الخط الأقل انحدارًا." },
    ],
  },
  {
    id: "pack-path-motion-2-en",
    lessonSlug: "motion-graphs",
    trackSlug: "demo-motion-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 2,
    isExtraReview: true,
    title: "Tell the Graph's Story",
    titleAr: "احكِ قصة الرسم",
    titleEn: "Tell the Graph's Story",
    hook: "A line on a distance–time graph tells a complete story: its steepness exposes speed, and a flat segment freezes motion completely.",
    summary:
      "On a distance–time graph, slope $\\frac{\\Delta d}{\\Delta t}$ equals speed: steeper upward lines show faster steady motion and horizontal lines show rest.",
    formulaOrRule: "Distance–Time Slope $= \\frac{\\Delta d}{\\Delta t} = v$",
    keyConcepts: [
      {
        id: "path-motion-2a-en",
        stage: "foundation",
        title: "Reading Slope as Speed",
        body: "Greater slope means more distance gained per second; a horizontal line has $\\Delta d = 0$, proving the object is stationary ($v = 0$).",
        blocks: [
          { blockId: "pm2e-a", type: "math", tex: "\\text{Slope} = \\frac{d_2 - d_1}{t_2 - t_1} = v", caption: "Slope Formula" },
        ],
      },
      {
        id: "path-motion-2b-en",
        stage: "mechanism",
        title: "Straight Lines vs. Curves",
        body: "A straight slanted segment represents constant speed, whereas a curved graph reveals changing speed (acceleration or deceleration).",
        blocks: [
          {
            blockId: "pm2e-b",
            type: "callout",
            variant: "pitfall",
            title: "Horizontal Segment Misconception",
            content: "A horizontal line on a **distance–time** graph means $v = 0$ (stopped), whereas on a velocity–time graph it means constant velocity.",
          },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Decoding a Multi-Segment Motion Graph",
        problem: "An object rises from $0\\text{ m}$ to $30\\text{ m}$ over $5\\text{ s}$, then remains at $30\\text{ m}$ from $t=5\\text{ s}$ to $t=9\\text{ s}$. Interpret both intervals.",
        steps: [
          "1) From $0\\text{ s}$ to $5\\text{ s}$: slope $= \\frac{30 - 0}{5 - 0} = 6\\text{ m/s}$ (steady motion).",
          "2) From $5\\text{ s}$ to $9\\text{ s}$: slope $= \\frac{30 - 30}{9 - 5} = 0\\text{ m/s}$ (at rest for $4\\text{ s}$).",
        ],
        takeaway: "Compute $\\frac{\\Delta d}{\\Delta t}$ per segment to translate visual lines into speeds.",
      },
    ],
    commonMistakes: [
      "Reading a flat line on a distance–time graph as constant nonzero speed instead of zero speed (stopped).",
    ],
    questions: [
      {
        id: "pq-motion-2-en",
        question_type: "multiple-choice",
        prompt: "What does a horizontal line parallel to the time axis indicate on a distance–time graph?",
        choices: ["Object at rest ($v=0$)", "Uniform acceleration", "Doubling speed", "Moving backward steadily"],
        correct_index: 0,
        explanation: "No change in distance ($\\Delta d = 0$) over elapsed time means zero speed.",
        hint: "Check whether the distance reading changes as time passes.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Distance–Time Graph Slope", back: "$\\frac{\\Delta d}{\\Delta t} = v$; zero slope means stopped." },
      { front: "Steeper Upward Segment", back: "Indicates faster steady speed." },
    ],
  },

  // =========================================================================
  // RESPIRATORY SYSTEM PATHWAY — 7 LESSONS (ARABIC + ENGLISH SUPPORT)
  // =========================================================================
  {
    id: "pack-path-resp-1-ar",
    lessonSlug: "respiratory-intro",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 1,
    isExtraReview: true,
    title: "مقدمة الجهاز التنفسي والغاية من تبادل الغازات",
    titleAr: "مقدمة الجهاز التنفسي والغاية من تبادل الغازات",
    titleEn: "Introduction to the Respiratory System and Gas Exchange",
    hook: "الشهيق ليس غاية في ذاته؛ إنما هو محطة الإمداد الأولى لتوصيل $\\mathrm{O_2}$ إلى الميتوكوندريا وإنتاج عملة الطاقة الخلوية $\\mathrm{ATP}$.",
    summary:
      "يتكامل الجهاز التنفسي مع الجهاز الدوري لتزويد الخلايا بغاز $\\mathrm{O_2}$ اللازم للتنفس الخلوي والتخلص من غاز $\\mathrm{CO_2}$ الناتج عن الأيض، وتُقاس كفاءة التهوية بحجم التهوية الرئوية في الدقيقة.",
    formulaOrRule: "حجم التهوية في الدقيقة $=$ عدد الأنفاس في الدقيقة $\\times$ الحجم الجاري",
    keyConcepts: [
      {
        id: "resp-1a-ar",
        stage: "foundation",
        title: "التهوية الرئوية مقابل التنفس الخلوي",
        body: "التهوية الرئوية حركة ميكانيكية لتجديد هواء الحويصلات، بينما التنفس الخلوي تفاعل كيميائي حيوي داخل الخلايا يؤكسد الجلوكوز لإنتاج $\\mathrm{ATP}$ وإطلاق $\\mathrm{CO_2}$.",
        blocks: [
          {
            blockId: "r1a-1",
            type: "chemistry",
            equation: "\\mathrm{C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + ATP}", tex: "\\mathrm{C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + ATP}",
            caption: "معادلة التنفس الخلوي الهوائي",
          },
        ],
      },
      {
        id: "resp-1b-ar",
        stage: "application",
        title: "حساب التهوية الرئوية في الدقيقة",
        body: "عند الراحة يتنفس البالغ قرابة $12$ نفسًا في الدقيقة بحجم جارٍ $\\approx 500\\text{ mL}$ فتبلغ التهوية $6\\text{ L/min}$، وترتفع أضعافًا أثناء الجهد البدني.",
        blocks: [
          { blockId: "r1a-2", type: "math", tex: "\\dot{V}_E = f \\times V_T = 12 \\times 500\\text{ mL} = 6000\\text{ mL/min}", caption: "التهوية الدقيقة عند الراحة" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب التهوية أثناء نشاط رياضي",
        problem: "ارتفع معدل التنفس إلى $20$ نفسًا/دقيقة وزاد الحجم الجاري إلى $750\\text{ mL}$. احسب التهوية الدقيقة.",
        steps: [
          "١) اضرب المعدل في الحجم الجاري: $20 \\times 750 = 15\\,000\\text{ mL/min}$.",
          "٢) حوّل إلى اللترات بالقسمة على $1000$: $15\\text{ L/min}$.",
        ],
        takeaway: "تضاعف الحاجة لـ $\\mathrm{ATP}$ يرفع كلا من معدل التنفس وعمق النفس معًا.",
      },
    ],
    commonMistakes: [
      "الخلط بين عملية التنفس الميكانيكية (الشهيق والزفير) والتنفس الخلوي المنتِج لـ $\\mathrm{ATP}$ داخل الخلية.",
    ],
    questions: [
      {
        id: "pq-resp-1-ar",
        question_type: "multiple-choice",
        prompt: "ما الوظيفة الأيضية المباشرة للأكسجين $\\mathrm{O_2}$ الذي يستنشقه الإنسان؟",
        choices: [
          "إتمام التنفس الخلوي في الميتوكوندريا لتوليد $\\mathrm{ATP}$",
          "تكسير الغضاريف في القصبة الهوائية",
          "خفض حرارة الهواء داخل المعدة",
          "وقف نقل الدم عبر الأوردة",
        ],
        correct_index: 0,
        explanation: "يُستخدم $\\mathrm{O_2}$ داخل الميتوكوندريا لاستخلاص الطاقة من الغذاء على هيئة جزيئات $\\mathrm{ATP}$.",
        hint: "اربط بين الرئة وهدف الخلية الأساسي من الطاقة.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "التهوية الرئوية مقابل التنفس الخلوي", back: "التهوية: تبادل الهواء مع الرئتين؛ التنفس الخلوي: أكسدة الغذاء لإنتاج $\\mathrm{ATP}$." },
      { front: "الحجم الجاري عند الراحة", back: "$\\approx 500\\text{ mL}$ لكل نفس هادئ." },
    ],
  },
  {
    id: "pack-path-resp-1-en",
    lessonSlug: "respiratory-intro",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 1,
    isExtraReview: true,
    title: "Introduction to the Respiratory System and Gas Exchange",
    titleAr: "مقدمة الجهاز التنفسي والغاية من تبادل الغازات",
    titleEn: "Introduction to the Respiratory System and Gas Exchange",
    hook: "Breathing is not the finish line—it is the logistics chain supplying $\\mathrm{O_2}$ to mitochondria so cells can mint $\\mathrm{ATP}$ and clear $\\mathrm{CO_2}$.",
    summary:
      "The respiratory and circulatory systems cooperate continuously to deliver $\\mathrm{O_2}$ for cellular respiration and expel metabolic $\\mathrm{CO_2}$, quantified via minute ventilation.",
    formulaOrRule: "Minute Ventilation $= \\text{Breathing Rate} \\times \\text{Tidal Volume}$",
    keyConcepts: [
      {
        id: "resp-1a-en",
        stage: "foundation",
        title: "Ventilation vs. Cellular Respiration",
        body: "Pulmonary ventilation refreshes alveolar air mechanically, while cellular respiration oxidizes glucose biochemically to generate $\\mathrm{ATP}$ and $\\mathrm{CO_2}$.",
        blocks: [
          { blockId: "r1e-1", type: "chemistry", equation: "\\mathrm{C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + ATP}", tex: "\\mathrm{C_6H_{12}O_6 + 6O_2 \\longrightarrow 6CO_2 + 6H_2O + ATP}", caption: "Cellular Respiration Equation" },
        ],
      },
      {
        id: "resp-1b-en",
        stage: "application",
        title: "Calculating Minute Ventilation",
        body: "At rest, $12\\text{ breaths/min}$ at $500\\text{ mL}$ tidal volume yields $6\\text{ L/min}$ total airflow.",
        blocks: [
          { blockId: "r1e-2", type: "math", tex: "\\dot{V}_E = 12 \\times 500\\text{ mL} = 6000\\text{ mL/min} = 6\\text{ L/min}", caption: "Resting Minute Ventilation" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Exercise Minute Ventilation",
        problem: "During jogging, rate rises to $20\\text{ breaths/min}$ and tidal volume hits $750\\text{ mL}$. Compute $\\dot{V}_E$.",
        steps: [
          "1) Multiply frequency by tidal volume: $20 \\times 750 = 15\\,000\\text{ mL/min}$.",
          "2) Convert to liters: $15\\text{ L/min}$.",
        ],
        takeaway: "Higher metabolic demand raises both breathing frequency and depth.",
      },
    ],
    commonMistakes: [
      "Confusing mechanical lung ventilation with mitochondrial cellular respiration.",
    ],
    questions: [
      {
        id: "pq-resp-1-en",
        question_type: "multiple-choice",
        prompt: "What is the direct cellular role of inhaled $\\mathrm{O_2}$?",
        choices: [
          "Supporting aerobic cellular respiration to produce $\\mathrm{ATP}$",
          "Stiffening tracheal cartilage rings",
          "Digesting starch inside alveoli",
          "Stopping venous blood return",
        ],
        correct_index: 0,
        explanation: "Mitochondria use $\\mathrm{O_2}$ as the terminal electron acceptor to synthesize $\\mathrm{ATP}$ efficiently.",
        hint: "Connect lung uptake to mitochondrial energy production.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Ventilation vs. Cellular Respiration", back: "Ventilation moves air; cellular respiration produces $\\mathrm{ATP}$ using $\\mathrm{O_2}$." },
      { front: "Minute Ventilation Equation", back: "$\\dot{V}_E = \\text{Rate} \\times \\text{Tidal Volume}$." },
    ],
  },
  {
    id: "pack-path-resp-2-ar",
    lessonSlug: "respiratory-airway-path",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 2,
    isExtraReview: true,
    title: "أعضاء الجهاز التنفسي ومسار الهواء",
    titleAr: "أعضاء الجهاز التنفسي ومسار الهواء",
    titleEn: "Respiratory Organs and the Pathway of Air",
    hook: "قبل أن يلمس الهواء الرئة الرقيقة بملليمتر واحد، يمر عبر محطة تكييف وتنقية وحماية متسلسلة من الأنف حتى الشعيبات.",
    summary:
      "يعبر الهواء بالتتابع: التجويف الأنفي (تدفئة وترطيب وتنقية) فالبلعوم فالحنجرة المحمية بلسان المزمار فالقصبة الهوائية ذات الحلقات الغضروفية C فالشعبتين ثم الشعيبات.",
    formulaOrRule: "الأنف $\\to$ البلعوم $\\to$ الحنجرة $\\to$ القصبة الهوائية $\\to$ الشعبتان $\\to$ الشعيبات",
    keyConcepts: [
      {
        id: "resp-2a-ar",
        stage: "foundation",
        title: "وظائف التكييف في الأنف والوقاية في الحنجرة",
        body: "تدفيء الشعيرات الدموية الأنفية الهواء البارد، ويرطبه المخاط، وتلتقط الأهداب الغبار؛ بينما يغلق لسان المزمار مدخل الحنجرة لحظة البلع لمنع الشرقة.",
        blocks: [
          { blockId: "r2a-1", type: "callout", variant: "tip", title: "لماذا نتنفس من الأنف؟", content: "التنفس الأنفي يُدخل هواءً دافئًا رطبًا منقّى يقلل تهيج القصبة والحويصلات مقارنة بالتنفس الفموي." },
        ],
      },
      {
        id: "resp-2b-ar",
        stage: "mechanism",
        title: "الحلقات الغضروفية للقصبة الهوائية",
        body: "تستند القصبة الهوائية على حلقات غضروفية غير مكتملة على شكل حرف $C$ مفتوحة من الخلف جهة المريء لتبقى مجرى الهواء مفتوحًا دون إعاقة تمدد المريء عند البلع.",
        blocks: [
          { blockId: "r2a-2", type: "explanation", content: "تتفرع القصبة إلى شعبتين رئيسيتين ثم شعيبات دقيقة تتضاعف أعدادها $2^n$ لتوزيع الهواء على كل فصوص الرئتين." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب تفرعات الشعب الهوائية المتتالية",
        problem: "إذا انقسمت القصبة المفردة ($1$) لفرعين ثم كل فرع لاثنين على مدى $3$ أجيال تفرع، فكم عدد القنوات في الجيل الثالث؟",
        steps: [
          "١) الجيل الأول: $2^1 = 2$ شعبة رئيسية.",
          "٢) الجيل الثاني: $2^2 = 4$ فروع، والجيل الثالث: $2^3 = 8$ فروع.",
        ],
        takeaway: "التفرع الشجري يخفض سرعة التيار المفاجئة ويوزع الهواء بالتساوي على ملايين الحويصلات.",
      },
    ],
    commonMistakes: [
      "الاعتقاد أن حلقات القصبة الغضروفية مكتملة الدائرة — بل هي بشكل حرف $C$ كي يتمدد المريء خلفها بحرية عند البلع.",
    ],
    questions: [
      {
        id: "pq-resp-2-ar",
        question_type: "multiple-choice",
        prompt: "ما فائدة أن تكون حلقات الغضروف في القصبة الهوائية غير مكتملة من الخلف (شكل $C$)؟",
        choices: [
          "تسمح للمريء المجاور بالتمدد أثناء بلع الطعام دون انغلاق المجرى التنفسي",
          "تمنع دخول الأكسجين للرئة اليمنى",
          "تغلق الحنجرة أثناء النوم",
          "تنتج خلايا الدم الحمراء",
        ],
        correct_index: 0,
        explanation: "تمنع الصلابة الأمامية انطباق القصبة، بينما يسمح الفراغ الخلفي بتمدد المريء أثناء مرور اللقمة.",
        hint: "تذكر العضو الملاصق لخلف القصبة الهوائية.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "وظيفة لسان المزمار", back: "يغلق فتحة الحنجرة أثناء البلع لتوجيه الطعام إلى المريء لا إلى القصبة الهوائية." },
      { front: "حلقات القصبة الغضروفية C", back: "تبقي مجرى الهواء مفتوحًا دائمًا وتسمح للمريء خلفها بالتمدد وقت البلع." },
    ],
  },
  {
    id: "pack-path-resp-2-en",
    lessonSlug: "respiratory-airway-path",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 2,
    isExtraReview: true,
    title: "Respiratory Organs and the Pathway of Air",
    titleAr: "أعضاء الجهاز التنفسي ومسار الهواء",
    titleEn: "Respiratory Organs and the Pathway of Air",
    hook: "Before air touches delicate alveoli, a built-in conditioning pipeline warms, humidifies, filters, and routes every breath safely.",
    summary:
      "Inhaled air traverses the nasal cavity, pharynx, larynx (guarded by the epiglottis), C-ringed trachea, bronchi, and branching bronchioles.",
    formulaOrRule: "Nasal cavity $\\to$ Pharynx $\\to$ Larynx $\\to$ Trachea $\\to$ Bronchi $\\to$ Bronchioles",
    keyConcepts: [
      {
        id: "resp-2a-en",
        stage: "foundation",
        title: "Air Conditioning & Swallowing Defense",
        body: "Nasal capillaries warm cold air while mucus and hairs trap debris; during swallowing, the epiglottis covers the laryngeal inlet to prevent food aspiration.",
        blocks: [
          { blockId: "r2e-1", type: "callout", variant: "tip", title: "Nasal vs. Mouth Breathing", content: "Nasal breathing humidifies and filters air far better than mouth breathing." },
        ],
      },
      {
        id: "resp-2b-en",
        stage: "mechanism",
        title: "Why Tracheal Cartilage Forms C-Rings",
        body: "Incomplete C-shaped hyaline cartilage rings keep the airway patent while letting the flexible posterior esophagus expand during swallowing.",
        blocks: [
          { blockId: "r2e-2", type: "explanation", content: "Repeated dichotomous branching distributes airflow smoothly across lung lobes." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Counting Binary Airway Branches",
        problem: "Starting from $1$ trachea splitting into $2$ bronchi per generation for $3$ generations, how many branches exist at generation $3$?",
        steps: [
          "1) Gen 1: $2^1 = 2$ main bronchi.",
          "2) Gen 3: $2^3 = 8$ conducting branches distributing airflow evenly.",
        ],
        takeaway: "Exponential branching expands cross-sectional area and lowers airway resistance.",
      },
    ],
    commonMistakes: [
      "Thinking tracheal rings are complete closed circles — they are C-shaped to leave room behind for the esophagus.",
    ],
    questions: [
      {
        id: "pq-resp-2-en",
        question_type: "multiple-choice",
        prompt: "Why are tracheal cartilage rings C-shaped (open posteriorly) rather than closed circles?",
        choices: [
          "To keep the airway open while letting the esophagus expand during swallowing",
          "To block oxygen from entering the left lung",
          "To collapse the pharynx during speech",
          "To synthesize blood plasma",
        ],
        correct_index: 0,
        explanation: "Anterior cartilage stops airway collapse, while the open posterior muscular wall gives room for food boluses in the esophagus.",
        hint: "Consider the organ sitting immediately behind the trachea.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "Role of the Epiglottis", back: "Covers the larynx during swallowing so food travels down the esophagus cleanly." },
      { front: "C-Shaped Tracheal Rings", back: "Maintain airway patency without obstructing esophageal expansion." },
    ],
  },
  {
    id: "pack-path-resp-3-ar",
    lessonSlug: "lungs-and-alveoli",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 3,
    isExtraReview: true,
    title: "الرئتان والحويصلات الهوائية: بنية التبادل الغازي",
    titleAr: "الرئتان والحويصلات الهوائية: بنية التبادل الغازي",
    titleEn: "The Lungs and Alveoli: Architecture of Gas Exchange",
    hook: "مساحة سطح الرئتين الداخلية تقارب مساحة ملعب تنس رغم صغر حجم الصدر—بفضل مئات الملايين من الحويصلات الرقيقة.",
    summary:
      "تحقق الحويصلات الهوائية أقصى انتشار وفق قانون فيك عبر مساحة سطح ضخمة، وجدار من طبقة خلوية واحدة ($\\approx 0.5\\,\\mu\\text{m}$)، وشبكة شعيرات كثيفة، ومادة الفاعل بالسطح الرئوي (Surfactant).",
    formulaOrRule: "معدل الانتشار $\\propto \\frac{\\text{المساحة } \\times \\text{ فرق التركيز}}{\\text{سُمك الغشاء}}$ (قانون فيك)",
    keyConcepts: [
      {
        id: "resp-3a-ar",
        stage: "foundation",
        title: "التكيفات الثلاثة لكفاءة الحويصلات",
        body: "جدار الحويصلة رقيق جدًا من خلية واحدة رطبة لتحلل الغازات سريعًا، وتلتف حولها شبكة شعيرات دموية كثيفة لتقليل مسافة الانتشار.",
        blocks: [
          { blockId: "r3a-1", type: "math", tex: "A_{\\text{total}} = N_{\\text{alveoli}} \\times A_{\\text{single}}", caption: "تضاعف مساحة السطح الكلية" },
        ],
      },
      {
        id: "resp-3b-ar",
        stage: "mechanism",
        title: "دور الفاعل بالسطح الرئوي (Surfactant)",
        body: "تفرز خلايا الحويصلات مادة دهنية تقلل التوتر السطحي للطبقة المائية المبطنة كي لا تنكمش الحويصلات وتلتصق جدرانها بعد الزفير.",
        blocks: [
          { blockId: "r3a-2", type: "callout", variant: "tip", title: "منع انخماص الحويصلات", content: "بدون Surfactant يصبح فتح الحويصلات الصغيرة مع كل شهيق مرهقًا جدًا للعضلات التنفسية." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب مساحة سطح حويصلية مجمعة",
        problem: "تحتوي عينة رئوية على $400$ حويصلة مساحة كل منها $0.25\\text{ mm}^2$. احسب المساحة السطحية الإجمالية.",
        steps: [
          "١) اضرب عدد الحويصلات في مساحة الواحدة: $400 \\times 0.25$.",
          "٢) الناتج $= 100\\text{ mm}^2$.",
        ],
        takeaway: "تجزئة الفراغ إلى ملايين الحويصلات الصغيرة يضاعف مساحة الانتشار عشرات المرات.",
      },
    ],
    commonMistakes: [
      "الاعتقاد أن جدار الحويصلة متعدد الطبقات العضلية — بل هو رقيق جدًا ($\\approx 0.5\\,\\mu\\text{m}$) لتقليل مسافة انتشار الغازات.",
    ],
    questions: [
      {
        id: "pq-resp-3-ar",
        question_type: "multiple-choice",
        prompt: "ما الوظيفة الأساسية لمادة الفاعل بالسطح الرئوي (Surfactant) داخل الحويصلات؟",
        choices: [
          "خفض التوتر السطحي ومنع انخماص الحويصلات عند الزفير",
          "زيادة سُمك جدار الحويصلات",
          "نقل الجلوكوز للقلب",
          "إغلاق الشعيرات الدموية",
        ],
        correct_index: 0,
        explanation: "يقلل الـ Surfactant التوتر السطحي للماء داخل الحويصلة فتبقى مفتوحة وسهلة التمدد.",
        hint: "فكر في قوة التوتر السطحي للماء داخل فقاعات مجهرية رطبة.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "مزايا الحويصلات لانتشار الغازات", back: "مساحة سطح هائلة + جدار رقيق أحادي الخلية ($\\approx 0.5\\,\\mu\\text{m}$) + شبكة شعيرات كثيفة." },
      { front: "وظيفة Surfactant", back: "تقليل التوتر السطحي لمنع انهيار وانخماص الحويصلات الهوائية." },
    ],
  },
  {
    id: "pack-path-resp-3-en",
    lessonSlug: "lungs-and-alveoli",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 3,
    isExtraReview: true,
    title: "The Lungs and Alveoli: Architecture of Gas Exchange",
    titleAr: "الرئتان والحويصلات الهوائية: بنية التبادل الغازي",
    titleEn: "The Lungs and Alveoli: Architecture of Gas Exchange",
    hook: "Packing hundreds of millions of microscopic alveoli turns a compact ribcage into an internal gas-diffusion surface the size of a tennis court.",
    summary:
      "Alveoli maximize Fick's Law diffusion via immense surface area, ultra-thin single-cell walls (~$0.5\\,\\mu\\text{m}$), dense capillary wrapping, and pulmonary surfactant.",
    formulaOrRule: "Diffusion Rate $\\propto \\frac{\\text{Area } \\times \\text{ Pressure Gradient}}{\\text{Membrane Thickness}}$",
    keyConcepts: [
      {
        id: "resp-3a-en",
        stage: "foundation",
        title: "Structural Adaptations for Diffusion",
        body: "Ultra-thin squamous alveolar walls sit directly against capillary endothelium, minimizing diffusion distance while keeping respiratory surfaces moist.",
        blocks: [
          { blockId: "r3e-1", type: "math", tex: "A_{\\text{total}} = N_{\\text{alveoli}} \\times A_{\\text{single}}", caption: "Cumulative Alveolar Surface" },
        ],
      },
      {
        id: "resp-3b-en",
        stage: "mechanism",
        title: "Pulmonary Surfactant & Surface Tension",
        body: "Secreted surfactant lowers the surface tension of alveolar fluid film so small alveoli do not collapse upon exhalation.",
        blocks: [
          { blockId: "r3e-2", type: "callout", variant: "tip", title: "Preventing Alveolar Collapse", content: "Without surfactant, breathing effort spikes dramatically as water film pulls tiny air sacs shut." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Computing Combined Alveolar Surface Area",
        problem: "A lung sample contains $400$ alveoli averaging $0.25\\text{ mm}^2$ each. Compute their total surface area.",
        steps: [
          "1) Multiply count by area per sac: $400 \\times 0.25$.",
          "2) Total diffusion area $= 100\\text{ mm}^2$.",
        ],
        takeaway: "Subdividing volume into millions of tiny spheres vastly amplifies exchange area.",
      },
    ],
    commonMistakes: [
      "Thinking alveolar walls have thick muscle layers — diffusion requires ~0.5 $\\mu$m single-cell thinness.",
    ],
    questions: [
      {
        id: "pq-resp-3-en",
        question_type: "multiple-choice",
        prompt: "What primary function does pulmonary surfactant serve inside alveoli?",
        choices: [
          "Lowering surface tension to prevent alveolar collapse",
          "Thickening capillary walls to slow blood flow",
          "Digesting lipid droplets in air",
          "Blocking red blood cells from hemoglobin binding",
        ],
        correct_index: 0,
        explanation: "Surfactant disrupts cohesive water film tension so small alveoli stay open easily.",
        hint: "Think about water droplets pulling inward inside microscopic moist sacs.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "Three Alveolar Adaptations", back: "Huge surface area, ~$0.5\\,\\mu\\text{m}$ thin moist walls, and dense capillary networks." },
      { front: "Role of Surfactant", back: "Lowers fluid surface tension so alveoli resist collapsing during exhalation." },
    ],
  },
  {
    id: "pack-path-resp-4-ar",
    lessonSlug: "breathing-mechanics",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 4,
    isExtraReview: true,
    title: "ميكانيكا التنفس: الحجاب الحاجز والشهيق والزفير",
    titleAr: "ميكانيكا التنفس: الحجاب الحاجز والشهيق والزفير",
    titleEn: "Breathing Mechanics: Diaphragm, Inhalation, and Exhalation",
    hook: "الرئتان لا تسحبان الهواء بنفسيهما؛ إنما توسّع عضلات الصدر والحجاب الحاجز القفصَ الصدري فينخفض الضغط وفق قانون بويل ويندفع الهواء للداخل.",
    summary:
      "تخضع التهوية لقانون بويل ($P_1 V_1 = P_2 V_2$): في الشهيق ينقبض الحجاب الحاجز لأسفل وتتسع الأضلاع فيكبر الحجم ويقل الضغط عن الجوي، وفي الزفير الهادئ تنبسط العضلات فينضغط الهواء للخارج.",
    formulaOrRule: "قانون بويل: $P \\propto \\frac{1}{V}$ عند ثبات الحرارة ($P_1 V_1 = P_2 V_2$)",
    keyConcepts: [
      {
        id: "resp-4a-ar",
        stage: "foundation",
        title: "آلية الشهيق النشط (Inhalation)",
        body: "ينقبض الحجاب الحاجز متسطحًا لأسفل وتنقبض العضلات بين الضلعية الخارجية رافعةً القفص الصدري، فيزداد حجم التجويف الصدري ويهبط الضغط الحويصلي دون $760\\text{ mmHg}$ فيندفع الهواء داخلًا.",
        blocks: [
          { blockId: "r4a-1", type: "math", tex: "V_{\\text{thorax}} \\uparrow \\implies P_{\\text{alveolar}} < P_{\\text{atm}} \\implies \\text{دخول الهواء (شهيق)}", caption: "ديناميكا الشهيق" },
        ],
      },
      {
        id: "resp-4b-ar",
        stage: "mechanism",
        title: "الزفير الهادئ (Passive Exhalation)",
        body: "في التنفس الهادئ ينبسط الحجاب الحاجز عائدًا للأعلى وترتد أنسجة الرئة المرنة فيصغر الحجم ويرتفع الضغط الحويصلي فوق الجوي ($\\approx 762\\text{ mmHg}$) فيخرج الهواء تلقائيًا.",
        blocks: [
          { blockId: "r4a-2", type: "callout", variant: "pitfall", title: "هل الرئة تنقبض ذاتيًا؟", content: "الرئة عضو مرن لا يحتوي عضلات دافعة للهواء؛ التغير الحجمي تصنعه عضلتا الحجاب الحاجز وبين الضلعية فقط." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب فرق الضغط الدافع للشهيق",
        problem: "إذا كان الضغط الجوي $760\\text{ mmHg}$ وهبط الضغط داخل الحويصلات إلى $757\\text{ mmHg}$، فما فرق الضغط الساحب للهواء؟",
        steps: [
          "١) اطرح الضغط الداخلي من الضغط الجوي: $\\Delta P = 760 - 757$.",
          "٢) فرق الضغط الدافع للشهيق $= 3\\text{ mmHg}$.",
        ],
        takeaway: "الهواء يتحرك دائمًا من الضغط الأعلى إلى الضغط الأقل.",
      },
    ],
    commonMistakes: [
      "الظن أن الحجاب الحاجز يرتفع للأعلى أثناء الشهيق — بل ينقبض ويتسطح لأسفل لتوسيع الصدر.",
    ],
    questions: [
      {
        id: "pq-resp-4-ar",
        question_type: "multiple-choice",
        prompt: "ماذا يحدث لحركة الحجاب الحاجز والضغط داخل الرئتين أثناء الشهيق الطبيعي؟",
        choices: [
          "ينقبض الحجاب الحاجز لأسفل فيزداد الحجم وينخفض الضغط داخل الحويصلات دون الضغط الجوي",
          "ينبسط الحجاب الحاجز للأعلى ويرتفع الضغط الداخلي",
          "يقل حجم القفص الصدري ويزداد الضغط الحويصلي",
          "يتوقف فرق الضغط تمامًا",
        ],
        correct_index: 0,
        explanation: "تسطح الحجاب الحاجز يوسّع الصدر فيخفض الضغط حسب قانون بويل، فيندفع الهواء الجوي الأعلى ضغطًا إلى الداخل.",
        hint: "طبّق العلاقة العكسية في قانون بويل: حجم أكبر يعني ضغطًا أقل.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "حركة الحجاب الحاجز في الشهيق والزفير", back: "شهيق: ينقبض ويهبط لأسفل $\\to$ حجم $\\uparrow$، ضغط $\\downarrow$. زفير هادئ: ينبسط ويرتفع لأعلى $\\to$ حجم $\\downarrow$، ضغط $\\uparrow$." },
      { front: "قانون بويل في التنفس", back: "$P_1 V_1 = P_2 V_2$ (تناسب عكسي بين الضغط والحجم عند ثبات الحرارة)." },
    ],
  },
  {
    id: "pack-path-resp-4-en",
    lessonSlug: "breathing-mechanics",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 4,
    isExtraReview: true,
    title: "Breathing Mechanics: Diaphragm, Inhalation, and Exhalation",
    titleAr: "ميكانيكا التنفس: الحجاب الحاجز والشهيق والزفير",
    titleEn: "Breathing Mechanics: Diaphragm, Inhalation, and Exhalation",
    hook: "Lungs have no muscles to suck air inside—instead, your diaphragm and rib muscles expand the chest so Boyle's Law pulls air inward.",
    summary:
      "Pulmonary ventilation obeys Boyle's Law ($P_1 V_1 = P_2 V_2$): diaphragm contraction expands thoracic volume to drop alveolar pressure below $760\\text{ mmHg}$ during inhalation, while relaxation reverses the gradient for quiet exhalation.",
    formulaOrRule: "Boyle's Law: $P_1 V_1 = P_2 V_2$ ($T$ constant)",
    keyConcepts: [
      {
        id: "resp-4a-en",
        stage: "foundation",
        title: "Active Inhalation via Pressure Drop",
        body: "Contracting the diaphragm downward and external intercostals upward enlarges thoracic volume, lowering alveolar pressure below atmospheric ($760\\text{ mmHg}$) so air rushes in.",
        blocks: [
          { blockId: "r4e-1", type: "math", tex: "V_{\\text{thorax}} \\uparrow \\implies P_{\\text{alveolar}} < P_{\\text{atm}} \\implies \\text{Air Inflow}", caption: "Inhalation Gradient" },
        ],
      },
      {
        id: "resp-4b-en",
        stage: "mechanism",
        title: "Quiet Exhalation via Elastic Recoil",
        body: "Muscle relaxation allows elastic lung recoil to reduce chest volume, lifting alveolar pressure above atmospheric so air exits effortlessly.",
        blocks: [
          { blockId: "r4e-2", type: "callout", variant: "pitfall", title: "Diaphragm Direction Check", content: "During inhalation the diaphragm flattens **downward** (away from the chest cavity), whereas relaxation domes it **upward**." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Calculating Trans-Airway Pressure Gradient",
        problem: "At $P_{\\text{atm}} = 760\\text{ mmHg}$, alveolar pressure drops to $757\\text{ mmHg}$. Find the pressure difference driving inhalation.",
        steps: [
          "1) Subtract alveolar from atmospheric pressure: $\\Delta P = 760 - 757$.",
          "2) Driving pressure gradient $= 3\\text{ mmHg}$ inward.",
        ],
        takeaway: "Bulk airflow always moves from higher pressure to lower pressure.",
      },
    ],
    commonMistakes: [
      "Thinking the diaphragm moves upward during inhalation — it contracts downward to increase chest volume.",
    ],
    questions: [
      {
        id: "pq-resp-4-en",
        question_type: "multiple-choice",
        prompt: "What happens to diaphragm position and intra-alveolar pressure during normal inhalation?",
        choices: [
          "Diaphragm contracts downward, chest volume expands, and alveolar pressure falls below atmospheric",
          "Diaphragm relaxes upward and alveolar pressure spikes",
          "Thoracic volume shrinks while pressure drops",
          "Atmospheric and alveolar pressures stay identical",
        ],
        correct_index: 0,
        explanation: "Downward diaphragm contraction enlarges chest volume, lowering intra-alveolar pressure via Boyle's Law to draw air in.",
        hint: "Apply Boyle's inverse relation between volume and gas pressure.",
        difficulty: "foundational",
      },
    ],
    cards: [
      { front: "Inhalation vs. Exhalation Diaphragm", back: "Inhalation: contracts downward ($V\\uparrow, P\\downarrow$); Quiet exhalation: relaxes upward ($V\\downarrow, P\\uparrow$)." },
      { front: "Boyle's Law", back: "$P_1 V_1 = P_2 V_2$ governs pressure-volume airflow in lungs." },
    ],
  },
  {
    id: "pack-path-resp-5-ar",
    lessonSlug: "gas-exchange-and-circulation",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 5,
    isExtraReview: true,
    title: "تبادل الغازات والدورة الدموية الصغرى",
    titleAr: "تبادل الغازات والدورة الدموية الصغرى",
    titleEn: "Gas Exchange and Pulmonary Circulation",
    hook: "ينساب الأكسجين إلى الدم تلقائيًا دون مضخة طاقة، مدفوعًا بالفرق الواسع بين ضغطه في الحويصلة وضغطه في الشريان الرئوي.",
    summary:
      "تعبر الغازات الغشاء الحويصلي الشعيري بالانتشار البسيط وفق منحدر الضغط الجزئي ($P_{\\mathrm{O_2}}, P_{\\mathrm{CO_2}}$) ويرتبط الأكسجين بالهيموغلوبين عائدًا عبر الأوردة الرئوية للأذين الأيسر.",
    formulaOrRule: "منحدر انتشار $\\mathrm{O_2}$ بالرئة: $\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg}$",
    keyConcepts: [
      {
        id: "resp-5a-ar",
        stage: "foundation",
        title: "الانتشار وفق منحدر الضغط الجزئي",
        body: "يصل الدم غير المؤكسج عبر الشريان الرئوي بـ $P_{\\mathrm{O_2}} \\approx 40\\text{ mmHg}$ مقابل $104\\text{ mmHg}$ في الحويصلة فينتشر $\\mathrm{O_2}$ للدم، بينما ينتقل $\\mathrm{CO_2}$ من $45\\text{ mmHg}$ في الدم إلى $40\\text{ mmHg}$ بالحويصلة.",
        blocks: [
          { blockId: "r5a-1", type: "math", tex: "\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg} \\quad (\\text{الحويصلة } \\to \\text{ الدم})", caption: "القوة الدافعة لانتشار الأكسجين" },
        ],
      },
      {
        id: "resp-5b-ar",
        stage: "mechanism",
        title: "الأوكسيهيموغلوبين والدورة الصغرى",
        body: "يرتبط معظم $\\mathrm{O_2}$ بالهيموغلوبين ($\\mathrm{HbO_2}$) داخل خلايا الدم الحمراء، ثم يعود الدم المؤكسج عبر الأوردة الرئوية إلى الأذين الأيسر للقلب.",
        blocks: [
          { blockId: "r5a-2", type: "callout", variant: "pitfall", title: "استثناء الشرايين والأوردة الرئوية", content: "يحمل **الشريان الرئوي** دمًا غير مؤكسج إلى الرئتين، بينما تعيد **الأوردة الرئوية** دمًا مؤكسجًا إلى الأذين الأيسر." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "مقارنة فرق الضغط الجزئي لـ O2 و CO2",
        problem: "إذا كان $P_{\\mathrm{O_2}}=104\\text{ mmHg}$ و$P_{\\mathrm{CO_2}}=40\\text{ mmHg}$ في الحويصلة مقابل $40\\text{ mmHg}$ و$45\\text{ mmHg}$ في الدم الوارد، فاحسب فرق الضغط لكل غاز.",
        steps: [
          "١) للأكسجين: $\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg}$ نحو الدم.",
          "٢) لثاني أكسيد الكربون: $\\Delta P_{\\mathrm{CO_2}} = 45 - 40 = 5\\text{ mmHg}$ نحو الحويصلة (يكفي لأن ذوبان $\\mathrm{CO_2}$ أعلى بكثير).",
        ],
        takeaway: "اتجاه انتشار كل غاز يحدده منحدر ضغطه الجزئي المستقل فقط.",
      },
    ],
    commonMistakes: [
      "الاعتقاد أن الشريان الرئوي يحمل دمًا مؤكسجًا مثل الشرايين الجهازية — العكس صحيح في الدورة الصغرى.",
    ],
    questions: [
      {
        id: "pq-resp-5-ar",
        question_type: "multiple-choice",
        prompt: "أي الأوعية الدموية يعيد الدم المؤكسج الغني بالأوكسيهيموغلوبين من الرئتين إلى القلب؟",
        choices: ["الأوردة الرئوية نحو الأذين الأيسر", "الشريان الرئوي نحو البطين الأيمن", "الوريد الأجوف العلوي", "الشريان الأورطي نحو الرئة"],
        correct_index: 0,
        explanation: "تصب الأوردة الرئوية الأربعة الدم المؤكسج مباشرة في الأذين الأيسر تمهيدًا لضخه للجسم.",
        hint: "تذكر أي أوعية تدخل الأذين الأيسر قادمة من الرئتين.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "منحدر $P_{\\mathrm{O_2}}$ بالحويصلات", back: "$104\\text{ mmHg}$ بالحويصلة مقابل $40\\text{ mmHg}$ بالدم الوريدي الوارد $\\implies 64\\text{ mmHg}$ للانتشار." },
      { front: "مسار الدورة الدموية الصغرى", back: "بطين أيمن $\\to$ شريان رئوي (غير مؤكسج) $\\to$ رئتان $\\to$ أوردة رئوية (مؤكسج) $\\to$ أذين أيسر." },
    ],
  },
  {
    id: "pack-path-resp-5-en",
    lessonSlug: "gas-exchange-and-circulation",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 5,
    isExtraReview: true,
    title: "Gas Exchange and Pulmonary Circulation",
    titleAr: "تبادل الغازات والدورة الدموية الصغرى",
    titleEn: "Gas Exchange and Pulmonary Circulation",
    hook: "No active ATP pump pushes oxygen into blood—partial-pressure gradients drive both $\\mathrm{O_2}$ loading and $\\mathrm{CO_2}$ unloading automatically.",
    summary:
      "Gases cross the alveolar-capillary barrier by simple diffusion down partial-pressure gradients ($P_{\\mathrm{O_2}}, P_{\\mathrm{CO_2}}$), binding hemoglobin to return via pulmonary veins to the left atrium.",
    formulaOrRule: "Alveolar $\\mathrm{O_2}$ Gradient: $\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg}$",
    keyConcepts: [
      {
        id: "resp-5a-en",
        stage: "foundation",
        title: "Partial-Pressure Gradients",
        body: "Deoxygenated capillary blood arrives at $P_{\\mathrm{O_2}} \\approx 40\\text{ mmHg}$ beneath alveolar air at $104\\text{ mmHg}$, driving $\\mathrm{O_2}$ inward while $\\mathrm{CO_2}$ diffuses outward ($45 \\to 40\\text{ mmHg}$).",
        blocks: [
          { blockId: "r5e-1", type: "math", tex: "\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg}", caption: "Oxygen Diffusion Drive" },
        ],
      },
      {
        id: "resp-5b-en",
        stage: "mechanism",
        title: "Hemoglobin & Pulmonary Circuit Vessels",
        body: "Most $\\mathrm{O_2}$ forms oxyhemoglobin ($\\mathrm{HbO_2}$) in red blood cells and travels back through the pulmonary veins into the left atrium.",
        blocks: [
          { blockId: "r5e-2", type: "callout", variant: "pitfall", title: "Pulmonary Artery vs. Vein Exception", content: "In the pulmonary circuit, **pulmonary arteries** carry deoxygenated blood to the lungs, and **pulmonary veins** return oxygenated blood to the left atrium." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Comparing $\\mathrm{O_2}$ and $\\mathrm{CO_2}$ Gradients",
        problem: "Alveolar air has $P_{\\mathrm{O_2}} = 104$, $P_{\\mathrm{CO_2}} = 40\\text{ mmHg}$; venous capillary blood enters at $40$ and $45\\text{ mmHg}$. Compute both gradients.",
        steps: [
          "1) $\\Delta P_{\\mathrm{O_2}} = 104 - 40 = 64\\text{ mmHg}$ into blood.",
          "2) $\\Delta P_{\\mathrm{CO_2}} = 45 - 40 = 5\\text{ mmHg}$ out into alveoli (sufficient because $\\mathrm{CO_2}$ solubility in plasma is far higher).",
        ],
        takeaway: "Each gas diffuses independently down its own partial-pressure gradient.",
      },
    ],
    commonMistakes: [
      "Assuming the pulmonary artery carries oxygenated blood simply because systemic arteries do.",
    ],
    questions: [
      {
        id: "pq-resp-5-en",
        question_type: "multiple-choice",
        prompt: "Which vessels return oxygenated blood from the lungs to the heart?",
        choices: [
          "Pulmonary veins into the left atrium",
          "Pulmonary artery into the right ventricle",
          "Superior vena cava",
          "Aorta directly to lung tissue",
        ],
        correct_index: 0,
        explanation: "Four pulmonary veins deliver freshly oxygenated blood from pulmonary capillaries into the left atrium.",
        hint: "Trace blood leaving pulmonary capillaries back into the left heart.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "Alveolar $\\Delta P_{\\mathrm{O_2}}$", back: "$104\\text{ mmHg}$ (alveolar) $- 40\\text{ mmHg}$ (venous blood) $= 64\\text{ mmHg}$." },
      { front: "Pulmonary Circuit Flow", back: "Right ventricle $\\to$ pulmonary artery (low $\\mathrm{O_2}$) $\\to$ alveoli $\\to$ pulmonary veins (high $\\mathrm{O_2}$) $\\to$ left atrium." },
    ],
  },
  {
    id: "pack-path-resp-6-ar",
    lessonSlug: "respiratory-health",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 6,
    isExtraReview: true,
    title: "صحة الجهاز التنفسي والعوامل المؤثرة في كفاءته",
    titleAr: "صحة الجهاز التنفسي والعوامل المؤثرة في كفاءته",
    titleEn: "Respiratory Health and Factors Affecting Efficiency",
    hook: "يمتلك أول أكسيد الكربون $\\mathrm{CO}$ قدرة على خطف الهيموغلوبين تفوق الأكسجين بنحو $200$ مرة؛ لذلك فحماية الهواء والأهداب دفاع حياتي مباشر.",
    summary:
      "يحمي المصعد المخاطي الهدبي الشعب الهوائية، بينما يعطّل الدخان والأجسام الدقيقة الأهداب، وينافس $\\mathrm{CO}$ الأكسجين بضراوة، وتُقاس كفاءة الرئة بالسعة الحيوية $VC$.",
    formulaOrRule: "السعة الحيوية $VC = TV + IRV + ERV$",
    keyConcepts: [
      {
        id: "resp-6a-ar",
        stage: "foundation",
        title: "المصعد المخاطي الهدبي وأثر الملوثات",
        body: "يصطاد المخاط الأتربة والميكروبات وتكنسها الأهداب باستمرار نحو الحلق، بينما يشل دخان التبغ والـ $\\mathrm{PM}_{2.5}$ الأهداب فتتراكم الإفرازات وتلتهب الشعب.",
        blocks: [
          { blockId: "r6a-1", type: "callout", variant: "note", title: "سمّية أول أكسيد الكربون CO", content: "ألفة $\\mathrm{CO}$ للهيموغلوبين تعادل $\\approx 200\\times$ ألفة $\\mathrm{O_2}$، فيحرم الأنسجة من الأكسجين حتى لو بدا التنفس سريعًا." },
        ],
      },
      {
        id: "resp-6b-ar",
        stage: "application",
        title: "الحجوم التنفسية والسعة الحيوية",
        body: "السعة الحيوية ($VC$) هي أقصى حجم هواء يخرج بعد أعمق شهيق وتساوي مجموع الحجم الجاري والاحتياطي الشهيقي والاحتياطي الزفيري.",
        blocks: [
          { blockId: "r6a-2", type: "math", tex: "VC = TV + IRV + ERV = 500 + 2500 + 1000 = 4000\\text{ mL}", caption: "حساب السعة الحيوية" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب السعة الحيوية لشخص بالغ",
        problem: "إذا كان الحجم الجاري $500\\text{ mL}$ والاحتياطي الشهيقي $2800\\text{ mL}$ والاحتياطي الزفيري $1100\\text{ mL}$، احسب $VC$.",
        steps: [
          "١) اجمع الحجوم الثلاثة القابلة للقياس بالسبيروميتر: $500 + 2800 + 1100$.",
          "٢) السعة الحيوية $VC = 4400\\text{ mL} = 4.4\\text{ L}$.",
        ],
        takeaway: "التمارين الهوائية تحسّن مرونة جدار الصدر وتحافظ على السعة الحيوية.",
      },
    ],
    commonMistakes: [
      "إدراج الحجم المتبقي (Residual Volume) ضمن السعة الحيوية — السعة الحيوية تشمل الهواء المتحرك فقط دون الهواء المتبقي بالرئة.",
    ],
    questions: [
      {
        id: "pq-resp-6-ar",
        question_type: "multiple-choice",
        prompt: "لماذا يشكّل استنشاق أول أكسيد الكربون $\\mathrm{CO}$ خطرًا حادًا على تزويد الأنسجة بالأكسجين؟",
        choices: [
          "لأنه يرتبط بالهيموغلوبين بألفة تفوق $\\mathrm{O_2}$ بنحو $200$ مرة فيمنعه من نقل الأكسجين",
          "لأنه يحوّل القصبة الهوائية لعظم صلب",
          "لأنه يضاعف إنتاج كرات الدم الحمراء فورًا",
          "لأنه يبرد هواء الأنف",
        ],
        correct_index: 0,
        explanation: "يشكّل $\\mathrm{CO}$ كربوكسي هيموغلوبين مستقرًا جدًا يعطّل مواقع ارتباط الأكسجين بالدم.",
        hint: "قارن شدة ارتباط $\\mathrm{CO}$ بالهيموغلوبين مقارنة بـ $\\mathrm{O_2}$.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "المصعد المخاطي الهدبي", back: "طبقة مخاطية تصطاد الملوثات + أهداب متحركة تدفعها بعيدًا عن الحويصلات." },
      { front: "السعة الحيوية $VC$", back: "$VC = TV + IRV + ERV$ (لا تشمل الحجم المتبقي)." },
    ],
  },
  {
    id: "pack-path-resp-6-en",
    lessonSlug: "respiratory-health",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 6,
    isExtraReview: true,
    title: "Respiratory Health and Factors Affecting Efficiency",
    titleAr: "صحة الجهاز التنفسي والعوامل المؤثرة في كفاءته",
    titleEn: "Respiratory Health and Factors Affecting Efficiency",
    hook: "Carbon monoxide binds hemoglobin roughly $200\\times$ more tightly than oxygen—making clean air and intact cilia critical life-support defenses.",
    summary:
      "The mucociliary escalator sweeps particulates out of airways, tobacco smoke paralyzes cilia, $\\mathrm{CO}$ outcompetes $\\mathrm{O_2}$ at hemoglobin, and spirometry tracks lung Vital Capacity ($VC$).",
    formulaOrRule: "Vital Capacity $VC = TV + IRV + ERV$",
    keyConcepts: [
      {
        id: "resp-6a-en",
        stage: "foundation",
        title: "Mucociliary Escalator & Pollutant Injury",
        body: "Mucus traps dust and pathogens while rhythmic ciliary beating sweeps them upward; smoke and fine $\\mathrm{PM}_{2.5}$ damage cilia and alveolar septa.",
        blocks: [
          { blockId: "r6e-1", type: "callout", variant: "note", title: "Carbon Monoxide Affinity", content: "$\\mathrm{CO}$ binds hemoglobin with $\\approx 200\\times$ higher affinity than $\\mathrm{O_2}$, starving tissues of oxygen delivery." },
        ],
      },
      {
        id: "resp-6b-en",
        stage: "application",
        title: "Lung Volumes & Vital Capacity",
        body: "Vital capacity measures the maximum volume exhaled after maximum inhalation: tidal volume plus inspiratory and expiratory reserve volumes.",
        blocks: [
          { blockId: "r6e-2", type: "math", tex: "VC = TV + IRV + ERV", caption: "Vital Capacity Sum" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Computing Vital Capacity",
        problem: "Given $TV = 500\\text{ mL}$, $IRV = 2800\\text{ mL}$, and $ERV = 1100\\text{ mL}$, compute $VC$.",
        steps: [
          "1) Sum exchangeable volumes: $500 + 2800 + 1100 = 4400\\text{ mL}$.",
          "2) Convert to liters: $VC = 4.4\\text{ L}$.",
        ],
        takeaway: "Residual volume stays trapped inside lungs and is excluded from Vital Capacity.",
      },
    ],
    commonMistakes: [
      "Including Residual Volume inside Vital Capacity — $VC$ excludes non-exhalable residual air.",
    ],
    questions: [
      {
        id: "pq-resp-6-en",
        question_type: "multiple-choice",
        prompt: "Why is carbon monoxide ($\\mathrm{CO}$) inhalation acutely hazardous to tissue oxygenation?",
        choices: [
          "It binds hemoglobin with ~200× greater affinity than $\\mathrm{O_2}$, blocking oxygen transport",
          "It turns tracheal rings into rigid bone",
          "It freezes plasma inside pulmonary veins",
          "It eliminates alveoli surface area overnight",
        ],
        correct_index: 0,
        explanation: "$\\mathrm{CO}$ locks onto hemoglobin binding sites tightly as carboxyhemoglobin, depriving cells of $\\mathrm{O_2}$.",
        hint: "Compare how tightly $\\mathrm{CO}$ vs. $\\mathrm{O_2}$ attaches to hemoglobin.",
        difficulty: "standard",
      },
    ],
    cards: [
      { front: "Mucociliary Escalator", back: "Sticky mucus traps particles while beating cilia sweep them out of conducting airways." },
      { front: "Vital Capacity Formula", back: "$VC = TV + IRV + ERV$." },
    ],
  },
  {
    id: "pack-path-resp-7-ar",
    lessonSlug: "respiratory-integrated-review",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "ar",
    position: 7,
    isExtraReview: true,
    title: "مراجعة وتكامل: من الشهيق إلى التنفس الخلوي",
    titleAr: "مراجعة وتكامل: من الشهيق إلى التنفس الخلوي",
    titleEn: "Integrated Review: From Inhalation to Cellular Respiration",
    hook: "ليس كل الهواء المستنشق يصل للحويصلات؛ ففهم الحيز الميت يميّز بين التهوية السطحية والتهوية الحويصلية الفعّالة لتبادل الغازات.",
    summary:
      "تترابط ميكانيكا بويل والانتشار عبر فيك ونقل الهيموغلوبين في مسار واحد، مع طرح الحيز الميت التشريحي ($\\approx 150\\text{ mL}$) لحساب التهوية الحويصلية الفعّالة.",
    formulaOrRule: "التهوية الحويصلية الفعالة $\\dot{V}_A = f \\times (V_T - V_D)$",
    keyConcepts: [
      {
        id: "resp-7a-ar",
        stage: "foundation",
        title: "الحيز الميت التشريحي والتهوية الحويصلية",
        body: "يبقى نحو $150\\text{ mL}$ من كل نفس في الممرات التوصيلية (القصبة والشعب) ولا يشارك في التبادل؛ لذا الهواء الحويصلي النقي لكل نفس يساوي $V_T - V_D$.",
        blocks: [
          { blockId: "r7a-1", type: "math", tex: "V_A = V_T - V_D = 500 - 150 = 350\\text{ mL/breath}", caption: "الهواء الفعال لكل نفس" },
        ],
      },
      {
        id: "resp-7b-ar",
        stage: "application",
        title: "التكامل الشامل: ميكانيكا $\\to$ انتشار $\\to$ ميتوكوندريا",
        body: "التنفس العميق البطيء يزيد التهوية الحويصلية أكثر من التنفس السطحي السريع حتى عند تساوي التهوية الكلية، مما يحسّن إشباع الهيموغلوبين بالأكسجين.",
        blocks: [
          { blockId: "r7a-2", type: "callout", variant: "tip", title: "مقارنة نمطين بنفس التهوية الكلية $6000\\text{ mL/min}$", content: "بـ $10$ أنفاس عميقة ($V_T = 600\\text{ mL}$) تصل الحويصلات $10 \\times (600 - 150) = 4500\\text{ mL/min}$، أما بـ $30$ نفسًا سطحيًا ($V_T = 200\\text{ mL}$) فلا يصل سوى $30 \\times (200 - 150) = 1500\\text{ mL/min}$ فقط!" },
        ],
      },
    ],
    workedExamples: [
      {
        title: "حساب التهوية الحويصلية الدقيقة",
        problem: "إذا تنفس شخص $14$ مرة/دقيقة بحجم جارٍ $500\\text{ mL}$ وحيز ميت $150\\text{ mL}$، فاحسب التهوية الحويصلية الفعّالة في الدقيقة.",
        steps: [
          "١) اطرح الحيز الميت من الحجم الجاري: $500 - 150 = 350\\text{ mL}$.",
          "٢) اضرب في التردد: $\\dot{V}_A = 14 \\times 350 = 4900\\text{ mL/min} = 4.9\\text{ L/min}$.",
        ],
        takeaway: "التنفس الأعمق يرفع كفاءة وصول الهواء النقي إلى سطح التبادل الغازي.",
      },
    ],
    commonMistakes: [
      "مساواة التهوية الكلية بالتهوية الحويصلية دون طرح الحيز الميت التشريحي $V_D$.",
    ],
    questions: [
      {
        id: "pq-resp-7-ar",
        question_type: "multiple-choice",
        prompt: "عند نفس التهوية الكلية ($6\\text{ L/min}$)، أي نمط تنفس يوفّر تهوية حويصلية فعالة أكبر؟",
        choices: [
          "تنفس عميق وأبطأ ($10$ أنفاس $\\times 600\\text{ mL}$) لأن نسبة الحيز الميت تنخفض",
          "تنفس سريع وسطحي جدًا ($30$ نفسًا $\\times 200\\text{ mL}$)",
          "كلاهما يعطي نفس التهوية الحويصلية تمامًا",
          "إيقاف الشهيق والاكتفاء بالزفير",
        ],
        correct_index: 0,
        explanation: "الأحجام الجارية الأكبر تتجاوز الحيز الميت الثابت ($\\approx 150\\text{ mL}$) بنسبة هواء نقي أعلى بكثير.",
        hint: "اطرح $150\\text{ mL}$ من كل نفس في الحالتين ثم اضرب في عدد الأنفاس.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "الحيز الميت التشريحي $V_D$", back: "$\\approx 150\\text{ mL}$ يبقى في الممرات التوصيلية دون تبادل غازي." },
      { front: "معادلة التهوية الحويصلية الفعّالة", back: "$\\dot{V}_A = f \\times (V_T - V_D)$." },
    ],
  },
  {
    id: "pack-path-resp-7-en",
    lessonSlug: "respiratory-integrated-review",
    trackSlug: "respiratory-pathway",
    subject: "integrated-science",
    contentLanguage: "en",
    position: 7,
    isExtraReview: true,
    title: "Integrated Review: From Inhalation to Cellular Respiration",
    titleAr: "مراجعة وتكامل: من الشهيق إلى التنفس الخلوي",
    titleEn: "Integrated Review: From Inhalation to Cellular Respiration",
    hook: "Not every milliliter of inhaled air reaches gas-exchanging alveoli—accounting for anatomical dead space reveals why deep breaths outperform shallow panting.",
    summary:
      "Boyle's mechanics, Fick's alveolar diffusion, hemoglobin transport, and cellular respiration integrate sequentially, with effective alveolar ventilation subtracting ~$150\\text{ mL}$ anatomical dead space per breath.",
    formulaOrRule: "Alveolar Ventilation $\\dot{V}_A = f \\times (V_T - V_D)$",
    keyConcepts: [
      {
        id: "resp-7a-en",
        stage: "foundation",
        title: "Anatomical Dead Space & Alveolar Delivery",
        body: "Roughly $150\\text{ mL}$ remains inside conducting bronchi and trachea without exchanging gases, leaving $V_T - V_D$ fresh air per breath at the alveoli.",
        blocks: [
          { blockId: "r7e-1", type: "math", tex: "V_A = V_T - V_D = 500 - 150 = 350\\text{ mL/breath}", caption: "Fresh Alveolar Air per Breath" },
        ],
      },
      {
        id: "resp-7b-en",
        stage: "application",
        title: "Deep Breathing vs. Rapid Shallow Breathing",
        body: "Even at identical $6\\text{ L/min}$ total ventilation, $10 \\times 600\\text{ mL}$ delivers $4.5\\text{ L/min}$ to alveoli vs. just $1.5\\text{ L/min}$ for rapid shallow $30 \\times 200\\text{ mL}$ breaths.",
        blocks: [
          { blockId: "r7e-2", type: "callout", variant: "tip", title: "Full System Chain", content: "Diaphragm pressure drop (Boyle) $\\to$ thin huge surface (Fick) $\\to$ $\\Delta P_{\\mathrm{O_2}}$ loading onto hemoglobin $\\to$ cellular $\\mathrm{ATP}$ synthesis." },
        ],
      },
    ],
    workedExamples: [
      {
        title: "Calculating Effective Alveolar Minute Ventilation",
        problem: "At $14\\text{ breaths/min}$, $V_T = 500\\text{ mL}$, and $V_D = 150\\text{ mL}$, calculate $\\dot{V}_A$.",
        steps: [
          "1) Subtract dead space per breath: $500 - 150 = 350\\text{ mL}$.",
          "2) Multiply by breathing frequency: $\\dot{V}_A = 14 \\times 350 = 4900\\text{ mL/min} = 4.9\\text{ L/min}$.",
        ],
        takeaway: "Deeper breathing dramatically raises alveolar gas renewal.",
      },
    ],
    commonMistakes: [
      "Equating total minute ventilation with alveolar ventilation without subtracting anatomical dead space $V_D$.",
    ],
    questions: [
      {
        id: "pq-resp-7-en",
        question_type: "multiple-choice",
        prompt: "At an equal $6\\text{ L/min}$ total ventilation ($V_D = 150\\text{ mL}$), which pattern yields higher alveolar ventilation?",
        choices: [
          "Slower deeper breathing ($10\\text{ breaths} \\times 600\\text{ mL}$)",
          "Rapid shallow panting ($30\\text{ breaths} \\times 200\\text{ mL}$)",
          "Both yield identical alveolar gas exchange",
          "Holding breath mid-exhalation",
        ],
        correct_index: 0,
        explanation: "Deep breaths waste a smaller fraction in the constant $150\\text{ mL}$ dead space, giving $4.5\\text{ L/min}$ vs. $1.5\\text{ L/min}$.",
        hint: "Subtract $150\\text{ mL}$ from $V_T$ in each scenario before multiplying by frequency.",
        difficulty: "challenging",
      },
    ],
    cards: [
      { front: "Anatomical Dead Space $V_D$", back: "Conducting-airway volume (~$150\\text{ mL}$) that does not participate in alveolar gas exchange." },
      { front: "Alveolar Ventilation Formula", back: "$\\dot{V}_A = f \\times (V_T - V_D)$." },
    ],
  },
];
