-- First Secondary Term 1 (2026-2027) — Unit 6: History — Egypt, Civilization and the Ancient World
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 1130-1320 (sha256 2b7fc532…)
-- Idempotent; preserves the guide''s own caveats about historical claims and differing interpretations.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_concepts uuid;
  v_skill_sources uuid;
  v_skill_economy uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'history',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي ومفصّل، وليس نسخة حرفية من الكتاب المدرسي؛ مع مراعاة تحفظات الدليل حول الروايات التاريخية.',
    'provenance_en', 'Content built from an original detailed study guide, not a verbatim copy of the school textbook; the guide''s caveats about historical accounts are preserved.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 6 limit 1;
  if v_unit_id is null then
    raise exception 'Unit History (position 6) not found. Run migration 20261025100000 first.';
  end if;

  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'hist-civilization-concepts', 'التمييز بين الحضارة والتاريخ والعصور', 'Distinguish civilization, history and eras'),
    (v_course_id, 'hist-source-evaluation', 'تقييم المصادر التاريخية', 'Evaluate historical sources'),
    (v_course_id, 'hist-egypt-economy', 'تحليل عوامل الحضارة المصرية واقتصادها', 'Analyze Egypt''s civilizational factors and economy')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;
  select id into v_skill_concepts from public.skills where course_id = v_course_id and slug = 'hist-civilization-concepts' limit 1;
  select id into v_skill_sources from public.skills where course_id = v_course_id and slug = 'hist-source-evaluation' limit 1;
  select id into v_skill_economy from public.skills where course_id = v_course_id and slug = 'hist-egypt-economy' limit 1;

  -- Lesson 1: الحضارة والتاريخ
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'hist-civilization-history', 'الحضارة والتاريخ', 'Civilization and History', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 8,
      'summary_ar', 'الحضارة حصيلة ما ينتجه الإنسان ويتعلمه وينظمه في تفاعله مع البيئة بهدف تحسين ظروف الحياة؛ لها جوانب مادية (المباني والأدوات ووسائل الإنتاج) وجوانب معنوية (اللغة والقيم والعلوم والمعتقدات والفنون والنظم). والتاريخ دراسة النشاط الإنساني في الماضي باستخدام المصادر والأدلة بهدف تفسير التغير والاستمرار وفهم الحاضر والاستفادة من الخبرات السابقة؛ فليس حفظ أسماء وتواريخ بل يتطلب سؤالًا ومصدرًا وتحليلًا ومقارنة. والفرق: الحضارة الإنجازات والنظم التي أنتجها البشر، والتاريخ المجال الذي يدرس الماضي الإنساني ويجمع أدلته ويفسرها؛ وقد تكون الحضارة موضوعًا من موضوعات البحث التاريخي. وفي دراسة العالم القديم تظهر حضارات كبرى في مصر وبلاد العراق ثم حضارات البحر المتوسط كاليونان وروما، وأسهمت الحضارة الإسلامية في العلوم والفلسفة والطب والرياضيات، ثم انتقلت كثير من المعارف وتطورت في مجتمعات أوروبية وغيرها؛ فالانتقال الحضاري ليس خطًا بسيطًا في اتجاه واحد بل تبادل وتأثير وتأثر وترجمة وتجارة وهجرة وصراع وتعاون. وتقسيم العصور الشائع: القديمة من ظهور الكتابة إلى سقوط روما الغربية نحو 476م، والوسطى من 476م إلى سقوط القسطنطينية 1453م مع وجود تقسيمات أخرى، والحديثة تبدأ غالبًا في القرن الخامس عشر أو السادس عشر وتستمر إلى الثورات الكبرى أواخر القرن الثامن عشر، والمعاصرة تبدأ في بعض التصنيفات بالثورة الفرنسية 1789م؛ وهذه الحدود اصطلاحات تنظيمية وليست حواجز تحدث في يوم واحد، واكتب في الامتحان الحدود المعتمدة في كتاب مدرستك. ومن أهمية دراسة التاريخ: استخلاص الدروس، وفهم جذور المؤسسات والحدود، وتقدير التراث وحمايته، واكتشاف دور الإنسان والبيئة والاقتصاد والسياسة، وتنمية التفكير النقدي بمقارنة الروايات ومصادرها.',
      'summary_en', 'Civilization is what humans produce, learn and organize in interaction with their environment to improve living conditions; it has material aspects (buildings, tools, means of production) and non-material ones (language, values, sciences, beliefs, arts, systems). History studies human activity in the past using sources and evidence to explain change and continuity, understand the present, and learn from prior experience; it is not memorizing names and dates but requires questioning, sources, analysis and comparison. The difference: civilization is the achievements and systems humans produced; history is the field studying the human past, gathering and interpreting its evidence; civilization may be one subject of historical research. In the ancient world, great civilizations arose in Egypt and Mesopotamia, then the Mediterranean (Greece, Rome); Islamic civilization contributed to sciences, philosophy, medicine and mathematics, after which knowledge passed and developed in European and other societies; civilizational transfer is not a simple one-way line but exchange, influence, translation, trade, migration, conflict and cooperation. The common era division: Ancient from writing''s appearance to Rome''s fall ~476 CE; Medieval from 476 to Constantinople''s fall 1453 (other divisions exist); Modern from the 15th-16th centuries to the great revolutions of the late 18th; Contemporary from the French Revolution 1789 in some classifications — organizational conventions, not barriers; use your school book''s boundaries in exams. Studying history matters for: drawing lessons, understanding institutions'' roots, valuing and protecting heritage, discovering the roles of people, environment, economy and politics, and developing critical thinking by comparing accounts and sources.',
      'worked_ar', 'مثال تطبيقي من الدليل: عند المقارنة بين حضارتين أو عصرين اذكر معيارًا واضحًا مثل وحدة السلطة أو النشاط العسكري أو البناء أو الاقتصاد، ولا تخلط بين الأسرة الحاكمة والدولة الكبرى والفترة الانتقالية.',
      'worked_en', 'Applied example from the guide: when comparing two civilizations or eras, state a clear criterion — unified authority, military activity, building, or economy — and do not confuse a ruling dynasty with a major state or an intermediate period.',
      'objectives_ar', jsonb_build_array('تعريف الحضارة والتاريخ والتمييز بينهما', 'ذكر الجوانب المادية والمعنوية للحضارة', 'ترتيب تقسيم العصور الأربعة مع التحفظ على الحدود', 'توضيح أهمية دراسة التاريخ'),
      'objectives_en', jsonb_build_array('Define civilization and history and distinguish them', 'List civilization''s material and non-material aspects', 'Order the four era divisions with caveats about boundaries', 'State why studying history matters'),
      'check_ar', jsonb_build_array('فرّق بين الحضارة والتاريخ.', 'ما الجوانب المعنوية للحضارة؟', 'لماذا تُعد حدود العصور اصطلاحات تنظيمية؟'),
      'check_en', jsonb_build_array('Distinguish civilization from history.', 'What are civilization''s non-material aspects?', 'Why are era boundaries organizational conventions?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'hist-civilization-history' limit 1;

  -- Lesson 2: مصادر دراسة الحضارات
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'hist-sources', 'مصادر دراسة الحضارات', 'Sources for Studying Civilizations', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 8,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'المصادر الأولية بقايا أو وثائق قريبة من الفترة التاريخية المدروسة أو صادرة عنها: الآثار والمباني والأدوات، والنقوش والكتابات على الجدران واللوحات، والبرديات والوثائق المكتوبة، والأوستراكا (شقفات فخار أو حجر استخدمت أحيانًا للكتابة)، والنقود والمسكوكات، والمقابر والتماثيل واللقى الأثرية، والوثائق الإدارية والرسائل والنصوص المعاصرة للعصر. والمصادر الثانوية دراسات أو تفسيرات كتبها باحثون بعد الفترة المدروسة اعتمادًا على المصادر والأدلة: الكتب التاريخية الحديثة والدراسات والمقالات الأكاديمية؛ وقد تشمل بعض الروايات الأدبية أو الأساطير مادة تساعد على دراسة تصورات المجتمع لكنها لا تؤخذ تلقائيًا كوقائع حرفية. ومعايير تقييم المصدر ستة في الدليل: الأصالة (هل هو أصلي أم نسخة لاحقة؟)، والزمن (متى كتب وصُنع؟ وهل كاتبه شاهد مباشر؟)، والغرض والجمهور (لماذا أُنتج ولمن؟)، والسياق (الظروف السياسية والاجتماعية وقتها)، والانحياز (هل يمدح حاكمًا أو يبرر حربًا أو يدافع عن جماعة؟)، والمقارنة (هل تؤيد مصادر مستقلة أخرى المعلومة؟). مثال الدليل: النقش الذي يوثق حملة ملكية مصدر أولي لكنه قد يبالغ في النصر، وكتاب باحث معاصر يفسر النقش مصدر ثانوي؛ والأدق مقارنة النقش بمصادر أخرى والبحث في غرضه ولغته.',
      'summary_en', 'Primary sources: remains or documents close to the studied period or produced by it — monuments, buildings, tools; inscriptions and wall/carving writings; papyri and written documents; ostraca (pottery or stone chips sometimes used for writing); coins and minted currency; tombs, statues and artefacts; administrative documents, letters and period texts. Secondary sources: studies or interpretations written by researchers after the period, based on sources and evidence — modern history books, studies, academic articles; some literary works or myths can help study a society''s perceptions but are not automatically taken as literal fact. The guide''s six evaluation criteria: authenticity (original or later copy?); time (when written/made? eyewitness?); purpose and audience (why and for whom produced?); context (political and social conditions then); bias (praising a ruler, justifying a war, defending a group?); comparison (do independent sources support it?). Guide example: an inscription documenting a royal campaign is primary but may exaggerate victory; a modern scholar''s book interpreting it is secondary; best practice compares the inscription with other sources and examines its purpose and language.',
      'worked_ar', 'تدريب من الدليل: أعطِ مثالين لمصدرين أوليين ومثالًا لمصدر ثانوي — الإجابة الإرشادية: من المصادر الأولية النقوش والبرديات والنقود، والثانوي دراسة حديثة.',
      'worked_en', 'Guide practice: give two examples of primary sources and one of a secondary — suggested answer: inscriptions, papyri and coins are primary; a modern study is secondary.',
      'objectives_ar', jsonb_build_array('تصنيف المصادر إلى أولية وثانوية', 'ذكر أمثلة من كل نوع', 'تطبيق معايير تقييم المصدر الستة', 'نقد مثال النقش الملكي بحسب الدليل'),
      'objectives_en', jsonb_build_array('Classify sources as primary or secondary', 'Give examples of each kind', 'Apply the six evaluation criteria', 'Critique the royal-inscription example per the guide'),
      'check_ar', jsonb_build_array('ما الأوستراكا؟', 'اذكر ثلاثة معايير لتقييم مصدر تاريخي.', 'لماذا لا تؤخذ الأساطير كوقائع حرفية؟'),
      'check_en', jsonb_build_array('What are ostraca?', 'Name three source-evaluation criteria.', 'Why are myths not taken as literal fact?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'hist-sources' limit 1;

  -- Lesson 3: عوامل قيام الحضارات
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'hist-civilization-factors', 'عوامل قيام الحضارات', 'Factors Behind the Rise of Civilizations', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 8,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'العوامل الطبيعية: الأنهار ومصادر المياه (الشرب والري والنقل)، والتربة الخصبة (دعم الزراعة والاستقرار)، والمناخ (قد يسهل الإنتاج أو يفرض تحديات)، والموقع الجغرافي (القرب من طرق التجارة والبحار)، والثروات الطبيعية (الأحجار والمعادن والأخشاب)، والحدود الطبيعية (حماية نسبية دون منع كل اتصال أو غزو). والعوامل البشرية: تنظيم العمل والري والإنتاج، وتكوين سلطة أو إدارة تنسق المشروعات العامة، والمهارات والخبرات ونقل المعرفة بين الأجيال، والتجارة والتخصص وتقسيم العمل، والتعاون الاجتماعي والاستقرار النسبي، والكتابة والتسجيل والتخطيط والابتكار. وعوامل قيام الحضارة المصرية: نهر النيل (ماء وري وطمي ونقل طبيعي)، والموقع (اتصال بإفريقيا والبحر المتوسط والشرق الأدنى يتيح التجارة والتبادل)، والحدود الطبيعية (صحارى وبحار ومناطق وعرة وفرت حماية نسبية مع بقاء الاتصال ممكنًا)، والمناخ والثروات (ساعدا في الأنشطة الزراعية والتعدين والبناء)، والعامل البشري (تنظيم الزراعة والري والعمالة والإدارة وتطوير الكتابة والحرف والفنون). ومقولة «مصر هبة النيل» تبرز أهمية النيل لكنها لا تعني أن النهر وحده صنع الحضارة؛ فالإنسان المصري والتنظيم والعمل والمعرفة والإدارة عوامل أساسية حوّلت البيئة إلى إنجاز حضاري.',
      'summary_en', 'Natural factors: rivers and water sources (drinking, irrigation, transport); fertile soil (supporting agriculture and stability); climate (easing production or posing challenges); geographic location (near trade routes and seas); natural resources (stone, minerals, timber); natural borders (relative protection without preventing contact or invasion). Human factors: organizing labour, irrigation and production; forming authority or administration coordinating public projects; skills, experience and intergenerational knowledge transfer; trade, specialisation and division of labour; social cooperation and relative stability; writing, record-keeping, planning and innovation. Egypt''s civilizational factors: the Nile (water, irrigation, silt, natural transport); location (links to Africa, the Mediterranean and the Near East enabling trade and exchange); natural borders (deserts, seas, rough terrain offering relative protection while contact remained possible); climate and resources (aiding farming, mining, building); the human factor (organizing agriculture, irrigation, labour and administration, developing writing, crafts and arts). The saying "Egypt is the gift of the Nile" highlights the river''s importance but does not mean the river alone created the civilization; the Egyptian people''s organization, work, knowledge and administration turned the environment into civilizational achievement.',
      'worked_ar', 'تدريب من الدليل: لماذا لا يصح القول إن النيل وحده هو الذي صنع الحضارة المصرية؟ — الإجابة الإرشادية: لأن العمل والمعرفة والدولة عوامل لا تقل أهمية عن البيئة.',
      'worked_en', 'Guide practice: why is it wrong to say the Nile alone created Egyptian civilization? — Suggested answer: because work, knowledge and the state matter no less than the environment.',
      'objectives_ar', jsonb_build_array('تصنيف العوامل الطبيعية والبشرية', 'ربط عوامل قيام الحضارة المصرية تحديدًا', 'تفسير معنى «مصر هبة النيل» ومعانيها الدقيقة'),
      'objectives_en', jsonb_build_array('Classify natural and human factors', 'Link Egypt''s specific civilizational factors', 'Interpret "Egypt is the gift of the Nile" precisely'),
      'check_ar', jsonb_build_array('اذكر ثلاثة عوامل طبيعية وثلاثة بشرية.', 'اشرح كيف تفاعلت العوامل الطبيعية والبشرية في مصر.'),
      'check_en', jsonb_build_array('List three natural and three human factors.', 'Explain how natural and human factors interacted in Egypt.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'hist-civilization-factors' limit 1;

  -- Lesson 4: ملامح من تاريخ مصر القديمة
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'hist-ancient-egypt', 'ملامح من تاريخ مصر القديمة', 'Features of Ancient Egyptian History', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'توحيد القطرين ارتبط بالملك نعرمر المعروف في تقاليد كثيرة باسم مينا في بدايات التاريخ المصري الموحد نحو أواخر الألف الرابع/بدايات الألف الثالث قبل الميلاد؛ وساعد توحيد السلطة على تنسيق الإدارة والري والموارد وتكوين دولة واسعة. والخط العام للتاريخ الفرعوني في تقسيمات مدرسية: العصر العتيق/الأسرات المبكرة (بناء الدولة الموحدة وترسيخ الإدارة)، والدولة القديمة (مركزية السلطة والمشروعات الملكية الكبرى وارتباطها الشهير بالأهرامات)، وعصر الاضمحلال الأول (تراجع وحدة السلطة في بعض الفترات)، والدولة الوسطى (إعادة توحيد الحكم ونشاط الإدارة والاقتصاد والأدب)، وعصر الاضمحلال الثاني (قوى حاكمة متعددة ومنها الهكسوس في أجزاء من مصر)، والدولة الحديثة (اتساع النفوذ وبروز ملوك مثل أحمس وتحتمس الثالث وحتشبسوت وأخناتون وتوت عنخ آمون ورمسيس الثاني مع اختلاف أدوارهم)، والعصور المتأخرة (تعدد القوى والتحديات الخارجية ثم خضوع مصر في مراحل لقوى أجنبية)؛ وتأكد من ترتيب الأسماء والتواريخ التفصيلية وفق الجدول الزمني في كتابك. ومن خصائص الحضارة المصرية القديمة: ارتباط وثيق بالنيل والزراعة، ووجود سلطة ملكية وجهاز إداري، والكتابة القديمة ونظم الحساب والتسجيل، وعمارة متميزة ومقابر ومعابد ومشروعات عامة، ومعتقدات دينية واهتمام بالحياة الأخرى والطقوس الجنائزية، وتقدم في الحرف والطب والفلك العملي والهندسة بقدر ما تسمح به الأدلة، واستمرار كثير من التقاليد مع تغيرها. ولدراسة الخط الزمني: ابدأ بأسماء المراحل، ثم رتبها زمنيًا، ثم اربط كل مرحلة بميزة أو حدث واحد، ولا تخلط بين الأسرة الحاكمة والدولة الكبرى والفترة الانتقالية.',
      'summary_en', 'The unification of the Two Lands is linked to King Narmer, known in many traditions as Menes, at the start of unified Egyptian history toward the late 4th/early 3rd millennium BCE; unified power helped coordinate administration, irrigation and resources, forming a wide state. The general Pharaonic line in school divisions: Early Dynastic (building the unified state, consolidating administration); Old Kingdom (centralized power, great royal projects, famously tied to the pyramids); First Intermediate (weakening unity in some periods); Middle Kingdom (reunification; administrative, economic and literary activity); Second Intermediate (multiple ruling powers including the Hyksos in parts of Egypt); New Kingdom (expanded influence; kings like Ahmose, Thutmose III, Hatshepsut, Akhenaten, Tutankhamun and Ramesses II with differing roles); Late Periods (multiple powers and external challenges, later subjection to foreign powers in phases) — verify names and detailed dates against your book''s timeline. Ancient Egyptian civilization''s features: close ties to the Nile and agriculture; royal authority and an administrative apparatus; ancient writing and accounting/record systems; distinctive architecture, tombs, temples and public projects; religious beliefs, concern with the afterlife and funerary rites; progress in crafts, medicine, practical astronomy and geometry as far as evidence allows; continuity of many traditions as they changed. For timelines: start with stage names, order them chronologically, attach one feature or event to each stage, and never confuse a dynasty, a major state, or an intermediate period.',
      'worked_ar', 'من طريقة الدليل في دراسة الخط الزمني: اربط كل مرحلة بميزة واحدة — الدولة القديمة بالأهرامات والمركزية، والدولة الوسطى بإعادة التوحيد ونشاط الأدب، والدولة الحديثة باتساع النفوذ وبروز الملوك.',
      'worked_en', 'From the guide''s timeline method: attach one feature per stage — Old Kingdom to pyramids and centralization; Middle Kingdom to reunification and literary activity; New Kingdom to expanded influence and prominent kings.',
      'objectives_ar', jsonb_build_array('ربط توحيد القطرين بنعرمر/مينا', 'ترتيب العصور الفرعونية الكبرى', 'ذكر خصائص الحضارة المصرية القديمة', 'تطبيق طريقة دراسة الخط الزمني'),
      'objectives_en', jsonb_build_array('Link the unification to Narmer/Menes', 'Order the major Pharaonic eras', 'List ancient Egyptian civilization''s features', 'Apply the timeline-study method'),
      'check_ar', jsonb_build_array('بمن ارتبط توحيد القطرين؟', 'ما الفرق بين عصر الاضمحلال والدولة الكبرى؟', 'لماذا يجب التأكد من التواريخ من كتاب المدرسة؟'),
      'check_en', jsonb_build_array('Who is linked to unifying the Two Lands?', 'How does an intermediate period differ from a major kingdom?', 'Why verify dates against the school book?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'hist-ancient-egypt' limit 1;

  -- Lesson 5: الحياة الاقتصادية في مصر القديمة
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'hist-economy', 'الحياة الاقتصادية في مصر القديمة', 'The Economy of Ancient Egypt', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'الزراعة كانت نشاطًا رئيسيًا بسبب النيل والتربة الزراعية؛ وارتبط الإنتاج بموسمية الفيضان ومواعيد الزراعة والحصاد واحتاج تنظيم القنوات والري وتخزين المحاصيل، ومن المحاصيل المهمة الحبوب كالقمح والشعير إلى جانب الكتان ومحاصيل أخرى بحسب المنطقة والفترة. وتفاوتت أنماط ملكية الأرض وإدارتها عبر العصور بين الملكية المرتبطة بالسلطة والمعابد والأفراد، وكانت الضرائب والمحاصيل والتخزين والإدارة عوامل تساعد الدولة على تمويل المشروعات وإمداد العاملين والجيش والموظفين. واستخدم المصريون القدماء الحيوانات في الغذاء والزراعة والنقل وبعض أعمال الإنتاج، وساهم صيد الأسماك والطيور والحيوانات في توفير الغذاء والمواد كما ظهر في رسوم ومشاهد الحياة اليومية. ومن الأنشطة الحرفية والصناعية: صناعة الفخار، والنسيج من الكتان، وصناعة الأدوات المعدنية، والعمل في الأحجار، وصناعة الحلي، وبناء القوارب، وتصنيع منتجات من البردي؛ واحتاجت هذه الحرف إلى مواد أولية وعمال مهرة وتنظيم وتبادل للمنتجات. والتجارة والنقل: التجارة الداخلية ربطت مناطق الإنتاج والاستهلاك، وكان النيل طريقًا مهمًا للنقل بجانب الطرق البرية، والتجارة الخارجية جلبت مواد لا تتوافر محليًا بالقدر الكافي وسمحت بتبادل السلع والأفكار، وارتبطت البعثات التجارية والاستكشافية باتصالات مصر بإفريقيا والشرق الأدنى والمتوسط؛ وتنسب المصادر القديمة إلى عصر الملك نخاو الثاني محاولة أو رحلة بحرية للدوران حول إفريقيا عبر البحر الأحمر ثم العودة من جهة المتوسط، وتعامل مع التفاصيل كما يعرضها كتاب المدرسة لأن الروايات القديمة تحتاج نقدًا ومقارنة. ودور الدولة يمكن أن يشمل: تنظيم الري، وجمع الضرائب أو جزء من الإنتاج، وإدارة المخازن، وتوفير العمالة للمشروعات، وتأمين طرق النقل، وتنظيم بعض الحرف والتجارة، وتختلف التفاصيل من عصر إلى آخر.',
      'summary_en', 'Agriculture was a main activity thanks to the Nile and fertile soil; production followed the flood''s seasonality and planting/harvest times and required organizing canals, irrigation and crop storage; key crops included grains like wheat and barley plus flax and others by region and period. Land ownership and management varied across eras among holdings tied to authority, temples and individuals; taxes, crops, storage and administration helped the state fund projects and supply workers, the army and officials. Ancient Egyptians used animals for food, farming, transport and some production; fishing and fowling supplied food and materials as shown in daily-life scenes. Crafts and industries: pottery; linen weaving; metal tools; stone work; jewellery; boat building; papyrus products — requiring raw materials, skilled labour, organization and exchange of products. Trade and transport: internal trade linked production and consumption areas; the Nile was a major transport route alongside land roads; external trade brought materials not locally available in quantity and allowed exchange of goods and ideas; commercial and exploratory expeditions tied Egypt to African, Near Eastern and Mediterranean contacts; ancient sources attribute to King Necho II''s era an attempt or voyage circumnavigating Africa via the Red Sea and returning through the Mediterranean — treat details as your school book presents them, since old accounts need criticism and comparison. The state''s role could include: organizing irrigation; collecting taxes or part of production; managing stores; supplying project labour; securing transport routes; regulating some crafts and trade — details varying by era.',
      'worked_ar', 'تدريب من الدليل: اذكر ثلاثة أنشطة اقتصادية في مصر القديمة واشرح علاقة أحدها بالنيل — الإجابة الإرشادية: مثل الزراعة والنقل والتجارة؛ فالزراعة والنقل يعتمدان على الفيضان ومجرى النيل.',
      'worked_en', 'Guide practice: name three economic activities of ancient Egypt and explain one''s tie to the Nile — suggested answer: farming, transport and trade; farming and transport depend on the flood and the river''s course.',
      'objectives_ar', jsonb_build_array('ذكر الأنشطة الاقتصادية الرئيسة وربطها بالنيل', 'وصف أنماط ملكية الأرض ودور الدولة', 'التعامل النقدي مع رحلة نخاو الثاني كما يوصي الدليل'),
      'objectives_en', jsonb_build_array('List main economic activities and tie them to the Nile', 'Describe land ownership patterns and the state''s role', 'Treat the Necho II voyage critically as the guide advises'),
      'check_ar', jsonb_build_array('ما المحاصيل المهمة في مصر القديمة؟', 'ما دور الدولة في الاقتصاد؟', 'لماذا تحتاج رحلة الدوران حول إفريقيا إلى نقد ومقارنة؟'),
      'check_en', jsonb_build_array('What were ancient Egypt''s key crops?', 'What was the state''s economic role?', 'Why does the Africa circumnavigation account need criticism?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'hist-economy' limit 1;

  -- ===== Lesson 1 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_concepts, null, 0.9,
      'ما الفرق الصحيح بين الحضارة والتاريخ وفق الدليل؟',
      'What is the correct difference between civilization and history per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الحضارة إنجازات الإنسان ونظمه، والتاريخ دراسة النشاط الإنساني في الماضي بالمصادر والأدلة","هما كلمتان مترادفتان","التاريخ مبانٍ والحضارة دراسة","لا علاقة بينهما"]'::jsonb,
      '["Civilization is human achievement and systems; history studies past human activity via sources and evidence","They are synonyms","History means buildings and civilization means study","They are unrelated"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية حرفيًا: الحضارة إنجازات الإنسان، والتاريخ دراسة النشاط الإنساني في الماضي؛ وقد تكون الحضارة موضوعًا من موضوعات البحث التاريخي.',
    'The guide''s suggested answer: civilization is human achievement; history studies past human activity — and civilization may itself be a subject of historical research.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_concepts, null, 1.0,
      'اللغة والقيم والعلوم والمعتقدات والفنون والنظم تعد من:',
      'Language, values, sciences, beliefs, arts and systems count as:',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["الجوانب المعنوية للحضارة","الجوانب المادية للحضارة","مصادر أولية","عوامل طبيعية"]'::jsonb,
      '["Civilization''s non-material aspects","Civilization''s material aspects","Primary sources","Natural factors"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تصنيف الدليل: للجوانب المادية مثل المباني والأدوات، وللمعنوية مثل اللغة والقيم والعلوم والمعتقدات والفنون والنظم.',
    'The guide''s classification: material aspects like buildings and tools; non-material aspects like language, values, sciences, beliefs, arts and systems.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_concepts, null, 1.0,
      'كيف يصف الدليل الانتقال الحضاري بين الشعوب؟',
      'How does the guide describe civilizational transfer between peoples?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["تبادل وتأثير وتأثر وترجمة وتجارة وهجرة وصراع وتعاون لا خطًا بسيطًا باتجاه واحد","خط واحد من الشرق للغرب فقط","اقتباس بلا تغيير دائمًا","عزلة تامة بين الحضارات"]'::jsonb,
      '["Exchange, influence, translation, trade, migration, conflict and cooperation — not a simple one-way line","A single east-to-west line only","Pure unaltered borrowing","Total isolation between civilizations"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: الانتقال الحضاري ليس خطًا بسيطًا في اتجاه واحد؛ بل هو تبادل وتأثير وتأثر وترجمة وتجارة وهجرة وصراع وتعاون.',
    'The guide''s text: civilizational transfer is not a simple one-way line; it is exchange, influence, translation, trade, migration, conflict and cooperation.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l1 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_concepts, null, 1.0,
      'وفق الدليل، متى تبدأ العصور المعاصرة في بعض التصنيفات؟',
      'Per the guide, when do Contemporary eras begin in some classifications?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["بالثورة الفرنسية 1789م وتستمر إلى الحاضر","بظهور الكتابة","بسقوط القسطنطينية 1453م","باكتشاف الذهب"]'::jsonb,
      '["With the French Revolution of 1789, continuing to the present","With the appearance of writing","With Constantinople''s fall in 1453","With the discovery of gold"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تقسيم الدليل: تبدأ العصور المعاصرة في بعض التصنيفات بالثورة الفرنسية 1789م وتستمر إلى الحاضر؛ مع تنبيهه بأن الحدود اصطلاحات تنظيمية.',
    'The guide''s division: Contemporary begins with the French Revolution of 1789 in some classifications; boundaries are organizational conventions.'
  );

  -- ===== Lesson 2 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_sources, null, 0.9,
      'ما الأوستراكا كما يعرّفها الدليل؟',
      'What are ostraca as the guide defines them?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["شقفات فخار أو حجر استخدمت أحيانًا للكتابة","عملة معدنية قديمة","نوع من المعابد","خريطة نجمية"]'::jsonb,
      '["Pottery or stone chips sometimes used for writing","An ancient coin","A kind of temple","A star map"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تعريف الدليل حرفيًا: الأوستراكا شقفات فخار أو حجر استُخدمت أحيانًا للكتابة، وهي من المصادر الأولية.',
    'The guide''s literal definition: ostraca are pottery or stone chips sometimes used for writing — a primary source.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_sources, null, 1.0,
      'كتاب باحث معاصر يفسّر نقشًا ملكيًا قديمًا يعد:',
      'A modern scholar''s book interpreting an ancient royal inscription counts as:',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["مصدرًا ثانويًا","مصدرًا أوليًا","أوستراكا","نقشًا"]'::jsonb,
      '["A secondary source","A primary source","An ostracon","An inscription"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل: كتاب باحث معاصر يفسر النقش مصدر ثانوي، أما النقش نفسه فمصدر أولي قد يبالغ في النصر.',
    'The guide''s example: the modern interpretation is secondary; the inscription itself is primary though it may exaggerate victory.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_sources, null, 1.05,
      'نقش يوثق حملة ملكية يمدح الملك ويبرز نصره. أي معايير التقييم يجب تطبيقها أولًا وفق الدليل؟',
      'An inscription documents a royal campaign, praising the king and his victory. Which evaluation criteria apply first per the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الغرض والانحياز ثم المقارنة بمصادر مستقلة أخرى","لا يحتاج تقييمًا لأنه نقش أصلي","اللون والوزن فقط","عدد الكلمات فقط"]'::jsonb,
      '["Purpose and bias, then comparison with other independent sources","None; an original inscription needs no evaluation","Only colour and weight","Only word count"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'معايير الدليل: الغرض والجمهور، والانحياز (هل يمدح حاكمًا؟)، والمقارنة (هل تؤيد مصادر مستقلة أخرى المعلومة؟) — والأدق مقارنة النقش بمصادر أخرى والبحث في غرضه ولغته.',
    'The guide''s criteria: purpose and audience, bias (praising a ruler?), comparison (independent support?) — best practice compares the inscription with other sources and examines purpose and language.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l2 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_sources, null, 1.0,
      'كيف يتعامل الدليل مع الروايات الأدبية والأساطير كمصادر؟',
      'How does the guide treat literary works and myths as sources?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["قد تساعد على دراسة تصورات المجتمع لكنها لا تؤخذ تلقائيًا كوقائع حرفية","تقبل كوقائع حرفية دائمًا","ترفض كليًا ولا قيمة لها","تعادل النقوش الرسمية"]'::jsonb,
      '["They can help study a society''s perceptions but are not automatically literal fact","Always accepted as literal fact","Rejected entirely, valueless","Equivalent to official inscriptions"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: قد تشمل بعض الروايات الأدبية أو الأساطير مادة تساعد على دراسة تصورات المجتمع، لكنها لا تؤخذ تلقائيًا كوقائع حرفية.',
    'The guide''s text: some literary works or myths can help study society''s perceptions but are not automatically taken as literal fact.'
  );

  -- ===== Lesson 3 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_economy, null, 0.9,
      'أي العوامل الآتية عامل بشري في قيام الحضارات وفق الدليل؟',
      'Which of the following is a human factor in civilizations'' rise per the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["تكوين سلطة أو إدارة تنسق المشروعات العامة","التربة الخصبة","المناخ","الحدود الطبيعية"]'::jsonb,
      '["Forming authority or administration coordinating public projects","Fertile soil","Climate","Natural borders"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'عوامل الدليل البشرية تشمل: تنظيم العمل والري، وتكوين سلطة أو إدارة، ونقل المعرفة، والتجارة والتخصص، والكتابة والابتكار؛ والبقية عوامل طبيعية.',
    'The guide''s human factors include organizing labour/irrigation, forming administration, knowledge transfer, trade and specialisation, writing and innovation; the others are natural.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_economy, null, 1.0,
      'لماذا لا يصح القول إن النيل وحده هو الذي صنع الحضارة المصرية؟',
      'Why is it wrong to say the Nile alone created Egyptian civilization?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["لأن العمل والمعرفة والدولة عوامل لا تقل أهمية عن البيئة","لأن النيل لم يمر بمصر","لأن الحضارة المصرية أسطورية","لأن مصر بلا زراعة"]'::jsonb,
      '["Because work, knowledge and the state matter no less than the environment","Because the Nile never crossed Egypt","Because Egyptian civilization is mythical","Because Egypt had no farming"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية: لأن العمل والمعرفة والدولة عوامل لا تقل أهمية؛ فالمقولة لا تعني أن النهر وحده صنع الحضارة.',
    'The guide''s suggested answer: work, knowledge and the state matter no less; the saying does not mean the river alone made the civilization.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_economy, null, 1.0,
      'ما الذي وفرته الحدود الطبيعية لمصر وفق الدليل؟',
      'What did natural borders provide Egypt per the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["حماية نسبية مع بقاء الاتصال والحركة ممكنين","عزلة تامة عن العالم","منع التجارة نهائيًا","مياه الشرب فقط"]'::jsonb,
      '["Relative protection while contact and movement remained possible","Total isolation from the world","A final ban on trade","Only drinking water"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: الصحارى والبحار وبعض المناطق الوعرة وفرت حماية نسبية، مع بقاء الاتصال والحركة ممكنين.',
    'The guide''s text: deserts, seas and rough terrain offered relative protection while contact and movement remained possible.'
  );

  -- ===== Lesson 4 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_concepts, null, 0.9,
      'بمن ارتبط توحيد القطرين في الدليل؟',
      'With whom does the guide link the unification of the Two Lands?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الملك نعرمر المعروف في تقاليد كثيرة باسم مينا","الملك نخاو الثاني","الملك رمسيس الثاني فقط","الملكة حتشبسوت"]'::jsonb,
      '["King Narmer, known in many traditions as Menes","King Necho II","Only King Ramesses II","Queen Hatshepsut"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: ارتبط توحيد مصر العليا والسفلى بالملك نعرمر المعروف في تقاليد كثيرة باسم مينا، في بدايات التاريخ المصري الموحد.',
    'The guide''s text: unification of Upper and Lower Egypt is linked to King Narmer, known in many traditions as Menes, at the start of unified Egyptian history.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_concepts, null, 1.0,
      'بأي ميزة ترتبط الدولة القديمة شهرة في تقسيمات الدليل المدرسية؟',
      'What is the Old Kingdom famously tied to in the guide''s school divisions?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["مركزية السلطة والمشروعات الملكية الكبرى والأهرامات","اختراع الكتابة","الرحلة حول إفريقيا","بناء المكتبات"]'::jsonb,
      '["Centralized power, great royal projects and the pyramids","Inventing writing","The voyage around Africa","Building libraries"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تقسيم الدليل: الدولة القديمة مركزية السلطة والمشروعات الملكية الكبرى وارتباطها الشهير بالأهرامات.',
    'The guide''s division: the Old Kingdom — centralized power, great royal projects, famously tied to the pyramids.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_concepts, null, 1.05,
      'ما التحفظ الذي يوصي به الدليل عند حفظ أسماء الملوك والتواريخ؟',
      'What caution does the guide recommend when memorizing kings'' names and dates?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["تأكد من ترتيب الأسماء والتواريخ التفصيلية وفق الجدول الزمني في كتاب المدرسة","اعتمد الذاكرة فقط","استخدم أي موقع إنترنت","لا تدرس التواريخ إطلاقًا"]'::jsonb,
      '["Verify names and detailed dates against the school book''s timeline","Rely on memory only","Use any website","Skip dates entirely"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تنبيه الدليل الصريح: تأكد من ترتيب الأسماء والتواريخ التفصيلية وفق الجدول الزمني في كتابك المدرسي.',
    'The guide''s explicit caution: verify names and detailed dates against your school book''s timeline.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l4 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_concepts, null, 1.0,
      'أي ملوك الدولة الحديثة ذكرهم الدليل ضمن الملوك البارزين؟',
      'Which New Kingdom kings does the guide list among the prominent ones?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["أحمس وتحتمس الثالث وحتشبسوت وأخناتون وتوت عنخ آمون ورمسيس الثاني","نعرمر ومينا فقط","نخاو الثاني وحده","لا يذكر ملوكًا"]'::jsonb,
      '["Ahmose, Thutmose III, Hatshepsut, Akhenaten, Tutankhamun and Ramesses II","Only Narmer and Menes","Only Necho II","It lists no kings"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: في الدولة الحديثة برز ملوك مثل أحمس وتحتمس الثالث وحتشبسوت وأخناتون وتوت عنخ آمون ورمسيس الثاني مع اختلاف أدوارهم التاريخية.',
    'The guide''s text: in the New Kingdom kings like Ahmose, Thutmose III, Hatshepsut, Akhenaten, Tutankhamun and Ramesses II emerged with differing historical roles.'
  );

  -- ===== Lesson 5 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_economy, null, 0.9,
      'من المحاصيل المهمة في مصر القديمة وفق الدليل:',
      'Important crops in ancient Egypt per the guide include:',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["القمح والشعير والكتان","البطاطس والذرة الأمريكية","البن والكاكاو","الأرز الباسمتي حصرًا"]'::jsonb,
      '["Wheat, barley and flax","Potatoes and American maize","Coffee and cocoa","Only basmati rice"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: من المحاصيل المهمة الحبوب مثل القمح والشعير، إلى جانب الكتان ومحاصيل أخرى بحسب المنطقة والفترة.',
    'The guide''s text: key crops include grains like wheat and barley, plus flax and others depending on region and period.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_economy, null, 1.0,
      'أي الأنشطة الآتية من الأنشطة الحرفية والصناعية التي يسردها الدليل؟',
      'Which of the following is among the crafts and industries the guide lists?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["صناعة الفخار والنسيج من الكتان وبناء القوارب","استخراج النفط","صناعة السيارات","الطاعة الحاسوبية"]'::jsonb,
      '["Pottery, linen weaving and boat building","Oil extraction","Car manufacturing","Computer programming"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'حرف الدليل: الفخار، والنسيج من الكتان، والأدوات المعدنية، والأحجار، والحلي، وبناء القوارب، وتصنيع منتجات من البردي.',
    'The guide''s crafts: pottery, linen weaving, metal tools, stone work, jewellery, boat building, papyrus products.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_sources, null, 1.05,
      'كيف يوصي الدليل بالتعامل مع رحلة الدوران حول إفريقيا المنسوبة لعصر نخاو الثاني؟',
      'How does the guide advise treating the Africa circumnavigation attributed to Necho II''s era?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["تعامل مع التفاصيل كما يعرضها كتاب المدرسة لأن الروايات القديمة تحتاج نقدًا ومقارنة","اعتبرها حقيقة مطلقة بلا نقاش","ارفضها كليًا","اخترع تفاصيل إضافية"]'::jsonb,
      '["Treat details as the school book presents them; old accounts need criticism and comparison","Accept it as absolute fact","Reject it entirely","Invent extra details"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: تنسب المصادر القديمة الرحلة لعصر نخاو الثاني، وتعامل مع التفاصيل كما يعرضها كتاب المدرسة لأن الروايات التاريخية القديمة تحتاج إلى نقد ومقارنة.',
    'The guide''s text: ancient sources attribute the voyage to Necho II''s era; treat details as the school book presents them, since old historical accounts need criticism and comparison.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l5 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_economy, null, 1.0,
      'أي عبارة تصف دور الدولة في الاقتصاد وفق الدليل؟',
      'Which statement describes the state''s economic role per the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["تنظيم الري وجمع الضرائب وإدارة المخازن وتوفير العمالة وتأمين طرق النقل","إلغاء التجارة","منع الزراعة","التوقف عن التخزين"]'::jsonb,
      '["Organizing irrigation, collecting taxes, managing stores, supplying labour, securing transport routes","Abolishing trade","Banning farming","Ending storage"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: يمكن أن يشمل دور الدولة تنظيم الري وجمع الضرائب أو جزء من الإنتاج وإدارة المخازن وتوفير العمالة للمشروعات وتأمين طرق النقل وتنظيم بعض الحرف والتجارة، وتختلف التفاصيل من عصر إلى آخر.',
    'The guide''s text: the state''s role could include organizing irrigation, collecting taxes or production shares, managing stores, supplying project labour, securing routes and regulating some crafts/trade — details varying by era.'
  );

  -- ===== Unit boss questions =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_sources, null, 1.1,
      'تحدّي الوحدة (1): صنف بالترتيب — النقوش والبرديات والنقود ثم دراسة حديثة عنها:',
      'Unit challenge (1): Classify in order — inscriptions, papyri, coins, then a modern study about them:',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["أولية، أولية، أولية، ثم ثانوية","ثانوية، أولية، ثانوية، أولية","كلاها ثانوية","لا يمكن تصنيفها"]'::jsonb,
      '["Primary, primary, primary, then secondary","Secondary, primary, secondary, primary","All secondary","Unclassifiable"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية: من المصادر الأولية النقوش والبرديات والنقود، والدراسة الحديثة مصدر ثانوي.',
    'The guide''s suggested answer: inscriptions, papyri and coins are primary; the modern study is secondary.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_economy, null, 1.1,
      'تحدّي الوحدة (2): اشرح كيف تفاعلت العوامل الطبيعية والبشرية في قيام الحضارة المصرية كما يجيب الدليل.',
      'Unit challenge (2): Explain how natural and human factors interacted in Egyptian civilization, as the guide answers.',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["اجتمعت المياه والموقع والموارد مع تنظيم الإنسان وإدارته فتحولت البيئة إلى إنجاز حضاري","عملت العوامل الطبيعية وحدها","عمل العامل البشري وحده","لم يكن هناك تفاعل"]'::jsonb,
      '["Water, location and resources combined with human organization and administration, turning environment into achievement","Natural factors alone","Human factors alone","There was no interaction"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'إجابة الدليل الإرشادية حرفيًا: اجتمعت المياه والموقع والموارد مع تنظيم الإنسان وإدارته؛ فالمقولة «مصر هبة النيل» لا تعني النهر وحده.',
    'The guide''s suggested answer: water, location and resources joined human organization and administration; "the gift of the Nile" never meant the river alone.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_concepts, null, 1.15,
      'تحدّي الوحدة (3): عند دراسة خط زمني للتاريخ الفرعوني، أي منهج يجمع إرشادات الدليل؟',
      'Unit challenge (3): For a Pharaonic timeline, which approach combines the guide''s advice?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["رتّب المراحل زمنيًا واربط كل مرحلة بميزة واحدة وتحقق من التفاصيل من كتاب المدرسة","احفظ التواريخ من أي مصدر بلا مراجعة","اربط كل مرحلة بعشرة أحداث","امزج الأسر بالفترات الانتقالية"]'::jsonb,
      '["Order stages chronologically, attach one feature per stage, verify details from the school book","Memorize dates from any source unchecked","Attach ten events per stage","Mix dynasties with intermediate periods"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'طريقة الدليل: ابدأ بأسماء المراحل، ثم رتبها زمنيًا، ثم اربط كل مرحلة بميزة أو حدث واحد، ولا تخلط بين الأسرة والدولة الكبرى والفترة الانتقالية، وتأكد من التفاصيل من الجدول الزمني في كتابك.',
    'The guide''s method: start with stage names, order chronologically, attach one feature or event per stage, never confuse dynasty/state/intermediate period, and verify details from your book''s timeline.'
  );

end $$;
