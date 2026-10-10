import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata = {
  title: "Privacy Policy | سياسة الخصوصية",
  description: "Learn how Noata handles account, education, rewards, Google sign-in and AI data, including retention, access and privacy requests.",
};

const sections: LegalSection[] = [
  {
    id: "scope", titleAr: "نطاق السياسة ومن يدير الخدمة", titleEn: "Scope and service operator",
    ar: [
      "تشرح هذه السياسة المعلومات التي تعالجها منصة Noata لتقديم أدوات التعلّم والمهام والمراجعة والمكافآت والمساعد التعليمي Noata AI. تسري على الموقع والخدمات المرتبطة به، بما فيها الحسابات والبيانات المرسلة باختيار المستخدم.",
      "تُدار المنصة حاليًا في مرحلة تطوير واختبار. بعض الوظائف، مثل ربط Google وحذف الحساب ذاتيًا، قد لا تكون متاحة بعد. لا يعني ظهور ميزة في الواجهة أنها مفعّلة في كل بيئة تشغيل.",
    ],
    en: [
      "This policy describes information Noata processes to provide learning, assignments, reviews, rewards, and Noata AI. It applies to the website and related services, including account information and content that users choose to submit.",
      "The platform is still undergoing development and testing. Some functionality, including Google sign-in and self-service account deletion, may not be enabled in every environment. A visible feature does not guarantee activation.",
    ],
  },
  {
    id: "categories", titleAr: "ما البيانات التي نجمعها؟", titleEn: "What information do we collect?",
    ar: [
      "بيانات الحساب: معرّف المستخدم والبريد الإلكتروني واسم العرض وأدوار الوصول، وبيانات المصادقة التي تديرها خدمة Supabase Auth. لا يحتاج Noata إلى قراءة كلمة مرورك لتسجيل الدخول.",
      "بيانات التعليم: الدروس والمهارات التي تدرسها، المحاولات والإجابات، سجلات الإتقان والتقدم والواجبات وعلاقات الصفوف، ونقاط XP والعملات والصناديق والعناصر الرقمية ومعاملات سجل المكافآت.",
      "بيانات الاستخدام والمحتوى: اللغة والمظهر وتفضيلات تقليل الحركة، إشعارات المنصة، الرسائل والملفات والصور والصوت التي تقدمها إلى Noata AI، وبيانات تشغيل تقنية لازمة للأمان وتصحيح الأخطاء.",
    ],
    en: [
      "Account data: user identifier, email address, display name, access roles and authentication data managed by Supabase Auth. Noata does not need to read your password to sign you in.",
      "Learning data: lessons and skills studied, attempts and answers, mastery/progress records, assignments and class relationships, XP, coins, reward boxes, virtual items and reward ledger transactions.",
      "Usage and content: language, appearance and reduced-motion preferences, notifications, messages, files, images and audio voluntarily submitted to Noata AI, and technical operational data needed for security and troubleshooting.",
    ],
  },
  {
    id: "google", titleAr: "بيانات تسجيل الدخول باستخدام Google", titleEn: "Google sign-in data",
    ar: [
      "عند تفعيل تسجيل الدخول باستخدام Google واختيارك استخدامه، قد نحصل عبر تدفق تسجيل الدخول من Google على بيانات الهوية الأساسية اللازمة لربط الحساب، مثل معرّف الحساب والاسم والبريد الإلكتروني وصورة الملف الشخصي إذا وفرتها Google. الغرض هو المصادقة، إنشاء حساب Noata، وإظهار معلومات الحساب.",
      "لا يتطلب تسجيل الدخول العادي الوصول إلى Gmail أو Google Drive أو جهات الاتصال أو التقويم، ولا تستخدم Noata بيانات تسجيل الدخول لعرض إعلانات مستهدفة أو بيعها. إذا أُضيفت أذونات Google جديدة مستقبلًا فستتطلب إبلاغًا وموافقة مناسبين وتحديث هذه السياسة قبل استخدامها.",
      "يمكنك مراجعة أو إلغاء وصول Noata من إعدادات حساب Google، لكن إلغاء التفويض لدى Google لا يحذف تلقائيًا بيانات حساب Noata المخزّنة؛ اطلب حذفها بصورة منفصلة.",
    ],
    en: [
      "If Google sign-in is enabled and you choose it, Noata may receive the basic Google identity information required to link your account, such as an account identifier, name, email address and profile picture where provided. We use it for authentication, creating a Noata account, and displaying account identity.",
      "Normal sign-in does not require Gmail, Google Drive, Contacts or Calendar access. Noata does not sell Google sign-in information or use it for targeted advertising. Any future Google scopes require appropriate notice and consent and a policy update before use.",
      "You may review or revoke Noata's access in your Google Account settings. Revoking Google access does not automatically delete data already stored in your Noata account; deletion must be requested separately.",
    ],
  },
  {
    id: "purposes", titleAr: "لماذا نستخدم البيانات؟", titleEn: "Why do we use this information?",
    ar: [
      "نستخدم البيانات لتوثيق الهوية واستعادة الحساب، حفظ التقدّم، تصحيح المحاولات، احتساب المكافآت المؤهلة، تنفيذ الواجبات، تخصيص التجربة وإظهار السجلات والإشعارات المناسبة لصلاحيات المستخدم.",
      "نستخدم البيانات التقنية لمكافحة إساءة الاستخدام، تطبيق حدود الطلبات والتحقق من المعاملات المكررة وتحسين جودة الخدمة وإصلاح الأعطال. لا تُمنح مكافآت اعتمادًا على إشارة من المتصفح وحدها؛ يجب تأكيد العملية على الخادم.",
    ],
    en: [
      "We use data to authenticate and recover accounts, save progress, grade attempts, award eligible rewards, deliver assignments, personalize the experience and display records and notifications appropriate to each role.",
      "We use technical information to prevent misuse, enforce usage limits, detect duplicate transactions, improve reliability and troubleshoot incidents. Rewards are not granted based solely on a client-side claim; the server must confirm the operation.",
    ],
  },
  {
    id: "ai", titleAr: "Noata AI والملفات والصوت", titleEn: "Noata AI, files and audio",
    ar: [
      "عندما ترسل سؤالًا أو ملفًا أو صورة أو مقطعًا صوتيًا إلى Noata AI، يعالج Noata محتوى الطلب والسياق اللازم لتنفيذ المهمة. قد يُرسل المحتوى المطلوب إلى Fanar بصفته مزودًا خارجيًا لنماذج الذكاء الاصطناعي. لا ترسل معلومات شخصية حساسة أو أسرارًا أو بيانات أشخاص آخرين دون ضرورة وصلاحية.",
      "يمكن حفظ المحادثات العادية وبيانات الملفات المرتبطة بها في حسابك وفق إعدادات الخدمة. في الوضع المؤقت لا تُضاف المحادثة إلى سجل المحادثات المعتاد، لكن قد يبقى إيصال طلب خادمي يحتوي على الاستجابة لمنع التنفيذ المكرر. تنظيف الإيصالات الأقدم من 24 ساعة يعتمد على تشغيل عملية التنظيف، وقد يتأخر إذا توقفت.",
      "قد تحفظ مرفقات AI أو الوسائط المنشأة في مساحة تخزين خاصة عند تفعيل ذلك؛ حذف المحادثة وحده ليس ضمانًا لحذف جميع الملفات المرتبطة. وظيفة الاحتفاظ بالأصول الأصلية منفصلة وقد تظل معطلة حتى مراجعة قواعد الوصول ودورة الحذف. قد تتبع معالجة Fanar سياسة الاحتفاظ الخاصة به؛ يجب مراجعة شروط المزوّد قبل مشاركة معلومات حساسة.",
    ],
    en: [
      "When you submit prompts, files, images or audio to Noata AI, Noata processes the content and necessary context to fulfill the request. Necessary content may be sent to Fanar as an external AI model provider. Do not submit sensitive personal information, secrets or third-party information without a legitimate reason and permission.",
      "Ordinary conversations and related file metadata may be saved to your account under service settings. Temporary chats are not added to the usual conversation history, but a server-side request receipt containing the response may persist to prevent duplicate execution. Cleanup of receipts older than 24 hours depends on the cleanup process running and may be delayed during downtime.",
      "AI attachments or generated media may be stored privately when enabled; deleting a conversation does not necessarily delete every associated file. Original-document retention is separately controlled and may remain disabled until access policies and deletion lifecycle have been reviewed. Fanar processing may be governed by its own retention terms; check those terms before sharing sensitive information.",
    ],
  },
  {
    id: "sharing", titleAr: "الجهات التي قد تعالج البيانات", titleEn: "Service providers and disclosure",
    ar: [
      "تستخدم المنصة Supabase للمصادقة وقاعدة البيانات والتخزين والوظائف الخلفية، وVercel لاستضافة واجهة الويب، وFanar لمعالجة طلبات الذكاء الاصطناعي عند تشغيلها. وقد يعالج مزوّد إرسال البريد رسائل تأكيد الحساب والاستعادة عند تهيئته.",
      "لا نعلن بيع بيانات المستخدمين أو مشاركتها لأغراض الإعلانات السلوكية. قد تتم معالجة البيانات في مناطق تشغيل مختلفة بحسب إعدادات الاستضافة والمزوّدين، مع تطبيق صلاحيات الوصول المناسبة. قد يقتضي القانون أو أمر رسمي مشروع الإفصاح عن معلومات محددة.",
    ],
    en: [
      "Noata uses Supabase for authentication, database, storage and backend functions, Vercel to host the web experience, and Fanar for AI requests when enabled. A configured email delivery provider may process account confirmation and recovery messages.",
      "We do not describe selling user data or sharing it for behavioral advertising as part of the service. Processing locations depend on provider and hosting configuration, subject to applicable access controls. A lawful request may require limited disclosure.",
    ],
  },
  {
    id: "access", titleAr: "مَن يستطيع رؤية معلوماتك؟", titleEn: "Who can access your information?",
    ar: [
      "يجب أن يرى الطالب بياناته وحصصه التعليمية المصرح بها فقط، ويُمنح المعلم الوصول إلى الصفوف والواجبات التي يُفوّض لإدارتها، بينما تقتصر الوظائف الإدارية على الحسابات المخوّلة. تستخدم Noata سياسات وصول على مستوى قاعدة البيانات (RLS) إلى جانب ضوابط الواجهة.",
      "قد يحتاج مسؤولون مخوّلون إلى الوصول إلى قدر محدود من البيانات لتقديم الدعم أو معالجة إساءة الاستخدام. تُختبر ضوابط الوصول في بيئة مستقلة قبل الإطلاق، ولا تُعد الاختبارات الآلية وحدها إثباتًا لكل الحالات.",
    ],
    en: [
      "Students should see only their own and authorized learning data. Teachers receive access to classes and assignments they are permitted to manage. Administrative functions are reserved for authorized accounts. Noata uses database row-level security (RLS) in addition to interface checks.",
      "Authorized operators may require limited access for support and abuse handling. Access controls are tested in an isolated environment before release, and automated tests alone do not establish every real-world case.",
    ],
  },
  {
    id: "storage", titleAr: "التخزين والاحتفاظ والحذف", titleEn: "Storage, retention and deletion",
    ar: [
      "تظل معلومات الحساب والتقدّم والواجبات والمكافآت المرتبطة بحسابك محفوظة ما دامت لازمة لتشغيله أو حتى حذفها وفق دورة العمل المتاحة. لا نعد بفترة احتفاظ موحّدة لكل الأنواع؛ فقد تختلف سجلات الأمن والإيصالات والوسائط عن سجلات التعلم.",
      "قد تستمر نسخ احتياطية أو سجلات تقنية لفترة إضافية وفق سياسات مزوّدي الاستضافة. حذف رسالة أو محادثة لا يضمن حذف جميع المرفقات أو السجلات أو النسخ الاحتياطية في اللحظة نفسها. ينبغي تقديم طلب واضح لحذف البيانات المرتبطة بالحساب والتحقق من إتمامه.",
    ],
    en: [
      "Account, progress, assignment and reward information remains stored while necessary to operate the account or until deletion through available workflows. There is no single retention period for every category: security logs, request receipts and media may differ from learning records.",
      "Backups and technical logs may persist for additional periods under infrastructure-provider policies. Removing a message or conversation does not instantly guarantee deletion of all attachments, logs or backups. Account-related deletion should be requested explicitly and confirmed.",
    ],
  },
  {
    id: "rights", titleAr: "اختياراتك وطلبات الخصوصية", titleEn: "Your choices and privacy requests",
    ar: [
      "يمكنك تغيير اسم العرض واللغة والمظهر وبعض تفضيلات Noata AI من الإعدادات. تتطلب بعض الطلبات، مثل تصحيح بيانات حساب حساسة أو استخراج المعلومات أو حذف الحساب ومرفقاته، التواصل مع مشغّل المنصة عبر قنوات الدعم الرسمية؛ الحذف الذاتي غير مكتمل في جميع البيئات.",
      "للمساعدة العامة افتح مركز المساعدة. قبل نشر Noata للعامة يجب على المشغّل إتاحة وسيلة تواصل موثوقة لطلبات البيانات والخصوصية وتحديد طريقة الاستجابة لها. لا تشارك كلمات المرور أو رموز تسجيل الدخول ضمن الطلب.",
    ],
    en: [
      "You can change your display name, language, appearance and certain Noata AI preferences in Settings. Requests to correct sensitive account details, obtain your information or delete an account and its attachments may require contacting the platform operator through official support channels; self-service deletion is not complete in all environments.",
      "Visit the Help Center for general help. Before public release, the operator must make a reliable privacy-request contact channel available and define how requests will be handled. Never include passwords or sign-in tokens in such requests.",
    ],
  },
  {
    id: "children", titleAr: "الطلاب الصغار وأولياء الأمور", titleEn: "Young learners and guardians",
    ar: [
      "Noata منصة تعليمية قد يستخدمها طلاب دون سن الرشد. إذا كنت قاصرًا، اطلب مساعدة ولي الأمر في مراجعة شروط الخدمة وإعداد الحساب وتحديد المعلومات المناسبة للمشاركة، وخاصة مع أدوات الذكاء الاصطناعي.",
      "لا ينبغي إدخال بيانات حساسة عن الأطفال أو زملائهم أو معلميهم ضمن المحادثات أو الملفات دون حاجة وتعليمات أو إذن مناسب. يجب على مشغّل المنصة استكمال متطلبات العمر والموافقة والخصوصية المنطبقة قبل الإطلاق العام.",
    ],
    en: [
      "Noata is an educational platform that may be used by minors. If you are under the age of majority, involve a parent or guardian when reviewing the terms, setting up your account and deciding what information to share, particularly with AI tools.",
      "Avoid supplying sensitive information about children, classmates or teachers in prompts or files without a need and appropriate instructions or permission. The operator must establish applicable age, consent and privacy requirements before a public release.",
    ],
  },
  {
    id: "security", titleAr: "الأمان والأخطاء والتحديثات", titleEn: "Security, incidents and changes",
    ar: [
      "نستخدم المصادقة وصلاحيات الأدوار وسياسات قاعدة البيانات وتقييد الوظائف الحساسة. ومع ذلك لا يمكن ضمان أمان مطلق لأي خدمة عبر الإنترنت. أبلغ مشغّل المنصة عبر وسيلة الدعم الرسمية عن نشاط غير معتاد؛ لا ترسل رموز الجلسات أو مفاتيح API.",
      "سنراجع هذه السياسة عند تغيير الجهات المزودة أو أنواع البيانات أو طريقة الاحتفاظ أو إضافة أذونات Google جديدة. يجب توضيح التغييرات المهمة قبل تطبيقها على الاستخدام الفعلي.",
    ],
    en: [
      "The service uses authentication, role permissions, database access policies and restrictions around sensitive functions. No online service can guarantee absolute security. Report unusual activity through the operator's official support channel; never send session tokens or API keys.",
      "This policy should be reviewed if providers, data categories, retention practices or Google permissions change. Material changes must be communicated appropriately before they govern actual use.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      kind="privacy"
      titleAr="خصوصيتك تستحق الوضوح"
      titleEn="Privacy with clarity"
      summaryAr="نفصّل هنا البيانات التي نستخدمها في Noata، وكيف نتعامل مع تسجيل الدخول والتعلّم والمكافآت وNoata AI — بدون وعود غامضة."
      summaryEn="A clear explanation of the data used for Noata accounts, learning, rewards and AI — without vague guarantees."
      sections={sections}
    />
  );
}
