export const XP_RULES={
  version:"xp-mvp-1",
  correctFirstAttempt:10,
  lessonCompletion:15,
  bossFirstCompletion:40,
  levelSize:100
} as const;

export function xpProgress(xp:number){
  const safe=Math.max(0,Math.floor(xp));
  const level=Math.floor(safe/XP_RULES.levelSize)+1;
  const levelFloorXp=(level-1)*XP_RULES.levelSize;
  return {
    xp:safe,
    level,
    levelFloorXp,
    levelCeilingXp:level*XP_RULES.levelSize,
    levelPercent:Math.round((safe-levelFloorXp)/XP_RULES.levelSize*100)
  };
}

export type LedgerEntry={currency:"XP"|"COIN";amount:number};

export function balanceFor(ledger:LedgerEntry[],currency:"XP"|"COIN"="COIN"){
  return ledger.filter(x=>x.currency===currency).reduce((sum,x)=>sum+x.amount,0);
}
