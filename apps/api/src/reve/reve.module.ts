import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ReveService } from "./reve.service";
import { ReveController } from "./reve.controller";

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 125_000,
      maxRedirects: 3,
    }),
  ],
  controllers: [ReveController],
  providers: [ReveService],
  exports: [ReveService],
})
export class ReveModule {}
