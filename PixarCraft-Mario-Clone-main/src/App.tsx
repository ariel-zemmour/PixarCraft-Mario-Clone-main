import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';

import { AccountPage } from './pages/Account';
import Play from './pages/Play';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />

          <Route path="account" element={<AccountPage />} />
          <Route path="play" element={<Play />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
