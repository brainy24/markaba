import { MockTelematicsProvider } from './telematics.mock';

describe('MockTelematicsProvider', () => {
  const provider = new MockTelematicsProvider();

  it('provisions a fake device', async () => {
    const result = await provider.provisionDevice('vehicle-1');
    expect(result.status).toBe('PROVISIONED');
    expect(result.deviceId).toContain('vehicle-1');
  });

  it('returns a fake location reading', async () => {
    const reading = await provider.getLocation('mock-initrack-vehicle-1');
    expect(reading.lat).toBeCloseTo(6.5244, 3);
    expect(reading.lng).toBeCloseTo(3.3792, 3);
    expect(reading.recordedAt).toBeInstanceOf(Date);
  });
});
