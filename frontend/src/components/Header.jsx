import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear token
    navigate('/signin'); // Redirect to login
  };

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center">
  <div className="flex-1 text-center">
    <h1 className="text-xl font-bold">Standardized Embedded System For Securing Personal Private CellPhones Showcase</h1>
  </div>
  <button
    onClick={handleLogout}
    className="text-red-500 border border-red-500 px-4 py-1 rounded hover:bg-red-100"
  >
    Logout
  </button>
</header>

  );
}
