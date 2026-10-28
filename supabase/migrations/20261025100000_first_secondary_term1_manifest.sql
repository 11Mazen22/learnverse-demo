-- Egyptian First Secondary Term 1 (2026-2027) Curriculum Manifest
-- Creates the curriculum course and its six subject units, replacing nothing.
-- Idempotent: safe to re-run; uses natural-key lookups (no hardcoded generated UUIDs).
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt
-- sha256: 2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28
-- The source is an original detailed study guide, NOT a verbatim official textbook;
-- that provenance and its caveats are preserved in metadata and must stay visible.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'primary', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'curriculum_context', jsonb_build_object(
      'country', 'Egypt',
      'grade_ar', 'الصف الأول الثانوي',
      'grade_en', 'First Secondary',
      'term', 1,
      'academic_year', '2026-2027'
    ),
    'provenance_ar', 'دليل مذاكرة أصلي ومفصّل يشرح الأفكار والقواعد ويقدّم أمثلة وأسئلة تدريبية، وليس نسخة حرفية من الكتب المدرسية. راجع الكتاب المدرسي مع هذه الملاحظات.',
    'provenance_en', 'An original detailed study guide that explains ideas and rules with examples and practice questions; it is not a verbatim copy of the official school textbooks. Use it alongside the school book.'
  );
begin
  select id into v_course_id
  from public.courses
  where slug = 'first-secondary-term1-2026-2027'
  limit 1;

  if v_course_id is null then
    insert into public.courses (slug, title_ar, title_en, description_ar, description_en, active, metadata)
    values (
      'first-secondary-term1-2026-2027',
      'الصف الأول الثانوي — الترم الأول 2026-2027',
      'First Secondary — Term 1 (2026-2027)',
      'منهج مصري متكامل للمذاكرة والمراجعة: فلسفة ومنطق، علوم متكاملة، رياضيات، لغة عربية، لغة إنجليزية، وتاريخ — مبنى على دليل مذاكرة أصلي مع تمارين ومراجعة مجدولة.',
      'A complete Egyptian First Secondary Term 1 curriculum: Philosophy & Logic, Integrated Science, Mathematics, Arabic, English, and History — built from an original study guide with practice and scheduled review.',
      true,
      v_prov
    )
    returning id into v_course_id;
  else
    update public.courses
    set title_ar = 'الصف الأول الثانوي — الترم الأول 2026-2027',
        title_en = 'First Secondary — Term 1 (2026-2027)',
        description_ar = 'منهج مصري متكامل للمذاكرة والمراجعة: فلسفة ومنطق، علوم متكاملة، رياضيات، لغة عربية، لغة إنجليزية، وتاريخ — مبنى على دليل مذاكرة أصلي مع تمارين ومراجعة مجدولة.',
        description_en = 'A complete Egyptian First Secondary Term 1 curriculum: Philosophy & Logic, Integrated Science, Mathematics, Arabic, English, and History — built from an original study guide with practice and scheduled review.',
        active = true,
        metadata = v_prov
    where id = v_course_id;
  end if;

  -- Unit 1: Philosophy & Logic (4 official lessons + one clearly non-official review module)
  select id into v_unit_id from public.units where course_id = v_course_id and position = 1 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 1,
      'الفلسفة والمنطق', 'Philosophy & Logic', true,
      'التفكير الإنساني وأساليبه، الفلسفة والموقف الفلسفي، مبادئ المنطق (الحدود والقضايا)، والاستدلال — أربعة دروس رسمية، ثم مراجعة إضافية ليست درسًا رسميًا.',
      'Human thinking and its styles, philosophy and the philosophical stance, principles of logic (terms and propositions), and inference — four official lessons plus one additional review module that is not an official lesson.',
      v_prov || jsonb_build_object('subject', 'philosophy-logic', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'الفلسفة والمنطق', title_en = 'Philosophy & Logic', boss_enabled = true,
        description_ar = 'التفكير الإنساني وأساليبه، الفلسفة والموقف الفلسفي، مبادئ المنطق (الحدود والقضايا)، والاستدلال — أربعة دروس رسمية، ثم مراجعة إضافية ليست درسًا رسميًا.',
        description_en = 'Human thinking and its styles, philosophy and the philosophical stance, principles of logic (terms and propositions), and inference — four official lessons plus one additional review module that is not an official lesson.',
        metadata = v_prov || jsonb_build_object('subject', 'philosophy-logic', 'locked', false)
    where id = v_unit_id;
  end if;

  -- Unit 2: Integrated Science
  select id into v_unit_id from public.units where course_id = v_course_id and position = 2 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 2,
      'العلوم المتكاملة', 'Integrated Science', true,
      'الغلاف المائي على الأرض، الخصائص الكيميائية والفيزيائية للماء، المحاليل المائية وخواصها، والأهمية الحيوية للماء.',
      'The hydrosphere on Earth, chemical and physical properties of water, aqueous solutions and their properties, and the biological importance of water.',
      v_prov || jsonb_build_object('subject', 'integrated-science', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'العلوم المتكاملة', title_en = 'Integrated Science', boss_enabled = true,
        description_ar = 'الغلاف المائي على الأرض، الخصائص الكيميائية والفيزيائية للماء، المحاليل المائية وخواصها، والأهمية الحيوية للماء.',
        description_en = 'The hydrosphere on Earth, chemical and physical properties of water, aqueous solutions and their properties, and the biological importance of water.',
        metadata = v_prov || jsonb_build_object('subject', 'integrated-science', 'locked', false)
    where id = v_unit_id;
  end if;

  -- Unit 3: Mathematics
  select id into v_unit_id from public.units where course_id = v_course_id and position = 3 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 3,
      'الرياضيات', 'Mathematics', true,
      'مدخل إلى الأعداد المركبة، تحديد نوع جذور المعادلة التربيعية، العلاقة بين الجذرين والمعاملات، إشارة الدالة التربيعية، والمتباينات التربيعية.',
      'Introduction to complex numbers, nature of quadratic roots, relations between roots and coefficients, sign of a quadratic function, and quadratic inequalities.',
      v_prov || jsonb_build_object('subject', 'mathematics', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'الرياضيات', title_en = 'Mathematics', boss_enabled = true,
        description_ar = 'مدخل إلى الأعداد المركبة، تحديد نوع جذور المعادلة التربيعية، العلاقة بين الجذرين والمعاملات، إشارة الدالة التربيعية، والمتباينات التربيعية.',
        description_en = 'Introduction to complex numbers, nature of quadratic roots, relations between roots and coefficients, sign of a quadratic function, and quadratic inequalities.',
        metadata = v_prov || jsonb_build_object('subject', 'mathematics', 'locked', false)
    where id = v_unit_id;
  end if;

  -- Unit 4: Arabic Language (5 readings + 5 grammar lessons + story study)
  select id into v_unit_id from public.units where course_id = v_course_id and position = 4 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 4,
      'اللغة العربية', 'Arabic Language', true,
      'أول خمسة نصوص قرائية وأدبية، وأول خمسة دروس من قواعد النحو والصرف، ثم ملخص دراسي لأجزاء قصة «أبو الفوارس: عنترة بن شداد» الأربعة.',
      'The first five reading and literature texts, the first five grammar and morphology lessons, then a study summary of the four parts of the story Abu al-Fawaris: Antara ibn Shaddad.',
      v_prov || jsonb_build_object('subject', 'arabic', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'اللغة العربية', title_en = 'Arabic Language', boss_enabled = true,
        description_ar = 'أول خمسة نصوص قرائية وأدبية، وأول خمسة دروس من قواعد النحو والصرف، ثم ملخص دراسي لأجزاء قصة «أبو الفوارس: عنترة بن شداد» الأربعة.',
        description_en = 'The first five reading and literature texts, the first five grammar and morphology lessons, then a study summary of the four parts of the story Abu al-Fawaris: Antara ibn Shaddad.',
        metadata = v_prov || jsonb_build_object('subject', 'arabic', 'locked', false)
    where id = v_unit_id;
  end if;

  -- Unit 5: English
  select id into v_unit_id from public.units where course_id = v_course_id and position = 5 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 5,
      'اللغة الإنجليزية', 'English', true,
      'أول خمس وحدات: تراث مصر، التطوع والمساعدة، الحقيقة والأكاذيب، الحفاظ على البيئة، والتكنولوجيا في المدارس — مفردات وقواعد وكتابة.',
      'The first five units: Egypt''s heritage, helping hands, truth vs lies, saving the environment, and technology at schools — vocabulary, grammar, and writing.',
      v_prov || jsonb_build_object('subject', 'english', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'اللغة الإنجليزية', title_en = 'English', boss_enabled = true,
        description_ar = 'أول خمس وحدات: تراث مصر، التطوع والمساعدة، الحقيقة والأكاذيب، الحفاظ على البيئة، والتكنولوجيا في المدارس — مفردات وقواعد وكتابة.',
        description_en = 'The first five units: Egypt''s heritage, helping hands, truth vs lies, saving the environment, and technology at schools — vocabulary, grammar, and writing.',
        metadata = v_prov || jsonb_build_object('subject', 'english', 'locked', false)
    where id = v_unit_id;
  end if;

  -- Unit 6: History
  select id into v_unit_id from public.units where course_id = v_course_id and position = 6 limit 1;
  if v_unit_id is null then
    insert into public.units (course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata)
    values (
      v_course_id, 6,
      'التاريخ — مصر الحضارة والعالم القديم', 'History — Egypt, Civilization and the Ancient World', true,
      'الحضارة والتاريخ، مصادر دراسة الحضارات، عوامل قيام الحضارات، ملامح من تاريخ مصر القديمة، والحياة الاقتصادية في مصر القديمة.',
      'Civilization and history, sources for studying civilizations, factors behind the rise of civilizations, features of ancient Egyptian history, and the economy of ancient Egypt.',
      v_prov || jsonb_build_object('subject', 'history', 'locked', false)
    );
  else
    update public.units
    set title_ar = 'التاريخ — مصر الحضارة والعالم القديم', title_en = 'History — Egypt, Civilization and the Ancient World', boss_enabled = true,
        description_ar = 'الحضارة والتاريخ، مصادر دراسة الحضارات، عوامل قيام الحضارات، ملامح من تاريخ مصر القديمة، والحياة الاقتصادية في مصر القديمة.',
        description_en = 'Civilization and history, sources for studying civilizations, factors behind the rise of civilizations, features of ancient Egyptian history, and the economy of ancient Egypt.',
        metadata = v_prov || jsonb_build_object('subject', 'history', 'locked', false)
    where id = v_unit_id;
  end if;

end $$;
