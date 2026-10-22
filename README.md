# 链上放映室 · Block Travel

用视频看懂 Web3 与区块链机制。依据 [MVP 研发文档 v1.1](docs/block-travel-mvp-development-v1.1.md) 实现，保留批准原型的黑金视觉和真实《起源》素材。

## 本地运行

需要 Node.js 24.x 和 pnpm 11.25.0（packageManager 已锁定）。

```bash
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

打开 http://localhost:3000。无需数据库、登录或媒体平台密钥。

```bash
pnpm check                 # lint、类型、内容、纯逻辑测试
pnpm build                 # 上述检查 + Next.js 生产构建
pnpm start                 # 启动已有生产构建
pnpm exec playwright install chromium
pnpm test:e2e              # 使用已有构建；不会再次执行 build
```

本地已有兼容 Chromium 时，可设置 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH 指向浏览器可执行文件。CI 默认安装 Playwright 锁定的 Chromium。无浏览器的内容检查不验证完整媒体解码。

## 页面与内容

- 首页 `/` 展示主推影片、最多三条待更新选题和关于信息。
- `/videos` 提供关键词、分类和仅已更新筛选。查询参数为 `q`、`category`、`available=1`。
- `/videos.html` 308 重定向，保留查询参数；没有单集页。
- 原生播放弹层不改变 URL。关闭、历史导航和页面离开均释放媒体。
- 不启用 JavaScript 时，GET 搜索表单和真实 MP4 链接仍然可用。

内容由 `content/site.json` 与 `content/videos.json` 管理；公开影片和封面放在 `public/media/videos/`、`public/posters/`。公开客户端数据不包含 archived 记录。新增影片无需修改组件。详见 [作者发布说明](docs/content-publishing.md)。

视频从部署站点自身的静态地址获取，不请求 GitHub raw、应用 API 或媒体服务。不要提交母版、机密材料或 Git LFS 指针。

## 配置与部署

复制 .env.example 作为参考。SITE_URL 是可选的稳定生产 HTTPS 源地址，例如项目分配的正式域名；未知时留空，不生成错误 canonical。Preview 自动 noindex，sitemap 不含预览页面。

Vercel 使用 Git Integration：

| 配置 | 取值 |
| --- | --- |
| 仓库 | janily/block_travel |
| Framework | Next.js |
| Root Directory | 仓库根目录 |
| Node.js | 24.x |
| Install | pnpm install --frozen-lockfile |
| Build | pnpm build |
| Production Branch | main |

Preview 和 Production 设置 `ENABLE_EXPERIMENTAL_COREPACK=1`，核对安装日志中的 pnpm 版本。源代码不需要运行时秘密。GitHub CI 和 Vercel 构建可能并行；通过 PR 必需检查及 Preview 实播验收控制合并。

[验收记录与差异](docs/mvp-delivery.md) 区分自动检查、部署检查和真实设备待验收项。正式上线前按研发文档完成 A01–A12。

## 工程结构与设计

Next.js 16 App Router、React、严格 TypeScript、Zod、CSS Modules；无数据库或独立内容 API。
`src/lib/content-schema.ts` 是内容类型的唯一来源；文件校验拒绝非法路径、缺失素材、越界链接、LFS 指针和达到 100 MiB 的 MP4。
共享变量在 `src/app/globals.css`，组件样式在 `src/components/ui.module.css`，视觉合同见 DESIGN.md。

后续范围不包含：HLS、上传后台、登录、钱包、付费、统计服务、收藏或单集分享。

## 回滚

在 Vercel 控制台回滚到允许选择的已知正常部署，记录部署地址与提交；同时通过修复 PR 或 revert 恢复正确源码，不强推共享历史。Instant Rollback 后核对自动域名分配状态，修复后 Undo Rollback / Promote 并再次验收播放。详见作者发布说明。
