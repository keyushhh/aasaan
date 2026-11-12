import { createRoot } from 'react-dom/client';
import './tokens/global.css';
import { App } from './app/App';

createRoot(document.getElementById('app')!).render(<App />);
