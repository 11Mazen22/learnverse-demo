
insert into public.courses(
  id,slug,title_ar,title_en,description_ar,description_en,active,metadata
) values (
  '6a5dd445-b36e-5192-bfc5-6cd13da35baa',
  'demo-science-v1',
  'علوم تجريبية — محتوى توضيحي',
  'Demo Science — Illustrative content',
  'محتوى أصلي للتجربة واختبار المنتج. غير تابع لمنهج رسمي.',
  'Original demonstration content for product testing. Not aligned to an official syllabus.',
  true,
  '{"demo":true,"version":"1.0-demo","grade_ar":"مرحلة ثانوية — غير معتمد","grade_en":"Secondary level — not approved","provenance":"Original demonstration content created for product testing. Not aligned to an official syllabus."}'::jsonb
)
on conflict(id) do update set
  slug=excluded.slug,title_ar=excluded.title_ar,title_en=excluded.title_en,
  description_ar=excluded.description_ar,description_en=excluded.description_en,
  active=excluded.active,metadata=excluded.metadata;

insert into public.units(
  id,course_id,position,title_ar,title_en,boss_enabled,description_ar,description_en,metadata
) values
(
  '1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '6a5dd445-b36e-5192-bfc5-6cd13da35baa',
  1,
  'الحركة والتمثيل البياني',
  'Motion and graphs',
  true,
  'اقرأ الحركة من المسافة والزمن، ثم استخدم الأدلة لتفسيرها.',
  'Read motion from distance and time, then explain it with evidence.',
  '{"demo":true,"locked":false}'::jsonb
),
(
  '7f41652d-12e5-5843-9cec-9454d3f3a547',
  '6a5dd445-b36e-5192-bfc5-6cd13da35baa',
  2,
  'القوى والتغيّر',
  'Forces and change',
  true,
  'وحدة تجريبية قيد المراجعة وغير متاحة بعد.',
  'A demo unit under review and not yet available.',
  '{"demo":true,"locked":true}'::jsonb
)
on conflict(id) do update set
  course_id=excluded.course_id,position=excluded.position,title_ar=excluded.title_ar,
  title_en=excluded.title_en,boss_enabled=excluded.boss_enabled,
  description_ar=excluded.description_ar,description_en=excluded.description_en,metadata=excluded.metadata;

insert into public.lessons(
  id,unit_id,position,slug,title_ar,title_en,content,xp_reward,coin_reward
) values
(
  '29ea460d-92fc-570b-942a-c80fe012be22',
  '1193c2ae-2e06-53d0-ae79-ad338fb52742',
  1,
  'motion-basics',
  'ما معنى السرعة؟',
  'What does speed mean?',
  '{
    "demo":true,
    "duration_minutes":7,
    "summary_ar":"السرعة تصف مقدار المسافة المقطوعة في وحدة زمن. السرعة المتوسطة = المسافة ÷ الزمن.",
    "summary_en":"Speed describes distance travelled per unit of time. Average speed = distance ÷ time.",
    "worked_ar":"قطع درّاج 120 مترًا في 20 ثانية. السرعة المتوسطة = 120 ÷ 20 = 6 م/ث.",
    "worked_en":"A cyclist covers 120 m in 20 s. Average speed = 120 ÷ 20 = 6 m/s."
  }'::jsonb,
  15,25
),
(
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',
  '1193c2ae-2e06-53d0-ae79-ad338fb52742',
  2,
  'motion-graphs',
  'احكِ قصة الرسم',
  'Tell the graph''s story',
  '{
    "demo":true,
    "duration_minutes":8,
    "prerequisite_lesson_id":"29ea460d-92fc-570b-942a-c80fe012be22",
    "summary_ar":"في رسم المسافة–الزمن، الميل الأكبر يعني سرعة أكبر، والخط الأفقي يعني أن الجسم متوقف.",
    "summary_en":"On a distance–time graph, a steeper slope means greater speed; a horizontal line means stopped.",
    "worked_ar":"إذا ظلت المسافة 40 مترًا من الثانية 5 إلى 8، فالجسم لم يتحرك خلال هذه الفترة.",
    "worked_en":"If distance stays at 40 m from second 5 to 8, the object did not move in that interval."
  }'::jsonb,
  15,25
)
on conflict(id) do update set
  unit_id=excluded.unit_id,position=excluded.position,slug=excluded.slug,
  title_ar=excluded.title_ar,title_en=excluded.title_en,content=excluded.content,
  xp_reward=excluded.xp_reward,coin_reward=excluded.coin_reward;

insert into public.skills(id,course_id,slug,title_ar,title_en) values
(
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',
  '6a5dd445-b36e-5192-bfc5-6cd13da35baa',
  'average-speed',
  'حساب السرعة المتوسطة',
  'Calculate average speed'
),
(
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8',
  '6a5dd445-b36e-5192-bfc5-6cd13da35baa',
  'motion-graphs',
  'تفسير رسوم الحركة',
  'Interpret motion graphs'
)
on conflict(id) do update set
  course_id=excluded.course_id,slug=excluded.slug,title_ar=excluded.title_ar,title_en=excluded.title_en;

-- Primary lesson questions.
insert into public.questions(
  id,lesson_id,unit_id,skill_id,variant_of,position,difficulty,question_type,
  prompt_ar,prompt_en,choices_ar,choices_en,review_status,publication_status,metadata
) values
(
  '05c00c64-b9b8-5736-b996-86dd82a3dd83',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,1,.90,'multiple-choice',
  'قطع عدّاء 100 متر في 20 ثانية. ما سرعته المتوسطة؟',
  'A runner covers 100 m in 20 s. What is the average speed?',
  '["2 م/ث","5 م/ث","20 م/ث","80 م/ث"]'::jsonb,
  '["2 m/s","5 m/s","20 m/s","80 m/s"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"core","provenance":"Original demonstration question"}'::jsonb
),
(
  'b4ebb1e4-c88f-545a-8cdd-9faa970e5311',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,2,1.00,'numeric',
  'قطعت حافلة 240 مترًا في 30 ثانية. اكتب السرعة بالمتر/ثانية.',
  'A bus covers 240 m in 30 s. Enter the speed in metres/second.',
  '[]'::jsonb,'[]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"application","unit_ar":"م/ث","unit_en":"m/s","provenance":"Original demonstration question"}'::jsonb
),
(
  'd25f0844-8a0c-59e4-b93b-4cbde38e9bb8',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,3,1.08,'multiple-choice',
  'سيارتان قطعتا المسافة نفسها. الأولى استغرقت نصف زمن الثانية. ماذا نستنتج؟',
  'Two cars cover the same distance. The first takes half the time of the second. What follows?',
  '["سرعتهما متساوية","الأولى أسرع بمرتين","الثانية أسرع بمرتين","لا يمكن المقارنة"]'::jsonb,
  '["Same speed","First is twice as fast","Second is twice as fast","Cannot compare"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"transfer","provenance":"Original demonstration question"}'::jsonb
),
(
  'c0dc6501-b431-5374-a880-ad880de0305c',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8',null,1,.90,'multiple-choice',
  'ماذا يعني خط أفقي في رسم المسافة–الزمن؟',
  'What does a horizontal line on a distance–time graph mean?',
  '["سرعة ثابتة","الجسم متوقف","تسارع كبير","عودة للخلف"]'::jsonb,
  '["Constant speed","Object stopped","High acceleration","Moving backwards"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"core","provenance":"Original demonstration question"}'::jsonb
),
(
  '10986a4d-2a50-5268-861b-71b44e90635a',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8',null,2,1.00,'multiple-choice',
  'أي خط يعبّر عن جسم أسرع في رسم المسافة–الزمن؟',
  'Which line represents a faster object on a distance–time graph?',
  '["الأقل ميلًا","الأكثر ميلًا","الأفقي","كلها متساوية"]'::jsonb,
  '["Less steep","Steeper","Horizontal","All equal"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"application","provenance":"Original demonstration question"}'::jsonb
),
(
  '3dd19297-3a44-5592-90eb-8e9632b690f9',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8',null,3,1.08,'multiple-choice',
  'خط يبدأ شديد الميل ثم يصبح أفقيًا. ما القصة الأدق؟',
  'A line starts steep then becomes horizontal. What is the best story?',
  '["تحرّك سريعًا ثم توقف","بقي متوقفًا","تحرك ببطء ثم أسرع","عاد إلى البداية"]'::jsonb,
  '["Moved fast then stopped","Stayed stopped","Moved slowly then sped up","Returned to start"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"difficulty_label":"transfer","provenance":"Original demonstration question"}'::jsonb
)
on conflict(id) do update set
  lesson_id=excluded.lesson_id,unit_id=excluded.unit_id,skill_id=excluded.skill_id,
  variant_of=excluded.variant_of,position=excluded.position,difficulty=excluded.difficulty,
  question_type=excluded.question_type,prompt_ar=excluded.prompt_ar,prompt_en=excluded.prompt_en,
  choices_ar=excluded.choices_ar,choices_en=excluded.choices_en,
  review_status=excluded.review_status,publication_status=excluded.publication_status,metadata=excluded.metadata;

-- Primary Unit Boss questions.
insert into public.questions(
  id,lesson_id,unit_id,skill_id,variant_of,position,difficulty,question_type,
  prompt_ar,prompt_en,choices_ar,choices_en,review_status,publication_status,metadata
) values
(
  '33fddc1b-daaa-582f-87a5-71b6ce7eb904',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,1,.90,'numeric',
  'قطع جسم 60 مترًا في 12 ثانية. ما سرعته؟',
  'An object covers 60 m in 12 s. What is its speed?',
  '[]'::jsonb,'[]'::jsonb,'approved','published_demo',
  '{"demo":true,"boss":true,"difficulty_label":"core","unit_ar":"م/ث","unit_en":"m/s","provenance":"Original demonstration question"}'::jsonb
),
(
  '44ca081f-ceae-536e-9bfc-e29c506cb208',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8',null,2,1.00,'multiple-choice',
  'تحرك جسم من 0 إلى 30 م خلال 5 ثوانٍ ثم ثبتت المسافة 3 ثوانٍ. ماذا حدث؟',
  'An object moves from 0 to 30 m in 5 seconds, then distance stays fixed for 3 seconds. What happened?',
  '["تحرك ثم توقف","توقف ثم تحرك","عاد للخلف","تسارع طوال الوقت"]'::jsonb,
  '["Moved then stopped","Stopped then moved","Moved backwards","Accelerated throughout"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"boss":true,"difficulty_label":"application","provenance":"Original demonstration question"}'::jsonb
),
(
  '367a897d-0394-586e-a5cf-062fed876601',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,3,1.08,'multiple-choice',
  'طالب قال: «الجسم الذي يقطع مسافة أكبر يكون دائمًا أسرع». ما أفضل رد؟',
  'A student says, “The object covering more distance is always faster.” Best response?',
  '["صحيح دائمًا","نحتاج معرفة الزمن أيضًا","نحتاج معرفة الكتلة","المسافة لا علاقة لها"]'::jsonb,
  '["Always true","We also need the time","We need the mass","Distance is irrelevant"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"boss":true,"difficulty_label":"transfer","provenance":"Original demonstration question"}'::jsonb
)
on conflict(id) do update set
  lesson_id=excluded.lesson_id,unit_id=excluded.unit_id,skill_id=excluded.skill_id,
  variant_of=excluded.variant_of,position=excluded.position,difficulty=excluded.difficulty,
  question_type=excluded.question_type,prompt_ar=excluded.prompt_ar,prompt_en=excluded.prompt_en,
  choices_ar=excluded.choices_ar,choices_en=excluded.choices_en,
  review_status=excluded.review_status,publication_status=excluded.publication_status,metadata=excluded.metadata;

-- Reviewed parallel variants.
insert into public.questions(
  id,lesson_id,unit_id,skill_id,variant_of,position,difficulty,question_type,
  prompt_ar,prompt_en,choices_ar,choices_en,review_status,publication_status,metadata
) values
(
  '9d871ff7-39fe-5a54-87d9-e9de30c37371',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642','05c00c64-b9b8-5736-b996-86dd82a3dd83',101,.90,'multiple-choice',
  'سبح سبّاح 50 مترًا في 25 ثانية. ما سرعته المتوسطة؟',
  'A swimmer covers 50 m in 25 s. What is the average speed?',
  '["0.5 م/ث","2 م/ث","25 م/ث","75 م/ث"]'::jsonb,
  '["0.5 m/s","2 m/s","25 m/s","75 m/s"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"core","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '0b8a77d0-1599-5342-89b3-a5ae5a47fd6e',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642','b4ebb1e4-c88f-545a-8cdd-9faa970e5311',102,1.00,'numeric',
  'قطعت دراجة نارية 150 مترًا في 15 ثانية. اكتب السرعة بالمتر/ثانية.',
  'A motorbike covers 150 m in 15 s. Enter the speed in metres/second.',
  '[]'::jsonb,'[]'::jsonb,'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"application","unit_ar":"م/ث","unit_en":"m/s","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  'db70bca1-f44f-5c92-95c7-4258feb77777',
  '29ea460d-92fc-570b-942a-c80fe012be22',null,
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642','d25f0844-8a0c-59e4-b93b-4cbde38e9bb8',103,1.08,'multiple-choice',
  'قطع جسمان المسافة نفسها، لكن الثاني استغرق ثلث زمن الأول. كم مرة يكون الثاني أسرع؟',
  'Two objects cover the same distance, but the second takes a third of the first’s time. How many times faster is the second?',
  '["نفس السرعة","مرتين","3 مرات","4 مرات"]'::jsonb,
  '["Same speed","Twice","3 times","4 times"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"transfer","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '412cb5e3-3713-510f-a406-d44acb4741ee',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8','c0dc6501-b431-5374-a880-ad880de0305c',101,.90,'multiple-choice',
  'ماذا يعني الخط المستقيم الصاعد بثبات في رسم المسافة–الزمن؟',
  'What does a steadily rising straight line on a distance–time graph mean?',
  '["سرعة ثابتة","الجسم متوقف","تسارع متزايد","حركة للخلف"]'::jsonb,
  '["Constant speed","Object stopped","Increasing acceleration","Moving backwards"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"core","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '52973e09-2a59-5a37-ad7c-cc62564b340c',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8','10986a4d-2a50-5268-861b-71b44e90635a',102,1.00,'multiple-choice',
  'خطّان يبدآن من النقطة نفسها في رسم المسافة–الزمن. أيهما يمثل السرعة الأقل؟',
  'Two lines start from the same point on a distance–time graph. Which represents the lower speed?',
  '["الأقل ميلًا","الأكثر ميلًا","لا فرق بينهما","يعتمد على اللون"]'::jsonb,
  '["The less steep one","The steeper one","No difference","It depends on colour"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"application","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  'e79b6b3d-523a-5373-9604-859fee601121',
  'd3b5a0f7-4a68-55a0-a73e-528c80fdfe59',null,
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8','3dd19297-3a44-5592-90eb-8e9632b690f9',103,1.08,'multiple-choice',
  'خط أفقي ثم يصبح شديد الميل. ما القصة الأدق؟',
  'A line is horizontal, then becomes steep. What is the best story?',
  '["توقف ثم تحرك بسرعة","تحرك بسرعة ثم توقف","ثبتت سرعته طوال الوقت","عاد إلى البداية"]'::jsonb,
  '["Stopped then moved fast","Moved fast then stopped","Constant speed throughout","Returned to start"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"parallel_variant":true,"difficulty_label":"transfer","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '115cf373-1838-56a6-92a6-97e1fde065a5',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642','33fddc1b-daaa-582f-87a5-71b6ce7eb904',101,.90,'numeric',
  'قطعت دراجة 84 مترًا في 12 ثانية. ما سرعتها؟',
  'A bicycle covers 84 m in 12 s. What is its speed?',
  '[]'::jsonb,'[]'::jsonb,'approved','published_demo',
  '{"demo":true,"boss":true,"parallel_variant":true,"difficulty_label":"core","unit_ar":"م/ث","unit_en":"m/s","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '94039455-4ad3-5a80-8588-b663ff818135',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '6eeaa139-9f01-5298-a40e-ccddc8d773d8','44ca081f-ceae-536e-9bfc-e29c506cb208',102,1.00,'multiple-choice',
  'بقيت مسافة جسم عند 10 أمتار لمدة 4 ثوانٍ، ثم تحرك إلى 40 مترًا خلال 6 ثوانٍ. ماذا حدث؟',
  'An object’s distance stayed at 10 m for 4 seconds, then it moved to 40 m over 6 seconds. What happened?',
  '["تحرك ثم توقف","توقف ثم تحرك","عاد للخلف","تسارع طوال الوقت"]'::jsonb,
  '["Moved then stopped","Stopped then moved","Moved backwards","Accelerated throughout"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"boss":true,"parallel_variant":true,"difficulty_label":"application","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '93403dc8-0c4d-5b2f-94dc-11de9bd682da',
  null,'1193c2ae-2e06-53d0-ae79-ad338fb52742',
  '7b6e9080-a0ee-5227-a9f3-977d1baa1642','367a897d-0394-586e-a5cf-062fed876601',103,1.08,'multiple-choice',
  'طالبة قالت: «الجسم الذي يستغرق وقتًا أطول يكون دائمًا أبطأ». ما أفضل رد؟',
  'A student says, “The object that takes longer is always slower.” Best response?',
  '["صحيح دائمًا","نحتاج معرفة المسافة أيضًا","نحتاج معرفة الكتلة","الزمن لا علاقة له"]'::jsonb,
  '["Always true","We also need the distance","We need the mass","Time is irrelevant"]'::jsonb,
  'approved','published_demo',
  '{"demo":true,"boss":true,"parallel_variant":true,"difficulty_label":"transfer","provenance":"Original demonstration question — parallel variant"}'::jsonb
),
(
  '92286df0-8362-52fa-9f3c-233111d9e388',
  null,null,'7b6e9080-a0ee-5227-a9f3-977d1baa1642',null,null,1.00,'multiple-choice',
  'مسودة: قطع قطار 300 مترًا في 25 ثانية. ما سرعته المتوسطة؟',
  'Draft: A train covers 300 m in 25 s. What is its average speed?',
  '["10 م/ث","12 م/ث","15 م/ث","75 م/ث"]'::jsonb,
  '["10 m/s","12 m/s","15 m/s","75 m/s"]'::jsonb,
  'draft','draft',
  '{"demo":true,"difficulty_label":"application","provenance":"Drafted to demonstrate the content review workflow; not yet reviewed."}'::jsonb
)
on conflict(id) do update set
  lesson_id=excluded.lesson_id,unit_id=excluded.unit_id,skill_id=excluded.skill_id,
  variant_of=excluded.variant_of,position=excluded.position,difficulty=excluded.difficulty,
  question_type=excluded.question_type,prompt_ar=excluded.prompt_ar,prompt_en=excluded.prompt_en,
  choices_ar=excluded.choices_ar,choices_en=excluded.choices_en,
  review_status=excluded.review_status,publication_status=excluded.publication_status,metadata=excluded.metadata;

-- Hidden answer keys. Never exposed by student RLS.
insert into public.question_keys(question_id,answer_spec,explanation_ar,explanation_en) values
('05c00c64-b9b8-5736-b996-86dd82a3dd83','{"type":"multiple-choice","correctAnswer":"1","distractorFeedback":{"0":"قرّب الفكرة: اقسم المسافة على الزمن، ولا تطرح بينهما.","2":"20 هو الزمن، وليس السرعة. استخدم 100 ÷ 20.","3":"طرح الزمن من المسافة لا يعطينا السرعة."}}'::jsonb,'نقسم المسافة على الزمن: 100 ÷ 20 = 5 م/ث.','Divide distance by time: 100 ÷ 20 = 5 m/s.'),
('b4ebb1e4-c88f-545a-8cdd-9faa970e5311','{"type":"numeric","correctAnswer":8,"tolerance":0.01}'::jsonb,'240 ÷ 30 = 8 م/ث.','240 ÷ 30 = 8 m/s.'),
('d25f0844-8a0c-59e4-b93b-4cbde38e9bb8','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'عند ثبات المسافة، تقليل الزمن إلى النصف يضاعف السرعة.','For equal distance, halving the time doubles speed.'),
('c0dc6501-b431-5374-a880-ad880de0305c','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'المسافة لا تتغير مع الزمن، لذلك الجسم متوقف.','Distance does not change over time, so the object is stopped.'),
('10986a4d-2a50-5268-861b-71b44e90635a','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'الميل الأكبر يعني قطع مسافة أكبر في الزمن نفسه.','A steeper slope means more distance in the same time.'),
('3dd19297-3a44-5592-90eb-8e9632b690f9','{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,'الميل الشديد حركة سريعة، ثم ثبات المسافة يعني التوقف.','The steep section is fast movement; unchanged distance then means stopped.'),
('33fddc1b-daaa-582f-87a5-71b6ce7eb904','{"type":"numeric","correctAnswer":5,"tolerance":0.01}'::jsonb,'60 ÷ 12 = 5 م/ث.','60 ÷ 12 = 5 m/s.'),
('44ca081f-ceae-536e-9bfc-e29c506cb208','{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,'تغيرت المسافة أولًا، ثم لم تتغير خلال الثواني الثلاث.','Distance changed first, then stayed unchanged for three seconds.'),
('367a897d-0394-586e-a5cf-062fed876601','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'السرعة تعتمد على المسافة والزمن معًا؛ قد تستغرق المسافة الأكبر وقتًا أطول.','Speed depends on both distance and time; a longer distance may take longer.'),
('9d871ff7-39fe-5a54-87d9-e9de30c37371','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'50 ÷ 25 = 2 م/ث.','50 ÷ 25 = 2 m/s.'),
('0b8a77d0-1599-5342-89b3-a5ae5a47fd6e','{"type":"numeric","correctAnswer":10,"tolerance":0.01}'::jsonb,'150 ÷ 15 = 10 م/ث.','150 ÷ 15 = 10 m/s.'),
('db70bca1-f44f-5c92-95c7-4258feb77777','{"type":"multiple-choice","correctAnswer":"2"}'::jsonb,'عند ثبات المسافة، تقليل الزمن إلى الثلث يضاعف السرعة 3 مرات.','For equal distance, cutting time to a third triples speed.'),
('412cb5e3-3713-510f-a406-d44acb4741ee','{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,'الميل الثابت يعني قطع مسافات متساوية في أزمنة متساوية، أي سرعة ثابتة.','A constant slope means equal distances in equal times — constant speed.'),
('52973e09-2a59-5a37-ad7c-cc62564b340c','{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,'الميل الأقل يعني مسافة أقل في الزمن نفسه، أي سرعة أقل.','A gentler slope means less distance in the same time — lower speed.'),
('e79b6b3d-523a-5373-9604-859fee601121','{"type":"multiple-choice","correctAnswer":"0"}'::jsonb,'ثبات المسافة أولًا يعني توقفًا، ثم الميل الشديد يعني حركة سريعة.','Unchanged distance first means stopped; the steep section after that is fast movement.'),
('115cf373-1838-56a6-92a6-97e1fde065a5','{"type":"numeric","correctAnswer":7,"tolerance":0.01}'::jsonb,'84 ÷ 12 = 7 م/ث.','84 ÷ 12 = 7 m/s.'),
('94039455-4ad3-5a80-8588-b663ff818135','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'المسافة لم تتغيّر أولًا (توقف)، ثم تغيّرت (تحرك).','Distance was unchanged first (stopped), then changed (moved).'),
('93403dc8-0c4d-5b2f-94dc-11de9bd682da','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'السرعة تعتمد على المسافة والزمن معًا؛ الزمن وحده لا يثبت أن الجسم أبطأ.','Speed depends on both distance and time; time alone does not prove slower speed.'),
('92286df0-8362-52fa-9f3c-233111d9e388','{"type":"multiple-choice","correctAnswer":"1"}'::jsonb,'300 ÷ 25 = 12 — تحقّق من المراجع قبل الاعتماد.','300 ÷ 25 = 12 — verify sources before approval.')
on conflict(question_id) do update set
  answer_spec=excluded.answer_spec,
  explanation_ar=excluded.explanation_ar,
  explanation_en=excluded.explanation_en,
  updated_at=now();

insert into public.shop_items(
  id,slug,item_type,title_ar,title_en,price,asset_url,active
) values
(
  '51784f92-e172-59ea-9298-d7b7bac522be',
  'avatar-explorer','avatar','المستكشف','Explorer',0,null,true
),
(
  'd709596f-9014-5e17-9550-b48db1d54886',
  'outfit-orbit','outfit','بدلة المدار','Orbit suit',120,null,true
),
(
  '17ba5654-3397-5407-bfd2-f92203b4d5a1',
  'companion-fox','companion','ثعلب الفِكر','Clever fox',180,null,true
),
(
  '5ff98d35-87c6-515e-82b3-bb2408cb044f',
  'background-lab','background','مختبر النجوم','Star lab',240,null,true
)
on conflict(id) do update set
  slug=excluded.slug,item_type=excluded.item_type,title_ar=excluded.title_ar,
  title_en=excluded.title_en,price=excluded.price,asset_url=excluded.asset_url,active=excluded.active;
