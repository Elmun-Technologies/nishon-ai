import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { HeygenService } from "./heygen.service";
import { HeygenController } from "./heygen.controller";

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 65_000,
      maxRedirects: 3,
    }),
  ],
  controllers: [HeygenController],
  providers: [HeygenService],
  exports: [HeygenService],
})
export class HeygenModule {}
