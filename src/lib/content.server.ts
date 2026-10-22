import "server-only";
import site from "../../content/site.json";
import videos from "../../content/videos.json";
import { parseContent, publicVideos, featuredVideo } from "./content-schema";

export function getContent() {
  const data = parseContent(site,videos);
  return {site:data.site,videos:publicVideos(data.videos),featured:featuredVideo(data)};
}
