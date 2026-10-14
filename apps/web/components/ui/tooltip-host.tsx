"use client";

import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {tooltipPosition,tooltipPreferredSide} from "@/lib/ui/tooltip-position";

type Trigger={element:HTMLElement;label:string;source:"pointer"|"focus"};
const TIP_ID="noata-global-tooltip";
const CONTROLS='button, a, summary, [role="button"], input[type="button"], input[type="submit"], [data-tooltip]';

function getTrigger(node:EventTarget|null):HTMLElement|null{
  if(!(node instanceof Element))return null;
  const target=node.closest<HTMLElement>(CONTROLS);
  if(!target || target.matches(':disabled,[aria-disabled="true"]') || !target.isConnected)return null;
  if(target.closest('[data-noata-tooltip="off"]'))return null;
  return target;
}
function caption(target:HTMLElement,suppressedTitle:string|null):string{
  const accessible=target.getAttribute("data-tooltip")
    ||target.getAttribute("aria-label")
    ||target.getAttribute("title")
    ||suppressedTitle;
  // Text-labelled buttons still get a small caption; links with visible text
  // do not acquire noisy, redundant hover popovers.
  if(!accessible && target.matches("a"))return "";
  const text=accessible || target.innerText || target.textContent || "";
  const cleaned=text.replace(/\s+/g," ").trim();
  return cleaned.length>0&&cleaned.length<=90?cleaned:"";
}

/** One overlay for the entire product: it is outside sidebar overflow and
 * also works for keyboard focus, dialogs, RTL, and dynamically inserted buttons. */
export function TooltipHost(){
  const [trigger,setTrigger]=useState<Trigger|null>(null);
  const activeRef=useRef<Trigger|null>(null);
  const bubbleRef=useRef<HTMLDivElement>(null);
  const timerRef=useRef<number|null>(null);
  const hiddenTitle=useRef<{element:HTMLElement;title:string}|null>(null);
  const describedBy=useRef<{element:HTMLElement;old:string|null}|null>(null);

  useLayoutEffect(()=>{
    if(!trigger || !bubbleRef.current || !trigger.element.isConnected)return;
    const bubble=bubbleRef.current;
    const rect=trigger.element.getBoundingClientRect();
    const isRail=!!trigger.element.closest(".owui-rail,.noata-compact-rail");
    const rtl=getComputedStyle(trigger.element).direction==="rtl";
    const pos=tooltipPosition(rect,{width:bubble.offsetWidth,height:bubble.offsetHeight},
      {width:window.innerWidth,height:window.innerHeight},tooltipPreferredSide(isRail,rtl));
    bubble.style.left=pos.left+"px";
    bubble.style.top=pos.top+"px";
    bubble.dataset.side=pos.side;
  },[trigger]);

  useEffect(()=>{
    const clearTimer=()=>{if(timerRef.current!==null){window.clearTimeout(timerRef.current);timerRef.current=null;}};
    const restoreTitle=()=>{
      const item=hiddenTitle.current;
      if(item && item.element.isConnected)item.element.setAttribute("title",item.title);
      hiddenTitle.current=null;
    };
    const restoreDescription=()=>{
      const item=describedBy.current;
      if(item&&item.element.isConnected){
        if(item.old===null)item.element.removeAttribute("aria-describedby");
        else item.element.setAttribute("aria-describedby",item.old);
      }
      describedBy.current=null;
    };
    const hide=()=>{
      clearTimer();activeRef.current=null;setTrigger(null);
      restoreTitle();restoreDescription();
    };
    const activate=(element:HTMLElement,source:Trigger["source"])=>{
      const label=caption(element,hiddenTitle.current?.element===element?hiddenTitle.current.title:null);
      if(!label)return;
      clearTimer();
      const previous=activeRef.current;
      if(previous?.element===element && previous?.label===label && previous.source===source)return;
      restoreDescription();
      if(hiddenTitle.current?.element!==element)restoreTitle();
      if(!hiddenTitle.current && element.hasAttribute("title")){
        hiddenTitle.current={element,title:element.getAttribute("title")??""};
        element.removeAttribute("title");
      }
      if(source==="focus"){
        const old=element.getAttribute("aria-describedby");
        describedBy.current={element,old};
        element.setAttribute("aria-describedby",[old,TIP_ID].filter(Boolean).join(" "));
      }
      const next={element,label,source};
      activeRef.current=next;setTrigger(next);
    };
    const onPointerOver=(event:PointerEvent)=>{
      if(event.pointerType==="touch")return;
      const element=getTrigger(event.target);
      if(!element || element===activeRef.current?.element)return;
      clearTimer();
      const label=caption(element,hiddenTitle.current?.element===element?hiddenTitle.current.title:null);
      if(!label)return;
      // Suppress native browser title boxes that would duplicate our tooltip.
      if(hiddenTitle.current?.element!==element)restoreTitle();
      if(element.hasAttribute("title")){
        hiddenTitle.current={element,title:element.getAttribute("title")??""};
        element.removeAttribute("title");
      }
      timerRef.current=window.setTimeout(()=>activate(element,"pointer"),260);
    };
    const onPointerOut=(event:PointerEvent)=>{
      const element=getTrigger(event.target);
      if(!element)return;
      const related=event.relatedTarget;
      if(related instanceof Node && element.contains(related))return;
      clearTimer();
      if(activeRef.current?.element===element){
        if(document.activeElement===element && activeRef.current.source==="focus")return;
        hide();
      }else if(hiddenTitle.current?.element===element)restoreTitle();
    };
    const onFocusIn=(event:FocusEvent)=>{
      const element=getTrigger(event.target);
      if(element)activate(element,"focus");
    };
    const onFocusOut=(event:FocusEvent)=>{
      if(activeRef.current?.element===event.target)hide();
    };
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")hide();};
    const onPointerDown=()=>hide();
    const onScroll=()=>hide();
    const reposition=()=>{
      const current=activeRef.current,bubble=bubbleRef.current;
      if(!current||!bubble||!current.element.isConnected){hide();return;}
      const rect=current.element.getBoundingClientRect();
      const pos=tooltipPosition(rect,{width:bubble.offsetWidth,height:bubble.offsetHeight},
        {width:window.innerWidth,height:window.innerHeight},
        tooltipPreferredSide(!!current.element.closest(".owui-rail,.noata-compact-rail"),
          getComputedStyle(current.element).direction==="rtl"));
      bubble.style.left=pos.left+"px";bubble.style.top=pos.top+"px";bubble.dataset.side=pos.side;
    };
    document.addEventListener("pointerover",onPointerOver);
    document.addEventListener("pointerout",onPointerOut);
    document.addEventListener("focusin",onFocusIn);
    document.addEventListener("focusout",onFocusOut);
    document.addEventListener("keydown",onKeyDown);
    document.addEventListener("pointerdown",onPointerDown);
    document.addEventListener("scroll",onScroll,true);
    window.addEventListener("resize",reposition);
    return ()=>{
      clearTimer();restoreTitle();restoreDescription();
      document.removeEventListener("pointerover",onPointerOver);
      document.removeEventListener("pointerout",onPointerOut);
      document.removeEventListener("focusin",onFocusIn);
      document.removeEventListener("focusout",onFocusOut);
      document.removeEventListener("keydown",onKeyDown);
      document.removeEventListener("pointerdown",onPointerDown);
      document.removeEventListener("scroll",onScroll,true);
      window.removeEventListener("resize",reposition);
    };
  },[]);

  return trigger ? createPortal(
    <div key={trigger.label} id={TIP_ID} ref={bubbleRef} className="noata-global-tooltip"
      role="tooltip" dir="auto" data-noata-tooltip-overlay="" data-side="top">
      {trigger.label}
    </div>,document.body,
  ):null;
}
