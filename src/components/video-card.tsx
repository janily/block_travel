/* Real, versioned local posters need no remote image service. */
/* eslint-disable @next/next/no-img-element */
import { categories,formatDuration,type PublicVideo,type PublishedVideo } from "@/lib/content-schema";
import { PlayLink } from "./player-provider";
import { css } from "./ui";

export function PlayIcon() { return <svg width="17" height="17" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m5 3 12 7-12 7z"/></svg>; }
export function FilmMeta({video}:{video:PublishedVideo}) {
  return <>{video.series}{video.episode ? " · 第 "+video.episode+" 集" : ""}{video.burnedInCaptions ? " · 中文字幕":""}</>;
}
export function FeaturedVideo({video}:{video:PublishedVideo}) {
  return <div className={css("featured")}>
    <PlayLink video={video} className={css("featured-screen")} aria-label={"播放《"+video.title+"》，"+formatDuration(video.durationSeconds)}>
      <img className={css("featured-poster")} src={video.poster.src} width={video.poster.width} height={video.poster.height} alt={video.poster.alt} fetchPriority="high"/>
      <span className={css("poster-shade")} aria-hidden="true"/><span className={css("screen-tag")}>精选影片</span>
      <span className={css("poster-action")} aria-hidden="true"><span className={css("play-circle")}><PlayIcon/></span>点击播放</span>
      <span className={css("duration")}>{formatDuration(video.durationSeconds)}</span>
    </PlayLink>
    <div className={css("feature-caption")}><div className={css("feature-title-row")}>
      {video.episode && <span className={css("episode-label")}>EP.{String(video.episode).padStart(2,"0")}</span>}
      <h2>{video.title}</h2><span className={css("caption-category")}>{categories[video.category]}</span>
    </div><p><FilmMeta video={video}/></p></div>
  </div>;
}
export function VideoCard({video}:{video:PublishedVideo}) {
  return <article className={css("film-card available-card")}>
    <PlayLink video={video} aria-label={"播放《"+video.title+"》"}>
      <div className={css("card-media")}><img src={video.poster.src} width={video.poster.width} height={video.poster.height} alt={video.poster.alt}/>
        <span className={css("card-play")}><PlayIcon/></span><span className={css("duration")}>{formatDuration(video.durationSeconds)}</span>
      </div>
      <div className={css("card-body")}><span className={css("card-category")}>{categories[video.category]} · 已更新</span><h3>{video.title}</h3><p>{video.summary}</p><p><FilmMeta video={video}/></p></div>
    </PlayLink>
  </article>;
}
export function PlannedTopic({video}:{video:Extract<PublicVideo,{status:"planned"}>}) {
  return <article className={css("planned-topic")}><div className={css("planned-topic-heading")}><h3>{video.title}</h3><span className={css("topic-status")}>待更新</span></div><p>{video.summary}</p><span className={css("topic-category")}>{categories[video.category]}</span></article>;
}
