import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { Gigs } from './Gigs';

function App() {
  const logContainer = document.createElement('div');
  logContainer.style.position = 'fixed';
  logContainer.style.top = '50%';
  logContainer.style.left = '0';
  logContainer.style.background = 'white';
  logContainer.style.padding = '10px';
  logContainer.style.maxHeight = '50%';
  logContainer.style.overflow = 'auto';
  logContainer.style.zIndex = '9999';
  logContainer.style.fontSize = '14px';
  document.body.appendChild(logContainer);

  const log = (message: string) => {
    logContainer.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${message}</p>`;
  };

  log('App component mounted');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gigs" element={<Gigs />} />
        <Route path="/test" element={<div style={{ padding: 20, background: 'white' }}>Test Page Works!</div>} />
        <Route path="*" element={<div style={ { padding: 20, background: 'white' }}>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;