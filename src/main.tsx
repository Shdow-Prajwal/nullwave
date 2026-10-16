import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { relationalDbService } from './services/vectorDb/relationalDbService';
import { userDbService } from './services/vectorDb/userDbService';

// Expose database services to window for easy developer inspection in DevTools
if (typeof window !== 'undefined') {
  (window as any).db = relationalDbService;
  (window as any).userDb = userDbService;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

