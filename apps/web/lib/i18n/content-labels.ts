type Locale="ar"|"en";
const label=(values:Record<string,[string,string]>,value:unknown,locale:Locale,fallback:[string,string])=>
 (values[String(value)]??fallback)[locale==="en"?1:0];
export function questionTypeLabel(value:unknown,locale:Locale){return label({numeric:["إجابة رقمية","Numeric answer"],"multiple-choice":["اختيار من متعدد","Multiple choice"],"short-answer":["إجابة قصيرة","Short answer"],"true-false":["صح أو خطأ","True or false"]},value,locale,["سؤال","Question"]);}
export function masteryLabel(value:unknown,locale:Locale){return label({reteach:["يحتاج شرحًا جديدًا","Needs another explanation"],supported:["مع الدعم","With support"],mixed:["غير ثابت","Inconsistent"],provisional_mastery:["إتقان مبدئي","Emerging mastery"],mastered:["متقن","Mastered"],strong:["قوي","Strong"],learning:["قيد التعلم","Learning"],developing:["يتطور","Developing"],needs_review:["يحتاج مراجعة","Needs review"],review:["يحتاج مراجعة","Needs review"],weak:["يحتاج تدريبًا","Needs practice"],new:["جديد","New"],unseen:["لم يبدأ","Not started"]},value,locale,["قيد التعلم","Learning"]);}
export function ledgerReason(value:unknown,locale:Locale){return label({QUESTION_FIRST_CORRECT:["أول إجابة صحيحة","First correct answer"],LESSON_COMPLETED:["إكمال درس","Lesson completed"],BOSS_PASSED:["اجتياز تحدّي الوحدة","Unit challenge passed"],REWARD_BOX_OPENED:["فتح صندوق","Reward box opened"],SHOP_PURCHASE:["شراء من المتجر","Shop purchase"],LESSON_COMPLETE:["إكمال درس","Lesson completed"],LESSON_COMPLETION:["إكمال درس","Lesson completed"],ATTEMPT_REWARD:["مكافأة إجابة","Answer reward"],CORRECT_ANSWER:["إجابة صحيحة","Correct answer"],BOX_REWARD:["مكافأة صندوق","Reward box"],BOX_CLAIM:["فتح صندوق","Reward box opened"],BOSS_REWARD:["مكافأة تحدّي الوحدة","Unit challenge reward"],STREAK_REWARD:["مكافأة الاستمرارية","Streak reward"],ADMIN_ADJUSTMENT:["تعديل رصيد","Balance adjustment"],REFUND:["استرداد","Refund"]},String(value).toUpperCase(),locale,["تحديث الرصيد","Balance update"]);}
export function ledgerSource(value:unknown,locale:Locale){return label({shop_item:["المتجر","Shop"],lesson:["درس","Lesson"],attempt:["إجابة","Answer"],question:["سؤال","Question"],boss:["تحدّي الوحدة","Unit challenge"],unit:["وحدة","Unit"],reward_box:["صندوق مكافآت","Reward box"],box:["صندوق مكافآت","Reward box"],streak:["الاستمرارية","Learning streak"],admin:["الإدارة","Administration"]},value,locale,["الحساب","Account"]);}

/** Translate only known system templates; keep teacher-authored content intact. */
export function notificationCopy(row:{type:string;title:string;body:string},locale:Locale){
 if(locale!=="en")return {title:row.title,body:row.body};
 let title=row.title,body=row.body;
 if(["assignment","assignment_published"].includes(row.type)){
  title=title.replace(/^واجب جديد: /,"New assignment: ");
  body=body.replace(/ · موعد التسليم /g," · Due ");
 }
 if(["grade","assignment_graded"].includes(row.type)&&title==="تم تقييم واجبك")title="Your assignment has been graded";
 return {title,body};
}
