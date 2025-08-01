import React, { useEffect } from 'react';

export const Home = () => {
  const logContainer = document.createElement('div');
  logContainer.style.position = 'fixed';
  logContainer.style.top = '75%';
  logContainer.style.left = '0';
  logContainer.style.background = 'white';
  logContainer.style.padding = '10px';
  logContainer.style.maxHeight = '25%';
  logContainer.style.overflow = 'auto';
  logContainer.style.zIndex = '9999';
  logContainer.style.fontSize = '14px';
  document.body.appendChild(logContainer);

  const log = (message: string) => {
    logContainer.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${message}</p>`;
  };

  useEffect(() => {
    log('Home component mounted');
  }, []);

  return (
    <div style={{ padding: 20, background: 'white' }}>
      <h1>Home Page Works!</h1>
      <p>This is a test to confirm Home page rendering.</p>
    </div>
  );
};