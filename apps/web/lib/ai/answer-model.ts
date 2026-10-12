import {getChatModelCards} from "./model-routing.ts";
/** Persisted/provider values are untrusted. Unknown historical values get no badge. */
export function answerModelLabel(model:unknown,locale:"en"|"ar"):string|null{
 if(typeof model!=="string"||model==="auto"||model==="Noata"||model.length>80)return null;
 const card=getChatModelCards(locale).find(card=>card.id===model);
 return card?.arabic??null;
}
