"use client";
import { useEffect, useRef, useState } from "react";
import { categories, type PublicVideo } from "@/lib/content-schema";
import { filterVideos, normalizeQuery, parseQuery, serializeQuery, type Query } from "@/lib/catalog-query";
import { VideoCard, PlannedTopic } from "./video-card";
import { css } from "./ui";

export function VideoCatalog({videos,initialQuery}:{videos:PublicVideo[];initialQuery:Query}) {
  const [query,setQuery]=useState(initialQuery);
  const [draft,setDraft]=useState(initialQuery.q);
  const input=useRef<HTMLInputElement>(null);
  const resultTitle=useRef<HTMLHeadingElement>(null);
  const focusPlanned=useRef(false);
  useEffect(()=>{
    if(focusPlanned.current && !query.available) {
      resultTitle.current?.focus();
      focusPlanned.current=false;
    }
  },[query.available]);
  const composing=useRef(false);
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cancel=()=>{clearTimeout(timer.current);timer.current=undefined;};
  useEffect(()=>{
    const restore=()=>{
      clearTimeout(timer.current);timer.current=undefined;composing.current=false;
      const next=parseQuery(new URLSearchParams(window.location.search));
      setQuery(next);setDraft(next.q);
    };
    window.addEventListener("popstate",restore);
    return ()=>{clearTimeout(timer.current);window.removeEventListener("popstate",restore);};
  },[]);
  function update(next:Query,delay=0) {
    cancel();setQuery(next);
    const write=()=>{window.history.replaceState(null,"",serializeQuery(next,window.location.href));};
    if(delay) timer.current=setTimeout(write,delay); else write();
  }
  function reset() {
    composing.current=false;setDraft("");update({q:"",category:"all",available:false});input.current?.focus();
  }
  const matches=filterVideos(videos,query);
  const published=matches.filter(v=>v.status==="published");
  const planned=matches.filter(v=>v.status==="planned");
  const hiddenPlanned=query.available ? filterVideos(videos,{...query,available:false}).filter(v=>v.status==="planned").length:0;
  return <>
    <form action="/videos" method="get" noValidate onSubmit={event=>{
      if(composing.current) {event.preventDefault();return;}
      event.preventDefault();setDraft(normalizeQuery(draft));update({...query,q:normalizeQuery(draft)});
    }}>
      <div className={css("catalog-tools")}>
        <fieldset className={css("catalog-categories")}><legend className={css("sr-only")}>分类</legend>
          {([["all","全部机制"],...Object.entries(categories)] as const).map(([value,label])=><label key={value} className={css("category-option")}>
            <input type="radio" name="category" value={value} checked={query.category===value} onChange={()=>update({...query,category:value as Query["category"]})}/>
            <span className={css("category-button")}>{label}</span>
          </label>)}
        </fieldset>
        <div className={css("catalog-search")}><label className={css("sr-only")} htmlFor="film-search">搜索片名或机制</label><span className={css("search-icon")} aria-hidden="true">⌕</span>
          <input id="film-search" className={css("film-search")} ref={input} type="search" name="q" value={draft} placeholder="搜索片名或机制" onCompositionStart={()=>{composing.current=true;cancel();}}
            onCompositionEnd={event=>{composing.current=false;const q=normalizeQuery(event.currentTarget.value);setDraft(q);update({...query,q},250);}}
            onChange={event=>{const value=event.currentTarget.value;setDraft(value);if(!composing.current) update({...query,q:normalizeQuery(value)},250);}}/>
          {draft && <button className={css("clear-search")} type="button" aria-label="清除搜索" onClick={()=>{composing.current=false;setDraft("");update({...query,q:""});input.current?.focus();}}>×</button>}
        </div>
      </div>
      <div className={css("catalog-results-bar")}><p className={css("catalog-summary")} aria-live="polite" aria-atomic="true">已更新 {published.length} · 待更新 {planned.length}</p>
        <label className={css("availability-filter")}><input className={css("available-only")} name="available" type="checkbox" value="1" checked={query.available} onChange={event=>update({...query,available:event.target.checked})}/>仅看已更新</label>
      </div>
      <noscript><button type="submit" className={css("button button-secondary")}>应用筛选</button></noscript>
    </form>
    {published.length>0 && <section className={css("catalog-group")} aria-labelledby="published-title"><div className={css("catalog-group-heading")}><h2 id="published-title">已更新</h2><span>{published.length} 部影片</span></div>
      <div className={css("catalog-films"+(published.length===1 ? " catalog-films-featured":""))}>{published.map(video=><VideoCard key={video.id} video={video}/>)}</div>
    </section>}
    {planned.length>0 && <section className={css("catalog-group")} aria-labelledby="planned-title"><div className={css("catalog-group-heading")}><h2 id="planned-title" ref={resultTitle} tabIndex={-1}>后续选题</h2><span>{planned.length} 条待更新</span></div><div className={css("catalog-topic-list")}>{planned.map(video=><PlannedTopic key={video.id} video={video}/>)}</div></section>}
    {matches.length===0 && <section className={css("catalog-empty")}><h3>{hiddenPlanned ? "相关选题还在准备中" : "暂时没有匹配的影片"}</h3><p>{hiddenPlanned ? "有 "+hiddenPlanned+" 条匹配的待更新选题，暂时还不能播放。" : "试试其他关键词，或重置筛选看看。"}</p><div className={css("catalog-empty-actions")}>
      {hiddenPlanned>0 && <button type="button" className={css("button button-primary")} onClick={()=>{focusPlanned.current=true;update({...query,available:false});}}>查看待更新选题</button>}
      <button type="button" className={css("button button-secondary")} onClick={reset}>重置筛选</button>
    </div></section>}
    <div className={css("catalog-endnote")}><p>每个机制，一支短片。新内容陆续更新。</p><button type="button" className={css("button button-secondary")} onClick={reset}>重置筛选</button></div>
  </>;
}
