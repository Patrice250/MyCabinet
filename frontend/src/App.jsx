import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Home from './pages/Home';
import Fingerprint from './pages/Fingerprint';
import Track from './pages/Track';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Documentation from './pages/Documentation';
import 'leaflet/dist/leaflet.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Home />} />
        <Route path="fingerprint" element={<Fingerprint />} />
        <Route path="track" element={<Track />} />
        <Route path="history" element={<History />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="documentation" element={<Documentation />} />
      </Route>
    </Routes>
  );
}
