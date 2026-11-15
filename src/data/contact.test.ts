import { describe, expect, it } from 'vitest';
import { freshData } from '../test-utils';

describe('contact updates', () => {
  it('sends straight away when the department is up', async () => {
    const d = await freshData();
    const before = (await d.api.requests()).length;
    await expect(d.api.profile.updateContact('mobile', 'aadhaar', '9123456789')).resolves.toEqual({ target: 'aadhaar', queued: false });
    expect(d.outbox()).toHaveLength(0);
    const list = await d.api.requests();
    expect(list).toHaveLength(before + 1);
    expect(list[0]).toMatchObject({ svc: 'docs', title: 'Mobile number update, UIDAI' });
    expect(list[0].status).not.toBe('queued');
  });

  it('queues on the phone while the department is down, then sends when it is back', async () => {
    const d = await freshData();
    await d.setDown('docs', true);
    await expect(d.api.profile.updateContact('email', 'aadhaar', 'ananya@example.com')).resolves.toEqual({ target: 'aadhaar', queued: true });
    expect(d.outbox()).toHaveLength(1);
    expect((await d.api.requests())[0]).toMatchObject({ svc: 'docs', title: 'Email update', status: 'queued', ref: 'New email a••••@example.com' });

    expect(await d.setDown('docs', false)).toBe(1);
    expect(d.outbox()).toHaveLength(0);
    const after = (await d.api.requests())[0];
    expect(after).toMatchObject({ svc: 'docs', title: 'Email update, UIDAI' });
    expect(after.status).not.toBe('queued');
  });
});
