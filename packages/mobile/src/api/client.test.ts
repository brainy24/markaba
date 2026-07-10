import { fetchMyApplications } from './client';

describe('fetchMyApplications', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns the parsed application list on success', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 'app-1', state: 'SUBMITTED' }]),
    }) as unknown as typeof fetch;

    const result = await fetchMyApplications('+2348000000001');
    expect(result).toEqual([{ id: 'app-1', state: 'SUBMITTED' }]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/applications?phoneNumber=%2B2348000000001'),
    );
  });

  it('throws when the API responds with a non-OK status', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(fetchMyApplications('+2348000000001')).rejects.toThrow(/Failed to load/);
  });
});
