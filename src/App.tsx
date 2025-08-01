import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './Home';
import { Gigs } from './Gigs';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gigs" element={<Gigs />} />
        <Route path="/test" element={<div style={{ padding: 20, background: 'white' }}>Test Page Works!</div>} />
        <Route path="*" element={<div style={{ padding: 20, background: 'white' }}>Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;