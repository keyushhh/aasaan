import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import s from './Sheet.module.css';

interface SheetApi {
  /** Open a sheet (replacing any open one). */
  open: (content: ReactNode) => void;
  /** Swap the content of the open sheet without re-opening it. */
  set: (content: ReactNode) => void;
  close: () => void;
}
const Ctx = createContext<SheetApi | null>(null);
export const useSheet = () => useContext(Ctx)!;

/** Bottom sheet on a native modal <dialog>: focus stays inside, Escape closes, focus returns on close. */
export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<{ key: number; content: ReactNode } | null>(null);
  const open = useCallback((content: ReactNode) => setSheet((p) => ({ key: (p?.key ?? 0) + 1, content })), []);
  const set = useCallback((content: ReactNode) => setSheet((p) => (p ? { ...p, content } : p)), []);
  const close = useCallback(() => setSheet(null), []);

  const { pathname } = useLocation();
  useEffect(close, [pathname, close]); // any navigation closes the sheet

  return (
    <Ctx.Provider value={{ open, set, close }}>
      {children}
      {sheet && <Dialog key={sheet.key} onClose={close}>{sheet.content}</Dialog>}
    </Ctx.Provider>
  );
}

function Dialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  // Layout effect: the cleanup must close the dialog while it is still in the page, so focus returns to the opener.
  useLayoutEffect(() => {
    const d = ref.current!;
    if (d.showModal) d.showModal();
    else d.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    return () => {
      if (d.open && d.close) d.close();
      document.body.style.overflow = '';
    };
  }, []);
  return (
    <dialog ref={ref} className={s.wrap} aria-modal="true"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={s.sheet} tabIndex={-1} autoFocus>
        <div className={s.core}>
          <div className={s.grab} />
          {children}
        </div>
      </div>
    </dialog>
  );
}

export function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className={s.title}>{children}</h2>;
}
