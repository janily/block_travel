import { test, expect } from "@playwright/test";

test("home is honest, loads no MP4 before selection, and supports legacy links",async({page})=>{
  const requests:string[]=[];
  page.on("request",request=>{if(request.url().includes(".mp4")) requests.push(request.url());});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"每个机制， 一支短片。"})).toBeVisible();
  await expect(page.getByText("03:13").first()).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.goto("/videos.html?q=共识&category=basics");
  await expect(page).toHaveURL(/\/videos\?q=/);
  await expect(page.getByRole("heading",{name:"共识机制"})).toBeVisible();
  await expect(page.getByRole("link",{name:"播放《起源》",exact:true})).toHaveCount(0);
});

test("recent releases are directly playable from home and preserve keyboard focus",async({page})=>{
  await page.goto("/");
  const recent=page.getByRole("region",{name:"最近更新",exact:true});
  await expect(recent.getByRole("heading",{level:3})).toHaveText(["零知识证明","Rollup","预言机","智能合约"]);
  await expect(page.getByText("待更新",{exact:true})).toHaveCount(0);
  const trigger=recent.getByRole("link",{name:"播放《零知识证明》",exact:true});
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog",{name:"零知识证明",exact:true})).toBeVisible();
  await expect(page.locator("video")).toHaveAttribute("src","/media/videos/zero-knowledge-proof-v1.mp4");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await recent.getByRole("link",{name:/浏览片单/}).click();
  await expect(page).toHaveURL(/\/videos\?available=1$/);
  await expect(page.getByLabel("仅看已更新")).toBeChecked();
});

test("filters, IME, clearing, no results recovery and URL history agree",async({page})=>{
  await page.goto("/videos?tag=kept#results");
  const input=page.getByRole("searchbox");
  await input.fill("共识");
  await expect(page.getByRole("heading",{name:"共识机制"})).toBeVisible();
  await expect(page).toHaveURL(/q=/);
  await page.getByLabel("仅看已更新").check();
  await expect(page.getByText("有 1 条匹配的待更新选题")).toBeVisible();
  await page.getByRole("button",{name:"查看待更新选题"}).click();
  await expect(page.getByRole("heading",{name:"后续选题"})).toBeFocused();
  await expect(input).toHaveValue("共识");
  await expect(page).not.toHaveURL(/available=/);
  await page.getByRole("button",{name:"清除搜索"}).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("");
  await expect(page).toHaveURL(/tag=kept#results$/);
  await input.dispatchEvent("compositionstart");
  await input.fill("起源");
  await expect(page.getByRole("heading",{name:"共识机制"})).toBeVisible();
  await input.dispatchEvent("compositionend",{data:"起源"});
  await expect(page.getByRole("link",{name:"播放《起源》",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"共识机制"})).toHaveCount(0);
  await page.goto("/videos?q=Gas&available=1");
  await expect(input).toHaveValue("Gas");
  await page.getByRole("link",{name:"首页",exact:true}).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(input).toHaveValue("Gas");
  await expect(page.getByLabel("仅看已更新")).toBeChecked();
  await page.getByRole("button",{name:"重置筛选"}).first().click();
  await expect(input).toHaveValue("");
  await expect(page).toHaveURL(/\/videos$/);
});

test("dialog closes with Escape, button and backdrop, restores focus and releases old media",async({page})=>{
  await page.goto("/");
  const trigger=page.getByRole("link",{name:/播放《起源》/}).first();
  for(const method of ["escape","button","backdrop"]) {
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    const media=await page.$("video");
    const before=page.url();
    if(method==="escape") await page.keyboard.press("Escape");
    if(method==="button") await page.getByRole("button",{name:"关闭播放器"}).click();
    if(method==="backdrop") await page.mouse.click(2,2);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(page.url()).toBe(before);
    expect(await media!.evaluate(video=>({paused:video.paused,src:video.getAttribute("src")}))).toEqual({paused:true,src:null});
  }
  await trigger.click();
  const media=await page.$("video");
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent("pagehide")));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await media!.evaluate(video=>video.paused)).toBe(true);
});

test("real MP4 metadata and playback work, retry uses the same source",async({page})=>{
  await page.goto("/");
  await page.getByRole("link",{name:/播放《起源》/}).first().click();
  await expect.poll(()=>page.locator("video").evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(0);
  expect(await page.locator("video").evaluate((v:HTMLVideoElement)=>v.duration)).toBeCloseTo(193.033,0);
  await page.getByRole("button",{name:"关闭播放器"}).click();
  await page.route("**/media/videos/*.mp4",route=>route.fulfill({status:404}));
  await page.getByRole("link",{name:/播放《起源》/}).first().click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("视频暂时无法播放");
  await page.getByRole("button",{name:"重新加载",exact:true}).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link",{name:/单独打开视频/})).toHaveAttribute("href","/media/videos/origin-v1.mp4");
});

test("history navigation closes playback and drops stale pending filter updates",async({page})=>{
  await page.goto("/videos?q=Gas");
  await page.getByRole("link",{name:"首页",exact:true}).click();
  await page.getByRole("link",{name:/播放《起源》/}).first().click();
  const media=await page.$("video");
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toHaveValue("Gas");
  expect(await media!.evaluate(v=>v.paused)).toBe(true);
  await page.getByRole("searchbox").fill("pending");
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
});

test("GET search and direct media remain usable without JavaScript",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  const page=await context.newPage();
  await page.goto("http://127.0.0.1:3000/videos");
  await page.getByRole("searchbox").fill("共识");
  await page.getByRole("button",{name:"应用筛选"}).click();
  await expect(page.getByRole("heading",{name:"共识机制"})).toBeVisible();
  await expect(page.getByRole("heading",{name:"起源",exact:true})).toHaveCount(0);
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.getByRole("link",{name:/播放《起源》/}).first()).toHaveAttribute("href","/media/videos/origin-v1.mp4");
  await context.close();
});

for(const width of [320,375,1280]) test("no horizontal overflow at "+width,async({page})=>{
  await page.setViewportSize({width,height:800});
  for(const path of ["/","/videos"]) {
    await page.goto(path);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
});
test("404 provides useful navigation and local Range serves real bytes",async({page,request})=>{
  const response=await page.goto("/missing");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link",{name:"回到首页"})).toBeVisible();
  const range=await request.get("/media/videos/origin-v1.mp4",{headers:{Range:"bytes=0-1023"}});
  expect(range.status()).toBe(206);
  expect(range.headers()["content-range"]).toBe("bytes 0-1023/9241839");
  expect((await range.body()).length).toBe(1024);
});
