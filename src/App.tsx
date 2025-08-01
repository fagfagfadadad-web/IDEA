import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Home } from './Home';
import { Gigs } from './Gigs'; // Predpokladám, že máš komponent Gigs

function App() {
  const location = useLocation();

  useEffect(() => {
    console.log('Current path:', location.pathname);
    console.log('Navigator userAgent:', navigator.userAgent);
  }, [location]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gigs" element={<Gigs />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default () => (
  <Router>
    <App />
  </Router>
);