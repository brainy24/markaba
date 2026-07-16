import { AnthropicClient } from './anthropic-client';

describe('AnthropicClient.isConfigured', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = originalKey;
    }
  });

  it('is false when unset', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(new AnthropicClient().isConfigured()).toBe(false);
  });

  it('is false when still the .env.example placeholder', () => {
    process.env.ANTHROPIC_API_KEY = 'placeholder-anthropic-api-key';
    expect(new AnthropicClient().isConfigured()).toBe(false);
  });

  it('is true for a real-looking key', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-value';
    expect(new AnthropicClient().isConfigured()).toBe(true);
  });
});
