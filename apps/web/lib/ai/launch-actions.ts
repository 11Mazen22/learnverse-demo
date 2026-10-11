/** Capabilities shown in Noata's actual workspace. No unimplemented action is offered. */
export type LaunchAction="study"|"write"|"analyze"|"research"|"projects"|"memory";
export type LaunchItem={id:LaunchAction;titleAr:string;titleEn:string;descriptionAr:string;descriptionEn:string;symbol:string};
export const launchItems:readonly LaunchItem[]=[
 {id:"study",titleAr:"اتعلّم بذكاء",titleEn:"Learn with me",descriptionAr:"شرح تفاعلي واختبارات وبطاقات",descriptionEn:"Interactive lessons, quizzes and cards",symbol:"◎"},
 {id:"write",titleAr:"اصنع مستندًا",titleEn:"Create a document",descriptionAr:"اكتب وحرّر وصدّر PDF أو Word",descriptionEn:"Draft, refine and export PDF or Word",symbol:"▤"},
 {id:"analyze",titleAr:"حلّل بيانات",titleEn:"Work with data",descriptionAr:"نظّم الجداول وأنشئ Excel حقيقيًا",descriptionEn:"Organize tables and export real Excel files",symbol:"▥"},
 {id:"research",titleAr:"استكشف موضوعًا",titleEn:"Explore a topic",descriptionAr:"ابحث مع توضيح المصادر عند توفر الخدمة",descriptionEn:"Research with sources when search is available",symbol:"⌕"},
 {id:"projects",titleAr:"ملفاتي ومشروعاتي",titleEn:"My projects & files",descriptionAr:"المكتبة الخاصة والملفات المحفوظة",descriptionEn:"Private library and saved work",symbol:"▣"},
 {id:"memory",titleAr:"تحكّم في ذاكرتي",titleEn:"Memory controls",descriptionAr:"موافقة صريحة، مراجعة وحذف",descriptionEn:"Explicit consent, review and deletion",symbol:"✧"}
] as const;
export function launchActionEnabled(action:LaunchAction,signedIn:boolean){
 if(action==="projects"||action==="memory")return signedIn;
 return true;
}
