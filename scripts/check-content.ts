import { checkContent } from "../src/lib/check-content";
try {
  const result=await checkContent(process.cwd());
  for(const warning of result.warnings) console.warn("提醒: "+warning);
  console.log("内容校验通过: "+result.published+" 部已更新；MP4 合计 "+result.totalBytes+" 字节。");
} catch(error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode=1;
}
