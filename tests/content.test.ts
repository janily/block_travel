import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, symlink, truncate } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkContent } from "../src/lib/check-content";
import site from "./fixtures/site.json";
import videos from "./fixtures/videos.json";

const roots:string[]=[];
async function fixture(){
  const root=await mkdtemp(join(tmpdir(),"block-content-")); roots.push(root);
  await mkdir(join(root,"content"),{recursive:true});
  await mkdir(join(root,"public/media/videos"),{recursive:true});
  await mkdir(join(root,"public/posters"),{recursive:true});
  await writeFile(join(root,"content/site.json"),JSON.stringify(site));
  await writeFile(join(root,"content/videos.json"),JSON.stringify(videos));
  await writeFile(join(root,"public/media/videos/origin-v1.mp4"),"fixture");
  await writeFile(join(root,"public/posters/origin-v1.jpg"),"fixture");
  return root;
}
afterEach(async()=>{await Promise.all(roots.splice(0).map(root=>rm(root,{recursive:true,force:true})));});
describe("publication guard",()=>{
  it("allows a clean empty checkout without public but still rejects published missing assets",async()=>{
    const root=await fixture();
    await rm(join(root,"public"),{recursive:true});
    await expect(checkContent(root)).rejects.toThrow(/origin.*src/);
    await writeFile(join(root,"content/site.json"),JSON.stringify({...site,featuredVideoId:null}));
    await writeFile(join(root,"content/videos.json"),"[]");
    expect((await checkContent(root)).published).toBe(0);
  });
  it("allows empty and archived catalogs without their old media",async()=>{
    const root=await fixture();
    await writeFile(join(root,"content/site.json"),JSON.stringify({...site,featuredVideoId:null}));
    await writeFile(join(root,"content/videos.json"),JSON.stringify([{...videos[0],status:"archived",src:"/media/videos/deleted.mp4"}]));
    expect((await checkContent(root)).published).toBe(0);
    await writeFile(join(root,"content/videos.json"),"[]");
    expect((await checkContent(root)).published).toBe(0);
  });
  it("blocks missing media with the record and field in its error",async()=>{
    const root=await fixture();
    await rm(join(root,"public/media/videos/origin-v1.mp4"));
    await expect(checkContent(root)).rejects.toThrow(/origin.*src/);
  });
  it("blocks LFS pointers, empty files and project size boundary",async()=>{
    const root=await fixture(),file=join(root,"public/media/videos/origin-v1.mp4");
    await writeFile(file,"version https://git-lfs.github.com/spec/v1\noid sha256:x\nsize 100");
    await expect(checkContent(root)).rejects.toThrow(/LFS/);
    await writeFile(file,"");
    await expect(checkContent(root)).rejects.toThrow(/空文件/);
    await truncate(file,100*1024*1024);
    await expect(checkContent(root)).rejects.toThrow(/100 MiB/);
  });
  it("blocks traversal, external paths, queries and escaped paths",async()=>{
    for(const src of ["/media/videos/../a.mp4","https://example.com/a.mp4","/media/videos/a.mp4?q=x","/media/videos/%2e%2e.mp4","/media/videos/a\\b.mp4"]){
      const root=await fixture();
      await writeFile(join(root,"content/videos.json"),JSON.stringify([{...videos[0],src}]));
      await expect(checkContent(root)).rejects.toThrow();
    }
  });
  it("rejects symlinks outside public and warns about unreferenced MP4s",async()=>{
    const root=await fixture();
    await writeFile(join(root,"public/media/videos/unused.mp4"),"unused");
    expect((await checkContent(root)).warnings.join(" ")).toMatch(/unused.mp4/);
    await rm(join(root,"public/posters/origin-v1.jpg"));
    await writeFile(join(root,"outside.jpg"),"private");
    await symlink(join(root,"outside.jpg"),join(root,"public/posters/origin-v1.jpg"));
    await expect(checkContent(root)).rejects.toThrow(/origin.*poster/);
  });
});
