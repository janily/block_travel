# 作者发布说明

## 新增影片

1. 从最新 main 创建工作分支。保留稳定 id；选择 basics（区块链基础）、mechanisms（链上机制）或 applications（应用场景）。
2. 本地确认 MP4 为 H.264/AAC、yuv420p、画面及字幕清晰，文件名带版本号，例如 consensus-v1.mp4。不要覆盖已发布文件名悄悄换内容。
3. 将视频加入 public/media/videos/，真实封面加入 public/posters/。不要提交原始母版或 Git LFS。
4. 修改 content/videos.json 中对应 planned 记录为 published，补齐真实 src、durationSeconds、poster（src/width/height/alt）、burnedInCaptions，并填写实际发布日期 publishedAt（YYYY-MM-DD）。首页“最近更新”按此日期倒序选择最多 4 支非主推影片，同日保留 order/id 顺序；历史影片日期未知时可省略，不补造日期。已有《哈希》记录是完整示例。
5. 如需主推，将 content/site.json 的 featuredVideoId 设为该 id；为 null 时使用按 order/id 排序的第一部 published。没有已发布影片时设 null。
6. 执行 pnpm build，然后 pnpm exec playwright install chromium、pnpm test:e2e。提交源码、配置、视频和封面并创建 PR。
7. 等待 CI，通过该提交对应的 Vercel Preview 检查声音、字幕、播放至少 15 秒、拖到未缓冲位置、关闭静音、手机横竖屏。确认后合并 main。
8. 正式域名再次播放、检查 Range，记录提交 SHA、Preview/正式 URL、设备和结果。

planned 记录只填写文本、分类、顺序和可选系列信息，不得填写播放字段或虚构时长。影片排序为 order 升序，相同时 id 升序。标题改动不改变 id。

## 本地媒体预检

```bash
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,pix_fmt -show_entries format=duration,size -of json input.mp4
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

第二条只适用于已兼容编码，不用于重复有损压缩。配置时长与实际误差应在一秒以内。pnpm content:check 不依赖 ffmpeg，也不替代真实浏览器解码和音画检查。

## 更新与归档

- 文案修改只改 JSON；内容换版使用新的版本化 MP4/封面路径，同步真实时长与尺寸，再走 PR。
- 下架时改为 archived；如果它是主推影片，同步替换 featuredVideoId 或设 null。
- archived 从页面和公开客户端片单移除，但 public 文件仍公开。需要停止新部署中的直接访问时，还须删除对应素材。
- Git 历史、旧部署、缓存可能保留旧文件。归档不是权限保护或历史抹除。
- 零影片是合法状态；保留 site 配置且 featuredVideoId 为 null 即可。

## 体积边界

1 MiB = 1,048,576 字节。单 MP4 大于 50 MiB 提醒，达到 100 MiB 拒绝；视频总量超过 200 MiB 或已发布超过五部提醒评估媒体迁移。超过 GitHub 网页 25 MiB 上传边界时用本地 Git。二进制历史会累积，不靠覆盖文件或拆分视频规避预算。

## 部署与 Range 验收

Vercel 项目使用仓库根目录、Node 24、pnpm 冻结安装和 pnpm build；Preview/Production 设置 ENABLE_EXPERIMENTAL_COREPACK=1。确定正式域名后配置 SITE_URL，不使用 localhost 或临时 Preview 作为生产 canonical。main 的 PR 必需 CI 检查需在仓库设置中启用。

```bash
curl -sS -L -D range-headers.txt -H 'Range: bytes=0-1023' -o range-body.bin 'https://<实际域名>/media/videos/origin-v1.mp4'
wc -c range-body.bin
```

必须是最终 206、Content-Range 的总长与文件相符、响应体 1024 字节且类型 video/mp4。登录页、404、200 全文件均不能通过 Range 验收。Preview 部署保护需先获得访问权限。

## 故障回滚

1. 在 Vercel 项目 Deployments 找到已确认正常的部署，使用控制台允许的 Rollback，记录实际 URL 和 Git SHA；不要假设套餐允许任意历史版本。
2. 实测回滚域名播放与 Range。核对 Instant Rollback 是否暂停自动域名分配。
3. 仓库通过修复 PR 或 revert 恢复对应源版本，不 force push。
4. 修复验收后使用 Undo Rollback / Promote 恢复发布，再跑播放与导航冒烟检查。

紧急撤回还应单独检查旧部署和公开 Git 历史。不要在发布记录中宣称已撤销所有公开副本。
