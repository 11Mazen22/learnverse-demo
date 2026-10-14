import type {Conversation} from "./workspace";
export const CONVERSATION_PAGE_SIZE=40;
export function mergeConversationPage(current:readonly Conversation[],next:readonly Conversation[],append:boolean):Conversation[]{
 const rows=new Map<string,Conversation>();for(const row of append?current:[])rows.set(row.id,row);for(const row of next)rows.set(row.id,row);
 return [...rows.values()].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updated_at.localeCompare(a.updated_at)||b.id.localeCompare(a.id));
}
