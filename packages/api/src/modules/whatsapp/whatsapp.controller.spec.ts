import { createHmac } from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';

describe('WhatsAppController', () => {
  const APP_SECRET = 'test-secret';
  const VERIFY_TOKEN = 'test-verify-token';
  let controller: WhatsAppController;
  let whatsapp: { handleMessage: jest.Mock };

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = APP_SECRET;
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = VERIFY_TOKEN;
    whatsapp = { handleMessage: jest.fn(() => Promise.resolve('a reply')) };
    controller = new WhatsAppController(whatsapp as unknown as WhatsAppService);
  });

  describe('verifySubscription', () => {
    it('echoes the challenge for a correct verify token', () => {
      expect(controller.verifySubscription('subscribe', VERIFY_TOKEN, 'challenge-123')).toBe(
        'challenge-123',
      );
    });

    it('rejects an incorrect verify token', () => {
      expect(() => controller.verifySubscription('subscribe', 'wrong', 'challenge-123')).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('receiveMessage', () => {
    function buildRequest(rawBody: string): RawBodyRequest<Request> {
      return { rawBody: Buffer.from(rawBody, 'utf8') } as RawBodyRequest<Request>;
    }

    function sign(payload: string): string {
      return `sha256=${createHmac('sha256', APP_SECRET).update(payload, 'utf8').digest('hex')}`;
    }

    const payload = {
      entry: [
        {
          changes: [{ value: { messages: [{ from: '+2348000000001', text: { body: 'apply' } }] } }],
        },
      ],
    };
    const rawBody = JSON.stringify(payload);

    it('routes a validly signed message to the WhatsApp service', async () => {
      const result = await controller.receiveMessage(buildRequest(rawBody), sign(rawBody), payload);
      expect(whatsapp.handleMessage).toHaveBeenCalledWith({
        from: '+2348000000001',
        text: 'apply',
      });
      expect(result).toEqual({ status: 'ok', reply: 'a reply' });
    });

    it('rejects a request with an invalid signature', async () => {
      await expect(
        controller.receiveMessage(buildRequest(rawBody), 'sha256=deadbeef', payload),
      ).rejects.toThrow(ForbiddenException);
      expect(whatsapp.handleMessage).not.toHaveBeenCalled();
    });
  });
});
