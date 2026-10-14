/** Pure viewport positioning for Noata's focus and hover captions. */
export type TooltipSide = "left" | "right" | "top" | "bottom";
export type TooltipRect = {left:number;top:number;right:number;bottom:number;width:number;height:number};
export type TooltipSize = {width:number;height:number};
export type TooltipPosition = {left:number;top:number;side:TooltipSide};

const GAP=12, MARGIN=10;
const clamp=(value:number,low:number,high:number)=>Math.max(low,Math.min(value,high));

export function tooltipPosition(
  anchor:TooltipRect,
  bubble:TooltipSize,
  viewport:TooltipSize,
  preferred:TooltipSide="top",
):TooltipPosition{
  const centerX=anchor.left+anchor.width/2;
  const centerY=anchor.top+anchor.height/2;
  const raw=(side:TooltipSide)=>{
    if(side==="left")return {left:anchor.left-GAP-bubble.width,top:centerY-bubble.height/2};
    if(side==="right")return {left:anchor.right+GAP,top:centerY-bubble.height/2};
    if(side==="bottom")return {left:centerX-bubble.width/2,top:anchor.bottom+GAP};
    return {left:centerX-bubble.width/2,top:anchor.top-GAP-bubble.height};
  };
  const order:TooltipSide[]=preferred==="left"?["left","right","top","bottom"]:
    preferred==="right"?["right","left","top","bottom"]:
    preferred==="bottom"?["bottom","top","right","left"]:
    ["top","bottom","right","left"];
  // Prefer the desired side, but flip rather than clipping across the viewport.
  const picked=order.find(side=>{
    const p=raw(side);
    return p.left>=MARGIN && p.top>=MARGIN &&
      p.left+bubble.width<=viewport.width-MARGIN &&
      p.top+bubble.height<=viewport.height-MARGIN;
  })??order[0];
  const origin=raw(picked);
  return {
    side:picked,
    left:clamp(origin.left,MARGIN,Math.max(MARGIN,viewport.width-bubble.width-MARGIN)),
    top:clamp(origin.top,MARGIN,Math.max(MARGIN,viewport.height-bubble.height-MARGIN)),
  };
}
export function tooltipPreferredSide(isRail:boolean,rtl:boolean):TooltipSide{
  return isRail ? (rtl?"left":"right") : "top";
}
