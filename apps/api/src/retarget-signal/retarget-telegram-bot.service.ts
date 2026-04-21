import { HttpService } from "@nestjs/axios";
import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

@Injectable()
export class RetargetTelegramBotService {
  private readonly logger = new Logger(RetargetTelegramBotService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private botToken(): string {
    const t = this.config.get<string>("TELEGRAM_BOT_TOKEN", "").trim();
    if (!t) {
      throw new BadRequestException("TELEGRAM_BOT_TOKEN sozlanmagan");
    }
    return t;
  }

  async sendPlain(chatId: string, text: string): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken()}/sendMessage`;
    await firstValueFrom(
      this.http.post(url, {
        chat_id: chatId,
        text,
      }),
    );
  }

  async sendRetargetOffer(input: {
    chatId: string;
    headline: string;
    discountLine: string;
    buttonText: string;
    buttonUrl: string;
  }): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken()}/sendMessage`;
    const text =
      `${input.headline} kerakmi? 😊\n\n` +
      `Oxirgi xaridingiz yoqdimi?\n` +
      `${input.discountLine}\n\n` +
      `Faqat siz uchun.`;
    await firstValueFrom(
      this.http.post(url, {
        chat_id: input.chatId,
        text,
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{ text: input.buttonText, url: input.buttonUrl }]],
        },
      }),
    );
    this.logger.log({ message: "Telegram retarget xabar yuborildi", chatId: input.chatId });
  }
}
