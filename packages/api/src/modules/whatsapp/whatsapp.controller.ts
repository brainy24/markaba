import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { verifyWebhookSignature } from './webhook-signature';
import { WhatsAppService } from './whatsapp.service';

interface WhatsAppWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{ from: string; text?: { body: string } }>;
      };
    }>;
  }>;
}

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  /** Meta's webhook subscription verification handshake. */
  @Get('webhook')
  verifySubscription(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    if (mode === 'subscribe' && token && token === expectedToken) {
      return challenge;
    }
    throw new ForbiddenException('Webhook verification failed');
  }

  @Post('webhook')
  async receiveMessage(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string | undefined,
    @Body() body: WhatsAppWebhookPayload,
  ): Promise<{ status: 'ok'; reply?: string }> {
    const appSecret = process.env.WHATSAPP_APP_SECRET ?? '';
    const rawBody = req.rawBody?.toString('utf8') ?? '';

    if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message?.text?.body) {
      throw new BadRequestException('No message text found in webhook payload');
    }

    const reply = await this.whatsapp.handleMessage({
      from: message.from,
      text: message.text.body,
    });

    return { status: 'ok', reply };
  }
}
