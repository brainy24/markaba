import { createHmac } from 'crypto';
import { verifyWebhookSignature } from './webhook-signature';

describe('verifyWebhookSignature', () => {
  const secret = 'test-app-secret';
  const body = JSON.stringify({ hello: 'world' });

  function sign(payload: string, appSecret: string): string {
    return `sha256=${createHmac('sha256', appSecret).update(payload, 'utf8').digest('hex')}`;
  }

  it('accepts a correctly signed payload', () => {
    expect(verifyWebhookSignature(body, sign(body, secret), secret)).toBe(true);
  });

  it('rejects a payload signed with the wrong secret', () => {
    expect(verifyWebhookSignature(body, sign(body, 'wrong-secret'), secret)).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const validSignature = sign(body, secret);
    expect(verifyWebhookSignature(body + 'tampered', validSignature, secret)).toBe(false);
  });

  it('rejects a missing signature header', () => {
    expect(verifyWebhookSignature(body, undefined, secret)).toBe(false);
  });

  it('rejects a malformed signature header', () => {
    expect(verifyWebhookSignature(body, 'not-a-real-signature', secret)).toBe(false);
  });
});
