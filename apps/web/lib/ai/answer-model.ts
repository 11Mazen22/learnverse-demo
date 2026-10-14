import {getChatModelCards} from "./model-routing.ts";
/** Persisted/provider values are untrusted. Unknown historical values get no badge. */
export function answerModelLabel(model:unknown,locale:"en"|"ar"):string|null{
 if(typeof model!=="string"||model==="auto"||model==="Noata"||model.length>80)return null;
 // Historical responses keep the actual provider identity after picker retirement.
 if(model==="Fanar-Sadiq-2")return locale==="ar"?"صادق 2":"Fanar-Sadiq-2";
 const card=getChatModelCards(locale).find(card=>card.id===model);
 return card?.arabic??null;
}
