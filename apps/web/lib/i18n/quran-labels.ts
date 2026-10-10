const reciters:Record<string,string>={
 "محمد صديق المنشاوي":"Muhammad Siddiq Al-Minshawi","محمود خليل الحصري":"Mahmoud Khalil Al-Husary",
 "مصطفى إسماعيل":"Mustafa Ismail","أحمد نعينع":"Ahmed Naina","حسن صالح":"Hasan Saleh",
 "ياسر الدوسري":"Yasser Al-Dosari","علي جابر":"Ali Jaber","عبدالرحمن السديس":"Abdul Rahman Al-Sudais","ماهر المعيقلي":"Maher Al-Muaiqly",
};
export function reciterDisplayName(name:string,locale:"ar"|"en"){return locale==="en"?(reciters[name]??name):name;}
