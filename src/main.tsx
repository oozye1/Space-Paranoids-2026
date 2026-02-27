import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Starting Space Paranoids...');

try {
  const root = createRoot(document.getElementById('root')!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('React root rendered.');
} catch (e) {
  console.error('Failed to render React root:', e);
}
