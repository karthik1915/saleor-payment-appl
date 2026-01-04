import { APL } from "@saleor/app-sdk/APL";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";
import { FileAPL, FileAPLConfig } from "@saleor/app-sdk/APL/file";
import { UpstashAPL, UpstashAPLConfig } from "@saleor/app-sdk/APL/upstash";

export let apl: APL;

switch (process.env.APL) {
  case "upstash": {
    const upstashConfig: UpstashAPLConfig = {
      restToken: process.env.UPSTASH_REDIS_REST_TOKEN!,
      restURL: process.env.UPSTASH_REDIS_REST_URL!,
    };
    apl = new UpstashAPL(upstashConfig);
    break;
  }

  default: {
    const fileAplConfig: FileAPLConfig = {
      fileName: "saleor-app-auth.json",
    };
    apl = new FileAPL(fileAplConfig);
  }
}

export const saleorApp = new SaleorApp({
  apl,
});
