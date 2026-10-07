export type ReviewStatus="draft"|"in_review"|"approved";
export type PublicationStatus="draft"|"published_demo"|"published"|"retired";
export type ReviewAction="submit_review"|"approve"|"return_to_draft"|"publish"|"retire";

export type ReviewableContent={
  reviewStatus:ReviewStatus;
  publicationStatus:PublicationStatus;
  reviewedBy?:string|null;
  reviewedAt?:string|null;
  publishedBy?:string|null;
  publishedAt?:string|null;
  retiredBy?:string|null;
  retiredAt?:string|null;
};

export function transitionContent<T extends ReviewableContent>(item:T,action:ReviewAction,actorId:string,at=new Date().toISOString()):T{
  if(action==="submit_review"){
    if(item.reviewStatus!=="draft")throw new Error("Only draft content can enter review");
    return {...item,reviewStatus:"in_review"} as T;
  }
  if(action==="approve"){
    if(item.reviewStatus!=="in_review")throw new Error("Only in-review content can be approved");
    return {...item,reviewStatus:"approved",reviewedBy:actorId,reviewedAt:at} as T;
  }
  if(action==="return_to_draft"){
    if(item.reviewStatus!=="in_review")throw new Error("Only in-review content can return to draft");
    return {...item,reviewStatus:"draft",reviewedBy:null,reviewedAt:null} as T;
  }
  if(action==="publish"){
    if(item.reviewStatus!=="approved")throw new Error("Only approved content can publish");
    if(item.publicationStatus==="published")throw new Error("Already published");
    return {...item,publicationStatus:"published",publishedBy:actorId,publishedAt:at} as T;
  }
  if(action==="retire"){
    if(item.publicationStatus!=="published")throw new Error("Only published content can retire");
    return {...item,publicationStatus:"retired",retiredBy:actorId,retiredAt:at} as T;
  }
  throw new Error("Unknown review action");
}
