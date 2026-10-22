# MVP 交付与验收记录

依据：block-travel-mvp-development-v1.1.md。日期：2026-10-22（Asia/Shanghai）。
本记录区分本地自动检查与实际部署/真实设备检查，不把本地成功视为全部上线条件已满足。

## 实现与差异

已实现 Next.js 16 App Router、Node 24、严格 TS、Zod 内容、CSS Modules、首页/片单、URL 筛选、原生 dialog/video、真实 MP4 降级、内容校验及 CI。没有扩展 P1。
迁移源：批准原型提交 fee96d00446838b558de7cd877466e425e1bac8f。
真实《起源》为 9,241,839 字节，193.033333 秒、910×512、H.264/yuv420p + AAC；moov 在 mdat 前，已启用 faststart，没有重复有损压缩。展示时长为 03:13。
保留五条 planned；归档记录不发往公开客户端。没有视频查询参数或播放历史项。
视觉 token 保持批准值；迁移后 runtime CSS 是变量来源，已移除不存在的生成流程说明。

交付使用功能分支和 PR；main 保留原有历史。远端提交 SHA 及 Preview 见 PR，后续验收记录会追加到本文件。
本地初始化采用原仓库归档，因为执行环境普通 Git HTTPS 未配置身份；远端提交通过 GitHub Git Data API 以原 main 为父提交创建，不使用本地初始化历史替换远端历史。

## 本地检查

- pnpm build：通过（ESLint、next typegen + tsc、内容检查、11 项 Vitest、Next 生产构建）。
- pnpm test:e2e：10/10 通过，使用系统 Chromium 154.0.8037.57，复用生产构建。
- 本地 GET Range：206；Content-Range 为 bytes 0-1023/9241839；1024 字节。
- Playwright 配套浏览器下载域名在此环境受限，本地通过 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH 使用已有 Chromium；CI 在 GitHub runner 安装锁定的浏览器。
- 隔离目录中 videos=[]、featuredVideoId=null 且完全没有 public 目录：完整 pnpm build 通过（包括相同 11 项独立 fixture 测试）。
- 修复：媒体 error 后 pause 覆盖错误提示；无 public 目录的空片单；筛选恢复的可见焦点。
- 两轴代码审查覆盖规范与研发要求；对应问题已修复并纳入回归检查。

## A01–A12

| 编号 | 本地证据 | 部署/设备验收 |
| --- | --- | --- |
| A01 | 首页/片单直接访问、GET 搜索、308 保留参数、404 通过 | Preview 待确认 |
| A02 | 真实起源、03:13、五条 planned、无假播放入口 | Preview 待确认 |
| A03 | Chromium 实播且 metadata 正确；Range 通过 | 实际域名 15 秒及未缓冲拖动待确认 |
| A04 | 点击前无 video/MP4；点击后唯一实例 | Preview 待确认 |
| A05 | 关闭/Escape/遮罩/pagehide 释放 src 并暂停；重试通过 | 移动端声音/全屏/PiP 待人工确认 |
| A06 | Back/Forward、URL 状态恢复、导航清理通过 | Preview 待确认 |
| A07 | IME、组合筛选、清除、重置、计划选题恢复通过 | 真实输入法待人工确认 |
| A08 | 本地 Chromium 自动化通过 | Firefox、iOS Safari、Android Chrome 待真实设备验收 |
| A09 | 320/375/1280 无横向溢出；焦点恢复通过 | 移动横竖屏和全键盘人工检查待确认 |
| A10 | 模拟 404 错误、真实 src 重试、无 JS GET/MP4 链接通过 | 真实断网待确认 |
| A11 | 空片单、非法 featured、缺失素材、路径/LFS/100 MiB fixture 通过 | 通过；无素材目录的空片单完整构建也通过 |
| A12 | 生产构建与 e2e 通过；CI/发布/回滚说明齐备 | GitHub CI、Preview noindex、正式域名 canonical 待确认 |

## 正式上线前剩余事项

1. 以 PR 最新提交对应 Preview 验收，确认 GitHub CI 为成功。
2. 真实 iOS Safari、Android Chrome、桌面 Firefox，目标网络播放至少 15 秒并拖动到未缓冲位置；检查字幕、声音、横竖屏、关闭静音。
3. 确定生产域名后设置 SITE_URL；main 开启 PR 合并与必需的 MVP checks / build-and-e2e。
4. 通过后合并 main，检查正式部署 canonical、sitemap、播放与 Range。
5. 回滚入口：Vercel 项目 block-travel → Deployments → 已确认正常部署 → Rollback。首次上线前没有可称为“已知正常生产版本”的回滚目标。

此环境无法代替真实手机或目标地区网络验收；未完成项目保持待验收状态。


## 远端交付与 Vercel 联调

源码首提交：447ead9550462ed13b29229198cf47a2705355b2；PR：https://github.com/janily/block_travel/pull/1 。
GitHub push CI 39757631733 已成功，包含冻结安装、构建和 Chromium e2e。
初次 Vercel 联调发现 pnpm 把依赖 store 放在仓库内，ESLint 扫描该缓存导致失败；
已用 .pnpm-store 与 .vercel 下的临时依赖样本复现，再将两者从 ESLint/TypeScript 扫描范围排除。
该修复不排除任何应用源码。修复版本的 Preview 结果以 PR 最新验收记录为准。

Vercel 首次自动部署被标记为 production，已在完成前取消；仅显式 target=staging 的部署用于预览。
自动审批未批准新增持久化生产构建限制，因此该设置未改动；合并前仍需核对 Production Branch=main。
环境网络策略拒绝直接请求新 Vercel 域名，不能据此宣称实际域名 Range 或目标网络实播通过。
