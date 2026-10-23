import { z } from "zod";

export const categories = {
  basics: "区块链基础",
  mechanisms: "链上机制",
  applications: "应用场景",
} as const;
export const categorySchema = z.enum(["basics", "mechanisms", "applications"]);
const text = z.string().trim().min(1);
export const videoPath = z.string().regex(/^\/media\/videos\/[a-zA-Z0-9_-]+\.mp4$/, "须为 /media/videos/ 下的 MP4 文件");
export const posterPath = z.string().regex(/^\/posters\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/, "须为 /posters/ 下的图片");
const poster = z.object({
  src: posterPath, width: z.number().int().positive(), height: z.number().int().positive(), alt: text,
}).strict();
const base = {
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: text, summary: text, description: text.optional(),
  category: categorySchema, order: z.number().int().nonnegative(),
  series: text.optional(), episode: z.number().int().positive().optional(),
};
const media = {
  src: videoPath, durationSeconds: z.number().finite().positive(),
  poster, burnedInCaptions: z.boolean(),
  publishedAt: z.iso.date().optional(),
};
export const videoSchema = z.discriminatedUnion("status", [
  z.object({...base, status: z.literal("published"), ...media}).strict(),
  z.object({...base, status: z.literal("planned")}).strict(),
  z.object({...base, status: z.literal("archived"),
    src: media.src.optional(), durationSeconds: media.durationSeconds.optional(),
    poster: poster.optional(), burnedInCaptions: z.boolean().optional(),
    publishedAt: media.publishedAt,
  }).strict(),
]);
export const siteSchema = z.object({name:text, description:text, featuredVideoId: text.nullable()}).strict();
const contentSchema = z.object({site:siteSchema,videos:z.array(videoSchema)}).superRefine((data,ctx)=>{
  const ids = new Set<string>();
  data.videos.forEach((video,index)=>{
    if(ids.has(video.id)) ctx.addIssue({code:"custom",path:["videos",index,"id"],message:"id 重复"});
    ids.add(video.id);
  });
  if(data.site.featuredVideoId !== null && !data.videos.some(v=>v.id === data.site.featuredVideoId && v.status === "published")){
    ctx.addIssue({code:"custom",path:["site","featuredVideoId"],message:"featuredVideoId 必须指向 published 影片或为 null"});
  }
});
export type Video = z.infer<typeof videoSchema>;
export type PublishedVideo = Extract<Video,{status:"published"}>;
export type PublicVideo = Exclude<Video,{status:"archived"}>;
export type Content = z.infer<typeof contentSchema>;
export function parseContent(site: unknown, videos: unknown): Content { return contentSchema.parse({site,videos}); }
export function publicVideos(videos: Video[]): PublicVideo[] {
  return videos.filter((v):v is PublicVideo=>v.status !== "archived").sort((a,b)=>a.order-b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
export function featuredVideo(data:Content): PublishedVideo | undefined {
  const published = publicVideos(data.videos).filter((v):v is PublishedVideo=>v.status === "published");
  return published.find(v=>v.id === data.site.featuredVideoId) ?? published[0];
}
export function recentVideos(videos: Video[], featuredId?: string): PublishedVideo[] {
  return publicVideos(videos)
    .filter((video): video is PublishedVideo => video.status === "published" && video.id !== featuredId)
    // Later same-day episodes come first; undated legacy films retain editorial order.
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || (a.publishedAt ? b.order - a.order : 0))
    .slice(0, 4);
}
export function formatDuration(seconds: number): string {
  const value = Math.floor(seconds);
  return String(Math.floor(value/60)).padStart(2,"0")+":"+String(value%60).padStart(2,"0");
}
