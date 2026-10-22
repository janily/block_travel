"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, Suspense, type AnchorHTMLAttributes } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { PublishedVideo } from "@/lib/content-schema";
import { VideoDialog } from "./video-dialog";

type Session = {video:PublishedVideo; token:number; trigger:HTMLElement};
type Player = {open:(video:PublishedVideo,trigger:HTMLElement)=>void};
const PlayerContext=createContext<Player | null>(null);

function NavigationWatcher({close}:{close:()=>void}) {
  const path=usePathname(),search=useSearchParams().toString();
  useEffect(()=>{ close(); },[path,search,close]);
  return null;
}
export function PlayerProvider({children}:{children:React.ReactNode}) {
  const [session,setSession]=useState<Session | null>(null);
  const counter=useRef(0);
  const release=useRef<(()=>void) | null>(null);
  const [progress]=useState(()=>new Map<string,number>());
  const close=useCallback(()=>{
    counter.current++;
    release.current?.();
    release.current=null;
    setSession(null);
  },[]);
  const register=useCallback((fn:()=>void)=>{release.current=fn;},[]);
  const open=useCallback((video:PublishedVideo,trigger:HTMLElement)=>{
    release.current?.();
    setSession({video,trigger,token:++counter.current});
  },[]);
  useEffect(()=>{
    window.addEventListener("pagehide",close);
    window.addEventListener("popstate",close);
    return ()=>{ window.removeEventListener("pagehide",close); window.removeEventListener("popstate",close); release.current?.(); };
  },[close]);
  return <PlayerContext.Provider value={{open}}>
    {children}
    <Suspense fallback={null}><NavigationWatcher close={close}/></Suspense>
    {session && <VideoDialog key={session.token} video={session.video} trigger={session.trigger} close={close} progress={progress} register={register}/>}
  </PlayerContext.Provider>;
}
export function PlayLink({video,children,...props}:AnchorHTMLAttributes<HTMLAnchorElement> & {video:PublishedVideo}) {
  const player=useContext(PlayerContext);
  return <a {...props} href={video.src} onClick={event=>{
    if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !player || typeof HTMLDialogElement==="undefined" || typeof HTMLDialogElement.prototype.showModal!=="function") return;
    event.preventDefault();
    player.open(video,event.currentTarget);
  }}>{children}</a>;
}
