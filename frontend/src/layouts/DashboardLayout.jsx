import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <div className="ml-48 flex flex-col min-h-screen"> {/* Add ml-48 */}
        <Header />
        <main className="p-6 bg-gray-100 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
