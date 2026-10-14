"use client";

import {useEffect,useLayoutEffect,useRef,useState} from "react";
import {createPortal} from "react-dom";
import {tooltipPosition,tooltipPreferredSide} from "@/lib/ui/tooltip-position";

type Source="pointer"|"keyboard";
type Trigger={element:HTMLElement;label:string;source:Source;revision:number};
const TIP_ID="noata-global-tooltip";
const CONTROLS='button, a, summary, [role="button"], input[type="button"], input[type="submit"], [data-tooltip]';
const HOVER_DELAY=420;

function controlFrom(node:EventTarget|null):HTMLElement|null{
  if(!(node instanceof Element))return null;
  const target=node.closest<HTMLElement>(CONTROLS);
  if(!target || !target.isConnected || target.matches(':disabled,[aria-disabled="true"]'))return null;
  if(target.closest('[data-noata-tooltip="off"],[inert]'))return null;
  const modal=document.querySelector<HTMLElement>('dialog[open], [role="dialog"][aria-modal="true"]');
  if(modal && !modal.contains(target))return null;
  return target;
}
function getCaption(target:HTMLElement,hiddenTitle:string|null):string{
  const explicit=target.getAttribute("data-tooltip")?.trim();
  if(explicit==="off")return "";
  if(explicit)return explicit.slice(0,75);
  // Never repeat descriptions or full labels from already-readable buttons.
  const visible=(target.innerText||target.textContent||"").replace(/\s+/g," ").trim();
  const compact=target.classList.contains("owui-icon") || target.matches(".noata-compact-rail *,[data-icon-only]");
  if(!compact && visible.length>0)return "";
  const label=target.getAttribute("aria-label")||target.getAttribute("title")||hiddenTitle||"";
  const concise=label.replace(/\s+/g," ").trim();
  return concise.length>0&&concise.length<=75?concise:"";
}

/** Intent-driven captions; mouse movement or keyboard navigation is required.
 * Click-induced focus, programmatic focus, stationary pointers and touch must
 * never create a floating tooltip. */
export function TooltipHost(){
  const [trigger,setTrigger]=useState<Trigger|null>(null);
  const current=useRef<Trigger|null>(null);
  const popup=useRef<HTMLDivElement>(null);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const hovered=useRef<HTMLElement|null>(null);
  const blocked=useRef<HTMLElement|null>(null);
  const keyboardMode=useRef(false);
  const titleBackup=useRef<{element:HTMLElement;value:string}|null>(null);
  const descriptionBackup=useRef<{element:HTMLElement;value:string|null}|null>(null);
  const sequence=useRef(0);

  const position=()=>{
    const item=current.current,box=popup.current;
    if(!item||!box||!item.element.isConnected)return;
    const rect=item.element.getBoundingClientRect();
    const rail=!!item.element.closest(".owui-rail,.noata-compact-rail");
    const rtl=getComputedStyle(item.element).direction==="rtl";
    const target=tooltipPosition(rect,{width:box.offsetWidth,height:box.offsetHeight},
      {width:window.innerWidth,height:window.innerHeight},tooltipPreferredSide(rail,rtl));
    box.style.left=target.left+"px";
    box.style.top=target.top+"px";
    box.dataset.side=target.side;
    box.dataset.ready="true";
  };
  useLayoutEffect(()=>{position()},[trigger]);

  useEffect(()=>{
    const clear=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null}};
    const restoreTitle=()=>{
      const b=titleBackup.current;
      if(b?.element.isConnected)b.element.setAttribute("title",b.value);
      titleBackup.current=null;
    };
    const restoreDescription=()=>{
      const b=descriptionBackup.current;
      if(b?.element.isConnected){
        if(b.value===null)b.element.removeAttribute("aria-describedby");
        else b.element.setAttribute("aria-describedby",b.value);
      }
      descriptionBackup.current=null;
    };
    const hide=()=>{
      clear();current.current=null;setTrigger(null);
      restoreDescription();restoreTitle();
    };
    const stripTitle=(element:HTMLElement)=>{
      if(titleBackup.current?.element===element)return;
      restoreTitle();
      const title=element.getAttribute("title");
      if(title!==null){
        titleBackup.current={element,value:title};
        element.removeAttribute("title");
      }
    };
    const show=(element:HTMLElement,source:Source)=>{
      if(!element.isConnected || element===blocked.current || element!==hovered.current&&source==="pointer")return;
      if(source==="keyboard" && (document.activeElement!==element||!keyboardMode.current))return;
      const label=getCaption(element,titleBackup.current?.element===element?titleBackup.current.value:null);
      if(!label)return;
      clear();
      if(current.current?.element===element&&current.current.label===label&&current.current.source===source)return;
      restoreDescription();
      stripTitle(element);
      if(source==="keyboard"){
        const old=element.getAttribute("aria-describedby");
        descriptionBackup.current={element,value:old};
        element.setAttribute("aria-describedby",[old,TIP_ID].filter(Boolean).join(" "));
      }
      const next={element,label,source,revision:++sequence.current};
      current.current=next;setTrigger(next);
    };
    const onMove=(event:PointerEvent)=>{
      if(event.pointerType!=="mouse"&&event.pointerType!=="pen")return;
      keyboardMode.current=false;
      const element=controlFrom(event.target);
      if(element!==blocked.current)blocked.current=null;
      if(element!==hovered.current){
        clear();
        if(current.current)hide();
        hovered.current=element;
      }
      if(!element||element===blocked.current||current.current?.element===element)return;
      // Movement, not synthetic pointerover, is the evidence of hover.
      const label=getCaption(element,titleBackup.current?.element===element?titleBackup.current.value:null);
      // A descriptive, already-labelled button needs no extra caption and
      // no duplicate native title balloon either.
      if(!label){if(element.hasAttribute("title"))stripTitle(element);return;}
      stripTitle(element);
      if(timer.current===null)timer.current=setTimeout(()=>{
        timer.current=null;
        if(hovered.current===element&&blocked.current!==element&&element.matches(":hover"))show(element,"pointer");
      },HOVER_DELAY);
    };
    const onOut=(event:PointerEvent)=>{
      const element=controlFrom(event.target);
      if(!element)return;
      const related=event.relatedTarget;
      if(related instanceof Node&&element.contains(related))return;
      if(hovered.current===element)hovered.current=null;
      if(blocked.current===element)blocked.current=null;
      clear();
      if(current.current?.element===element&&current.current.source==="pointer")hide();
      else if(!current.current)restoreTitle();
    };
    const onFocus=(event:FocusEvent)=>{
      const element=controlFrom(event.target);
      if(!keyboardMode.current||!element)return;
      hovered.current=null;blocked.current=null;clear();
      show(element,"keyboard");
    };
    const onBlur=(event:FocusEvent)=>{
      if(current.current?.element===event.target&&current.current.source==="keyboard")hide();
    };
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){hide();blocked.current=document.activeElement instanceof HTMLElement?document.activeElement:null;return;}
      if(event.key==="Tab"||event.key==="ArrowDown"||event.key==="ArrowUp"||event.key==="ArrowLeft"||event.key==="ArrowRight"){
        keyboardMode.current=true;
        // If the focus stays on the same button, a subsequent keyboard
        // navigation key must not surface a stale pointer caption.
        if(current.current?.source==="pointer")hide();
      }else if(event.key==="Enter"||event.key===" "){hide();keyboardMode.current=false;}
    };
    const onDown=(event:PointerEvent)=>{
      keyboardMode.current=false;
      blocked.current=controlFrom(event.target);
      hovered.current=null;
      hide();
    };
    const onClick=()=>{keyboardMode.current=false;hide()};
    const onScroll=()=>{hovered.current=null;hide()};
    const onVisibility=()=>{if(document.hidden)hide()};
    const onExit=()=>{hovered.current=null;blocked.current=null;hide()};
    const onResize=()=>{if(current.current)hide()};
    const onMutation=()=>{
      const item=current.current;
      if(item && (!item.element.isConnected || controlFrom(item.element)!==item.element))hide();
    };
    const observer=new MutationObserver(onMutation);
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["open","aria-modal","aria-hidden","inert"]});
    document.addEventListener("pointermove",onMove,{passive:true});
    document.addEventListener("pointerout",onOut);
    document.addEventListener("pointerdown",onDown,true);
    document.addEventListener("click",onClick,true);
    document.addEventListener("focusin",onFocus);
    document.addEventListener("focusout",onBlur);
    document.addEventListener("keydown",onKey,true);
    document.addEventListener("scroll",onScroll,true);
    document.addEventListener("wheel",onScroll,{passive:true});
    document.addEventListener("visibilitychange",onVisibility);
    window.addEventListener("blur",onExit);
    window.addEventListener("resize",onResize);
    window.addEventListener("popstate",onExit);
    return ()=>{
      observer.disconnect();clear();restoreTitle();restoreDescription();
      document.removeEventListener("pointermove",onMove);
      document.removeEventListener("pointerout",onOut);
      document.removeEventListener("pointerdown",onDown,true);
      document.removeEventListener("click",onClick,true);
      document.removeEventListener("focusin",onFocus);
      document.removeEventListener("focusout",onBlur);
      document.removeEventListener("keydown",onKey,true);
      document.removeEventListener("scroll",onScroll,true);
      document.removeEventListener("wheel",onScroll);
      document.removeEventListener("visibilitychange",onVisibility);
      window.removeEventListener("blur",onExit);
      window.removeEventListener("resize",onResize);
      window.removeEventListener("popstate",onExit);
    };
  },[]);

  return trigger?createPortal(
    <div key={trigger.revision} id={TIP_ID} role="tooltip" dir="auto"
      ref={popup} className="noata-global-tooltip" data-noata-tooltip-overlay="" data-ready="false" data-side="top">
      {trigger.label}
    </div>,document.body
  ):null;
}
