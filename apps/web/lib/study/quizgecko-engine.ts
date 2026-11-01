export function sanitizeBrandName(text: string): string {
  if (!text) return "";
  return text.replace(/نوت[ةه]/g, "نقطة").replace(/نوتا/g, "نقطة");
}

export type QuizItemType = "multiple_choice" | "true_false" | "fill_blank";
export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizItem = {
  id: string;
  type: QuizItemType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  distractorExplanations?: Record<number, string>;
  hint: string;
  concept: string;
  difficulty: QuizDifficulty;
};

export type QuizFlashcard = {
  id: string;
  front: string;
  back: string;
  hint: string;
  mnemonic?: string;
  concept: string;
};

export type QuizGeckoBundle = {
  id: string;
  title: string;
  topic: string;
  summary: string;
  difficulty: QuizDifficulty;
  locale: "ar" | "en";
  questions: QuizItem[];
  cards: QuizFlashcard[];
  keyTakeaways: string[];
  createdAt: string;
};

export type GenerateOptions = {
  text?: string;
  topic?: string;
  lessonId?: string;
  lessonTitle?: string;
  lessonSummary?: string;
  subject?: string;
  difficulty?: QuizDifficulty;
  locale?: "ar" | "en";
  questionCount?: number;
  cardCount?: number;
  supabaseClient?: any;
};

/**
 * Normalizes and sanitizes text to ensure platform naming is strictly «نقطة»
 */
function cleanText(text: string): string {
  if (!text) return "";
  return sanitizeBrandName(text.trim());
}

/**
 * Algorithmic generator that creates high-yield quiz items and flashcards
 * from any text, lesson, or topic. Guaranteed to succeed even offline.
 */
export function generateAlgorithmicBundle(options: GenerateOptions): QuizGeckoBundle {
  const locale = options.locale ?? "ar";
  const isEn = locale === "en";
  const difficulty = options.difficulty ?? "medium";
  const rawTitle = options.lessonTitle || options.topic || (isEn ? "Study Assessment" : "تقييم مذاكرة ذكي");
  const title = cleanText(rawTitle);
  const subject = options.subject || (isEn ? "General Knowledge" : "معرفة عامة");

  const sourceContent = options.text?.trim() || options.lessonSummary?.trim() || "";
  const paragraphs = sourceContent
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const qCount = Math.max(3, Math.min(10, options.questionCount ?? 5));
  const cCount = Math.max(3, Math.min(15, options.cardCount ?? 6));

  const questions: QuizItem[] = [];
  const cards: QuizFlashcard[] = [];
  const keyTakeaways: string[] = [];

  // 1. If text paragraphs are present, extract concepts from sentences
  if (paragraphs.length > 0) {
    paragraphs.slice(0, 5).forEach((p, idx) => {
      keyTakeaways.push(p.slice(0, 140));
    });

    for (let i = 0; i < qCount; i++) {
      const p = paragraphs[i % paragraphs.length];
      const sentences = p.split(/[.؟!؛]+/).map((s) => s.trim()).filter((s) => s.length > 15);
      const sentence = sentences[0] || p;

      if (i % 3 === 0) {
        // True / False question
        const isTrue = i % 2 === 0;
        const qText = isTrue
          ? (isEn ? `Is the following statement correct according to the material? "${sentence}"` : `وفقًا للمحتوى، هل العبارة الآتية صحيحة؟ «${sentence}»`)
          : (isEn ? `True or False: The inverse principle states that "${sentence.replace(/(\w+)/, "not $1")}"` : `صح أم خطأ: هل العبارة تناقض المفهوم القائل بأن «${sentence}»؟`);

        questions.push({
          id: `q-${i + 1}-${Date.now()}`,
          type: "true_false",
          question: qText,
          options: isEn ? ["True", "False"] : ["صحيح", "خطأ"],
          correctIndex: isTrue ? 0 : 1,
          explanation: isEn
            ? `The core concept confirms that: ${sentence}. Careful reading avoids hasty confusion.`
            : `يؤكد المفهوم الأساسي أن: ${sentence}. القراءة الدقيقة تضمن تجنب الخلط المفاهيمي.`,
          distractorExplanations: {
            [isTrue ? 1 : 0]: isEn
              ? "This choice contradicts the fundamental premise of the text."
              : "هذا الخيار يناقض المقدمة الأساسية الواردة في المادة التعليمية.",
          },
          hint: isEn ? "Reflect on the direct wording and main premise." : "تأمّل صياغة الجملة وعلاقتها بالفكرة المحورية.",
          concept: title,
          difficulty,
        });
      } else {
        // Multiple Choice Question
        const qText = isEn
          ? `Which of the following best represents the key principle regarding: ${sentence.slice(0, 60)}...?`
          : `أيٌّ من الآتي يمثل التفسير الدقيق للمفهوم التالي: «${sentence.slice(0, 60)}...»؟`;

        const correctOpt = isEn
          ? `It directly establishes that: ${sentence.slice(0, 90)}.`
          : `التفسير الصحيح المباشر: ${sentence.slice(0, 90)}.`;

        const distractors = isEn
          ? [
              `It applies only under secondary non-essential assumptions.`,
              `It operates completely inversely to observed physical or logical rules.`,
              `It is purely incidental and has no measurable structural significance.`,
            ]
          : [
              `ينطبق هذا الحكم حصرًا على حالات استثنائية وغير جوهرية في السياق.`,
              `يعمل المفهوم بطريقة عكسية تمامًا للأدلة المنطقية والتجريبية المعروضة.`,
              `يُعد أثرًا ثانويًا عارضًا لا يمتلك أي دلالة بنيوية داخل الموضوع.`,
            ];

        // Shuffle options and record correct index
        const allOpts = [correctOpt, ...distractors];
        const targetIndex = i % 4;
        const temp = allOpts[0];
        allOpts[0] = allOpts[targetIndex];
        allOpts[targetIndex] = temp;

        const distractorReasons: Record<number, string> = {};
        allOpts.forEach((opt, idx) => {
          if (idx !== targetIndex) {
            distractorReasons[idx] = isEn
              ? `Distractor explanation: This option presents a common misconception that confuses secondary factors with the primary principle.`
              : `تفكيك الخطأ الشائع: هذا الخيار يمثل خلطًا شائعًا بين الآثار الجانبية والأساس المنهجي الأصيل.`;
          }
        });

        questions.push({
          id: `q-${i + 1}-${Date.now()}`,
          type: "multiple_choice",
          question: qText,
          options: allOpts,
          correctIndex: targetIndex,
          explanation: isEn
            ? `Correct answer: ${correctOpt} This accurately reflects the core teaching without distortion.`
            : `الإجابة النموذجية: ${correctOpt} هذا يعكس جوهر الدرس المفاهيمي بدقة دون تشويه أو خلط.`,
          distractorExplanations: distractorReasons,
          hint: isEn ? "Look for the option that directly supports the root cause." : "ابحث عن الخيار الذي يربط النتيجة بسببها المباشر والأصيل.",
          concept: title,
          difficulty,
        });
      }
    }

    // Flashcards
    for (let c = 0; c < cCount; c++) {
      const p = paragraphs[c % paragraphs.length];
      const parts = p.split(/[:؛-]/);
      const term = parts[0]?.trim() || (isEn ? `Key Concept ${c + 1}` : `مفهوم محوري ${c + 1}`);
      const def = parts.slice(1).join(" ").trim() || p;

      cards.push({
        id: `c-${c + 1}-${Date.now()}`,
        front: cleanText(term),
        back: cleanText(def),
        hint: isEn ? `Think about how ${term} functions in ${subject}.` : `تذكر موقع «${term}» في بناء ${subject}.`,
        mnemonic: isEn ? `Memory link: Associate with the first letter or primary reaction.` : `مفتاح التذكر: اربط المفهوم بدلالته اللغوية وسياق التطبيق المباشر.`,
        concept: title,
      });
    }
  } else {
    // Topic-based generation fallback
    const topicName = cleanText(options.topic || options.lessonTitle || (isEn ? "Applied Concept" : "المفهوم الدراسي التطبيقي"));

    keyTakeaways.push(
      isEn
        ? `Comprehensive mastery of ${topicName} requires linking definitions with practical deduction.`
        : `الإتقان الشامل لموضوع «${topicName}» يتطلب الربط بين التعريفات المنهجية والاستنتاج التطبيقي.`,
      isEn
        ? `Focus on root mechanisms rather than rote memorization.`
        : `التركيز على الآليات المحورية وتفكيك التناقضات بدلاً من الحفظ السطحي.`,
      isEn
        ? `Regular active recall and spaced intervals consolidate long-term retention.`
        : `التكرار المتباعد والاسترجاع النشط يرسخان المعرفة في الذاكرة طويلة المدى.`
    );

    const questionsSeed = isEn
      ? [
          {
            q: `What is the foundational principle underlying "${topicName}"?`,
            opts: [
              `Systematic structure grounded in verified rules and empirical observation`,
              `Random anecdotal assumptions without standardized validation`,
              `Arbitrary historical conventions that have no operational relevance`,
              `Secondary approximations that contradict verified evidence`,
            ],
            ans: 0,
            exp: `The foundation of ${topicName} relies on rigorously verified rules and consistent observation.`,
            hint: `Consider what gives this concept its scientific or rigorous validity.`,
          },
          {
            q: `How is the primary mechanism of "${topicName}" differentiated from related concepts?`,
            opts: [
              `By superficial external labeling only`,
              `Through its distinct causal path, structural function, and predictive consistency`,
              `There is no measurable distinction between them`,
              `By arbitrary subjective preference`,
            ],
            ans: 1,
            exp: `Rigorous differentiation stems from distinct causal paths and consistent structural behavior.`,
            hint: `Focus on causal mechanisms and structural functions.`,
          },
          {
            q: `True or False: Mastering "${topicName}" eliminates common misconceptions in advanced problem solving.`,
            opts: ["True", "False"],
            ans: 0,
            exp: `True. Grasping core fundamentals prevents subsequent errors when addressing complex composite scenarios.`,
            hint: `Think about the role of strong foundations in multi-step challenges.`,
          },
          {
            q: `When applying "${topicName}" in a real challenge, what is the critical first step?`,
            opts: [
              `Rushing to an intuitive guess without examining constraints`,
              `Identifying given parameters, constraints, and underlying principles systematically`,
              `Ignoring initial conditions and substituting arbitrary values`,
              `Relying solely on surface similarity to past problems`,
            ],
            ans: 1,
            exp: `Systematic problem solving begins with clearly defining parameters, conditions, and core governing principles.`,
            hint: `Every structured methodology begins with deliberate parameter analysis.`,
          },
        ]
      : [
          {
            q: `ما هو المبدأ التأسيسي الذي يرتكز عليه موضوع «${topicName}»؟`,
            opts: [
              `بناء منهجي قائم على القواعد المحققة والملاحظة والتحليل المنطقي السليم`,
              `افتراضات عشوائية مجردة تفتقر إلى أي معيار إثبات أو تحقق علمي`,
              `اتفاقات شكلية عارضة لا ترتبط بالبنية المعرفية للموضوع`,
              `تقريبات سطحية تناقض النتائج التجريبية والبرهان الفعلي`,
            ],
            ans: 0,
            exp: `يرتكز «${topicName}» على بنية محكمة تربط بين المقدمات والاستنتاجات وفق معايير برهانية متينة.`,
            hint: `تأمل ما يمنح هذا المفهوم صفته العلمية ورصانته المنهجية.`,
          },
          {
            q: `كيف يتم التمييز بين الآلية الجوهرية لـ «${topicName}» والمفاهيم القريبة منها؟`,
            opts: [
              `من خلال التسميات اللفظية الظاهرية دون النظر للبنية العميقة`,
              `عبر المسار السببي المستقل، والوظيفة البنائية، والدقة في التنبؤ والتحليل`,
              `لا يوجد فارق حقيقي بينها؛ فجميعها متطابقة في كل السياقات`,
              `بالاعتماد على الانطباع الذاتي غير المنضبط`,
            ],
            ans: 1,
            exp: `التمييز الحقيقي ينشأ من المسار السببي المحكم والأثر الوظيفي الواضح داخل النظام المعرفي.`,
            hint: `ركز على المسار السببي والدور الوظيفي داخل السياق.`,
          },
          {
            q: `صح أم خطأ: الاستيعاب العميق لـ «${topicName}» يمنع الوقوع في الأخطاء الشائعة عند حل المشكلات المعقدة.`,
            opts: ["صحيح", "خطأ"],
            ans: 0,
            exp: `صحيح؛ فالاستيعاب المفاهيمي الصلب يشكل الحصن الأول ضد الشراك الذهنية والمغالطات الشائعة.`,
            hint: `تذكر كيف يؤثر وضوح الأساس في حل المسائل متعددة الخطوات.`,
          },
          {
            q: `ما هي الخطوة الأولى الحاسمة عند تطبيق مبادئ «${topicName}» في مسألة عملية؟`,
            opts: [
              `التسرع في التخمين دون فحص الشروط المسبقة ومعطيات المسألة`,
              `تحديد المعطيات والشروط الحاكمة واستحضار القواعد المباشرة بتدرج منطقي`,
              `تجاهل الحدود الأولية والتعويض العشوائي للوصول لأي نتيجة`,
              `الاعتماد الأعمى على الشبه الظاهري مع مسائل سابقة دون فحص الفروق`,
            ],
            ans: 1,
            exp: `الحل الاحترافي ينطلق دائمًا من حصر المعطيات، فحص الشروط، ثم تطبيق القانون أو القاعدة المناسبة.`,
            hint: `كل منهجية رصينة تبدأ بالتحليل الدقيق للمحددات والمعطيات.`,
          },
        ];

    questionsSeed.slice(0, qCount).forEach((s, idx) => {
      const distractorReasons: Record<number, string> = {};
      s.opts.forEach((opt, oIdx) => {
        if (oIdx !== s.ans) {
          distractorReasons[oIdx] = isEn
            ? "Misconception alert: This option represents a common heuristic pitfall."
            : "تفكيك الخلل: هذا الخيار يمثل استدلالاً متسرعاً يقع فيه من يغفل عن الشروط الحاكمة.";
        }
      });

      questions.push({
        id: `q-${idx + 1}-${Date.now()}`,
        type: s.opts.length === 2 ? "true_false" : "multiple_choice",
        question: cleanText(s.q),
        options: s.opts.map(cleanText),
        correctIndex: s.ans,
        explanation: cleanText(s.exp),
        distractorExplanations: distractorReasons,
        hint: cleanText(s.hint),
        concept: topicName,
        difficulty,
      });
    });

    const cardsSeed = isEn
      ? [
          { f: `Core Definition: ${topicName}`, b: `The foundational construct and structural principles governing this topic.`, h: `Recall the formal definition.` },
          { f: `Primary Application of ${topicName}`, b: `Utilized systematically to solve real problems and predict coherent outcomes.`, h: `Where is it actively deployed?` },
          { f: `Crucial Condition / Constraint`, b: `Must satisfy defined boundary conditions and rigorous logical consistency.`, h: `Under what constraints does it hold true?` },
          { f: `Common Misconception`, b: `Assuming superficial similarity implies identical underlying causal rules.`, h: `What do novices frequently mistake?` },
        ]
      : [
          { f: `التعريف المحوري: ${topicName}`, b: `البنية المفاهيمية والقواعد المنطقية التي تحكم هذا المفهوم في مادته الأصيلة.`, h: `استحضر التعريف المنهجي الصريح.` },
          { f: `التطبيق الأساسي لـ ${topicName}`, b: `استخدامه الممنهج في تفسير الظواهر، حل المسائل، وبناء الاستنتاجات البرهانية.`, h: `أين وكيف يتم توظيفه عملياً؟` },
          { f: `الشرط الحاكم أو الضابط المنهجي`, b: `وجوب تحقق الشروط الأولية وعدم وجود استثناءات تلغي انطباق القاعدة.`, h: `متى تصح النتيجة بدقة؟` },
          { f: `المفهوم الخاطئ الشائع`, b: `اعتبار الشبه الظاهري دليلاً كافياً على تطابق القواعد الباطنة.`, h: `ما الخطأ الذي يتكرر عند المبتدئين؟` },
        ];

    cardsSeed.slice(0, cCount).forEach((cs, cIdx) => {
      cards.push({
        id: `c-${cIdx + 1}-${Date.now()}`,
        front: cleanText(cs.f),
        back: cleanText(cs.b),
        hint: cleanText(cs.h),
        mnemonic: isEn ? `Key association link for ${topicName}.` : `رابط ذهني استرجاعي لمفهوم «${topicName}».`,
        concept: topicName,
      });
    });
  }

  return {
    id: `bundle-${Date.now()}`,
    title,
    topic: cleanText(options.topic || title),
    summary: keyTakeaways[0] || (isEn ? `Comprehensive study guide for ${title}` : `دليل مذاكرة واختبار ذكي لموضوع «${title}»`),
    difficulty,
    locale,
    questions,
    cards,
    keyTakeaways,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Invokes Fanar AI or smart edge function to generate QuizGecko-grade bundle,
 * with automatic fallback to the algorithmic generator.
 */
export async function generateQuizGeckoBundle(options: GenerateOptions): Promise<QuizGeckoBundle> {
  const locale = options.locale ?? "ar";
  const isEn = locale === "en";
  const title = options.lessonTitle || options.topic || (isEn ? "Study Assessment" : "تقييم مذاكرة");
  const content = options.text || options.lessonSummary || options.topic || "";

  // If supabase client is provided and we have substantial content, attempt Fanar AI synthesis
  if (options.supabaseClient && content.length > 30) {
    try {
      const prompt = isEn
        ? `You are QuizGecko-grade pedagogical assessment engine for the educational platform Noäta (نقطة).
Generate a high-yield interactive quiz and spaced repetition flashcard bundle from the following text/topic:
"${content.slice(0, 1500)}"
Subject: ${options.subject || "General"}
Difficulty: ${options.difficulty || "medium"}

STRICT REQUIREMENTS:
1. Return ONLY a single valid JSON object, no markdown codeblocks, no surrounding text.
2. The JSON must match this structure:
{
  "title": "${title}",
  "topic": "${title}",
  "summary": "Brief 1-2 sentence core concept takeaway",
  "difficulty": "${options.difficulty || "medium"}",
  "keyTakeaways": ["point 1", "point 2", "point 3"],
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Clear question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Detailed pedagogical explanation of why this answer is correct",
      "distractorExplanations": {
        "1": "Why option B is wrong (misconception breakdown)",
        "2": "Why option C is wrong",
        "3": "Why option D is wrong"
      },
      "hint": "Thoughtful clue without revealing answer",
      "concept": "${title}",
      "difficulty": "medium"
    }
  ],
  "cards": [
    {
      "id": "c1",
      "front": "Concept / Term / Question",
      "back": "Clear definition or answer",
      "hint": "Clue",
      "mnemonic": "Memory aid trick",
      "concept": "${title}"
    }
  ]
}
Brand name rule: Never use "نوتة". Always use "نقطة" in Arabic.`
        : `أنت محرك التقييم والمذاكرة الذكي الشامل مثل QuizGecko لمنصة «نقطة» (Noäta).
المطلوب توليد حزمة اختبار ذكي تفاعلي وبطاقات تكرار متباعد عالية الجودة من النص أو الموضوع التالي:
«${content.slice(0, 1500)}»
المادة: ${options.subject || "عام"}
مستوى الصعوبة: ${options.difficulty || "medium"}

شروط صارمة:
1. أعد كائن JSON صالحًا فقط، بدون كتل أكواد أو نصوص خارجية.
2. اسم المنصة بالعربية هو «نقطة» فقط، ممنوع إطلاقًا استخدام «نوتة».
3. الأسئلة يجب أن تتضمن 4 خيارات، مع تحديد الخيار الصحيح وشرح تفصيلي لماذا هو صحيح، وتفكيك أسباب خطأ الخيارات الأخرى (المفاهيم الخاطئة الشائعة).
4. البطاقات يجب أن تتضمن السؤال والجواب والتلميح ومفتاح التذكر (Mnemonic).
بنية الـ JSON:
{
  "title": "${cleanText(title)}",
  "topic": "${cleanText(title)}",
  "summary": "ملخص الفكرة المحورية في جملتين",
  "difficulty": "${options.difficulty || "medium"}",
  "keyTakeaways": ["نقطة 1", "نقطة 2", "نقطة 3"],
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "نص السؤال الواضح والدقيق؟",
      "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
      "correctIndex": 0,
      "explanation": "الشرح المنهجي التفصيلي لسبب صحة الإجابة النموذجية",
      "distractorExplanations": {
        "1": "تفكيك سبب خطأ الخيار الثاني والشبهة الشائعة فيه",
        "2": "تفكيك سبب خطأ الخيار الثالث",
        "3": "تفكيك سبب خطأ الخيار الرابع"
      },
      "hint": "تلميح سقراطي يرشد دون إفشاء الجواب",
      "concept": "${cleanText(title)}",
      "difficulty": "medium"
    }
  ],
  "cards": [
    {
      "id": "c1",
      "front": "المصطلح أو السؤال المحوري",
      "back": "التعريف أو الجواب الدقيق",
      "hint": "تلميح مساعد",
      "mnemonic": "مفتاح تذكر ذهني يسهل الاسترجاع",
      "concept": "${cleanText(title)}"
    }
  ]
}`;

      const { data, error } = await options.supabaseClient.functions.invoke("noata-ai-v2", {
        body: {
          action: "chat",
          message: prompt,
        },
      });

      if (!error && data?.response) {
        const rawResponse = String(data.response).trim();
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return {
              id: `bundle-${Date.now()}`,
              title: cleanText(parsed.title || title),
              topic: cleanText(parsed.topic || title),
              summary: cleanText(parsed.summary || ""),
              difficulty: parsed.difficulty || options.difficulty || "medium",
              locale,
              questions: parsed.questions.map((q: any, i: number) => ({
                id: q.id || `q-${i + 1}-${Date.now()}`,
                type: q.type || "multiple_choice",
                question: cleanText(q.question),
                options: Array.isArray(q.options) ? q.options.map(cleanText) : [],
                correctIndex: Number(q.correctIndex) || 0,
                explanation: cleanText(q.explanation || ""),
                distractorExplanations: q.distractorExplanations || {},
                hint: cleanText(q.hint || ""),
                concept: cleanText(q.concept || title),
                difficulty: q.difficulty || "medium",
              })),
              cards: Array.isArray(parsed.cards)
                ? parsed.cards.map((c: any, i: number) => ({
                    id: c.id || `c-${i + 1}-${Date.now()}`,
                    front: cleanText(c.front),
                    back: cleanText(c.back),
                    hint: cleanText(c.hint || ""),
                    mnemonic: cleanText(c.mnemonic || ""),
                    concept: cleanText(c.concept || title),
                  }))
                : [],
              keyTakeaways: Array.isArray(parsed.keyTakeaways)
                ? parsed.keyTakeaways.map(cleanText)
                : [],
              createdAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // Fall through to algorithmic generator
    }
  }

  // Fallback to high-yield algorithmic generator
  return generateAlgorithmicBundle(options);
}

/**
 * Exports flashcards to Anki-compatible TSV format (Tab-separated values).
 */
export function exportToAnkiTSV(cards: QuizFlashcard[]): string {
  const header = "#separator:tab\n#html:true\n#tags column:4\n";
  const rows = cards.map((c) => {
    const front = c.front.replace(/\t/g, " ").replace(/\n/g, "<br>");
    const back = c.back.replace(/\t/g, " ").replace(/\n/g, "<br>");
    const hint = (c.hint || "").replace(/\t/g, " ").replace(/\n/g, "<br>");
    const tag = (c.concept || "Noäta").replace(/[\s\t]/g, "_");
    return `${front}\t${back}\t${hint}\t${tag}`;
  });
  return header + rows.join("\n");
}

/**
 * Converts missed quiz items into flashcards for spaced repetition.
 */
export function convertMissedQuestionsToCards(missed: QuizItem[]): QuizFlashcard[] {
  return missed.map((item, idx) => ({
    id: `remedial-${idx + 1}-${Date.now()}`,
    front: item.question,
    back: `${item.options[item.correctIndex] ?? ""}\n\n💡 ${item.explanation}`,
    hint: item.hint || "راجع المفهوم الأساسي بعناية",
    concept: item.concept || "مراجعة علاجية",
  }));
}
