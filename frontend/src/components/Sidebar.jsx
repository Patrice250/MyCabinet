// Sidebar.js
import { Link } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-48 bg-white shadow-md h-full fixed top-0 left-0 p-4">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <ul className="space-y-4">
       <li>
  <NavLink
    to="/"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    Home
  </NavLink>
</li>
<li></li>
<li>
  <NavLink
    to="/fingerprint"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    Fingerprint
  </NavLink>
</li>
<li>
  <NavLink
    to="/history"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    History
  </NavLink>
</li>
<li>
  <NavLink
    to="/track"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    Truck
  </NavLink>
</li>
<li>
  <NavLink
    to="/notifications"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    Notifications
  </NavLink>
</li>
<li>
  <NavLink
    to="/documentation"
    className={({ isActive }) =>
      `px-2 py-1 rounded hover:bg-blue-500 hover:text-black-800 ${
        isActive ? 'bg-blue-500 text-white -800' : ''
      }`
    }
  >
    My CellPhones
  </NavLink>
</li>
      </ul>
    </div>
  );
}