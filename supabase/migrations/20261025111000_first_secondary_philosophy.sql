-- First Secondary Term 1 (2026-2027) — Unit 1: Philosophy & Logic
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 14-200 (sha256 2b7fc532…)
-- Idempotent: lessons/skills upsert on their unique natural keys; questions are guarded by natural-key lookups.
-- The source is an original detailed study guide, not a verbatim official textbook; provenance stays in metadata.
-- The curriculum has FOUR official lessons; the fifth module is an additional review and must never read as official.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_modes uuid;
  v_skill_inquiry uuid;
  v_skill_logic uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'philosophy-logic',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي ومفصّل، وليس نسخة حرفية من الكتاب المدرسي.',
    'provenance_en', 'Content built from an original detailed study guide, not a verbatim copy of the school textbook.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 1 limit 1;
  if v_unit_id is null then
    raise exception 'Unit Philosophy & Logic (position 1) not found. Run migration 20261025100000 first.';
  end if;

  -- Skills
  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'phil-thinking-modes', 'التمييز بين أساليب التفكير الإنساني', 'Distinguish styles of human thinking'),
    (v_course_id, 'phil-philosophical-inquiry', 'خصائص الموقف الفلسفي وتحليل الحجج', 'Traits of the philosophical stance and argument analysis'),
    (v_course_id, 'phil-logic-foundations', 'الحدود والقضايا والاستدلال', 'Terms, propositions, and inference')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;

  select id into v_skill_modes from public.skills where course_id = v_course_id and slug = 'phil-thinking-modes' limit 1;
  select id into v_skill_inquiry from public.skills where course_id = v_course_id and slug = 'phil-philosophical-inquiry' limit 1;
  select id into v_skill_logic from public.skills where course_id = v_course_id and slug = 'phil-logic-foundations' limit 1;

  -- Lesson 1: التفكير الإنساني
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'phil-human-thinking', 'التفكير الإنساني', 'Human Thinking', 15, 25,
    v_prov || jsonb_build_object(
      'official_lesson', true,
      'duration_minutes', 9,
      'summary_ar', 'التفكير نشاط عقلي يربط الإنسان بين المعلومات والخبرات والملاحظات للوصول إلى معنى أو حكم أو حل لمشكلة؛ وقد يكون بسيطًا سريعًا كاختيار طريق إلى المدرسة، أو منظمًا معقدًا كتفسير ظاهرة علمية. من وظائفه: تنظيم الخبرات بتصنيف المتشابه، واستدعاء الماضي لتجنب الخطأ نفسه، والتخطيط للمستقبل، وحل المشكلات بتحديد المشكلة وجمع المعلومات واقتراح حلول واختيار الأفضل ومراجعة النتيجة. وأساليب التفكير الإنسانية أربعة: الخرافي الذي يفسر الأحداث بقوى لا يقوم عليها دليل قابل للاختبار وينتشر حين يحل الخوف أو الجهل محل البحث؛ والديني الذي ينطلق من الإيمان ومصادره ويختلف عن المنهج التجريبي في مصدر المعرفة وطريقة الاستدلال؛ والفلسفي القائم على التساؤل المنظم وتحليل المفاهيم وفحص الافتراضات؛ والعلمي المعتمد على الملاحظة وصياغة الفروض وجمع البيانات والاختبار وقابلية النتائج للمراجعة عند ظهور أدلة جديدة. وتتفق هذه المجالات في الاهتمام بالمعرفة وفهم الوجود وتختلف مصادرها وأسئلتها ومناهجها، ولا يصح الخلط بين البرهان التجريبي والحجة الفلسفية أو الإيمان الديني كأنها نوع واحد من الأدلة. والتفكير الناقد يفحص المعلومات والحجج قبل قبولها (التمييز بين الحقيقة والرأي، التحقق من المصدر، كشف التناقض، اختبار الأدلة، البحث عن تفسيرات بديلة)، بينما ينتج التفكير الإبداعي أفكارًا جديدة مناسبة (الطلاقة والمرونة والأصالة والتطوير)؛ الإبداع يقترح والنقد يفحص ويختار الأقوى.',
      'summary_en', 'Thinking is a mental activity linking information, experience and observation to reach a meaning, judgment or solution; it may be quick and simple (choosing a route to school) or organized and complex (explaining a scientific phenomenon). Its functions include organizing experience, recalling the past to avoid repeating errors, planning ahead, and problem solving: define the problem, separate facts from assumptions, gather reliable information, propose multiple solutions, test each against evidence, choose and evaluate. Four styles of human thinking: superstitious (attributing events to forces with no testable evidence, spreading where fear or ignorance replaces inquiry); religious (grounded in faith and its sources, differing from the empirical method in the source of knowledge and mode of inference); philosophical (organized questioning, concept analysis, examining assumptions); scientific (observation, hypotheses, data, testing, and revisability in light of new evidence). Science, philosophy and religion share concern for knowledge yet differ in sources, questions and methods; experimental proof, philosophical argument and religious faith must not be treated as one kind of evidence. Critical thinking examines information and arguments before accepting them (fact vs opinion, checking sources, spotting contradiction, testing evidence, alternative explanations); creative thinking produces new, fitting ideas (fluency, flexibility, originality, elaboration). Creativity proposes; criticism examines and selects the strongest.',
      'worked_ar', 'مثال تطبيقي من الدليل: خطوات حل مشكلة بطريقة منظمة — 1) تحديد المشكلة بدقة، 2) فصل الحقائق عن الافتراضات، 3) جمع معلومات موثوقة، 4) وضع تفسيرات أو حلول متعددة، 5) فحص كل حل وفق الأدلة والتكلفة والنتائج، 6) اختيار حل وتجربته ثم تقييم النتيجة.',
      'worked_en', 'Applied example from the guide: organized problem solving — 1) define the problem precisely, 2) separate facts from assumptions, 3) gather reliable information, 4) propose multiple explanations or solutions, 5) test each solution against evidence, cost and consequences, 6) choose a solution, try it, then evaluate the result.',
      'objectives_ar', jsonb_build_array('تعريف التفكير وذكر وظائفه الأساسية', 'التمييز بين أساليب التفكير الأربعة ومصادر كل منها', 'المقارنة بين التفكير الناقد والتفكير الإبداعي وبيان تكاملهما', 'تطبيق خطوات حل المشكلة على موقف يومي'),
      'objectives_en', jsonb_build_array('Define thinking and list its core functions', 'Distinguish the four styles of thinking and the source of each', 'Compare critical and creative thinking and how they complete each other', 'Apply the problem-solving steps to a daily situation'),
      'common_mistakes_ar', jsonb_build_array('قبول معلومة لأن كثيرين يكررونها', 'تعميم تجربة واحدة على الجميع', 'الخلط بين التعاقب الزمني والسببية', 'مهاجمة الشخص بدل مناقشة الفكرة', 'البحث عن أدلة تؤيد الرأي فقط وإهمال الأدلة المخالفة'),
      'common_mistakes_en', jsonb_build_array('Accepting a claim because many repeat it', 'Generalizing from a single experience to everyone', 'Confusing temporal sequence with causation', 'Attacking the person instead of discussing the idea', 'Seeking only confirming evidence and ignoring contrary evidence')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'phil-human-thinking' limit 1;

  -- Lesson 2: الفلسفة وطبيعة الموقف الفلسفي
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'phil-philosophical-stance', 'الفلسفة وطبيعة الموقف الفلسفي', 'Philosophy and the Nature of the Philosophical Stance', 15, 25,
    v_prov || jsonb_build_object(
      'official_lesson', true,
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'الفلسفة كلمة ذات أصل يوناني تُشرح عادة بمعنى «محبة الحكمة»، وهي نشاط عقلي يبحث في الأسئلة الأساسية عن الوجود والمعرفة والقيم والعقل والحياة الاجتماعية، ولا تقتصر على حفظ آراء الفلاسفة بل تتطلب فهم السؤال والحجة ومناقشة الافتراضات. ارتبط ظهور الفلسفة المنظمة في التراث المدرسي باليونان القديمة مع وجود تقاليد فكرية عميقة في حضارات أخرى، ويجب التفريق بين نشأة مصطلح أو مدرسة تاريخية وبين وجود التفكير الحكيم في حضارات متعددة. مباحثها الأساسية: الوجود (طبيعة الواقع والوجود والتغير)، والمعرفة (كيف نعرف ومصادرها وحدودها)، والقيم والأخلاق (الخير والعدل والمسؤولية)، والمنطق (قواعد التفكير السليم والاستدلال)، والفلسفة السياسية والاجتماعية (الدولة العادلة وعلاقة الفرد بالسلطة)، وفلسفة الجمال (الجمال والفن والتذوق)، وقد تتداخل؛ فالسؤال عن عدالة قانون يتصل بالأخلاق والسياسة والمعرفة. أهميتها للفرد تنمية الاستقلال الفكري ووضوح المفاهيم وتحليل المشكلات واتخاذ قرارات مبنية على أسباب ومراجعة الأحكام المتسرعة، وللمجتمع تشجيع الحوار واحترام الاختلاف وفحص الأفكار المتوارثة ومقاومة التعصب والتضليل. الموقف الفلسفي اتخاذ موقف عقلي متسائل من قضية بهدف فهمها وفحص أسبابها، ومن خصائصه: الدهشة، والتساؤل الدقيق، والشك المنهجي (تعليق الحكم مؤقتًا حتى تتضح الأدلة لا إنكار كل شيء)، والنقد، والتحليل والتركيب، والحوار، والتسامح الفكري، والتجريد والتعميم بتجنب التعميم المتسرع. وأبرز تحدياته: التعصب، والخوف من مراجعة الموروث، وضغط الجماعة، والخلط بين الرأي والحقيقة، والاعتماد على الشائعات، وصعوبة بعض المفاهيم؛ وتواجه بوضوح المصطلحات والدليل والحوار المنصف والاستعداد لتعديل الرأي.',
      'summary_en', 'Philosophy, a word of Greek origin usually explained as love of wisdom, is a mental activity investigating fundamental questions of existence, knowledge, values, mind and social life; it is not memorizing philosophers'' opinions but understanding the question, the argument, and the assumptions. Organized philosophy is historically tied to ancient Greece while deep intellectual traditions existed in other civilizations; distinguish the birth of a term or historical school from the existence of wise thinking across civilizations. Its branches: existence (nature of reality, change), knowledge (how we know, sources, limits), values and ethics (good, justice, responsibility), logic (rules of sound reasoning and inference), political and social philosophy (the just state, individual and authority), aesthetics (beauty, art, taste) — overlapping, since asking whether a law is just touches ethics, politics and knowledge. For the individual it develops intellectual independence, conceptual clarity, problem analysis, reason-based decisions and revision of hasty judgments; for society it fosters dialogue, respect for difference, examining inherited ideas, and resisting fanaticism and misinformation. The philosophical stance is an interrogative rational position toward an issue aimed at understanding it and examining its causes; its traits: wonder, precise questioning, methodical doubt (suspending judgment until evidence clarifies — not denying everything), criticism, analysis and synthesis, dialogue, intellectual tolerance, abstraction and generalization without hasty generalization. Challenges: fanaticism, fear of reviewing heritage, group pressure, confusing opinion with truth, reliance on rumors, difficult concepts; addressed through clear terminology, evidence, fair dialogue, and readiness to revise one''s view.',
      'worked_ar', 'مثال تطبيقي من الدليل — فحص ادعاء: الادعاء «كل من يختلف معي مخطئ»؛ الفحص: ما الدليل؟ هل توجد أمثلة مضادة؟ هل الاختلاف حول حقيقة أم قيمة أم تفسير؟ هل تم عرض رأي الطرف الآخر بدقة؟ النتيجة: الاختلاف وحده لا يثبت صحة أي طرف أو خطأه؛ يلزم فحص الأسباب.',
      'worked_en', 'Applied example from the guide — examining a claim: the claim "everyone who disagrees with me is wrong"; examination: what is the evidence? Are there counterexamples? Is the disagreement about fact, value, or interpretation? Was the other side''s view presented accurately? Conclusion: disagreement alone proves neither side right nor wrong; the reasons must be examined.',
      'objectives_ar', jsonb_build_array('شرح معنى الفلسفة ومباحثها الأساسية', 'التمييز بين الشك المنهجي والإنكار المطلق', 'ذكر خصائص الموقف الفلسفي وتحدياته', 'توضيح قيمة الفلسفة للفرد والمجتمع'),
      'objectives_en', jsonb_build_array('Explain the meaning of philosophy and its main branches', 'Distinguish methodical doubt from absolute denial', 'List the traits and challenges of the philosophical stance', 'Show the value of philosophy for individual and society'),
      'common_mistakes_ar', jsonb_build_array('اختزال الفلسفة في حفظ آراء الفلاسفة', 'الخلط بين الرأي والحقيقة', 'الاعتماد على الشائعات بدل الدليل'),
      'common_mistakes_en', jsonb_build_array('Reducing philosophy to memorizing philosophers'' opinions', 'Confusing opinion with truth', 'Relying on rumors instead of evidence')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'phil-philosophical-stance' limit 1;

  -- Lesson 3: مبادئ المنطق — الحدود والقضايا
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'phil-logic-terms-propositions', 'مبادئ المنطق — الحدود والقضايا', 'Principles of Logic — Terms and Propositions', 15, 25,
    v_prov || jsonb_build_object(
      'official_lesson', true,
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'المنطق دراسة القواعد التي تساعد على التمييز بين الاستدلال السليم وغير السليم؛ فيجعل التفكير أوضح ويساعد على ترتيب الأفكار واكتشاف التناقض والمغالطات وتقييم الحجج. عوامل الوقوع في أخطاء التفكير: ذاتية (التحيز، الانفعال الشديد، الرغبة في تصديق ما يوافقنا، ضعف الانتباه)، واجتماعية (ضغط الجماعة، التعصب، تقديس السلطة أو الشهرة)، ولغوية (اللفظ الغامض، الكلمة متعددة المعنى، السؤال المضلل)، ومعرفية (معلومات ناقصة، مصدر غير موثوق، عينة صغيرة، عدم التمييز بين الارتباط والسببية). واللغة أداة للتعبير عن المفاهيم والقضايا لكن غموض اللفظ قد يؤدي إلى سوء الفهم؛ لذا ينبغي تعريف المصطلحات والتمييز بين المعنى الحرفي والمجازي متى أثر ذلك في الحجة. الحد لفظ يدل على مفهوم مثل «طالب» أو «عادل»؛ المفهوم هو الصفات التي نفهمها من الحد، والماصدق هو الأفراد الذين ينطبق عليهم؛ وكلما زادت صفات المفهوم ضاق ماصدقه: «طالب» أوسع من «طالب في الصف الأول الثانوي بمدرسة معينة». والكليات الخمس: الجنس (مفهوم عام تشترك فيه أنواع ك«حيوان»)، والنوع (مندرج تحت جنس ك«إنسان»)، والفصل (صفة أساسية تميز النوع في التعريف)، والخاصة (صفة تلازم النوع دون أن تكون من ماهيته)، والعرض العام (صفة قد توجد في النوع وغيره). القضية قول خبري يمكن الحكم عليه بالصدق أو الكذب مثل «النيل نهر»؛ أما الأمر والسؤال والتعجب فليست قضايا خبرية. وتتكون القضية الحملية من موضوع ومحمول ورابطة، مع كم (كلي أو جزئي) وكيف (موجبة أو سالبة)، وتقسم رباعيًا: A كلية موجبة «كل الطلاب مجتهدون»، E كلية سالبة «لا طالب مهمل»، I جزئية موجبة «بعض الطلاب رياضيون»، O جزئية سالبة «بعض الطلاب ليسوا رياضيين»؛ والاستغراق يعني هل يشمل الحد جميع أفراده.',
      'summary_en', 'Logic studies the rules that distinguish sound from unsound inference; it clarifies thinking, orders ideas, exposes contradiction and fallacies, and evaluates arguments. Sources of error: personal (bias, strong emotion, wishful belief, poor attention), social (group pressure, fanaticism, deference to authority or fame), linguistic (vague wording, ambiguous terms, misleading questions), epistemic (incomplete information, unreliable sources, small samples, confusing correlation with causation). Language expresses concepts and propositions, but vague wording breeds misunderstanding; define terms and distinguish literal from figurative meaning when it affects the argument. A term is a word signifying a concept (e.g. "student", "just"); the concept is the attributes grasped, the extension the individuals it applies to; the more attributes, the narrower the extension ("student" is broader than "a first-secondary student in a specific school"). The five universals: genus (a general concept shared by species, like "animal"), species (under a genus, like "human"), differentia (the essential attribute distinguishing the species in definition), property (an attribute inseparable from the species yet not part of its essence), common accident (found in the species and others). A proposition is an declarative statement judgeable as true or false ("The Nile is a river"); commands, questions and exclamations are not. A categorical proposition has subject, predicate and copula, with quantity (universal/particular) and quality (affirmative/negative): A universal affirmative "all students are diligent"; E universal negative "no student is negligent"; I particular affirmative "some students are athletes"; O particular negative "some students are not athletes". Distribution asks whether a term covers all its individuals.',
      'worked_ar', 'مثال تطبيقي من الدليل: صنّف «بعض المدن ليست ساحلية» — جزئية لأنها تبدأ بـ«بعض»، سالبة لأنها تنفي الساحل عن الموضوع؛ فهي من النوع O (جزئية سالبة). ولاحظ أن «كل الطلاب مجتهدون» كلية موجبة (A) و«لا طالب مهمل» كلية سالبة (E).',
      'worked_en', 'Applied example from the guide: classify "some cities are not coastal" — particular (it begins with "some") and negative (it denies the predicate), hence type O (particular negative). Likewise "all students are diligent" is a universal affirmative (A) and "no student is negligent" a universal negative (E).',
      'objectives_ar', jsonb_build_array('تعريف المنطق وذكر فائدته', 'تصنيف أسباب أخطاء التفكير الأربعة', 'التمييز بين المفهوم والماصدق بمثال', 'تحديد كم القضية وكيفها وتصنيفها A/E/I/O'),
      'objectives_en', jsonb_build_array('Define logic and state its benefit', 'Classify the four sources of thinking errors', 'Distinguish concept from extension with an example', 'Determine a proposition''s quantity and quality and classify it A/E/I/O'),
      'common_mistakes_ar', jsonb_build_array('اعتبار الأمر أو السؤال قضية خبرية', 'نسيان أن زيادة صفات المفهوم تضيّق الماصدق', 'الخلط بين الارتباط والسببية'),
      'common_mistakes_en', jsonb_build_array('Treating commands or questions as truth-apt propositions', 'Forgetting that adding attributes narrows a concept''s extension', 'Confusing correlation with causation')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'phil-logic-terms-propositions' limit 1;

  -- Lesson 4: الاستدلال — تعريفه وأنواعه
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'phil-inference', 'الاستدلال — تعريفه وأنواعه', 'Inference — Definition and Types', 15, 25,
    v_prov || jsonb_build_object(
      'official_lesson', true,
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'الاستدلال انتقال عقلي من معلومات أو قضايا نبدأ بها (مقدمات) إلى نتيجة نرى أنها تتبع عنها؛ ويشترط أن تكون المقدمات واضحة مرتبطة بالنتيجة وأن يكون شكل الاستدلال صالحًا. الاستدلال المباشر ينتقل من قضية واحدة إلى قضية أخرى تلزم عنها وفق علاقة منطقية محددة، وتفصيل قواعده يتوقف على صورة القضية ونظام المنطق المستخدم؛ فإذا ثبت أن «كل المربعات مستطيلات» تلزم أن «بعض المربعات مستطيلات» في منطق يسمح بوجود أفراد. والاستدلال غير المباشر هو القياس: يتكون في صورته البسيطة من مقدمتين ونتيجة ويشترك في المقدمتين حد أوسط يربط الحدين الآخرين؛ مثال الدليل: كل الثدييات كائنات حية، والحوت من الثدييات، إذن الحوت كائن حي. الحد الأكبر محمول النتيجة، والحد الأصغر موضوعها، والحد الأوسط يظهر في المقدمتين ولا يظهر في النتيجة. وتمييز صحة الاستدلال يتطلب أمرين معًا: صدق المقدمة (هل المعلومة صحيحة؟) وصحة الصورة (هل تلزم النتيجة عن المقدمات وفق قواعد الاستدلال؟)؛ فقد تكون الصورة صحيحة وإحدى المقدمات خاطئة. ومن الأخطاء الشائعة: نتيجة لا تتبع من المقدمات، واستخدام حد أوسط بمعنيين، وإخفاء مقدمة مهمة أو الاعتماد على افتراض لم يثبت، ومهاجمة صاحب الرأي أو الاستناد إلى الشهرة بدل الدليل.',
      'summary_en', 'Inference is a mental move from starting statements (premises) to a conclusion seen to follow from them; premises must be clear and connected, and the inference form valid. Direct inference passes from one proposition to another that follows by a defined logical relation — if "all squares are rectangles" is settled, "some squares are rectangles" follows in a logic allowing non-empty terms; detailed rules depend on the proposition''s form and the logical system. Indirect inference is the syllogism: in its simple form two premises and a conclusion, sharing a middle term linking the other two; the guide''s example: all mammals are living beings; the whale is a mammal; therefore the whale is a living being. The major term is the conclusion''s predicate, the minor its subject, and the middle appears in both premises but not the conclusion. Judging an argument needs both: truth of the premises (is the information correct?) and validity of the form (does the conclusion follow by inference rules?) — a valid form can rest on a false premise. Common errors: a conclusion that does not follow, a middle term used in two senses, a hidden major premise or unproven assumption, attacking the arguer or appealing to fame instead of evidence.',
      'worked_ar', 'مثال الدليل: حلل القياس «كل المعادن توصل الكهرباء؛ النحاس معدن؛ إذن النحاس يوصل الكهرباء» — المقدمة الكبرى: كل المعادن توصل الكهرباء؛ المقدمة الصغرى: النحاس معدن؛ النتيجة: النحاس يوصل الكهرباء؛ الحد الأوسط: «معدن» لأنه يظهر في المقدمتين ويغيب عن النتيجة.',
      'worked_en', 'Guide example: analyze "all metals conduct electricity; copper is a metal; therefore copper conducts electricity" — major premise: all metals conduct electricity; minor premise: copper is a metal; conclusion: copper conducts electricity; middle term: "metal", present in both premises and absent from the conclusion.',
      'objectives_ar', jsonb_build_array('تعريف الاستدلال والتمييز بين المقدمة والنتيجة', 'التمييز بين الاستدلال المباشر وغير المباشر', 'تحديد الحدود الثلاثة في قياس وتحليل صورته', 'التمييز بين صدق المقدمات وصحة الصورة'),
      'objectives_en', jsonb_build_array('Define inference and distinguish premise from conclusion', 'Distinguish direct from indirect inference', 'Identify the three terms of a syllogism and analyze its form', 'Distinguish premise truth from argument validity'),
      'common_mistakes_ar', jsonb_build_array('الاعتقاد أن صحة النتيجة في الواقع تكفي لإثبات صحة الاستدلال', 'استخدام الحد الأوسط بمعنيين', 'إخفاء مقدمة مهمة أو الاعتماد على افتراض لم يثبت', 'مهاجمة صاحب الرأي بدل الدليل'),
      'common_mistakes_en', jsonb_build_array('Assuming a true-in-fact conclusion proves the reasoning sound', 'Using the middle term in two senses', 'Hiding a major premise or resting on an unproven assumption', 'Attacking the arguer instead of the evidence')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'phil-inference' limit 1;

  -- Lesson 5: مراجعة إضافية — ليست درسًا رسميًا
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'phil-extra-review', 'مراجعة إضافية — ليست درسًا رسميًا', 'Additional Review — Not an Official Lesson', 15, 25,
    v_prov || jsonb_build_object(
      'official_lesson', false,
      'review_module', true,
      'duration_minutes', 5,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'تنبيه منهجي: الفهرس الحالي لفلسفة ومنطق أولى ثانوي يعرض أربعة دروس رسمية فقط، وهذه الوحدة مراجعة إضافية وليست درسًا رسميًا. تلخص الدليل: التفكير الجيد يحتاج إلى بيانات كافية وتعريف واضح للمشكلة وفحص الفرضيات؛ والفلسفة تحلل المفاهيم والأسئلة الكبرى بينما يفحص المنطق صورة الحجج. وفي أي سؤال مقالي: ابدأ بتعريف، ثم اشرح الفكرة، ثم مثال، ثم نتيجة أو مقارنة.',
      'summary_en', 'Syllabus note: the current index for First Secondary Philosophy & Logic lists four official lessons only; this module is an additional review, not an official lesson. The guide''s synthesis: good thinking needs sufficient data, a clear problem definition, and tested hypotheses; philosophy analyzes concepts and the big questions while logic examines the form of arguments. In any essay question: start with a definition, explain the idea, give an example, then a conclusion or comparison.',
      'worked_ar', 'قالب الإجابة المقالية المقترح في الدليل: تعريف → شرح الفكرة → مثال → نتيجة أو مقارنة.',
      'worked_en', 'The guide''s suggested essay template: definition → explanation of the idea → example → conclusion or comparison.',
      'objectives_ar', jsonb_build_array('ربط مفاهيم الدروس الأربعة الرسمية في صورة واحدة', 'استخدام قالب الإجابة المقالية المقترح'),
      'objectives_en', jsonb_build_array('Connect the concepts of the four official lessons', 'Use the guide''s suggested essay template')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'phil-extra-review' limit 1;

  -- ===== Lesson 1 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_modes, null, 0.9,
      'أي أساليب التفكير الآتية يعتمد على الملاحظة وصياغة الفروض وجمع البيانات والاختبار، ويسمح بمراجعة نتائجه عند ظهور أدلة جديدة؟',
      'Which style of thinking relies on observation, hypothesis formulation, data collection and testing, and allows its results to be revised when new evidence appears?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["التفكير العلمي","التفكير الخرافي","التفكير الديني","التفكير الفلسفي"]'::jsonb,
      '["Scientific thinking","Superstitious thinking","Religious thinking","Philosophical thinking"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"التفكير الخرافي ينسب الأحداث إلى قوى بلا دليل قابل للاختبار، وهو عكس وصف السؤال.","2":"التفكير الديني ينطلق من الإيمان ومصادره، لا من الملاحظة والاختبار.","3":"التفكير الفلسفي يقوم على التساؤل المنظم وتحليل المفاهيم وفحص الافتراضات."}}'::jsonb,
    'التفكير العلمي حسب الدليل يعتمد على الملاحظة وصياغة الفروض وجمع البيانات والاختبار والتحقق، ونتائجه قابلة للمراجعة عند ظهور أدلة جديدة.',
    'Scientific thinking, per the guide, relies on observation, hypotheses, data and testing, and its results are revisable in light of new evidence.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_modes, null, 1.0,
      'ما العلاقة الصحيحة بين التفكير الناقد والتفكير الإبداعي كما يعرضها الدليل؟',
      'What is the correct relationship between critical and creative thinking as the guide presents it?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الإبداع يقترح حلولًا كثيرة والنقد يفحصها ويختار الحل الأقوى","النقد يولد الأفكار والإبداع يرفضها","هما أسلوبان لا يمكن الجمع بينهما","الإبداع بديل عن النقد عند نقص الأدلة"]'::jsonb,
      '["Creativity proposes many solutions and criticism examines them to select the strongest","Criticism generates ideas and creativity rejects them","They are two styles that cannot be combined","Creativity replaces criticism when evidence is scarce"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص الدليل: يمكن الجمع بينهما؛ الإبداع يقترح حلولًا كثيرة، والنقد يفحصها ويختار الحل الأقوى.',
    'From the guide''s text: the two combine; creativity proposes many solutions and criticism examines them and picks the strongest.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_inquiry, null, 1.0,
      'لاحظ طالب أن مبيعات المثلجات ترتفع في الصيف مع ارتفاع حالات الغرق، فاستنتج أن المثلجات سبب الغرق. أي خطأ شائع وقع فيه؟',
      'A student notices ice-cream sales rise in summer along with drowning cases and concludes ice cream causes drowning. Which common error did he fall into?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الخلط بين التعاقب الزمني أو الاقتران والسببية","تعميم تجربة واحدة على الجميع","مهاجمة الشخص بدل مناقشة الفكرة","البحث عن أدلة تؤيد الرأي فقط"]'::jsonb,
      '["Confusing sequence or correlation with causation","Generalizing one experience to everyone","Attacking the person instead of the idea","Seeking only confirming evidence"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"لم يُعمم تجربة واحدة بل ربط ظاهرتين متزامنتين.","2":"لم يهاجم شخصًا بل استنتج سببًا.","3":"المشكلة في ربط الاقتران بالسببية لا في انتقائية الأدلة."}}'::jsonb,
    'حدوث شيئين معًا لا يثبت أن أحدهما سبب الآخر؛ هذا هو خطأ الخلط بين الاقتران والسببية الذي يحذره الدليل، والعامل المشترك هنا هو الصيف.',
    'Two things occurring together does not prove one causes the other; this is the correlation-versus-causation error the guide warns about — the common factor here is summer.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l1 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_inquiry, null, 1.05,
      'ترتيب خطوات حل مشكلة بطريقة منظمة كما في الدليل هو: تحديد المشكلة بدقة، فصل الحقائق عن الافتراضات، جمع معلومات موثوقة، … ما الخطوة التالية؟',
      'The guide''s ordered problem-solving steps are: define the problem precisely, separate facts from assumptions, gather reliable information, … What comes next?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["وضع تفسيرات أو حلول متعددة","اختيار الحل الأول الذي يخطر في البال","مراجعة النتيجة مباشرة","سؤال الجماعة واعتماد رأي الأغلبية"]'::jsonb,
      '["Propose multiple explanations or solutions","Pick the first solution that comes to mind","Evaluate the result immediately","Ask the group and follow the majority"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بعد جمع المعلومات تأتي خطوة وضع تفسيرات أو حلول متعددة، ثم فحص كل حل وفق الأدلة والتكلفة والنتائج، ثم الاختيار والتجربة والتقييم.',
    'After gathering information comes proposing multiple explanations or solutions, then testing each against evidence, cost and consequences, then choosing, trying and evaluating.'
  );

  -- ===== Lesson 2 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_inquiry, null, 0.9,
      'أي مباحث الفلسفة يدرس أسئلة مثل: كيف نعرف؟ وما مصادر المعرفة وحدودها؟',
      'Which branch of philosophy studies questions such as: how do we know, and what are the sources and limits of knowledge?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["مبحث المعرفة","مبحث الوجود","مبحث القيم والأخلاق","فلسفة الجمال"]'::jsonb,
      '["Epistemology (the branch of knowledge)","Metaphysics (the branch of existence)","Ethics (the branch of values)","Aesthetics"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"مبحث الوجود يسأل عن طبيعة الواقع والوجود والتغير.","2":"مبحث القيم يسأل عن الخير والعدل والمسؤولية.","3":"فلسفة الجمال تسأل عن الجمال والفن والتذوق."}}'::jsonb,
    'مبحث المعرفة هو الذي يسأل: كيف نعرف؟ وما مصادر المعرفة وحدودها؟ حسب تقسيم الدليل للمباحث الفلسفية.',
    'The knowledge branch asks: how do we know, and what are knowledge''s sources and limits? — per the guide''s division of philosophical branches.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_inquiry, null, 1.0,
      'ما الفرق الصحيح بين الشك المنهجي والإنكار المطلق كما يشرحه الدليل؟',
      'What is the correct difference between methodical doubt and absolute denial as the guide explains it?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الشك المنهجي تعليق الحكم مؤقتًا حتى تتضح الأدلة، أما الإطلاق فإنكار كل شيء بلا تمييز","هما مصطلحان لمعنى واحد","الشك المنهجي رفض للأدلة دائمًا","الإنكار المطلق خطوة أولى قبل الدهشة"]'::jsonb,
      '["Methodical doubt suspends judgment temporarily until evidence clarifies; absolute denial rejects everything indiscriminately","They are two terms for one meaning","Methodical doubt always rejects evidence","Absolute denial is a first step before wonder"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'عرّف الدليل الشك المنهجي بأنه تعليق الحكم مؤقتًا حتى تتضح الأدلة، لا إنكار كل شيء بلا تمييز.',
    'The guide defines methodical doubt as temporarily suspending judgment until evidence clarifies — not denying everything indiscriminately.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_inquiry, null, 1.05,
      'رأى أحد الطلاب أن «أهمية الفلسفة للمجتمع» تتحقق عندما يقبل الجميع الأفكار المتوارثة دون مناقشة حفاظًا على الوحدة. كيف تقيم هذا الرأي وفق الدليل؟',
      'A student claims philosophy benefits society when everyone accepts inherited ideas without discussion to preserve unity. How should this be judged per the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["رأي مخالف للدليل: للفلسفة دور في فحص الأفكار المتوارثة ومقاومة التعصب والتضليل","رأي صحيح لأن الوحدة أهم من النقاش","صحيح جزئيًا لأن الفلسفة للفرد فقط","لا علاقة للفلسفة بقضايا المجتمع"]'::jsonb,
      '["Contrary to the guide: philosophy examines inherited ideas and resists fanaticism and misinformation","Correct, since unity matters more than debate","Partly correct, since philosophy serves the individual only","Philosophy has no bearing on social issues"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من أهمية الفلسفة للمجتمع في الدليل: تشجيع الحوار، واحترام الاختلاف، وفحص الأفكار المتوارثة، ومقاومة التعصب والتضليل — لا قبول الموروث دون فحص.',
    'Among philosophy''s social benefits in the guide: encouraging dialogue, respecting difference, examining inherited ideas, resisting fanaticism and misinformation — not accepting heritage unexamined.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l2 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_inquiry, null, 1.0,
      'أي العبارات الآتية تعبر عن «الدهشة» كخاصية من خصائص الموقف الفلسفي؟',
      'Which statement expresses "wonder" as a trait of the philosophical stance?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["ملاحظة ما يبدو عاديًا وطرح سؤال حوله","رفض كل الأدلة حتى تثبت مرتين","قبول الرأي الأشهر في المجتمع","تجنب السؤال حفاظًا على الاستقرار"]'::jsonb,
      '["Noticing what seems ordinary and raising a question about it","Rejecting all evidence until proven twice","Accepting the most popular view","Avoiding questions to preserve stability"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'عرّف الدليل الدهشة بأنها ملاحظة ما يبدو عاديًا وطرح سؤال حوله، وهي أول خصائص الموقف الفلسفي.',
    'The guide defines wonder as noticing what seems ordinary and questioning it — the first trait of the philosophical stance.'
  );

  -- ===== Lesson 3 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_logic, null, 0.9,
      'ما الفرق بين المفهوم والماصدق وفق الدليل؟',
      'What is the difference between concept and extension according to the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["المفهوم الصفات التي نفهمها من الحد، والماصدق الأفراد الذين ينطبق عليهم","المفهوم أفراد والماصدق صفات","هما مترادفان","الماصدق التعريف اللغوي والحد مفهومه"]'::jsonb,
      '["The concept is the attributes grasped from the term; the extension is the individuals it applies to","The concept is individuals and the extension is attributes","They are synonyms","The extension is the lexical definition and the term is its concept"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص الدليل: المفهوم هو الصفات أو المعاني التي نفهمها من الحد، والماصدق هو الأفراد أو الأشياء التي ينطبق عليها الحد.',
    'From the guide: the concept is the attributes or meanings grasped from the term; the extension is the individuals or things the term applies to.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_logic, null, 1.0,
      'قضية «بعض الطلاب يفضلون القراءة» من حيث الكم والكيف هي:',
      'In terms of quantity and quality, the proposition "some students prefer reading" is:',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["جزئية موجبة (I)","كلية موجبة (A)","كلية سالبة (E)","جزئية سالبة (O)"]'::jsonb,
      '["Particular affirmative (I)","Universal affirmative (A)","Universal negative (E)","Particular negative (O)"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"«بعض» تجعلها جزئية لا كلية.","2":"العبارة تثبت المحمول لا تنفيه.","3":"العبارة تثبت المحمول لا تنفيه."}}'::jsonb,
    '«بعض» تفيد الجزئية، وثبوت «يفضلون» يفيد الإيجاب؛ فهي جزئية موجبة (I) وفق التقسيم الرباعي في الدليل.',
    '"Some" marks particularity and the affirmed predicate marks affirmation: a particular affirmative (I) in the guide''s fourfold division.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_logic, null, 1.05,
      'أي العبارات الآتية ليست قضية خبرية يمكن الحكم عليها بالصدق أو الكذب؟',
      'Which of the following is NOT a declarative proposition that can be judged true or false?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["أغلق النافذة!","النيل نهر","بعض المدن ليست ساحلية","كل الطلاب مجتهدون"]'::jsonb,
      '["Close the window!","The Nile is a river","Some cities are not coastal","All students are diligent"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"جملة خبرية تحمل حكمًا يمكن الحكم عليه بالصدق أو الكذب.","2":"جملة خبرية سالبة جزئية.","3":"جملة خبرية كلية موجبة."}}'::jsonb,
    'الأمر «أغلق النافذة!» جملة إنشائية لا خبرية؛ والدليل ينص أن الأمر والسؤال والتعجب لا تكون كل منها قضية خبرية بذاتها.',
    'The command "Close the window!" is performative, not declarative; the guide states commands, questions and exclamations are not truth-apt propositions.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l3 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_logic, null, 1.0,
      'في الكليات الخمس، ما دور «الفصل» في التعريف التقليدي؟',
      'Among the five universals, what is the role of the "differentia" in traditional definition?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["صفة أساسية تميز النوع","مفهوم عام تشترك فيه أنواع","صفة قد توجد في النوع وغيره","صفة تلازم النوع دون أن تكون من ماهيته"]'::jsonb,
      '["An essential attribute distinguishing the species","A general concept shared by species","An attribute found in the species and others","An attribute inseparable from the species yet not of its essence"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"هذا تعريف الجنس.","3":"هذا تعريف الخاصة."}}'::jsonb,
    'الفصل وفق الدليل صفة أساسية تميز النوع في التعريف التقليدي؛ والجنس مفهوم عام، والخاصة تلازم النوع دون أن تكون من ماهيته.',
    'The differentia, per the guide, is the essential attribute distinguishing the species in traditional definition; the genus is the shared general concept and the property accompanies the species without being its essence.'
  );

  -- ===== Lesson 4 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_logic, null, 0.9,
      'في القياس «كل الثدييات كائنات حية؛ الحوت من الثدييات؛ إذن الحوت كائن حي» — ما الحد الأوسط؟',
      'In the syllogism "all mammals are living beings; the whale is a mammal; therefore the whale is a living being" — what is the middle term?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الثدييات","الحوت","كائن حي","لا يوجد حد أوسط"]'::jsonb,
      '["Mammal","Whale","Living being","There is no middle term"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"الحوت هو الحد الأصغر لأنه موضوع النتيجة.","2":"كائن حي هو الحد الأكبر لأنه محمول النتيجة."}}'::jsonb,
    'الحد الأوسط هو الذي يظهر في المقدمتين ولا يظهر في النتيجة؛ وهنا «الثدييات».',
    'The middle term appears in both premises and disappears from the conclusion; here it is "mammal".'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_logic, null, 1.05,
      'حجة صورتها صحيحة ونتيجتها مطابقة للواقع، لكن إحدى مقدماتها خاطئة. ما الحكم عليها وفق الدليل؟',
      'An argument has a valid form and a conclusion matching reality, but one premise is false. How is it judged per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["قوة الحجة تتطلب الأمرين معًا: صدق المقدمات وصحة الصورة، فهي ليست حجة قوية","حجة قوية لأن النتيجة صحيحة","يكفي صحة الصورة","لا يمكن الحكم على الحجج"]'::jsonb,
      '["Argument strength requires both: true premises and a valid form, so it is not a strong argument","Strong, since the conclusion is true","Form validity suffices","Arguments cannot be judged"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: قوة الحجة في الواقع تتطلب صدق المقدمة وصحة الصورة معًا؛ فقد تكون صورة الحجة صحيحة لكن إحدى مقدماتها خاطئة.',
    'The guide states argument strength requires both premise truth and form validity; a valid form can rest on a false premise.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_logic, null, 1.0,
      'إذا ثبت أن «كل المربعات مستطيلات»، فأي النتائج الآتية تلزم عنها مباشرة وفق مثال الدليل للاستدلال المباشر؟',
      'If "all squares are rectangles" is settled, which conclusion follows directly per the guide''s direct-inference example?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["بعض المربعات مستطيلات","كل المستطيلات مربعات","لا مربع مستطيل","بعض المستطيلات ليست مربعات"]'::jsonb,
      '["Some squares are rectangles","All rectangles are squares","No square is a rectangle","Some rectangles are not squares"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"عكس القضية لا يلزم عنها؛ الاشتراط في الاتجاه المعاكس غير صائح هنا.","3":"قد تكون صحيحة في الواقع لكنها لا تلزم منطقيًا عن القضية المذكورة."}}'::jsonb,
    'استخدم الدليل هذا المثال للاستدلال المباشر: من «كل المربعات مستطيلات» تلزم «بعض المربعات مستطيلات» في منطق يسمح بوجود أفراد للمفهوم.',
    'The guide uses this as its direct-inference example: from "all squares are rectangles" follows "some squares are rectangles" in a logic allowing non-empty terms.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l4 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_logic, null, 1.1,
      'قال متحدث: «هذه الفكرة صحيحة لأن شخصًا مشهورًا يتبناها». أي خطأ شائع في الاستدلال يظهر هنا؟',
      'A speaker says: "This idea is correct because a famous person holds it." Which common inference error is this?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["الاستناد إلى الشهرة بدل الدليل","الاستدلال الدائري","استخدام حد أوسط بمعنيين","إخفاء مقدمة مهمة"]'::jsonb,
      '["Appeal to fame instead of evidence","Circular reasoning","Middle term used in two senses","Hiding a major premise"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يحصر الدليل من الأخطاء الشائعة في الاستدلال: مهاجمة صاحب الرأي أو الاستناد إلى الشهرة بدل الدليل — وهذا هو الاستئناس بالشهرة.',
    'Among the guide''s common inference errors: attacking the arguer or appealing to fame instead of evidence — this is the appeal to fame.'
  );

  -- ===== Lesson 5 (additional review) questions =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_inquiry, null, 0.95,
      'قالب الإجابة المقالية المقترح في مراجعة الدليل الإضافية يبدأ بتعريف، ثم اشرح الفكرة، ثم مثال، ثم ماذا؟',
      'The guide''s review suggests an essay template: definition, explanation of the idea, an example, then what?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["نتيجة أو مقارنة","تكرار التعريف بصياغة أخرى","سرد آراء الفلاسفة فقط","الانتقال مباشرة إلى سؤال آخر"]'::jsonb,
      '["A conclusion or comparison","Restating the definition in other words","Only listing philosophers'' opinions","Jumping to the next question"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص المراجعة الإضافية: ابدأ بتعريف، ثم اشرح الفكرة، ثم مثال، ثم نتيجة أو مقارنة.',
    'From the additional review: start with a definition, explain the idea, give an example, then a conclusion or comparison.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_inquiry, null, 0.95,
      'أي عبارة تلخص العلاقة بين الفلسفة والمنطق كما في المراجعة الإضافية؟',
      'Which statement summarizes the relation between philosophy and logic as in the additional review?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الفلسفة تحلل المفاهيم والأسئلة الكبرى، والمنطق يفحص صورة الحجج","المنطق يخل الفلسفة بالعلم","الفلسفة والمنطق مجالان متعارضان","المنطق بديل عن الفلسفة في كل الأسئلة"]'::jsonb,
      '["Philosophy analyzes concepts and the big questions; logic examines the form of arguments","Logic mixes philosophy with science","Philosophy and logic contradict each other","Logic replaces philosophy for all questions"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص المراجعة: الفلسفة تحلل المفاهيم والأسئلة الكبرى، والمنطق يفحص صورة الحجج.',
    'From the review text: philosophy analyzes concepts and the big questions, and logic examines the form of arguments.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_logic, null, 0.95,
      'لماذا وُصفت هذه المراجعة في الدليل بأنها «ليست درسًا رسميًا»؟',
      'Why is this review described in the guide as "not an official lesson"?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن فهرس المقرر يعرض أربعة دروس رسمية فقط في الفلسفة والمنطق","لأنها مخصصة للمعلمين فقط","لأنها تجريبية قيد الاختبار","لأنها تخص مادة أخرى"]'::jsonb,
      '["Because the syllabus index lists four official lessons only for Philosophy & Logic","Because it is for teachers only","Because it is experimental","Because it belongs to another subject"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص ملاحظة المنهج في الدليل: الفهرس الحالي يعرض أربعة دروس رسمية فقط في فلسفة ومنطق أولى ثانوي، ثم قسم مراجعة خامس إضافي وليس درسًا رسميًا.',
    'The guide''s syllabus note: the current index lists four official lessons for First Secondary Philosophy & Logic, followed by an additional fifth review that is not an official lesson.'
  );

  -- ===== Unit boss questions (positions 1-3) =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_modes, null, 1.1,
      'تحدّي الوحدة (1): طالب يقبل معلومة لمجرد كثرة من يكررونها، ويحكم على فكرة بمهاجمة قائلها. ما الأسلوب الذي يصلح هذا التفكير؟',
      'Unit challenge (1): A student accepts a claim because many repeat it and judges ideas by attacking their speakers. Which thinking approach repairs this?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["التفكير الناقد الذي يفحص الأدلة والمصادر قبل القبول ويناقش الفكرة لا صاحبها","التفكير الخرافي لأنه يختصر الجهد","قبول الرأي الأشهر دائمًا","تعطيل التفكير حتى يصدر حكم رسمي"]'::jsonb,
      '["Critical thinking that examines evidence and sources before accepting and discusses the idea, not the person","Superstitious thinking, as it saves effort","Always accepting the most popular view","Suspending thinking until an official ruling"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مهارات التفكير الناقد في الدليل تشمل التحقق من المصدر واختبار الأدلة والبحث عن تفسيرات بديلة، ومن أخطاء التفكير مهاجمة الشخص بدل الفكرة.',
    'The guide''s critical-thinking skills include source checking and evidence testing; attacking the person instead of the idea is a listed error.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_logic, null, 1.1,
      'تحدّي الوحدة (2): صنّف القضايا الأربع الآتية بالترتيب الصحيح: «كل الطلاب مجتهدون»، «لا طالب مهمل»، «بعض الطلاب رياضيون»، «بعض الطلاب ليسوا رياضيين».',
      'Unit challenge (2): Classify in order: "all students are diligent", "no student is negligent", "some students are athletes", "some students are not athletes".',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["A كلية موجبة، E كلية سالبة، I جزئية موجبة، O جزئية سالبة","A جزئية موجبة، E كلية سالبة، I كلية موجبة، O جزئية سالبة","E كلية موجبة، A كلية سالبة، O جزئية موجبة، I جزئية سالبة","I جزئية موجبة، O جزئية سالبة، A كلية موجبة، E كلية سالبة"]'::jsonb,
      '["A universal affirmative, E universal negative, I particular affirmative, O particular negative","A particular affirmative, E universal negative, I universal affirmative, O particular negative","E universal affirmative, A universal negative, O particular affirmative, I particular negative","I particular affirmative, O particular negative, A universal affirmative, E universal negative"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'هذا هو التقسيم الرباعي نفسه الذي يعرضه الدليل بأمثلته الحرفية الأربع.',
    'This is exactly the guide''s fourfold division with its four literal examples.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_logic, null, 1.15,
      'تحدّي الوحدة (3): قيل «كل المنتجات المصنعة في هذا المصنع عالية الجودة؛ هذا المنتج عالي الجودة؛ إذن صنع في هذا المصنع». ما أضعف موضع في هذا الاستدلال؟',
      'Unit challenge (3): "All products made in this factory are high quality; this product is high quality; therefore it was made in this factory." What is the weakest point of this inference?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["النتيجة لا تتبع من المقدمات؛ فصحة الصورة مفقودة رغم صدق المقدمتين ظاهريًا","المقدمة الأولى خاطئة بالضرورة","الحد الأوسط ظهر في النتيجة","لا يوجد أي ضعف"]'::jsonb,
      '["The conclusion does not follow; the form is invalid even if the premises look true","The first premise is necessarily false","The middle term appears in the conclusion","There is no weakness"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'القياس الصحيح ينتقل من عام إلى خاص؛ أما الانتقال من «المنتج عالي الجودة» إلى «صنع في المصنع» فيعكس اتجاه اللزوم، فالنتيجة لا تتبع وفق قواعد الاستدلال التي يعرضها الدليل.',
    'A valid syllogism moves from general to particular; moving from "high quality" to "made in the factory" reverses the entailment, so the conclusion does not follow by the guide''s inference rules.'
  );

end $$;
