import { describe, expect, it } from "vitest";
import { parseQuery, serializeQuery, filterVideos } from "../src/lib/catalog-query";
import { parseContent, publicVideos, featuredVideo } from "../src/lib/content-schema";
import site from "./fixtures/site.json";
import videos from "./fixtures/videos.json";

describe("catalog public contract", () => {
  it("normalizes Unicode and reads only the first repeated parameter", () => {
    expect(parseQuery(new URLSearchParams("q= ＡＭＭ &q=ignored&category=oops&available=true"))).toEqual({q:"AMM",category:"all",available:false});
    expect([...parseQuery(new URLSearchParams({q:"😀".repeat(121)})).q]).toHaveLength(120);
  });
  it("preserves unrelated parameters and hash when resetting", () => {
    expect(serializeQuery({q:"",category:"all",available:false}, "/videos?x=1&q=old&q=bad#results")).toBe("/videos?x=1#results");
  });
  it("combines filters and excludes archived entries", () => {
    const data = parseContent(site, videos);
    expect(filterVideos(data.videos,{q:"共识",category:"basics",available:false}).map(v=>v.id)).toEqual(["consensus"]);
    expect(filterVideos(data.videos,{q:"共识",category:"basics",available:true})).toEqual([]);
    expect(filterVideos(data.videos,{q:"ＡＭＭ",category:"applications",available:false}).map(v=>v.id)).toEqual(["defi"]);
    const archived = {...data.videos[0],status:"archived" as const};
    expect(publicVideos([archived])).toEqual([]);
  });
  it("accepts an empty catalog and chooses the first published fallback", () => {
    const empty = parseContent({...site,featuredVideoId:null},[]);
    expect(featuredVideo(empty)).toBeUndefined();
    const data = parseContent({...site,featuredVideoId:null},videos);
    expect(featuredVideo(data)?.id).toBe("origin");
  });
  it("rejects invalid featured, duplicate IDs and planned playback fields", () => {
    expect(()=>parseContent({...site,featuredVideoId:"gas"}, videos)).toThrow(/featuredVideoId/);
    expect(()=>parseContent(site,[...videos,videos[0]])).toThrow(/id/);
    expect(()=>parseContent({...site,featuredVideoId:null},[{...videos[1],src:"/media/videos/a.mp4"}])).toThrow();
  });
});
