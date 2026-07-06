import { getProviderMode, throwLiveModeNotImplemented } from './provider-mode';

describe('getProviderMode', () => {
  const original = process.env.PROVIDER_MODE;
  afterEach(() => {
    process.env.PROVIDER_MODE = original;
  });

  it('defaults to mock when unset', () => {
    delete process.env.PROVIDER_MODE;
    expect(getProviderMode()).toBe('mock');
  });

  it('returns live when explicitly set', () => {
    process.env.PROVIDER_MODE = 'live';
    expect(getProviderMode()).toBe('live');
  });

  it('rejects an invalid value', () => {
    process.env.PROVIDER_MODE = 'production';
    expect(() => getProviderMode()).toThrow(/Invalid PROVIDER_MODE/);
  });
});

describe('throwLiveModeNotImplemented', () => {
  it('always throws with a HUMAN-CHECKPOINT message', () => {
    expect(() => throwLiveModeNotImplemented('Test Provider')).toThrow(/HUMAN-CHECKPOINT/);
  });
});
