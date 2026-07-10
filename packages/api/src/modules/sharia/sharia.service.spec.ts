import { NotImplementedError } from '@markaba/shared';
import type { Application, Vehicle } from '@markaba/shared';
import { ShariaService } from './sharia.service';

describe('ShariaService', () => {
  const service = new ShariaService();
  const application = { id: 'app-1' } as Application;
  const vehicle = { id: 'veh-1' } as Vehicle;

  it('throws NotImplementedError for every Sharia-critical method', () => {
    expect(() => service.generateIjarahContract(application, vehicle)).toThrow(NotImplementedError);
    expect(() => service.generateMurabahaContract(application, vehicle)).toThrow(
      NotImplementedError,
    );
    expect(() => service.evaluateComplianceRules(application)).toThrow(NotImplementedError);
    expect(() => service.transferOwnership(application, vehicle)).toThrow(NotImplementedError);
  });
});
