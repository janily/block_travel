import { readFile, realpath, stat, readdir, open } from "node:fs/promises";
import { resolve, relative, isAbsolute, join } from "node:path";
import { parseContent } from "./content-schema";

const MiB = 1024*1024;
function within(root:string, target:string) {
  const path = relative(root,target);
  return path === "" || (!path.startsWith("..") && !isAbsolute(path));
}
export async function checkContent(root:string) {
  const readJson = async (name:string) => {
    try { return JSON.parse(await readFile(join(root,"content",name),"utf8")) as unknown; }
    catch(error) { throw new Error("content/"+name+": "+String(error)); }
  };
  const data = parseContent(await readJson("site.json"),await readJson("videos.json"));
  const publicRoot = resolve(await realpath(root),"public");
  const warnings:string[]=[];
  const referenced = new Set<string>();
  async function asset(url:string, folder:string, field:string) {
    try {
      const actual = await realpath(resolve(publicRoot,"."+url));
      const allowed = resolve(publicRoot,folder);
      if(!within(allowed,actual)) throw new Error("文件或符号链接越出 public/"+folder);
      const info = await stat(actual);
      if(!info.isFile() || info.size===0) throw new Error("空文件或非普通文件");
      return {actual,info};
    } catch(error) { throw new Error(field+": "+String(error)); }
  }
  const published = data.videos.filter(v=>v.status==="published");
  for(const v of published) {
    const file = await asset(v.src,"media/videos",v.id+".src");
    referenced.add(file.actual);
    await asset(v.poster.src,"posters",v.id+".poster");
  }
  let totalBytes=0;
  async function walk(directory:string,seen:Set<string>) {
    const actual=await realpath(directory);
    if(!within(resolve(publicRoot,"media/videos"),actual)) throw new Error("视频目录符号链接越界: "+directory);
    if(seen.has(actual)) return;
    seen.add(actual);
    for(const entry of await readdir(directory,{withFileTypes:true})) {
      const path=join(directory,entry.name);
      const target=await realpath(path);
      if(!within(resolve(publicRoot,"media/videos"),target)) throw new Error("视频目录符号链接越界: "+path);
      const info=await stat(target);
      if(info.isDirectory()) { await walk(path,seen); continue; }
      if(!entry.name.toLowerCase().endsWith(".mp4")) continue;
      totalBytes+=info.size;
      const label=published.find(v=>resolve(publicRoot,"."+v.src)===path)?.id ?? relative(publicRoot,path);
      if(info.size===0) throw new Error(label+".src: 空文件");
      if(info.size>=100*MiB) throw new Error(label+".src: 达到 100 MiB，拒绝发布");
      if(info.size>50*MiB) warnings.push(label+": 大于 50 MiB");
      const handle=await open(target,"r");
      try {
        const buffer=Buffer.alloc(200);
        const {bytesRead}=await handle.read(buffer,0,200,0);
        if(buffer.subarray(0,bytesRead).toString("utf8").startsWith("version https://git-lfs.github.com/spec/v1")) throw new Error(label+".src: 检测到 Git LFS 指针");
      } finally { await handle.close(); }
      if(!referenced.has(target)) warnings.push("未被 published 引用但仍会公开发布: "+relative(publicRoot,path));
    }
  }
  const dir=join(publicRoot,"media/videos");
  try { await stat(dir); } catch(error) {
    if((error as NodeJS.ErrnoException).code!=="ENOENT") throw error;
    return {published:published.length,totalBytes,warnings};
  }
  await walk(dir,new Set());
  if(totalBytes>200*MiB) warnings.push("视频目录超过 200 MiB，请评估迁移媒体服务");
  if(published.length>5) warnings.push("影片超过 5 部，请复核媒体分发方案");
  return {published:published.length,totalBytes,warnings};
}
