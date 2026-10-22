import { categories, categorySchema, publicVideos, type Video } from "./content-schema";
export type Query = {q:string; category:"all" | keyof typeof categories; available:boolean};
export type SearchParams = Record<string,string | string[] | undefined>;
export function normalizeQuery(value:string):string { return [...value.normalize("NFKC").trim()].slice(0,120).join(""); }
export function parseQuery(params:URLSearchParams | SearchParams):Query {
  const first = (key:string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };
  const category = categorySchema.safeParse(first("category"));
  return {q:normalizeQuery(first("q")),category:category.success ? category.data : "all",available:first("available")==="1"};
}
export function serializeQuery(query:Query, current:string):string {
  const url = new URL(current,"https://local.invalid");
  for(const name of ["q","category","available"]) url.searchParams.delete(name);
  const q = normalizeQuery(query.q);
  if(q) url.searchParams.set("q",q);
  if(query.category !== "all") url.searchParams.set("category",query.category);
  if(query.available) url.searchParams.set("available","1");
  return url.pathname+url.search+url.hash;
}
export function filterVideos(videos:Video[], query:Query) {
  const needle = normalizeQuery(query.q).toLocaleLowerCase("zh-CN");
  return publicVideos(videos).filter(v=>
    (query.category==="all" || v.category===query.category) &&
    (!query.available || v.status==="published") &&
    [v.title,v.summary,v.series ?? "",categories[v.category],v.id].some(s=>s.normalize("NFKC").toLocaleLowerCase("zh-CN").includes(needle))
  );
}
