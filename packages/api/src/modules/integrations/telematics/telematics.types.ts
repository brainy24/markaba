export type DeviceStatus = 'PROVISIONED' | 'ACTIVE' | 'OFFLINE';

export interface ProvisionDeviceResult {
  deviceId: string;
  status: DeviceStatus;
}

export interface LocationReading {
  lat: number;
  lng: number;
  recordedAt: Date;
}

/** Adapter interface for the GPS telematics provider (Initrack/Tracker NG in production). */
export interface TelematicsProvider {
  provisionDevice(vehicleId: string): Promise<ProvisionDeviceResult>;
  getLocation(deviceId: string): Promise<LocationReading>;
}

export const TELEMATICS_PROVIDER = Symbol('TELEMATICS_PROVIDER');
