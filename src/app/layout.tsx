import type { Metadata, Viewport } from "next";
import { getContent } from "@/lib/content.server";
import { pageMetadata } from "@/lib/metadata";
import { PlayerProvider } from "@/components/player-provider";
import { SiteHeader } from "@/components/site-header";
import { css } from "@/components/ui";
import "./globals.css";
const {site}=getContent();
export const metadata:Metadata=pageMetadata(site.name+" · 用视频看懂 Web3",site.description,"/");
export const viewport:Viewport={themeColor:"#090B0E"};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="zh-CN"><body>
    <a className={css("skip-link")} href="#main-content">跳到主要内容</a>
    <PlayerProvider><SiteHeader name={site.name}/>{children}</PlayerProvider>
    <footer className={css("site-footer container")}><span>{site.name}</span><span>从起源出发，保持好奇。</span></footer>
  </body></html>;
}
