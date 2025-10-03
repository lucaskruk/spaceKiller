if (typeof window !== 'undefined') {
  const isTouchPrimary = window.matchMedia?.('(pointer: coarse)').matches;
  if (isTouchPrimary && !window.__spaceKillerPreventDoubleTap) {
    window.__spaceKillerPreventDoubleTap = true;
    let lastTouchTime = 0;
    const preventDoubleTapZoom = (event) => {
      const now = Date.now();
      if (now - lastTouchTime <= 300) {
        event.preventDefault();
      }
      lastTouchTime = now;
    };
    window.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
