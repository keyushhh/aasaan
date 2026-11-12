import { describe, expect, it, vi } from 'vitest';
import { freshData } from '../test-utils';

describe('outage queueing', () => {
  it('saves a claim on the phone while EPFO is down and sends it when EPFO is back', async () => {
    const d = await freshData();
    await d.setDown('epf', true);

    const out = await d.api.epf.submitClaim({ reason: 'Housing', amount: 50000 });
    expect(out.queued).toBe(true);
    expect(out.request.status).toBe('queued');
    expect(out.request.ref).toBe('Reference number arrives once submitted');
    expect(d.outbox()).toHaveLength(1);

    const listed = await d.api.requests();
    expect(listed[0]).toMatchObject({ status: 'queued', title: 'PF withdrawal for housing' });

    const recovered = vi.fn();
    d.onRecovered(recovered);
    const sent = await d.setDown('epf', false);

    expect(sent).toBe(1);
    expect(recovered).toHaveBeenCalledWith({ dept: 'epf', sent: 1 });
    expect(d.outbox()).toHaveLength(0);
    const after = (await d.api.requests())[0];
    expect(after.status).toBe('active');
    expect(after.ref).toMatch(/^EPF\/KA\/26\/\d{6}$/);
    expect(after.steps.map((s) => [s.label, s.state])).toEqual([
      ['Saved on your phone', 'done'],
      ['Submitted to EPFO', 'done'],
      ['Verified by employer', 'current'],
      ['EPFO review', 'todo'],
      ['Paid to HDFC Bank ••4417', 'todo'],
    ]);
  });

  it('keeps the outbox across a reload', async () => {
    const d = await freshData();
    await d.setDown('epf', true);
    await d.api.epf.submitClaim({ reason: 'Education', amount: 2000 });
    const stored = localStorage.getItem('aasaan-outbox-v1');
    expect(JSON.parse(stored!)).toHaveLength(1);
  });

  it('submits straight away when EPFO is up', async () => {
    const d = await freshData();
    const out = await d.api.epf.submitClaim({ reason: 'Marriage', amount: 5000 });
    expect(out.queued).toBe(false);
    expect(out.request.steps[0]).toMatchObject({ label: 'Submitted to EPFO', state: 'done' });
    expect(d.outbox()).toHaveLength(0);
  });

  it('serves the last synced copy when a department is down', async () => {
    const d = await freshData();
    const fresh = await d.api.epf.summary();
    await d.setDown('epf', true);
    await expect(d.api.epf.summary()).resolves.toEqual(fresh);
    await expect(d.api.refresh('epf')).rejects.toBeInstanceOf(d.DepartmentUnavailable);
  });
});

describe('challan payment', () => {
  it('pays an unpaid challan, closes it and records the payment', async () => {
    const d = await freshData();
    const receipt = await d.api.vehicle.pay('c1', 'UPI ID');
    expect(receipt).toMatchObject({ amount: 500, challanNo: 'KA03926100811' });
    expect(receipt.utr).toMatch(/^\d{12}$/);
    expect((await d.api.vehicle.challans()).find((c) => c.id === 'c1')).toMatchObject({ paid: true, paidOn: receipt.paidOn });
    expect((await d.api.requests())[0]).toMatchObject({ title: 'Challan paid for parking in a no-parking zone', ref: 'UTR ' + receipt.utr, status: 'done' });
  });

  it('refuses while Parivahan is down and charges nothing', async () => {
    const d = await freshData();
    await d.setDown('vehicle', true);
    await expect(d.api.vehicle.pay('c1', 'UPI ID')).rejects.toBeInstanceOf(d.DepartmentUnavailable);
    await d.setDown('vehicle', false);
    expect((await d.api.vehicle.challans()).find((c) => c.id === 'c1')!.paid).toBe(false);
  });
});

describe('share codes', () => {
  it('creates a code that expires after the chosen time, then revokes it', async () => {
    const d = await freshData();
    const before = Date.now();
    const share = await d.api.docs.createShare('aadhaar', 1);
    expect(share.code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(share.exp - before).toBeGreaterThanOrEqual(3600000);
    expect(share.exp - before).toBeLessThan(3600000 + 1000);
    expect(await d.api.docs.shares()).toEqual([share]);

    await d.api.docs.revokeShare(share.id);
    expect(await d.api.docs.shares()).toEqual([]);
  });

  it('cannot issue a verified code while DigiLocker is down', async () => {
    const d = await freshData();
    await d.setDown('docs', true);
    await expect(d.api.docs.createShare('pan', 24)).rejects.toBeInstanceOf(d.DepartmentUnavailable);
  });
});

describe('records requests', () => {
  it('allows a request', async () => {
    const d = await freshData();
    expect((await d.api.health.respond('k1', 'allowed')).status).toBe('allowed');
    expect((await d.api.health.consents())[0].status).toBe('allowed');
  });
  it('denies a request', async () => {
    const d = await freshData();
    expect((await d.api.health.respond('k1', 'denied')).status).toBe('denied');
  });
  it('cannot send a choice while ABDM is down, and the request stays pending', async () => {
    const d = await freshData();
    await d.setDown('health', true);
    await expect(d.api.health.respond('k1', 'allowed')).rejects.toBeInstanceOf(d.DepartmentUnavailable);
    await d.setDown('health', false);
    expect((await d.api.health.consents())[0].status).toBe('pending');
  });
});
