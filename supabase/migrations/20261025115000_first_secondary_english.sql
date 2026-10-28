-- First Secondary Term 1 (2026-2027) — Unit 5: English
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 873-1129 (sha256 2b7fc532…)
-- Idempotent. English-first content; Arabic prompts are faithful translations.
-- The guide provides original explanations and models, not the textbook''s readings; no passages are invented here.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_vocab uuid;
  v_skill_grammar uuid;
  v_skill_writing uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'english',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي ومفصّل، وليس نسخة حرفية من الكتاب المدرسي.',
    'provenance_en', 'Content built from an original detailed study guide, not a verbatim copy of the school textbook.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 5 limit 1;
  if v_unit_id is null then
    raise exception 'Unit English (position 5) not found. Run migration 20261025100000 first.';
  end if;

  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'eng-vocabulary', 'استخدام مفردات الوحدات في السياق', 'Use unit vocabulary in context'),
    (v_course_id, 'eng-grammar', 'تطبيق قواعد الوحدات بدقة', 'Apply unit grammar accurately'),
    (v_course_id, 'eng-writing', 'كتابة نصوص منظمة بغرض واضح', 'Write organized texts with a clear purpose')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;
  select id into v_skill_vocab from public.skills where course_id = v_course_id and slug = 'eng-vocabulary' limit 1;
  select id into v_skill_grammar from public.skills where course_id = v_course_id and slug = 'eng-grammar' limit 1;
  select id into v_skill_writing from public.skills where course_id = v_course_id and slug = 'eng-writing' limit 1;

  -- Lesson 1: Unit 1 — EGYPT''S HERITAGE
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'eng-heritage', 'Unit 1 — Egypt''s Heritage', 'Unit 1 — Egypt''s Heritage', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'summary_ar', 'وحدة عن تراث مصر وتاريخها وهوية المسؤولية عن حماية الأماكن الثقافية والتاريخية؛ الهدف فهم الفكرة الرئيسة والتفاصيل، وسرد أحداث الماضي، وكتابة مقال أو فقرة منظمة. بنك المفردات: heritage (تراث: تقاليد وأماكن وإنجازات توارثتها الأجيال)، ancient (قديم جدًا)، civilization (حضارة: مجتمع متطور بنظم ومعارف وفنون)، monument (معلم تاريخي)، preserve (يحافظ)، restore (يرمم ويعيد الحالة السابقة)، archaeologist (عالم آثار)، identity (هوية)، legacy (إرث قيّم)، conservation (حماية من التلف أو الفقد). القاعدة الأولى الماضي البسيط: subject + past form؛ الأفعال المنتظمة تضاف لها ed وغير المنتظمة لها صيغ خاصة؛ النفي did not + مصدر، والسؤال Did + فاعل + مصدر؛ مع be نستخدم was/were؛ وتعبيرات الزمن: yesterday, last year, two days ago, in 2019, when I was young. القاعدة الثانية الماضي المستمر: was/were + verb-ing لفعل مستمر في وقت معين بالماضي أو كخلفية لحدث آخر؛ مع while يصف فعلين متزامنين، ومع when يقاطع حدث قصير مكتمل نشاطًا أطول: I was reading when the lights went out. والفرق: الماضي البسيط للأحداث المكتملة أو المتسلسلة، والماضي المستمر للخلفية المستمرة. نموذج الكتابة (120-150 كلمة) بقوس: مقدمة تعرف التراث وتذكر أهميته، ثم أمثلة وطرق الحماية، ثم خاتمة تؤكد الرسالة وتقترح فعلًا؛ وروابط مفيدة: First, Moreover, For example, However, Therefore, Finally.',
      'summary_en', 'A unit about Egypt''s heritage, history, identity, and the responsibility of protecting cultural and historical places; goals: understand main idea and details, narrate past events, write an organized essay/paragraph. Vocabulary bank: heritage (traditions, places, achievements passed down), ancient, civilization (a developed society with institutions, knowledge, arts), monument, preserve, restore, archaeologist, identity, legacy, conservation. Grammar 1, Past Simple: subject + past form; regular verbs add -ed, irregulars have special forms; negative did not + base; question Did + subject + base; with be was/were; time expressions: yesterday, last year, two days ago, in 2019, when I was young. Grammar 2, Past Continuous: was/were + verb-ing for an action in progress at a past time or as background; with while, two simultaneous ongoing actions; with when, a shorter completed action interrupts: I was reading when the lights went out. Contrast: Past Simple for completed events/sequences; Past Continuous for ongoing background. Writing model (120-150 words): introduction defining heritage and why it matters; body with examples and protection actions; conclusion restating the message and suggesting an action; linkers: First, Moreover, For example, However, Therefore, Finally.',
      'worked_ar', 'مثال الدليل: While we were taking notes, the guide explained the inscription — الماضي المستمر للخلفية (were taking notes) والماضي البسيط للحدث (explained). ونموذج الكتابة يفتتح: Egypt has a rich heritage that connects modern people with earlier generations.',
      'worked_en', 'Guide example: "While we were taking notes, the guide explained the inscription" — Past Continuous for background (were taking notes), Past Simple for the event (explained). The writing model opens: "Egypt has a rich heritage that connects modern people with earlier generations."',
      'objectives_ar', jsonb_build_array('استخدام مفردات الوحدة في جمل', 'تصريف الماضي البسيط إثباتًا ونفيًا وسؤالًا', 'التمييز بين الماضي البسيط والمستمر', 'كتابة فقرة منظمة عن التراث'),
      'objectives_en', jsonb_build_array('Use unit vocabulary in sentences', 'Form Past Simple affirmative, negative, question', 'Distinguish Past Simple from Past Continuous', 'Write an organized paragraph on heritage'),
      'check_ar', jsonb_build_array('وضّح الفرق بين الماضي البسيط والماضي المستمر.', 'ماذا تعني كلمة heritage؟'),
      'check_en', jsonb_build_array('State the difference between Past Simple and Past Continuous.', 'What does heritage mean?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'eng-heritage' limit 1;

  -- Lesson 2: Unit 2 — HANDS HELP, HEARTS CARE
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'eng-hands-help', 'Unit 2 — Hands Help, Hearts Care', 'Unit 2 — Hands Help, Hearts Care', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'وحدة عن اللطف والتطوع ومساعدة الجيران وخدمة المجتمع ودعم المرضى في المواقف الصعبة؛ الشخص المساعد يلاحظ الحاجة ويتصرف بمسؤولية دون انتظار مدح. بنك المفردات: volunteer (يتطوع دون أجر)، charity (عمل خيري أو منظمة خيرية)، donate (يتبرع بمال أو أغراض أو وقت)، community (مجتمع)، support (يدعم)، compassion (رحمة/شفقة)، neighbour (جار)، emergency (حالة طارئة)، responsibility (مسؤولية)، cooperate (يتعاون). القاعدة أفعال النمط والوجوب: should/shouldn''t للنصيحة (You should check on elderly neighbours)، وmust/mustn''t للوجوب القوي أو المنع (You must wear a seat belt؛ You mustn''t enter a dangerous area)، وhave to/has to للوجوب بسبب قاعدة أو ظرف (Volunteers have to follow the organiser''s safety instructions)، وdon''t/doesn''t have to لعدم الضرورة لا المنع (You don''t have to donate money; you can give your time). الفرق المهم: mustn''t تعني «غير مسموح» وdon''t have to تعني «ليس ضروريًا». الأنماط: modal + مصدر، وhave to + مصدر، وفي السؤال: Do we have to register? Does he have to attend? الكتابة: مقال وصفي عن شخص مساعد أو مشروع مجتمعي؛ خطط: قدّم الشخص/المشروع، صف ما حدث والأفعال، اشرح الأثر على الناس، واختم بما تعلمته؛ صفات مفيدة: generous, thoughtful, reliable, caring, patient, organised, courageous.',
      'summary_en', 'A unit on kindness, volunteering, helping neighbours, community service and supporting people in difficulty; a helpful person notices needs and acts responsibly without waiting for praise. Vocabulary bank: volunteer, charity, donate, community, support, compassion, neighbour, emergency, responsibility, cooperate. Grammar, modals and obligation: should/shouldn''t for advice (You should check on elderly neighbours); must/mustn''t for strong obligation or prohibition (You must wear a seat belt; You mustn''t enter a dangerous area); have to/has to for obligation from a rule or circumstance (Volunteers have to follow the organiser''s safety instructions); don''t/doesn''t have to for lack of necessity, not prohibition (You don''t have to donate money; you can give your time). Key distinction: mustn''t = not allowed; don''t have to = not necessary. Patterns: modal + base verb; have to + base; questions: Do we have to register? Does he have to attend? Writing: descriptive essay about a helpful person or community project — introduce, describe what happened and actions taken, explain the effect, conclude with what you learned; useful adjectives: generous, thoughtful, reliable, caring, patient, organised, courageous.',
      'worked_ar', 'فرق الدليل المهم: mustn''t تعني «يُمنع»، أما don''t have to فتعني «لا ضرورة»؛ فـ You mustn''t share private information منع، وYou don''t have to donate money ليست منعًا بل خيار.',
      'worked_en', 'The guide''s key contrast: mustn''t means "not allowed" while don''t have to means "not necessary"; so "You mustn''t share private information" prohibits, and "You don''t have to donate money" merely removes necessity.',
      'objectives_ar', jsonb_build_array('استخدام مفردات العطاء والمجتمع في سياق', 'اختيار should/must/have to بحسب المعنى', 'التمييز بين mustn''t وdon''t have to', 'وصف مشروع تطوعي بفقرات منظمة'),
      'objectives_en', jsonb_build_array('Use giving/community vocabulary in context', 'Choose should/must/have to by meaning', 'Distinguish mustn''t from don''t have to', 'Describe a volunteering project in organized paragraphs'),
      'check_ar', jsonb_build_array('ما الفرق بين mustn''t وdon''t have to؟', 'ماذا يعني volunteer؟'),
      'check_en', jsonb_build_array('What is the difference between mustn''t and don''t have to?', 'What does volunteer mean?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'eng-hands-help' limit 1;

  -- Lesson 3: Unit 3 — TRUTH VS. LIES
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'eng-truth-lies', 'Unit 3 — Truth vs. Lies', 'Unit 3 — Truth vs. Lies', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'وحدة عن الثقة والمعلومات المضللة والتزييف الرقمي والأخبار الزائفة والتحقق من الادعاءات قبل نشرها؛ قد تبدو الرسالة مقنعة وهي خاطئة أو مضللة. بنك المفردات: claim (ادعاء)، source (مصدر)، reliable (موثوق)، verify (يتحقق)، evidence (دليل)، rumour (إشاعة)، misleading (مضلل)، fake news (أخبار زائفة)، bias (انحياز)، privacy (خصوصية). روتين التحقق الرقمي الست خطوات في الدليل: تحقق من المصدر الأصلي وناشر الادعاء، وافحص التاريخ والسياق الكامل، وابحث عن أدلة من أكثر من مصدر موثوق، واقرأ ما بعد العنوان وميز الحقيقة من الرأي، وافحص الصور والاقتباسات في سياقها، ولا تشارك ادعاءً لمجرد أنه أثار غضبك أو خوفك أو حماسك. القاعدة الشرطيات: الشرطي الصفري للحقائق والروتينات If + مضارع بسيط، مضارع بسيط (If water reaches 100°C at normal atmospheric pressure, it boils)؛ والأول لاحتمال مستقبلي واقعي If + مضارع بسيط، will + مصدر (If you check the source, you will understand the story better) وشرط if لا يأخذ will في هذا النمط؛ والثاني للحالات التخيلية أو غير المرجحة If + ماضي بسيط، would + مصدر (If I were the editor, I would verify the evidence before publishing) وتستخدم were مع I/he/she/it في قواعد المدرسة الرسمية. واختر النوع بالمعنى: حقيقة أو قاعدة متوقعة صفري، نتيجة مستقبلية ممكنة أول، موقف تخيلي ثاني. الكتابة: تدوينة أو مقال قصير عن الأخبار الزائفة تشمل تعريفها وسبب انتشارها وخطرين وروتين تحقق عمليًا وخاتمة مسؤولة.',
      'summary_en', 'A unit on trust, misinformation, digital deception, fake news and checking claims before sharing; a message may look convincing and still be false. Vocabulary bank: claim, source, reliable, verify, evidence, rumour, misleading, fake news, bias, privacy. The guide''s six-step digital fact-checking routine: check the original source and publisher; check the date and full context; look for supporting evidence from more than one reliable source; read beyond the headline and separate fact from opinion; examine images and quotes in context; do not share a claim just because it makes you angry, afraid or excited. Grammar, conditionals: zero for facts/routines — If + present simple, present simple (If water reaches 100°C at normal atmospheric pressure, it boils); first for a realistic future possibility — If + present simple, will + base (If you check the source, you will understand the story better), no will in the if-clause; second for hypothetical/unlikely — If + past simple, would + base (If I were the editor, I would verify the evidence before publishing), with "were" for I/he/she/it in formal school grammar. Choose by meaning: general fact zero; possible future result first; hypothetical second. Writing: a short post/article on fake news — definition, why it spreads, two risks, a practical checking routine, a responsible conclusion.',
      'worked_ar', 'مثال الدليل للشرطي الثاني: If I were the editor, I would verify the evidence before publishing the story — موقف تخيلي غير واقعي؛ أما If you check the source, you will understand the story better فهو أول لنتيجة مستقبلية ممكنة.',
      'worked_en', 'The guide''s second-conditional example: "If I were the editor, I would verify the evidence before publishing the story" — hypothetical; whereas "If you check the source, you will understand the story better" is first conditional, a realistic future result.',
      'objectives_ar', jsonb_build_array('استخدام مفردات التحقق والمصداقية', 'ترتيب خطوات التحقق الرقمي الست', 'التمييز بين الشرطيات الثلاثة واستخدامها', 'كتابة تدوينة مسؤولة عن الأخبار الزائفة'),
      'objectives_en', jsonb_build_array('Use verification/credibility vocabulary', 'Order the six fact-checking steps', 'Distinguish and use the three conditionals', 'Write a responsible post about fake news'),
      'check_ar', jsonb_build_array('اذكر خطوتين من روتين التحقق الرقمي.', 'أكمل: If water _____ (freeze), it _____ (turn) into ice.'),
      'check_en', jsonb_build_array('Name two steps of the fact-checking routine.', 'Complete: If water _____ (freeze), it _____ (turn) into ice.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'eng-truth-lies' limit 1;

  -- Lesson 4: Unit 4 — SAVE AND SHINE
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'eng-save-shine', 'Unit 4 — Save and Shine', 'Unit 4 — Save and Shine', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'وحدة عن حماية البيئة والاستخدام الفعال للموارد وتقليل التلوث والإنتاج الأكثر مراعاة للبيئة؛ الخيارات اليومية والسياسات العامة والتكنولوجيا تعمل معًا لتقليل الهدر. بنك المفردات: environment (بيئة)، sustainable (مستدام)، renewable (متجدد كالشمس والريح)، recycle (يعيد التدوير)، reuse (يعيد الاستخدام)، reduce (يقلل)، emissions (انبعاثات)، waste (نفايات)، resource (مورد)، energy-efficient (موفر للطاقة). القاعدة الأفعال يتبعها مصدر (-ing) أو مصدر (to + فعل): تتبع الـ gerund أفعال مثل enjoy, avoid, finish, keep, mind, suggest, consider (We should avoid wasting water؛ She enjoys planting trees)؛ ويتبع المصدر to أفعال مثل decide, hope, plan, want, need, promise, learn (They decided to organise a clean-up؛ We hope to reduce plastic waste)؛ وأفعال تأخذ الاثنين بتغير يسير مثل like, love, hate (I like reading / I like to read)؛ وبعض الأفعال يتغير معناها بالنمط؛ فمثال الدليل: stop doing شيء يعني إنهاء النشاط، وstop to do شيء يعني التوقف عن نشاط آخر للقيام بذلك. الإجراءات البيئية: تقليل العبوات ذات الاستخدام الواحد، وإعادة استخدام الحاويات والأكياس عند أمانها، وفرز المواد القابلة للتدوير حيث تقبلها الأنظمة المحلية، وترشيد الكهرباء والماء، واختيار نقل فعال، ودعم التصنيع المسؤول وإصلاح المنتجات بدل استبدالها بلا داع. الكتابة: بريد إلكتروني رسمي بمكونات: subject واضح قصير، وتحية Dear [Name/Title]، وافتتاح يوضح سبب الكتابة، وجسم يشرح القضية والتفاصيل أو الطلبات، وخاتمة شكر وخطوة تالية، وتوقيع Kind regards / Yours sincerely؛ ونموذج الدليل اقتراح مشروع إعادة تدوير مدرسي.',
      'summary_en', 'A unit on environmental protection, efficient resource use, pollution reduction and greener production; everyday choices, public policy and technology together reduce waste. Vocabulary bank: environment, sustainable, renewable (like sunlight and wind), recycle, reuse, reduce, emissions, waste, resource, energy-efficient. Grammar, verbs followed by gerund or infinitive: gerund after enjoy, avoid, finish, keep, mind, suggest, consider (We should avoid wasting water; She enjoys planting trees); infinitive after decide, hope, plan, want, need, promise, learn (They decided to organise a clean-up; We hope to reduce plastic waste); both with little meaning change for like, love, hate (I like reading / I like to read); some verbs change meaning by pattern — the guide''s example: stop doing something ends the activity, stop to do something pauses another activity in order to do it. Environmental actions: reduce single-use packaging; reuse containers and bags when safe; separate recyclables where local systems accept them; save electricity and water; choose efficient transport; support responsible manufacturing and repair. Writing, formal email: clear short subject; greeting Dear [Name/Title]; opening stating why you write; body explaining the issue and details/requests; closing thanks and next step; sign-off Kind regards / Yours sincerely; the guide''s model proposes a school recycling project.',
      'worked_ar', 'مثال الدليل المهم: stop doing مقابل stop to do — She stopped wasting water تعني أنها أنهت الهدر؛ أما She stopped to save water فتعني توقفت عن شيء آخر لتوفر الماء.',
      'worked_en', 'The guide''s key example: "stop doing" versus "stop to do" — "She stopped wasting water" ends the waste; "She stopped to save water" means she paused another activity in order to save water.',
      'objectives_ar', jsonb_build_array('استخدام مفردات البيئة والاستدامة', 'حفظ أفعال الـ gerund وأفعال المصدر to', 'التمييز بين stop doing وstop to do', 'كتابة بريد إلكتروني رسمي مكتمل المكونات'),
      'objectives_en', jsonb_build_array('Use environment/sustainability vocabulary', 'Learn gerund-taking vs infinitive-taking verbs', 'Distinguish stop doing from stop to do', 'Write a complete formal email'),
      'check_ar', jsonb_build_array('أكمل: We should avoid _____ (waste) water.', 'اذكر مكونات البريد الإلكتروني الرسمي.'),
      'check_en', jsonb_build_array('Complete: We should avoid _____ (waste) water.', 'List the parts of a formal email.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'eng-save-shine' limit 1;

  -- Lesson 5: Unit 5 — USING TECHNOLOGY AT SCHOOLS
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'eng-technology-schools', 'Unit 5 — Using Technology at Schools', 'Unit 5 — Using Technology at Schools', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'وحدة عن التكنولوجيا في التعليم وتعلم لغات جديدة والأدوات الرقمية ومنافع الذكاء الاصطناعي وحدوده؛ فالتكنولوجيا تدعم التعلم لكنها لا تلغي الحاجة إلى الجهد والحكم والتدريب والملاحظات الموثوقة. بنك المفردات: technology (تطبيق عملي للمعرفة العلمية والأدوات)، platform (منصة رقمية)، application/app (برنامج لمهمة)، multilingual (متعدد اللغات)، translate (يترجم)، pronunciation (طريقة نطق الكلمة)، feedback (ملاحظات تحسن الأداء)، access (قدرة أو فرصة الاستخدام)، interactive (تفاعلي)، artificial intelligence (أنظمة حاسوبية لمهام تتطلب استدلالًا أو معالجة لغة شبيهة بالبشرية). القاعدة الأسماء المعدودة وغير المعدودة: المعدود لها مفرد وجمع (a book, two books, many students)؛ وغير المعدودة تعامل بوصفها كتلة أو مفهومًا في المعنى المقصود: information, advice, equipment, homework, knowledge؛ فيقال a piece of advice وtwo pieces of information لا an advice ولا informations. أدوات الكمية: some غالبًا في الإثبات والعروض (I have some useful notes؛ Would you like some help?)، وany في النفي والسؤال (We don''t have any paper؛ Do you have any questions?)، وmany مع المعدود الجمع (many books)، وmuch مع غير المعدود (much time)، وa few عدد صغير موجب للمعدود (a few exercises)، وfew قليل مع إيحاء النقص (few students understood)، وa little كمية صغيرة موجبة لغير المعدود (a little time)، وlittle قليل مع إيحاء النقص (little time remains)، وa lot of/lots of مع الاثنين في كثير من السياقات. الكتابة: بريد إلكتروني غير رسمي لصديق عن التعلم بالتكنولوجيا؛ تحية ودية ولغة طبيعية وفقرات وخاتمة دافئة؛ اشرح الأداة وكيف تستخدمها ومنفعة وحدًا؛ ونموذج الدليل عن تطبيق تعلم اللغة مع التحقق من القاموس والتحدث مع أشخاص حقيقيين.',
      'summary_en', 'A unit on technology in education, learning new languages, digital tools, and the benefits and limits of AI; technology supports learning but does not remove the need for effort, judgement, practice and reliable feedback. Vocabulary bank: technology, platform, application/app, multilingual, translate, pronunciation, feedback, access, interactive, artificial intelligence (computer systems for tasks needing human-like reasoning or language processing). Grammar, countable and uncountable nouns: countables have singular and plural (a book, two books, many students); uncountables are treated as a mass or concept in the relevant meaning — information, advice, equipment, homework, knowledge; say "a piece of advice", "two pieces of information", not "an advice" or "informations". Quantifiers: some often in affirmatives/offers (I have some useful notes; Would you like some help?); any in negatives/questions (We don''t have any paper; Do you have any questions?); many with countable plurals (many books); much with uncountables (much time); a few — a small positive number of countables (a few exercises); few — not many, stressing insufficiency (few students understood); a little — a small positive amount of uncountables (a little time); little — stressing insufficiency (little time remains); a lot of/lots of with both in many contexts. Writing: informal email to a friend about learning with technology — friendly greeting, natural language, paragraphs, warm closing; explain the tool, how you use it, one benefit, one limitation; the guide''s model covers a language-learning app plus dictionary checking and talking with real people.',
      'worked_ar', 'أمثلة الدليل: There are many useful videos, but we don''t have much time؛ وI downloaded a few dictionaries and found some advice about pronunciation؛ وWe have little information about the source, so we should check it.',
      'worked_en', 'Guide examples: "There are many useful videos, but we don''t have much time"; "I downloaded a few dictionaries and found some advice about pronunciation"; "We have little information about the source, so we should check it."',
      'objectives_ar', jsonb_build_array('استخدام مفردات التكنولوجيا والتعلم', 'تمييز الأسماء المعدودة من غير المعدودة', 'اختيار أدوات الكمية الصحيحة', 'كتابة بريد إلكتروني غير رسمي متوازن'),
      'objectives_en', jsonb_build_array('Use technology/learning vocabulary', 'Distinguish countable from uncountable nouns', 'Choose correct quantifiers', 'Write a balanced informal email'),
      'check_ar', jsonb_build_array('قل: a piece of advice أم an advice؟ ولماذا؟', 'أكمل: We have _____ information and only _____ minutes.'),
      'check_en', jsonb_build_array('Say "a piece of advice" or "an advice"? Why?', 'Complete: We have _____ information and only _____ minutes.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'eng-technology-schools' limit 1;

  -- ===== Lesson 1 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_vocab, null, 0.9,
      'ما معنى "heritage" كما يعرّفه الدليل؟',
      'What does "heritage" mean as the guide defines it?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["تقاليد وأماكن وإنجازات انتقلت من الأجيال السابقة","مبنى حكومي حديث","نوع من الآلات الموسيقية","لعبة أطفال شعبية"]'::jsonb,
      '["Traditions, places, and achievements passed down from earlier generations","A modern government building","A kind of musical instrument","A traditional children''s game"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بنك المفردات في الدليل: heritage = traditions, places, and achievements passed down from earlier generations.',
    'The guide''s vocabulary bank: heritage = traditions, places, and achievements passed down from earlier generations.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_grammar, null, 1.0,
      'أكمل بقاعدة الماضي البسيط: We _____ (visit) the museum last week.',
      'Complete with Past Simple: We _____ (visit) the museum last week.',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["visited","visit","are visiting","will visit"]'::jsonb,
      '["visited","visit","are visiting","will visit"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"المضارع لا يناسب last week.","2":"الاستمرارية لا تناسب حدثًا مكتملًا بزمن محدد ماضٍ.","3":"المستقبل مخالف للزمن الماضي."}}'::jsonb,
    'الفعل المنتظم يأخذ ed في الماضي البسيط مع تعبير زمن ماضٍ مثل last week: We visited the museum last week — مثال الدليل نفسه.',
    'A regular verb takes -ed in the Past Simple with a past time expression like "last week": "We visited the museum last week" — the guide''s own example.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_grammar, null, 1.05,
      'أكمل: While the visitors _____ (look) at the statues, the guide _____ (explain) their history.',
      'Complete: "While the visitors _____ (look) at the statues, the guide _____ (explain) their history."',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["were looking / was explaining","looked / was explaining","were looking / explains","look / explained"]'::jsonb,
      '["were looking / was explaining","looked / was explaining","were looking / explains","look / explained"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مع while يصف الدليل فعلين مستمرين متزامنين بالماضي المستمر: While the visitors were looking at the statues, the guide was explaining their history.',
    'With "while" the guide describes two simultaneous ongoing actions in the Past Continuous: "While the visitors were looking at the statues, the guide was explaining their history."'
  );

  select id into v_q4 from public.questions where lesson_id = v_l1 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_grammar, null, 1.0,
      'أي جملة تعبر عن حدث قصير مقاطع لنشاط أطول كما في قاعدة when عند الدليل؟',
      'Which sentence shows a short completed action interrupting a longer activity, per the guide''s "when" rule?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["I was reading when the lights went out.","I read when the lights were going out.","I am reading when the lights go out.","I will read when the lights will go out."] '::jsonb,
      '["I was reading when the lights went out.","I read when the lights were going out.","I am reading when the lights go out.","I will read when the lights will go out."]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل حرفيًا: I was reading when the lights went out — الماضي المستمر للنشاط الأطول والماضي البسيط للمقاطعة القصيرة.',
    'The guide''s literal example: "I was reading when the lights went out" — Past Continuous for the longer activity, Past Simple for the short interruption.'
  );

  -- ===== Lesson 2 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_grammar, null, 0.9,
      'أكمل بقاعدة المنع: You _____ share private information without permission.',
      'Complete with the prohibition rule: "You _____ share private information without permission."',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["mustn''t","don''t have to","shouldn''t have","needn''t"]'::jsonb,
      '["mustn''t","don''t have to","shouldn''t have","needn''t"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"don''t have to تعني عدم الضرورة لا المنع."}}'::jsonb,
    'السؤال عن المنع، وmustn''t تعني «غير مسموح»؛ وهذه هي إجابة الدليل في اختباره العملي: mustn''t.',
    'The question asks for prohibition; mustn''t means "not allowed" — the guide''s own practice answer is mustn''t.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_grammar, null, 1.0,
      'أي جملة تعبر عن عدم الضرورة لا المنع وفق فرق الدليل المهم؟',
      'Which sentence expresses lack of necessity, not prohibition, per the guide''s key contrast?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["You don''t have to donate money; you can give your time.","You mustn''t donate money.","You must enter the dangerous area.","You has to register yesterday."] '::jsonb,
      '["You don''t have to donate money; you can give your time.","You mustn''t donate money.","You must enter the dangerous area.","You has to register yesterday."]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل حرفيًا: don''t have to تعني عدم الضرورة — لا حاجة للتبرع بالمال، يمكنك إعطاء وقتك؛ أما mustn''t فمنع.',
    'The guide''s literal example: don''t have to means "not necessary" — you may give time instead; mustn''t would prohibit.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_vocab, null, 0.95,
      'ما معنى "volunteer" في بنك مفردات الدليل؟',
      'What does "volunteer" mean in the guide''s vocabulary bank?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["يقدم المساعدة دون مقابل مالي","يعمل مقابل راتب مرتفع","يدير شركة خيرية فقط","يتبرع بالدم فقط"]'::jsonb,
      '["Offers to help without being paid","Works for a high salary","Only runs a charity company","Only donates blood"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بنك المفردات: volunteer = offer to help without being paid.',
    'Vocabulary bank: volunteer = offer to help without being paid.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l2 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_grammar, null, 1.0,
      'أي سؤال صياغته صحيحة بأداة have to كما في أنماط الدليل؟',
      'Which question is correctly formed with "have to" per the guide''s patterns?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["Do we have to register?","Do we must register?","Have we to register?","Does we have register?"]'::jsonb,
      '["Do we have to register?","Do we must register?","Have we to register?","Does we have register?"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'أسلوب الدليل للسؤال: Do/Does + فاعل + have to + مصدر، ومثاله: Do we have to register? Does he have to attend?',
    'The guide''s question pattern: Do/Does + subject + have to + base; its examples: "Do we have to register? Does he have to attend?"'
  );

  -- ===== Lesson 3 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_grammar, null, 0.9,
      'أكمل الشرطي الصفري: If water _____ (freeze), it _____ (turn) into ice.',
      'Complete the zero conditional: "If water _____ (freeze), it _____ (turn) into ice."',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["freezes / turns","will freeze / turns","froze / would turn","is freezing / turned"]'::jsonb,
      '["freezes / turns","will freeze / turns","froze / would turn","is freezing / turned"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الشرطي الصفري للحقائق: If + مضارع بسيط، مضارع بسيط؛ وإجابة الدليل في اختباره العملي: freezes / turns.',
    'The zero conditional states facts: If + present simple, present simple; the guide''s practice answer: freezes / turns.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_grammar, null, 1.0,
      'أكمل الشرطي الثاني التخيلي: If I _____ (be) the head teacher, I _____ (start) a reading club.',
      'Complete the hypothetical second conditional: "If I _____ (be) the head teacher, I _____ (start) a reading club."',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["were / would start","am / will start","was / start","will be / started"]'::jsonb,
      '["were / would start","am / will start","was / start","will be / started"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الشرطي الثاني للحالات التخيلية: If + ماضي بسيط (were مع I في قواعد المدرسة)، would + مصدر؛ وإجابة الدليل: were / would start.',
    'The second conditional covers hypotheticals: If + past simple ("were" with I in school grammar), would + base; the guide''s answer: were / would start.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_vocab, null, 0.95,
      'ما الفرق بين "misleading" و"reliable" في بنك مفردات الدليل؟',
      'What is the difference between "misleading" and "reliable" in the guide''s vocabulary bank?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["misleading يعطي انطباعًا خاطئًا وreliable يعني قابلًا للثقة","هما مترادفان","reliable تعني خادعة وmisleading تعني صادقة","كلاهما يصف الأخبار الزائفة فقط"]'::jsonb,
      '["Misleading gives the wrong impression; reliable means able to be trusted","They are synonyms","Reliable means deceptive and misleading means truthful","Both describe only fake news"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بنك المفردات: misleading = giving the wrong idea or impression، وreliable = able to be trusted.',
    'Vocabulary bank: misleading = giving the wrong idea or impression; reliable = able to be trusted.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l3 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_writing, null, 1.0,
      'وفق روتين التحقق في الدليل، متى لا تشارك ادعاءً منشورًا؟',
      'Per the guide''s fact-checking routine, when should you NOT share a posted claim?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["عندما لا يمكن التحقق منه؛ فالأولى ألا تقدمه بوصفه حقيقة","عندما يكون مثيرًا للاهتمام فقط","عندما يكون قديمًا دائمًا مهما ثبتت صحته","عندما يوافق رأيك"]'::jsonb,
      '["When it cannot be verified; safer not to present it as fact","Only when it is boring","Always if it is old, however verified","When it matches your opinion"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من روتين الدليل ونموذج كتابته: If a claim cannot be verified, it is safer not to present it as fact؛ ولا تشارك لمجرد الغضب أو الخوف أو الحماس.',
    'From the routine and writing model: if a claim cannot be verified, it is safer not to present it as fact; never share just because you feel angry, afraid or excited.'
  );

  -- ===== Lesson 4 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_grammar, null, 0.9,
      'أكمل بقاعدة الـ gerund: We should avoid _____ (waste) water.',
      'Complete with the gerund rule: "We should avoid _____ (waste) water."',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["wasting","to waste","wasted","waste"]'::jsonb,
      '["wasting","to waste","wasted","waste"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'avoid من الأفعال التي يتبعها gerund، ومثال الدليل حرفيًا: We should avoid wasting water.',
    'Avoid takes a gerund; the guide''s literal example: "We should avoid wasting water."'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_grammar, null, 1.0,
      'أكمل: They decided _____ (organise) a clean-up.',
      'Complete: "They decided _____ (organise) a clean-up."',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["to organise","organising","organised","organise"]'::jsonb,
      '["to organise","organising","organised","organise"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'decide من الأفعال التي يتبعها المصدر to، ومثال الدليل حرفيًا: They decided to organise a clean-up.',
    'Decide takes the to-infinitive; the guide''s literal example: "They decided to organise a clean-up."'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_grammar, null, 1.05,
      'ما الفرق بين "stop doing something" و"stop to do something" كما يشرح الدليل؟',
      'What is the difference between "stop doing something" and "stop to do something" as the guide explains?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["stop doing يعني إنهاء النشاط نفسه، وstop to do يعني التوقف عن نشاط آخر لفعل ذلك","هما متطابقان","stop to do يعني الامتناع الأبدي","stop doing يعني البدء بالنشاط"]'::jsonb,
      '["Stop doing ends the activity itself; stop to do means pausing another activity in order to do it","They are identical","Stop to do means never doing it","Stop doing means starting the activity"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: بعض الأفعال يتغير معناها بالنمط؛ فstop doing something يعني إنهاء النشاط، وstop to do something يعني إيقاف نشاط آخر من أجل فعل ذلك.',
    'The guide''s text: some verbs change meaning by pattern — stop doing something ends the activity; stop to do something pauses another activity in order to do it.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l4 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_writing, null, 1.0,
      'ما مكون البريد الإلكتروني الرسمي الذي يذكره الدليل أولًا بعد التحية؟',
      'Which part of a formal email comes right after the greeting per the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["افتتاح يوضح سبب الكتابة","التوقيع","المرفقات","الخاتمة والشكر"]'::jsonb,
      '["An opening stating why you are writing","The signature","Attachments","The closing thanks"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'ترتيب الدليل: subject واضح قصير ثم تحية Dear [Name/Title] ثم opening يوضح سبب الكتابة ثم body ثم closing ثم sign-off.',
    'The guide''s order: a clear short subject, greeting Dear [Name/Title], opening stating why you write, body, closing, sign-off.'
  );

  -- ===== Lesson 5 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_grammar, null, 0.9,
      'أي العبارات صحيحة وفق قاعدة الأسماء غير المعدودة في الدليل؟',
      'Which phrase is correct per the guide''s uncountable-noun rule?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["a piece of advice","an advice","two advices","many advices"]'::jsonb,
      '["a piece of advice","an advice","two advices","many advices"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: advice غير معدود؛ فيقال a piece of advice أو two pieces of information، لا an advice ولا informations.',
    'The guide''s text: advice is uncountable; say "a piece of advice" or "two pieces of information", never "an advice" or "informations".'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_grammar, null, 1.0,
      'أكمل: We have _____ information and only _____ minutes. (حسب المقصود في الدليل)',
      'Complete: "We have _____ information and only _____ minutes." (per the guide''s intended meaning)',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["little / a few","few / a little","much / many","any / some"]'::jsonb,
      '["little / a few","few / a little","much / many","any / some"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل: little information لأن information غير معدودة وlittle توحي بالنقص، وa few minutes لأن minutes معدودة وa few عدد صغير موجب.',
    'The guide''s answer: little information (uncountable, stressing insufficiency) and a few minutes (countable, a small positive number).'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_vocab, null, 0.95,
      'ما معنى "feedback" في بنك مفردات الدليل؟',
      'What does "feedback" mean in the guide''s vocabulary bank?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["معلومات تساعد على تحسين الأداء","جهاز إلكتروني","نوع من الامتحانات","شبكة اجتماعية"]'::jsonb,
      '["Information that helps improve performance","An electronic device","A type of exam","A social network"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بنك المفردات: feedback = information that helps improve performance.',
    'Vocabulary bank: feedback = information that helps improve performance.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l5 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_writing, null, 1.0,
      'في نموذج الدليل للبريد غير الرسمي، لماذا يقترح الكاتب التحدث مع أشخاص حقيقيين رغم استخدام التطبيق؟',
      'In the guide''s informal-email model, why does the writer suggest talking with real people despite using the app?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["لأن التطبيق لا يعوض كل أنواع المحادثة","لأن التطبيق باهظ الثمن","لأن التطبيق لا يعمل أبدًا","لأن الكاتب لا يحب التكنولوجيا"]'::jsonb,
      '["Because an app cannot replace every kind of conversation","Because the app is expensive","Because the app never works","Because the writer dislikes technology"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نموذج الدليل: I try to speak with real people because an app cannot replace every kind of conversation؛ فالتكنولوجيا أنفع عند استخدامها بانتظام وتفكير في ملاحظاتها.',
    'The guide''s model: "I try to speak with real people because an app cannot replace every kind of conversation"; technology helps most when used regularly with care for its feedback.'
  );

  -- ===== Unit boss questions =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_grammar, null, 1.1,
      'تحدّي الوحدة (1): While we _____ (visit) the museum, the guide _____ (explain) the statue.',
      'Unit challenge (1): "While we _____ (visit) the museum, the guide _____ (explain) the statue."',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["were visiting / was explaining","visited / explained","are visiting / explains","will visit / will explain"]'::jsonb,
      '["were visiting / was explaining","visited / explained","are visiting / explains","will visit / will explain"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة اختبار الدليل العملي حرفيًا: were visiting / was explaining؛ فعلان مستمران متزامنان بالماضي.',
    'The guide''s practice answer verbatim: were visiting / was explaining — two simultaneous past actions.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_vocab, null, 1.1,
      'تحدّي الوحدة (2): أي كلمة من بنوك مفردات الدليل تصف «قدرة أو فرصة الاستخدام»؟',
      'Unit challenge (2): Which word from the guide''s banks means "the ability or opportunity to use something"?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["access","platform","feedback","emissions"]'::jsonb,
      '["access","platform","feedback","emissions"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"platform منصة رقمية.","2":"feedback ملاحظات تحسن الأداء.","3":"emissions انبعاثات."}}'::jsonb,
    'بنك مفردات الوحدة الخامسة: access = the ability or opportunity to use something.',
    'Unit 5''s bank: access = the ability or opportunity to use something.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_writing, null, 1.15,
      'تحدّي الوحدة (3): طالب كتب في بريده الرسمي «Hi dude, send me that file NOW». أي مبدأ من مبادئ الدليل خالفه؟',
      'Unit challenge (3): A student wrote "Hi dude, send me that file NOW" in a formal email. Which guide principle did he violate?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["النبرة المناسبة والصياغة المهذبة المطلوبة في البريد الرسمي","طول البريد فقط","وجود subject","استخدام الفقرات"]'::jsonb,
      '["The appropriate tone and polite wording required in formal email","Only the email''s length","Having a subject","Using paragraphs"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نموذج الدليل للبريد الرسمي يستخدم Dear [Name/Title] وI am writing to… وThank you for considering وKind regards؛ فالنبرة الرسمية المهذبة أساس، وهي إحدى خصائص الكتابة الجيدة في مراجعة الوحدة: نبرة مناسبة للقارئ.',
    'The guide''s formal model uses Dear [Name/Title], "I am writing to…", "Thank you for considering", "Kind regards"; appropriate polite tone is essential — and part of the unit review''s good-writing traits: tone suitable for the reader.'
  );

end $$;
