# 链上放映室（Block Travel）MVP 研发交付文档

**版本：** v1.1 · GitHub MP4 方案  
**编写及资料核对日期：** 2026-10-22  
**目标仓库：** [janily/block_travel](https://github.com/janily/block_travel)  
**交付对象：** 前端研发、部署负责人、内容作者  
**实施状态：** 本文件定义待开发内容与验收标准；不表示正式应用已经实现或部署。

> **本版是首期开发依据，替代 v1.0 中的首期范围。** MVP 采用 Next.js + GitHub 中的 MP4 + Vercel + 原生视频播放器。Cloudflare Stream、HLS、单集独立页及上传后台均移至后续阶段。保留已确认的黑金视觉、首页、视频片单和点击观看流程。

## 1. 目标、范围与现有资产

### 1.1 本次要验证什么

让访问者能够打开网站、找到感兴趣的 Web3 / 区块链机制、点击观看对应解读视频。作者能够通过修改仓库内容发布新片。先验证内容吸引力、查找效率和实际播放体验，再根据影片数量与访问量决定是否升级媒体服务。

首期按单作者、少量影片、免费公开观看设计。页面与视频在同一次 Vercel 部署中发布，网站不依赖原型的临时媒体地址。

### 1.2 功能边界

| P0：本次必须交付 | P1：出现实际需求后再开发 |
| --- | --- |
| 首页 `/`、视频片单 `/videos` | 单集独立页 `/videos/[slug]`、单集分享及 SEO |
| 搜索、分类、仅看已更新、筛选 URL | 分页、全文搜索服务、推荐系统 |
| 原生播放弹层、原生控件、重试与失败提示 | HLS、自适应清晰度、云端转码 |
| JSON 内容配置、素材校验、Git 发布流程 | 站内上传、CMS、数据库、多编辑审核 |
| 手机与桌面适配、键盘操作、基础页面 SEO | 登录、会员、收藏、跨设备进度 |
| Git 自动部署、预览验收、回滚说明 | 评论、测验、钱包连接、链上交互、实验室 |

首期不新增视频查询参数、不创建弹层历史记录，也不实现 parallel / intercepting routes。播放操作不修改地址栏。浏览器前进、后退保持正常的页面与筛选历史行为。

### 1.3 已确认基线

| 项目 | 当前情况与交付要求 |
| --- | --- |
| 代码仓库 | 公开仓库 `janily/block_travel`，默认分支 `main`；本次读取时仅有 `.gitignore`。保留已有历史与忽略规则，在仓库根目录初始化应用 |
| 视觉原型 | [首页](https://chainlab-web3-janily.blond-dune-9614.chatgpt.site/)；[片单](https://chainlab-web3-janily.blond-dune-9614.chatgpt.site/videos) |
| 原型源码 | Sites 项目 `appgprj_6ad4e00491948191a9c12c439cc92328`，批准的提交 `fee96d00446838b558de7cd877466e425e1bac8f` |
| 迁移依据 | 原型的 `DESIGN.md`、`UX-CONTRACT.md`、`dist/films.js`、`QA.md`；源码或预览受限时，由项目负责人交付对应版本的源码、素材与截图 |
| 首部真实视频 | 《起源》：193.033 秒，910 × 512，H.264 / AAC，画内中文字幕 |
| 已有网页视频文件 | `dist/assets/origin-explainer.mp4`：9,241,839 字节，即约 9.24 MB / 8.81 MiB |
| 已有封面 | `dist/assets/origin-poster.jpg`：910 × 512 |
| 计划选题 | 区块与哈希、共识机制、Gas 费用、智能合约、AMM 与兑换；均保持“待更新” |

上述文件参数来自当前原型素材的本地检查。首发使用约 9.24 MB 的网页版本，不将约 117.53 MB 的原始母版放入 Git。现有原型是 HTML / CSS / ES Modules；迁移视觉、文案、资产及纯逻辑，播放器的事件监听和清理按 React 生命周期重新实现。

## 2. 技术方案与工程结构

### 2.1 视频究竟从哪里播放

**GitHub 保存代码和视频版本；Vercel 构建网站并发布静态文件；浏览器请求正式站域名下的 MP4。**

例如，仓库中的 `public/media/videos/origin-v1.mp4` 上线后对应：

```text
https://<正式站域名>/media/videos/origin-v1.mp4
```

播放器不使用 GitHub 的 `blob` 预览链接或 `raw.githubusercontent.com` 链接。视频字节直接从 Vercel 静态资源地址获取，不经过应用的 API 路由或服务器函数。Next.js 的 `public` 文件可通过网站根路径访问。[S2]

### 2.2 技术栈

| 项目 | 约定 |
| --- | --- |
| 框架 | Next.js App Router，采用开工时受支持的稳定 Next 16.x 补丁，并锁定兼容的 React / React DOM |
| 语言 | TypeScript，`strict: true` |
| 运行时 | Node.js `24.x`，本地、CI、Vercel 保持一致；Vercel 当前支持该主版本 [S3] |
| 包管理 | pnpm；`packageManager` 写确切版本，提交 `pnpm-lock.yaml`，CI 冻结安装 |
| 样式 | CSS variables + CSS Modules，沿用原型设计；无需另接大型 UI 库 |
| 内容 | `content/videos.json` + `content/site.json`；Zod 校验，TypeScript 类型从 schema 推导 |
| 播放 | 原生 `<dialog>` + `<video controls playsInline preload="none">` |
| 部署 | Vercel Git Integration，连接上述 GitHub 仓库 |
| 检查 | ESLint、TypeScript、少量 Vitest 纯逻辑测试、Playwright 关键交互检查 |

依赖在初始化时锁定；CI 不使用 `@latest` 重新解析依赖。无需 Redux、GraphQL、独立内容 API 或实验性框架功能。原生视频标签及延后媒体加载的做法与 Next.js 官方视频指引一致。[S4]

### 2.3 渲染与组件边界

- 首页使用仓库内容生成，优先构建时渲染。
- 片单页首次请求读取 `await searchParams`，服务端输出与 URL 一致的筛选结果；水合后在客户端筛选小型公开片单。
- 只有搜索控件、筛选状态、播放入口与播放器需要客户端交互。
- 内容加载、schema 校验和公开数据筛选位于服务端模块，避免把归档记录作为客户端数据发送。
- `/videos` 使用请求参数，因此本方案不是全站纯静态导出，不设置 `output: "export"`。Next.js 将读取页面 `searchParams` 视为请求时渲染能力。[S5]
- 媒体仍是静态文件；页面是否服务端渲染不会改变视频的交付方式。

### 2.4 建议目录

以下是职责约定，研发可以合并相邻的小文件，避免为少量数据建立通用框架。

```text
src/app/layout.tsx                 全站布局、元数据、共享播放器上下文
src/app/page.tsx                   首页
src/app/videos/page.tsx            片单首屏与查询参数解析
src/app/not-found.tsx              404
src/app/error.tsx                  页面错误恢复
src/app/globals.css                reset、tokens、全局基础样式
src/components/site-header.tsx     导航
src/components/video-card.tsx      已更新卡片
src/components/video-catalog.tsx   搜索、筛选、结果与空态
src/components/player-provider.tsx 观看会话、焦点与导航清理
src/components/video-dialog.tsx    原生 dialog 与 video
src/lib/content-schema.ts          Zod schema 与推导类型
src/lib/content.server.ts          读取配置、输出公开内容
src/lib/catalog-query.ts           URL 解析、序列化与过滤纯函数
content/site.json
content/videos.json
public/media/videos/origin-v1.mp4
public/posters/origin-v1.jpg
scripts/check-content.ts           纯 Node 内容与文件检查
tests/catalog-query.test.ts
tests/content.test.ts
tests/e2e/site.spec.ts
docs/content-publishing.md         作者发布操作说明
.env.example
.github/workflows/ci.yml
```

项目根目录初始化，不再套一层同名应用。保留已有 `.gitignore`；补充 `.next/`、`.vercel/`、测试产物与本地环境文件忽略规则，确保 `.env.example` 可提交。影片和封面是本方案需要追踪的发布资产，不能被全局 `*.mp4` 忽略。

## 3. 页面与视觉规格

### 3.1 页面及导航

| 入口 | 必须呈现的内容与行为 |
| --- | --- |
| `/` | 品牌与导航；主推《起源》的真实封面、标题、简介、03:13、中文字幕说明及播放入口；片单入口；最多 3 条待更新选题；关于本站与页脚 |
| `/videos` | 片单标题、搜索框、分类、仅看已更新、结果数量、已更新影片、待更新选题、无结果提示 |
| 播放弹层 | 影片标题、原生视频控件、明确关闭按钮、加载/失败反馈和 MP4 降级链接 |
| `/videos.html` | 兼容原型旧地址，308 重定向至 `/videos` 并保留查询参数 |
| 其他地址 | 诚实的 404，提供回到首页与片单的链接 |

首页“关于”可用 `/#about`，不新增第三个内容页。所有卡片、统计与状态来自配置，不写死“6 部可观看”。计划选题不显示虚构封面、时长、播放次数或可点击播放状态。

主推规则：`featuredVideoId` 非空时使用指定已发布影片；为空时取按 `order` 排序的第一部已发布影片；没有已发布影片时显示“首支影片准备中”和片单入口。零影片是合法内容状态，页面不能崩溃。

### 3.2 视觉 token

| Token | 值 |
| --- | --- |
| 页面背景 | `#090B0E` |
| 主表面 / 次表面 | `#111418` / `#171B20` |
| 主文字 / 次文字 | `#F5F0E6` / `#A5A7AD` |
| 金色强调 / hover | `#D8BA70` / `#E8CF94` |
| 分隔线 | `#2C2D31` |
| 错误提示 | `#E77A6B`，同时提供文字说明 |
| 内容最大宽度 | `76rem` |
| 控件 / 媒体圆角 | `6px` / `10px` |
| 导航高度 | 桌面约 `82px`，手机约 `70px` |

标题沿用中文衬线气质，优先使用本地 Songti SC / STSong / Noto Serif CJK / Source Han Serif / serif；正文使用 PingFang SC / Microsoft YaHei / Noto Sans CJK / system-ui。首期不为了字体引入外部 CDN 或庞大的中文字体文件。

以当前批准原型为布局基线，保留留白、细分隔线和金色播放入口。不要增加加密货币行情、钱包连接、装饰仪表盘、营销统计或新的视觉主题。

### 3.3 响应式与无障碍

- 只有 1 部已更新影片时，桌面使用横向精选卡；手机上下排列。影片增多后采用桌面 3 列、平板 2 列、手机 1 列。
- `720px` 及以下分类按钮采用 2 × 2 排列；待更新选题为清晰的文字列表。
- 主要可点击区域至少 44 × 44 CSS px；状态文字不小于 12px，正文建议 14–16px，手机输入框 16px。
- 在 320px、375px 和桌面宽度无横向溢出；弹层考虑 `100dvh` 与安全区，关闭按钮始终可达。
- 封面设置明确宽高与备用背景，视频使用 `object-fit: contain`，不裁剪画内字幕。
- 使用语义化标题、表单 label、当前导航状态、可见键盘焦点和足够对比度；状态不能只靠颜色表达。
- 尊重 `prefers-reduced-motion`。装饰动画不得阻塞页面或播放入口。

## 4. 内容模型与首批数据

### 4.1 配置约定

`content/site.json`：

```json
{
  "name": "链上放映室",
  "description": "用视频看懂 Web3 与区块链机制。",
  "featuredVideoId": "origin"
}
```

字段约定：

| 字段 | 规则 |
| --- | --- |
| `id` | 稳定、唯一的小写字母/数字/短横线标识；发布后不随标题修改 |
| `status` | `planned`、`published`、`archived` |
| `title`、`summary` | 必填的非空文本；纯文本渲染 |
| `description` | 可选的较长简介 |
| `category` | `basics`、`mechanisms`、`applications` |
| `order` | 非负整数，升序；相同值按 `id` 稳定排序 |
| `series`、`episode` | 可选；episode 是正整数，展示时可补零 |
| `durationSeconds` | published 必填，有限正数；展示时格式化为分:秒 |
| `src` | published 必填，本站 `/media/videos/*.mp4` 路径 |
| `poster` | published 必填，含本站 `/posters/` 路径、真实宽高和替代文本 |
| `burnedInCaptions` | published 必填布尔值；为 true 时可显示“中文字幕” |
| `featuredVideoId` | 指向一部 published 影片或为 null；不得指向计划或归档记录 |

分类显示名称固定为：`basics → 区块链基础`、`mechanisms → 链上机制`、`applications → 应用场景`。本期按 `order` 编排，不依赖发布日期；未提供的日期不能编造。需要展示发布日期时再增加经过确认的字段。

### 4.2 可直接使用的首批片单

`content/videos.json`：

```json
[
  {
    "id": "origin",
    "status": "published",
    "title": "起源",
    "summary": "比特币诞生之前，数字现金走过怎样的路？",
    "description": "从 Chaum 与 DigiCash 开始，经过 Hashcash、b-money 和 Bit Gold，回看比特币诞生前的关键探索。",
    "category": "basics",
    "series": "白皮书讲解",
    "episode": 1,
    "order": 10,
    "durationSeconds": 193,
    "src": "/media/videos/origin-v1.mp4",
    "poster": {
      "src": "/posters/origin-v1.jpg",
      "width": 910,
      "height": 512,
      "alt": "《起源》视频封面"
    },
    "burnedInCaptions": true
  },
  {
    "id": "blockchain",
    "status": "planned",
    "title": "区块与哈希",
    "summary": "数据如何一块接一块，连接成一条链？",
    "category": "basics",
    "series": "机制解读",
    "order": 20
  },
  {
    "id": "consensus",
    "status": "planned",
    "title": "共识机制",
    "summary": "没有统一的记账人，怎样对账本达成一致？",
    "category": "basics",
    "series": "机制解读",
    "order": 30
  },
  {
    "id": "gas",
    "status": "planned",
    "title": "Gas 费用",
    "summary": "链上的一次操作，为什么需要支付费用？",
    "category": "mechanisms",
    "series": "机制解读",
    "order": 40
  },
  {
    "id": "contracts",
    "status": "planned",
    "title": "智能合约",
    "summary": "一段代码，如何按约定自动执行？",
    "category": "mechanisms",
    "series": "机制解读",
    "order": 50
  },
  {
    "id": "defi",
    "status": "planned",
    "title": "AMM 与兑换",
    "summary": "没有传统订单簿，代币之间如何完成兑换？",
    "category": "applications",
    "series": "机制解读",
    "order": 60
  }
]
```

首发素材迁移：

| 原型中的文件 | 正式仓库目标 |
| --- | --- |
| `dist/assets/origin-explainer.mp4` | `public/media/videos/origin-v1.mp4` |
| `dist/assets/origin-poster.jpg` | `public/posters/origin-v1.jpg` |

### 4.3 发布状态

| 状态 | 网站表现 | 校验要求 |
| --- | --- | --- |
| planned | 待更新文字条目，可参与搜索；不提供播放入口 | 不填写 src、durationSeconds、poster 等播放字段 |
| published | 可展示、可播放 | 完整媒体字段；对应本地文件存在并通过构建检查 |
| archived | 首页、片单及公开客户端数据中排除 | 可保留原有媒体元数据；不要求已删除的本地媒体继续存在 |

`videos.json = []`、零部 published、`featuredVideoId: null` 均应允许构建。首发“至少一部真实影片”是人工上线验收条件，不是永久的 schema 约束。归档最后一部影片时，把 featured 改为 null，网站正常显示空态。

`public` 文件和公开仓库内容没有权限保护。归档表示从网站内容入口移除；已经存在的静态链接、旧部署或 Git 历史可能仍可访问。未公开母版和敏感材料保存在仓库外，不能通过 planned 或 archived 状态隐藏。

### 4.4 构建时检查

`pnpm content:check` 是轻量纯 Node 脚本，失败时返回非零退出码并输出具体记录与字段：

1. JSON 可解析，schema 合法，id 唯一，分类与状态有效，featured 指向正确。
2. published 的视频、封面存在且非空；路径限定于相应 public 子目录，拒绝路径穿越、外链、查询串、反斜杠及越界符号链接。
3. 视频后缀为 .mp4；封面使用支持的 .jpg / .jpeg / .png / .webp，并具备正数宽高。构建校验不宣称已验证图片或视频的完整解码能力。
4. 检测 Git LFS 指针文本，防止把指针文件当作 MP4 发布。
5. 单个 MP4 大于 50 MiB 发出提醒；达到 100 MiB 即按本项目规则拒绝；统计整个视频目录体积，超过 200 MiB 提醒评估迁移。
6. 列出未被 published 内容引用的 MP4，提醒确认它仍会作为 public 资源发布。

构建不依赖系统预装 ffmpeg / ffprobe，不联网检查媒体平台。编码、真实时长、faststart 与可播放性由作者本地预检和实际浏览器验收确认。schema 是唯一类型来源；不要另写一套不同约束的手工类型。

## 5. 视频文件与作者发布流程

### 5.1 文件边界

| 边界 | 含义 |
| --- | --- |
| GitHub 网页上传 25 MiB | 大于该值的文件采用本地 Git 提交，而非网页上传 [S1] |
| Git 大于 50 MiB | GitHub 提示大文件警告；并非此时就禁止 push [S1] |
| Git 大于 100 MiB | GitHub 阻止普通 Git 文件上传 [S1] |
| 本项目单文件达到 100 MiB | 主动拒绝，为平台边界留出明确的操作规则 |
| 本项目媒体总量超过 200 MiB / 影片超过 5 部 | 触发方案复核，属于项目预算，不是 GitHub 硬性上限 |
| Vercel CLI 源码上传限制 | 是 CLI 上传总量限制，不能当成 Git 集成的单个视频限制；本项目使用 Git 集成 [S6] |

1 MiB = 1,048,576 字节，1 MB = 1,000,000 字节。作者目标仍是每部几十 MB 以内。原生 MP4 没有自适应码率，文件尺寸与编码码率需要适合目标用户网络。

Git 会保留历史二进制版本，反复覆盖影片会持续增加仓库体积。[S1] 本期不接 Git LFS；达到规模边界后迁移媒体，不通过拆分 MP4 或修改平台限制继续扩张。

### 5.2 媒体导出与预检

- 优先 MP4 容器、H.264 视频、AAC 音频、`yuv420p` 像素格式；保留适合字幕阅读的分辨率。
- 启用 faststart，将 MP4 元数据放在文件前部，以改善渐进式播放。FFmpeg 的 `+faststart` 会重排文件，不会凭空压小视频。[S7]
- 当前《起源》已有网页成品，可以直接迁移后验收，不为追求统一参数而重复有损压缩。
- 封面使用真实视频画面或已确认设计。画内中文字幕无需字幕文件，也不显示不存在的字幕开关。
- 新内容文件用版本号，例如 `consensus-v1.mp4`；更新为 `consensus-v2.mp4`，同步配置。已发布版本不使用相同文件名悄悄替换不同内容。

作者本地可使用：

```bash
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,pix_fmt -show_entries format=duration,size -of json input.mp4
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

第二条适用于已经是兼容编码的文件，只整理容器。需要转码时的起点：

```bash
ffmpeg -i input.mov -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output.mp4
```

转码参数不是固定质量保证；检查文字清晰度、画面、声音与文件大小后调整。配置中的 durationSeconds 与实际时长误差控制在 1 秒以内。上面的 ffprobe 用于查看流信息，不单独证明 faststart；导出步骤和真实渐进播放验收仍要执行。

### 5.3 发布一部新视频

1. 作者在本地导出可播放 MP4 与封面，检查字幕、音量、时长和体积。
2. 在工作分支添加到 `public/media/videos/` 与 `public/posters/`。
3. 更新 `content/videos.json`，将对应 planned 改为 published，补齐媒体字段；需要主推时更新 `content/site.json`。
4. 本地执行 `pnpm build`；提交源文件、配置和必要代码，发起 PR。
5. CI 通过后，在该 PR 对应的最新 Vercel Preview 实际播放、拖动进度和手机检查。
6. 合并到 main，Vercel 自动部署；在正式域名完成一次播放冒烟检查。

发布说明要写出“修改哪些文件、运行什么命令、在哪里确认成功”，不要求作者使用视频平台控制台。

下架时将记录改为 archived，并调整 featured；这只移除内容入口。如需要停止新部署的直接文件访问，还需从 public 删除对应文件；不得承诺同时抹除公开 Git 历史、缓存和旧部署。紧急内容撤回需要单独检查这些实际位置。

## 6. 片单搜索与 URL 行为

示例地址：

```text
/videos?q=共识&category=basics&available=1
```

### 6.1 参数与筛选规则

| 参数 | 规则 |
| --- | --- |
| q | 先做 NFKC 规范化与去首尾空格，再按 Unicode 码点截取至 120 个字符；匹配忽略大小写；空字符串等同未设置 |
| category | all / basics / mechanisms / applications；非法值按 all 处理；默认 all 可从 URL 省略 |
| available | 仅字面值 `1` 表示“仅看已更新”；其他值按关闭处理 |
| 重复参数 | 对同名参数读取第一个值，服务端与客户端保持一致 |

搜索匹配 title、summary、series、category 的中文名称及 id；与分类、available 取交集，按 order / id 排序。对少量片单本地计算即可，不请求搜索接口。计划选题可被搜索，但永远没有播放动作。

“已更新”和“待更新”分别展示准确数量。available 开启后隐藏计划条目。若没有已更新结果但存在匹配的计划选题，提示具体数量并提供“查看待更新选题”；点击只关闭 available，保留 q 和 category。

### 6.2 输入与历史

- 初次访问带参数 URL，服务端首屏即对应结果，不能先显示全量再闪成筛选结果。
- 中文输入法组合输入期间保留输入内容，compositionend 后再提交过滤和 URL。
- 普通输入即时更新本地结果；URL 使用短防抖的 `history.replaceState`，分类与开关立即更新。统一 serializer，保留其他业务参数与 hash；按 Next.js 支持的调用方式更新，由框架保留内部 history.state，不手工覆盖其内部字段。
- Next.js 支持原生 History API 与路由状态同步；使用框架支持的方式，避免同时维护互相竞争的 URL 状态。[S8]
- 浏览器前进、后退重新从当前 URL 解析过滤状态，并取消尚未执行的旧防抖任务，避免旧输入覆盖新历史。
- 输入框的清除按钮只清 q；“重置筛选”移除 q/category/available，保留无关参数，焦点回到搜索框。
- “查看待更新选题”后把焦点放到结果标题；结果数量通过适度的 `aria-live="polite"` 反馈。
- replaceState 不为每次输入创建历史项，因此不能承诺后退逐字撤销搜索。正常页面导航仍保留浏览器历史。

无 JavaScript 时，已渲染的内容和真实 MP4 链接可用；搜索表单采用 GET 提交到 /videos，筛选控件保持原生表单语义。JavaScript 增强即时筛选，不应让核心观看入口依赖水合成功。

## 7. 原生播放器交互合同

### 7.1 入口与加载

每个可播入口以真实 MP4 的 `<a href>` 为基础。JavaScript 只拦截普通主键点击，打开原生 `dialog.showModal()`；Ctrl / Cmd / Shift / Alt / 中键保留浏览器默认行为。若 dialog 能力不可用，则直接打开 MP4。

用户点击前不挂载带 src 的 video、不预加载 MP4、不为多张卡片创建隐藏播放器。页面只加载封面。点击后创建唯一视频实例，使用 `controls`、`playsInline`、`preload="none"`；不自制进度条、音量或清晰度菜单。[S4]

点击后可以调用 `play()`；若浏览器拒绝自动开始，保留原生播放按钮并提示“点击播放”，不要误判成文件损坏。不得在页面初次打开时自动出声。

### 7.2 状态与恢复

| 状态 | UI / 行为 |
| --- | --- |
| closed | 没有活动媒体来源，不请求 MP4 |
| loading | 显示封面与加载说明，允许关闭；记录本次播放请求标识 |
| ready / paused | 原生控件可用，等待用户操作 |
| playing | 根据真实媒体事件确认，移除加载提示 |
| buffering | 等待恢复，不擅自重建整个播放器 |
| ended | 播放结束；下次打开从头开始 |
| error | 明确失败提示、重试按钮、同一真实 MP4 的直接打开链接 |

以真实 `playing` 事件确认开始播放。连续加载或缓冲超过约 20 秒仍未恢复时，显示“加载较慢，可以继续等待或重试”；它是可恢复状态，不直接断言视频不可用。真实媒体 error 才进入错误态。暂停和关闭取消相关计时器。

使用每次打开 / 重试的请求标识忽略过期事件与 Promise 回调，快速打开、关闭、换片不能让旧回调修改新影片状态。重试必须复用当前影片真实 src，不跳到示例视频。

可在当前页面会话内记录 `src → currentTime`，关闭再打开时在 loadedmetadata 后恢复合法进度；播放结束清零。刷新后重置，不引入 localStorage、账号或跨设备进度。以版本化 src 为键，换版不继承旧进度。

### 7.3 关闭、导航与焦点

- dialog 有明确标题关联和可访问的关闭按钮；打开后焦点进入弹层，背景不可交互，键盘焦点不泄露到背景。
- 关闭按钮、Escape、遮罩点击均关闭。遮罩关闭判断起点与终点都在遮罩，避免拖动操作误关闭。
- 原生全屏时尊重浏览器先退出全屏的 Escape 行为；不要全局截获所有 Escape。
- 关闭时立即 pause，取消计时器与监听，清除 src 并释放媒体加载，重置会话标识；画中画关闭场景也不能留下继续发声的媒体。
- 恢复背景滚动和原滚动位置，将焦点还给触发入口；入口已不存在时转到当前页面合适的标题或主要内容。
- **共享播放器即使位于根 layout，也必须在路径导航、查询历史导航或 pagehide 时显式关闭并释放。** 根布局可能不卸载，不能只依赖 unmount。正常 unmount 仍必须幂等清理。
- 播放弹层不修改 URL。浏览器 Back / Forward 执行正常历史导航；导航发生后无后台声音，不承诺 Back 只关闭弹层。

## 8. 工程脚本、测试与构建

### 8.1 scripts 约定

以下脚本可直接作为 package.json 的 scripts 部分：

```json
{
  "dev": "next dev",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "next typegen && tsc --noEmit",
  "content:check": "tsx scripts/check-content.ts",
  "test": "vitest run",
  "check": "pnpm lint && pnpm typecheck && pnpm content:check && pnpm test",
  "build": "pnpm check && next build",
  "test:e2e": "playwright test"
}
```

安装相应开发依赖，使用当前 Next ESLint 配置，不使用已不适合当前版本的旧脚手架命令。Next 官方提供 `next typegen` 在完整构建前生成路由类型；它会以 production phase 加载 next.config，因此配置模块不能因尚未填写正式域名而在 typecheck 阶段报错。[S9]

确保没有 build → check → build 的循环；Playwright 的 webServer 启动 `pnpm start`，不得再次执行完整 build。CI 先构建一次，再启动该产物测试。

隔离两个测试运行器：Vitest 的 include 明确设为 `tests/**/*.test.ts`；Playwright 的 testDir 设为 `tests/e2e`，只收集该目录的 `.spec.ts`。不要让默认 Vitest 文件匹配规则把 Playwright 用例一并执行。

### 8.2 必要检查，控制数量

| 层次 | 测什么 | 不宣称什么 |
| --- | --- | --- |
| Vitest | 查询参数解析/序列化、中文规范化、过滤与排序、状态与 featured 约束 | 不为每个静态组件写快照测试 |
| 内容脚本 | JSON、路径、文件存在、大小、LFS 指针 | 不等同完整解码或真实网络播放 |
| Playwright | 搜索/重置/历史、点击与关闭、焦点、导航清理、未点击不请求视频 | 不替代真实 iOS / Android 媒体兼容检查 |
| 真实设备与域名 | 有声播放、拖动到未缓冲位置、移动网络、关闭后静音 | 不根据 localhost 成功推断所有地区都稳定 |

纯逻辑测试至少覆盖：非法与重复查询参数；q/category/available 组合；planned 和 archived 的区分；零影片与 featured=null；缺失 published 文件导致检查失败。使用隔离 fixture 验证错误输入，不能为了测试破坏正式素材。

自动化选择 Chromium 主流程；桌面 Firefox、iOS Safari、Android Chrome 做实际验收。媒体的浏览器策略与设备差异由真实播放结果判断。

## 9. Vercel 部署与发布设置

### 9.1 项目设置

| 设置 | 取值 |
| --- | --- |
| Git Repository | `janily/block_travel` |
| Framework Preset | Next.js |
| Root Directory | 仓库根目录 |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm build` |
| Output Directory | 使用 Next.js 预设，不手填 dist |
| Node.js | 24.x |
| Production Branch | main |
| 正式访问地址 | 项目稳定的 vercel.app 地址即可验证；自定义域名可后补 |

通过 Git 集成生成 PR Preview 和正式部署。[S10] 本项目默认不使用本地 CLI 上传完整视频目录，避免把 CLI 的上传总量约束混入 Git 发布流程。

为使 Vercel 使用 `packageManager` 中锁定的 pnpm，在 Preview 和 Production 的构建环境设置 `ENABLE_EXPERIMENTAL_COREPACK=1`，并确认安装日志中的 pnpm 版本一致。官方文档指出，单独覆盖 `pnpm install` 而没有版本选择机制可能使用构建容器中的旧版本；不要仅凭命令名称推断版本。[S11][S14]

应用代码不需要视频平台账号、媒体管理密钥或数据库连接串。应用的可选非敏感配置：

```dotenv
# 已确定稳定正式地址时填写；不带路径或尾部斜杠
SITE_URL=https://your-project.vercel.app
```

SITE_URL 用于 canonical、Open Graph 与 sitemap 的绝对 URL，未设置时不生成错误的 localhost 或预览域名 canonical，不应阻止本地开发和类型生成。首次正式上线验收前填写真实地址。

生产页面设置中文 lang、标题、简介、OG 信息；sitemap 只含首页和片单；筛选 URL 的 canonical 指向不带筛选参数的 /videos。Preview 使用 noindex 并不加入生产 sitemap；noindex 不等于访问权限。若 Preview 开启部署保护，确保验收人员有权限，不能把登录页当作媒体播放故障。

### 9.2 CI、预览与生产的先后关系

GitHub Actions 在 PR 和 main push 执行：

1. 检出代码，配置 Node 24 和锁定版本的 pnpm。
2. 冻结安装依赖。
3. `pnpm build`：运行代码、内容与纯逻辑检查，再生成应用。
4. 安装需要的 Playwright 浏览器，运行 `pnpm test:e2e`，上传失败日志与截图。

main 开启 PR 合并与必需 CI 检查，合并前针对最新提交检查 Preview；基础检查同时位于 Vercel 的 build 命令内，因此失败会阻止该次 Vercel 部署。[S11]

**GitHub 的 e2e 与 Vercel 自动部署可能并行。** 本方案依靠 PR 必需检查和 Preview 人工验收控制合并，不声称 main 的部署会等待所有并行 e2e。不要另建云端媒体状态检查、部署轮询或支付服务来实现首期发布。

推荐顺序是：先完成《起源》在 Preview 的真实播放，再补齐页面细节，最后合并首发。这样媒体交付问题能在开发早期暴露。

### 9.3 静态媒体、缓存与网络验收

Vercel 会缓存部署的静态文件；实际传输与请求仍受所用套餐的配额和规则约束。[S12] 首期沿用平台与 Next 的默认缓存行为，使用版本化文件名，不额外承诺所有 Range 请求都有相同缓存命中率。

首次 Preview 和正式域名均应执行真实 GET Range 检查，例如：

```bash
curl -sS -L -D range-headers.txt -H 'Range: bytes=0-1023' -o range-body.bin 'https://<实际部署域名>/media/videos/origin-v1.mp4'
```

检查最终响应为 `206 Partial Content`，Content-Range 与文件长度匹配，响应体为 1024 字节；确认媒体类型适合 MP4。如果返回保护页面、404、200 全文件或异常重定向，先定位真实响应再验收，不能只用 HEAD 的 Accept-Ranges 字段判定拖动正常。

同时在目标用户实际所在网络播放、拖动到未缓冲片段，记录明显卡顿。国内访问体验以实际网络测试为准；如核心用户持续无法顺畅观看，应优先调整媒体分发方案。

### 9.4 回滚与公开边界

- 生产播放或页面发生回归，回滚到 Vercel 控制台允许选择的已知正常部署，并记录部署地址与对应 Git 提交；当前 Hobby 的即时回滚范围是前一个部署，不能假设可任意选择所有历史版本。[S13]
- 仓库同时通过修复 PR 或 revert 恢复正确源版本，避免下一次 main 部署重新带入问题；不通过强制推送重写共享历史。
- Vercel Instant Rollback 会关闭生产域名的自动分配；验证修复后，通过 Undo Rollback / Promote 恢复正常发布，随后再次验证播放。[S13]
- 正式链接使用稳定项目域名或自定义域名；PR Preview 地址供验收，不作为长期对外地址。
- 视频不经收费媒体平台不等于没有传输成本。上线时确认所用 Vercel 套餐适合实际用途，并关注传输用量；不在文档中承诺永久零费用。

## 10. 上线验收清单

以下全部完成后，才把正式地址交付用户。验收记录写明提交 SHA、部署 URL、日期、设备与结果。

| 编号 | 场景 | 通过标准 |
| --- | --- | --- |
| A01 | 首页与片单 | 两个地址均可直接访问、刷新；旧 /videos.html 正确跳转且保留参数 |
| A02 | 内容真实性 | 首发恰好使用真实《起源》与 5 条待更新选题；标题、封面、03:13、分类正确；无假播放入口 |
| A03 | 首次媒体播放 | 在实际部署域名播放至少 15 秒，画面、声音、字幕正常；可拖动到未缓冲位置；Range 检查通过 |
| A04 | 延迟加载 | 未点击前网络面板中无 MP4 请求；打开后只有当前影片媒体实例 |
| A05 | 关闭与快速操作 | 关闭、Escape、遮罩、加载中关闭、快速重复开关均停止声音；无旧事件恢复播放 |
| A06 | 页面与历史导航 | 切换页面或历史后无后台播放；Back / Forward 正常恢复页面和筛选，不产生虚构播放历史 |
| A07 | 搜索与筛选 | 中文输入法、分类、仅已更新、清除 q、重置、无结果恢复正常；直接访问带参数 URL 首屏一致 |
| A08 | 真实移动设备 | iOS Safari、Android Chrome 实播、暂停、横竖屏与关闭正常；桌面 Chrome / Firefox 验证 |
| A09 | 布局与键盘 | 320px / 375px 无横向溢出；Tab 焦点可见；弹层焦点正确；关闭恢复入口与滚动位置 |
| A10 | 故障与降级 | 本地模拟断网/404 有可理解提示和重试；无 JS 时 MP4 链接可打开、GET 搜索可用 |
| A11 | 内容边界 | 隔离测试中零影片可构建；非法 featured、缺失视频、超项目大小、LFS 指针被检查阻止 |
| A12 | 构建与交付 | pnpm build、e2e 通过；Preview 无意外索引；生产 canonical 正确；发布与回滚说明完整 |

A02 是首次上线数据约定，不是“永远只能有一部影片”的功能限制。后续增加内容不需要改页面代码。A11 中媒体大小边界可以用隔离文件元数据 fixture 验证，不需提交超大测试文件。

首期可邀请 5–10 位目标用户做一次小规模观察：能否找到想看的主题、顺利开始播放、看完后是否理解机制、希望下期讲什么。记录反馈与播放问题即可；该人数是项目验证建议，不作为统计代表性承诺。无需为收集这轮反馈增加埋点后台。

## 11. 研发拆解与最终交付

### 11.1 开发顺序

| 任务 | 产出 | 完成标准 |
| --- | --- | --- |
| T1 初始化与真实部署 | Next/TS/样式基础、锁文件、build 脚本、Vercel Git 连接；迁移《起源》 | 第一条 Preview 链路能访问真实 MP4，初步 Range / 手机播放检查通过 |
| T2 内容与两个页面 | schema、首批 JSON、首页、片单、响应式样式 | 还原批准设计；无需改组件即可增减影片；空态正确 |
| T3 搜索与播放器 | URL 解析、组合筛选、共享 dialog、媒体生命周期 | A04–A07 及焦点/降级流程通过 |
| T4 质量与发布流程 | 轻量测试、GitHub Actions、README、作者发布说明 | 新影片按文档可发布；错误内容能阻止构建 |
| T5 正式验收 | 最新 Preview 审核、生产地址、真实设备检查、修复 | A01–A12 完成，记录部署与回滚入口 |

在设计已经确认、素材与账号及时提供、1 名熟悉 React / Next.js 的研发承担的前提下，建议预留 **4–7 个工程日**，包含联调与一轮修正。网络可达性问题、重新剪辑、额外设计修改和新增功能会改变估算。

项目负责人提供：批准版本源码/截图与素材、GitHub/Vercel 所需项目访问权限、正式地址选择和验收反馈。研发不得在权限不具备时编造已经部署成功的 URL。

### 11.2 研发最终提交

1. `janily/block_travel` 中可复现安装与构建的完整源码、锁文件、内容与网页视频。
2. README：本地启动、检查、构建、配置和部署方式。
3. `docs/content-publishing.md`：新增、修改、换版、归档视频的实际步骤。
4. 本文实现差异记录；如改变 P0 范围，先向项目负责人说明影响。
5. 稳定正式地址、对应提交 SHA、Preview 地址及 A01–A12 验收结果。
6. 已知问题、明确的回滚位置及后续优化建议。

本次文档交付没有修改目标仓库、上传正式视频或创建 Vercel 项目；上述均为研发实施任务。

### 11.3 可直接交给研发 / Codex 的启动指令

```text
请在 janily/block_travel 仓库实现《链上放映室》MVP，以本文件 v1.1 为实施依据。
保留现有 Git 历史和 .gitignore，在仓库根目录初始化 Next.js App Router + TypeScript。
采用 Node 24、锁定版本的 pnpm、CSS Modules 和原型黑金设计。

P0 只有首页 /、片单 /videos、共用的原生 dialog 视频播放器。
视频 MP4 和封面放 public，内容放 content/videos.json 与 content/site.json。
首发迁移真实《起源》网页视频与封面，保留另外 5 项为 planned。
缺少真实素材时先使用诚实空态并报告缺口，不生成替代影片或假时长。

按文档实现 URL 搜索/分类/仅已更新、无 JS 降级和播放器清理。
不增加单集独立页、HLS、Stream、数据库、登录、钱包、上传后台或统计服务。
播放弹层不修改 URL；导航、关闭与异常时正确释放媒体。

先在 Preview 打通真实 MP4 播放和 Range，再完成页面与交互。
pnpm build 必须包含内容、类型和必要测试检查；Playwright 复用已有构建。
配置 GitHub PR 检查与 Vercel Git 部署，按 A01–A12 验收。
最终交付源码、README、内容发布说明、正式地址与真实验收记录。
```

## 12. 何时升级，以及保留哪些接口

达到以下任一情况时复核媒体方案：影片超过 5 部、当前视频目录超过约 200 MiB、频繁替换导致仓库明显增大、目标用户网络体验不佳，或传输配额开始影响使用。这些是本项目观察信号，不是硬性“到数必须迁移”。

例如，50 MB 的影片被完整下载 1,000 次，粗略媒体传输量约 50 GB，未计其他请求与重复传输。这是容量估算，不是套餐费用报价；应以部署平台实际用量为准。

保持 `id` 稳定、`src` 集中在内容模型、播放器通过传入媒体信息工作。后续迁移到对象存储/CDN 时，修改资源 URL、允许的域名/schema、内容检查和网络验收；页面布局与片单逻辑通常可以保留。升级为 HLS / Stream 则还需要播放器适配、自适应播放与新发布流程，不能只换一个 URL 就宣称完成。

独立单集页、OG/VideoObject、可分享观看地址在 P1 一起设计；首期不预先实现复杂路由。需要作者频繁在浏览器上传或多人维护时，再考虑 CMS 与管理后台。

## 官方资料与核对范围

以下官方文档于 2026-10-22 核对。平台限制与版本可能调整，研发开工或上线时复核相关项；本文件中的页面行为、体积预算、任务与时间估算属于项目决策。

- [S1 · GitHub 大文件限制与仓库体积建议](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [S2 · Next.js public 文件夹](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder)
- [S3 · Vercel 支持的 Node.js 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [S4 · Next.js 视频指南](https://nextjs.org/docs/app/guides/videos)
- [S5 · Next.js page 与 searchParams](https://nextjs.org/docs/app/api-reference/file-conventions/page)
- [S6 · Vercel 平台限制](https://vercel.com/docs/limits)
- [S7 · FFmpeg MP4 / MOV 格式与 faststart](https://ffmpeg.org/ffmpeg-formats.html)
- [S8 · Next.js 导航与原生 History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating)
- [S9 · Next.js CLI 与 typegen](https://nextjs.org/docs/app/api-reference/cli/next)
- [S10 · Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github)
- [S11 · Vercel 构建设置](https://vercel.com/docs/builds/configure-a-build)
- [S12 · Vercel CDN Cache](https://vercel.com/docs/caching/cdn-cache)
- [S13 · Vercel Instant Rollback](https://vercel.com/docs/instant-rollback)
- [S14 · Vercel 包管理器与版本选择](https://vercel.com/docs/package-managers)

[S1]: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
[S2]: https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
[S3]: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
[S4]: https://nextjs.org/docs/app/guides/videos
[S5]: https://nextjs.org/docs/app/api-reference/file-conventions/page
[S6]: https://vercel.com/docs/limits
[S7]: https://ffmpeg.org/ffmpeg-formats.html
[S8]: https://nextjs.org/docs/app/getting-started/linking-and-navigating
[S9]: https://nextjs.org/docs/app/api-reference/cli/next
[S10]: https://vercel.com/docs/git/vercel-for-github
[S11]: https://vercel.com/docs/builds/configure-a-build
[S12]: https://vercel.com/docs/caching/cdn-cache
[S13]: https://vercel.com/docs/instant-rollback
[S14]: https://vercel.com/docs/package-managers

