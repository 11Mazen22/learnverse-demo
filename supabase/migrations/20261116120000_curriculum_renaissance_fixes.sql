-- Phase 2 Curriculum Renaissance: additive, idempotent content hygiene fixes.
--
-- Fixes verified against 20261025* curriculum seeds:
--   1. Repairs Arabic typos across Mathematics, Science, and Arabic lessons
--      (plus synced `-en` clones where present).
--   2. Repairs the `ف(m) = −x² + 4` question prompt typo in `public.questions`.
--   3. Upgrades unrendered Unicode math/chemistry formulas in lesson summaries,
--      worked examples, and common-mistakes arrays into pure KaTeX `$...$`
--      delimiters when `$` is not already present (idempotent).
--   4. Populates `common_mistakes_ar` / `common_mistakes_en` on canonical
--      Philosophy extra review, Arabic, English, and History lessons (plus
--      `-en` siblings if any) whenever missing/empty.

-- ============================================================
-- 1. Repair known Arabic content typos across lessons & clones
-- ============================================================
update public.lessons l
set content = (
  select coalesce(
    jsonb_object_agg(
      kv.k,
      case
        when kv.k in ('summary_ar', 'worked_ar') and jsonb_typeof(kv.v) = 'string' then
          to_jsonb(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(kv.v #>> '{}',
                            'الأقتران', 'المرافق'),
                          'غير صفرية آخر', 'غير صفري آخر'),
                        'عدم يساويه صفرًا', 'عدم مساواته صفرًا'),
                      'بواضح الفكرة', 'بوضوح الفكرة'),
                    'حقيقيو الن فلهم', 'حقيقيو النوى فلهم'),
                  'وعيّنات متخصصة', 'وعُضيّات متخصصة'),
                'فل كثير من المواد الصلبة', 'فلكثير من المواد الصلبة'),
              'إنفصال حراري', 'تفكّك حراري (تمسّخ البروتين)')
          )
        when kv.k in ('objectives_ar', 'common_mistakes_ar') and jsonb_typeof(kv.v) = 'array' then
          (
            select coalesce(
              jsonb_agg(
                replace(
                  replace(
                    replace(elem,
                      'الأقتران', 'المرافق'),
                    'عدم يساويه صفرًا', 'عدم مساواته صفرًا'),
                  'بواضح الفكرة', 'بوضوح الفكرة')
              ),
              '[]'::jsonb
            )
            from jsonb_array_elements_text(kv.v) as elem
          )
        else kv.v
      end
    ),
    l.content
  )
  from jsonb_each(l.content) as kv(k, v)
)
where l.slug ~ '^(math|sci|arab|phil|eng|hist)-'
  and (
    l.content::text like '%الأقتران%'
    or l.content::text like '%غير صفرية آخر%'
    or l.content::text like '%عدم يساويه صفرًا%'
    or l.content::text like '%بواضح الفكرة%'
    or l.content::text like '%حقيقيو الن فلهم%'
    or l.content::text like '%وعيّنات متخصصة%'
    or l.content::text like '%فل كثير من المواد الصلبة%'
    or l.content::text like '%إنفصال حراري%'
  );

-- ============================================================
-- 2. Repair the `ف(m)` question prompt typo in Mathematics
-- ============================================================
update public.questions q
set prompt_ar = replace(
  replace(q.prompt_ar, 'ف(m) = −x² + 4', 'للدالة $f(x) = -x^2 + 4$'),
  'لـ x < −2 أو x > 2',
  'لـ $x < -2$ أو $x > 2$'
)
where q.prompt_ar like '%ف(m)%';

-- ============================================================
-- 3. Upgrade unrendered math/chemistry notation to KaTeX `$...$`
--    Only applies to strings without existing `$` delimiters.
-- ============================================================
create or replace function pg_temp.noata_katex_upgrade(input_text text)
returns text
language sql
immutable
as $$
  select
    case
      when input_text is null or position('$' in input_text) > 0 then input_text
      else
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            replace(
                              replace(
                                replace(
                                  replace(input_text,
                                    'Δ = b² − 4ac', '$\Delta = b^2 - 4ac$'),
                                  'ax² + bx + c = 0', '$ax^2 + bx + c = 0$'),
                                'x² + Sx + P', '$x^2 + Sx + P$'),
                              'x² − Sx + P', '$x^2 - Sx + P$'),
                            'Q = m × c × ΔT', '$Q = m \times c \times \Delta T$'),
                          'i² = −1', '$i^2 = -1$'),
                        'z = a + bi', '$z = a + bi$'),
                      'a < 0', '$a < 0$'),
                    'a > 0', '$a > 0$'),
                  'a ≠ 0', '$a \ne 0$'),
                'Δ > 0', '$\Delta > 0$'),
              'Δ = 0', '$\Delta = 0$'),
            'Δ < 0', '$\Delta < 0$'),
          'H2O', '$\text{H}_2\text{O}$')
    end;
$$;

update public.lessons l
set content = l.content
  || case when l.content ? 'summary_ar' then jsonb_build_object('summary_ar', pg_temp.noata_katex_upgrade(l.content->>'summary_ar')) else '{}'::jsonb end
  || case when l.content ? 'summary_en' then jsonb_build_object('summary_en', pg_temp.noata_katex_upgrade(l.content->>'summary_en')) else '{}'::jsonb end
  || case when l.content ? 'worked_ar' then jsonb_build_object('worked_ar', pg_temp.noata_katex_upgrade(l.content->>'worked_ar')) else '{}'::jsonb end
  || case when l.content ? 'worked_en' then jsonb_build_object('worked_en', pg_temp.noata_katex_upgrade(l.content->>'worked_en')) else '{}'::jsonb end
  || case
       when l.content ? 'common_mistakes_ar' and jsonb_typeof(l.content->'common_mistakes_ar') = 'array' then
         jsonb_build_object(
           'common_mistakes_ar',
           (select coalesce(jsonb_agg(pg_temp.noata_katex_upgrade(el)), '[]'::jsonb) from jsonb_array_elements_text(l.content->'common_mistakes_ar') el)
         )
       else '{}'::jsonb
     end
  || case
       when l.content ? 'common_mistakes_en' and jsonb_typeof(l.content->'common_mistakes_en') = 'array' then
         jsonb_build_object(
           'common_mistakes_en',
           (select coalesce(jsonb_agg(pg_temp.noata_katex_upgrade(el)), '[]'::jsonb) from jsonb_array_elements_text(l.content->'common_mistakes_en') el)
         )
       else '{}'::jsonb
     end
where l.slug ~ '^(math|sci)-';

-- ============================================================
-- 4. Fill missing `common_mistakes_ar` & `common_mistakes_en`
--    on canonical lessons (+ `-en` siblings) when empty/absent
-- ============================================================
with target_mistakes(base_slug, mistakes_ar, mistakes_en) as (
  values
    ('phil-extra-review',
      '["التسرّع في الحكم بصدق نتيجة القياس لمجرد صحة مقدماتها الواقعية دون فحص الصورة الصورية", "اختزال التفكير الفلسفي في حفظ أقوال جاهزة بدل التساؤل النقدي المنهجي", "الخلط بين الأسلوب الخرافي أو العاطفي والأسلوب العلمي المبني على السبب القريب والتجربة"]'::jsonb,
      '["Assuming a factually true conclusion proves the syllogism formally valid", "Reducing philosophy to memorizing quotes instead of critical questioning", "Confusing everyday or emotional explanations with testable scientific reasoning"]'::jsonb),
    ('arab-reading-hatim',
      '["حصر سيرة حاتم الطائي في البذخ المادي دون إبراز معنى الإيثار والعفة وضبط النفس", "نسيان التمييز في التعبير بين القيم الجاهلية النبيلة وما هذّبه الإسلام منها"]'::jsonb,
      '["Reducing Hatim al-Ta''i''s generosity to reckless spending instead of altruistic self-restraint", "Missing how pre-Islamic virtues are analyzed contextually alongside Islamic values"]'::jsonb),
    ('arab-literature-samawal',
      '["تفسير البيت الشعري من كلمة معزولة دون ربط شطري البيت بالسياق البلاغي والفخر بالعفة", "الخلط بين التشبيه البليغ والاستعارة التصريحية في صور الكرم وصون العرض"]'::jsonb,
      '["Reading single words out of context instead of linking both hemistichs of the verse", "Confusing direct metaphor (isti''ara) with simile in lines praising honor"]'::jsonb),
    ('arab-literature-wasiya',
      '["إغفال خصائص النثر التعليمي مثل وضوح الفكرة وتسلسل النصائح والمزاوجة بين الخبر والإنشاء", "الظن أن الوصية تقتصر على الأسلوب الإنشائي الأمري فقط"]'::jsonb,
      '["Overlooking instructional prose traits such as clear organization and balanced declarative/imperative style", "Assuming classical advisory prose uses imperatives exclusively"]'::jsonb),
    ('arab-reading-social-values',
      '["الاقتصار على سرد الأخلاق الفردية دون ربط القيم الاجتماعية بتماسك المجتمع وتكافله", "الخلط بين الفكرة الرئيسة للفقرة والأفكار الجزئية الداعمة"]'::jsonb,
      '["Listing personal morals without connecting social values to community cohesion", "Confusing a paragraph''s central thesis with supporting examples"]'::jsonb),
    ('arab-literature-kab',
      '["تجاهل وظيفة الاستهلال والوصف في قصيدة المديح النبوي واعتذار كعب بن زهير", "الخلط بين الدلالة الحرفية للألفاظ والدلالة السياقية في موقف الاعتذار والعفو"]'::jsonb,
      '["Overlooking the rhetorical role of the opening prelude and apology in Ka''b ibn Zuhayr''s ode", "Taking figurative poetic expressions literally out of their historical context"]'::jsonb),
    ('arab-story-antara',
      '["اختزال قصة عنترة في المبارزة والقتال دون تتبع صراعه النفسي والاجتماعي للتحرر والاعتراف بنسبه", "إغفال دور عنصر الحوار والموقف في بناء الشخصيات بالسرد الأدبي"]'::jsonb,
      '["Reducing Antarah''s story to battle scenes while missing his struggle for dignity and recognition", "Ignoring dialogue and situational conflict in narrative character building"]'::jsonb),
    ('arab-grammar-word-types',
      '["الخلط بين علامات الاسم (كالتنوين ودخول أل والجر) وعلامات الفعل في الكلمات المتقاربة", "اعتبار الحرف ذا معنى مستقلًا في الجملة رغم افتقاره إلى غيره ليظهر معناه"]'::jsonb,
      '["Confusing noun markers (tanwin, definite al-, genitive) with verb signs", "Treating particles as semantically independent outside a full sentence"]'::jsonb),
    ('arab-grammar-noun-types',
      '["الخلط بين النكرة والمعرفة في الضمائر وأسماء الإشارة لاعتقاد أن المعرفة تبدأ بأل فقط", "نسيان التطابق في التذكير والتأنيث أو العدد في الأسماء الموصولة"]'::jsonb,
      '["Assuming only words starting with al- are definite, overlooking pronouns and demonstratives", "Forgetting gender and number agreement for relative nouns"]'::jsonb),
    ('arab-grammar-verb-types',
      '["الالتباس في تفرقة الفعل اللازم عن المتعدي عند وجود جار ومجرور بعد الفعل", "الخطأ في رد الفعل المعتل إلى ماضيه المجرد قبل تصنيفه مثالًا أو أجوف أو ناقصًا"]'::jsonb,
      '["Confusing intransitive and transitive verbs when prepositional phrases follow", "Misclassifying weak verbs without stripping prefixes back to the triliteral past root"]'::jsonb),
    ('arab-grammar-inflected',
      '["عدّ الأسماء المبنية (الضمائر، أسماء الإشارة، الموصولات) معربة بسبب حركة بنائها الثابتة", "الخطأ في إعراب الفعل المضارع المتصل بنون النسوة أو نون التوكيد المباشرة واعتباره معربًا"]'::jsonb,
      '["Treating invariable (mabni) pronouns or demonstratives as inflected nouns", "Parsing present verbs attached to direct emphasis or feminine-plural nun as inflected"]'::jsonb),
    ('arab-grammar-nominatives',
      '["نسيان أن خبر كان منصوب واسم إنّ منصوب وليس العكس", "إغفال العلامات الفرعية للرفع مثل الألف للمثنى والواو لجمع المذكر السالم والأسماء الخمسة"]'::jsonb,
      '["Confusing the accusative rules of Kana''s predicate and Inna''s subject", "Forgetting secondary nominative markers (Alif for dual, Waw for sound masculine plural)"]'::jsonb),
    ('eng-heritage',
      '["استخدام الماضي البسيط بدل الماضي المستمر لوصف حدث طويل متقاطع بعد While أو As", "إقحام حرف جر غير متلازم مع مفردات التراث والآثار مثل restore / preserve"]'::jsonb,
      '["Using Past Simple instead of Past Continuous for an interrupted background action after While", "Pairing wrong prepositions with heritage verbs such as restore, preserve, and pass down"]'::jsonb),
    ('eng-hands-help',
      '["التسوية الخاطئة بين don''t have to (اختياري) و mustn''t (منع وحظر)", "استخدام الزمن المضارع أو will داخل جملة فعل الشرط في الحالة الثانية"]'::jsonb,
      '["Confusing ''don''t have to'' (optional) with ''mustn''t'' (strictly forbidden)", "Placing ''will'' or Present tense directly inside an imaginary Second Conditional ''if'' clause"]'::jsonb),
    ('eng-truth-lies',
      '["الخلط في الفعل المباشر وغير المباشر عند نقل الزمن وتغيير الظروف الزمانية والمكانية", "توقع الفعل المتبوع بـ to + infinitive بدل V-ing بعد أفعال مثل avoid و deny و admit"]'::jsonb,
      '["Forgetting tense backshift and time-expression changes in reported speech", "Using a to-infinitive instead of a gerund (-ing) after verbs like avoid, deny, and admit"]'::jsonb),
    ('eng-save-shine',
      '["معاملة الأسماء غير المعدودة مثل information و advice و equipment معاملة الجمع مع many أو few", "الخلط بين أفعال المتلازمات اللفظية do و make في التراكيب الأكاديمية"]'::jsonb,
      '["Treating uncountable nouns (information, advice, equipment) as plural with ''many'' or ''few''", "Mixing up academic verb-noun collocations between ''do'' and ''make''"]'::jsonb),
    ('eng-technology-schools',
      '["إهمال علامات صيغ المستقبل الدقيقة (will للقرار الفوري والتوقع دون دليل vs going to للخطة المسبقة)", "استخدام صفات الملكية أو ضمائر الوصل دون الالتزام بسياق العاقل وغير العاقل والمكان"]'::jsonb,
      '["Confusing ''will'' (instant decisions/predictions) with ''going to'' (prior plans)", "Misusing relative pronouns (who/which/where) across human, non-human, and place antecedents"]'::jsonb),
    ('hist-civilization-history',
      '["الخلط بين مفهوم الحضارة (الإنتاج المادي والمعنوي) ومفهوم التاريخ (علم دراسة الماضي وتفسيره)", "الاعتقاد أن انتقال الحضارات خط مستقيم أحادي الاتجاه بدل كونه تواصلًا وتبادلًا", "حفظ التواريخ الفاصلة بين العصور بمعزل عن السمة الحضارية والتنويه التأريخي (١٧٨٩م)"]'::jsonb,
      '["Confusing civilization (human achievements) with history (the analytical study of the past)", "Viewing civilizational transfer as one-way instead of mutual cultural exchange", "Treating era boundaries like 1789 CE as rigid overnight breaks instead of historiographic conventions"]'::jsonb),
    ('hist-sources',
      '["الاعتقاد بأن كل مصدر أولي معفي من النقد والتحيز، رغم أن النقوش الملكية قد تبالغ دعائيًا", "عدّ الأساطير والملاحم الشعرية وقائع حرفية دون تمحيص بسياقها وتأييدها", "الخلط بين البرديات والأوستراكا من حيث المادة والتكلفة والاستخدام"]'::jsonb,
      '["Assuming a primary source cannot be biased, even though royal stelae glorify rulers", "Taking literary myths or epics as literal history without independent corroboration", "Confusing papyrus scrolls with ostraca pottery shards in daily administrative use"]'::jsonb),
    ('hist-civilization-factors',
      '["تفسير مقولة هيرودوت «مصر هبة النيل» بإغفال كفاح الإنسان المصري وتنظيمه وإدارته", "اعتبار الصحارى حدودًا عازلة تامّة منعت التجارة والاتصال رغم وجود معابر وقوافل"]'::jsonb,
      '["Reading ''Egypt is the gift of the Nile'' literally while ignoring human labor and governance", "Treating Egypt''s natural desert borders as absolute isolation from trade and contact"]'::jsonb),
    ('hist-ancient-egypt',
      '["الخلط بين الأسرة الحاكمة والدولة الكبرى وعصر الانتقال (الاضمحلال)", "عدم التمييز بين أدوار ملوك الدولة الحديثة في البناء والتجارة والإصلاح الديني والحملات العسكرية"]'::jsonb,
      '["Confusing a ruling dynasty, a unified major kingdom, and an intermediate period", "Blurring the distinct historical roles of New Kingdom rulers across trade, diplomacy, and campaigns"]'::jsonb),
    ('hist-economy',
      '["قصر اقتصاد مصر القديمة على الزراعة وإغفال التجارة النيلية والبعثات الخارجية والصناعات الحرفية", "إغفال دور الدولة ومخازن الحبوب والري العام في مواجهة تقلب الفيضان"]'::jsonb,
      '["Reducing Ancient Egypt''s economy solely to farming while overlooking Nile transport, crafts, and foreign expeditions", "Overlooking state administration of irrigation, granaries, and taxation across flood cycles"]'::jsonb)
)
update public.lessons l
set content = coalesce(l.content, '{}'::jsonb)
  || case
       when coalesce(jsonb_array_length(l.content->'common_mistakes_ar'), 0) = 0
         then jsonb_build_object('common_mistakes_ar', tm.mistakes_ar)
       else '{}'::jsonb
     end
  || case
       when coalesce(jsonb_array_length(l.content->'common_mistakes_en'), 0) = 0
         then jsonb_build_object('common_mistakes_en', tm.mistakes_en)
       else '{}'::jsonb
     end
from target_mistakes tm
where l.slug in (tm.base_slug, tm.base_slug || '-en')
  and (
    coalesce(jsonb_array_length(l.content->'common_mistakes_ar'), 0) = 0
    or coalesce(jsonb_array_length(l.content->'common_mistakes_en'), 0) = 0
  );
