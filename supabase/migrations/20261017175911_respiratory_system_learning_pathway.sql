-- Respiratory System Learning Pathway (Unit 3 in demo-science-v1)
-- Repeatable, idempotent curriculum migration using natural-key lookups (no hardcoded generated UUIDs).
-- Grounded in standard human physiology (OpenStax Anatomy & Physiology Ch. 22; Guyton & Hall Physiology).
-- Explicitly marked as original educational demonstration content (not an official Ministry syllabus or clinical guidance).

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_airway uuid;
  v_skill_exchange uuid;
  v_skill_mechanics uuid;
  v_l1 uuid;
  v_l2 uuid;
  v_l3 uuid;
  v_l4 uuid;
  v_l5 uuid;
  v_l6 uuid;
  v_l7 uuid;
  v_q1 uuid;
  v_q2 uuid;
  v_q3 uuid;
  v_vq1 uuid;
  v_vq2 uuid;
  v_vq3 uuid;
  v_prov jsonb := jsonb_build_object(
    'demo', true,
    'pathway', 'respiratory-system-v1',
    'sources', jsonb_build_array(
      'OpenStax Anatomy and Physiology 2e, Chapter 22: The Respiratory System',
      'Guyton and Hall Textbook of Medical Physiology, Unit VII: Respiration'
    ),
    'provenance', 'Original educational demonstration content grounded in standard physiology references. Not aligned to an official Ministry syllabus and not clinical medical advice.'
  );
begin
  -- Ensure Motion Lesson 1 primary stage 1 question is published_demo if previously retired in staging QA
  update public.questions q
  set publication_status = 'published_demo'
  from public.lessons l
  where q.lesson_id = l.id
    and l.slug = 'motion-basics'
    and q.position = 1
    and q.variant_of is null
    and q.publication_status = 'retired';

  select id into v_course_id
  from public.courses
  where slug = 'demo-science-v1'
  limit 1;

  if v_course_id is null then
    raise exception 'Active course demo-science-v1 not found';
  end if;

  -- 1. Upsert the 3 Respiratory Skills
  select id into v_skill_airway
  from public.skills
  where course_id = v_course_id and slug = 'respiratory-airway-anatomy'
  limit 1;

  if v_skill_airway is null then
    insert into public.skills (course_id, slug, title_ar, title_en)
    values (
      v_course_id,
      'respiratory-airway-anatomy',
      'تتبّع مسار الهواء وأعضاء الجهاز التنفسي',
      'Trace the airway and respiratory organs'
    )
    returning id into v_skill_airway;
  else
    update public.skills
    set title_ar = 'تتبّع مسار الهواء وأعضاء الجهاز التنفسي',
        title_en = 'Trace the airway and respiratory organs'
    where id = v_skill_airway;
  end if;

  select id into v_skill_exchange
  from public.skills
  where course_id = v_course_id and slug = 'alveolar-gas-exchange'
  limit 1;

  if v_skill_exchange is null then
    insert into public.skills (course_id, slug, title_ar, title_en)
    values (
      v_course_id,
      'alveolar-gas-exchange',
      'تحليل التبادل الغازي في الحويصلات الهوائية والدورة الدموية',
      'Analyze alveolar gas exchange and circulation'
    )
    returning id into v_skill_exchange;
  else
    update public.skills
    set title_ar = 'تحليل التبادل الغازي في الحويصلات الهوائية والدورة الدموية',
        title_en = 'Analyze alveolar gas exchange and circulation'
    where id = v_skill_exchange;
  end if;

  select id into v_skill_mechanics
  from public.skills
  where course_id = v_course_id and slug = 'breathing-mechanics-and-health'
  limit 1;

  if v_skill_mechanics is null then
    insert into public.skills (course_id, slug, title_ar, title_en)
    values (
      v_course_id,
      'breathing-mechanics-and-health',
      'تفسير ميكانيكا التنفس وصحة الجهاز التنفسي',
      'Explain breathing mechanics and respiratory health'
    )
    returning id into v_skill_mechanics;
  else
    update public.skills
    set title_ar = 'تفسير ميكانيكا التنفس وصحة الجهاز التنفسي',
        title_en = 'Explain breathing mechanics and respiratory health'
    where id = v_skill_mechanics;
  end if;

  -- 2. Upsert Unit 3: The Respiratory System and Gas Exchange
  select id into v_unit_id
  from public.units
  where course_id = v_course_id and position = 3
  limit 1;

  if v_unit_id is null then
    insert into public.units (
      course_id, position, title_ar, title_en, boss_enabled, description_ar, description_en, metadata
    )
    values (
      v_course_id,
      3,
      'الجهاز التنفسي وتبادل الغازات',
      'The Respiratory System and Gas Exchange',
      true,
      'استكشف مسار الهواء من الأنف إلى الحويصلات الهوائية، وميكانيكا الشهيق والزفير، وتبادل الأكسجين وثاني أكسيد الكربون مع الدورة الدموية.',
      'Explore the pathway of air from the nasal cavity to the alveoli, breathing mechanics, and oxygen/carbon dioxide exchange with blood circulation.',
      v_prov || jsonb_build_object('locked', false)
    )
    returning id into v_unit_id;
  else
    update public.units
    set title_ar = 'الجهاز التنفسي وتبادل الغازات',
        title_en = 'The Respiratory System and Gas Exchange',
        boss_enabled = true,
        description_ar = 'استكشف مسار الهواء من الأنف إلى الحويصلات الهوائية، وميكانيكا الشهيق والزفير، وتبادل الأكسجين وثاني أكسيد الكربون مع الدورة الدموية.',
        description_en = 'Explore the pathway of air from the nasal cavity to the alveoli, breathing mechanics, and oxygen/carbon dioxide exchange with blood circulation.',
        metadata = v_prov || jsonb_build_object('locked', false)
    where id = v_unit_id;
  end if;

  -- 3. Upsert Lesson 1: Introduction to the Respiratory System
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'respiratory-intro' limit 1;
  if v_l1 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 1, 'respiratory-intro',
      'مقدمة الجهاز التنفسي والغاية من تبادل الغازات',
      'Introduction to the Respiratory System and Gas Exchange',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 7,
        'summary_ar', 'يحتاج جسم الإنسان إلى الأكسجين (Oxygen - O₂) لإنتاج الطاقة الخلوية (ATP) عبر عملية التنفس الخلوي (Cellular Respiration)، وينتج عن ذلك غاز ثاني أكسيد الكربون (Carbon Dioxide - CO₂) كفضلات أيضية يجب طرحها. يعمل الجهاز التنفسي بالتكامل مع الجهاز الدوري لتأمين دخول O₂ إلى الدم والتخلص من CO₂ باستمرار.',
        'summary_en', 'Human cells require oxygen (O₂) to generate ATP through cellular respiration, producing carbon dioxide (CO₂) as a metabolic waste product. The respiratory system partners with the circulatory system to supply O₂ and eliminate CO₂ continuously.',
        'worked_ar', 'مثال محلول: في حالة الراحة، يتنفس الشخص البالغ نحو 12 نفسًا في الدقيقة، ويدخل في كل نفس حوالي 500 ملليلتر من الهواء (الحجم الجاري Tidal Volume). حجم التهوية الرئوية في الدقيقة = 12 × 500 = 6000 ملليلتر (أي 6 لترات في الدقيقة).',
        'worked_en', 'Worked example: At rest, an adult breathes about 12 times per minute with a tidal volume of 500 mL per breath. Minute ventilation = 12 × 500 mL = 6,000 mL (6 L/min).',
        'objectives_ar', jsonb_build_array('التمييز بين التهوية الرئوية والتنفس الخلوي', 'تحديد دور الأكسجين O₂ وثاني أكسيد الكربون CO₂ في أيض الخلايا', 'حساب حجم التهوية الرئوية في الدقيقة'),
        'objectives_en', jsonb_build_array('Distinguish pulmonary ventilation from cellular respiration', 'Identify the roles of O₂ and CO₂ in cellular metabolism', 'Calculate minute ventilation from breathing rate and tidal volume')
      )
    ) returning id into v_l1;
  else
    update public.lessons
    set position = 1,
        title_ar = 'مقدمة الجهاز التنفسي والغاية من تبادل الغازات',
        title_en = 'Introduction to the Respiratory System and Gas Exchange',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 7,
          'summary_ar', 'يحتاج جسم الإنسان إلى الأكسجين (Oxygen - O₂) لإنتاج الطاقة الخلوية (ATP) عبر عملية التنفس الخلوي (Cellular Respiration)، وينتج عن ذلك غاز ثاني أكسيد الكربون (Carbon Dioxide - CO₂) كفضلات أيضية يجب طرحها. يعمل الجهاز التنفسي بالتكامل مع الجهاز الدوري لتأمين دخول O₂ إلى الدم والتخلص من CO₂ باستمرار.',
          'summary_en', 'Human cells require oxygen (O₂) to generate ATP through cellular respiration, producing carbon dioxide (CO₂) as a metabolic waste product. The respiratory system partners with the circulatory system to supply O₂ and eliminate CO₂ continuously.',
          'worked_ar', 'مثال محلول: في حالة الراحة، يتنفس الشخص البالغ نحو 12 نفسًا في الدقيقة، ويدخل في كل نفس حوالي 500 ملليلتر من الهواء (الحجم الجاري Tidal Volume). حجم التهوية الرئوية في الدقيقة = 12 × 500 = 6000 ملليلتر (أي 6 لترات في الدقيقة).',
          'worked_en', 'Worked example: At rest, an adult breathes about 12 times per minute with a tidal volume of 500 mL per breath. Minute ventilation = 12 × 500 mL = 6,000 mL (6 L/min).',
          'objectives_ar', jsonb_build_array('التمييز بين التهوية الرئوية والتنفس الخلوي', 'تحديد دور الأكسجين O₂ وثاني أكسيد الكربون CO₂ في أيض الخلايا', 'حساب حجم التهوية الرئوية في الدقيقة'),
          'objectives_en', jsonb_build_array('Distinguish pulmonary ventilation from cellular respiration', 'Identify the roles of O₂ and CO₂ in cellular metabolism', 'Calculate minute ventilation from breathing rate and tidal volume')
        )
    where id = v_l1;
  end if;

  -- 4. Upsert Lesson 2: Respiratory Organs and Airway Path (prerequisite: v_l1)
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'respiratory-airway-path' limit 1;
  if v_l2 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 2, 'respiratory-airway-path',
      'أعضاء الجهاز التنفسي ومسار الهواء',
      'Respiratory Organs and the Pathway of Air',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 8,
        'prerequisite_lesson_id', v_l1::text,
        'summary_ar', 'يمر الهواء المستنشق عبر مسار منظم يبدأ بالتجويف الأنفي (Nasal Cavity) حيث يُدفأ الهواء ويُرطّب ويُنقى بواسطة الشعيرات والمخاط والأهداب، ثم البلعوم (Pharynx)، فالحنجرة (Larynx) المحمية بلسان المزمار (Epiglottis) لمنع دخول الطعام أثناء البلع، ثم القصبة الهوائية (Trachea) المدعومة بحلقات غضروفية غير مكتملة على شكل حرف C، والتي تتفرع إلى شعبتين هوائيتين (Bronchi) ثم شعيبات دقيقة (Bronchioles) داخل الرئتين.',
        'summary_en', 'Inhaled air follows an ordered pathway: the nasal cavity (warming, humidifying, and filtering air), pharynx, larynx (protected by the epiglottis during swallowing), trachea (reinforced by C-shaped cartilage rings), primary bronchi, and branching bronchioles within the lungs.',
        'worked_ar', 'مثال محلول: تتفرع القصبة الهوائية المفردة (1) إلى شعبتين رئيسيتين (2)، وعند انقسام كل شعبة إلى فرعين في الجيل التالي يتكون 2 × 2 = 4 فروع، ما يوزع تيار الهواء بانتظام على فصوص الرئتين.',
        'worked_en', 'Worked example: The single trachea (1) divides into 2 primary bronchi; when each divides into 2 branches at the next generation, 2 × 2 = 4 branches form, distributing airflow across the lung lobes.',
        'objectives_ar', jsonb_build_array('ترتيب أعضاء المسار التنفسي من الأنف إلى الشعيبات', 'تفسير وظيفة الحلقات الغضروفية ولسان المزمار', 'تعليل أفضلية التنفس عبر الأنف على التنفس الفموي'),
        'objectives_en', jsonb_build_array('Order the conducting airway structures from nasal cavity to bronchioles', 'Explain the function of tracheal cartilage rings and the epiglottis', 'Explain why nasal breathing conditions air more effectively than mouth breathing')
      )
    ) returning id into v_l2;
  else
    update public.lessons
    set position = 2,
        title_ar = 'أعضاء الجهاز التنفسي ومسار الهواء',
        title_en = 'Respiratory Organs and the Pathway of Air',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 8,
          'prerequisite_lesson_id', v_l1::text,
          'summary_ar', 'يمر الهواء المستنشق عبر مسار منظم يبدأ بالتجويف الأنفي (Nasal Cavity) حيث يُدفأ الهواء ويُرطّب ويُنقى بواسطة الشعيرات والمخاط والأهداب، ثم البلعوم (Pharynx)، فالحنجرة (Larynx) المحمية بلسان المزمار (Epiglottis) لمنع دخول الطعام أثناء البلع، ثم القصبة الهوائية (Trachea) المدعومة بحلقات غضروفية غير مكتملة على شكل حرف C، والتي تتفرع إلى شعبتين هوائيتين (Bronchi) ثم شعيبات دقيقة (Bronchioles) داخل الرئتين.',
          'summary_en', 'Inhaled air follows an ordered pathway: the nasal cavity (warming, humidifying, and filtering air), pharynx, larynx (protected by the epiglottis during swallowing), trachea (reinforced by C-shaped cartilage rings), primary bronchi, and branching bronchioles within the lungs.',
          'worked_ar', 'مثال محلول: تتفرع القصبة الهوائية المفردة (1) إلى شعبتين رئيسيتين (2)، وعند انقسام كل شعبة إلى فرعين في الجيل التالي يتكون 2 × 2 = 4 فروع، ما يوزع تيار الهواء بانتظام على فصوص الرئتين.',
          'worked_en', 'Worked example: The single trachea (1) divides into 2 primary bronchi; when each divides into 2 branches at the next generation, 2 × 2 = 4 branches form, distributing airflow across the lung lobes.',
          'objectives_ar', jsonb_build_array('ترتيب أعضاء المسار التنفسي من الأنف إلى الشعيبات', 'تفسير وظيفة الحلقات الغضروفية ولسان المزمار', 'تعليل أفضلية التنفس عبر الأنف على التنفس الفموي'),
          'objectives_en', jsonb_build_array('Order the conducting airway structures from nasal cavity to bronchioles', 'Explain the function of tracheal cartilage rings and the epiglottis', 'Explain why nasal breathing conditions air more effectively than mouth breathing')
        )
    where id = v_l2;
  end if;

  -- 5. Upsert Lesson 3: The Lungs and Alveoli (prerequisite: v_l2)
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'lungs-and-alveoli' limit 1;
  if v_l3 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 3, 'lungs-and-alveoli',
      'الرئتان والحويصلات الهوائية: بنية التبادل الغازي',
      'The Lungs and Alveoli: Architecture of Gas Exchange',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 8,
        'prerequisite_lesson_id', v_l2::text,
        'summary_ar', 'تنتهي الشعيبات التنفسية بملايين الأكياس الهوائية المجهرية المسماة الحويصلات الهوائية (Alveoli). تحقق الحويصلات كفاءة عالية في تبادل الغازات وفق قانون فيك للانتشار (Fick''s Law) بفضل ثلاث خصائص بنيوية: مساحة سطحية إجمالية هائلة، وجدران رقيقة جدًا من طبقة خلوية واحدة (حوالي 0.5 ميكرومتر)، وشبكة كثيفة من الشعيرات الدموية، بالإضافة إلى مادة الفاعل بالسطح الرئوي (Surfactant) التي تقلل التوتر السطحي وتمنع انخماص الحويصلات.',
        'summary_en', 'Respiratory bronchioles end in millions of microscopic air sacs called alveoli. Alveoli maximize gas diffusion according to Fick''s Law through three structural adaptations: an immense total surface area, ultra-thin single-cell walls (~0.5 µm), and a dense capillary network, supported by pulmonary surfactant that reduces surface tension and prevents alveolar collapse.',
        'worked_ar', 'مثال محلول: إذا احتوت منطقة صغيرة من نسيج رئوي على 400 حويصلة هوائية، وكانت المساحة السطحية المتوسطة للحويصلة الواحدة 0.25 مليمتر مربع، فإن المساحة الكلية لهذه المجموعة = 400 × 0.25 = 100 مليمتر مربع.',
        'worked_en', 'Worked example: If a small lung tissue sample contains 400 alveoli with an average surface area of 0.25 mm² per alveolus, their combined surface area is 400 × 0.25 = 100 mm².',
        'objectives_ar', jsonb_build_array('تحديد التكيفات البنيوية للحويصلات الهوائية لتعزيز الانتشار', 'توضيح وظيفة الفاعل بالسطح الرئوي Surfactant', 'حساب المساحة السطحية الإجمالية لمجموعة من الحويصلات'),
        'objectives_en', jsonb_build_array('Identify the structural adaptations of alveoli that maximize gas diffusion', 'Explain the role of pulmonary surfactant', 'Calculate combined alveolar surface area')
      )
    ) returning id into v_l3;
  else
    update public.lessons
    set position = 3,
        title_ar = 'الرئتان والحويصلات الهوائية: بنية التبادل الغازي',
        title_en = 'The Lungs and Alveoli: Architecture of Gas Exchange',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 8,
          'prerequisite_lesson_id', v_l2::text,
          'summary_ar', 'تنتهي الشعيبات التنفسية بملايين الأكياس الهوائية المجهرية المسماة الحويصلات الهوائية (Alveoli). تحقق الحويصلات كفاءة عالية في تبادل الغازات وفق قانون فيك للانتشار (Fick''s Law) بفضل ثلاث خصائص بنيوية: مساحة سطحية إجمالية هائلة، وجدران رقيقة جدًا من طبقة خلوية واحدة (حوالي 0.5 ميكرومتر)، وشبكة كثيفة من الشعيرات الدموية، بالإضافة إلى مادة الفاعل بالسطح الرئوي (Surfactant) التي تقلل التوتر السطحي وتمنع انخماص الحويصلات.',
          'summary_en', 'Respiratory bronchioles end in millions of microscopic air sacs called alveoli. Alveoli maximize gas diffusion according to Fick''s Law through three structural adaptations: an immense total surface area, ultra-thin single-cell walls (~0.5 µm), and a dense capillary network, supported by pulmonary surfactant that reduces surface tension and prevents alveolar collapse.',
          'worked_ar', 'مثال محلول: إذا احتوت منطقة صغيرة من نسيج رئوي على 400 حويصلة هوائية، وكانت المساحة السطحية المتوسطة للحويصلة الواحدة 0.25 مليمتر مربع، فإن المساحة الكلية لهذه المجموعة = 400 × 0.25 = 100 مليمتر مربع.',
          'worked_en', 'Worked example: If a small lung tissue sample contains 400 alveoli with an average surface area of 0.25 mm² per alveolus, their combined surface area is 400 × 0.25 = 100 mm².',
          'objectives_ar', jsonb_build_array('تحديد التكيفات البنيوية للحويصلات الهوائية لتعزيز الانتشار', 'توضيح وظيفة الفاعل بالسطح الرئوي Surfactant', 'حساب المساحة السطحية الإجمالية لمجموعة من الحويصلات'),
          'objectives_en', jsonb_build_array('Identify the structural adaptations of alveoli that maximize gas diffusion', 'Explain the role of pulmonary surfactant', 'Calculate combined alveolar surface area')
        )
    where id = v_l3;
  end if;

  -- 6. Upsert Lesson 4: Breathing Mechanics (prerequisite: v_l3)
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'breathing-mechanics' limit 1;
  if v_l4 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 4, 'breathing-mechanics',
      'ميكانيكا التنفس: الحجاب الحاجز والشهيق والزفير',
      'Breathing Mechanics: Diaphragm, Inhalation, and Exhalation',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 8,
        'prerequisite_lesson_id', v_l3::text,
        'summary_ar', 'تخضع التهوية الرئوية لقانون بويل (Boyle''s Law: يتناسب ضغط الغاز عكسيًا مع حجمه عند ثبات الحرارة). أثناء الشهيق (Inhalation)، ينقبض الحجاب الحاجز (Diaphragm) فيتحرك لأسفل وتنقبض العضلات بين الضلعية الخارجية لرفع الأضلاع، فيزداد حجم التجويف الصدري وينخفض الضغط داخل الحويصلات دون الضغط الجوي فيندفع الهواء إلى الرئتين. وفي الزفير الهادئ (Exhalation)، تنبسط العضلات فيقل حجم الصدر ويرتفع الضغط داخل الرئتين فيخرج الهواء.',
        'summary_en', 'Pulmonary ventilation is governed by Boyle''s Law (gas pressure is inversely proportional to volume at constant temperature). During inhalation, the diaphragm contracts downward and external intercostal muscles elevate the ribs, expanding thoracic volume and lowering intra-alveolar pressure below atmospheric pressure so air flows in. During quiet exhalation, muscle relaxation reduces volume and raises alveolar pressure to expel air.',
        'worked_ar', 'مثال محلول: إذا كان الضغط الجوي عند مستوى سطح البحر 760 ملم زئبق (mmHg)، وانخفض الضغط داخل الحويصلات أثناء الشهيق إلى 757 ملم زئبق، فإن فرق الضغط الدافع لدخول الهواء = 760 − 757 = 3 ملم زئبق.',
        'worked_en', 'Worked example: If atmospheric pressure at sea level is 760 mmHg and intra-alveolar pressure drops to 757 mmHg during inhalation, the pressure gradient driving air into the lungs is 760 − 757 = 3 mmHg.',
        'objectives_ar', jsonb_build_array('ربط حركة الحجاب الحاجز والقفص الصدري بتغيرات الحجم والضغط', 'المقارنة بين آليتي الشهيق والزفير الهادئ', 'حساب فرق الضغط الدافع لحركة الهواء'),
        'objectives_en', jsonb_build_array('Relate diaphragm and rib-cage movement to thoracic volume and pressure changes', 'Compare active inhalation with passive quiet exhalation', 'Calculate the trans-airway pressure gradient driving airflow')
      )
    ) returning id into v_l4;
  else
    update public.lessons
    set position = 4,
        title_ar = 'ميكانيكا التنفس: الحجاب الحاجز والشهيق والزفير',
        title_en = 'Breathing Mechanics: Diaphragm, Inhalation, and Exhalation',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 8,
          'prerequisite_lesson_id', v_l3::text,
          'summary_ar', 'تخضع التهوية الرئوية لقانون بويل (Boyle''s Law: يتناسب ضغط الغاز عكسيًا مع حجمه عند ثبات الحرارة). أثناء الشهيق (Inhalation)، ينقبض الحجاب الحاجز (Diaphragm) فيتحرك لأسفل وتنقبض العضلات بين الضلعية الخارجية لرفع الأضلاع، فيزداد حجم التجويف الصدري وينخفض الضغط داخل الحويصلات دون الضغط الجوي فيندفع الهواء إلى الرئتين. وفي الزفير الهادئ (Exhalation)، تنبسط العضلات فيقل حجم الصدر ويرتفع الضغط داخل الرئتين فيخرج الهواء.',
          'summary_en', 'Pulmonary ventilation is governed by Boyle''s Law (gas pressure is inversely proportional to volume at constant temperature). During inhalation, the diaphragm contracts downward and external intercostal muscles elevate the ribs, expanding thoracic volume and lowering intra-alveolar pressure below atmospheric pressure so air flows in. During quiet exhalation, muscle relaxation reduces volume and raises alveolar pressure to expel air.',
          'worked_ar', 'مثال محلول: إذا كان الضغط الجوي عند مستوى سطح البحر 760 ملم زئبق (mmHg)، وانخفض الضغط داخل الحويصلات أثناء الشهيق إلى 757 ملم زئبق، فإن فرق الضغط الدافع لدخول الهواء = 760 − 757 = 3 ملم زئبق.',
          'worked_en', 'Worked example: If atmospheric pressure at sea level is 760 mmHg and intra-alveolar pressure drops to 757 mmHg during inhalation, the pressure gradient driving air into the lungs is 760 − 757 = 3 mmHg.',
          'objectives_ar', jsonb_build_array('ربط حركة الحجاب الحاجز والقفص الصدري بتغيرات الحجم والضغط', 'المقارنة بين آليتي الشهيق والزفير الهادئ', 'حساب فرق الضغط الدافع لحركة الهواء'),
          'objectives_en', jsonb_build_array('Relate diaphragm and rib-cage movement to thoracic volume and pressure changes', 'Compare active inhalation with passive quiet exhalation', 'Calculate the trans-airway pressure gradient driving airflow')
        )
    where id = v_l4;
  end if;

  -- 7. Upsert Lesson 5: Gas Exchange and Circulation (prerequisite: v_l4)
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'gas-exchange-and-circulation' limit 1;
  if v_l5 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 5, 'gas-exchange-and-circulation',
      'تبادل الغازات والدورة الدموية الصغرى',
      'Gas Exchange and Pulmonary Circulation',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 9,
        'prerequisite_lesson_id', v_l4::text,
        'summary_ar', 'ينتقل الأكسجين وثاني أكسيد الكربون عبر الغشاء الحويصلي الشعيري بالانتشار البسيط تبعًا لفرق الضغط الجزئي (Partial Pressure Gradient). يصل الدم غير المؤكسج عبر الشريان الرئوي بضغط جزئي للأكسجين (PO₂ ≈ 40 mmHg) بينما يكون في هواء الحويصلات (PO₂ ≈ 104 mmHg)، فينتشر O₂ إلى الدم ويرتبط معظمه بالهيموغلوبين (Hemoglobin) داخل خلايا الدم الحمراء لتكوين الأوكسيهيموغلوبين، ثم يعود الدم المؤكسج عبر الأوردة الرئوية إلى الأذين الأيسر للقلب.',
        'summary_en', 'Oxygen and carbon dioxide cross the alveolar-capillary membrane by simple diffusion down their partial-pressure gradients. Deoxygenated blood arrives via the pulmonary artery with PO₂ ≈ 40 mmHg while alveolar air has PO₂ ≈ 104 mmHg; O₂ diffuses into blood, binds mainly to hemoglobin in red blood cells, and returns via the pulmonary veins to the left atrium.',
        'worked_ar', 'مثال محلول: عندما يكون الضغط الجزئي للأكسجين في الحويصلات الهوائية 104 ملم زئبق وفي الدم الوريدي الوارد للشعيرات الرئوية 40 ملم زئبق، فإن فرق الضغط الجزئي الدافع لانتشار الأكسجين نحو الدم = 104 − 40 = 64 ملم زئبق.',
        'worked_en', 'Worked example: When alveolar PO₂ is 104 mmHg and incoming pulmonary capillary blood PO₂ is 40 mmHg, the partial-pressure gradient driving O₂ diffusion into the blood is 104 − 40 = 64 mmHg.',
        'objectives_ar', jsonb_build_array('تفسير انتقال الغازات وفق فروق الضغط الجزئي PO₂ وPCO₂', 'توضيح دور الهيموغلوبين والأوردة والشرايين الرئوية', 'حساب فرق الضغط الجزئي عبر الغشاء الحويصلي الشعيري'),
        'objectives_en', jsonb_build_array('Explain gas diffusion using PO₂ and PCO₂ partial-pressure gradients', 'Describe the roles of hemoglobin, pulmonary arteries, and pulmonary veins', 'Calculate partial-pressure gradients across the alveolar-capillary membrane')
      )
    ) returning id into v_l5;
  else
    update public.lessons
    set position = 5,
        title_ar = 'تبادل الغازات والدورة الدموية الصغرى',
        title_en = 'Gas Exchange and Pulmonary Circulation',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 9,
          'prerequisite_lesson_id', v_l4::text,
          'summary_ar', 'ينتقل الأكسجين وثاني أكسيد الكربون عبر الغشاء الحويصلي الشعيري بالانتشار البسيط تبعًا لفرق الضغط الجزئي (Partial Pressure Gradient). يصل الدم غير المؤكسج عبر الشريان الرئوي بضغط جزئي للأكسجين (PO₂ ≈ 40 mmHg) بينما يكون في هواء الحويصلات (PO₂ ≈ 104 mmHg)، فينتشر O₂ إلى الدم ويرتبط معظمه بالهيموغلوبين (Hemoglobin) داخل خلايا الدم الحمراء لتكوين الأوكسيهيموغلوبين، ثم يعود الدم المؤكسج عبر الأوردة الرئوية إلى الأذين الأيسر للقلب.',
          'summary_en', 'Oxygen and carbon dioxide cross the alveolar-capillary membrane by simple diffusion down their partial-pressure gradients. Deoxygenated blood arrives via the pulmonary artery with PO₂ ≈ 40 mmHg while alveolar air has PO₂ ≈ 104 mmHg; O₂ diffuses into blood, binds mainly to hemoglobin in red blood cells, and returns via the pulmonary veins to the left atrium.',
          'worked_ar', 'مثال محلول: عندما يكون الضغط الجزئي للأكسجين في الحويصلات الهوائية 104 ملم زئبق وفي الدم الوريدي الوارد للشعيرات الرئوية 40 ملم زئبق، فإن فرق الضغط الجزئي الدافع لانتشار الأكسجين نحو الدم = 104 − 40 = 64 ملم زئبق.',
          'worked_en', 'Worked example: When alveolar PO₂ is 104 mmHg and incoming pulmonary capillary blood PO₂ is 40 mmHg, the partial-pressure gradient driving O₂ diffusion into the blood is 104 − 40 = 64 mmHg.',
          'objectives_ar', jsonb_build_array('تفسير انتقال الغازات وفق فروق الضغط الجزئي PO₂ وPCO₂', 'توضيح دور الهيموغلوبين والأوردة والشرايين الرئوية', 'حساب فرق الضغط الجزئي عبر الغشاء الحويصلي الشعيري'),
          'objectives_en', jsonb_build_array('Explain gas diffusion using PO₂ and PCO₂ partial-pressure gradients', 'Describe the roles of hemoglobin, pulmonary arteries, and pulmonary veins', 'Calculate partial-pressure gradients across the alveolar-capillary membrane')
        )
    where id = v_l5;
  end if;

  -- 8. Upsert Lesson 6: Respiratory Health (prerequisite: v_l5)
  select id into v_l6 from public.lessons where unit_id = v_unit_id and slug = 'respiratory-health' limit 1;
  if v_l6 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 6, 'respiratory-health',
      'صحة الجهاز التنفسي والعوامل المؤثرة في كفاءته',
      'Respiratory Health and Factors Affecting Efficiency',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 8,
        'prerequisite_lesson_id', v_l5::text,
        'summary_ar', 'تعتمد وقاية الجهاز التنفسي على كفاءة المصعد المخاطي الهدبي (Mucociliary Escalator) ونقاء الهواء المستنشق. يؤدي التعرض لدخان التبغ والملوثات الدقيقة إلى إضعاف حركة الأهداب، وتراكم المخاط، وتلف جدران الحويصلات الهوائية. كما يرتبط غاز أول أكسيد الكربون (CO) بالهيموغلوبين بألفة تفوق الأكسجين بنحو 200 مرة، ما يعيق نقل O₂ إلى الأنسجة. ويسهم النشاط البدني الهوائي والتهوية النظيفة في الحفاظ على السعة الحيوية للرئتين (Vital Capacity).',
        'summary_en', 'Respiratory protection relies on the mucociliary escalator and clean air. Exposure to tobacco smoke and fine particulate pollution impairs ciliary motion, increases mucus accumulation, and damages alveolar walls. Carbon monoxide (CO) binds hemoglobin with ~200× greater affinity than O₂, impairing oxygen delivery. Regular aerobic activity and clean air support lung vital capacity.',
        'worked_ar', 'مثال محلول: تُحسب السعة الحيوية للرئة (Vital Capacity) بجمع الحجم الجاري (500 مل) + الحجم الاحتياطي الشهيقي (2500 مل) + الحجم الاحتياطي الزفيري (1000 مل) = 4000 ملليلتر (4 لترات).',
        'worked_en', 'Worked example: Vital capacity equals tidal volume (500 mL) + inspiratory reserve volume (2,500 mL) + expiratory reserve volume (1,000 mL) = 4,000 mL (4 L).',
        'objectives_ar', jsonb_build_array('توضيح آلية عمل المصعد المخاطي الهدبي في حماية الرئتين', 'تحليل أثر الملوثات وأول أكسيد الكربون على نقل الأكسجين', 'حساب السعة الحيوية للرئة من حجوم التنفس'),
        'objectives_en', jsonb_build_array('Explain how the mucociliary escalator protects the airways', 'Analyze how pollutants and carbon monoxide impair oxygen transport', 'Calculate vital capacity from respiratory volumes')
      )
    ) returning id into v_l6;
  else
    update public.lessons
    set position = 6,
        title_ar = 'صحة الجهاز التنفسي والعوامل المؤثرة في كفاءته',
        title_en = 'Respiratory Health and Factors Affecting Efficiency',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 8,
          'prerequisite_lesson_id', v_l5::text,
          'summary_ar', 'تعتمد وقاية الجهاز التنفسي على كفاءة المصعد المخاطي الهدبي (Mucociliary Escalator) ونقاء الهواء المستنشق. يؤدي التعرض لدخان التبغ والملوثات الدقيقة إلى إضعاف حركة الأهداب، وتراكم المخاط، وتلف جدران الحويصلات الهوائية. كما يرتبط غاز أول أكسيد الكربون (CO) بالهيموغلوبين بألفة تفوق الأكسجين بنحو 200 مرة، ما يعيق نقل O₂ إلى الأنسجة. ويسهم النشاط البدني الهوائي والتهوية النظيفة في الحفاظ على السعة الحيوية للرئتين (Vital Capacity).',
          'summary_en', 'Respiratory protection relies on the mucociliary escalator and clean air. Exposure to tobacco smoke and fine particulate pollution impairs ciliary motion, increases mucus accumulation, and damages alveolar walls. Carbon monoxide (CO) binds hemoglobin with ~200× greater affinity than O₂, impairing oxygen delivery. Regular aerobic activity and clean air support lung vital capacity.',
          'worked_ar', 'مثال محلول: تُحسب السعة الحيوية للرئة (Vital Capacity) بجمع الحجم الجاري (500 مل) + الحجم الاحتياطي الشهيقي (2500 مل) + الحجم الاحتياطي الزفيري (1000 مل) = 4000 ملليلتر (4 لترات).',
          'worked_en', 'Worked example: Vital capacity equals tidal volume (500 mL) + inspiratory reserve volume (2,500 mL) + expiratory reserve volume (1,000 mL) = 4,000 mL (4 L).',
          'objectives_ar', jsonb_build_array('توضيح آلية عمل المصعد المخاطي الهدبي في حماية الرئتين', 'تحليل أثر الملوثات وأول أكسيد الكربون على نقل الأكسجين', 'حساب السعة الحيوية للرئة من حجوم التنفس'),
          'objectives_en', jsonb_build_array('Explain how the mucociliary escalator protects the airways', 'Analyze how pollutants and carbon monoxide impair oxygen transport', 'Calculate vital capacity from respiratory volumes')
        )
    where id = v_l6;
  end if;

  -- 9. Upsert Lesson 7: Integrated Review and Application (prerequisite: v_l6)
  select id into v_l7 from public.lessons where unit_id = v_unit_id and slug = 'respiratory-integrated-review' limit 1;
  if v_l7 is null then
    insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
    values (
      v_unit_id, 7, 'respiratory-integrated-review',
      'مراجعة وتكامل: من الشهيق إلى التنفس الخلوي',
      'Integrated Review: From Inhalation to Cellular Respiration',
      15, 25,
      v_prov || jsonb_build_object(
        'duration_minutes', 10,
        'prerequisite_lesson_id', v_l6::text,
        'summary_ar', 'يتكامل عمل الجهاز التنفسي في سلسلة مترابطة: التغير الميكانيكي في حجم الصدر يولد فرق ضغط يدفع الهواء عبر الممرات التوصيلية (قانون بويل)، بينما يبقى جزء من الهواء في الحيز الميت التشريحي (Anatomical Dead Space ≈ 150 mL) ولا يشارك في التبادل. أما الهواء الفعلي الواصل للحويصلات فيتبادل الغازات عبر غشاء رقيق ذي مساحة واسعة (قانون فيك) لينتقل O₂ مع الهيموغلوبين عبر الدورة الدموية إلى الميتوكوندريا في الخلايا.',
        'summary_en', 'Respiratory function integrates mechanics, diffusion, and circulation: thoracic volume expansion creates a pressure gradient driving airflow (Boyle''s Law), while ~150 mL remains in the conducting anatomical dead space. Fresh air reaching the alveoli exchanges gases across a vast, thin membrane (Fick''s Law) so hemoglobin delivers O₂ through the circulation to cellular mitochondria.',
        'worked_ar', 'مثال محلول: إذا كان الحجم الجاري في النفس الواحد 500 ملليلتر، وكان الحيز الميت التشريحي 150 ملليلتر، فإن حجم الهواء النقي الواصل فعليًا إلى الحويصلات في كل نفس = 500 − 150 = 350 ملليلتر.',
        'worked_en', 'Worked example: If tidal volume is 500 mL and anatomical dead space is 150 mL, the effective fresh air reaching the alveoli per breath is 500 − 150 = 350 mL.',
        'objectives_ar', jsonb_build_array('الربط بين قوانين الضغط والانتشار ونقل الغازات في الدم', 'التمييز بين التهوية الكلية والتهوية الحويصلية الفعالة', 'تحليل استجابة الجهازين التنفسي والدوري معًا للتغيرات الفسيولوجية'),
        'objectives_en', jsonb_build_array('Connect pressure mechanics, alveolar diffusion, and blood gas transport', 'Distinguish total minute ventilation from effective alveolar ventilation', 'Analyze coordinated cardiopulmonary responses to physiological demand')
      )
    ) returning id into v_l7;
  else
    update public.lessons
    set position = 7,
        title_ar = 'مراجعة وتكامل: من الشهيق إلى التنفس الخلوي',
        title_en = 'Integrated Review: From Inhalation to Cellular Respiration',
        xp_reward = 15, coin_reward = 25,
        content = v_prov || jsonb_build_object(
          'duration_minutes', 10,
          'prerequisite_lesson_id', v_l6::text,
          'summary_ar', 'يتكامل عمل الجهاز التنفسي في سلسلة مترابطة: التغير الميكانيكي في حجم الصدر يولد فرق ضغط يدفع الهواء عبر الممرات التوصيلية (قانون بويل)، بينما يبقى جزء من الهواء في الحيز الميت التشريحي (Anatomical Dead Space ≈ 150 mL) ولا يشارك في التبادل. أما الهواء الفعلي الواصل للحويصلات فيتبادل الغازات عبر غشاء رقيق ذي مساحة واسعة (قانون فيك) لينتقل O₂ مع الهيموغلوبين عبر الدورة الدموية إلى الميتوكوندريا في الخلايا.',
          'summary_en', 'Respiratory function integrates mechanics, diffusion, and circulation: thoracic volume expansion creates a pressure gradient driving airflow (Boyle''s Law), while ~150 mL remains in the conducting anatomical dead space. Fresh air reaching the alveoli exchanges gases across a vast, thin membrane (Fick''s Law) so hemoglobin delivers O₂ through the circulation to cellular mitochondria.',
          'worked_ar', 'مثال محلول: إذا كان الحجم الجاري في النفس الواحد 500 ملليلتر، وكان الحيز الميت التشريحي 150 ملليلتر، فإن حجم الهواء النقي الواصل فعليًا إلى الحويصلات في كل نفس = 500 − 150 = 350 ملليلتر.',
          'worked_en', 'Worked example: If tidal volume is 500 mL and anatomical dead space is 150 mL, the effective fresh air reaching the alveoli per breath is 500 − 150 = 350 mL.',
          'objectives_ar', jsonb_build_array('الربط بين قوانين الضغط والانتشار ونقل الغازات في الدم', 'التمييز بين التهوية الكلية والتهوية الحويصلية الفعالة', 'تحليل استجابة الجهازين التنفسي والدوري معًا للتغيرات الفسيولوجية'),
          'objectives_en', jsonb_build_array('Connect pressure mechanics, alveolar diffusion, and blood gas transport', 'Distinguish total minute ventilation from effective alveolar ventilation', 'Analyze coordinated cardiopulmonary responses to physiological demand')
        )
    where id = v_l7;
  end if;

  -- =========================================================================
  -- LESSON 1 QUESTIONS (v_l1)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_exchange, null, 0.9,
      'ما الوظيفة الأساسية للجهاز التنفسي في جسم الإنسان؟',
      'What is the primary function of the human respiratory system?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["هضم المركبات الغذائية المعقدة","تزويد الجسم بالأكسجين O₂ وطرح ثاني أكسيد الكربون CO₂","ضخ الدم مباشرة في الشرايين","ترشيح الفضلات النيتروجينية السائلة"]'::jsonb,
      '["Digesting complex nutrients","Supplying oxygen (O₂) and removing carbon dioxide (CO₂)","Pumping blood directly into arteries","Filtering liquid nitrogenous waste"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يوفر الجهاز التنفسي الأكسجين اللازم للتنفس الخلوي ويخلص الجسم من غاز ثاني أكسيد الكربون.',
    'The respiratory system supplies oxygen for cellular respiration and removes carbon dioxide waste.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l1 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_exchange, v_q1, 0.9,
      'أي غاز تستهلكه الميتوكوندريا داخل خلايا الجسم لإنتاج الطاقة (ATP)؟',
      'Which gas is consumed by mitochondria inside body cells to produce ATP energy?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["النيتروجين N₂","الأكسجين O₂","ثاني أكسيد الكربون CO₂","الأرغون Ar"]'::jsonb,
      '["Nitrogen (N₂)","Oxygen (O₂)","Carbon dioxide (CO₂)","Argon (Ar)"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'تستخدم الخلايا الأكسجين O₂ في عملية التنفس الخلوي الهوائي لإنتاج الطاقة.',
    'Cells consume oxygen (O₂) during aerobic cellular respiration to generate ATP.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_mechanics, null, 1.0,
      'إذا كان معدل التنفس 12 نفسًا في الدقيقة والحجم الجاري 0.5 لتر لكل نفس، فكم يبلغ حجم التهوية في الدقيقة (باللتر)؟',
      'If the breathing rate is 12 breaths/min and tidal volume is 0.5 L per breath, what is the minute ventilation in liters?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"لتر/دقيقة","unit_en":"L/min"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":6,"tolerance":0.01}'::jsonb,
    'حجم التهوية في الدقيقة = 12 × 0.5 = 6 لترات/دقيقة.',
    'Minute ventilation = 12 breaths/min × 0.5 L = 6 L/min.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l1 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_mechanics, v_q2, 1.0,
      'إذا تنفس شخص 14 نفسًا في الدقيقة بحجم جارٍ قدره 0.5 لتر لكل نفس، فكم لترًا من الهواء يتنفس في الدقيقة؟',
      'If a person takes 14 breaths/min with a tidal volume of 0.5 L per breath, what is the minute ventilation in liters?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"لتر/دقيقة","unit_en":"L/min"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":7,"tolerance":0.01}'::jsonb,
    'حجم التهوية في الدقيقة = 14 × 0.5 = 7 لترات/دقيقة.',
    'Minute ventilation = 14 × 0.5 = 7 L/min.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_exchange, null, 1.08,
      'لماذا يزداد معدل وعمق التنفس تلقائيًا أثناء الجري أو المجهود العضلي؟',
      'Why do breathing rate and depth automatically increase during running or muscular exertion?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لتقليل تدفق الدم إلى العضلات","لتلبية استهلاك الأكسجين المتزايد وطرح ثاني أكسيد الكربون الناتج عن العضلات","لإيقاف عملية التنفس الخلوي مؤقتًا","لخفض درجة حرارة المعدة"]'::jsonb,
      '["To reduce blood flow to muscles","To meet increased oxygen demand and clear extra carbon dioxide produced by muscles","To pause cellular respiration temporarily","To cool the stomach"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'أثناء المجهود تستهلك العضلات أضعاف حاجتها من O₂ وتنتج CO₂ أكثر، فتستجيب مراكز التنفس بزيادة التهوية.',
    'During exercise, active muscles consume more O₂ and generate more CO₂, prompting respiratory centers to increase ventilation.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l1 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_exchange, v_q3, 1.08,
      'ما النتيجة الفسيولوجية المباشرة لتراكم غاز ثاني أكسيد الكربون CO₂ في الدم عند ضعف التهوية؟',
      'What is the direct physiological consequence of carbon dioxide (CO₂) accumulation in the blood when ventilation is impaired?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["زيادة قلوية الدم بشكل حاد","ارتفاع حموضة الدم وتحفيز مراكز التنفس لزيادة التهوية","تحول ثاني أكسيد الكربون إلى أكسجين","توقف القلب عن ضخ الدم المؤكسج فورًا"]'::jsonb,
      '["Sharp increase in blood alkalinity","Increased blood acidity and stimulation of respiratory centers to increase ventilation","Conversion of CO₂ into oxygen","Immediate cessation of cardiac output"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يتفاعل CO₂ مع الماء مكونًا حمض الكربونيك فيزيد حموضة الدم وينبه المستقبلات الكيميائية لزيادة التنفس.',
    'CO₂ reacts with water to form carbonic acid, lowering blood pH and stimulating chemoreceptors to increase breathing.'
  );

  -- =========================================================================
  -- LESSON 2 QUESTIONS (v_l2)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, null, 0.9,
      'ما الترتيب التشريحي الصحيح لمسار الهواء أثناء الشهيق؟',
      'What is the correct anatomical sequence of airflow during inhalation?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["التجويف الأنفي ← البلعوم ← الحنجرة ← القصبة الهوائية ← الشعبتان الهوائيتان ← الشعيبات","التجويف الأنفي ← القصبة الهوائية ← البلعوم ← الحنجرة ← الشعيبات","البلعوم ← الحنجرة ← التجويف الأنفي ← الشعبتان ← القصبة الهوائية","الحنجرة ← البلعوم ← الشعيبات ← القصبة الهوائية ← الأنف"]'::jsonb,
      '["Nasal cavity → Pharynx → Larynx → Trachea → Bronchi → Bronchioles","Nasal cavity → Trachea → Pharynx → Larynx → Bronchioles","Pharynx → Larynx → Nasal cavity → Bronchi → Trachea","Larynx → Pharynx → Bronchioles → Trachea → Nose"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يعبر الهواء من الأنف إلى البلعوم ثم الحنجرة فالقصبة الهوائية، ومنها إلى الشعبتين الهوائيتين ثم الشعيبات.',
    'Air passes from the nasal cavity to the pharynx, larynx, trachea, bronchi, and finally the bronchioles.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l2 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, v_q1, 0.9,
      'ما التركيب الذي يغلق مدخل الحنجرة أثناء البلع لمنع دخول الطعام إلى القصبة الهوائية؟',
      'Which structure covers the laryngeal opening during swallowing to prevent food from entering the trachea?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["الحجاب الحاجز","لسان المزمار (Epiglottis)","الحويصلة الهوائية","الشعيبة التنفسية"]'::jsonb,
      '["Diaphragm","Epiglottis","Alveolus","Respiratory bronchiole"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يعمل لسان المزمار كصمام غضروفي يغلق الحنجرة لحظة البلع فيوجه الطعام نحو المريء.',
    'The epiglottis acts as a cartilaginous flap that closes over the larynx during swallowing.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, null, 1.0,
      'ما أهمية الحلقات الغضروفية غير المكتملة (على شكل حرف C) في جدار القصبة الهوائية؟',
      'What is the function of the C-shaped cartilage rings in the wall of the trachea?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["إغلاق القصبة الهوائية أثناء النوم","إبقاء المجرى الهوائي مفتوحًا باستمرار مع السماح للمريء بالتمدد خلفها أثناء البلع","امتصاص الأكسجين مباشرة إلى الدم","إفراز إنزيمات هاضمة"]'::jsonb,
      '["Closing the trachea during sleep","Keeping the airway open while allowing the esophagus behind it to expand during swallowing","Absorbing oxygen directly into the blood","Secreting digestive enzymes"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'تدعم الحلقات الغضروفية جدار القصبة الهوائية فلا ينغلق عند انخفاض الضغط، بينما يسمح الجزء الخلفي العضلي بتمدد المريء.',
    'C-shaped cartilage rings prevent tracheal collapse during pressure changes while the posterior muscular wall accommodates esophageal expansion.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l2 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, v_q2, 1.0,
      'لماذا يُعد استنشاق الهواء عبر الأنف أفضل فسيولوجيًا من استنشاقه عبر الفم؟',
      'Why is inhaling through the nose physiologically preferable to inhaling through the mouth?',
      'approved', 'published_demo', 102, 'multiple-choice',
      '["لأن الأنف يستهلك الأكسجين قبل وصوله للرئة","لأن التجويف الأنفي يدفئ الهواء ويرطبه وينقيه من الغبار والميكروبات","لأن هواء الفم لا يصل إلى القصبة الهوائية","لأن الأنف يمنع خروج ثاني أكسيد الكربون"]'::jsonb,
      '["Because the nose consumes oxygen before it reaches the lungs","Because the nasal cavity warms, humidifies, and filters inhaled air","Because mouth air does not reach the trachea","Because the nose blocks carbon dioxide exhalation"]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'تعمل الشعيرات الدموية والمخاط والأهداب في الأنف على تدفئة الهواء وترطيبه وتنقيته قبل دخوله للرئتين.',
    'Rich nasal capillaries, mucus, and cilia warm, humidify, and filter air before it reaches delicate lung tissue.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, null, 1.08,
      'تخلو الشعيبات الهوائية الدقيقة (Bronchioles) من الغضاريف وتحيط بها عضلات ملساء. ماذا يحدث عند انقباض هذه العضلات الملساء؟',
      'Bronchioles lack cartilage and are surrounded by smooth muscle. What happens when this smooth muscle contracts?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["يتسع قطر الشعيبات وتقل مقاومة الهواء","يضيق قطر الشعيبات وتزداد مقاومة تدفق الهواء نحو الحويصلات","يتحول الهواء تلقائيًا إلى سائل","تتوقف الدورة الدموية في الجسم"]'::jsonb,
      '["Bronchiole diameter widens and airway resistance drops","Bronchiole diameter narrows and resistance to airflow into the alveoli increases","Air automatically turns into liquid","Systemic blood circulation stops"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'انقباض العضلات الملساء المحيطة بالشعيبات (تضيق القصيبات) يقلل نصف قطرها فيزيد مقاومة مرور الهواء.',
    'Contraction of bronchiolar smooth muscle (bronchoconstriction) narrows the lumen and increases airway resistance.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l2 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_airway, v_q3, 1.08,
      'ماذا يحدث عندما تتسع الشعيبات الهوائية (Bronchodilation) استجابةً للجهاز العصبي الودي أثناء النشاط البدني؟',
      'What happens when bronchioles dilate (bronchodilation) in response to sympathetic nervous stimulation during exercise?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["تقل مقاومة المجرى الهوائي ويسهل تدفق حجم أكبر من الهواء إلى الحويصلات","تزداد مقاومة مرور الهواء في القصبة الهوائية","تغلق الحنجرة تمامًا","ينعكس اتجاه حركة الأهداب"]'::jsonb,
      '["Airway resistance decreases, allowing greater airflow to reach the alveoli","Airway resistance increases in the trachea","The larynx closes completely","Ciliary beating reverses direction"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'اتساع الشعيبات يقلل مقاومة المجرى التنفسي فيسمح بتدفق الهواء بكفاءة أعلى أثناء المجهود.',
    'Bronchodilation widens the bronchiolar lumen, reducing resistance and facilitating higher airflow during exertion.'
  );

  -- =========================================================================
  -- LESSON 3 QUESTIONS (v_l3)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, null, 0.9,
      'أين يتم التبادل الفعلي للغازات بين الهواء والدم داخل الرئتين؟',
      'Where does actual gas exchange between air and blood take place inside the lungs?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["في القصبة الهوائية","في الحويصلات الهوائية (Alveoli) المحاطة بالشعيرات الدموية","في الحنجرة والبلعوم","في الغشاء الجنبي"]'::jsonb,
      '["In the trachea","In the alveoli surrounded by pulmonary capillaries","In the larynx and pharynx","In the pleural membrane"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'الحويصلات الهوائية هي الأكياس المجهرية ذات الجدران الرقيقة جدًا التي يتم عبرها تبادل O₂ وCO₂ مع دم الشعيرات.',
    'Alveoli are the thin-walled microscopic air sacs where O₂ and CO₂ diffuse across the capillary membrane.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l3 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, v_q1, 0.9,
      'ما وظيفة مادة الفاعل بالسطح الرئوي (Surfactant) التي تفرزها خلايا الحويصلات الهوائية؟',
      'What is the function of pulmonary surfactant secreted by alveolar cells?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["زيادة سماكة جدار الحويصلة","تقليل التوتر السطحي للسائل المبطن للحويصلات ومنع انخماصها","نقل ثاني أكسيد الكربون داخل العظام","تصلب الغضاريف الهوائية"]'::jsonb,
      '["Increasing alveolar wall thickness","Reducing surface tension in the alveolar fluid lining and preventing collapse","Transporting CO₂ inside bones","Hardening airway cartilage"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يقلل الفاعل بالسطح الرئوي التوتر السطحي لجزيئات الماء على جدار الحويصلة فيحميها من الانغلاق أثناء الزفير.',
    'Pulmonary surfactant lowers surface tension at the air-liquid interface, preventing alveolar collapse during exhalation.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, null, 1.0,
      'إذا احتوى فصيص رئوي صغير على 400 حويصلة هوائية، وكانت مساحة سطح الحويصلة الواحدة 0.25 مليمتر مربع، فكم تبلغ المساحة الكلية بالمليمتر المربع؟',
      'If a small pulmonary lobule contains 400 alveoli and each alveolus has a surface area of 0.25 mm², what is their total surface area in mm²?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"مم²","unit_en":"mm²"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":100,"tolerance":0.01}'::jsonb,
    'المساحة الكلية = 400 × 0.25 = 100 مليمتر مربع.',
    'Total surface area = 400 × 0.25 mm² = 100 mm².'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l3 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, v_q2, 1.0,
      'إذا ضمت منطقة رئوية 600 حويصلة هوائية بمساحة متوسطة 0.25 مليمتر مربع لكل حويصلة، فكم تبلغ مساحتها الإجمالية بالمليمتر المربع؟',
      'If a lung region contains 600 alveoli with an average area of 0.25 mm² each, what is the combined surface area in mm²?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"مم²","unit_en":"mm²"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":150,"tolerance":0.01}'::jsonb,
    'المساحة الإجمالية = 600 × 0.25 = 150 مليمتر مربع.',
    'Combined surface area = 600 × 0.25 mm² = 150 mm².'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, null, 1.08,
      'وفق قانون فيك للانتشار، كيف يؤثر ازدياد سماكة الغشاء الحويصلي الشعيري (بسبب تجمع السوائل أو التليف) على معدل تبادل الأكسجين؟',
      'According to Fick''s law of diffusion, how does thickening of the alveolar-capillary membrane affect the rate of oxygen exchange?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["يزداد معدل انتشار الأكسجين إلى الضعف","ينخفض معدل انتشار الأكسجين بسبب زيادة مسافة الانتشار عبر الغشاء","لا يتأثر انتشار الأكسجين إطلاقًا","يتحول الأكسجين إلى نيتروجين"]'::jsonb,
      '["The rate of oxygen diffusion doubles","The rate of oxygen diffusion decreases because the diffusion distance increases","Oxygen diffusion is completely unaffected","Oxygen turns into nitrogen"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يتناسب معدل الانتشار عكسيًا مع سماكة الغشاء؛ لذلك فإن أي زيادة في سماكة الحاجز تبطئ انتقال الأكسجين إلى الدم.',
    'Diffusion rate is inversely proportional to membrane thickness; thickening slows oxygen transfer into the blood.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l3 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_exchange, v_q3, 1.08,
      'لماذا يؤدي تكسر الجدران الفاصلة بين الحويصلات الهوائية إلى صعوبة تزويد الدم بالأكسجين رغم دخول الهواء للرئتين؟',
      'Why does the destruction of walls between alveoli impair blood oxygenation even when air still enters the lungs?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["لأنه يقلل المساحة السطحية الإجمالية المتاحة لانتشار الغازات بين الهواء والشعيرات الدموية","لأنه يزيد عدد الشعيرات الدموية الفعالة","لأنه يضاعف إنتاج الفاعل بالسطح الرئوي","لأنه يغلق فتحتي الأنف"]'::jsonb,
      '["Because it reduces the total surface area available for gas diffusion between air and capillaries","Because it increases the number of functional capillaries","Because it doubles surfactant production","Because it closes the nostrils"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'اندماج الحويصلات وتلف جدرانها يقلص المساحة السطحية الفعالة للتبادل الغازي بدرجة كبيرة.',
    'Loss of alveolar walls drastically reduces the surface area available for gas diffusion.'
  );

  -- =========================================================================
  -- LESSON 4 QUESTIONS (v_l4)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, null, 0.9,
      'ماذا يحدث لعضلة الحجاب الحاجز وحجم التجويف الصدري أثناء عملية الشهيق؟',
      'What happens to the diaphragm and thoracic cavity volume during inhalation?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["ينقبض الحجاب الحاجز ويهبط لأسفل فيزداد حجم التجويف الصدري وينخفض الضغط داخله","ينبسط الحجاب الحاجز ويرتفع لأعلى فيقل حجم الصدر","يبقى الحجاب الحاجز ثابتًا ويرتفع الضغط داخل الحويصلات","تنقبض عضلات البطن لدفع الحجاب الحاجز لأعلى"]'::jsonb,
      '["The diaphragm contracts and moves downward, increasing thoracic volume and lowering internal pressure","The diaphragm relaxes and moves upward, decreasing thoracic volume","The diaphragm remains fixed while alveolar pressure rises","Abdominal muscles contract to push the diaphragm upward"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'انقباض الحجاب الحاجز وهبوطه لأسفل يوسع التجويف الصدري، فينخفض الضغط داخل الرئتين دون الضغط الجوي ويدخل الهواء.',
    'Diaphragm contraction flattens the dome downward, expanding thoracic volume and reducing alveolar pressure below atmospheric pressure.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l4 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, v_q1, 0.9,
      'كيف تتم عملية الزفير الهادئ في حالة الراحة؟',
      'How does quiet exhalation occur at rest?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["ينبسط الحجاب الحاجز ويرتفع لأعلى فيقل حجم التجويف الصدري ويرتفع الضغط داخل الرئتين فيخرج الهواء","ينقبض الحجاب الحاجز بقوة لأسفل","ينخفض الضغط داخل الحويصلات إلى ما دون الضغط الجوي","تتوقف الرئتان عن الارتداد المرن"]'::jsonb,
      '["The diaphragm relaxes upward, decreasing thoracic volume and raising alveolar pressure so air flows out","The diaphragm contracts strongly downward","Intra-alveolar pressure drops below atmospheric pressure","Lung elastic recoil stops"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'في الزفير الهادئ يرتخي الحجاب الحاجز والعضلات بين الضلعية ويعود النسيج الرئوي المرن لحجمه، فيرتفع الضغط ويخرج الهواء.',
    'Quiet exhalation is a passive process driven by muscle relaxation and elastic recoil of the lungs, which decreases volume and raises alveolar pressure.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, null, 1.0,
      'إذا كان الضغط الجوي 760 ملم زئبق وانخفض الضغط داخل الحويصلات أثناء الشهيق إلى 757 ملم زئبق، فكم يبلغ مقدار فرق الضغط الدافع لدخول الهواء (بالملم زئبق)؟',
      'If atmospheric pressure is 760 mmHg and intra-alveolar pressure drops to 757 mmHg during inhalation, what is the magnitude of the pressure gradient driving air inward (in mmHg)?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"ملم زئبق","unit_en":"mmHg"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":3,"tolerance":0.01}'::jsonb,
    'فرق الضغط = 760 − 757 = 3 ملم زئبق.',
    'Pressure gradient = 760 − 757 = 3 mmHg.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l4 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, v_q2, 1.0,
      'أثناء الزفير ارتفع الضغط داخل الحويصلات إلى 764 ملم زئبق بينما الضغط الجوي 760 ملم زئبق. ما مقدار فرق الضغط الدافع لخروج الهواء (بالملم زئبق)؟',
      'During exhalation, intra-alveolar pressure rises to 764 mmHg while atmospheric pressure is 760 mmHg. What is the magnitude of the pressure gradient driving air outward (in mmHg)?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"ملم زئبق","unit_en":"mmHg"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":4,"tolerance":0.01}'::jsonb,
    'فرق الضغط = 764 − 760 = 4 ملم زئبق.',
    'Pressure gradient = 764 − 760 = 4 mmHg.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, null, 1.08,
      'لماذا يتوقف تدفق الهواء لحظيًا عند نهاية الشهيق مباشرة قبل بدء الزفير؟',
      'Why does airflow momentarily stop at the exact end of inhalation just before exhalation begins?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن القصبة الهوائية تنغلق تمامًا","لأن الضغط داخل الحويصلات الهوائية يتساوى مع الضغط الجوي الخارجي","لأن الأكسجين ينفد من الهواء الخارجي","لأن الحجاب الحاجز يتصلب إلى الأبد"]'::jsonb,
      '["Because the trachea closes completely","Because intra-alveolar pressure equalizes with external atmospheric pressure","Because oxygen runs out in outside air","Because the diaphragm permanently stiffens"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يتحرك الهواء فقط عند وجود فرق في الضغط؛ وعند نهاية الشهيق يصل الضغط داخل الحويصلات إلى 760 ملم زئبق مساويًا للضغط الجوي فيتوقف التدفق.',
    'Air flows only when a pressure gradient exists; at end-inspiration, alveolar pressure equals atmospheric pressure (0 mmHg gradient).'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l4 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_mechanics, v_q3, 1.08,
      'ماذا يحدث لو دخل الهواء إلى التجويف الجنبي المحيط بالرئة وفُقد الضغط السلبي داخله؟',
      'What happens if air enters the pleural cavity around the lung and the negative intrapleural pressure is lost?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["تتمدد الرئة إلى ضعف حجمها الطبيعي","تفقد الرئة قدرتها على التمدد مع حركة جدار الصدر وتنكمش بفعل ارتدادها المرن","تزداد سرعة تبادل الغازات","ينخفض الضغط الجوي الخارجي"]'::jsonb,
      '["The lung expands to twice its normal volume","The lung fails to expand with the chest wall and recoils inward","Gas exchange speed increases","External atmospheric pressure drops"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'الضغط السلبي في التجويف الجنبي هو الذي يبقي الرئة ملتصقة بجدار الصدر ومتمددة؛ وفقدانه يؤدي لانكماش الرئة (استرواح الصدر).',
    'Negative intrapleural pressure couples the lung to the thoracic wall; losing it allows elastic recoil to collapse the lung (pneumothorax).'
  );

  -- =========================================================================
  -- LESSON 5 QUESTIONS (v_l5)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, null, 0.9,
      'ما اتجاه حركة غازي الأكسجين O₂ وثاني أكسيد الكربون CO₂ عبر الغشاء الحويصلي الشعيري في الرئتين؟',
      'What is the direction of oxygen (O₂) and carbon dioxide (CO₂) diffusion across the alveolar-capillary membrane in the lungs?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["ينتقل O₂ من الحويصلات إلى الدم، وينتقل CO₂ من الدم إلى الحويصلات","ينتقل O₂ من الدم إلى الحويصلات، وينتقل CO₂ من الحويصلات إلى الدم","ينتقل الغازان معًا من الدم إلى الحويصلات","لا يعبر أي من الغازين الغشاء الحويصلي"]'::jsonb,
      '["O₂ diffuses from alveoli into blood, and CO₂ diffuses from blood into alveoli","O₂ diffuses from blood into alveoli, and CO₂ diffuses from alveoli into blood","Both gases diffuse from blood into alveoli","Neither gas crosses the alveolar membrane"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'ينتشر الأكسجين من التركيز/الضغط الجزئي الأعلى في الحويصلات إلى الدم، بينما ينتشر ثاني أكسيد الكربون من الدم إلى الحويصلات ليُطرح في الزفير.',
    'O₂ moves down its partial-pressure gradient from alveoli into capillary blood, while CO₂ moves from blood into alveoli to be exhaled.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l5 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, v_q1, 0.9,
      'ما البروتين الموجود داخل خلايا الدم الحمراء والمسؤول عن نقل معظم الأكسجين في الدم؟',
      'Which protein inside red blood cells is responsible for transporting the vast majority of oxygen in the blood?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["الفيبرينوجين","الهيموغلوبين (Hemoglobin)","الأنسولين","الكولاجين"]'::jsonb,
      '["Fibrinogen","Hemoglobin","Insulin","Collagen"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'يرتبط نحو 98.5% من الأكسجين المنقول في الدم ببروتين الهيموغلوبين داخل خلايا الدم الحمراء.',
    'Roughly 98.5% of oxygen in arterial blood is transported bound to hemoglobin inside red blood cells.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, null, 1.0,
      'إذا كان الضغط الجزئي للأكسجين (PO₂) في هواء الحويصلة 104 ملم زئبق وفي الدم الوارد للشعيرات الرئوية 40 ملم زئبق، فكم يبلغ فرق الضغط الجزئي للأكسجين (بالملم زئبق)؟',
      'If alveolar PO₂ is 104 mmHg and incoming pulmonary capillary blood PO₂ is 40 mmHg, what is the oxygen partial-pressure gradient in mmHg?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"ملم زئبق","unit_en":"mmHg"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":64,"tolerance":0.01}'::jsonb,
    'فرق الضغط الجزئي للأكسجين = 104 − 40 = 64 ملم زئبق.',
    'Oxygen partial-pressure gradient = 104 − 40 = 64 mmHg.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l5 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, v_q2, 1.0,
      'إذا كان الضغط الجزئي لثاني أكسيد الكربون (PCO₂) في الدم الوريدي الوارد للرئة 45 ملم زئبق وفي هواء الحويصلة 40 ملم زئبق، فكم يبلغ فرق الضغط الجزئي لثاني أكسيد الكربون (بالملم زئبق)؟',
      'If incoming venous blood PCO₂ is 45 mmHg and alveolar PCO₂ is 40 mmHg, what is the carbon dioxide partial-pressure gradient in mmHg?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"ملم زئبق","unit_en":"mmHg"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":5,"tolerance":0.01}'::jsonb,
    'فرق الضغط الجزئي لثاني أكسيد الكربون = 45 − 40 = 5 ملم زئبق.',
    'Carbon dioxide partial-pressure gradient = 45 − 40 = 5 mmHg.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, null, 1.08,
      'لماذا تقل نسبة تشبع الهيموغلوبين بالأكسجين عند الصعود إلى قمم الجبال الشاهقة رغم أن نسبة الأكسجين في الهواء تظل نحو 21%؟',
      'Why does hemoglobin oxygen saturation decrease at high mountain altitudes even though oxygen still makes up ~21% of air?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن الضغط الجوي الكلي ينخفض فينخفض الضغط الجزئي للأكسجين PO₂ في الحويصلات ويقل فرق الضغط الدافع للانتشار","لأن الرئتين تتوقفان عن العمل في المرتفعات","لأن الهيموغلوبين يختفي من الدم فورًا","لأن نسبة النيتروجين تتحول إلى ثاني أكسيد الكربون"]'::jsonb,
      '["Because total atmospheric pressure drops, lowering alveolar PO₂ and reducing the diffusion gradient","Because the lungs stop working at altitude","Because hemoglobin disappears from the blood immediately","Because nitrogen turns into carbon dioxide"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الضغط الجزئي للغاز يساوي نسبته مضروبة في الضغط الكلي؛ وعند انخفاض الضغط الجوي في المرتفعات ينخفض PO₂ في الحويصلات فيقل انتقاله للدم.',
    'Partial pressure equals fractional concentration times total pressure; lower barometric pressure at altitude reduces alveolar PO₂ and the diffusion gradient.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l5 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_exchange, v_q3, 1.08,
      'أي الأوعية الدموية التالية يحمل دمًا غنيًا بالأكسجين عائدًا من الرئتين إلى الأذين الأيسر للقلب؟',
      'Which blood vessels carry oxygen-rich blood returning from the lungs to the left atrium of the heart?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["الشريان الرئوي","الأوردة الرئوية (Pulmonary Veins)","الوريد الأجوف العلوي","الشريان الأبهر"]'::jsonb,
      '["Pulmonary artery","Pulmonary veins","Superior vena cava","Aorta"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,
    'الأوردة الرئوية هي الأوردة الوحيدة في الجسم التي تحمل دمًا مؤكسجًا من الشعيرات الرئوية إلى الأذين الأيسر.',
    'Pulmonary veins carry oxygenated blood from the pulmonary capillaries into the left atrium of the heart.'
  );

  -- =========================================================================
  -- LESSON 6 QUESTIONS (v_l6)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l6 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, null, 0.9,
      'لماذا يُعد استنشاق غاز أول أكسيد الكربون (CO) خطيرًا جدًا على نقل الأكسجين في الجسم؟',
      'Why is inhaling carbon monoxide (CO) gas particularly dangerous to oxygen transport in the body?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["لأنه يرتبط بالهيموغلوبين بألفة تفوق الأكسجين بنحو 200 مرة فيمنع ارتباط الأكسجين ونقله للأنسجة","لأنه يوسع الحويصلات الهوائية","لأنه يزيد إنتاج الأكسجين في الدم","لأنه يحفز نمو الأهداب التنفسية"]'::jsonb,
      '["Because it binds hemoglobin with ~200× higher affinity than oxygen, blocking O₂ transport to tissues","Because it expands the alveoli","Because it increases oxygen production in blood","Because it stimulates ciliary growth"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يتنافس أول أكسيد الكربون مع الأكسجين على مواقع الارتباط في الهيموغلوبين ويكوّن كربوكسي هيموغلوبين مستقرًا يعيق تزويد الأنسجة بـ O₂.',
    'Carbon monoxide competitively binds hemoglobin with ~200× greater affinity than O₂, forming carboxyhemoglobin and starving tissues of oxygen.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l6 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, v_q1, 0.9,
      'كيف يحمي المصعد المخاطي الهدبي (Mucociliary Escalator) الرئتين من الجسيمات الدقيقة والغبار؟',
      'How does the mucociliary escalator protect the lungs from inhaled dust and fine particles?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["يلتقط المخاط الجسيمات الغريبة وتتحرك الأهداب بانتظام لدفعها نحو البلعوم للتخلص منها","يدفع الغبار عميقًا داخل الحويصلات لتخزينه","يحلل الغبار إلى غاز الأكسجين","يغلق القصبة الهوائية عند وجود غبار"]'::jsonb,
      '["Mucus traps foreign particles and cilia beat rhythmically to propel them toward the pharynx for removal","It pushes dust deeper into the alveoli for storage","It breaks dust down into oxygen gas","It closes the trachea whenever dust is present"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تعمل طبقة المخاط والأهداب المتحركة كحزام ناقل يدفع الشوائب بعيدًا عن الحويصلات باتجاه البلعوم.',
    'Mucus traps inhaled debris while coordinated ciliary motion sweeps it upward toward the pharynx.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l6 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, null, 1.0,
      'إذا كان الحجم الجاري لشخص 500 مل، والحجم الاحتياطي الشهيقي 2500 مل، والحجم الاحتياطي الزفيري 1000 مل، فكم تبلغ السعة الحيوية للرئة (بالملليلتر)؟',
      'If a person''s tidal volume is 500 mL, inspiratory reserve volume is 2,500 mL, and expiratory reserve volume is 1,000 mL, what is the vital capacity in mL?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"مل","unit_en":"mL"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":4000,"tolerance":0.1}'::jsonb,
    'السعة الحيوية = 500 + 2500 + 1000 = 4000 ملليلتر.',
    'Vital capacity = 500 + 2,500 + 1,000 = 4,000 mL.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l6 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, v_q2, 1.0,
      'إذا كان الحجم الجاري 500 مل، والحجم الاحتياطي الشهيقي 3000 مل، والحجم الاحتياطي الزفيري 1000 مل، فكم تبلغ السعة الحيوية (بالملليلتر)؟',
      'If tidal volume is 500 mL, inspiratory reserve volume is 3,000 mL, and expiratory reserve volume is 1,000 mL, what is the vital capacity in mL?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"مل","unit_en":"mL"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":4500,"tolerance":0.1}'::jsonb,
    'السعة الحيوية = 500 + 3000 + 1000 = 4500 ملليلتر.',
    'Vital capacity = 500 + 3,000 + 1,000 = 4,500 mL.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l6 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, null, 1.08,
      'كيف يؤثر شلل الأهداب التنفسية بسبب الملوثات الدخانية على صحة الممرات الهوائية على المدى الطويل؟',
      'How does smoke-induced paralysis of respiratory cilia affect airway health over time?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["يتراكم المخاط المحمل بالملوثات والميكروبات في الشعيبات فتزداد احتمالية الالتهاب وانسداد الممرات","تزداد سرعة تنظيف الرئتين تلقائيًا","تتسع الحويصلات الهوائية وتزداد كفاءتها","يقل إفراز المخاط إلى الصفر"]'::jsonb,
      '["Mucus laden with pollutants and microbes accumulates in bronchioles, increasing inflammation and airway obstruction","Lung self-cleaning speed automatically increases","Alveoli expand and become more efficient","Mucus secretion drops to zero"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'توقف الأهداب يعطل المصعد المخاطي الهدبي، فيتجمع المخاط والملوثات داخل الممرات التنفسية ويسبب التهابها وضيقها.',
    'Ciliary paralysis halts mucociliary clearance, trapping mucus and pathogens in the airways and promoting chronic inflammation.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l6 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l6, v_skill_mechanics, v_q3, 1.08,
      'كيف يسهم النشاط البدني الهوائي المنتظم في تحسين كفاءة التبادل الغازي لدى الإنسان السليم؟',
      'How does regular aerobic physical activity improve gas-exchange efficiency in a healthy individual?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["يعزز كفاءة عضلات التنفس وتروية الشعيرات الرئوية مما يحسن تهوية الحويصلات واستخلاص الأكسجين","يلغي الحاجة إلى الهيموغلوبين في الدم","يقلل السعة الحيوية للرئتين","يمنع دخول ثاني أكسيد الكربون إلى الرئتين"]'::jsonb,
      '["It strengthens respiratory muscles and pulmonary capillary perfusion, improving alveolar ventilation and oxygen extraction","It eliminates the need for hemoglobin","It reduces lung vital capacity","It blocks carbon dioxide from entering the lungs"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'التمرين الهوائي المنتظم يقوي عضلة الحجاب الحاجز ويحسن المطابقة بين التهوية الحويصلية والتروية الدموية.',
    'Regular aerobic training strengthens respiratory muscles and improves ventilation-perfusion matching across the lungs.'
  );

  -- =========================================================================
  -- LESSON 7 QUESTIONS (v_l7)
  -- =========================================================================
  select id into v_q1 from public.questions where lesson_id = v_l7 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_airway, null, 0.9,
      'ما المقصود بالحيز الميت التشريحي (Anatomical Dead Space) في الجهاز التنفسي؟',
      'What is meant by anatomical dead space in the respiratory system?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["حجم الهواء الموجود في الممرات التوصيلية (كالأنف والقصبة والشعب) والذي لا يشارك مباشرة في التبادل الغازي","حجم الدم الموجود في البطين الأيمن","مساحة الحويصلات النشطة أثناء الجري","كمية الأكسجين المرتبطة بالهيموغلوبين"]'::jsonb,
      '["The volume of air in conducting airways (nose, trachea, bronchi) that does not participate directly in gas exchange","The volume of blood in the right ventricle","The active alveolar surface area during running","The amount of oxygen bound to hemoglobin"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الحيز الميت التشريحي (نحو 150 مل) هو حجم الممرات الهوائية التوصيلية التي تنقل الهواء دون أن تحتوي على حويصلات لتبادل الغازات.',
    'Anatomical dead space (~150 mL) is the volume of the conducting airways where no alveolar gas exchange occurs.'
  );

  select id into v_vq1 from public.questions where lesson_id = v_l7 and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_airway, v_q1, 0.9,
      'ما المسار المتكامل لجزيء أكسجين من الهواء الخارجي حتى وصوله إلى خلية عضلية؟',
      'What is the complete pathway of an oxygen molecule from external air to a muscle cell?',
      'approved', 'published_demo', 101, 'multiple-choice',
      '["الممرات التنفسية ← الحويصلة الهوائية ← الشعيرات الرئوية ← الأوردة الرئوية ← القلب ← الشرايين الجهازية ← الخلية","الممرات التنفسية ← الشريان الرئوي ← الأذين الأيمن ← الحويصلة الهوائية","الحويصلة الهوائية ← المريء ← المعدة ← الشرايين ← الخلية","الأنف ← القصبة الهوائية ← الوريد الأجوف ← الحويصلة الهوائية"]'::jsonb,
      '["Conducting airways → Alveolus → Pulmonary capillaries → Pulmonary veins → Heart → Systemic arteries → Muscle cell","Conducting airways → Pulmonary artery → Right atrium → Alveolus","Alveolus → Esophagus → Stomach → Arteries → Cell","Nose → Trachea → Vena cava → Alveolus"]'::jsonb,
      v_prov || '{"difficulty_label":"core","parallel_variant":true}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يعبر الأكسجين الممرات التنفسية إلى الحويصلة، ثم ينتشر إلى الشعيرات الرئوية ويعود عبر الأوردة الرئوية للجانب الأيسر من القلب ليُضخ عبر الشرايين إلى خلايا الجسم.',
    'O₂ travels through conducting airways to the alveolus, diffuses into pulmonary capillaries, returns via pulmonary veins to the left heart, and is pumped through systemic arteries to cells.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l7 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_mechanics, null, 1.0,
      'إذا كان الحجم الجاري 500 ملليلتر والحيز الميت التشريحي 150 ملليلتر، فكم ملليلترًا من الهواء النقي يصل فعليًا إلى الحويصلات في النفس الواحد؟',
      'If tidal volume is 500 mL and anatomical dead space is 150 mL, how many milliliters of fresh air actually reach the alveoli per breath?',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"مل","unit_en":"mL"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"numeric","correctAnswer":350,"tolerance":0.1}'::jsonb,
    'الهواء الحويصلي الفعال في النفس الواحد = 500 − 150 = 350 ملليلتر.',
    'Effective alveolar air per breath = 500 mL − 150 mL = 350 mL.'
  );

  select id into v_vq2 from public.questions where lesson_id = v_l7 and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_mechanics, v_q2, 1.0,
      'إذا ازداد الحجم الجاري إلى 600 ملليلتر وبقي الحيز الميت التشريحي 150 ملليلتر، فكم ملليلترًا من الهواء النقي يصل إلى الحويصلات في النفس الواحد؟',
      'If tidal volume increases to 600 mL while anatomical dead space remains 150 mL, how many milliliters of fresh air reach the alveoli per breath?',
      'approved', 'published_demo', 102, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","parallel_variant":true,"unit_ar":"مل","unit_en":"mL"}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"numeric","correctAnswer":450,"tolerance":0.1}'::jsonb,
    'الهواء الحويصلي الفعال في النفس الواحد = 600 − 150 = 450 ملليلتر.',
    'Effective alveolar air per breath = 600 mL − 150 mL = 450 mL.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l7 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_mechanics, null, 1.08,
      'شخصان لهما نفس التهوية الكلية في الدقيقة (6000 مل/دقيقة) مع حيز ميت 150 مل: الأول يتنفس بعمق (10 أنفاس × 600 مل) والثاني يتنفس بسطحية وسرعة (20 نفسًا × 300 مل). أيهما يحصل على تهوية حويصلية فعالة أكبر؟',
      'Two people have the same total minute ventilation (6,000 mL/min) with 150 mL dead space: Person A breathes deeply (10 × 600 mL) and Person B breathes shallowly and rapidly (20 × 300 mL). Who achieves greater effective alveolar ventilation?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["الأول (التنفس العميق: 4500 مل/دقيقة) لأن نسبة الهواء الضائع في الحيز الميت تكون أقل","الثاني (التنفس السطحي السريع: 3000 مل/دقيقة)","الاثنان متساويان تمامًا في التهوية الحويصلية","لا يصل أي هواء إلى الحويصلات في الحالتين"]'::jsonb,
      '["Person A (deep breathing: 4,500 mL/min) because a smaller fraction of each breath is wasted in dead space","Person B (shallow rapid breathing: 3,000 mL/min)","Both have identical alveolar ventilation","No air reaches the alveoli in either case"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'التهوية الحويصلية للأول = 10 × (600 − 150) = 4500 مل/دقيقة، وللثاني = 20 × (300 − 150) = 3000 مل/دقيقة؛ لذا فالتنفس العميق أكثر كفاءة.',
    'Person A achieves 10 × (600 − 150) = 4,500 mL/min alveolar ventilation versus Person B''s 20 × (300 − 150) = 3,000 mL/min.'
  );

  select id into v_vq3 from public.questions where lesson_id = v_l7 and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l7, v_skill_mechanics, v_q3, 1.08,
      'ما الاستجابة المتزامنة التي تحدث في الجهازين التنفسي والدوري معًا لضمان وصول الأكسجين للعضلات أثناء التمرين؟',
      'What coordinated response occurs simultaneously in the respiratory and circulatory systems to ensure oxygen delivery during exercise?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["تزداد التهوية الحويصلية ويزداد النتاج القلبي معًا لتسريع تبادل الغازات ونقلها","تزداد التهوية الرئوية ويتوقف ضخ القلب","ينخفض معدل التنفس ويزداد ضغط الدم فقط","تغلق الشعيرات الرئوية لتوفير الطاقة"]'::jsonb,
      '["Both alveolar ventilation and cardiac output increase together to accelerate gas exchange and transport","Ventilation increases while cardiac pumping stops","Breathing rate drops while only blood pressure rises","Pulmonary capillaries close to save energy"]'::jsonb,
      v_prov || '{"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يتكامل الجهازان بزيادة التهوية الحويصلية لتجديد الأكسجين وزيادة ضخ القلب لتسريع نقله إلى الأنسجة العاملة.',
    'Cardiopulmonary integration matches increased alveolar ventilation with increased cardiac output to sustain tissue oxygenation.'
  );

  -- =========================================================================
  -- UNIT 3 BOSS QUESTIONS (unit_id = v_unit_id, lesson_id = null, metadata.boss = true)
  -- =========================================================================
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_mechanics, null, 1.0,
      'تحدّي الوحدة (1): إذا كان الحجم الجاري 500 مل والحيز الميت التشريحي 150 مل ومعدل التنفس 12 نفسًا/دقيقة، فكم تبلغ التهوية الحويصلية الفعالة في الدقيقة (بالملليلتر)؟',
      'Unit Boss (1): If tidal volume is 500 mL, anatomical dead space is 150 mL, and breathing rate is 12 breaths/min, what is the effective alveolar ventilation per minute in mL?',
      'approved', 'published_demo', 1, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"core","unit_ar":"مل/دقيقة","unit_en":"mL/min"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1, '{"type":"numeric","correctAnswer":4200,"tolerance":0.1}'::jsonb,
    'الهواء الحويصلي في النفس = 500 − 150 = 350 مل. وفي الدقيقة = 12 × 350 = 4200 مل/دقيقة.',
    'Alveolar air per breath = 500 − 150 = 350 mL; per minute = 12 × 350 = 4,200 mL/min.'
  );

  select id into v_vq1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 101 and variant_of = v_q1 limit 1;
  if v_vq1 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_mechanics, v_q1, 1.0,
      'تحدّي الوحدة (بديل 1): إذا وصل إلى الحويصلات 350 مل من الهواء النقي في كل نفس بمعدل 10 أنفاس في الدقيقة، فكم تبلغ التهوية الحويصلية في الدقيقة (بالملليلتر)؟',
      'Unit Boss (Variant 1): If 350 mL of fresh air reaches the alveoli per breath at 10 breaths/min, what is the alveolar ventilation per minute in mL?',
      'approved', 'published_demo', 101, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"core","parallel_variant":true,"unit_ar":"مل/دقيقة","unit_en":"mL/min"}'::jsonb
    ) returning id into v_vq1;
  end if;
  delete from public.question_keys where question_id = v_vq1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq1, '{"type":"numeric","correctAnswer":3500,"tolerance":0.1}'::jsonb,
    'التهوية الحويصلية = 10 × 350 = 3500 مل/دقيقة.',
    'Alveolar ventilation = 10 × 350 = 3,500 mL/min.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_airway, null, 1.05,
      'تحدّي الوحدة (2): لماذا تحتوي القصبة الهوائية على حلقات غضروفية بينما تتكون جدران الحويصلات الهوائية من طبقة خلوية واحدة رقيقة جدًا؟',
      'Unit Boss (2): Why does the trachea contain cartilage rings whereas alveolar walls consist of a single ultra-thin cell layer?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["لأن القصبة تحتاج دعامة تمنع انغلاق المجرى الهوائي، بينما تحتاج الحويصلات غشاءً فائق الرقة لتسريع انتشار الغازات","لأن القصبة الهوائية هي موقع تبادل الغازات والحويصلات مجرد مخزن","لأن الحويصلات الهوائية لا يصلها الدم","لأن الغضاريف تسمح بانتشار الأكسجين أسرع من الخلايا الرقيقة"]'::jsonb,
      '["Because the trachea needs structural support to stay open, whereas alveoli need an ultra-thin barrier to maximize gas diffusion","Because the trachea is the gas-exchange site and alveoli are only storage","Because alveoli receive no blood supply","Because cartilage diffuses oxygen faster than thin epithelium"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'تلائم البنية الوظيفة: الغضاريف تحفظ المجرى التوصيلي مفتوحًا، والغشاء الرقيق للحويصلات يقلل مسافة الانتشار وفق قانون فيك.',
    'Structure matches function: cartilage prevents airway collapse in conducting passages, while thin alveolar epithelium minimizes diffusion distance.'
  );

  select id into v_vq2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 102 and variant_of = v_q2 limit 1;
  if v_vq2 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_airway, v_q2, 1.05,
      'تحدّي الوحدة (بديل 2): أي مجموعة من التغيرات التالية تحدث معًا أثناء الشهيق الطبيعي؟',
      'Unit Boss (Variant 2): Which combination of changes occurs together during normal inhalation?',
      'approved', 'published_demo', 102, 'multiple-choice',
      '["انقباض الحجاب الحاجز، زيادة حجم التجويف الصدري، وانخفاض الضغط داخل الحويصلات دون الضغط الجوي","انبساط الحجاب الحاجز، نقص حجم الصدر، وارتفاع الضغط داخل الحويصلات","انغلاق لسان المزمار، انبساط العضلات بين الضلعية، ودخول الهواء","انقباض الحجاب الحاجز، نقص حجم الصدر، وارتفاع الضغط داخل الرئة"]'::jsonb,
      '["Diaphragm contraction, increased thoracic volume, and intra-alveolar pressure dropping below atmospheric pressure","Diaphragm relaxation, decreased thoracic volume, and rising alveolar pressure","Epiglottis closure, intercostal relaxation, and air inflow","Diaphragm contraction, decreased thoracic volume, and rising lung pressure"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application","parallel_variant":true}'::jsonb
    ) returning id into v_vq2;
  end if;
  delete from public.question_keys where question_id = v_vq2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq2, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'انقباض الحجاب الحاجز يزيد حجم الصدر فيخفض ضغط الحويصلات دون الضغط الجوي فيندفع الهواء للداخل.',
    'Diaphragm contraction expands thoracic volume, lowering intra-alveolar pressure below atmospheric pressure to draw air inward.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_exchange, null, 1.1,
      'تحدّي الوحدة (3): يصل الدم إلى الشعيرات الرئوية بضغط جزئي PO₂ = 40 mmHg وPCO₂ = 45 mmHg، بينما في هواء الحويصلات PO₂ = 104 mmHg وPCO₂ = 40 mmHg. ما الوصف الأدق لحركة الغازات؟',
      'Unit Boss (3): Blood enters pulmonary capillaries with PO₂ = 40 mmHg and PCO₂ = 45 mmHg, while alveolar air has PO₂ = 104 mmHg and PCO₂ = 40 mmHg. Which statement accurately describes gas movement?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["ينتشر الأكسجين إلى الدم بفرق ضغط 64 mmHg وينتشر ثاني أكسيد الكربون إلى الحويصلة بفرق ضغط 5 mmHg","ينتشر الأكسجين إلى الحويصلة بفرق ضغط 64 mmHg","ينتشر ثاني أكسيد الكربون إلى الدم بفرق ضغط 5 mmHg","يتوقف التبادل لأن مجموع الضغوط متساوٍ"]'::jsonb,
      '["O₂ diffuses into blood down a 64 mmHg gradient and CO₂ diffuses into the alveolus down a 5 mmHg gradient","O₂ diffuses into the alveolus down a 64 mmHg gradient","CO₂ diffuses into blood down a 5 mmHg gradient","Exchange stops because total pressures are equal"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'ينتقل كل غاز مستقلاً تبعًا لفرق ضغطه الجزئي: الأكسجين نحو الدم (104 − 40 = 64) وثاني أكسيد الكربون نحو الحويصلة (45 − 40 = 5).',
    'Each gas diffuses independently down its own partial-pressure gradient: O₂ into blood (104 − 40 = 64 mmHg) and CO₂ into alveoli (45 − 40 = 5 mmHg).'
  );

  select id into v_vq3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 103 and variant_of = v_q3 limit 1;
  if v_vq3 is null then
    insert into public.questions (lesson_id, unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (null, v_unit_id, v_skill_exchange, v_q3, 1.1,
      'تحدّي الوحدة (بديل 3): رغم أن فرق الضغط الجزئي لثاني أكسيد الكربون (5 mmHg) أصغر بكثير من فرق الضغط الجزئي للأكسجين (64 mmHg)، فإنه ينتشر عبر الغشاء الحويصلي بكفاءة عالية. ما السبب العلمي لذلك؟',
      'Unit Boss (Variant 3): Even though the partial-pressure gradient for CO₂ (5 mmHg) is much smaller than for O₂ (64 mmHg), CO₂ diffuses across the alveolar membrane very efficiently. Why?',
      'approved', 'published_demo', 103, 'multiple-choice',
      '["لأن ذوبانية ثاني أكسيد الكربون في السوائل الحيوية ونفاذيته عبر الغشاء أعلى بكثير من الأكسجين","لأن جزيئات ثاني أكسيد الكربون أصغر حجمًا من ذرات الهيدروجين","لأن الرئة تضخ ثاني أكسيد الكربون بالنقل النشط المستهلك لـ ATP","لأن الهيموغلوبين يمنع حركة الأكسجين"]'::jsonb,
      '["Because carbon dioxide has a much higher solubility and diffusivity across biological membranes than oxygen","Because CO₂ molecules are smaller than hydrogen atoms","Because the lung pumps CO₂ via ATP-dependent active transport","Because hemoglobin blocks oxygen movement"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer","parallel_variant":true}'::jsonb
    ) returning id into v_vq3;
  end if;
  delete from public.question_keys where question_id = v_vq3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_vq3, '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'ذوبانية CO₂ في سوائل الغشاء الحويصلي تزيد بنحو 20 مرة عن ذوبانية O₂، ما يعوض صغر فرق الضغط الجزئي ويجعل انتشاره سريعًا.',
    'CO₂ is roughly 20 times more soluble in biological fluids than O₂, compensating for its smaller partial-pressure gradient.'
  );

end $$;