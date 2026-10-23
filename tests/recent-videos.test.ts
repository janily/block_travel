import { describe, expect, it } from "vitest";
import { parseContent, recentVideos, type PublishedVideo, type Video } from "../src/lib/content-schema";
import site from "./fixtures/site.json";
import videos from "./fixtures/videos.json";

const origin = parseContent(site, videos).videos[0] as PublishedVideo;
const film = (id: string, order: number, publishedAt?: string): PublishedVideo => ({...origin, id, order, publishedAt});

describe("homepage recent releases", () => {
  it("ranks real release dates before editorial order and keeps same-day episodes in order", () => {
    const items = [film("legacy", 0), film("older", 1, "2026-10-22"), film("episode-two", 22, "2026-10-23"), film("episode-one", 21, "2026-10-23"), film("newest", 2, "2026-10-24")];
    expect(recentVideos(items).map(v => v.id)).toEqual(["newest", "episode-one", "episode-two", "older"]);
    expect(items[0].id).toBe("legacy");
  });
  it("excludes the featured film, planned topics and archived films", () => {
    const items: Video[] = [origin, {...origin, id:"removed", status:"archived"}, ...parseContent(site, videos).videos.slice(1), film("available", 20, "2026-10-23")];
    expect(recentVideos(items, origin.id).map(v => v.id)).toEqual(["available"]);
  });
  it("supports empty, single-featured and legacy-only catalogs", () => {
    expect(recentVideos([])).toEqual([]);
    expect(recentVideos([origin], origin.id)).toEqual([]);
    expect(recentVideos([film("second", 2), film("first", 1)]).map(v => v.id)).toEqual(["first", "second"]);
  });
  it("rejects impossible release dates while keeping undated content valid", () => {
    expect(() => parseContent(site, [{...origin, publishedAt:"2026-02-30"}])).toThrow();
    expect(() => parseContent(site, [origin])).not.toThrow();
  });
});
