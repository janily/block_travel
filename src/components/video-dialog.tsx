"use client";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { categories,formatDuration,type PublishedVideo } from "@/lib/content-schema";
import { css } from "./ui";

type Props = {
  video:PublishedVideo; trigger:HTMLElement; close:()=>void;
  progress:Map<string,number>; register:(release:()=>void)=>void;
};
type State="loading" | "ready" | "playing" | "paused" | "buffering" | "ended" | "error";

function MediaSession({video,progress,registerMedia}:{video:PublishedVideo;progress:Map<string,number>;registerMedia:(fn:()=>void)=>void}) {
  const ref=useRef<HTMLVideoElement>(null);
  const [state,setState]=useState<State>("loading");
  const [slow,setSlow]=useState(false);
  const [attempt,setAttempt]=useState(0);
  useLayoutEffect(()=>{
    const media=ref.current!;
    let live=true, failed=false, timer:ReturnType<typeof setTimeout> | undefined;
    const cancel=()=>{clearTimeout(timer);timer=undefined;};
    const wait=(state:"loading"|"buffering")=>{
      if(!live || failed) return;
      setState(state);
      if(!timer) {
        setSlow(false);
        timer=setTimeout(()=>{if(live) setSlow(true);},20000);
      }
    };
    const settled=(state:State)=>{
      if(!live || (failed && state!=="error")) return;
      cancel();setSlow(false);setState(state);
    };
    const metadata=()=>{
      if(!live) return;
      const saved=progress.get(video.src) ?? 0;
      if(Number.isFinite(media.duration) && saved>0 && saved<media.duration) media.currentTime=saved;
    };
    const ready=()=>{if(live && !failed) {cancel();setSlow(false);setState(s=>s==="loading" || s==="buffering" ? "ready":s);}};
    const playing=()=>settled("playing");
    const paused=()=>settled("paused");
    const waiting=()=>wait("buffering");
    const ended=()=>{progress.delete(video.src);settled("ended");};
    const error=()=>{failed=true;settled("error");};
    const events = {loadedmetadata:metadata,canplay:ready,playing,pause:paused,waiting,stalled:waiting,ended,error};
    for(const [name,handler] of Object.entries(events)) media.addEventListener(name,handler);
    const dispose=()=>{
      if(!live) return;
      live=false;cancel();
      if(!media.ended && Number.isFinite(media.currentTime) && media.currentTime>0) progress.set(video.src,media.currentTime);
      for(const [name,handler] of Object.entries(events)) media.removeEventListener(name,handler);
      media.pause();
      if(document.pictureInPictureElement===media) void document.exitPictureInPicture().catch(()=>{});
      media.removeAttribute("src");media.load();
    };
    registerMedia(dispose);
    wait("loading");
    media.src=video.src;
    media.load();
    void media.play().catch((error:unknown)=>{
      if(!live) return;
      if(error instanceof DOMException && error.name==="NotAllowedError") settled("ready");
      // Real media errors are reported by the error event. AbortError is normal during disposal.
    });
    return dispose;
  },[video,progress,attempt,registerMedia]);
  const labels:Record<State,string>={loading:"正在加载视频…",ready:"点击原生播放按钮开始观看",playing:"正在播放",paused:"已暂停",buffering:"正在缓冲…",ended:"播放结束",error:"视频暂时无法播放，请检查网络连接后重试。"};
  return <>
    <div className={css("player-frame")}><video key={attempt} ref={ref} className={css("video-player")} controls playsInline preload="none" poster={video.poster.src} aria-label={"《"+video.title+"》视频播放器"}/></div>
    <p role={state==="error" ? "alert":"status"} className={css(state==="error" ? "player-error-inline":"player-status")}>{slow ? "加载较慢，可以继续等待或重试。" : labels[state]}</p>
    <div className={css("player-actions")}>
      {(state==="error" || slow) && <button type="button" className={css("button button-primary")} onClick={()=>setAttempt(x=>x+1)}>重新加载</button>}
      <a className={css("button button-secondary")} href={video.src} target="_blank" rel="noopener">单独打开视频<span className={css("sr-only")}>（新标签页）</span> ↗</a>
    </div>
  </>;
}

export function VideoDialog({video,trigger,close,progress,register}:Props) {
  const dialog=useRef<HTMLDialogElement>(null);
  const mediaRelease=useRef<(()=>void) | null>(null);
  const backdropStart=useRef(false);
  // Stable registration prevents status renders from restarting the media session.
  const registerMedia=useCallback((fn:()=>void)=>{mediaRelease.current=fn;},[]);
  useLayoutEffect(()=>{
    const element=dialog.current!;
    const scrollX=window.scrollX,scrollY=window.scrollY;
    const previouslyLocked=document.documentElement.classList.contains("player-open");
    document.documentElement.classList.add("player-open");
    let live=true;
    const dispose=()=>{
      if(!live) return;live=false;
      mediaRelease.current?.();
      if(element.open) element.close();
      if(!previouslyLocked) document.documentElement.classList.remove("player-open");
      window.scrollTo(scrollX,scrollY);
      if(trigger.isConnected) trigger.focus({preventScroll:true});
      else {
        const fallback=document.querySelector<HTMLElement>("main h1, main");
        fallback?.setAttribute("tabindex","-1");
        fallback?.focus({preventScroll:true});
      }
    };
    register(dispose);
    try {element.showModal();} catch {dispose();window.location.assign(video.src);}
    return dispose;
  },[trigger,register,video]);
  return <dialog ref={dialog} className={css("watch-dialog")} aria-labelledby="watch-title" aria-describedby="watch-description"
    onCancel={event=>{
      if(document.fullscreenElement) {event.preventDefault();return;}
      event.preventDefault();close();
    }}
    onPointerDown={event=>{backdropStart.current=event.target===event.currentTarget;}}
    onPointerUp={event=>{if(backdropStart.current && event.target===event.currentTarget) close();backdropStart.current=false;}}>
    <div className={css("watch-header")}><div><p className={css("eyebrow")}>{video.series}{video.episode ? " · EP."+String(video.episode).padStart(2,"0"):""}</p><h2 id="watch-title">{video.title}</h2></div>
      <button type="button" autoFocus className={css("close-button")} onClick={close} aria-label="关闭播放器">× <span>关闭</span></button>
    </div>
    <MediaSession video={video} progress={progress} registerMedia={registerMedia}/>
    <div className={css("watch-description")}><p className={css("watch-meta")}>{categories[video.category]} · {formatDuration(video.durationSeconds)}{video.burnedInCaptions ? " · 中文字幕":""}</p><p id="watch-description" className={css("watch-description-copy")}>{video.description ?? video.summary}</p></div>
  </dialog>;
}
