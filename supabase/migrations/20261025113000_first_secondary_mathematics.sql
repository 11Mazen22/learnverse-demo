-- First Secondary Term 1 (2026-2027) — Unit 3: Mathematics
-- Source: docs/curriculum/first_secondary_term1_first_lessons_study_pack_2026_2027.txt lines 398-625 (sha256 2b7fc532…)
-- Idempotent; math kept in plain Unicode as in the source (x², √, Δ, α, β, i²).

do $$
declare
  v_course_id uuid;
  v_unit_id uuid;
  v_skill_complex uuid;
  v_skill_quadratic uuid;
  v_skill_solving uuid;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_l4 uuid; v_l5 uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_prov jsonb := jsonb_build_object(
    'curriculum', true,
    'source_document', 'first_secondary_term1_first_lessons_study_pack_2026_2027.txt',
    'source_sha256', '2b7fc53252e02b1885df3c1d3141d163bb038eb6cb4d917c0d0c29addcfb5c28',
    'subject', 'mathematics',
    'provenance_ar', 'محتوى مبني على دليل مذاكرة أصلي ومفصّل، وليس نسخة حرفية من الكتاب المدرسي.',
    'provenance_en', 'Content built from an original detailed study guide, not a verbatim copy of the school textbook.'
  );
begin
  select id into v_course_id from public.courses where slug = 'first-secondary-term1-2026-2027' limit 1;
  if v_course_id is null then
    raise exception 'Course first-secondary-term1-2026-2027 not found. Run migration 20261025100000 first.';
  end if;
  select id into v_unit_id from public.units where course_id = v_course_id and position = 3 limit 1;
  if v_unit_id is null then
    raise exception 'Unit Mathematics (position 3) not found. Run migration 20261025100000 first.';
  end if;

  insert into public.skills (course_id, slug, title_ar, title_en) values
    (v_course_id, 'math-complex-numbers', 'التعامل مع الأعداد المركبة وقوى i', 'Work with complex numbers and powers of i'),
    (v_course_id, 'math-quadratic-analysis', 'تحليل جذور المعادلة التربيعية وإشارتها', 'Analyze quadratic roots and sign'),
    (v_course_id, 'math-quadratic-solving', 'حل المتباينات التربيعية وتكوين المعادلات', 'Solve quadratic inequalities and form equations')
  on conflict (course_id, slug) do update
    set title_ar = excluded.title_ar, title_en = excluded.title_en;
  select id into v_skill_complex from public.skills where course_id = v_course_id and slug = 'math-complex-numbers' limit 1;
  select id into v_skill_quadratic from public.skills where course_id = v_course_id and slug = 'math-quadratic-analysis' limit 1;
  select id into v_skill_solving from public.skills where course_id = v_course_id and slug = 'math-quadratic-solving' limit 1;

  -- Lesson 1: Introduction to Complex Numbers
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 1, 'math-complex-intro', 'مدخل إلى الأعداد المركبة', 'Introduction to Complex Numbers', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'summary_ar', 'لا يوجد عدد حقيقي مربعه −1؛ ولحل معادلات مثل x² + 1 = 0 نعرّف الوحدة التخيلية i بحيث i² = −1، فتوسع الأعداد المركبة نظام الأعداد الحقيقية وتتيح حل المعادلات التربيعية ذات المميز السالب. قوى i تتكرر في دورة من أربع: i¹ = i، i² = −1، i³ = −i، i⁴ = 1؛ ولتبسيط iⁿ اقسم n على 4 واستخدم الباقي: i⁷ = i⁴ × i³ = −i، وi¹⁰ = i⁸ × i² = −1. العدد المركب يكتب z = a + bi حيث a وb حقيقيان: الجزء الحقيقي Re(z) = a، والمعامل التخيلي Im(z) = b (معامل i وليس الحد bi كله)؛ وإذا كان b = 0 فالعدد حقيقي، وإذا كان a = 0 وb ≠ 0 فهو تخيلي خالص. ويتساوى عددان مركبان إذا وفقط إذا تساوى جزءاهما الحقيقيان ومعاملاهما التخيليان على حدة: إذا كان 3 + (x − 2)i = 3 + 5i فإن x − 2 = 5 أي x = 7. الجمع والطرح يجمع الجزأين الحقيقي والتخيلي على حدة: (2 + 3i) + (4 − i) = 6 + 2i، و(5 + 2i) − (1 + 7i) = 4 − 5i. الضرب بالقانون التوزيعي ثم التعويض عن i² بـ −1: (2 + i)(3 − 2i) = 6 − 4i + 3i − 2i² = 8 − i. مرافق العدد z = a + bi هو z̄ = a − bi، وحاصل ضرب العدد في مرافقه عدد حقيقي: (a + bi)(a − bi) = a² + b²؛ وللقسمة على عدد مركب غير صفري نضرب البسط والمقام في مرافق المقام، مثال الدليل: (1 + i)/(1 − i) × (1 + i)/(1 + i) = (1 + 2i + i²)/2 = 2i/2 = i. ومن الأخطاء الشائعة: نسيان i² = −1، ومعاملة bi كمعامل تخيلي بدل b، ونسيان قلب إشارة الحد التخيلي في المرافق، والقسمة على الجزأين على حدة.',
      'summary_en', 'No real number squares to −1; to solve equations like x² + 1 = 0 we define the imaginary unit i by i² = −1. Complex numbers extend the real system and let quadratic equations with negative discriminants have solutions. Powers of i repeat in a cycle of four: i¹ = i, i² = −1, i³ = −i, i⁴ = 1; to simplify iⁿ divide n by 4 and use the remainder: i⁷ = i⁴ × i³ = −i, i¹⁰ = i⁸ × i² = −1. A complex number is z = a + bi with real a, b: Re(z) = a, Im(z) = b (the coefficient of i, not the whole term bi); if b = 0 the number is real; if a = 0 and b ≠ 0 purely imaginary. Two complex numbers are equal iff real parts and imaginary coefficients match separately: from 3 + (x − 2)i = 3 + 5i we get x − 2 = 5, so x = 7. Addition/subtraction combine parts separately: (2 + 3i) + (4 − i) = 6 + 2i; (5 + 2i) − (1 + 7i) = 4 − 5i. Multiplication expands distributively then replaces i² with −1: (2 + i)(3 − 2i) = 6 − 4i + 3i − 2i² = 8 − i. The conjugate of z = a + bi is z̄ = a − bi; a number times its conjugate is real: (a + bi)(a − bi) = a² + b². To divide by a non-zero complex number multiply numerator and denominator by the denominator''s conjugate: (1 + i)/(1 − i) × (1 + i)/(1 + i) = (1 + 2i + i²)/2 = 2i/2 = i. Common mistakes: forgetting i² = −1, treating bi as the imaginary coefficient instead of b, forgetting to flip the imaginary sign in the conjugate, dividing real and imaginary parts separately.',
      'worked_ar', 'مثال محلول من الدليل: (1 + i)/(1 − i) — نضرب في مرافق المقام: (1 + i)/(1 − i) × (1 + i)/(1 + i) = (1 + 2i + i²)/(1 − i²) = (1 + 2i + i²)/2 = 2i/2 = i.',
      'worked_en', 'Worked example from the guide: (1 + i)/(1 − i) — multiply by the conjugate: (1 + i)/(1 − i) × (1 + i)/(1 + i) = (1 + 2i + i²)/(1 − i²) = (1 + 2i + i²)/2 = 2i/2 = i.',
      'objectives_ar', jsonb_build_array('تبسيط قوى i باستخدام الدورة الرباعية', 'تحديد الجزء الحقيقي والمعامل التخيلي', 'إجراء الجمع والطرح والضرب والأقتران', 'القسمة على عدد مركب بضرب مرافق المقام'),
      'objectives_en', jsonb_build_array('Simplify powers of i using the four-cycle', 'Identify real part and imaginary coefficient', 'Add, subtract, multiply and conjugate', 'Divide by a complex number via the conjugate'),
      'common_mistakes_ar', jsonb_build_array('نسيان أن i² = −1', 'معاملة bi على أنها المعامل التخيلي بدل b', 'نسيان تغيير إشارة الحد التخيلي في المرافق', 'القسمة على الجزأين الحقيقي والتخيلي على حدة'),
      'common_mistakes_en', jsonb_build_array('Forgetting that i² = −1', 'Treating bi as the imaginary coefficient rather than b', 'Forgetting to flip the imaginary term''s sign in the conjugate', 'Dividing real and imaginary parts separately'),
      'check_ar', jsonb_build_array('بسّط i¹⁴.', 'احسب (3 + 2i) + (1 − 5i).', 'احسب (2 + i)(2 − i).'),
      'check_en', jsonb_build_array('Simplify i¹⁴.', 'Calculate (3 + 2i) + (1 − 5i).', 'Calculate (2 + i)(2 − i).')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l1 from public.lessons where unit_id = v_unit_id and slug = 'math-complex-intro' limit 1;

  -- Lesson 2: Determining the Nature of the Roots
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 2, 'math-nature-of-roots', 'تحديد نوع جذور المعادلة التربيعية', 'Determining the Nature of the Roots of a Quadratic Equation', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l1::text,
      'summary_ar', 'المعادلة التربيعية في الصورة العامة ax² + bx + c = 0 حيث a ≠ 0، ومميزها Δ = b² − 4ac، والصيغة العامة للجذور x = (−b ± √Δ)/(2a). إشارة المميز تحدد نوع الجذور دون حسابها كاملة: إذا كان Δ > 0 فالمعادلة لها جذران حقيقيان مختلفان؛ وإذا كان Δ = 0 فلها جذران حقيقيان متساويان والجذر المضاعف هو −b/(2a)؛ وإذا كان Δ < 0 فلا جذور حقيقية، ومع معاملات حقيقية يكون الجذران مركبين مترافقين غير حقيقيين. والمعنى البياني: الرسم y = ax² + bx + c قطع مكافئ وجذوره الحقيقية هي إحداثيات x لنقاط تقاطعه مع محور x؛ فΔ > 0 يعني تقاطعًا في نقطتين، وΔ = 0 تماسًا في نقطة واحدة، وΔ < 0 عدم تقاطع. أمثلة الدليل: x² − 5x + 6 = 0 فمميزها (−5)² − 4(1)(6) = 25 − 24 = 1 > 0 فجذران حقيقيان مختلفان؛ وx² + 4x + 4 = 0 فمميزها 16 − 16 = 0 فجذران متساويان؛ وx² + x + 1 = 0 فمميزها 1 − 4 = −3 < 0 فلا جذور حقيقية. ولإيجاد قيمة معامل مجهول: جذران متساويان يعني ضبط Δ = 0، وجذران مختلفان يعني Δ > 0، ولا جذور حقيقية يعني Δ < 0؛ مثال: x² + kx + 9 = 0 لها جذران متساويان عند k² − 36 = 0 أي k = ±6.',
      'summary_en', 'A quadratic equation in general form ax² + bx + c = 0, a ≠ 0, has discriminant Δ = b² − 4ac and quadratic formula x = (−b ± √Δ)/(2a). The discriminant''s sign determines the nature of the roots without computing them: Δ > 0 two distinct real roots; Δ = 0 two equal real roots, the repeated root being −b/(2a); Δ < 0 no real roots — with real coefficients, a pair of non-real complex conjugates. Graphical meaning: y = ax² + bx + c is a parabola whose real roots are the x-coordinates of its intersections with the x-axis; Δ > 0 crosses at two points, Δ = 0 touches at one, Δ < 0 does not intersect. Guide examples: x² − 5x + 6 = 0 has Δ = 25 − 24 = 1 > 0 (distinct real); x² + 4x + 4 = 0 has Δ = 16 − 16 = 0 (equal); x² + x + 1 = 0 has Δ = −3 < 0 (no real roots). To find an unknown parameter: equal roots mean Δ = 0; distinct real roots mean Δ > 0; no real roots mean Δ < 0 — e.g. x² + kx + 9 = 0 has equal roots when k² − 36 = 0, so k = ±6.',
      'worked_ar', 'مثال محلول من الدليل: حدد نوع جذري 2x² − 3x + 1 = 0 — Δ = (−3)² − 4(2)(1) = 9 − 8 = 1 > 0 فجذران حقيقيان مختلفان. ولـ x² + 2x + 5 = 0 — Δ = 4 − 20 = −16 < 0 فلا جذور حقيقية.',
      'worked_en', 'Worked example from the guide: determine the nature of the roots of 2x² − 3x + 1 = 0 — Δ = 9 − 8 = 1 > 0, two distinct real roots. For x² + 2x + 5 = 0 — Δ = 4 − 20 = −16 < 0, no real roots.',
      'objectives_ar', jsonb_build_array('حساب مميز معادلة تربيعية', 'تحديد نوع الجذور من إشارة المميز', 'ربط نوع الجذور بتقاطع القطع المكافئ مع محور x', 'إيجاد قيمة معامل عند شرط على نوع الجذور'),
      'objectives_en', jsonb_build_array('Compute a quadratic''s discriminant', 'Determine the roots'' nature from the discriminant''s sign', 'Link root nature to the parabola''s x-axis intersections', 'Find a parameter value given a root-nature condition'),
      'common_mistakes_ar', jsonb_build_array('نسيان تربيع إشارة b في Δ = b² − 4ac', 'خطأ جمع الحدود في 4ac', 'الخلط بين الجذور المتساوية والمختلفة عند Δ = 0'),
      'common_mistakes_en', jsonb_build_array('Forgetting to square b''s sign in Δ = b² − 4ac', 'Arithmetic slips in 4ac', 'Confusing equal and distinct roots at Δ = 0'),
      'check_ar', jsonb_build_array('حدد نوع جذري 2x² − 3x + 1 = 0.', 'حدد نوع جذري x² + 2x + 5 = 0.', 'متى تكون لـ x² + kx + 9 = 0 جذران متساويان؟'),
      'check_en', jsonb_build_array('Determine the nature of the roots of 2x² − 3x + 1 = 0.', 'Determine the nature of the roots of x² + 2x + 5 = 0.', 'When does x² + kx + 9 = 0 have equal roots?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l2 from public.lessons where unit_id = v_unit_id and slug = 'math-nature-of-roots' limit 1;

  -- Lesson 3: The Relation Between Roots and Coefficients
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 3, 'math-roots-coefficients', 'العلاقة بين الجذرين والمعاملات', 'The Relation Between Roots and Coefficients', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l2::text,
      'summary_ar', 'إذا كان α وβ جذري المعادلة ax² + bx + c = 0 حيث a ≠ 0 فإن مجموعهما α + β = −b/a وحاصل ضربهما αβ = c/a، وتعرف هذه العلاقات بصيغ فييتا؛ وهي تتيح تكوين المعادلات وتبسيط العبارات دون حل الجذرين كل على حدة. للتحقق: في x² − 5x + 6 = 0 مجموع الجذرين 5 وضربهما 6، والعددان 2 و3 يحققان الشرطين. ولتكوين معادلة من جذريها α وβ نكتب الصورة المونية x² − (α + β)x + αβ = 0؛ فإذا كانا 4 و−1 فالمجموع 3 والضرب −4 والمعادلة x² − 3x − 4 = 0. ومن مجموع S وضرب P: x² − Sx + P = 0، وإذا لزم معامل رئيسي غير صفرية آخر نضرب المعادلة كلها فيه وتظل الجذور كما هي. ولتبسيط العبارات: بوضع S = α + β وP = αβ نحصل على α² + β² = (α + β)² − 2αβ = S² − 2P، و(α − β)² = (α + β)² − 4αβ = S² − 4P، و1/α + 1/β = (α + β)/(αβ) = S/P بشرط P ≠ 0. مثال الدليل المحلول: مجموع الجذرين 7 وضربهما 10، فα² + β² = 7² − 2(10) = 29، والمعادلة x² − 7x + 10 = 0. ومن الأخطاء الشائعة: إسقاط الإشارة السالبة في مجموع الجذرين، واستخدام c/b بدل c/a للضرب، وكتابة x² + Sx + P بدل x² − Sx + P، والقسمة على αβ دون التحقق من عدم يساويه صفرًا.',
      'summary_en', 'If α and β are the roots of ax² + bx + c = 0 (a ≠ 0), then α + β = −b/a and αβ = c/a — Vieta''s formulas — letting us form equations and simplify expressions without solving for each root. Check: in x² − 5x + 6 = 0 the sum is 5 and product 6, satisfied by 2 and 3. To form a monic quadratic from roots α, β: x² − (α + β)x + αβ = 0; for roots 4 and −1, sum 3 and product −4 give x² − 3x − 4 = 0. From sum S and product P: x² − Sx + P = 0; multiplying the whole equation by another non-zero leading coefficient keeps the roots unchanged. Simplifying: with S = α + β, P = αβ — α² + β² = (α + β)² − 2αβ = S² − 2P; (α − β)² = (α + β)² − 4αβ = S² − 4P; 1/α + 1/β = (α + β)/(αβ) = S/P provided P ≠ 0. Guide''s worked example: sum 7, product 10 → α² + β² = 7² − 2(10) = 29 and the equation x² − 7x + 10 = 0. Common mistakes: dropping the negative sign in the sum, using c/b instead of c/a for the product, writing x² + Sx + P instead of x² − Sx + P, dividing by αβ without checking it is non-zero.',
      'worked_ar', 'مثال محلول من الدليل: مجموع الجذرين −2 وضربهما −8 — المعادلة المونية x² − (−2)x + (−8) = x² + 2x − 8 = 0، وα² + β² = (−2)² − 2(−8) = 4 + 16 = 20.',
      'worked_en', 'Worked example from the guide: sum −2, product −8 — the monic equation is x² − (−2)x + (−8) = x² + 2x − 8 = 0, and α² + β² = (−2)² − 2(−8) = 4 + 16 = 20.',
      'objectives_ar', jsonb_build_array('استخدام α + β = −b/a وαβ = c/a', 'تكوين معادلة تربيعية من جذريها', 'تكوين معادلة من مجموع وضرب معلومين', 'تبسيط α² + β² وعبارات مشابهة باستخدام S وP'),
      'objectives_en', jsonb_build_array('Use α + β = −b/a and αβ = c/a', 'Form a quadratic from its two roots', 'Form an equation from a given sum and product', 'Simplify α² + β² and similar expressions via S and P'),
      'common_mistakes_ar', jsonb_build_array('إسقاط الإشارة السالبة في مجموع الجذرين', 'استخدام c/b بدل c/a', 'كتابة x² + Sx + P بدل x² − Sx + P', 'القسمة على αβ دون التحقق من عدم يساويه صفرًا'),
      'common_mistakes_en', jsonb_build_array('Dropping the negative sign in the sum', 'Using c/b instead of c/a', 'Writing x² + Sx + P instead of x² − Sx + P', 'Dividing by αβ without checking it is non-zero'),
      'check_ar', jsonb_build_array('مجموع جذري معادلة هو −2 وضربهما −8: أكتب المعادلة المونية واحسب α² + β².', 'ما مجموع جذري x² − 5x + 6 = 0 وضربهما؟'),
      'check_en', jsonb_build_array('The sum of two roots is −2 and their product −8: write the monic quadratic and α² + β².', 'What are the sum and product of the roots of x² − 5x + 6 = 0?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l3 from public.lessons where unit_id = v_unit_id and slug = 'math-roots-coefficients' limit 1;

  -- Lesson 4: The Sign of a Quadratic Function
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 4, 'math-sign-of-quadratic', 'إشارة الدالة التربيعية', 'The Sign of a Quadratic Function', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l3::text,
      'summary_ar', 'بالنسبة للدالة f(x) = ax² + bx + c حيث a ≠ 0 فإن تحديد الإشارة يعني إيجاد قيم x التي تكون عندها f(x) موجبة أو سالبة أو صفرية. الطريقة العامة: 1) أوجد الجذور الحقيقية بالتحليل أو الصيغة العامة، 2) ضع الجذور ترتيبًا تصاعديًا على مستقيم الأعداد، 3) استخدم إشارة المعامل الرئيسي وإشارات العوامل لتحديد الإشارة في كل فترة، 4) وضح صراحة الأماكن التي تنعدم فيها الدالة. الحالة الأولى جذران مختلفان r1 < r2: إذا كان a > 0 فالقطع مكافئ مفتوح لأعلى والدالة موجبة خارج الجذرين وسالبة بينهما؛ وإذا كان a < 0 فالفتحة لأسفل والسالبة خارج الجذرين والموجبة بينهما؛ وعند كل جذر f(x) = 0. الحالة الثانية جذر مضاعف (Δ = 0): القطع يلامس المحور ولا يقطعه، وتحفظ الدالة إشارة a على جانبي الجذر إلا أن قيمتها صفر عند الجذر المضاعف. الحالة الثالثة لا جذور حقيقية (Δ < 0): الرسم لا يقطع محور x وتحفظ الدالة إشارة a لكل x حقيقي: موجبة دائمًا إذا كان a > 0 وسالبة دائمًا إذا كان a < 0. مثال الدليل: f(x) = x² − 5x + 6 = (x − 2)(x − 3) جذراها 2 و3 وa = 1 > 0، إذن f(x) > 0 لـ x < 2 أو x > 3، وf(x) < 0 لـ 2 < x < 3، وf(x) = 0 عند x = 2 وx = 3. ومثال آخر: f(x) = −x² + 4 = −(x − 2)(x + 2) جذراها −2 و2 وa < 0 فالسالبة خارج الجذرين والموجبة بينهما وصفرية عند −2 و2.',
      'summary_en', 'For f(x) = ax² + bx + c with a ≠ 0, determining the sign means finding where f(x) is positive, negative or zero. General method: 1) find the real roots by factoring or the formula, 2) place them in increasing order on a number line, 3) use the leading coefficient and factor signs per interval, 4) state explicitly where the function equals zero. Case 1, two distinct roots r1 < r2: if a > 0 the parabola opens upward — positive outside the roots, negative between them; if a < 0 downward — negative outside, positive between; f(x) = 0 at each root. Case 2, repeated root (Δ = 0): the parabola touches the axis without crossing; the function keeps the sign of a on both sides, zero at the repeated root. Case 3, no real roots (Δ < 0): no intersection with the x-axis; the function keeps the sign of a for every real x — always positive if a > 0, always negative if a < 0. Guide example: f(x) = x² − 5x + 6 = (x − 2)(x − 3), roots 2 and 3, a = 1 > 0: f(x) > 0 for x < 2 or x > 3, f(x) < 0 for 2 < x < 3, zero at x = 2, 3. Another: f(x) = −x² + 4 = −(x − 2)(x + 2), roots −2 and 2, a < 0: negative outside the roots, positive between, zero at −2 and 2.',
      'worked_ar', 'مثال محلول من الدليل: حدد إشارة f(x) = x² − 9 — نحلل (x − 3)(x + 3) فالجذران −3 و3 وa = 1 > 0؛ إذن موجبة لـ x < −3 أو x > 3، وسالبة لـ −3 < x < 3، وصفرية عند x = ±3.',
      'worked_en', 'Worked example from the guide: determine the sign of f(x) = x² − 9 — factor (x − 3)(x + 3), roots −3 and 3, a = 1 > 0; positive for x < −3 or x > 3, negative for −3 < x < 3, zero at x = ±3.',
      'objectives_ar', jsonb_build_array('تحديد إشارة دالة تربيعية بجدول إشارات', 'ربط الإشارة بإشارة المعامل الرئيسي وموقع الجذور', 'معالجة حالة الجذر المضاعف وحالة عدم وجود جذور'),
      'objectives_en', jsonb_build_array('Determine a quadratic''s sign with a sign chart', 'Relate the sign to the leading coefficient and root positions', 'Handle the repeated-root and no-roots cases'),
      'common_mistakes_ar', jsonb_build_array('نسيان إشارة المعامل الرئيسي', 'إهمال النقاط التي تنعدم عندها الدالة', 'الخلط بين داخل الجذرين وخارجهما في حالة a < 0'),
      'common_mistakes_en', jsonb_build_array('Forgetting the leading coefficient''s sign', 'Omitting the zeros of the function', 'Mixing up between-roots and outside for a < 0'),
      'check_ar', jsonb_build_array('حدد إشارة f(x) = x² − 9.', 'ما إشارة f(x) = −x² + 4 بين الجذرين وخارجهما؟'),
      'check_en', jsonb_build_array('Determine the sign of f(x) = x² − 9.', 'What is the sign of f(x) = −x² + 4 between and outside its roots?')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l4 from public.lessons where unit_id = v_unit_id and slug = 'math-sign-of-quadratic' limit 1;

  -- Lesson 5: Quadratic Inequalities in One Variable
  insert into public.lessons (unit_id, position, slug, title_ar, title_en, xp_reward, coin_reward, content)
  values (v_unit_id, 5, 'math-quadratic-inequalities', 'المتباينات التربيعية في متغير واحد', 'Quadratic Inequalities in One Variable', 15, 25,
    v_prov || jsonb_build_object(
      'duration_minutes', 10,
      'prerequisite_lesson_id', v_l4::text,
      'summary_ar', 'المتباينة التربيعية تحتوي تعبيرًا تربيعيًا وعلامة تباين: > أو < أو ≥ أو ≤. الطريقة المعتادة: نقل جميع الحدود إلى طرف واحد، ثم إيجاد الأصفار، ثم تحليل الإشارة على الفترات الناتجة. الخطوات: 1) رتب المتباينة بحيث يكون أحد الطرفين صفرًا، 2) حلل التربيعي أو احسب جذوره، 3) ضع الجذور على مستقيم الأعداد، 4) حدد أماكن الإيجاب والسلب، 5) اختر الفترات المطابقة للإشارة المطلوبة، 6) أدرج الجذور عند ≥ أو ≤ واستبعدها عند > أو < ما لم يوجد قيد نطاق آخر. أمثلة الدليل: x² − 5x + 6 > 0 يتحلل (x − 2)(x − 3) > 0 والمعامل موجب فالإيجاب خارج الجذرين والحل x < 2 أو x > 3 أي الفترة (−∞, 2) ∪ (3, ∞)؛ وx² − 5x + 6 ≤ 0 حله 2 ≤ x ≤ 3 أي الفترة [2, 3]؛ و−x² + 4 ≥ 0 بعد الترتيب x² ≤ 4 أي −2 ≤ x ≤ 2؛ و(x − 1)(x + 4) < 0 حله −4 < x < 1 لأن الجداء سالب بين الجذرين. ومن الأخطاء المتكررة: التوقف عند إيجاد الجذور ولم تكن هي الحل بل حدودًا، ونسيان إشارة المعامل الرئيسي، وإدراج الأطراف في المتباينة الدقيقة، واستخدام فترة واحدة عندما يكون الحل فترتين منفصلتين.',
      'summary_en', 'A quadratic inequality combines a quadratic expression with >, <, ≥ or ≤. The usual method: move all terms to one side, find the zeros, analyse the sign over the intervals. Steps: 1) rearrange so one side is zero, 2) factor the quadratic or compute its roots, 3) mark the roots on a number line, 4) determine where the expression is positive or negative, 5) select the intervals matching the requested sign, 6) include roots for ≥ or ≤ and exclude them for strict > or < unless another domain restriction applies. Guide examples: x² − 5x + 6 > 0 factors as (x − 2)(x − 3) > 0 with positive leading coefficient — positive outside the roots, so x < 2 or x > 3, i.e. (−∞, 2) ∪ (3, ∞); x² − 5x + 6 ≤ 0 gives 2 ≤ x ≤ 3, i.e. [2, 3]; −x² + 4 ≥ 0 rearranges to x² ≤ 4, so −2 ≤ x ≤ 2; (x − 1)(x + 4) < 0 gives −4 < x < 1 as the product is negative between the roots. Frequent errors: stopping at the roots (they are boundaries, not the solution), forgetting the leading coefficient''s sign, including endpoints in strict inequalities, using one interval when the solution has two separate ones.',
      'worked_ar', 'مثال محلول من الدليل: حل x² − 5x + 6 > 0 — التحليل (x − 2)(x − 3) > 0، الجذران 2 و3 والمعامل الرئيسي موجب؛ الحل: x < 2 أو x > 3؛ وبترميز الفترات: (−∞, 2) ∪ (3, ∞).',
      'worked_en', 'Worked example from the guide: solve x² − 5x + 6 > 0 — factor (x − 2)(x − 3) > 0, roots 2 and 3, positive leading coefficient; solution x < 2 or x > 3; in interval notation (−∞, 2) ∪ (3, ∞).',
      'objectives_ar', jsonb_build_array('حل متباينة تربيعية بخطوات مرتبة', 'كتابة الحل بترميز الفترات', 'معالجة الفرق بين ≥ و > عند الأطراف', 'كشف الأخطاء الشائعة في حل المتباينات'),
      'objectives_en', jsonb_build_array('Solve a quadratic inequality step by step', 'Write the solution in interval notation', 'Handle ≥ versus > at endpoints', 'Spot common inequality-solving errors'),
      'common_mistakes_ar', jsonb_build_array('التوقف عند إيجاد الجذور مع أنها حدود لا حل', 'نسيان إشارة المعامل الرئيسي', 'إدراج الأطراف في المتباينة الدقيقة', 'استخدام فترة واحدة عندما يكون الحل فترتين'),
      'common_mistakes_en', jsonb_build_array('Stopping at the roots though they are boundaries, not the solution', 'Forgetting the leading coefficient''s sign', 'Including endpoints in a strict inequality', 'Using one interval when the solution has two'),
      'check_ar', jsonb_build_array('حل x² − 5x + 6 > 0.', 'حل x² − 5x + 6 ≤ 0.', 'حل (x − 1)(x + 4) < 0.'),
      'check_en', jsonb_build_array('Solve x² − 5x + 6 > 0.', 'Solve x² − 5x + 6 ≤ 0.', 'Solve (x − 1)(x + 4) < 0.')
    ))
  on conflict (unit_id, slug) do update
    set position = excluded.position, title_ar = excluded.title_ar, title_en = excluded.title_en,
        xp_reward = excluded.xp_reward, coin_reward = excluded.coin_reward, content = excluded.content;
  select id into v_l5 from public.lessons where unit_id = v_unit_id and slug = 'math-quadratic-inequalities' limit 1;

  -- ===== Lesson 1 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l1 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_complex, null, 0.9,
      'بسّط i¹⁴ وفق دورة قوى i في الدليل.',
      'Simplify i¹⁴ using the cycle of powers of i.',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["−1","i","−i","1"]'::jsonb,
      '["−1","i","−i","1"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"14 = 4×3 + 2 فالباقي 2 وليس 1.","2":"الباقي 2 يعطي i² لا i³."}}'::jsonb,
    'i¹⁴ = i¹² × i² = (i⁴)³ × i² = 1 × (−1) = −1 كما في إجابات الدليل: اقسم الأس على 4 فالباقي 2.',
    'i¹⁴ = i¹² × i² = (i⁴)³ × i² = 1 × (−1) = −1 per the guide''s answers: divide the exponent by 4, remainder 2.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l1 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_complex, null, 0.95,
      'ما المعامل التخيلي للعدد المركب z = 3 + 5i وفق تعريف الدليل؟',
      'What is the imaginary coefficient of z = 3 + 5i per the guide''s definition?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["5","5i","3","3i"]'::jsonb,
      '["5","5i","3","3i"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"Im(z) هو معامل i وهو b = 5، وليس الحد bi كله."}}'::jsonb,
    'يشدد الدليل على أن Im(z) = b هو معامل i وليس الحد bi كله؛ فالمعامل التخيلي هنا 5.',
    'The guide stresses Im(z) = b is the coefficient of i, not the whole term bi; here the imaginary coefficient is 5.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l1 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_complex, null, 1.0,
      'احسب ناتج (2 + i)(2 − i).',
      'Calculate (2 + i)(2 − i).',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["5","4 − 1i","3 + 4i","−3"]'::jsonb,
      '["5","4 − i","3 + 4i","−3"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    '(2 + i)(2 − i) = 4 − 2i + 2i − i² = 4 − (−1) = 5؛ وهذه إجابة الدليل نفسها، وهي تطبيق مباشر لـ (a + bi)(a − bi) = a² + b².',
    '(2 + i)(2 − i) = 4 − 2i + 2i − i² = 4 − (−1) = 5 — the guide''s own answer, a direct use of (a + bi)(a − bi) = a² + b².'
  );

  select id into v_q4 from public.questions where lesson_id = v_l1 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l1, v_skill_complex, null, 1.0,
      'إذا كان 3 + (x − 2)i = 3 + 5i فما قيمة x وفق شرط تساوي العددين المركبين؟',
      'If 3 + (x − 2)i = 3 + 5i, what is x by the equality condition for complex numbers?',
      'approved', 'published_demo', 4, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"numeric","correctAnswer":7,"tolerance":0.01}'::jsonb,
    'يتساوى العددان المركبان عند تساوي الجزأين الحقيقيين والمعاملين التخيليين على حدة؛ إذن x − 2 = 5 أي x = 7.',
    'Complex numbers are equal when real parts and imaginary coefficients match separately; so x − 2 = 5, i.e. x = 7.'
  );

  -- ===== Lesson 2 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l2 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_quadratic, null, 0.9,
      'ما مميز المعادلة x² − 5x + 6 = 0؟',
      'What is the discriminant of x² − 5x + 6 = 0?',
      'approved', 'published_demo', 1, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"numeric","correctAnswer":1,"tolerance":0.01}'::jsonb,
    'Δ = b² − 4ac = (−5)² − 4(1)(6) = 25 − 24 = 1 > 0 فجذران حقيقيان مختلفان كما في مثال الدليل A.',
    'Δ = b² − 4ac = (−5)² − 4(1)(6) = 25 − 24 = 1 > 0, so two distinct real roots — guide''s Example A.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l2 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_quadratic, null, 1.0,
      'ما نوع جذري المعادلة x² + 2x + 5 = 0؟',
      'What is the nature of the roots of x² + 2x + 5 = 0?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["لا جذور حقيقية لأن Δ = −16 < 0","جذران حقيقيان مختلفان لأن Δ = 16","جذران متساويان لأن Δ = 0","جذر حقيقي واحد فقط"]'::jsonb,
      '["No real roots because Δ = −16 < 0","Two distinct real roots because Δ = 16","Two equal roots because Δ = 0","Exactly one real root"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"Δ = 2² − 4(1)(5) = 4 − 20 سالبة لا موجبة."}}'::jsonb,
    'Δ = 4 − 20 = −16 < 0 فلا جذور حقيقية؛ ومع معاملات حقيقية يكون الجذران مركبين مترافقين كما يوضح الدليل.',
    'Δ = 4 − 20 = −16 < 0 so no real roots; with real coefficients the roots are a complex conjugate pair as the guide explains.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l2 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_quadratic, null, 1.05,
      'لأي قيمة من k تكون لـ x² + kx + 9 = 0 جذران حقيقيان متساويان؟ (أدخل القيمة الموجبة)',
      'For which k does x² + kx + 9 = 0 have two equal real roots? (Enter the positive value)',
      'approved', 'published_demo', 3, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"numeric","correctAnswer":6,"tolerance":0.01}'::jsonb,
    'الجذران متساويان عند Δ = 0: k² − 4(1)(9) = k² − 36 = 0 أي k = ±6؛ والقيمة الموجبة 6 كما في مثال الدليل.',
    'Equal roots mean Δ = 0: k² − 4(1)(9) = k² − 36 = 0, so k = ±6; the positive value is 6 per the guide''s example.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l2 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l2, v_skill_quadratic, null, 1.0,
      'إذا كان Δ < 0 لمعادلة تربيعية بمعاملات حقيقية، فكيف يظهر ذلك في رسم y = ax² + bx + c؟',
      'If Δ < 0 for a quadratic with real coefficients, how does that appear in the graph of y = ax² + bx + c?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["لا يقطع القطع المكافئ محور x","يقطع محور x في نقطتين","يلامس محور x في نقطة واحدة","يمر دائمًا بنقطة الأصل"]'::jsonb,
      '["The parabola does not intersect the x-axis","It crosses the x-axis at two points","It touches the x-axis at one point","It always passes through the origin"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'المعنى البياني في الدليل: Δ > 0 تقاطع في نقطتين، وΔ = 0 تماس في نقطة واحدة، وΔ < 0 عدم تقاطع مع محور x.',
    'The guide''s graphical meaning: Δ > 0 crosses at two points, Δ = 0 touches at one, Δ < 0 does not intersect the x-axis.'
  );

  -- ===== Lesson 3 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l3 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_quadratic, null, 0.9,
      'ما مجموع الجذرين وحاصل ضربهما للمعادلة x² − 5x + 6 = 0 وفق صيغ فييتا؟',
      'What are the sum and product of the roots of x² − 5x + 6 = 0 by Vieta''s formulas?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["المجموع 5 والضرب 6","المجموع −5 والضرب 6","المجموع 5 والضرب −6","المجموع 6 والضرب 5"]'::jsonb,
      '["Sum 5, product 6","Sum −5, product 6","Sum 5, product −6","Sum 6, product 5"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"لا تنس الإشارة السالبة: المجموع = −b/a وليس b/a."}}'::jsonb,
    'α + β = −b/a = −(−5)/1 = 5 وαβ = c/a = 6/1 = 6، وهذا تحقق الدليل نفسه بالعددين 2 و3.',
    'α + β = −b/a = −(−5)/1 = 5 and αβ = c/a = 6/1 = 6 — exactly the guide''s check with 2 and 3.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l3 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_solving, null, 1.0,
      'أكتب المعادلة التربيعية المونية التي جذراها 4 و−1 وفق طريقة الدليل.',
      'Write the monic quadratic whose roots are 4 and −1, per the guide''s method.',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["x² − 3x − 4 = 0","x² + 3x − 4 = 0","x² − 3x + 4 = 0","x² + 4x − 3 = 0"]'::jsonb,
      '["x² − 3x − 4 = 0","x² + 3x − 4 = 0","x² − 3x + 4 = 0","x² + 4x − 3 = 0"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'x² − (α + β)x + αβ = 0؛ المجموع 4 + (−1) = 3 والضرب 4 × (−1) = −4، فالمعادلة x² − 3x − 4 = 0 كما في الدليل.',
    'x² − (α + β)x + αβ = 0; sum 4 + (−1) = 3 and product 4 × (−1) = −4 give x² − 3x − 4 = 0 as in the guide.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l3 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_solving, null, 1.05,
      'إذا كان مجموع جذري معادلة 7 وحاصل ضربهما 10، فما قيمة α² + β²؟',
      'If two roots have sum 7 and product 10, what is α² + β²?',
      'approved', 'published_demo', 3, 'numeric', '[]'::jsonb, '[]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"numeric","correctAnswer":29,"tolerance":0.01}'::jsonb,
    'α² + β² = (α + β)² − 2αβ = 7² − 2(10) = 49 − 20 = 29 كما في مثال الدليل المحلول.',
    'α² + β² = (α + β)² − 2αβ = 7² − 2(10) = 49 − 20 = 29, the guide''s worked example.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l3 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l3, v_skill_solving, null, 1.0,
      'مجموع جذري معادلة −2 وحاصل ضربهما −8. ما المعادلة المونية كما في تدريب الدليل؟',
      'Two roots have sum −2 and product −8. What is the monic quadratic, per the guide''s practice?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["x² + 2x − 8 = 0","x² − 2x − 8 = 0","x² + 2x + 8 = 0","x² − 8x + 2 = 0"]'::jsonb,
      '["x² + 2x − 8 = 0","x² − 2x − 8 = 0","x² + 2x + 8 = 0","x² − 8x + 2 = 0"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"المجموع −2 يعني معامل x هو −S = +2."}}'::jsonb,
    'x² − Sx + P = x² − (−2)x + (−8) = x² + 2x − 8 = 0؛ وإجابة الدليل نفسها مع α² + β² = 4 + 16 = 20.',
    'x² − Sx + P = x² − (−2)x + (−8) = x² + 2x − 8 = 0 — the guide''s answer, with α² + β² = 4 + 16 = 20.'
  );

  -- ===== Lesson 4 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l4 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_quadratic, null, 0.9,
      'ما إشارة f(x) = x² − 9 في الفترة −3 < x < 3؟',
      'What is the sign of f(x) = x² − 9 for −3 < x < 3?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["سالبة","موجبة","صفرية","موجبة أحيانًا وسالبة أحيانًا"]'::jsonb,
      '["Negative","Positive","Zero","Sometimes positive, sometimes negative"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'f(x) = (x − 3)(x + 3) والمعامل a = 1 > 0 فالدالة موجبة خارج الجذرين وسالبة بينهما؛ إجابة الدليل: سالبة لـ −3 < x < 3 وصفرية عند x = ±3.',
    'f(x) = (x − 3)(x + 3) with a = 1 > 0: positive outside the roots, negative between them — the guide''s answer: negative for −3 < x < 3, zero at x = ±3.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l4 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_quadratic, null, 1.0,
      'إذا كان للدالة التربيعية f(x) معامل رئيسي a < 0 ولا جذور حقيقية، فما إشارتها لكل x حقيقي؟',
      'If a quadratic f(x) has leading coefficient a < 0 and no real roots, what is its sign for every real x?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["سالبة دائمًا لأنها تحفظ إشارة a","موجبة دائمًا","صفرية عند نقطة واحدة","تتغير الإشارة عند نصف قيمة a"]'::jsonb,
      '["Always negative, keeping the sign of a","Always positive","Zero at one point","Changes sign at half of a"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الحالة الثالثة في الدليل: عند Δ < 0 لا يقطع الرسم محور x وتحفظ الدالة إشارة a لكل x حقيقي؛ فإذا كان a < 0 فهي سالبة دائمًا.',
    'Guide''s Case 3: with Δ < 0 the graph never meets the x-axis and the function keeps the sign of a; with a < 0 it is always negative.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l4 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_quadratic, null, 1.05,
      'الدالة f(x) لها جذر مضاعف واحد عند x = 1 وa > 0. ما الإشارة على جانبي x = 1 وقيمتها عنده؟',
      'f(x) has a single repeated root at x = 1 with a > 0. What is its sign on either side, and its value at x = 1?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["موجبة على الجانبين وصفرية عند x = 1","سالبة على الجانبين وموجبة عند x = 1","موجبة يمينًا وسالبة يسارًا","صفرية على فترة كاملة"]'::jsonb,
      '["Positive on both sides, zero at x = 1","Negative on both sides, positive at x = 1","Positive to the right, negative to the left","Zero over a whole interval"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الحالة الثانية في الدليل: عند الجذر المضاعف يلامس القطع المحور دون قطعه فتحفظ الدالة إشارة a على الجانبين وتنعدم عند الجذر.',
    'Guide''s Case 2: at a repeated root the parabola touches without crossing — the function keeps the sign of a on both sides and is zero at the root.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l4 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l4, v_skill_quadratic, null, 1.0,
      'ف(m) = −x² + 4 ما إشارتها خارج الجذرين (أي لـ x < −2 أو x > 2)؟',
      'For f(x) = −x² + 4, what is its sign outside the roots (x < −2 or x > 2)?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["سالبة لأن a < 0","موجبة لأن a < 0","صفرية لأن الجذران حقيقيان","تتبدل بين الموجب والسالب"]'::jsonb,
      '["Negative because a < 0","Positive because a < 0","Zero because the roots are real","Alternates between positive and negative"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'مثال الدليل الثاني: f(x) = −x² + 4 = −(x − 2)(x + 2) وa < 0 فالسالبة خارج الجذرين والموجبة بينهما وصفرية عند −2 و2.',
    'The guide''s second example: f(x) = −x² + 4 = −(x − 2)(x + 2) with a < 0 — negative outside the roots, positive between them, zero at −2 and 2.'
  );

  -- ===== Lesson 5 questions =====
  select id into v_q1 from public.questions where lesson_id = v_l5 and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_solving, null, 0.9,
      'ما حل المتباينة x² − 5x + 6 > 0 بترميز الفترات كما في مثال الدليل الأول؟',
      'What is the solution of x² − 5x + 6 > 0 in interval notation, per the guide''s first example?',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["(−∞, 2) ∪ (3, ∞)","[2, 3]","(2, 3)","(−∞, ∞)"]'::jsonb,
      '["(−∞, 2) ∪ (3, ∞)","[2, 3]","(2, 3)","(−∞, ∞)"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0","distractorFeedback":{"1":"[2, 3] حل x² − 5x + 6 ≤ 0 لا المتباينة الدقيقة."}}'::jsonb,
    '(x − 2)(x − 3) > 0 مع معامل موجب تعني الإيجاب خارج الجذرين: x < 2 أو x > 3 أي (−∞, 2) ∪ (3, ∞) مع استبعاد الأطراف لأن المتباينة دقيقة.',
    '(x − 2)(x − 3) > 0 with a positive leading coefficient is positive outside the roots: x < 2 or x > 3, i.e. (−∞, 2) ∪ (3, ∞), endpoints excluded for the strict inequality.'
  );

  select id into v_q2 from public.questions where lesson_id = v_l5 and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_solving, null, 1.0,
      'ما حل المتباينة −x² + 4 ≥ 0 وفق مثال الدليل الثالث؟',
      'What is the solution of −x² + 4 ≥ 0 per the guide''s third example?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["−2 ≤ x ≤ 2","x ≤ −2 أو x ≥ 2","−2 < x < 2","كل الأعداد الحقيقية"]'::jsonb,
      '["−2 ≤ x ≤ 2","x ≤ −2 or x ≥ 2","−2 < x < 2","All real numbers"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'بعد الترتيب: x² ≤ 4 أي −2 ≤ x ≤ 2؛ وتُدرج الأطراف لأن المتباينة ≥ كما في الدليل.',
    'Rearranging: x² ≤ 4 means −2 ≤ x ≤ 2; endpoints included because the inequality is ≥, as in the guide.'
  );

  select id into v_q3 from public.questions where lesson_id = v_l5 and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_solving, null, 1.0,
      'ما حل المتباينة (x − 1)(x + 4) < 0 كما في مثال الدليل الرابع؟',
      'What is the solution of (x − 1)(x + 4) < 0 per the guide''s fourth example?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["−4 < x < 1","x < −4 أو x > 1","−1 < x < 4","[−4, 1]"]'::jsonb,
      '["−4 < x < 1","x < −4 or x > 1","−1 < x < 4","[−4, 1]"]'::jsonb,
      v_prov || '{"difficulty_label":"core"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'الجداء سالب بين الجذرين −4 و1؛ إذن −4 < x < 1 مع استبعاد الطرفين لأن المتباينة دقيقة.',
    'The product is negative between the roots −4 and 1; hence −4 < x < 1 with endpoints excluded for the strict inequality.'
  );

  select id into v_q4 from public.questions where lesson_id = v_l5 and position = 4 and variant_of is null limit 1;
  if v_q4 is null then
    insert into public.questions (lesson_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_l5, v_skill_solving, null, 1.05,
      'أكمل طالب حل x² − 5x + 6 > 0 بالقول إن الحل هو {2, 3} أي الجذرين فقط. ما الخطأ؟',
      'A student solved x² − 5x + 6 > 0 claiming the solution is just {2, 3}, the roots themselves. What is the error?',
      'approved', 'published_demo', 4, 'multiple-choice',
      '["توقف عند الجذور ولم تعتبرها حدودًا؛ الحل هو الفترات خارج الجذرين","الخطأ في التحليل","الجذران محسوبان خطأ","لا خطأ؛ هذا هو الحل"]'::jsonb,
      '["Stopped at the roots instead of treating them as boundaries; the solution is the intervals outside","The factoring is wrong","The roots are miscalculated","No error; that is the solution"]'::jsonb,
      v_prov || '{"difficulty_label":"application"}'::jsonb
    ) returning id into v_q4;
  end if;
  delete from public.question_keys where question_id = v_q4;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q4,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'أول أخطاء الدليل المتكررة: التوقف بعد إيجاد الجذور؛ فالجذور حدود للفترات وليست الحل، والحل الصحيح x < 2 أو x > 3.',
    'The guide''s first frequent error: stopping after finding the roots; they are interval boundaries, not the solution — correctly x < 2 or x > 3.'
  );

  -- ===== Unit boss questions =====
  select id into v_q1 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 1 and variant_of is null limit 1;
  if v_q1 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_complex, null, 1.1,
      'تحدّي الوحدة (1): احسب (5 + 2i) − (1 + 7i) وفق الدليل.',
      'Unit challenge (1): Calculate (5 + 2i) − (1 + 7i) per the guide.',
      'approved', 'published_demo', 1, 'multiple-choice',
      '["4 − 5i","6 + 9i","4 + 5i","6 − 5i"]'::jsonb,
      '["4 − 5i","6 + 9i","4 + 5i","6 − 5i"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q1;
  end if;
  delete from public.question_keys where question_id = v_q1;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q1,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'نجمع الجزأين الحقيقي والتخيلي على حدة: (5 − 1) + (2 − 7)i = 4 − 5i كما في مثال الدليل.',
    'Combine real and imaginary parts separately: (5 − 1) + (2 − 7)i = 4 − 5i, the guide''s example.'
  );

  select id into v_q2 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 2 and variant_of is null limit 1;
  if v_q2 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_quadratic, null, 1.1,
      'تحدّي الوحدة (2): أي العبارات الآتية تربط المميز Δ = b² − 4ac بنوع الجذور ارتباطًا صحيحًا كاملًا؟',
      'Unit challenge (2): Which statement links Δ = b² − 4ac to the nature of the roots completely correctly?',
      'approved', 'published_demo', 2, 'multiple-choice',
      '["Δ > 0 جذران مختلفان، Δ = 0 جذران متساويان، Δ < 0 لا جذور حقيقية","Δ > 0 جذران متساويان، Δ = 0 جذران مختلفان، Δ < 0 جذران مركبان حقيقيان","Δ > 0 لا جذور، Δ = 0 جذران مختلفان، Δ < 0 جذران متساويان","الإشارة لا تخبر شيئًا عن الجذور"]'::jsonb,
      '["Δ > 0 two distinct roots, Δ = 0 two equal roots, Δ < 0 no real roots","Δ > 0 two equal roots, Δ = 0 two distinct roots, Δ < 0 two real complex roots","Δ > 0 no roots, Δ = 0 two distinct roots, Δ < 0 two equal roots","The sign says nothing about the roots"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"core"}'::jsonb
    ) returning id into v_q2;
  end if;
  delete from public.question_keys where question_id = v_q2;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q2,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'هذا هو تقسيم الدليل الحرفي لإشارة المميز ونوع الجذور الثلاثة.',
    'This is the guide''s literal division of the discriminant''s sign across the three root natures.'
  );

  select id into v_q3 from public.questions where unit_id = v_unit_id and lesson_id is null and position = 3 and variant_of is null limit 1;
  if v_q3 is null then
    insert into public.questions (unit_id, skill_id, variant_of, difficulty, prompt_ar, prompt_en, review_status, publication_status, position, question_type, choices_ar, choices_en, metadata)
    values (v_unit_id, v_skill_solving, null, 1.15,
      'تحدّي الوحدة (3): ما الحل الكامل للمتباينة x² − 5x + 6 ≤ 0 بترميز الفترات؟',
      'Unit challenge (3): What is the complete solution of x² − 5x + 6 ≤ 0 in interval notation?',
      'approved', 'published_demo', 3, 'multiple-choice',
      '["[2, 3]","(2, 3)","(−∞, 2) ∪ (3, ∞)","[−3, −2]"]'::jsonb,
      '["[2, 3]","(2, 3)","(−∞, 2) ∪ (3, ∞)","[−3, −2]"]'::jsonb,
      v_prov || '{"boss":true,"difficulty_label":"application"}'::jsonb
    ) returning id into v_q3;
  end if;
  delete from public.question_keys where question_id = v_q3;
  insert into public.question_keys (question_id, answer_spec, explanation_ar, explanation_en) values (v_q3,
    '{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,
    'المثلث سالب بين الجذرين 2 و3 وتنعدم عندهما؛ ولأن المتباينة ≤ تُدرج الأطراف فيصبح الحل [2, 3] كما في مثال الدليل الثاني.',
    'The quadratic is negative between roots 2 and 3 and zero at both; ≤ includes the endpoints, giving [2, 3] — the guide''s second example.'
  );

end $$;
