"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { css } from "./ui";

export function SiteHeader({name}:{name:string}) {
  const pathname=usePathname();
  return <header className={css("site-header")}><div className={css("header-inner container")}>
    <Link className={css("brand")} href="/" aria-label={name+"，返回首页"}>
      <svg className={css("brand-mark")} width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect x="3" y="3" width="26" height="26" rx="7" stroke="currentColor"/><path d="m13 10 9 6-9 6z" fill="currentColor"/><circle cx="27" cy="5" r="2" fill="currentColor"/></svg>
      <span>{name}</span>
    </Link>
    <nav aria-label="主要导航"><Link href="/" aria-current={pathname==="/" ? "page":undefined}>首页</Link><Link href="/videos" aria-current={pathname==="/videos" ? "page":undefined}>视频片单</Link><Link href="/#about">关于系列</Link></nav>
    <span className={css("header-note")}>WEB3 EXPLAINED</span>
  </div></header>;
}
