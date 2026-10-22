import type { Metadata } from "next";
export const isPreview=process.env.VERCEL_ENV==="preview";
export function siteOrigin():string | undefined {
  const value=process.env.SITE_URL;
  if(!value) return;
  try {
    const url=new URL(value);
    if(url.protocol!=="https:" || url.username || url.password || url.pathname!=="/" || url.search || url.hash) return;
    return url.origin;
  } catch {return;}
}
export function pageMetadata(title:string,description:string,path:string):Metadata {
  const origin=siteOrigin();
  return {
    title,description,
    ...(origin ? {metadataBase:new URL(origin),alternates:{canonical:origin+path}}:{}),
    openGraph:{title,description,locale:"zh_CN",type:"website",...(origin ? {url:origin+path}:{})},
    ...(isPreview ? {robots:{index:false,follow:false}}:{}),
  };
}
