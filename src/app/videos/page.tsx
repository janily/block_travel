import { getContent } from "@/lib/content.server";
import { parseQuery, type SearchParams } from "@/lib/catalog-query";
import { pageMetadata } from "@/lib/metadata";
import { VideoCatalog } from "@/components/video-catalog";
import { css } from "@/components/ui";
export const metadata=pageMetadata("视频片单 · 链上放映室","浏览已更新影片与后续选题，用视频看懂 Web3 与区块链机制。","/videos");
export default async function Videos({searchParams}:{searchParams:Promise<SearchParams>}) {
  const query=parseQuery(await searchParams);
  const {videos}=getContent();
  return <main id="main-content" className={css("container")} tabIndex={-1}><div className={css("catalog-intro")}><h1>视频片单<span className={css("catalog-title-dot")}>。</span></h1><p className={css("catalog-description")}>从起源出发，找到你想看懂的机制。</p></div><VideoCatalog key={JSON.stringify(query)} videos={videos} initialQuery={query}/></main>;
}
