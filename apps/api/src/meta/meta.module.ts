import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { MetaController } from "./meta.controller";
import { MetaAdsService } from "./meta-ads.service";

@Module({
  imports: [HttpModule],
  controllers: [MetaController],
  providers: [MetaAdsService],
  exports: [MetaAdsService],
})
export class MetaModule {}
