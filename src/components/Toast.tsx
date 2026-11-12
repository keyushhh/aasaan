import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import s from './Toast.module.css';

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

/** One toast at a time, 3 seconds. The live region stays in the page so screen readers announce every message. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; n: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((text: string) => {
    setMsg((p) => ({ text, n: (p?.n ?? 0) + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 3000);
  }, []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div role="status">{msg && <div key={msg.n} className={s.toast}>{msg.text}</div>}</div>
    </Ctx.Provider>
  );
}
