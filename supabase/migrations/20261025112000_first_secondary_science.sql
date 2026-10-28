-- First Secondary Term 1 (2026-2027) — Unit 2: Integrated Science
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 201-397 (sha256 2b7fc532…)
-- Idempotent; preserves the source's equations, definitions and suggested answers as stated.

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_spheres uuid;
  v_skill_chem uuid;
  v_skill_phys uuid;
  v_skill_bio uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'integrated-science',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي ومفصّل، وليس نسخة حرفية من الكتاب المدرسي.',
    'provenance_en', 'Content built from an original detailed study guide, not a verbatim copy of the school textbook.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 2 limit 1;
  if v_unit_id is null then
    raise exception 'Unit Integrated Science (position 2) not found. Run migration 20261025100000 first.';
  end if;

  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'sci-earth-spheres-cycle', 'وصف أغلفة الأرض ودورة الماء', 'Describe Earth''s spheres and the water cycle'),
    (v_course_id, 'sci-water-chemistry', 'تفسير الخصائص الكيميائية للماء', 'Explain the chemical properties of water'),
    (v_course_id, 'sci-water-physics', 'تطبيق حسابات الكثافة والحرارة', 'Apply density and heat calculations'),
    (v_course_id, 'sci-solutions-biology', 'تحليل المحاليل والأهمية الحيوية للماء', 'Analyze solutions and the biological importance of water')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;
  select id into v_skill_spheres from public.skills where course_id = v_course_id and slug = 'sci-earth-spheres-cycle' limit 1;
  select id into v_skill_chem from public.skills where course_id = v_course_id and slug = 'sci-water-chemistry' limit 1;
  select id into v_skill_phys from public.skills where course_id = v_course_id and slug = 'sci-water-physics' limit 1;
  select id into v_skill_bio from public.skills where course_id = v_course_id and slug = 'sci-solutions-biology' limit 1;

  -- Lesson 1: The Hydrosphere on Earth
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'sci-hydrosphere', 'الغلاف المائي على الأرض', 'The Hydrosphere on Earth', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'summary_ar', 'البيئة مجموع الظروف والعوامل المحيطة بالكائن الحي، والنظام البيئي يشمل الكائنات الحية والعوامل غير الحية المتفاعلة في منطقة معينة: عوامل حية (نباتات وحيوانات وفطريات وبكتيريا) وعوامل غير حية (ماء وهواء وضوء ودرجة حرارة وتربة ومعادن)، وهو أكثر من قائمة كائنات؛ إذ يشمل علاقات التغذي والتنافس والتحلل وتبادل المادة والطاقة. لأرض أربعة أغلفة كبرى: الجوي (طبقة الغازات المحيطة)، والمائي (الماء في المحيطات والبحار والأنهار والبحيرات والمياه الجوفية والجليد وبخار الماء)، والصخري/الأرضي (الجزء الصلب الخارجي)، والحيوي (كل مناطق وجود الحياة وتفاعلها مع الأغلفة الأخرى)؛ وتتفاعل باستمرار: المطر ينقل الماء من الجوي إلى الصخري، والنبات يمتص ماء التربة ويعيد بخار الماء إلى الجوي بالنتح. يغطي الماء نحو 71% من سطح الأرض، نحو 97% منه مالح في المحيطات والبحار، ونحو 3% فقط عذب، ومعظم العذب محبوس في الجليد والأنهار الجليدية أو تحت الأرض؛ فلا يعني وفرة الماء أن العذب الصالح غير محدود، والتلوث والإفراط في الاستخدام والجفاف وعدم التوزيع تجعل الحفظ والإدارة ضرورة. ودورة الماء هي الحركة المستمرة للماء بين سطح الأرض وباطنها والكائنات الحية والغلاف الجوي بفعل الطاقة الشمسية والجاذبية: تبخر (تحول الماء السائل إلى بخار بعد اكتساب طاقة)، ونتح (خروج البخار من النبات عبر الثغور)، وتكاثف (تبريد البخار وتحوله قطرات أو بلورات ثلج فتتكون السحب)، وهطول (مطر وثلج وبرد)، وجريان سطحي، وتسرب يغذي المياه الجوفية، وتخزين في المحيطات والتربة والجليد والكائنات؛ وهو ليس مسارًا أحاديًا. والماء عنصر أساسي للحياة: مكوّن رئيسي للخلايا ومذيب ووسط نقل يدعم التفاعلات الحيوية وينظم الحرارة، ولذلك يعد البحث عن الماء السائل مهمًا في علم الأحياء الفلكية.',
      'summary_en', 'The environment is the sum of conditions surrounding an organism; an ecosystem includes living organisms and non-living factors interacting in an area — biotic (plants, animals, fungi, bacteria) and abiotic (water, air, light, temperature, soil, minerals) — and is more than a list: feeding, competition, decomposition and matter/energy exchange. Earth has four major spheres: atmosphere (surrounding gases), hydrosphere (water in oceans, seas, rivers, lakes, groundwater, ice, vapour), lithosphere/geosphere (solid outer part), biosphere (all life regions interacting with the others) — continuously interacting: rain moves water from atmosphere to lithosphere; plants take soil water and return vapour by transpiration. Water covers ~71% of Earth''s surface; ~97% is saline in oceans and seas, only ~3% freshwater, mostly locked in glaciers/ice sheets or underground — abundance does not mean unlimited usable freshwater; pollution, overuse, drought and uneven distribution make conservation essential. The water cycle is the continuous movement of water between surface, underground, organisms and atmosphere, driven by solar energy and gravity: evaporation (liquid to vapour after gaining energy), transpiration (vapour from leaf stomata), condensation (vapour cools to droplets/ice crystals forming clouds), precipitation (rain, snow, hail), surface runoff, infiltration/percolation recharging groundwater, and storage in oceans, soil, glaciers, groundwater, organisms — not a one-way path. Water is essential for life: major cell component, solvent and transport medium, supports biochemical reactions, regulates temperature; hence liquid water matters in astrobiology.',
      'worked_ar', 'مثال محلول من الدليل: تتبع رحلة جزيء ماء سقط مطرًا على تلة — جريان سطحي إلى نهر، أو تسرب إلى المياه الجوفية، ثم تخزين أو تبخر مجددًا؛ فالدورة ليست مسارًا واحدًا بسيطًا بل تدوير مستمر عبر مخزونات متعددة.',
      'worked_en', 'Worked example from the guide: trace a water molecule that falls as rain on a hill — surface runoff to a river, or infiltration into groundwater, then storage or re-evaporation; the cycle is not a simple one-way path but continuous recycling through several reservoirs.',
      'objectives_ar', jsonb_build_array('تعريف النظام البيئي وتمييز العوامل الحية من غير الحية', 'تسمية الأغلفة الأربعة ووصف تفاعلها', 'تفسير لماذا العذب المتاح أقل بكثير من إجمالي الماء', 'ترتيب عمليات دورة الماء وشرح دور الكائنات الحية فيها'),
      'objectives_en', jsonb_build_array('Define an ecosystem and distinguish biotic from abiotic factors', 'Name the four spheres and describe their interaction', 'Explain why available freshwater is far less than total water', 'Order the water-cycle processes and organisms'' role in it'),
      'common_mistakes_ar', jsonb_build_array('الظن أن وفرة الماء على الكوكب تعني وفرة العذب الصالح', 'الخلط بين الغلاف المائي والغلاف الحيوي', 'تصور دورة الماء كمسار أحادي الاتجاه'),
      'common_mistakes_en', jsonb_build_array('Assuming planetary water abundance means abundant usable freshwater', 'Confusing the hydrosphere with the biosphere', 'Picturing the water cycle as a one-way path'),
      'check_ar', jsonb_build_array('ما الفرق بين الغلاف المائي والغلاف الحيوي؟', 'لماذا نسبة العذب المتاح أقل بكثير من إجمالي الماء؟', 'كيف يسهم النتح في دورة الماء؟'),
      'check_en', jsonb_build_array('Distinguish the hydrosphere from the biosphere.', 'Why is easily available freshwater much less than total water?', 'How does transpiration contribute to the water cycle?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'sci-hydrosphere' limit 1;

  -- Lesson 2: Chemical Properties of Water
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'sci-water-chemistry', 'الخصائص الكيميائية للماء', 'Chemical Properties of Water', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'الماء صيغته H2O؛ فكل جزيء يحتوي ذرتي هيدروجين مرتبطتين تساهميًا بذرة أكسجين، والأكسجين يجذب إلكترونات الرابطة أقوى من الهيدروجين فتكون كل رابطة O–H قطبية، والجزيء منحنٍ بزاوية نحو 104.5 درجة، فيتوزع الشحنة توزيعًا غير متساوٍ: طرف الأكسجين سالب جزئيًا وأطراف الهيدروجين موجبة جزئيًا، والماء جزيء قطبي. الرابطة الهيدروجينية جذب بين هيدروجين موجب جزئيًا مرتبط بذرة كهروسالبية وذرة كهروسالبية في جزيء آخر؛ وهي أضعف من الروابط التساهمية داخل الجزيء لكنها مجتمعة تؤثر في خواص الماء. والماء مذيب لكثير من المواد الأيونية والقطبية: عند إذابة كلوريد الصوديوم تجذب جزيئات الماء أيونات الصوديوم والكلوريد وتحيط بها وتساعدها على التوزع في المحلول، أما كثير من المواد غير القطبية كالزيوت فلا تمتزج جيدًا؛ والقاعدة التقريبية أن المذيبات القطبية تذيب المواد القطبية أو الأيونية أفضل من غير القطبية. ومقياس pH يصف مدى حمضية أو قاعدية المحلول المائي وعند نحو 25°C: أقل من 7 حمضي، ويساوي 7 متعادل، وأكبر من 7 قاعدي؛ وفي النموذج المدرسي المبسط للمحاليل الحمضية تركيز أيونات الهيدروجين H+ مرتفع نسبيًا وللقاعدية تركيز الهيدروكسيد OH− مرتفع نسبيًا، والمحلول المتعادل متوازن تحت الظروف المرجعية. والتعادل تفاعل بين حمض وقاعدة ينتج عادة ملحًا وماء، ومحلول الملح ليس متعادلًا تلقائيًا؛ فpH يعتمد على الأيونات والحمض/القاعدة اللذين تكوّن منهما. أمثلة الدليل: pH = 3 حمضي، وpH = 7 متعادل، وpH = 10 قاعدي؛ وإذابة السكر وحدها لا تعني أن المحلول صار حمضيًا أو قاعديًا.',
      'summary_en', 'Water is H2O: two hydrogen atoms covalently bonded to one oxygen; oxygen attracts the shared electrons more strongly, each O–H bond is polar, and the bent molecule (~104.5°) distributes charge unevenly — oxygen end partially negative, hydrogen ends partially positive — making water polar. A hydrogen bond attracts a partially positive hydrogen on an electronegative atom to an electronegative atom of another molecule; weaker than intramolecular covalent bonds, yet collectively major for water''s properties. Water dissolves many ionic and polar substances: dissolving NaCl, water molecules attract and surround Na+ and Cl− ions helping disperse them; many non-polar substances like oils do not mix well — polar solvents tend to dissolve polar or ionic substances better. The pH scale describes acidity/basicity of aqueous solutions; at about 25°C: below 7 acidic, equal to 7 neutral, above 7 basic; in the basic school model acidic solutions have relatively high H+ and basic ones relatively high OH−, neutral is balanced under reference conditions. Neutralisation reacts an acid with a base, commonly producing salt and water; a salt solution is not automatically neutral — its pH depends on the ions and the acid/base involved. Guide examples: pH 3 acidic, pH 7 neutral, pH 10 basic; sugar dissolving alone does not make a solution acidic or basic.',
      'worked_ar', 'مثال محلول من الدليل: تصنيف محاليل قيم pH لها 4 و7 و11 — الأول حمضي لأنه أقل من 7، والثاني متعادل عند الظروف المرجعية، والثالث قاعدي لأنه أكبر من 7.',
      'worked_en', 'Worked example from the guide: classify solutions with pH 4, 7 and 11 — the first acidic (below 7), the second neutral under reference conditions, the third basic (above 7).',
      'objectives_ar', jsonb_build_array('تفسير قطبية جزيء الماء بزاوية الرابطة وتوزيع الشحنة', 'وصف الرابطة الهيدروجينية ومقارنتها بالرابطة التساهمية', 'تفسير إذابة الأملاح في الماء', 'تصنيف المحاليل وفق قيم pH'),
      'objectives_en', jsonb_build_array('Explain water''s polarity via bond angle and charge distribution', 'Describe the hydrogen bond versus the covalent bond', 'Explain how salts dissolve in water', 'Classify solutions by pH values'),
      'common_mistakes_ar', jsonb_build_array('الظن أن كل محلول ملحي متعادل تلقائيًا', 'الخلط بين إذابة مادة وسلوكها الحمضي القاعدي', 'الاعتقاد أن الماء يذيب كل المواد'),
      'common_mistakes_en', jsonb_build_array('Assuming every salt solution is automatically neutral', 'Confusing dissolving a substance with acid–base behaviour', 'Believing water dissolves everything'),
      'check_ar', jsonb_build_array('لماذا الماء جزيء قطبي؟', 'ماذا تفعل جزيئات الماء عند إذابة ملح الطعام؟', 'صنّف محاليل pH لها 4 و7 و11.'),
      'check_en', jsonb_build_array('Why is water a polar molecule?', 'What do water molecules do when table salt dissolves?', 'Classify solutions with pH 4, 7, and 11.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'sci-water-chemistry' limit 1;

  -- Lesson 3: Physical Properties of Water
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'sci-water-physics', 'الخصائص الفيزيائية للماء', 'Physical Properties of Water', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'الكثافة = الكتلة ÷ الحجم، ومن وحداتها kg/m³ وg/cm³، والكثافة النسبية تقارن كثافة مادة بكثافة مادة مرجعية، والهيدروميتر يقيس الكثافة النسبية للسوائل بمدى غطسه فيها. يبلغ الماء السائل أقصى كثافته عند نحو 4°C، وعند تبريده من 4°C نحو 0°C يتمدد وتقل كثافته؛ فالجليد أقل كثافة من الماء السائل فيطفو عليه، وهذا مهم بيئيًا: في البرد قد يتجمد سطح الماء وتبقى المياه العميقة سائلة فتساعد الكائنات المائية على البقاء؛ ولو غطس الجليد لاختلف تجمد البحيرات اختلافًا كبيرًا. درجة الحرارة قياس مرتبط بمتوسط الطاقة الحركية للجسيمات، والحرارة طاقة تنتقل بين جسمين لاختلاف درجتي حرارتهما؛ فالمصطلحان مترابطان وغير قابلين للتبادل. التحويل بين سيليزيوس وكلفن: T(K) = T(°C) + 273.15، وتستخدم بعض الحسابات المدرسية 273 تقريبًا؛ اتبع القيمة التي يطلبها السؤال. الحرارة النوعية هي الطاقة اللازمة لرفع درجة حرارة وحدة كتلة من مادة درجة واحدة، وقانونها Q = m × c × ΔT حيث Q الطاقة المنقولة بالجول وm الكتلة وc الحرارة النوعية وΔT الفرق بين النهائية والابتدائية؛ وللماء حرارة نوعية عالية (نحو 4200 J/(kg·°C)) فيسخن ببطء ويبرد ببطء أكثر من كثير من المواد، ما يعتدل به درجات حرارة البيئات المائية والمناطق الساحلية. والنسيم البحري نهاري: تسخن اليابسة أسرع من البحر فيرتفع هواؤها الأدفأ ويحل محله هواء بارد من البحر؛ وقد ينعكس اتجاهه ليلًا نسيمًا بريًا. والحرارة الكامنة طاقة تُمتص أو تُطلق أثناء تغير الحالة دون تغير في درجة الحرارة أثناء التحول نفسه: التبخر يمتص والتكاثف يطلق، وهذان الانتقالان يؤثران في الطقس وحركة الحرارة في الغلاف الجوي.',
      'summary_en', 'Density = mass / volume, with units kg/m³ and g/cm³; relative density compares a material''s density with a reference; a hydrometer measures liquids'' relative density by how deeply it floats. Liquid water reaches maximum density near 4°C; cooling from 4°C toward 0°C it expands and its density falls — ice is less dense than liquid water and floats, which matters ecologically: surface water may freeze while deeper water stays liquid, helping aquatic organisms survive; if ice sank, lakes would freeze very differently. Temperature relates to the average kinetic energy of particles; heat is energy transferred because of a temperature difference — related but not interchangeable. Celsius-to-kelvin: T(K) = T(°C) + 273.15; some school calculations use 273 — follow what the question requires. Specific heat capacity is the energy to raise one unit mass by one degree: Q = m × c × ΔT, with Q in joules, m mass, c specific heat, ΔT final minus initial temperature. Water''s high specific heat (~4200 J/(kg·°C)) makes it warm and cool slowly, moderating aquatic and coastal temperatures. Sea breeze: land warms faster than the sea by day — warmer land air rises and cooler sea air moves in; at night the direction may reverse (land breeze). Latent heat is energy absorbed or released during a change of state without temperature change during the phase change itself: evaporation absorbs, condensation releases — affecting weather and atmospheric heat movement.',
      'worked_ar', 'مثال محلول من الدليل: عينة ماء كتلتها 0.50 kg ارتفعت درجة حرارتها 10°C باستخدام c = 4200 J/(kg·°C): Q = 0.50 × 4200 × 10 = 21,000 J. ولتدريب مشابه: m = 2 kg وΔT = 5°C فتكون Q = 2 × 4200 × 5 = 42,000 J.',
      'worked_en', 'Worked example from the guide: a 0.50 kg water sample warms by 10°C with c = 4200 J/(kg·°C): Q = 0.50 × 4200 × 10 = 21,000 J. Similar practice: m = 2 kg and ΔT = 5°C gives Q = 2 × 4200 × 5 = 42,000 J.',
      'objectives_ar', jsonb_build_array('حساب الكثافة وتفسير طفو الجليد', 'التمييز بين درجة الحرارة والحرارة', 'تطبيق قانون Q = m × c × ΔT بالوحدات الصحيحة', 'تفسير النسيم البحري والبري والحرارة الكامنة'),
      'objectives_en', jsonb_build_array('Calculate density and explain why ice floats', 'Distinguish temperature from heat', 'Apply Q = m × c × ΔT with correct units', 'Explain sea/land breezes and latent heat'),
      'common_mistakes_ar', jsonb_build_array('استخدام قيمة 273 أو 273.15 دون اتباع المطلوب في السؤال', 'نسيان وحدات Q والكتلة والحرارة النوعية', 'الخلط بين درجة الحرارة والحرارة'),
      'common_mistakes_en', jsonb_build_array('Using 273 vs 273.15 without following the question''s requirement', 'Forgetting units of Q, mass and specific heat', 'Confusing temperature with heat'),
      'check_ar', jsonb_build_array('لماذا يطفو الجليد على الماء السائل؟', 'اشرح الفرق بين درجة الحرارة والحرارة.', 'احسب Q عند m = 2 kg وc = 4200 J/(kg·°C) وΔT = 5°C.'),
      'check_en', jsonb_build_array('Why does ice float on liquid water?', 'Explain the difference between temperature and heat.', 'Calculate Q for m = 2 kg, c = 4200 J/(kg·°C), ΔT = 5°C.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'sci-water-physics' limit 1;

  -- Lesson 4: Aqueous Solutions and Their Properties
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'sci-aqueous-solutions', 'المحاليل المائية وخواصها', 'Aqueous Solutions and Their Properties', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'المحلول خليط متجانس من مذاب مذاب في مذيب، وفي المحلول المائي يكون الماء هو المذيب: المذاب هو المادة المذابة، والمذيب الوسط الذي يذيبها؛ والمحلول غير المشبع يمكن أن يذيب مذابًا إضافيًا في الظروف نفسها، والمشبع يحتوي الكمية القصوى المذابة عند درجة حرارة وضغط محددين عند حالة اتزان، والمفرط التشبع يحتوي أكثر من المستقر عادة وقد يتبلور عند إزعاجه. الذوبانية هي الكمية القصوى من المذاب التي تذوب في كمية معينة من المذيب تحت ظروف محددة، والتركيز يصف كمية المذاب الموجودة فعليًا في كمية من المحلول؛ وهما مختلفان: قد يكون المحلول مخففًا حتى لو كانت ذوبانية المذاب عالية. وتتوقف الذوبانية على طبيعة المذاب والمذيب ودرجة الحرارة والضغط خاصة للغازات؛ فل كثير من المواد الصلبة تزيد الذوبانية بارتفاع الحرارة مع استثناءات، وذوبانية الغازات في الماء تقل عادة بارتفاع الحرارة. والخواص التجميعية خصائص تعتمد أساسًا على عدد الجسيمات المذابة أكثر من هويتها الكيميائية في ظروف قابلة للمقارنة: خفض ضغط البخار (المذاب غير المتطاير يقلل ميل جزيئات المذيب للهروب)، وارتفاع درجة الغليان، وانخفاض درجة التجمد؛ ويترافق حجم الأثر مع العدد الفعلي للجسيمات، فالمركبات الأيونية قد تنتج أكثر من أيون واحد لكل وحدة صيغية فيختلف سلوكها عن المذابات الجزيئية عند التركيز نفسه. والأسموزية انتقال صافي لجزيئات المذيب عبر غشاء شبه منفذ من منطقة تركيز المذاب الأقل إلى الأعلى وفق النموذج المدرسي، والضغط الأسموزي هو الضغط اللازم لمنع هذا الانتقال الصافي؛ وهي مهمة في امتصاص الجذور وحركة الماء عبر الأغلفة الخلوية، والمحاليل الملحية أو السكرية المركزة جدًا قد تسحب الماء من الخلايا — سبب لفائدتها في حفظ بعض الأطعمة. ومن المفاهيم الخاطئة الشائعة: المحلول المتجانس ليس بالضرورة عديم اللون، والتشبع اتزان ديناميكي تستمر فيه الحركة، والذوبانية ليست التركيز، والأسموزية انتقال مذيب عبر غشاء شبه منفذ لا مجرد انتشار أي مادة في الماء.',
      'summary_en', 'A solution is a homogeneous mixture of solute dissolved in solvent; in an aqueous solution water is the solvent. Unsaturated: more solute can dissolve under the same conditions; saturated: holds the maximum dissolved at a specified temperature and pressure at equilibrium; supersaturated: holds more than normally stable and may crystallise if disturbed. Solubility is the maximum quantity dissolving in a given solvent amount under specified conditions; concentration is how much solute is actually present — different ideas: a solution may be dilute even with highly soluble solute. Solubility depends on solute/solvent nature, temperature, and — especially for gases — pressure; many solids dissolve more at higher temperature with exceptions, while gas solubility in water commonly falls as temperature rises. Colligative properties depend mainly on the number of dissolved particles, not their identity, under comparable conditions: vapour-pressure lowering (a non-volatile solute reduces solvent escape), boiling-point elevation, freezing-point depression; the effect tracks the effective particle count — ionic compounds may yield more than one ion per formula unit, differing from molecular solutes at the same concentration. Osmosis is the net movement of solvent through a selectively permeable membrane from lower to higher solute concentration in the usual school model; osmotic pressure is what stops that net movement; it matters for root water uptake and movement across cell membranes, and very concentrated salt or sugar solutions can draw water from cells — one reason they preserve some foods. Misconceptions: homogeneous solutions need not be colourless; saturation is dynamic equilibrium; solubility is not concentration; osmosis is solvent movement through a selectively permeable membrane, not any spreading in water.',
      'worked_ar', 'مثال محلول من الدليل: في ماء الملح يكون الملح هو المذاب والماء هو المذيب؛ وأثناء الأسموزية ينتقل المذيب عادةً من المنطقة الأقل تركيزًا للمذاب إلى الأعلى عبر الغشاء شبه المنفذ.',
      'worked_en', 'Worked example from the guide: in salt water the salt is the solute and water the solvent; during osmosis the solvent usually moves from lower to higher solute concentration across the membrane.',
      'objectives_ar', jsonb_build_array('تعريف المذاب والمذيب وأنواع المحاليل الثلاثة', 'التمييز بين الذوبانية والتركيز', 'ذكر الخواص التجميعية الثلاث وربطها بعدد الجسيمات', 'وصف الأسموزية واتجاه انتقال المذيب'),
      'objectives_en', jsonb_build_array('Define solute, solvent and the three solution types', 'Distinguish solubility from concentration', 'List the three colligative properties and link them to particle count', 'Describe osmosis and the direction of solvent movement'),
      'common_mistakes_ar', jsonb_build_array('الاعتقاد أن المحلول المتجانس عديم اللون بالضرورة', 'اعتبار التشبع سكونًا تامًا', 'الخلط بين الذوبانية والتركيز', 'وصف الأسموزية كانتشار أي مادة'),
      'common_mistakes_en', jsonb_build_array('Assuming homogeneous solutions are colourless', 'Treating saturation as complete stillness', 'Confusing solubility with concentration', 'Describing osmosis as diffusion of any substance'),
      'check_ar', jsonb_build_array('حدد المذاب والمذيب في ماء الملح.', 'ما الاتجاه المعتاد لحركة المذيب أثناء الأسموزية؟', 'اذكر خاصيتين تجميعيتين.'),
      'check_en', jsonb_build_array('Identify solute and solvent in salt water.', 'What is the usual direction of solvent movement in osmosis?', 'Name two colligative properties.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'sci-aqueous-solutions' limit 1;

  -- Lesson 5: The Biological Importance of Water
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'sci-biological-water', 'الأهمية الحيوية للماء', 'The Biological Importance of Water', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 9,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'تتفاوت نسبة الماء بين الكائنات والأنسجة والخلايا، ويوجد داخل الخلايا وفي السوائل خارج الخلوية كالدم وسوائل الجسم الأخرى، ويوفر وسطًا للتفاعلات الكيميائية التي تسند الحياة. من وظائفه الحيوية: مذيب لكثير من الأيونات والجزيئات القطبية، وناقل للمغذيات وأيونات المعادن والغازات والفضلات، ومشارك في بعض التفاعلات كالتحلل المائي، ومنظم للحرارة بفضل حرارته النوعية العالية التي تحد من التغير السريع ولأن التبخر يزيل الحرارة، ومساهم في بنية الخلية وحجمها وضغط الامتلاء في خلايا النبات، ووسط ينتقل عبره المواد المذابة بالانتشار أو النقل. والخلايا بدائيو النوى ليس لديها نواة محددة بغشاء وتوجد مادتها الوراثية في منطقة بالخلية، والبكتيريا أمثلة لها؛ أما حقيقيو الن فلهم نواة محددة بغشاء وعيّنات متخصصة، وتوجد في الحيوان والنبات والفطر وغيرها، وتمتلك الخلية النموذجية غشاءً بلازميًا يتحكم في التبادل مع المحيط، وسيتوبلازمًا تجري فيه كثير من التفاعلات، ونواة تحوي معظم المادة الوراثية. والأيض مجموع التفاعلات الكيميائية في الكائن الحي، والإنزيمات عوامل حفازة حيوية — بروتينات غالبًا — تسرع التفاعلات بخفض طاقة التنشيط ولا تُستهلك بها. يتأثر نشاط الإنزيم بـ: درجة الحرارة (يرتفع غالبًا حتى درجة مثلى، وفوقها قد يتغير بناء الإنزيم — إنفصال حراري — ويقل نشاطه)، وpH (لكل إنزيم مدى مناسب والدرجات المتطرفة قد تغير الموقع الفعال)، وتركيز الركيزة والإنزيم، والمثبطات أو المنشطات. ويدعم الماء عمل الإنزيمات بوصفه وسطًا مائيًا يسمح بحركة الجزيئات وتفاعلها ويذيب كثيرًا من الركائز والنواتج؛ لكن الماء وحده لا يكفي إن كانت الحرارة أو pH أو شروط أخرى غير مناسبة.',
      'summary_en', 'Water content varies among organisms, tissues and cells; it exists inside cells and in extracellular fluids like blood, providing the medium for life-sustaining reactions. Biological functions: solvent for many ions and polar molecules; transport of nutrients, mineral ions, gases and wastes; participation in reactions such as hydrolysis; temperature regulation via its high specific heat and evaporative cooling; contributing to cell volume and turgor in plant cells; a medium where dissolved substances diffuse or are transported. Prokaryotic cells lack a membrane-bound nucleus — genetic material sits in a region of the cell — bacteria being examples; eukaryotes have a membrane-bound nucleus and specialised organelles, in animals, plants, fungi and more; the typical eukaryotic cell has a plasma membrane controlling exchange, cytoplasm hosting many reactions, and a nucleus holding most genetic material. Metabolism is the sum of an organism''s chemical reactions; enzymes are biological catalysts — usually proteins — accelerating reactions by lowering activation energy, not consumed by them. Enzyme activity depends on temperature (often rises to an optimum; above it the structure may change — denaturation — reducing activity), pH (each enzyme has a suitable range; extremes can alter the active site), substrate and enzyme concentration, and inhibitors or activators. Water supports enzymes as an aqueous medium letting molecules move and interact and dissolving many substrates and products; but water alone cannot guarantee normal enzyme function if temperature, pH or other conditions are unsuitable.',
      'worked_ar', 'مثال محلول من الدليل: أعطِ أربع وظائف حيوية للماء — مذيب، ناقل، وسط تفاعلات أيضية (كالتحلل المائي)، منظم للحرارة — وبيّن الفرق الرئيس بين بدائي النوى وحقيقي النوى: وجود نواة محددة بغشاء في حقيقي النوى وغيابها في بدائي النوى.',
      'worked_en', 'Worked example from the guide: give four biological functions of water — solvent, transport, metabolic medium (e.g. hydrolysis), temperature regulation — and state the key cell difference: eukaryotes have a membrane-bound nucleus, prokaryotes do not.',
      'objectives_ar', jsonb_build_array('ذكر أربع وظائف حيوية للماء', 'المقارنة بين الخلايا بدائية وحقيقية النواة', 'تفسير تأثير الحرارة وpH على نشاط الإنزيمات', 'ربط خصائص الماء بدعم التفاعلات الحيوية'),
      'objectives_en', jsonb_build_array('List four biological functions of water', 'Compare prokaryotic and eukaryotic cells', 'Explain how temperature and pH affect enzyme activity', 'Link water''s properties to supporting life chemistry'),
      'common_mistakes_ar', jsonb_build_array('الظن أن الماء وحده يكفي لعمل الإنزيم مهما كانت الظروف', 'الخلط بين بدائي النوى وحقيقي النوى في وجود النواة', 'الاعتقاد أن الإنزيم يُستهلك بالتفاعل'),
      'common_mistakes_en', jsonb_build_array('Assuming water alone guarantees enzyme function regardless of conditions', 'Mixing up prokaryotic and eukaryotic nucleus status', 'Believing enzymes are consumed by their reactions'),
      'check_ar', jsonb_build_array('أعطِ أربع وظائف حيوية للماء.', 'ما الفرق الرئيس بين بدائي النوى وحقيقي النوى؟', 'لماذا قد تقلل الحرارة العالية نشاط الإنزيم؟'),
      'check_en', jsonb_build_array('Give four biological functions of water.', 'State the main difference between prokaryotic and eukaryotic cells.', 'Why can very high temperature reduce enzyme activity?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'sci-biological-water' limit 1;

  -- ===== Lesson 1 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_spheres, null, 0.9,
      'أي الغلاف الأرضي يشمل الماء في المحيطات والبحار والأنهار والبحيرات والمياه الجوفية والجليد وبخار الماء؟',
      'Which sphere includes water in oceans, seas, rivers, lakes, groundwater, ice and water vapour?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الغلاف المائي","الغلاف الجوي","الغلاف الصخري","الغلاف الحيوي"]'::jsonb,
      '["The hydrosphere","The atmosphere","The lithosphere","The biosphere"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"3":"الغلاف الحيوي كل مناطق وجود الحياة وتفاعلها مع الأغلفة الأخرى."}}'::jsonb,
    'الغلاف المائي حسب الدليل هو الماء بكل صوره ومخازنه: المحيطات والبحار والأنهار والبحيرات والمياه الجوفية والجليد وبخار الماء.',
    'The hydrosphere, per the guide, is water in all its forms and reservoirs: oceans, seas, rivers, lakes, groundwater, ice and vapour.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_spheres, null, 1.0,
      'نحو 97% من ماء الأرض مالح في المحيطات والبحار، فأين يتركز معظم العذب المتبقي؟',
      'About 97% of Earth''s water is saline in oceans and seas; where is most remaining freshwater stored?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["في الجليد والأنهار الجليدية والمياه الجوفية","في الأنهار والبحيرات مباشرة","في الغلاف الجوي فقط","في الكائنات الحية فقط"]'::jsonb,
      '["In glaciers, ice sheets and groundwater","Directly in rivers and lakes","Only in the atmosphere","Only in living organisms"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من نص الدليل: معظم الماء العذب محبوس في الجليد والأنهار الجليدية أو تحت الأرض؛ ولهذا يكون العذب المتاح في الأنهار والبحيرات جزءًا صغيرًا.',
    'Per the guide: most freshwater is locked in glaciers/ice sheets or underground — so readily available river and lake water is a small fraction.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_spheres, null, 1.0,
      'ما العملية التي يخرج بها بخار الماء من أوراق النبات إلى الغلاف الجوي في دورة الماء؟',
      'Which water-cycle process releases water vapour from plant leaves into the atmosphere?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["النتح","التكاثف","الهطول","الجريان السطحي"]'::jsonb,
      '["Transpiration","Condensation","Precipitation","Surface runoff"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"التكاثف تحول البخار إلى قطرات أو بلورات عند التبريد.","2":"الهطول سقوط الماء من السحب.","3":"الجريان السطحي حركة الماء فوق سطح الأرض."}}'::jsonb,
    'النتح هو خروج الماء من النبات أساسًا عبر الثغور الورقية على هيئة بخار، وهو دور الكائنات الحية في دورة الماء.',
    'Transpiration is water leaving the plant mainly through leaf stomata as vapour — living organisms'' role in the cycle.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l1 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_spheres, null, 1.0,
      'أي العبارات تمثل علاقة صحيحة بين الأغلفة كما في الدليل؟',
      'Which statement describes a correct interaction between spheres as in the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["المطر ينقل الماء من الغلاف الجوي إلى الصخري، والنبات يمتص ماء التربة ويعيد بخارًا إلى الجوي","الغلاف الحيوي معزول تمامًا عن بقية الأغلفة","الماء ينتقل من الأرض إلى الغلاف الجوي فقط بالجاذبية","الجليد جزء من الغلاف الجوي"]'::jsonb,
      '["Rain moves water from atmosphere to lithosphere; plants take soil water and return vapour to the atmosphere","The biosphere is fully isolated from the other spheres","Water moves from land to atmosphere only by gravity","Ice belongs to the atmosphere"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'هذا هو المثال الحرفي للتفاعل المستمر بين الأغلفة في الدليل: المطر من الجوي إلى الصخري، والامتصاص والنتح بين الصخري/الحيوي والجوي.',
    'This is the guide''s literal example of continuous sphere interaction: rain from atmosphere to lithosphere; uptake and transpiration between lithosphere/biosphere and atmosphere.'
  );

  -- ===== Lesson 2 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_chem, null, 0.9,
      'لماذا يعد الماء جزيءًا قطبيًا وفق الدليل؟',
      'Why is water considered a polar molecule according to the guide?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["لأن الأكسجين يجذب إلكترونات الرابطة أقوى والجزيء منحنٍ بزاوية نحو 104.5 درجة","لأن الرابطتين التساهميتين متساويتان القوة تمامًا","لأن الهيدروجين أكبر من الأكسجين","لأن الجزيء خطي مستقيم"]'::jsonb,
      '["Because oxygen attracts bonding electrons more strongly and the molecule is bent at about 104.5°","Because the two covalent bonds are exactly equal in strength","Because hydrogen is larger than oxygen","Because the molecule is linear"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"3":"الشكل الخطي كان سيلغي عدم التماثل في توزيع الشحنة."}}'::jsonb,
    'اجتماع قوة جذب الأكسجين للإلكترونات مع الشكل المنحني (~104.5°) يجعل الشحنة موزعة غير متساوٍ: طرف الأكسجين سالب جزئيًا وأطراف الهيدروجين موجبة جزئيًا.',
    'Oxygen''s stronger electron pull combined with the bent shape (~104.5°) distributes charge unevenly: the oxygen end partially negative, the hydrogen ends partially positive.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_chem, null, 1.0,
      'ماذا تفعل جزيئات الماء عند إذابة كلوريد الصوديوم NaCl وفق الدليل؟',
      'What do water molecules do when sodium chloride dissolves, per the guide?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["تجذب أيونات الصوديوم والكلوريد وتحيط بها وتساعدها على التوزع","تتفكك هي نفسها إلى عناصرها","تمنع الأيونات من الحركة","تتحول الأيونات إلى جزيئات محايدة"]'::jsonb,
      '["Attract and surround the sodium and chloride ions, helping them disperse","Themselves decompose into their elements","Prevent the ions from moving","Turn the ions into neutral molecules"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: تجذب جزيئات الماء قطبية أيونات Na+ وCl− وتحيط بها وتساعدها على التوزع في المحلول، ولهذا تذوب الأملاح بسهولة.',
    'The guide states water molecules'' polarity attracts and surrounds Na+ and Cl− ions, helping disperse them — hence salts dissolve readily.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_chem, null, 1.0,
      'محلول قيمة pH له 10 عند نحو 25°C يصنف:',
      'A solution with pH 10 at about 25°C is classified as:',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["قاعدي","حمضي","متعادل","غير قابل للتصنيف"]'::jsonb,
      '["Basic","Acidic","Neutral","Unclassifiable"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'من أمثلة الدليل: أقل من 7 حمضي، ويساوي 7 متعادل، وأكبر من 7 قاعدي؛ و10 أكبر من 7 فهو قاعدي.',
    'From the guide''s examples: below 7 acidic, 7 neutral, above 7 basic; 10 is above 7, hence basic.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l2 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_chem, null, 1.05,
      'ذاب السكر في الماء فصار المحلول حلو المذاق. هل يصبح المحلول حمضيًا أو قاعديًا لمجرد ذلك؟',
      'Sugar dissolved in water making it sweet — does the solution thereby become acidic or basic?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["لا؛ فإذابة مادة لا تعني وحدها سلوكًا حمضيًا أو قاعديًا","نعم يصبح حمضيًا","نعم يصبح قاعديًا","يصبح متعادلًا دائمًا مهما كانت الإضافة"]'::jsonb,
      '["No; dissolving a substance alone does not mean acid–base behaviour","Yes, it becomes acidic","Yes, it becomes basic","It is always neutral regardless of addition"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'ينص الدليل صراحة: إذابة السكر في الماء لا تعني وحدها أن المحلول صار حمضيًا أو قاعديًا؛ فالإذابة والسلوك الحمضي القاعدي فكرتان مختلفتان.',
    'The guide states explicitly: sugar dissolving in water does not by itself make the solution acidic or basic; dissolving and acid–base behaviour are different ideas.'
  );

  -- ===== Lesson 3 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_phys, null, 0.9,
      'لماذا يطفو الجليد على سطح الماء السائل؟',
      'Why does ice float on liquid water?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["لأن كثافته أقل؛ فالماء يتمدد فتقل كثافته عند التبريد من 4°C نحو 0°C","لأن الجليد أثقل من الماء","لأن الجليد لا كتلة له","لأن الماء السائل أقل كثافة عند 0°C من الجليد"]'::jsonb,
      '["Because its density is lower; water expands and its density falls cooling from 4°C toward 0°C","Because ice is heavier than water","Because ice has no mass","Because liquid water is less dense than ice at 0°C"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'يبلغ الماء أقصى كثافته نحو 4°C، وعند التبريد بعدها يتمدد فتقل الكثافة، ويصبح الجليد أخف من السائل فيطفو.',
    'Water is densest near 4°C; cooling beyond that it expands, density falls, and ice becomes lighter than the liquid and floats.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_phys, null, 1.0,
      'احسب Q لعينة ماء كتلتها 0.50 kg ارتفعت درجة حرارتها 10°C، علمًا بأن c للماء = 4200 J/(kg·°C). (بالجول)',
      'Calculate Q for a 0.50 kg water sample warming by 10°C, with c = 4200 J/(kg·°C). (In joules)',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application","unit_ar":"جول","unit_en":"J"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"numeric","correctAnswer":21000,"tolerance":1}'::jsonb,
    'Q = m × c × ΔT = 0.50 × 4200 × 10 = 21,000 J كما في مثال الدليل المحلول.',
    'Q = m × c × ΔT = 0.50 × 4200 × 10 = 21,000 J, the guide''s worked example.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_phys, null, 1.05,
      'عند حساب التحويل من سيليزيوس إلى كلفن وفق الدليل، الصيغة الصحيحة هي:',
      'Per the guide, the correct Celsius-to-kelvin conversion is:',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["T(K) = T(°C) + 273.15 مع جواز استخدام 273 تقريبًا في بعض الحسابات المدرسية","T(K) = T(°C) − 273.15","T(K) = T(°C) × 273","T(K) = T(°C) + 100"]'::jsonb,
      '["T(K) = T(°C) + 273.15, with 273 acceptable in some school calculations","T(K) = T(°C) − 273.15","T(K) = T(°C) × 273","T(K) = T(°C) + 100"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: T(K) = T(°C) + 273.15، وتستخدم بعض الحسابات المدرسية 273 تقريبًا؛ اتبع القيمة التي يطلبها السؤال.',
    'The guide states T(K) = T(°C) + 273.15, with 273 used as an approximation in some school calculations; follow what the question requires.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l3 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_phys, null, 1.0,
      'ما الفرق الصحيح بين درجة الحرارة والحرارة وفق الدليل؟',
      'What is the correct difference between temperature and heat per the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["درجة الحرارة قياس مرتبط بمتوسط الطاقة الحركية للجسيمات، والحرارة طاقة تنتقل لاختلاف درجتي حرارة","هما كلمتان لمعنى واحد","الحرارة خاصية للجسم ودرجة الحرارة طاقة تنتقل","لا يوجد فرق في الماء"]'::jsonb,
      '["Temperature relates to average particle kinetic energy; heat is energy transferred due to a temperature difference","They are two words for one meaning","Heat is a body property and temperature is transferred energy","There is no difference for water"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: درجة الحرارة قياس مرتبط بمتوسط الطاقة الحركية للجسيمات، والحرارة طاقة تنتقل بين جسمين بسبب اختلاف درجتي حرارتهما؛ فهما مترابطان وغير قابلين للتبادل.',
    'The guide states: temperature relates to average kinetic energy of particles; heat is energy transferred between objects due to a temperature difference — related but not interchangeable.'
  );

  -- ===== Lesson 4 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_bio, null, 0.9,
      'في محلول ملح الطعام في الماء، ما المذاب وما المذيب؟',
      'In a solution of table salt in water, what is the solute and what is the solvent?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["الملح مذاب والماء مذيب","الماء مذاب والملح مذيب","كلاهما مذاب","كلاهما مذيب"]'::jsonb,
      '["Salt is the solute and water the solvent","Water is the solute and salt the solvent","Both are solutes","Both are solvents"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'المذاب هو المادة المذابة (الملح) والمذيب هو الوسط الذي يذيبها (الماء)، وهو تعريف الدليل المباشر للمحلول المائي.',
    'The solute is the dissolved substance (salt) and the solvent the medium dissolving it (water) — the guide''s direct aqueous-solution definition.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_bio, null, 1.0,
      'ما الاتجاه المعتاد لانتقال المذيب أثناء الأسموزية وفق النموذج المدرسي في الدليل؟',
      'What is the usual direction of solvent movement during osmosis in the guide''s school model?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["من المنطقة الأقل تركيزًا للمذاب إلى الأعلى عبر الغشاء شبه المنفذ","من الأعلى تركيزًا إلى الأقل دائمًا","في الاتجاهين بالتساوي بلا صافٍ أبدًا","من الغشاء إلى المحلول"]'::jsonb,
      '["From lower solute concentration to higher across the selectively permeable membrane","Always from higher to lower concentration","Equally both ways with no net movement ever","From the membrane into the solution"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الأسموزية في الدليل: انتقال صافٍ لجزيئات المذيب عبر غشاء شبه منفذ من منطقة تركيز المذاب الأقل إلى الأعلى؛ والضغط الأسموزي هو ما يمنع هذا الانتقال الصافي.',
    'Osmosis in the guide: net solvent movement through a selectively permeable membrane from lower to higher solute concentration; osmotic pressure stops that net movement.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_bio, null, 1.0,
      'أي الأزواج الآتية تذكر خواص تجميعية للمحاليل كما في الدليل؟',
      'Which pair lists colligative properties of solutions as in the guide?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["ارتفاع درجة الغليان وانخفاض درجة التجمد","زيادة اللون وزيادة الحلاوة","زيادة الكتلة ونقصان الحجم","ارتفاع pH وانخفاض pH"]'::jsonb,
      '["Boiling-point elevation and freezing-point depression","Increased colour and sweetness","Increased mass and decreased volume","Rising pH and falling pH"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'خواص الدليل التجميعية الثلاث: خفض ضغط البخار، وارتفاع درجة الغليان، وانخفاض درجة التجمد — وتعتمد أساسًا على عدد الجسيمات المذابة.',
    'The guide''s three colligative properties: vapour-pressure lowering, boiling-point elevation, freezing-point depression — driven mainly by the number of dissolved particles.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l4 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_bio, null, 1.05,
      'لماذا تستخدم المحاليل الملحية أو السكرية المركزة جدًا في حفظ بعض الأطعمة وفق الدليل؟',
      'Why are very concentrated salt or sugar solutions used to preserve some foods, per the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["لأنها قد تسحب الماء من الخلايا بالأسموزية","لأنها ترفع درجة حرارة الطعام","لأنها تقتل البكتيريا بالضوء","لأنها تمنع الطعام من التماس مع الهواء تمامًا"]'::jsonb,
      '["Because they can draw water out of cells by osmosis","Because they heat the food","Because they kill bacteria with light","Because they fully block air contact"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: المحاليل المركزة جدًا قد تسحب الماء من الخلايا، وهو أحد أسباب فائدتها في حفظ بعض الأطعمة.',
    'The guide states very concentrated solutions can draw water from cells — one reason they help preserve some foods.'
  );

  -- ===== Lesson 5 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_bio, null, 0.9,
      'أي مما يأتي ليس من الوظائف الحيوية للماء كما يسردها الدليل؟',
      'Which of the following is NOT among water''s biological functions as the guide lists them?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["إنتاج الأكسجين بالتمثيل الضوئي داخل كل خلية","المذيب والناقل","المشاركة في تفاعلات كالتحلل المائي","تنظيم درجة الحرارة"]'::jsonb,
      '["Producing oxygen via photosynthesis inside every cell","Solvent and transport","Participating in reactions like hydrolysis","Temperature regulation"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'وظائف الدليل: مذيب، ناقل، مشاركة في تفاعلات كالتحلل المائي، تنظيم الحرارة، المساهمة في بنية الخلية وضغط الامتلاء؛ وليس في قائمة الدليل إنتاج الأكسجين داخل كل خلية.',
    'The guide''s functions: solvent, transport, reaction participation (hydrolysis), temperature regulation, cell structure/turgor; oxygen production inside every cell is not among them.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_bio, null, 1.0,
      'ما الفرق الرئيس بين الخلايا بدائية النوى وحقيقية النوى؟',
      'What is the main difference between prokaryotic and eukaryotic cells?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["حقيقي النواة لها نواة محددة بغشاء وعيّنات متخصصة وبدائي النواة لا","بدائي النواة أكبر حجمًا دائمًا","بدائي النواة لا يحتوي مادة وراثية","حقيقي النواة بلا غشاء بلازمي"]'::jsonb,
      '["Eukaryotes have a membrane-bound nucleus and specialised organelles; prokaryotes do not","Prokaryotes are always larger","Prokaryotes have no genetic material","Eukaryotes lack a plasma membrane"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: بدائي النوى بلا نواة محددة بغشاء (البكتيريا أمثلة)، وحقيقي النواة بنواة محددة بغشاء وعيّنات متخصصة.',
    'The guide: prokaryotes lack a membrane-bound nucleus (bacteria are examples); eukaryotes have one plus specialised organelles.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_bio, null, 1.05,
      'لماذا قد يقل نشاط الإنزيم عند تجاوز درجة حرارته المثلى؟',
      'Why may enzyme activity fall above its optimal temperature?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["لأن بناء الإنزيم قد يتغير (إنفصال حراري) فيتأثر موقعه الفعال","لأن الإنزيم يتحول إلى ركيزة","لأن الحرارة ترفع pH الوسط دائمًا","لأن الإنزيم يُستهلك بالتفاعل"]'::jsonb,
      '["Because the enzyme''s structure may change (denaturation), affecting its active site","Because the enzyme turns into a substrate","Because heat always raises the medium''s pH","Because the enzyme is consumed by the reaction"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: فوق الدرجة المثلى قد يتغير بناء الإنزيم (إنفصال حراري) فيقل نشاطه؛ كما أن للإنزيم مدى pH مناسب وقد تغير الدرجات المتطرفة الموقع الفعال.',
    'The guide: above the optimum the enzyme''s structure may change (denaturation), reducing activity; each enzyme also has a suitable pH range whose extremes can alter the active site.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l5 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_bio, null, 1.0,
      'قال طالب: «وجود الماء في الخلية يكفي وحده لعمل الإنزيمات بشكل طبيعي». ما التقييم الصحيح وفق الدليل؟',
      'A student says: "Having water in the cell is by itself enough for enzymes to work normally." What is the correct assessment per the guide?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["غير دقيق؛ فالماء وسط ضروري لكن الحرارة وpH وغيرهما يجب أن تكون مناسبة أيضًا","دقيق تمامًا لأن الماء مذيب","دقيق فقط في الخلايا النباتية","لا علاقة للماء بعمل الإنزيمات"]'::jsonb,
      '["Inaccurate; water is a necessary medium but temperature, pH and other conditions must also be suitable","Accurate, since water is the solvent","Accurate only in plant cells","Water has no role in enzyme function"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نص الدليل: يتيح الوسط المائي حركة الجزيئات وتفاعلها ويذيب الركائز والنواتج، لكن الماء وحده لا يضمن عمل الإنزيم إن كانت الحرارة أو pH أو شروط أخرى غير مناسبة.',
    'The guide: the aqueous medium lets molecules move and interact and dissolves substrates/products, but water alone cannot guarantee enzyme function if temperature, pH or other conditions are unsuitable.'
  );

  -- ===== Unit boss questions =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_spheres, null, 1.1,
      'تحدّي الوحدة (1): كوكب فيه ماء وفير لكن معظمه مالح أو محبوس في جليد. ما الاستنتاج الصحيح حول توافر العذب؟',
      'Unit challenge (1): A planet with abundant water, most of it saline or locked in ice. What follows about freshwater availability?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["وفرة الماء لا تعني أن العذب الصالح للاستخدام غير محدود؛ فالحفظ والإدارة ضروريان","الماء العذب غير محدود لأن الكوكب مائي","لا حاجة لإدارة الموارد المائية","الماء العذب يزيد بمرور الوقت تلقائيًا"]'::jsonb,
      '["Water abundance does not mean unlimited usable freshwater; conservation and management are essential","Freshwater is unlimited on a watery planet","No water management is needed","Freshwater grows automatically over time"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الخلاصة الرئيسة للدرس الأول في الدليل: نحو 97% مالح ومعظم العذب محبوس؛ فالتلوث والإفراط والجفاف وتفاوت التوزيع تجعل الحفظ ضرورة.',
    'Lesson 1''s key conclusion: ~97% saline and most freshwater locked away; pollution, overuse, drought and uneven distribution make conservation essential.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_phys, null, 1.1,
      'تحدّي الوحدة (2): سخنت عينة ماء كتلتها 2 kg بمقدار 5°C. كم الطاقة الممتصة بالجول؟ (c = 4200 J/(kg·°C))',
      'Unit challenge (2): A 2 kg water sample warms by 5°C. How much energy is absorbed, in joules? (c = 4200 J/(kg·°C))',
      'approved', 'published_demo', 2, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application","unit_ar":"جول","unit_en":"J"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"numeric","correctAnswer":42000,"tolerance":1}'::jsonb,
    'Q = m × c × ΔT = 2 × 4200 × 5 = 42,000 J كما في إجابات الدليل الإرشادية.',
    'Q = m × c × ΔT = 2 × 4200 × 5 = 42,000 J, the guide''s suggested answer.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_bio, null, 1.15,
      'تحدّي الوحدة (3): وضعت خلية في محلول ملحي مركز جدًا. ما المتوقع وفق مفهوم الأسموزية في الدليل؟',
      'Unit challenge (3): A cell is placed in a very concentrated salt solution. What is expected per the guide''s osmosis concept?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["سحب الماء من الخلية إلى المحلول عبر الغشاء شبه المنفذ","دخول الملح بحرية إلى الخلية","بقاء الماء دون أي انتقال صافٍ","تحول الخلية إلى محلول متعادل"]'::jsonb,
      '["Water is drawn from the cell into the solution across the selectively permeable membrane","Salt enters the cell freely","Water shows no net movement","The cell becomes a neutral solution"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"transfer"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الأسموزية تنقل المذيب من التركيز الأقل للمذاب إلى الأعلى؛ فالمحلول المركز جدًا يسحب الماء من الخلية، وهو ما يذكره الدليل سببًا لفائدة هذه المحاليل في حفظ الأطعمة.',
    'Osmosis moves solvent from lower to higher solute concentration; a very concentrated solution draws water from the cell — the guide''s reason such solutions preserve foods.'
  );

end $$;
