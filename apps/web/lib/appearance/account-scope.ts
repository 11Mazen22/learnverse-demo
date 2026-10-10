/** Client display isolation; database RLS still enforces actual authorization. */
export function onlyOwnedRecords<T extends {user_id:string}>(items: readonly T[],accountId:string|null):T[]{
 if(!accountId)return [];
 return items.filter(item=>item.user_id===accountId);
}
