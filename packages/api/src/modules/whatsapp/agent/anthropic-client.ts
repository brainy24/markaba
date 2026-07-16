import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

const PLACEHOLDER_KEY = 'placeholder-anthropic-api-key';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 512;

/**
 * Thin injectable wrapper around the Anthropic SDK — kept as its own class so
 * ConversationalAgentService's tests can mock this instead of hitting the
 * real API (same DI-for-testability pattern as PrismaService elsewhere in
 * this repo). No mock/sandbox mode exists here the way other integration
 * adapters have one — there's no meaningful way to fake a conversation — so
 * callers check `isConfigured()` and fall back to deterministic behavior
 * instead.
 */
@Injectable()
export class AnthropicClient {
  private client: Anthropic | undefined;

  isConfigured(): boolean {
    const key = process.env.ANTHROPIC_API_KEY;
    return !!key && key !== PLACEHOLDER_KEY;
  }

  private getClient(): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return this.client;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.getClient().messages.create({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    return textBlock?.text ?? '';
  }
}
