export const MASTERY_RULES={
  version:"mvp-1",
  windowSize:8,
  minimumIndependentQuestions:3,
  intervalsDays:[1,3,7] as const,
  thresholds:{reteach:50,supported:70,mixed:85}
} as const;

export type EvidenceAttempt={
  questionId:string;
  correct:boolean;
  assisted:boolean;
  practiceRepeat?:boolean;
  difficulty:"core"|"application"|"transfer";
  createdAt:string;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

export function deriveMastery(attempts:EvidenceAttempt[],now=new Date()){
  const ordered=[...attempts]
    .filter(a=>!a.practiceRepeat)
    .sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())
    .slice(0,MASTERY_RULES.windowSize);

  const independent=ordered.filter(a=>!a.assisted);
  const distinctIndependent=new Set(independent.map(a=>a.questionId));
  const enoughEvidence=distinctIndependent.size>=MASTERY_RULES.minimumIndependentQuestions;

  if(!ordered.length){
    return {score:null,state:"new" as const,evidenceCount:0,independentQuestionCount:0,confidence:"none" as const,nextReviewAt:null};
  }

  const weighted=ordered.map(a=>{
    const difficultyWeight={core:.9,application:1,transfer:1.08}[a.difficulty]??1;
    const assistanceWeight=a.assisted?.55:1;
    return {earned:a.correct?difficultyWeight*assistanceWeight:0,possible:difficultyWeight};
  });

  const score=Math.round(
    weighted.reduce((s,x)=>s+x.earned,0)/
    weighted.reduce((s,x)=>s+x.possible,0)*100
  );

  let state:"new"|"reteach"|"supported"|"mixed"|"provisional_mastery"="new";
  if(enoughEvidence){
    if(score<MASTERY_RULES.thresholds.reteach)state="reteach";
    else if(score<MASTERY_RULES.thresholds.supported)state="supported";
    else if(score<MASTERY_RULES.thresholds.mixed)state="mixed";
    else state="provisional_mastery";
  }

  const recentCorrect=independent.slice(0,3).filter(x=>x.correct).length;
  const intervalIndex=clamp(recentCorrect-1,0,MASTERY_RULES.intervalsDays.length-1);
  const nextReviewAt=new Date(now.getTime()+MASTERY_RULES.intervalsDays[intervalIndex]*86400000).toISOString();

  return {
    score,
    state,
    evidenceCount:ordered.length,
    independentQuestionCount:distinctIndependent.size,
    confidence:enoughEvidence?"developing" as const:"limited" as const,
    nextReviewAt
  };
}
