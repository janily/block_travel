import Link from "next/link";
import { getContent } from "@/lib/content.server";
import { formatDuration, recentVideos } from "@/lib/content-schema";
import { FeaturedVideo, VideoCard, FilmMeta, PlayIcon } from "@/components/video-card";
import { PlayLink } from "@/components/player-provider";
import { css } from "@/components/ui";

export default function Home() {
  const {videos,featured}=getContent();
  const recent=recentVideos(videos,featured?.id);
  return <main id="main-content" tabIndex={-1}>
    <section className={css("showcase container")} aria-labelledby="page-title">
      <div className={css("intro")}><p className={css("intro-kicker")}>用视频看懂 Web3</p><h1 id="page-title">每个机制，<br/>一支<span className={css("gold-word")}>短片。</span></h1>
        <p className={css("intro-copy")}>{featured ? featured.summary:"首支影片准备中"}</p>
        {featured ? <><PlayLink className={css("button button-primary")} video={featured}><PlayIcon/>播放《{featured.title}》<span className={css("button-duration")}>{formatDuration(featured.durationSeconds)}</span></PlayLink><p className={css("intro-footnote")}><FilmMeta video={featured}/></p></> : <Link className={css("button button-primary")} href="/videos">浏览片单</Link>}
      </div>
      {featured ? <FeaturedVideo video={featured}/> : <div className={css("empty-state")}><h2>首支影片准备中</h2><p>从一个问题开始，等待下一次放映。</p></div>}
    </section>
    {recent.length>0 && <section className={css("recent-section container")} aria-labelledby="recent-title">
      <div className={css("section-heading recent-heading")}>
        <div className={css("recent-heading-title")}><h2 id="recent-title">最近更新</h2><span>{recent.length} 部短片</span></div>
        <Link className={css("section-more")} href="/videos?available=1">浏览片单 <span aria-hidden="true">→</span></Link>
      </div>
      <div className={css("recent-grid")}>{recent.map(video=><VideoCard key={video.id} video={video} variant="recent"/>)}</div>
    </section>}
    <section className={css("about-section container")} id="about" aria-labelledby="about-title"><div><h2 id="about-title">把一个问题，讲清楚。</h2><p className={css("about-copy")}>这里收录我制作的 Web3 与区块链解读视频。<br/>从概念的来处，到机制的运转，每支短片只专注一个主题。</p></div><Link className={css("text-link")} href="/videos">浏览片单 ↗</Link></section>
  </main>;
}
