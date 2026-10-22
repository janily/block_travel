"use client";
import Link from "next/link";
import { css } from "@/components/ui";
export default function ErrorPage({reset}:{reset:()=>void}) {
  return <main id="main-content" className={css("container empty-state")} tabIndex={-1}><h1>页面暂时无法打开</h1><p>请检查网络连接后重试。</p><button className={css("button button-primary")} onClick={reset}>重新加载</button> <Link className={css("button button-secondary")} href="/">回到首页</Link></main>;
}
