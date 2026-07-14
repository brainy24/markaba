import { routeIntent } from './message-router';

describe('routeIntent', () => {
  it('routes "apply" to start_application', () => {
    expect(routeIntent('apply')).toBe('start_application');
    expect(routeIntent('I want to Apply now')).toBe('start_application');
  });

  it('routes "status" to check_status', () => {
    expect(routeIntent('status')).toBe('check_status');
    expect(routeIntent('what is my status?')).toBe('check_status');
  });

  it('routes FAQ keywords to education', () => {
    expect(routeIntent('what is ijarah?')).toBe('education');
    expect(routeIntent('help')).toBe('education');
    expect(routeIntent('menu')).toBe('education');
  });

  it('routes the newer FAQ topic keywords to education too', () => {
    expect(routeIntent('how much is the down payment?')).toBe('education');
    expect(routeIntent('why is there a gps tracker?')).toBe('education');
    expect(routeIntent('what if i miss a payment?')).toBe('education');
    expect(routeIntent('do you have a referral program?')).toBe('education');
    expect(routeIntent('is this available in hausa?')).toBe('education');
  });

  it('routes anything else to unknown', () => {
    expect(routeIntent('good morning')).toBe('unknown');
    expect(routeIntent('')).toBe('unknown');
  });
});
