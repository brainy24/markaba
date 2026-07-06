import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies the `X-Hub-Signature-256` header WhatsApp Cloud API sends on every
 * webhook POST, per Meta's documented HMAC-SHA256-over-the-raw-body scheme.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) return false;

  const expected = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  const provided = signatureHeader.slice('sha256='.length);

  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}
