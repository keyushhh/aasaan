import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { PinPad } from './PinPad';

function Harness({ spy, start = '' }: { spy: (v: string) => void; start?: string }) {
  const [v, setV] = useState(start);
  return <PinPad value={v} onChange={(n) => { spy(n); setV(n); }} label="App PIN" deleteLabel="Delete digit" />;
}
const boxes = () => Array.from(screen.getByRole('img', { name: 'App PIN' }).children);
const filled = () => boxes().filter((b) => b.hasAttribute('data-on')).length;

describe('PinPad', () => {
  it('renders four boxes and a keypad', () => {
    render(<Harness spy={vi.fn()} />);
    expect(boxes()).toHaveLength(4);
    for (const d of '0123456789') expect(screen.getByRole('button', { name: d })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Delete digit' })).toBeTruthy();
  });

  it('appends digits up to four and deletes the last', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    for (const d of '12345') fireEvent.click(screen.getByRole('button', { name: d }));
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['1', '12', '123', '1234']);
    expect(filled()).toBe(4);
    fireEvent.click(screen.getByRole('button', { name: 'Delete digit' }));
    expect(spy).toHaveBeenLastCalledWith('123');
    expect(filled()).toBe(3);
  });

  it('takes physical keys, even several before a re-render', () => {
    const spy = vi.fn();
    render(<Harness spy={spy} />);
    act(() => {
      for (const key of ['9', '0', 'a', '7', 'Backspace', '5', '3', '1']) window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });
    expect(spy.mock.calls.map((c) => c[0])).toEqual(['9', '90', '907', '90', '905', '9053']);
    expect(filled()).toBe(4);
  });
});
