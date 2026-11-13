import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { freshData } from '../test-utils';

/** Renders the whole app, signed in, on a route. */
async function openApp(route: string) {
  const data = await freshData();
  localStorage.setItem('aasaan-session-v1', JSON.stringify({ loggedIn: true, lang: 'en', mobile: '9876543210', name: 'Ananya Rao' }));
  const { App } = await import('./App');
  window.location.hash = '#/' + route;
  render(<App />);
  return { data, user: userEvent.setup({ delay: null }) };
}
const sheet = () => screen.getByRole('dialog');

describe('EPF claim', () => {
  it('shows each validation message and submits a valid claim', async () => {
    const { user } = await openApp('epf');
    await user.click(await screen.findByRole('button', { name: 'Withdraw from PF' }));
    const submit = within(sheet()).getByRole('button', { name: 'Submit claim' });
    const amount = within(sheet()).getByPlaceholderText('For example, 50000');

    await user.click(submit);
    expect(within(sheet()).getByRole('alert')).toHaveTextContent('Enter the amount you want to withdraw.');
    await user.type(amount, '500');
    await user.click(submit);
    expect(within(sheet()).getByRole('alert')).toHaveTextContent('The minimum withdrawal is ₹1,000.');
    await user.clear(amount);
    await user.type(amount, '999999');
    await user.click(submit);
    expect(within(sheet()).getByRole('alert')).toHaveTextContent('You can withdraw up to ₹1,71,090. Lower the amount to continue.');

    await user.clear(amount);
    await user.type(amount, '20000{Enter}');
    expect(await screen.findByText('Claim submitted. Track it in Requests.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('queues during an outage and sends on recovery', async () => {
    const { data, user } = await openApp('epf');
    await data.setDown('epf', true);
    await user.click(await screen.findByRole('button', { name: 'Withdraw from PF' }));
    expect(within(sheet()).getByText('EPFO is down right now')).toBeInTheDocument();
    await user.type(within(sheet()).getByPlaceholderText('For example, 50000'), '20000');
    await user.click(within(sheet()).getByRole('button', { name: 'Save and submit later' }));
    expect(await screen.findByText('Claim saved. It’ll be submitted when EPFO is back.')).toBeInTheDocument();
    expect(await screen.findByText('Queued')).toBeInTheDocument();

    await data.setDown('epf', false);
    expect(await screen.findByText('EPFO is back. 1 queued request was submitted.')).toBeInTheDocument();
    expect(screen.queryByText('Queued')).not.toBeInTheDocument();
  });
});

describe('challan payment', () => {
  it('pays and shows the receipt', async () => {
    const { user } = await openApp('vehicle');
    await user.click(await screen.findByRole('button', { name: 'Pay ₹500' }));
    await user.click(within(sheet()).getByRole('button', { name: 'Pay ₹500' }));
    expect(await within(sheet()).findByRole('heading', { name: 'Challan paid' })).toBeInTheDocument();
    expect(within(sheet()).getByText('₹500 paid for challan KA03926100811')).toBeInTheDocument();
    await user.click(within(sheet()).getByRole('button', { name: 'Done' }));
    expect(screen.getAllByText('Paid')).toHaveLength(2);
  });

  it('pauses payment while Parivahan is down', async () => {
    const { data, user } = await openApp('vehicle');
    await data.setDown('vehicle', true);
    await user.click(await screen.findByRole('button', { name: 'Pay ₹500' }));
    expect(within(sheet()).getByText('Payments are paused')).toBeInTheDocument();
    expect(within(sheet()).getByRole('button', { name: 'Pay ₹500' })).toBeDisabled();
  });
});

describe('share codes', () => {
  it('creates a code and revokes it', async () => {
    const { user } = await openApp('docs');
    await user.click(await screen.findByRole('button', { name: /Aadhaar/ }));
    await user.click(within(sheet()).getByRole('button', { name: 'Share' }));
    await user.click(within(sheet()).getByRole('button', { name: '7 days' }));
    await user.click(within(sheet()).getByRole('button', { name: 'Create share code' }));
    expect(await within(sheet()).findByRole('heading', { name: 'Share code ready' })).toBeInTheDocument();
    const code = within(sheet()).getByLabelText(/^Share code/).textContent!;
    await user.click(within(sheet()).getByRole('button', { name: 'Done' }));

    expect(screen.getByText(`Aadhaar, code ${code}`)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(await screen.findByText('Code revoked. It no longer works.')).toBeInTheDocument();
    expect(screen.queryByText(`Aadhaar, code ${code}`)).not.toBeInTheDocument();
  });
});

describe('records requests', () => {
  it('allows a request', async () => {
    const { user } = await openApp('health');
    await user.click(await screen.findByRole('button', { name: 'Allow for 7 days' }));
    expect(await screen.findByText('Access allowed for 7 days')).toBeInTheDocument();
    expect(screen.getByText('Allowed')).toBeInTheDocument();
  });
  it('denies a request', async () => {
    const { user } = await openApp('health');
    await user.click(await screen.findByRole('button', { name: 'Deny' }));
    expect(await screen.findByText('Request denied. Nothing was shared.')).toBeInTheDocument();
    expect(screen.getByText('Denied')).toBeInTheDocument();
  });
});

describe('appearance', () => {
  it('switches between light, dark and the device setting, and remembers the choice', async () => {
    const { user } = await openApp('profile');
    const root = document.documentElement;
    const choose = async (name: string) => {
      await user.click(await screen.findByRole('button', { name: /^Appearance:/ }));
      await user.click(screen.getByRole('menuitemradio', { name }));
    };
    await choose('Light');
    expect(root.dataset.theme).toBe('light');
    expect(screen.getByRole('button', { name: 'Appearance: Light' })).toHaveAttribute('aria-expanded', 'false');
    await choose('Dark');
    expect(root.dataset.theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('aasaan-session-v1')!).theme).toBe('dark');
    await choose('System');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });
});
