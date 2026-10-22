import Link from "next/link";
import { css } from "@/components/ui";
export default function NotFound() {
  return <main id="main-content" className={css("container empty-state")} tabIndex={-1}><p>404</p><h1>这一页还没有放映。</h1><p>你可以回到首页，或去片单找一支短片。</p><Link className={css("button button-primary")} href="/">回到首页</Link> <Link className={css("button button-secondary")} href="/videos">浏览片单</Link></main>;
}
