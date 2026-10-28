-- First Secondary Term 1 (2026-2027) — Unit 4: Arabic Language
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 626-872 (sha256 2b7fc532…)
-- Idempotent. Arabic-first content: reading/literature, grammar/morphology, and the story summary kept distinct.
-- The source never quotes original poems/textbook passages; no verse or quotation is invented here either.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_reading uuid;
  v_skill_rhetoric uuid;
  v_skill_grammar uuid;
  v_skill_story uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid; v_l6 uuid; v_l7 uuid; v_l8 uuid; v_l9 uuid; v_l10 uuid; v_l11 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'arabic',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي يلخص الأفكار والتحليل ولا يستبدل النص الأصلي؛ استخدم كتاب المدرسة للنصوص والأبيات.',
    'provenance_en', 'Content from an original study guide summarizing ideas and analysis; it does not replace the original texts — use the school book for the actual passages.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 4 limit 1;
  if v_unit_id is null then
    raise exception 'Unit Arabic Language (position 4) not found. Run migration 20261025100000 first.';
  end if;

  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'arab-reading-analysis', 'تحليل النصوص القرائية واستخراج القيم', 'Analyze reading texts and extract values'),
    (v_course_id, 'arab-rhetoric-literature', 'تحليل البلاغة وأثرها في المعنى', 'Analyze rhetoric and its effect on meaning'),
    (v_course_id, 'arab-grammar-morphology', 'إعراب الكلمات وتصنيفها نحوًا وصرفًا', 'Parse and classify words in grammar and morphology'),
    (v_course_id, 'arab-story-antara', 'تتبع أحداث قصة عنترة وتحليل شخصياتها', 'Follow Antara''s story events and analyze characters')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;
  select id into v_skill_reading from public.skills where course_id = v_course_id and slug = 'arab-reading-analysis' limit 1;
  select id into v_skill_rhetoric from public.skills where course_id = v_course_id and slug = 'arab-rhetoric-literature' limit 1;
  select id into v_skill_grammar from public.skills where course_id = v_course_id and slug = 'arab-grammar-morphology' limit 1;
  select id into v_skill_story from public.skills where course_id = v_course_id and slug = 'arab-story-antara' limit 1;

  -- ===== Reading & literature (5 lessons) =====

  -- Lesson 1: مكارم الأخلاق وحاتم الطائي (قراءة)
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'arab-reading-hatim', 'مكارم الأخلاق وحاتم الطائي (قراءة)', 'Moral Virtues and Hatim al-Tai (Reading)', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'reading-literature',
      'duration_minutes', 8,
      'summary_ar', 'الفكرة العامة: إبراز أثر الأخلاق الكريمة في مكانة الإنسان، مع تقديم حاتم الطائي نموذجًا للكرم والمروءة. أهم القيم: الكرم (إعطاء المحتاج وإكرام الضيف دون انتظار مقابل)، والحلم (ضبط النفس وعدم الرد على الإساءة بالاندفاع)، والعفة (الابتعاد عن الطمع وصيانة حقوق الآخرين)، والوفاء (احترام الوعد وتحمل المسؤولية)، والتواضع (عدم استخدام المكانة أو المال للتعالي)، والشهامة (مساعدة المحتاج والدفاع عن المظلوم). وطريقة تحليل موضوع القراءة: حدد الفكرة الرئيسة، واستخرج قيمة أخلاقية من موقف محدد مع الدليل، وفرق بين صفات الشخصية والأحداث التي تكشفها، وعند سؤال «ما أثر الخلق؟» اشرح أثره في الفرد والمجتمع بدل تكرار اسم الخلق. ومفردات للمراجعة: المروءة التمسك بمحاسن الأخلاق، والجود سعة العطاء، والحلم ضبط النفس عند الغضب، والوفاء حفظ العهد؛ وقد يختلف معنى الكلمة حسب سياقها فاستخدم جمل النص.',
      'summary_en', 'Main idea: highlighting the effect of noble morals on a person''s standing, presenting Hatim al-Tai as a model of generosity and chivalry. Key values: generosity (giving to the needy, honouring the guest without expecting return), forbearance (self-control, not reacting to insult impulsively), chastity/integrity (avoiding greed, protecting others'' rights), fidelity (honouring promises, bearing responsibility), humility (not using status or wealth to belittle people), gallantry (helping the needy, defending the wronged). Analysis method: identify the main idea, extract a value from a specific situation with evidence, distinguish character traits from the events revealing them; when asked "what is the effect of a virtue?" explain its effect on individual and society, not just name it. Review vocabulary: muru''ah is adherence to fine morals; jud is breadth of giving; hilm is self-control in anger; wafa is keeping one''s word; word meaning may shift with context — use the text''s sentences.',
      'worked_ar', 'إرشاد الدليل للإجابة: لا يكفي القول إن حاتمًا كريم؛ اذكر كيف يظهر الكرم وما أثره على الآخرين. والكرم النافع يراعي حاجة الآخرين والحكمة في استخدام المال، أما الإسراف فهو تجاوز الاعتدال دون مصلحة.',
      'worked_en', 'The guide''s answering tip: it is not enough to say Hatim was generous — show how generosity appears and its effect on others. Beneficial generosity considers others'' needs and wisdom in using money; extravagance exceeds moderation without benefit.',
      'objectives_ar', jsonb_build_array('استخلاص القيم الأخلاقية من سيرة حاتم', 'التمييز بين الكرم والإسراف', 'تحليل موضوع قراءة بطريقة منظمة'),
      'objectives_en', jsonb_build_array('Extract moral values from Hatim''s example', 'Distinguish generosity from extravagance', 'Analyze a reading topic systematically'),
      'check_ar', jsonb_build_array('ما القيم التي تجعل حاتمًا نموذجًا أخلاقيًا؟', 'كيف يختلف الكرم عن الإسراف؟', 'اكتب فقرة قصيرة عن خلق يمكن تطبيقه في المدرسة.'),
      'check_en', jsonb_build_array('Which values make Hatim a moral model?', 'How does generosity differ from extravagance?', 'Write a short paragraph on a virtue applicable at school.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'arab-reading-hatim' limit 1;

  -- Lesson 2: «شباب تسامى للعلا وكهول» — السموأل
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'arab-literature-samawal', '«شباب تسامى للعلا وكهول» — السموأل', '"Youths Who Climbed to Glory and Elders" — Al-Samawal', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'reading-literature',
      'duration_minutes', 8,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'الفكرة العامة: الدفاع عن الشرف والوفاء وعلو الهمة، وبيان أن قيمة الجماعة لا تُقاس بكثرة العدد بل بأخلاق أفرادها ومواقفهم. معلومات أدبية: السموأل شاعر جاهلي اشتهر في الذاكرة العربية بالوفاء؛ ومن سمات الشعر الجاهلي قوة العبارة ووضوح المعنى والتعبير عن الفخر والحكمة والوفاء والكرم والاعتماد على الصور والمحسنات التي تخدم المعنى. والفخر في النص ليس تفاخرًا بالعدد بل تأكيد على السيادة وحماية الجار وإكرام الضيف والوفاء بالقول. عناصر التحليل: العاطفة الأساسية الاعتزاز بالقيم والوفاء والثقة بالنفس؛ والفكرة أن الشرف والعمل الكريم أهم من التفوق العددي وحده؛ والصور البلاغية افحص التشبيهات والاستعارات والكنايات في أبيات الكتاب واشرح المشبه به أو المعنى الذي توحي به الصورة دون الاكتفاء باسمها؛ والمحسنات: الطباق يظهر التضاد، والمقابلة توازن مجموعتين من المعاني، والقافية تسهم في الموسيقى؛ والأسلوب: الخبر يقرر حقيقة أو يبرز الفخر، والأمر قد يأتي للنصح أو التحدي حسب السياق. بيئة النص: الشعر والخطابة وسيلتان للتعبير عن القيم والسمعة والانتماء القبلي، ومن الموضوعات المتكررة الفخر والحماسة والمدح والهجاء والغزل والوصف والحكمة؛ ولا تُسقط أحكامًا عامة على كل الشعراء بل اربط إجابتك بالنص المقرر.',
      'summary_en', 'Main idea: defending honour, fidelity and high aspiration, showing a community''s worth is measured by its members'' morals and actions, not by numbers. Literary notes: al-Samawal is a pre-Islamic poet famed in Arabic memory for fidelity; pre-Islamic poetry features strong diction, clear meaning, and expression of pride, wisdom, fidelity and generosity, with imagery and devices serving meaning. The pride in the text is not boasting of numbers but affirming supremacy, protecting the neighbour, honouring the guest, and keeping one''s word. Analysis elements: dominant emotion is pride in values, fidelity, self-confidence; the idea that honour and noble action outweigh mere numerical superiority; examine similes, metaphors and metonymy in the textbook''s verses and explain the image''s meaning, not just its name; devices: tibaq (antithesis) shows contrast, muqabala (correspondence) balances two sets of meanings, rhyme contributes to musicality; style: declarative sentences state truths or highlight pride; imperatives may advise or challenge by context. Setting: poetry and oratory expressed values, reputation and tribal belonging; recurring themes include pride, zeal, praise, satire, love poetry, description and wisdom; avoid blanket judgments about all poets — tie your answer to the set text.',
      'worked_ar', 'من إرشادات الدليل: عند سؤال «لماذا لا تمثل قلة العدد بالضرورة ضعفًا؟» اربط الجواب بالوفاء والسيادة وحماية الجار كما يفهمها الشاعر من قيم الجاهلية، لا بعدد الرجال.',
      'worked_en', 'From the guide''s tips: when asked "why is small number not necessarily weakness?" tie the answer to fidelity, supremacy and protecting the neighbour as the poet''s values show — not to the count of men.',
      'objectives_ar', jsonb_build_array('تحديد عاطفة القصيدة وفكرتها العامة', 'شرح أثر الصور البلاغية دون الاكتفاء باسمها', 'تمييز وظيفة الخبر والأمر في النص', 'ربط الفخر بالقيم لا بعدد الأعداد'),
      'objectives_en', jsonb_build_array('Identify the poem''s emotion and main idea', 'Explain the effect of rhetorical images, not just their names', 'Distinguish the roles of declarative and imperative styles', 'Tie pride to values, not to numbers'),
      'check_ar', jsonb_build_array('لماذا لا تمثل قلة العدد بالضرورة ضعفًا؟', 'كيف يخدم الفخر القيم التي يريد الشاعر إثباتها؟', 'اختر صورة بلاغية من النص الأصلي واشرح أثرها في المعنى.'),
      'check_en', jsonb_build_array('Why is a small number not necessarily weakness?', 'How does pride serve the values the poet affirms?', 'Choose a rhetorical image from the original text and explain its effect.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'arab-literature-samawal' limit 1;

  -- Lesson 3: «قيم الحياة الزوجية» — وصية أمامة بنت الحارث
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'arab-literature-wasiya', '«قيم الحياة الزوجية» — وصية أمامة بنت الحارث', '"Values of Married Life" — the Counsel of Umama bint al-Harith', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'reading-literature',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'الفكرة العامة: تقديم نصائح لبناء علاقة زوجية قائمة على التفاهم والاحترام وحسن المعاملة والمسؤولية. الأفكار الرئيسة: لا تقوم العلاقة السليمة على الشكل وحده بل على حسن الخلق والتوافق والتعاون؛ وحفظ أسرار الأسرة واحترام الطرف الآخر وتجنب الإهانة وحسن إدارة الخلاف عوامل تساعد على الاستقرار؛ والوصية نموذج للنثر التعليمي يقدم خبرة اجتماعية في صورة نصائح واضحة؛ وعند التحليل التاريخي تذكّر أن النص يعكس بيئة اجتماعية قديمة ويمكن دراسة القيم الإنسانية العامة مع فهم سياق العصر. خصائص النص النثري: وضوح الفكرة وتسلسل النصائح، والجمل الخبرية والإنشائية لتقديم التوجيه والتأكيد، واستخدام المقابلة أو التكرار حين يخدمان توضيح الفكرة، والاعتماد على الخبرة والنتيجة المتوقعة من السلوك. وكيف تجيب عن سؤال «ما الهدف من الوصية؟»: اذكر أنها توجيه عملي لحياة مستقرة، ثم بين قيمة أو قيمتين، ثم وضح أثر تطبيقهما؛ وتجنب التلخيص بعبارة عامة جدًا مثل «تتحدث عن الزواج» فقط.',
      'summary_en', 'Main idea: counsel for building a marital relationship based on understanding, respect, good treatment and responsibility. Key thoughts: a sound relationship rests not on appearance alone but on good character, compatibility and cooperation; keeping family secrets, respecting the other party, avoiding insult, and managing disagreement well all support stability; the counsel is a model of educational prose offering social experience in clear advice; in historical analysis remember the text reflects an old social environment — study the general human values while understanding the era. Prose features: clarity of idea and ordered advice; declarative and performative sentences for guidance and emphasis; antithesis or repetition when they clarify; reliance on experience and the expected outcome of behaviour. Answering "what is the aim of the counsel?": it is practical guidance for a stable life; name one or two values; then show the effect of applying them — avoid the overly generic "it talks about marriage".',
      'worked_ar', 'من إرشادات الدليل: عند سؤال «ما خصائص النثر التعليمي؟» اربط الجواب بواضح الفكرة وتسلسل النصائح والجمل الخبرية والإنشائية في هذا النص تحديدًا، لا بتعريف عام مجرد.',
      'worked_en', 'From the guide''s tips: when asked "what are the features of educational prose?", tie the answer to this text''s clear ideas, ordered advice and mix of declarative and performative sentences — not an abstract generic definition.',
      'objectives_ar', jsonb_build_array('استخلاص القيم الاجتماعية من الوصية', 'تحديد خصائص النثر التعليمي', 'تحويل نصيحة قديمة إلى سلوك معاصر إيجابي'),
      'objectives_en', jsonb_build_array('Extract social values from the counsel', 'Identify features of educational prose', 'Turn an old counsel into positive modern behaviour'),
      'check_ar', jsonb_build_array('اذكر ثلاث قيم اجتماعية يركز عليها النص.', 'ما خصائص النثر التعليمي؟', 'كيف يمكن تحويل نصيحة قديمة إلى سلوك إيجابي معاصر؟'),
      'check_en', jsonb_build_array('Name three social values the text stresses.', 'What are the features of educational prose?', 'How can an old counsel become positive modern behaviour?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'arab-literature-wasiya' limit 1;

  -- Lesson 4: «قيم اجتماعية» — قراءة
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'arab-reading-social-values', '«قيم اجتماعية» — قراءة', '"Social Values" — Reading', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'reading-literature',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'الفكرة العامة: أهمية القيم المشتركة في تنظيم العلاقات بين الأفراد والحفاظ على التماسك الاجتماعي وتحقيق التعاون والاحترام. محاور الفهم: المجتمع لا يقوم على المصالح الفردية فقط بل يحتاج ثقة متبادلة وقواعد للسلوك؛ ومن القيم الاجتماعية التعاون والعدل والتسامح واحترام الحقوق وتحمل المسؤولية ومراعاة المصلحة العامة؛ والقيمة الحقيقية لا تُقاس بما يقوله الإنسان فقط بل بكيفية تحويلها إلى سلوك؛ واحترام الآخر لا يعني الموافقة على كل آرائه بل التعامل معه بإنصاف وعدم انتهاك حقوقه. مهارات القراءة الخمس في الدليل: استخرج الفكرة العامة والعنوان الأنسب، وميز بين الفكرة الرئيسة والتفصيل الداعم، واستدل من السياق على معنى الكلمة، وحدد العلاقة بين الجمل (تعليل أو نتيجة أو توضيح أو مقارنة أو مثال)، واستنتج موقف الكاتب مع ذكر دليل لغوي.',
      'summary_en', 'Main idea: shared values'' role in organizing relationships, preserving social cohesion, and achieving cooperation and respect. Understanding axes: society rests not on individual interests alone but needs mutual trust and behavioural rules; social values include cooperation, justice, tolerance, respect for rights, responsibility, and regard for the public interest; a value''s worth is measured not only by what one says but by turning it into behaviour; respecting others does not mean agreeing with all their views but dealing fairly without violating their rights. The guide''s five reading skills: extract the general idea and best title; distinguish main idea from supporting detail; infer a word''s meaning from context; identify sentence relations (cause, result, clarification, comparison, example); infer the writer''s stance with linguistic evidence.',
      'worked_ar', 'من مهارات الدليل: عند سؤال «استنتج موقف الكاتب» اذكر الدليل اللغوي الذي بنيت عليه الاستنتاج (كلمة، أو تركيب، أو صياغة بعينها في النص).',
      'worked_en', 'From the guide''s skills: when asked to infer the writer''s stance, cite the linguistic evidence — a word, a structure, a specific phrasing in the text.',
      'objectives_ar', jsonb_build_array('ذكر القيم الاجتماعية الأساسية', 'التمييز بين القيمة والسلوك الذي يثبتها', 'تطبيق مهارات القراءة الخمس'),
      'objectives_en', jsonb_build_array('List core social values', 'Distinguish a value from the behaviour proving it', 'Apply the five reading skills'),
      'check_ar', jsonb_build_array('ما الفرق بين القيمة الاجتماعية والسلوك الذي يثبتها؟', 'اقترح موقفًا مدرسيًا يظهر التعاون والعدل.', 'لماذا يحتاج المجتمع إلى احترام الحقوق مع الاختلاف؟'),
      'check_en', jsonb_build_array('Distinguish a social value from the behaviour proving it.', 'Suggest a school situation showing cooperation and justice.', 'Why does society need rights-respect amid disagreement?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'arab-reading-social-values' limit 1;

  -- Lesson 5: «العفو مأمول» — كعب بن زهير
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'arab-literature-kab', '«العفو مأمول» — كعب بن زهير', '"Pardon May Be Hoped For" — Ka''b ibn Zuhayr', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'reading-literature',
      'duration_minutes', 8,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'الفكرة العامة في إطار المراجعة: إبراز قيمة العفو وطلب الصفح وأثرهما في إصلاح العلاقات، مع دراسة أسلوب الشاعر ومعانيه وصوره البلاغية في النص المقرر. محاور التحليل: العفو لا يعني إنكار الخطأ بل قد يكون قرارًا واعيًا بترك الانتقام عندما تسمح الظروف؛ والاعتذار الصادق يحتاج اعترافًا بالخطأ ووقفًا للضرر ومحاولة لإصلاح ما أفسده الفعل؛ والعفو يخفف الخصومة ويعيد بناء الثقة لكنه لا يلغي حماية المظلوم أو وضع حدود للسلوك المؤذي؛ وفي تحليل القصيدة حدد العاطفة والغرض وتسلسل الأفكار وأثر الألفاظ والتراكيب والصور في نقل الحالة النفسية. وعند استخراج الجمال: اذكر التعبير من النص القصير الذي يطلبه السؤال ثم سم الصورة أو المحسن، واشرح المعنى المقصود والأثر الفني (توضيح الفكرة أو تقوية العاطفة أو إحداث موسيقى)، ولا تكتف بكتابة «استعارة جميلة» بل وضح ما الذي شبه بماذا أو ما المعنى غير المباشر.',
      'summary_en', 'Main idea within review: the value of pardon and seeking forgiveness and their effect on repairing relationships, with study of the poet''s style, meanings and rhetorical images in the set text. Analysis axes: pardon does not deny the wrong; it may be a conscious choice to forgo revenge when circumstances allow; sincere apology needs admitting the error, stopping harm, and repairing what was damaged; pardon eases hostility and rebuilds trust yet does not remove protecting the wronged or setting limits on harmful behaviour; in analysing the poem identify emotion, purpose, the order of ideas, and how wording, structures and images convey the psychological state. When extracting a rhetorical beauty: quote the short expression the question asks for, name the image or device, explain the intended meaning and artistic effect (clarifying the idea, strengthening emotion, creating music) — do not stop at "a beautiful metaphor": say what was likened to what or the indirect meaning.',
      'worked_ar', 'من إرشادات الدليل: خطوات تحليل قصيدة — حدد الفكرة، ثم العاطفة، ثم الغرض، ثم تسلسل الأفكار، ثم أثر الألفاظ والصور والموسيقى، مع الاستدلال من ألفاظ النص المقرر نفسه.',
      'worked_en', 'From the guide''s tips: poem-analysis steps — identify the idea, then emotion, then purpose, then the ordering of ideas, then the effect of wording, images and music, always with evidence from the set text''s own words.',
      'objectives_ar', jsonb_build_array('تفسير قيمة العفو وأثرها في إصلاح العلاقات', 'التمييز بين العفو والتهاون في الحقوق', 'تحليل قصيدة من حيث الفكرة والعاطفة والصورة والموسيقى'),
      'objectives_en', jsonb_build_array('Explain pardon''s value in repairing relationships', 'Distinguish pardon from neglecting rights', 'Analyze a poem: idea, emotion, imagery, music'),
      'check_ar', jsonb_build_array('كيف يسهم العفو في إصلاح العلاقات؟', 'فرق بين العفو والتهاون في الحقوق.', 'اذكر خطوات تحليل قصيدة.'),
      'check_en', jsonb_build_array('How does pardon repair relationships?', 'Distinguish pardon from being lax about rights.', 'List the steps of analyzing a poem.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'arab-literature-kab' limit 1;

  -- ===== Grammar & morphology (5 lessons) =====

  -- Lesson 6: الكلمة وأقسامها
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 6, 'arab-grammar-word-types', 'القواعد: الكلمة وأقسامها', 'Grammar: The Word and Its Types', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'grammar-morphology',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l5::text,
      'summary_ar', 'الكلمة في العربية تنقسم إلى اسم وفعل وحرف. الاسم يدل على إنسان أو حيوان أو شيء أو معنى ولا يرتبط بزمن في ذاته، ومن علاماته المحتملة قبول «الـ» أو التنوين أو الجر أو النداء، وأمثلته: كتاب، طالب، القاهرة، عدل، شجاعة. الفعل يدل على حدث مرتبط بزمن: ماضٍ حدث قبل الآن مثل كتبَ وحضرَ، ومضارع يدل غالبًا على الحال أو الاستقبال مثل يكتبُ ويحضرُ، وأمر طلب حدوث الفعل مثل اكتبْ واحضرْ. والحرف لا يظهر معناه كاملًا إلا مع غيره مثل: من، إلى، في، هل، لم، لن. وتمييز سريع من الدليل: «العلمُ نافعٌ» فالعلم اسم ونافع اسم والجملة اسمية؛ و«يقرأ الطالب» فـ«يقرأ» فعل مضارع و«الطالب» اسم؛ و«في المدرسة» فـ«في» حرف جر و«المدرسة» اسم مجرور.',
      'summary_en', 'Arabic words divide into noun (ism), verb (fi''l) and particle (harf). A noun denotes a person, animal, thing or meaning without inherent time; possible signs include accepting the definite article, tanwin, genitive case or vocative — examples: kitab, talib, al-Qahira, adl, shaja''a. A verb denotes an event tied to time: past (kataba, hadara), present (yaktubu, yahdur), imperative (uktub, ihdur). A particle''s full meaning appears only with others: min, ila, fi, hal, lam, lan. The guide''s quick identifications: "al-''ilm nafi''" — both are nouns, a nominal sentence; "yaqra''u al-talib" — yaqra''u a present verb, al-talib a noun; "fi al-madrasa" — fi a genitive particle and al-madrasa a genitive noun.',
      'worked_ar', 'تدريب الدليل: حدد نوع الكلمة في «على، يكتب، الشجاعة» — الإجابة: على حرف، ويكتب فعل مضارع، والشجاعة اسم.',
      'worked_en', 'Guide practice: classify "ala, yaktub, al-shaja''a" — ala is a particle, yaktub a present verb, al-shaja''a a noun.',
      'objectives_ar', jsonb_build_array('تصنيف الكلمة إلى اسم وفعل وحرف', 'استخدام علامات الاسم المحتملة', 'التمييز بين أنواع الفعل الثلاثة'),
      'objectives_en', jsonb_build_array('Classify words as noun, verb or particle', 'Use the noun''s possible markers', 'Distinguish the three verb types'),
      'check_ar', jsonb_build_array('حدد نوع الكلمة في «على، يكتب، الشجاعة».', 'ما علامات الاسم المحتملة؟'),
      'check_en', jsonb_build_array('Classify "ala, yaktub, al-shaja''a".', 'What are the noun''s possible markers?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l6 from public.lessons where unit_id = v_unit_id and slug = 'arab-grammar-word-types' limit 1;

  -- Lesson 7: الاسم وأقسامه
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 7, 'arab-grammar-noun-types', 'القواعد: الاسم وأقسامه', 'Grammar: The Noun and Its Classes', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'grammar-morphology',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l6::text,
      'summary_ar', 'يصنف الاسم من زوايا متعددة: من حيث التعريف معرفة ونكرة؛ المعرفة تدل على معين مثل «الطالب» أو «محمود» والنكرة غير معينة مثل «طالب». ومن حيث العدد مفرد ومثنى وجمع؛ المثنى يدل على اثنين أو اثنتين وغالبًا يرفع بالألف وينصب ويجر بالياء، وجمع المذكر السالم يرفع بالواو وينصب ويجر بالياء، وجمع المؤنث السالم يرفع بالضمة وينصب ويجر بالكسرة في القاعدة الأساسية. ومن حيث الجنس مذكر ومؤنث مع علامات وتأويلات مختلفة. ومن حيث الاشتقاق في دروس الصرف جامد ومشتق؛ الجامد لا يؤخذ في صورته من فعل في التحليل الصرفي المعتاد، والمشتق مثل اسم الفاعل واسم المفعول. وتشمل المعرفة عادة: الضمائر وأسماء الإشارة والأسماء الموصولة وأسماء العلم والمعرف بـ«الـ» والمضاف إلى معرفة والمنادى المقصود في أحكامه. وأمثلة إعرابية مختصرة من الدليل: «جاء الطالبُ» فالطالب اسم معرفة مرفوع فاعل؛ و«رأيت طالبًا» فطالبًا نكرة منصوب مفعول به؛ و«مررت بالطالبِ» فالطالب اسم مجرور بالباء.',
      'summary_en', 'Nouns classify from several angles: definiteness — definite (al-talib, Mahmud) versus indefinite (talib); number — singular, dual (raised by alif, accusative/genitive by ya''), sound masculine plural (raised by waw, accusative/genitive by ya''), sound feminine plural (raised by damma, accusative/genitive by kasra in the basic rule); gender — masculine and feminine with various markers and interpretations; derivation in morphology — frozen (jamid, not derived from a verb in the usual analysis) versus derived (e.g. active and passive participles). Definites usually include: pronouns, demonstratives, relatives, proper names, article-prefixed nouns, idafa to a definite, and the intended vocative. The guide''s brief parsings: "ja''a al-talib-u" — definite noun, nominative subject; "ra''aytu talib-an" — indefinite, accusative object; "marartu bi-l-talib-i" — genitive by the ba''.',
      'worked_ar', 'تدريب الدليل: بيّن المعرفة والنكرة في «جاء طالبٌ، ثم جاء الطالبُ» — الإجابة: طالب نكرة، والطالب معرفة (معرف بـ«الـ»).',
      'worked_en', 'Guide practice: identify definite and indefinite in "ja''a talib-un, thumma ja''a al-talib-u" — talib is indefinite; al-talib is definite by the article.',
      'objectives_ar', jsonb_build_array('تصنيف الأسماء من حيث التعريف والعدد والجنس والاشتقاق', 'ذكر أنواع المعرفة', 'إعراب أمثلة مرفوعة ومنصوبة ومجرورة'),
      'objectives_en', jsonb_build_array('Classify nouns by definiteness, number, gender, derivation', 'List the kinds of definites', 'Parse nominative, accusative and genitive examples'),
      'check_ar', jsonb_build_array('بيّن المعرفة والنكرة في «جاء طالبٌ، ثم جاء الطالبُ».', 'ما علامات رفع جمع المذكر السالم وجمع المؤنث السالم؟'),
      'check_en', jsonb_build_array('Identify definite vs indefinite in the guide''s example.', 'What are the nominative markers of the sound masculine and feminine plurals?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l7 from public.lessons where unit_id = v_unit_id and slug = 'arab-grammar-noun-types' limit 1;

  -- Lesson 8: الفعل وأقسامه
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 8, 'arab-grammar-verb-types', 'القواعد: الفعل وأقسامه', 'Grammar: The Verb and Its Classes', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'grammar-morphology',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l7::text,
      'summary_ar', 'الفعل الماضي يدل على حدث وقع قبل زمن التكلم مثل «نجحَ»، وهو مبني وتتغير علامة بنائه بحسب اتصاله بالضمائر. والمضارع يدل على الحال أو الاستقبال ويبدأ غالبًا بأحد أحرف «أنيت»؛ يكون مرفوعًا إذا لم يسبقه ناصب أو جازم، وينصب بعد أدوات مثل «لن» و«أن»، ويجزم بعد أدوات مثل «لم» و«لا الناهية» في مواضعها. وفعل الأمر يدل على طلب حدوث الفعل مثل «اكتبْ» و«اجتهدْ» وهو مبني في الأصل. أمثلة الدليل: «يذاكرُ الطالبُ» فالمضارع مرفوع بالضمة الظاهرة؛ و«لن يهملَ الطالبُ» فمنصوب بـ«لن» وعلامة نصبه الفتحة؛ و«لم يهملْ الطالبُ» فمجزوم بـ«لم» وعلامة جزمه السكون؛ و«اجتهدْ» فعل أمر مبني على السكون في المثال. وتنبيه مهم: علامات الإعراب التفصيلية تختلف في الأفعال الخمسة والمعتل الآخر، فلا تطبق قاعدة الضمة أو الفتحة الظاهرة عليها دون فحص نوع الفعل.',
      'summary_en', 'The past verb denotes an event before speech time (najaha) and is fixed in form (mabni), its marker varying with attached pronouns. The present denotes present or future, usually beginning with one of the "an-yat" letters; nominative unless preceded by a subjunctive or jussive particle, accusative (mansub) after particles like lan and an, jussive (majzum) after lam and prohibitive la in their places. The imperative requests the event (uktub, ijtahid) and is fixed in origin. Guide examples: "yudakir-u al-talib-u" — present nominative by visible damma; "lan yuhmila al-talib-u" — accusative by lan, marked with fatha; "lam yuhmil al-talib-u" — jussive by lam, marked with sukun; "ijtahid" — imperative fixed on sukun in the example. Important caution: detailed case markers differ for the "five verbs" and final-weak verbs — do not apply the visible damma/fatha rule without checking the verb type.',
      'worked_ar', 'تدريب الدليل: أعرب الفعل في «لن يقصرَ المجتهدُ» — الإجابة: يقصر فعل مضارع منصوب بـ«لن» وعلامة نصبه الفتحة الظاهرة على آخره.',
      'worked_en', 'Guide practice: parse the verb in "lan yaqsara al-mujtahid-u" — a present verb made accusative by lan, marked by the visible fatha at its end.',
      'objectives_ar', jsonb_build_array('تصنيف الفعل إلى ماض ومضارع وأمر', 'تحديد حالة المضارع إعرابيًا حسب الأداة السابقة', 'الحذر من الفرق بين الأفعال الصحيحة والخمسة والمعتل'),
      'objectives_en', jsonb_build_array('Classify verbs as past, present, imperative', 'Determine the present verb''s case by its governing particle', 'Note the difference between sound verbs and the five-verbs/weak verbs'),
      'check_ar', jsonb_build_array('أعرب الفعل في «لن يقصرَ المجتهدُ».', 'بما يجزم المضارع وفق الدليل؟'),
      'check_en', jsonb_build_array('Parse the verb in "lan yaqsara…".', 'What jussifies a present verb per the guide?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l8 from public.lessons where unit_id = v_unit_id and slug = 'arab-grammar-verb-types' limit 1;

  -- Lesson 9: المعرب والمبني
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 9, 'arab-grammar-inflected', 'القواعد: المعرب والمبني من الأسماء والأفعال', 'Grammar: Inflected and Fixed among Nouns and Verbs', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'grammar-morphology',
      'duration_minutes', 7,
      'prerequisite_lesson_id', v_l8::text,
      'summary_ar', 'المعرب ما يتغير آخره بتغير العامل أو موقعه الإعرابي، مثال الدليل: «جاء محمدٌ، رأيت محمدًا، مررت بمحمدٍ» فتغير آخر الاسم بحسب موقعه. والمبني ما يلزم آخره صورة واحدة في السياق المعتاد، مثل كثير من الضمائر وأسماء الإشارة وبعض الأسماء، والفعل الماضي وفعل الأمر في القاعدة العامة. والحالات الإعرابية الأساسية للأسماء: الرفع وعلامته الأصلية الضمة، والنصب وعلامته الأصلية الفتحة، والجر وعلامته الأصلية الكسرة؛ أما الجزم فيكون في الفعل المضارع ولا يدخل الأسماء. والعامل هو ما يؤثر في الإعراب فقد يكون فعلًا أو حرفًا أو عاملًا معنويًا بحسب التركيب. أمثلة الدليل: «حضر المعلمُ» فالمعلم فاعل مرفوع؛ و«كرم المديرُ المعلمَ» فالمعلم مفعول به منصوب؛ و«سلمت على المعلمِ» فالمعلم اسم مجرور؛ و«الذي» و«هذا» من الأسماء المبنية في الاستخدامات الأساسية.',
      'summary_en', 'Inflected (mu''rab): its ending changes with the governing factor or syntactic position — the guide''s example "ja''a Muhammad-un, ra''aytu Muhammad-an, marartu bi-Muhammad-in". Fixed (mabni): its ending stays one form in ordinary contexts — many pronouns, demonstratives and some nouns, plus the past verb and the imperative in the general rule. Basic noun cases: nominative marked originally by damma, accusative by fatha, genitive by kasra; jassiveness applies to the present verb only, never nouns. The governing factor may be a verb, a particle, or a semantic operator by construction. Guide examples: "hadara al-mu''allim-u" — nominative subject; "karrama al-mudir-u al-mu''allim-a" — accusative object; "sallamtu ''ala al-mu''allim-i" — genitive; "alladhi" and "hadha" are fixed in basic uses.',
      'worked_ar', 'من أمثلة الدليل: قارن «جاء محمدٌ / رأيت محمدًا / مررت بمحمدٍ» ولاحظ تغير آخر الاسم مع ثبات الكلمة؛ هذا هو المعرب، بينما «هذا» يلزم صورته في الاستخدام الأساسي فهو مبني.',
      'worked_en', 'From the guide''s examples: compare "ja''a Muhammad-un / ra''aytu Muhammad-an / marartu bi-Muhammad-in" — the ending changes while the word stays; that is mu''rab, whereas "hadha" keeps one form in basic use: mabni.',
      'objectives_ar', jsonb_build_array('التمييز بين المعرب والمبني بأمثلة', 'ربط كل حالة إعرابية بعلامتها الأصلية', 'توضيح أن الجزم خاص بالمضارع لا الأسماء'),
      'objectives_en', jsonb_build_array('Distinguish inflected from fixed with examples', 'Match each case to its original marker', 'Show jussiveness belongs to present verbs, not nouns'),
      'check_ar', jsonb_build_array('ما الفرق بين المعرب والمبني؟', 'لماذا لا يدخل الجزم الأسماء؟'),
      'check_en', jsonb_build_array('What is the difference between mu''rab and mabni?', 'Why does jussiveness never apply to nouns?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l9 from public.lessons where unit_id = v_unit_id and slug = 'arab-grammar-inflected' limit 1;

  -- Lesson 10: مرفوعات الأسماء
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 10, 'arab-grammar-nominatives', 'القواعد: مرفوعات الأسماء', 'Grammar: Nominative Nouns', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'grammar-morphology',
      'duration_minutes', 8,
      'prerequisite_lesson_id', v_l9::text,
      'summary_ar', 'المرفوعات أسماء يكون حكمها الإعرابي الرفع، وتظهر فيها الضمة أو علامة فرعية بحسب نوع الاسم. وهي سبعة في الدليل: 1) المبتدأ اسم تبدأ به الجملة الاسمية غالبًا مثل «العلمُ نورٌ»؛ 2) الخبر ما يتمم معنى المبتدأ مثل «نورٌ»؛ 3) الفاعل من قام بالفعل أو اتصل به مثل «شرح المعلمُ الدرسَ»؛ 4) نائب الفاعل يحل محل الفاعل عند بناء الفعل للمجهول مثل «شُرح الدرسُ»؛ 5) اسم كان وأخواتها يظل مرفوعًا وخبرها منصوب في العمل الناقص مثل «كان الجوُّ معتدلًا»؛ 6) خبر إن وأخواتها مرفوع واسم إن منصوب مثل «إن العلمَ نافعٌ»؛ 7) التوابع قد يتبع النعت أو العطف أو التوكيد أو البدل الاسم المرفوع مثل «حضر الطالبُ المجتهدُ». وعلامات الرفع الأساسية والفرعية: الضمة للمفرد وجمع التكسير وجمع المؤنث السالم والمضارع الصحيح الآخر، والألف للمثنى، والواو لجمع المذكر السالم والأسماء الخمسة في شروطها، وثبوت النون للأفعال الخمسة في حالة الرفع وهي أفعال لا أسماء؛ فاذكرها لتمييز القاعدة ولا تخلط بين مرفوعات الاسم وإعراب الفعل. أمثلة إعرابية من الدليل: «المهندسان ماهران» فكلاهما مرفوع بالألف لأنه مثنى؛ و«كتب الطلابُ الواجبَ» فالطلاب فاعل مرفوع بالضمة؛ و«فُتح البابُ» فالباب نائب فاعل مرفوع بالضمة؛ و«إن الصدقَ منجاةٌ» فالصدق اسم إن منصوب ومنجاة خبر إن مرفوع.',
      'summary_en', 'Nominative nouns carry the nominative ruling, shown by damma or a substitute marker per noun type. The guide lists seven: 1) mubtada'' (subject of the nominal sentence) as in "al-''ilm-u nur-un"; 2) khabar (predicate) completing the mubtada''; 3) fa''il (subject of the verb) as in "sharaha al-mu''allim-u al-dars-a"; 4) na''ib al-fa''il replacing the subject in passives as in "shuraha al-dars-u"; 5) the noun of kana and sisters stays nominative while its predicate is accusative: "kana al-jaw-u mu''tadil-an"; 6) the predicate of inna and sisters is nominative while its noun is accusative: in "inna al-sidq-a munjatan" the noun al-sidq is accusative and the predicate munjatan nominative; 7) followers — adjective, conjunction, emphasis, substitute — may follow a nominative noun: "hadara al-talib-u al-mujtahid-u". Markers: damma for singulars, broken plurals, sound feminine plurals and sound present verbs; alif for the dual; waw for sound masculine plurals and the five nouns under their conditions; persistent nun for the five verbs in nominative — verbs, not nouns, so keep noun-nominatives and verb-parsing distinct. Guide parsings: "al-muhandisan mahiran" both nominative by alif (dual); "kataba al-tullab-u al-wajib-a" nominative subject by damma; "futiha al-bab-u" passive subject by damma; "inna al-sidq-a munjatan…" as the guide gives — inna''s noun accusative, its predicate nominative.',
      'worked_ar', 'تدريب الدليل الشامل: حدد المبتدأ والخبر في «الوقتُ ثمينٌ» — الإجابة: الوقت مبتدأ مرفوع وثمين خبر مرفوع؛ وحدد نائب الفاعل في «كُرّم المتفوقُ» — الإجابة: المتفوق نائب فاعل مرفوع.',
      'worked_en', 'The guide''s comprehensive practice: find mubtada'' and khabar in "al-waqt-u thamin-un" — al-waqt nominative mubtada'', thamin nominative khabar; find the passive subject in "kurrima al-mutawaffiq-u" — al-mutawaffiq, nominative na''ib al-fa''il.',
      'objectives_ar', jsonb_build_array('ذكر المرفوعات السبعة بأمثلة', 'ربط علامات الرفع الأساسية والفرعية بأنواع الأسماء', 'التمييز بين مرفوعات الاسم وعلامات إعراب الفعل'),
      'objectives_en', jsonb_build_array('List the seven nominatives with examples', 'Match primary and substitute nominative markers to noun types', 'Keep noun-nominatives distinct from verb parsing markers'),
      'check_ar', jsonb_build_array('حدد المبتدأ والخبر في «الوقتُ ثمينٌ».', 'حدد نائب الفاعل في «كُرّم المتفوقُ».', 'ما علامة رفع المثنى وجمع المذكر السالم؟'),
      'check_en', jsonb_build_array('Find mubtada'' and khabar in "al-waqt-u thamin-un".', 'Find the passive subject in "kurrima…".', 'What marks the dual and sound masculine plural in nominative?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l10 from public.lessons where unit_id = v_unit_id and slug = 'arab-grammar-nominatives' limit 1;

  -- Lesson 11: قصة «أبو الفوارس: عنترة بن شداد» — ملخص الأجزاء الأربعة
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 11, 'arab-story-antara', 'قصة «أبو الفوارس: عنترة بن شداد» — ملخص الأجزاء الأربعة', 'The Story "Abu al-Fawaris: Antara ibn Shaddad" — Summary of the Four Parts', 15, 25,
    v_prov || jsonb_build_object(
      'lesson_group', 'story',
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l10::text,
      'summary_ar', 'ملاحظة الدليل: هذا تلخيص دراسي للأحداث والشخصيات لا ينقل نص القصة الأصلي؛ استخدم كتاب القصة لتثبيت تفاصيل المشاهد وتسلسلها. الجزء الأول — من مغنى القافلة إلى حوار ساخن: يقدم البيئة التي يعيش فيها عنترة ومكانته داخل القبيلة وما يواجهه بسبب النسب والتمييز الاجتماعي، وتبرز شخصيته بالشجاعة والاعتداد بالنفس والرغبة في إثبات الجدارة بالفعل لا بالكلام، ويهيئ الحوار والصراع لفهم علاقات القبيلة وتوقعاتها ومكانة الفروسية والشرف. الجزء الثاني — من خطبة عبلة إلى علاقة قلقة: تتقدم العلاقة بين عنترة وعبلة لتظهر الفجوة بين المشاعر الشخصية والقيود الاجتماعية، ويواجه تحديات لا تتعلق بالقوة الجسدية وحدها بل بمكانته واعتراف الآخرين بقدرته على الوفاء وتحمل المسؤولية، وانتبه للفرق بين ما تتمناه الشخصيات وما تسمح به الظروف. الجزء الثالث — رحيل عبلة والمهر: يشتد الصراع بسبب الشروط التي توضع أمام عنترة ويصبح تحقيق المطلوب اختبارًا للشجاعة والإصرار والقدرة على مواجهة الخطر، ويرتبط الرمز الاجتماعي للمهر بإثبات الجدارة وطلب الاعتراف لا بالقيمة المادية وحدها. الجزء الرابع — من رحلة المخاطر إلى الخاتمة: تتابع الأحداث مسار المخاطر وما ينتج عنها من قرارات ونتائج وتجمع خطوط الصراع الرئيسة في النهاية، وتظهر قيمة الوفاء والإصرار في مواجهة العقبات ويكشف الحل عن أثر الشجاعة والسمعة والاعتراف الاجتماعي. بطاقة الشخصية للمراجعة: صفات بارزة (الشجاعة، قوة الإرادة، الاعتزاز بالكرامة، الوفاء، الشعر والفروسية)، والصراع بين موهبته وقيمته والحواجز الاجتماعية ورفض الاعتراف، ووسائل بناء الشخصية (الحوار، الفعل، ردود أفعال الآخرين، وصف المواقف، والقرارات تحت الضغط)، وأفكار عامة (قيمة الإنسان لا تختزل في نسبه، والاعتراف الاجتماعي قد يتأخر، والشجاعة تحتاج ضبط النفس والحكمة، والحب والوفاء يواجهان اختبارات واقعية).',
      'summary_en', 'Guide note: this is a study summary of events and characters, not the original story text; use the story book to fix scene details and order. Part 1 — from the caravan''s song to a heated dialogue: presents Antara''s environment, his standing in the tribe, and what he faces due to lineage and social discrimination; his character shows courage, self-respect, and the will to prove worth by deed, not words; dialogue and conflict prepare understanding of tribal relations, expectations, and the place of horsemanship and honour. Part 2 — from ''Abla''s betrothal to an anxious relationship: the relationship advances, showing the gap between personal feelings and social constraints; his challenges concern not only physical strength but standing and others'' recognition of his reliability and responsibility; note the difference between what characters wish and what circumstances allow. Part 3 — ''Abla''s departure and the bride-price: conflict intensifies through conditions set before Antara; achieving the demand becomes a test of courage, persistence and facing danger; the bride-price''s social symbolism ties to proving worth and seeking recognition, not mere material value. Part 4 — from the journey of dangers to the ending: events follow the path of risks, decisions and outcomes, converging the main conflict lines in the conclusion; fidelity and persistence in facing obstacles emerge, and the resolution reveals the effect of courage, reputation and social recognition. Character card for review: prominent traits (courage, willpower, dignity, fidelity, poetry and horsemanship); the conflict between his talent/worth and social barriers/refusal of recognition; means of building character (dialogue, action, others'' reactions, scene description, decisions under pressure); general ideas (a person''s value is not reduced to lineage; social recognition may be delayed; courage needs self-control and wisdom; love and fidelity face real tests).',
      'worked_ar', 'من أسئلة الدليل المتوقعة: ما العائق أمام العلاقة في الجزء الثاني؟ كيف تظهر العاطفة في سلوك البطل؟ ما أثر المجتمع في قرارات الشخصيات؟ وعند الإجابة اربط الحدث بصفة من صفات عنترة مع الاستدلال من السلوك الوارد في الملخص.',
      'worked_en', 'The guide''s expected questions: what blocks the relationship in Part 2? How does emotion appear in the hero''s behaviour? How does society shape the characters'' decisions? In answers, tie each event to one of Antara''s traits with evidence from the behaviour the summary reports.',
      'objectives_ar', jsonb_build_array('ترتيب أحداث الأجزاء الأربعة', 'تحليل شخصية عنترة وصراعها', 'ربط المهر بإثبات الجدارة والاعتراف الاجتماعي'),
      'objectives_en', jsonb_build_array('Order the four parts'' events', 'Analyze Antara''s character and conflict', 'Tie the bride-price to proving worth and recognition'),
      'check_ar', jsonb_build_array('ما العائق أمام علاقة عنترة وعبلة؟', 'ما صفات عنترة البارزة؟', 'فرق بين نهاية الحدث الرئيس وتطور شخصية البطل.'),
      'check_en', jsonb_build_array('What blocks Antara and ''Abla''s relationship?', 'What are Antara''s prominent traits?', 'Distinguish the main plot''s ending from the hero''s growth.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l11 from public.lessons where unit_id = v_unit_id and slug = 'arab-story-antara' limit 1;

  -- ===== Questions: reading lesson 1 =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_reading, null, 0.9,
      'ما الفكرة العامة لموضوع «مكارم الأخلاق وحاتم الطائي» كما في الدليل؟',
      'What is the main idea of "Moral Virtues and Hatim al-Tai" per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["إبراز أثر الأخلاق الكريمة في مكانة الإنسان مع تقديم حاتم نموذجًا للكرم والمروءة","سرد أخبار العرب في الشعر الجاهلي","تعريف تجارة حاتم الطائي","مقارنة القبائل في الثراء"]'::jsonb,
      '["Highlighting the effect of noble morals on a person''s standing, with Hatim as a model of generosity and chivalry","Narrating pre-Islamic Arab news","Describing Hatim al-Tai''s trade","Comparing tribes in wealth"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'هذه هي الفكرة العامة بنص الدليل: أثر الأخلاق الكريمة في مكانة الإنسان، وحاتم نموذجًا للكرم والمروءة.',
    'This is the guide''s literal main idea: the effect of noble morals on one''s standing, with Hatim as a model of generosity and chivalry.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_reading, null, 1.0,
      'ما الفرق بين الكرم والإسراف كما يضبطه الدليل؟',
      'How does the guide distinguish generosity from extravagance?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الكرم النافع يراعي حاجة الآخرين وحكمة استخدام المال، والإسراف تجاوز الاعتدال دون مصلحة","لا فرق بينهما","الإسراف نوع من الكرم يستحبه الناس","الكرم إعطاء كل المال والإسراف إعطاء نصفه"]'::jsonb,
      '["Beneficial generosity considers others'' needs and wisdom in spending; extravagance exceeds moderation without benefit","No difference","Extravagance is a praised form of generosity","Generosity gives all money; extravagance gives half"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'هذا التمييز حرفي في إرشاد الدليل للإجابة عن سؤال «كيف يختلف الكرم عن الإسراف؟».',
    'This is the guide''s literal distinction in its tip for answering "how does generosity differ from extravagance?".'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_rhetoric, null, 1.05,
      'سُئل طالب: «ما أثر خلق الحلم؟» فاكتفي بذكر تعريفه. ما تقييم إجابته وفق طريقة الدليل؟',
      'A student, asked "what is the effect of forbearance?", only gave its definition. How is his answer judged by the guide''s method?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["غير كافية؛ فعند سؤال الأثر تشرح أثره في الفرد والمجتمع بدل تكرار اسم الخلق أو تعريفه","إجابة كاملة","يجب أن يضيف قصيدة جديدة","يجب أن يذكر سيرة كل العصور"]'::jsonb,
      '["Insufficient; when asked for the effect, explain its effect on individual and society rather than repeating the virtue''s name or definition","Complete","He should add a new poem","He should cover every era"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص الدليل: عند سؤال «ما أثر الخلق؟» اشرح أثره في الفرد والمجتمع بدل تكرار اسم الخلق فقط.',
    'From the guide: when asked "what is the effect of a virtue?", explain its effect on individual and society instead of repeating its name.'
  );

  -- ===== Questions: literature lesson 2 =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_rhetoric, null, 0.9,
      'ما العاطفة الأساسية في قصيدة السموأل وفق الدليل؟',
      'What is the dominant emotion in al-Samawal''s poem per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الاعتزاز بالقيم والوفاء والثقة بالنفس","الحزن على الديار","الشكوى من الجوع","مدح الملوك طلبًا للمال"]'::jsonb,
      '["Pride in values, fidelity and self-confidence","Grieving over dwellings","Complaining of hunger","Praising kings for money"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'عناصر التحليل في الدليل تحدد العاطفة الأساسية بالاعتزاز بالقيم والوفاء والثقة بالنفس.',
    'The guide''s analysis elements name the dominant emotion: pride in values, fidelity and self-confidence.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_rhetoric, null, 1.0,
      'عند تحليل صورة بلاغية في أبيات النص، ما المطلوب وفق إرشاد الدليل؟',
      'When analyzing a rhetorical image in the text''s verses, what does the guide require?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["شرح المشبه به أو المعنى الذي توحي به الصورة دون الاكتفاء بكتابة اسمها","ذكر اسم الصورة فقط","حفظ عدد الصور في القصيدة","تجاهل الصور والتركيز على القافية"]'::jsonb,
      '["Explain the image''s meaning or what it conveys, not merely name it","Name the image only","Count the images","Ignore imagery and focus on rhyme"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: افحص التشبيهات والاستعارات والكنايات واشرح المشبه به أو المعنى الذي توحي به الصورة، ولا تكتف بكتابة اسم الصورة.',
    'The guide''s text: examine similes, metaphors and metonymy; explain what the image conveys — do not stop at its name.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_reading, null, 1.0,
      'لماذا تحذر ملاحظات الدليل من إسقاط أحكام عامة على كل شعراء الجاهلية؟',
      'Why does the guide warn against blanket judgments about all pre-Islamic poets?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن الإجابة يجب أن ترتبط دائمًا بالنص المقرر نفسه لا بقواعد عامة مجردة","لأن الشعر الجاهلي ضعيف","لأنه لا يوجد شعر جاهلي","لأن الأحكام ممنوعة في الدراسة"]'::jsonb,
      '["Because answers must always tie to the set text itself, not abstract general rules","Because pre-Islamic poetry is weak","Because no such poetry exists","Because judgments are banned in study"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: لا تُسقط أحكامًا عامة على كل الشعراء؛ اربط إجابتك دائمًا بالنص المقرر.',
    'The guide''s text: do not impose general judgments on all poets; always tie your answer to the set text.'
  );

  -- ===== Questions: literature lesson 3 =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_reading, null, 0.9,
      'أي التصنيفات الآتية يناسب وصية أمامة بنت الحارث وفق الدليل؟',
      'Which genre fits Umama bint al-Harith''s counsel per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["النثر التعليمي الذي يقدم خبرة اجتماعية في صورة نصائح واضحة","الشعر الغنائي","المسرحية","القصة الخيالية"]'::jsonb,
      '["Educational prose offering social experience as clear counsel","Lyric poetry","Drama","Fantasy story"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: الوصية تمثل نموذج النثر التعليمي الذي يقدّم خبرة اجتماعية في صورة نصائح واضحة.',
    'The guide''s text: the counsel models educational prose presenting social experience as clear advice.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_reading, null, 1.0,
      'ما الطريقة الصحيحة للإجابة عن «ما الهدف من الوصية؟» كما يرشد الدليل؟',
      'What is the right way to answer "what is the aim of the counsel?" as the guide directs?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["ذكر أنها توجيه عملي لحياة مستقرة ثم بيان قيمة أو قيمتين ثم توضيح أثر تطبيقهما","قول إنها تتحدث عن الزواج فقط","حفظ الوصية حفظًا كاملًا","ذكر أسماء الشخصيات فقط"]'::jsonb,
      '["State it is practical guidance for a stable life, name one or two values, then show the effect of applying them","Say it is only about marriage","Memorize the whole text","Name the characters only"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إرشاد الدليل صريح: تجنب التلخيص بعبارة عامة جدًا مثل «تتحدث عن الزواج» فقط؛ بل هدف عملي ثم قيم ثم أثر.',
    'The guide is explicit: avoid the overly generic "it talks about marriage" — give the practical aim, values, then effect.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_reading, null, 1.0,
      'عند تحليل الوصية تاريخيًا، ما التحفظ الذي يوصي به الدليل؟',
      'In historical analysis of the counsel, what caution does the guide recommend?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["النص يعكس بيئة اجتماعية قديمة؛ فتدرس القيم الإنسانية العامة مع فهم سياق العصر","نقل كل نصائحه حرفيًا إلى كل زمان","تجاهل السياق التاريخي كليًا","اعتبار الوصية قانونًا ملزمًا"]'::jsonb,
      '["The text reflects an old social environment; study the general human values while understanding the era","Copy all its advice verbatim to every age","Ignore the historical context","Treat the counsel as binding law"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: يتذكر أنه يعكس بيئة اجتماعية قديمة؛ يمكن دراسة القيم الإنسانية العامة مع فهم سياق العصر.',
    'The guide''s text: remember it reflects an old social environment; study the general human values while understanding the era''s context.'
  );

  -- ===== Questions: reading lesson 4 =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_reading, null, 0.9,
      'كيف يقيس الدليل القيمة الحقيقية الاجتماعية؟',
      'How does the guide measure a value''s true social worth?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["بكيفية تحويلها إلى سلوك لا بما يقوله الإنسان فقط","بعدد المرات التي تذكر فيها","بشهرة القيمة في الكتب","بعدد من يعلنون الإيمان بها"]'::jsonb,
      '["By turning it into behaviour, not only by what one says","By how often it is mentioned","By its fame in books","By how many proclaim belief in it"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: القيمة الحقيقية لا تُقاس بما يقوله الإنسان فقط، بل بكيفية تحويلها إلى سلوك.',
    'The guide''s text: a value''s worth is measured not only by what one says but by turning it into behaviour.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_reading, null, 1.0,
      'ما علاقة «احترام الآخر» بالاختلاف في الآراء وفق الدليل؟',
      'How does respecting others relate to disagreeing with them, per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الاحترام لا يعني الموافقة على كل الآراء بل التعامل بإنصاف وعدم انتهاك الحقوق","الاحترام يعني الموافقة الدائمة","الاختلاف يستوجب مقاطعة الآخر","لا يمكن الاحترام مع الاختلاف"]'::jsonb,
      '["Respect does not mean agreeing with every view but dealing fairly without violating rights","Respect means permanent agreement","Disagreement justifies boycotting","Respect and disagreement cannot coexist"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: احترام الآخر لا يعني الموافقة على كل آرائه؛ بل التعامل معه بإنصاف وعدم انتهاك حقوقه.',
    'The guide''s text: respecting others does not mean agreeing with all their views; it means fairness without violating rights.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_reading, null, 1.05,
      'أي المهارات الآتية من مهارات القراءة الخمس التي يعددها الدليل؟',
      'Which of the following is among the five reading skills the guide lists?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["تحديد العلاقة بين الجمل: تعليل أو نتيجة أو توضيح أو مقارنة أو مثال","حفظ النص حرفيًا","تجاهل السياق عند تفسير الكلمات","إضافة آراء شخصية بلا دليل"]'::jsonb,
      '["Identifying sentence relations: cause, result, clarification, comparison, example","Memorizing the text verbatim","Ignoring context when explaining words","Adding personal opinions without evidence"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مهارات الدليل الخمس تشمل: الفكرة العامة والعنوان، والتمييز بين الرئيسة والداعم، والمعنى من السياق، والعلاقات بين الجمل، واستنتاج موقف الكاتب بدليل لغوي.',
    'The guide''s five skills: general idea and title; main vs supporting detail; meaning from context; sentence relations; inferring the writer''s stance with linguistic evidence.'
  );

  -- ===== Questions: literature lesson 5 =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_rhetoric, null, 0.95,
      'ما التصحيح الصحيح لعبارة «ذكرت في إجابتي أن الصورة استعارة جميلة» وفق الدليل؟',
      'How should the statement "in my answer I said the image is a beautiful metaphor" be corrected per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["يضاف شرح المعنى المقصود والأثر الفني وبيان ما شبه بماذا","يكفي ذلك فالاسم كافٍ","تحذف الإجابة كلها","تستبدل باسم محسن آخر"]'::jsonb,
      '["Add the intended meaning, the artistic effect, and what was likened to what","It suffices; the name is enough","Delete the whole answer","Replace it with another device''s name"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: لا تكتف بكتابة «استعارة جميلة»؛ وضح ما الذي شبه بماذا أو ما المعنى غير المباشر والأثر الفني.',
    'The guide''s text: do not stop at "a beautiful metaphor"; show what was likened to what, the indirect meaning and the artistic effect.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_reading, null, 1.0,
      'كيف يفصل الدليل بين العفو والتهاون في الحقوق؟',
      'How does the guide separate pardon from being lax about rights?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["العفو قرار واعٍ بترك الانتقام عند سماح الظروف، ولا يلغي حماية المظلوم ووضع حدود للسلوك المؤذي","العفو ترك مطالبة بالحقوق دائمًا","التهاون هو العفو نفسه","لا فرق بينهما"]'::jsonb,
      '["Pardon is a conscious choice to forgo revenge when circumstances allow, without removing protection of the wronged or limits on harmful behaviour","Pardon always means dropping claims","Laxity is the same as pardon","No difference"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: العفو قد يكون قرارًا واعيًا بترك الانتقام عندما تسمح الظروف، لكنه لا يلغي ضرورة حماية المظلوم أو وضع حدود للسلوك المؤذي.',
    'The guide''s text: pardon may be a conscious forgoing of revenge when circumstances allow, yet never removes protecting the wronged or limiting harmful behaviour.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_rhetoric, null, 1.0,
      'ما الترتيب الصحيح لعناصر تحليل القصيدة كما يرشدها الدليل؟',
      'What is the correct order of elements in analyzing a poem per the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الفكرة ثم العاطفة والغرض وتسلسل الأفكار ثم أثر الألفاظ والتراكيب والصور","الموسيقى فقط","عدد الأبيات فقط","أسماء الشعراء فقط"]'::jsonb,
      '["Idea, then emotion and purpose and idea-order, then the effect of wording, structures and images","Music only","Line count only","Poets'' names only"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: حدد العاطفة والغرض وتسلسل الأفكار وأثر الألفاظ والتراكيب والصور في نقل الحالة النفسية.',
    'The guide''s text: identify emotion, purpose, idea-order, and how wording, structures and images convey the psychological state.'
  );

  -- ===== Questions: grammar lesson 6 =====
  select id into v_q1 from public.questions where lesson_id = v_l6 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_grammar, null, 0.9,
      'تقسيم الكلمة في العربية وفق الدليل هو:',
      'The division of the Arabic word per the guide is:',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["اسم وفعل وحرف","معرفة ونكرة","مفرد ومثنى وجمع","جامد ومشتق"]'::jsonb,
      '["Noun, verb, particle","Definite, indefinite","Singular, dual, plural","Frozen, derived"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'أول جملة في الدرس النحوي الأول: الكلمة في العربية تنقسم إلى اسم وفعل وحرف؛ أما بقية الاختيارات فتقسيمات أخرى للسمة أو الاسم.',
    'The first grammar lesson''s opening: Arabic words divide into noun, verb and particle; the other options classify attributes of nouns.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l6 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_grammar, null, 1.0,
      'صنف «يكتب» وفق تمييز الدليل السريع:',
      'Classify "yaktub" using the guide''s quick test:',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["فعل مضارع","اسم","حرف جر","فعل أمر"]'::jsonb,
      '["Present verb","Noun","Genitive particle","Imperative verb"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    '«يكتب» يدل على حدث مرتبط بالحال أو الاستقبال ويبدأ بأحد أحرف «أنيت» فهو فعل مضارع كما في أمثلة الدليل (يكتبُ).',
    '"Yaktub" denotes an event in present/future and begins with one of the "an-yat" letters: a present verb, as in the guide''s example yaktub-u.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l6 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_grammar, null, 1.0,
      'لماذا لا يظهر معنى «في» كاملًا إلا مع غيرها؟',
      'Why does the meaning of "fi" not appear fully except with other words?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأنها حرف ومعنى الحروف لا يتم إلا مع غيرها","لأنها فعل ناقص","لأنها اسم مجرور","لأنها حرف نداء"]'::jsonb,
      '["Because it is a particle whose meaning completes only with others","Because it is a defective verb","Because it is a genitive noun","Because it is a vocative particle"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تعريف الدليل للحرف: لا يظهر معناه كاملًا إلا مع غيره، ومن أمثلته: من، إلى، في، هل، لم، لن.',
    'The guide defines a particle: its full meaning appears only with others — examples: min, ila, fi, hal, lam, lan.'
  );

  -- ===== Questions: grammar lesson 7 =====
  select id into v_q1 from public.questions where lesson_id = v_l7 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_grammar, null, 0.9,
      'في «جاء طالبٌ ثم جاء الطالبُ» — أيهما نكرة وأيهما معرفة؟',
      'In "ja''a talib-un, then ja''a al-talib-u" — which is indefinite and which definite?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["طالب نكرة والطالب معرفة","طالب معرفة والطالب نكرة","كلاهما نكرة","كلاهما معرفة"]'::jsonb,
      '["Talib indefinite; al-talib definite","Talib definite; al-talib indefinite","Both indefinite","Both definite"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'المعرفة تدل على معين والنكرة غير معينة؛ و«الطالب» معرف بـ«الـ» فهي معرفة، و«طالب» بلا تعريف فهي نكرة — كما في تدريب الدليل.',
    'Definites denote a specific referent, indefinites do not; "al-talib" is defined by the article, bare "talib" is indefinite — as in the guide''s practice.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l7 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_grammar, null, 1.0,
      'ما علامة رفع المثنى في القاعدة الأساسية؟',
      'What marks the dual''s nominative in the basic rule?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الألف","الواو","الضمة","ثبوت النون"]'::jsonb,
      '["The alif","The waw","The damma","The persistent nun"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: المثنى غالبًا يرفع بالألف وينصب ويجر بالياء؛ والواو لجمع المذكر السالم، وثبوت النون للأفعال الخمسة.',
    'The guide''s text: the dual is nominative by alif, accusative/genitive by ya''; waw is for sound masculine plurals and the persistent nun for the five verbs.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l7 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_grammar, null, 1.05,
      'إعراب «بالطالبِ» في «مررت بالطالبِ» وفق الدليل:',
      'The parsing of "bi-l-talib-i" in "marartu bi-l-talib-i" per the guide:',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["اسم مجرور بالباء","اسم مرفوع فاعل","اسم منصوب مفعول به","حرف جر"]'::jsonb,
      '["Genitive noun by the ba''","Nominative subject","Accusative object","Genitive particle"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل الإعرابي حرفيًا: «مررت بالطالبِ» — الطالب اسم مجرور بالباء وعلامة جره الكسرة.',
    'The guide''s literal example: in "marartu bi-l-talib-i", al-talib is a genitive noun governed by the ba'', marked by kasra.'
  );

  -- ===== Questions: grammar lesson 8 =====
  select id into v_q1 from public.questions where lesson_id = v_l8 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l8, v_skill_grammar, null, 0.9,
      'في «لن يهملَ الطالبُ» ما حالة الفعل «يهمل» وعلامته وفق الدليل؟',
      'In "lan yuhmila al-talib-u", what is the verb''s case and marker per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["منصوب بـ«لن» وعلامة نصبه الفتحة","مجزوم بـ«لن» وعلامته السكون","مرفوع بالضمة","مبني على الفتح"]'::jsonb,
      '["Accusative by lan, marked by fatha","Jussive by lam, marked by sukun","Nominative by damma","Fixed on fatha"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل حرفيًا: «لن يهملَ الطالبُ» — المضارع منصوب بـ«لن» وعلامة نصبه الفتحة الظاهرة.',
    'The guide''s literal example: in "lan yuhmila", the present verb is accusative by lan, marked by the visible fatha.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l8 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l8, v_skill_grammar, null, 1.0,
      'في «لم يهملْ الطالبُ» ما علامة جزم الفعل وفق الدليل؟',
      'In "lam yuhmil al-talib-u", what jussive marker does the verb carry per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["السكون","الفتحة","الضمة","حذف النون"]'::jsonb,
      '["Sukun","Fatha","Damma","Dropped nun"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل: «لم يهملْ الطالبُ» — المضارع مجزوم بـ«لم» وعلامة جزمه السكون؛ وحذف النون علامة جززوم للأفعال الخمسة فقط.',
    'The guide''s example: in "lam yuhmil", the verb is jussive by lam marked by sukun; the dropped nun is only for the five verbs.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l8 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l8, v_skill_grammar, null, 1.05,
      'لماذا يحذر الدليل من تطبيق الضمة أو الفتحة الظاهرة على كل الأفعال؟',
      'Why does the guide warn against applying the visible damma/fatha to every verb?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن علامات الإعراب تختلف في الأفعال الخمسة والمعتل الآخر","لأن الماضي مضارع","لأن الأمر مبني على الضم","لأن الضمة علامة جر"]'::jsonb,
      '["Because case markers differ in the five verbs and final-weak verbs","Because past is present","Because the imperative is fixed on damma","Because damma marks genitive"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تنبيه الدليل الصريح: علامات الإعراب التفصيلية تختلف في الأفعال الخمسة والمعتل الآخر؛ فلا تطبق القاعدة دون فحص نوع الفعل.',
    'The guide''s explicit caution: detailed case markers differ for the five verbs and final-weak verbs; check the verb type before applying the rule.'
  );

  -- ===== Questions: grammar lesson 9 =====
  select id into v_q1 from public.questions where lesson_id = v_l9 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l9, v_skill_grammar, null, 0.9,
      'ما تعريف المعرب وفق الدليل؟',
      'What is an inflected word per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["ما يتغير آخره بتغير العامل أو موقعه الإعرابي","ما يلزم آخره صورة واحدة","ما لا يدخل الجملة","ما قبول النداء فقط"]'::jsonb,
      '["Whose ending changes with the governing factor or syntactic position","Whose ending stays one form","That never enters a sentence","That only accepts vocative"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تعريف الدليل حرفيًا: المعرب ما يتغير آخره بتغير العامل أو موقعه الإعرابي، ومثاله «جاء محمدٌ، رأيت محمدًا، مررت بمحمدٍ».',
    'The guide''s literal definition: mu''rab is what changes its ending with the governing factor or position — e.g. "ja''a Muhammad-un, ra''aytu Muhammad-an, marartu bi-Muhammad-in".'
  );

  select id into v_q2 from public.questions where lesson_id = v_l9 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l9, v_skill_grammar, null, 1.0,
      'أي الكلمات الآتية مبني في الاستخدام الأساسي وفق الدليل؟',
      'Which of the following is fixed (mabni) in basic usage per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الذي","الطالبُ في «جاء الطالبُ»","المعلمَ في «كرم المديرُ المعلمَ»","كتاب"]'::jsonb,
      '["Alladhi","Al-talib-u in «ja''a al-talib-u»","Al-mu''allim-a in «karrama al-mudir-u al-mu''allim-a»","Kitab"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: «الذي» و«هذا» من الأسماء المبنية في الاستخدامات الأساسية، مثل كثير من الضمائر وأسماء الإشارة.',
    'The guide''s text: "alladhi" and "hadha" are fixed nouns in basic uses, like many pronouns and demonstratives.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l9 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l9, v_skill_grammar, null, 1.0,
      'ما علامة الجر الأصلية للأسماء وفق الدليل؟',
      'What is the original genitive marker for nouns per the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الكسرة","الضمة","الفتحة","السكون"]'::jsonb,
      '["Kasra","Damma","Fatha","Sukun"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الحالات الأساسية في الدليل: الرفع ضمة، والنصب فتحة، والجر كسرة؛ والجزم للمضارع ولا يدخل الأسماء.',
    'The guide''s basic cases: nominative damma, accusative fatha, genitive kasra; jussiveness is for present verbs, never nouns.'
  );

  -- ===== Questions: grammar lesson 10 =====
  select id into v_q1 from public.questions where lesson_id = v_l10 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l10, v_skill_grammar, null, 0.9,
      'حدد المبتدأ والخبر في «الوقتُ ثمينٌ» كما في تدريب الدليل.',
      'Identify mubtada'' and khabar in "al-waqt-u thamin-un" as in the guide''s practice.',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الوقت مبتدأ وثمين خبر وكلاهما مرفوع","الوقت خبر وثمين مبتدأ","الوقت فاعل وثمين مفعول","كلاهما مفعول به"]'::jsonb,
      '["Al-waqt is mubtada'' and thamin khabar, both nominative","Al-waqt khabar and thamin mubtada''","Al-waqt subject of a verb and thamin object","Both are objects"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية حرفيًا: الوقت مبتدأ وثمين خبر؛ والمبتدأ اسم تبدأ به الجملة الاسمية والخبر ما يتمم معناه.',
    'The guide''s suggested answer: al-waqt is mubtada'' and thamin khabar; the mubtada'' opens the nominal sentence and the khabar completes it.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l10 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l10, v_skill_grammar, null, 1.0,
      'ما نائب الفاعل في «كُرّم المتفوقُ» وفق تدريب الدليل؟',
      'Who is the passive subject in "kurrima al-mutawaffiq-u" per the guide''s practice?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["المتفوق؛ لأنه حل محل الفاعل عند بناء الفعل للمجهول وهو مرفوع","المتفوق فاعل فعل مبني للمعلوم","لا يوجد نائب فاعل","المتفوق مفعول به منصوب"]'::jsonb,
      '["Al-mutawaffiq; it replaced the subject in the passive and is nominative","Al-mutawaffiq is the subject of an active verb","There is no passive subject","Al-mutawaffiq is an accusative object"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل: المتفوق نائب فاعل مرفوع؛ والنائب يحل محل الفاعل عند بناء الفعل للمجهول، ومثله «فُتح البابُ».',
    'The guide''s answer: al-mutawaffiq is the nominative passive subject; a na''ib replaces the subject in passives, like "futiha al-bab-u".'
  );

  select id into v_q3 from public.questions where lesson_id = v_l10 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l10, v_skill_grammar, null, 1.05,
      'في «إن الصدقَ منجاةٌ» وفق الدليل: ما إعراب «الصدق» و«منجاة»؟',
      'In "inna al-sidq-a munja-tun" per the guide: parse "al-sidq" and "munja".',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الصدق اسم إن منصوب ومنجاة خبر إن مرفوع","الصدق مرفوع ومنجاة منصوبة","كلاهما منصوب","كلاهما مرفوع"]'::jsonb,
      '["Al-sidq is inna''s noun, accusative; munja is inna''s predicate, nominative","Al-sidq nominative and munja accusative","Both accusative","Both nominative"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل حرفيًا: «إن الصدقَ منجاةٌ» — الصدق اسم إن منصوب، ومنجاة خبر إن مرفوع.',
    'The guide''s literal example: "inna al-sidq-a munjatan" — inna''s noun is accusative and its predicate nominative.'
  );

  -- ===== Questions: story lesson 11 =====
  select id into v_q1 from public.questions where lesson_id = v_l11 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l11, v_skill_story, null, 0.9,
      'ما الصراع الرئيس في قصة عنترة كما يصوغه الدليل؟',
      'What is the main conflict in Antara''s story as the guide frames it?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["بين موهبته وقيمته من جهة والحواجز الاجتماعية ورفض الاعتراف من جهة أخرى","بين عنترة وعبلة عن المال","بين القبيلة ومدينة أخرى","عن تجارة القوافل"]'::jsonb,
      '["Between his talent and worth on one side and social barriers and refused recognition on the other","Between Antara and ''Abla over money","Between two tribes over trade","About caravan commerce"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بطاقة الشخصية في الدليل تحدد الصراع: بين موهبته وقيمته من جهة، والحواجز الاجتماعية ورفض الاعتراف من جهة أخرى.',
    'The guide''s character card defines the conflict: his talent and worth versus social barriers and refusal of recognition.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l11 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l11, v_skill_story, null, 1.0,
      'بماذا يرتبط الرمز الاجتماعي للمهر في الجزء الثالث وفق الدليل؟',
      'What does the bride-price''s social symbolism in Part 3 tie to, per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["بإثبات الجدارة وطلب الاعتراف لا بالقيمة المادية وحدها","بالثراء فقط","بعقاب عنترة","بتجارة الأسلحة"]'::jsonb,
      '["To proving worth and seeking recognition, not just material value","To wealth alone","To punishing Antara","To arms trade"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: يرتبط الرمز الاجتماعي للمهر في الأحداث بإثبات الجدارة وطلب الاعتراف، لا بالقيمة المادية وحدها.',
    'The guide''s text: the bride-price''s social symbolism ties to proving worth and seeking recognition, not mere material value.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l11 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l11, v_skill_story, null, 1.0,
      'ما التنبيه الذي يلحظه الدليل في بداية ملخص القصة؟',
      'What caveat does the guide state at the start of the story summary?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["أنه تلخيص دراسي لا ينقل نص القصة الأصلي ويجب استخدام كتاب القصة للتفاصيل","أن القصة مشوهة","أن القصة ليست مقررة","أن الملخص أطول من القصة"]'::jsonb,
      '["It is a study summary not reproducing the original story; use the story book for details","The story is corrupted","The story is not in the syllabus","The summary is longer than the story"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الملاحظة في الدليل: هذا تلخيص دراسي للأحداث والشخصيات لا ينقل نص القصة الأصلي؛ استخدم كتاب القصة لتثبيت تفاصيل المشاهد وتسلسلها.',
    'The guide''s note: this is a study summary of events and characters, not the original story; use the story book to fix scene details and order.'
  );

  -- ===== Unit boss questions =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_grammar, null, 1.1,
      'تحدّي الوحدة (1): صنف الكلمات الثلاث «على، يكتب، الشجاعة» بالترتيب وفق تدريب الدليل.',
      'Unit challenge (1): Classify in order "ala, yaktub, al-shaja''a" per the guide''s practice.',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["حرف، فعل مضارع، اسم","اسم، حرف، فعل","فعل، اسم، حرف","اسم، فعل، حرف"]'::jsonb,
      '["Particle, present verb, noun","Noun, particle, verb","Verb, noun, particle","Noun, verb, particle"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية حرفيًا: حرف، فعل مضارع، اسم.',
    'The guide''s suggested answer, verbatim: particle, present verb, noun.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_grammar, null, 1.1,
      'تحدّي الوحدة (2): أعرب «المهندسان ماهران» وفق مثال الدليل الإعرابي.',
      'Unit challenge (2): Parse "al-muhandisan mahiran" per the guide''s example.',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["المهندسان مبتدأ مرفوع بالألف لأنه مثنى، وماهران خبر مرفوع بالألف لأنه مثنى","المهندسان مرفوع بالواو لأنه جمع مذكر سالم","ماهران منصوب بالياء","كلاهما مبني"]'::jsonb,
      '["Al-muhandisan is nominative mubtada'' by alif (dual) and mahiran nominative khabar by alif (dual)","Al-muhandisan is nominative by waw as a sound masculine plural","Mahiran is accusative by ya''","Both are fixed"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل الإعرابي حرفيًا: «المهندسان ماهران» — المهندسان مبتدأ مرفوع بالألف لأنه مثنى؛ وماهران خبر مرفوع بالألف لأنه مثنى.',
    'The guide''s literal example: both words are nominative by alif as a dual — mubtada'' and khabar respectively.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_reading, null, 1.15,
      'تحدّي الوحدة (3): عند تحليل نص أدبي مقرر، أي المنهج الآتي يجمع إرشادات الدليل كلها؟',
      'Unit challenge (3): When analyzing a set literary text, which approach combines all the guide''s advice?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["حدد الفكرة والعاطفة، واستدل من النص المقرر نفسه، واشرح أثر الصور لا أسماءها فقط","اقتبس شعرًا غير موجود في المقرر وعلق عليه","اكتتف بذكر أسماء المحسنات البلاغية","أحكم على الشعراء جميعًا بحكم واحد"]'::jsonb,
      '["Identify idea and emotion, cite the set text itself, and explain images'' effects not just their names","Quote poetry absent from the syllabus and comment","Merely name rhetorical devices","Judge all poets with one verdict"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يجمع هذا الخيار إرشادات الدليل: الربط بالنص المقرر، وشرح أثر الصور، وعدم اختلاق أقوال لا وردت؛ فالدليل يحذر من افتراض اقتباسات من خارج الملف.',
    'This option combines the guide''s tips: tie to the set text, explain imagery effects, and never invent quotations — the guide forbids fabricating passages absent from it.'
  );

end $$;
