import { Injectable } from '@nestjs/common';
import type {
  LocationReading,
  ProvisionDeviceResult,
  TelematicsProvider,
} from './telematics.types';

/** Fake coordinates near Lagos, Nigeria — used by every mock fixture. */
const FAKE_LAGOS_COORDS = { lat: 6.5244, lng: 3.3792 };

/** Mock Initrack/Tracker NG adapter. No real GPS provisioning happens here. */
@Injectable()
export class MockTelematicsProvider implements TelematicsProvider {
  async provisionDevice(vehicleId: string): Promise<ProvisionDeviceResult> {
    return Promise.resolve({
      deviceId: `mock-initrack-${vehicleId}`,
      status: 'PROVISIONED',
    });
  }

  async getLocation(_deviceId: string): Promise<LocationReading> {
    return Promise.resolve({ ...FAKE_LAGOS_COORDS, recordedAt: new Date() });
  }
}
